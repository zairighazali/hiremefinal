import { useState } from "react";
import { Modal, Button, Form, Alert, Spinner } from "react-bootstrap";
import { authFetch } from "../services/api";
import { useNavigate } from "react-router-dom";

export default function HireFreelancerModal({ 
  show, 
  onHide, 
  freelancer,
  jobTitle 
}) {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleHire = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Create the hire
      const res = await authFetch("/api/hires", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          freelancer_id: freelancer.id,
          job_title: jobTitle,
          amount: parseFloat(amount),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to create hire");
      }

      const hire = await res.json();

      // Check if freelancer is onboarded
      if (!freelancer.stripe_onboarded) {
        alert(
          `Hire created! However, ${freelancer.name} needs to complete their payment setup before you can pay them. They'll be notified.`
        );
        onHide();
        navigate("/profile");
        return;
      }

      // Redirect to payment
      navigate(`/payment?hireId=${hire.id || hire.hire_id}`);
    } catch (err) {
      console.error("Hire error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Hire {freelancer?.name}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {!freelancer?.stripe_onboarded && (
          <Alert variant="warning">
            <strong>Note:</strong> This freelancer hasn't completed their payment
            setup yet. You can create the hire, but payment will need to wait until
            they complete onboarding.
          </Alert>
        )}

        {error && <Alert variant="danger">{error}</Alert>}

        <Form onSubmit={handleHire}>
          <Form.Group className="mb-3">
            <Form.Label>Job/Project Title</Form.Label>
            <Form.Control type="text" value={jobTitle} disabled />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Amount (RM)</Form.Label>
            <Form.Control
              type="number"
              step="0.01"
              min="1"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
            <Form.Text className="text-muted">
              Payment will be held in escrow until work is completed
            </Form.Text>
          </Form.Group>

          <div className="d-grid gap-2">
            <Button
              type="submit"
              variant="primary"
              disabled={loading || !amount}
            >
              {loading ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Creating hire...
                </>
              ) : (
                "Create Hire & Proceed to Payment"
              )}
            </Button>
            <Button variant="outline-secondary" onClick={onHide}>
              Cancel
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
}