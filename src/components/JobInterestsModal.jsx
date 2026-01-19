import { useState, useEffect, useCallback } from "react";
import { Modal, Button, ListGroup, Badge, Spinner, Alert } from "react-bootstrap";
import { authFetch } from "../services/api";
import { useNavigate } from "react-router-dom";

export default function JobInterestsModal({ show, onHide, jobId, onHired }) {
  const [interests, setInterests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Fetch interests
  const fetchInterests = useCallback(async () => {
    if (!jobId) return;

    setFetching(true);
    setError("");
    
    try {
      const response = await authFetch(`/api/jobs/${jobId}/interests`);
      
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || "Failed to fetch interests");
      }

      const data = await response.json();
      
      // Backend returns array directly
      setInterests(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch interests:", error);
      setError(error.message);
      setInterests([]);
    } finally {
      setFetching(false);
    }
  }, [jobId]);

  // Load when modal opens
  useEffect(() => {
    if (show) {
      fetchInterests();
    } else {
      setInterests([]);
      setError("");
    }
  }, [show, fetchInterests]);

  // Hire freelancer (without payment)
  const handleHire = async (interestId) => {
    if (!confirm("Are you sure you want to hire this freelancer?")) return;

    setLoading(true);
    setError("");
    
    try {
      const response = await authFetch("/api/hires", {
        method: "POST",
        body: JSON.stringify({
          interest_id: interestId,
          amount: 0, // No payment yet
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || "Failed to hire freelancer");
      }

      const data = await response.json();
      
      alert("Freelancer hired successfully!");
      
      // Refresh interests list
      await fetchInterests();
      
      // Notify parent component
      if (onHired) {
        onHired(data);
      }
    } catch (error) {
      console.error("Hire error:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Hire & Pay
  const handleHirePay = async (interestId) => {
    if (!confirm("Hire this freelancer and proceed to payment?")) return;

    setLoading(true);
    setError("");
    
    try {
      const response = await authFetch("/api/hires", {
        method: "POST",
        body: JSON.stringify({
          interest_id: interestId,
          amount: 1000, // Default amount, adjust as needed
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || "Failed to hire freelancer");
      }

      const data = await response.json();
      const hireId = data.hire?.id || data.hire?.hire_id;
      
      if (!hireId) {
        throw new Error("Hire ID not returned from server");
      }

      // Navigate to payment page
      navigate(`/payment?hireId=${hireId}`);
      onHide();
    } catch (error) {
      console.error("Hire & Pay error:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Interested Freelancers</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError("")}>
            {error}
          </Alert>
        )}

        {fetching ? (
          <div className="text-center py-4">
            <Spinner animation="border" />
            <p className="mt-2">Loading applicants...</p>
          </div>
        ) : interests.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-muted mb-0">
              No freelancers have shown interest yet.
            </p>
          </div>
        ) : (
          <ListGroup>
            {interests.map((interest) => (
              <ListGroup.Item
                key={interest.interest_id}
                className="d-flex justify-content-between align-items-start"
              >
                <div className="flex-grow-1">
                  {/* Freelancer Info */}
                  <div className="d-flex align-items-center gap-2 mb-2">
                    {interest.image_url && (
                      <img
                        src={interest.image_url}
                        alt={interest.name}
                        width={40}
                        height={40}
                        className="rounded-circle"
                        style={{ objectFit: "cover" }}
                      />
                    )}
                    <div>
                      <div className="fw-bold">
                        {interest.name || "Unknown Freelancer"}
                      </div>
                      {interest.email && (
                        <small className="text-muted">{interest.email}</small>
                      )}
                    </div>
                  </div>

                  {/* Skills */}
                  {interest.skills && (
                    <div className="mb-2">
                      <small className="text-muted">Skills: </small>
                      {interest.skills.split(",").slice(0, 3).map((skill, idx) => (
                        <Badge 
                          key={idx} 
                          bg="light" 
                          text="dark" 
                          className="me-1"
                        >
                          {skill.trim()}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Message */}
                  {interest.message && (
                    <div className="mt-2 p-2 bg-light rounded">
                      <small>
                        <strong>Message:</strong> {interest.message}
                      </small>
                    </div>
                  )}

                  {/* Status Badge */}
                  {interest.status && (
                    <div className="mt-2">
                      <Badge 
                        bg={
                          interest.status === "hired" 
                            ? "success" 
                            : interest.status === "rejected"
                            ? "danger"
                            : "warning"
                        }
                      >
                        {interest.status.toUpperCase()}
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="d-flex flex-column gap-2 ms-3">
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => {
                      navigate(`/freelancer/${interest.user_uid}`);
                      onHide();
                    }}
                  >
                    View Profile
                  </Button>

                  <Button
                    variant="success"
                    size="sm"
                    disabled={loading || interest.status !== "pending"}
                    onClick={() => handleHire(interest.interest_id)}
                  >
                    {interest.status === "hired" ? "Hired" : "Hire"}
                  </Button>

                  <Button
                    variant="warning"
                    size="sm"
                    disabled={loading || interest.status !== "pending"}
                    onClick={() => handleHirePay(interest.interest_id)}
                  >
                    Hire & Pay
                  </Button>
                </div>
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={loading}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
}