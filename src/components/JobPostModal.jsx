import { useState } from "react";
import { Modal, Button, Form, Alert } from "react-bootstrap";
import { authFetch } from "../services/api";

// List of Malaysian states and territories
const MALAYSIAN_LOCATIONS = [
  "Johor",
  "Kedah",
  "Kelantan",
  "Malacca",
  "Melaka",
  "Negeri Sembilan",
  "Pahang",
  "Penang",
  "Pulau Pinang",
  "Perak",
  "Perlis",
  "Sabah",
  "Sarawak",
  "Selangor",
  "Terengganu",
  "Kuala Lumpur",
  "Labuan",
  "Putrajaya",
];

export default function JobPostModal({ show, onHide, onPosted }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    is_remote: false,
    location: "",
    payment: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // ✅ Validate remote or location
    if (!form.is_remote && !form.location.trim()) {
      setLoading(false);
      setError("Please specify a location or select remote work");
      return;
    }

    // ✅ Validate Malaysia location only
    if (!form.is_remote && form.location.trim()) {
      const isValidLocation = MALAYSIAN_LOCATIONS.some(
        (loc) => loc.toLowerCase() === form.location.trim().toLowerCase()
      );

      if (!isValidLocation) {
        setLoading(false);
        setError(
          `Location must be in Malaysia. Valid locations include: ${MALAYSIAN_LOCATIONS.slice(0, 5).join(", ")}, etc.`
        );
        return;
      }
    }

    // ✅ Payment validation - MANDATORY
    if (!form.payment || form.payment.trim() === "") {
      setLoading(false);
      setError("Payment amount is required");
      return;
    }

    const paymentValue = Number(form.payment);
    if (isNaN(paymentValue) || paymentValue <= 0) {
      setLoading(false);
      setError("Payment must be a number greater than 0");
      return;
    }

    try {
      const response = await authFetch("/api/jobs", {
        method: "POST",
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          is_remote: form.is_remote,
          location: form.is_remote ? null : form.location || null,
          payment: form.payment ? Number(form.payment) : null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to post job");
      }

      const newJob = await response.json();
      onPosted?.(newJob);

      setForm({
        title: "",
        description: "",
        is_remote: false,
        location: "",
        payment: "",
      });

      onHide();
      
      // ✅ Auto-refresh page after posting
      window.location.reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Post a New Job</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Alert variant="info" className="mb-3">
          <small>📍 Currently available for Malaysian locations only</small>
        </Alert>

        {error && (
          <Alert variant="danger" dismissible onClose={() => setError("")}>
            {error}
          </Alert>
        )}

        <Form onSubmit={handleSubmit}>
          {/* ===== Job Title ===== */}
          <Form.Group className="mb-3">
            <Form.Label>Job Title</Form.Label>
            <Form.Control
              type="text"
              placeholder="e.g. Web Developer Needed"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </Form.Group>

          {/* ===== Description ===== */}
          <Form.Group className="mb-3">
            <Form.Label>Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              placeholder="Describe the job requirements..."
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              required
            />
          </Form.Group>

          {/* ===== Remote Checkbox ===== */}
          <Form.Group className="mb-3">
            <Form.Check
              type="checkbox"
              label="Remote work"
              checked={form.is_remote}
              onChange={(e) =>
                setForm({ ...form, is_remote: e.target.checked, location: "" })
              }
            />
          </Form.Group>

          {/* ===== Location ===== */}
          {!form.is_remote && (
            <Form.Group className="mb-3">
              <Form.Label>
                Location <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g. Kuala Lumpur, Selangor, Penang"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                required={!form.is_remote}
              />
              <Form.Text className="text-muted">
                Enter a Malaysian state or territory (e.g., Selangor, Penang, Johor)
              </Form.Text>
            </Form.Group>
          )}

          {/* ===== Payment ===== */}
          <Form.Group className="mb-3">
            <Form.Label>
              Payment (RM) <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              type="number"
              placeholder="e.g. 500"
              value={form.payment}
              min="1"
              step="0.01"
              onChange={(e) => setForm({ ...form, payment: e.target.value })}
              required
            />
            <Form.Text className="text-muted">
              Enter the payment amount in Malaysian Ringgit (RM)
            </Form.Text>
          </Form.Group>

          {/* ===== Buttons ===== */}
          <div className="d-flex gap-2">
            <Button variant="secondary" onClick={onHide} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? "Posting..." : "Post Job"}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
}