import { useState, useEffect } from "react";
import { getAuth } from "firebase/auth";
import { Card, Button, Badge, Modal, Form, Spinner, Alert } from "react-bootstrap";
import JobInterestsModal from "./JobInterestsModal";
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

export default function JobCard({ job, onUpdated, onDeleted }) {
  const auth = getAuth();
  const currentUserUid = auth.currentUser?.uid;

  const [showInterested, setShowInterested] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Edit form state
  const [title, setTitle] = useState(job.title);
  const [description, setDescription] = useState(job.description);
  const [isRemote, setIsRemote] = useState(job.is_remote);
  const [location, setLocation] = useState(job.location || "");
  const [payment, setPayment] = useState(job.payment || "");

  // Update form state when job prop changes
  useEffect(() => {
    setTitle(job.title);
    setDescription(job.description);
    setIsRemote(job.is_remote);
    setLocation(job.location || "");
    setPayment(job.payment || "");
  }, [job]);

  // user permissions and job state
  const isOwner = currentUserUid && job.owner_uid === currentUserUid;
  const isOpen = job.status === "open";
  const hasApplied = job.has_applied === true;

  // Edit job
  const handleEdit = async () => {
    if (!confirm("Save changes to this job?")) return;

    // ✅ Validate payment is mandatory
    if (!payment || payment.toString().trim() === "") {
      setError("Payment amount is required");
      return;
    }

    const paymentValue = Number(payment);
    if (isNaN(paymentValue) || paymentValue <= 0) {
      setError("Payment must be a number greater than 0");
      return;
    }

    // ✅ Validate remote or location
    if (!isRemote && !location.trim()) {
      setError("Please specify a location or select remote work");
      return;
    }

    // ✅ Validate Malaysia location only
    if (!isRemote && location.trim()) {
      const isValidLocation = MALAYSIAN_LOCATIONS.some(
        (loc) => loc.toLowerCase() === location.trim().toLowerCase()
      );

      if (!isValidLocation) {
        setError(
          `Location must be in Malaysia. Valid locations include: ${MALAYSIAN_LOCATIONS.slice(0, 5).join(", ")}, etc.`
        );
        return;
      }
    }

    setLoading(true);
    setError("");

    try {
      const res = await authFetch(`/api/jobs/${job.id}`, {
        method: "PUT",
        body: JSON.stringify({
          title,
          description,
          is_remote: isRemote,
          location: isRemote ? null : location || null,
          payment: payment ? Number(payment) : null,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Update failed");
      }

      const updatedJob = await res.json();
      
      // ✅ CRITICAL FIX: Preserve owner_uid and has_applied from original job
      // This ensures the component re-renders correctly after update
      const completeJob = {
        ...updatedJob,
        owner_uid: job.owner_uid, // Preserve from original
        has_applied: job.has_applied, // Preserve from original
      };
      
      onUpdated?.(completeJob);
      setShowEdit(false);
      alert("Job updated successfully!");
    } catch (err) {
      console.error("Edit job error:", err);
      setError(err.message);
      alert("Failed to update job: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Delete job
  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this job? This cannot be undone.")) return;

    setLoading(true);
    setError("");

    try {
      const res = await authFetch(`/api/jobs/${job.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Delete failed");
      }

      onDeleted?.(job.id);
      alert("Job deleted successfully!");
    } catch (err) {
      console.error("Delete job error:", err);
      setError(err.message);
      alert("Failed to delete job: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Apply to job (express interest)
  const handleInterested = async () => {
    if (!currentUserUid) {
      alert("You must be logged in to apply");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await authFetch(`/api/jobs/${job.id}/interest`, {
        method: "POST",
        body: JSON.stringify({
          message: ""
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to apply");
      }

      const data = await res.json();
      
      if (data.alreadyApplied) {
        alert("You have already applied to this job");
      } else {
        alert("Application submitted successfully!");
        // ✅ Update local state instead of full page reload
        const updatedJob = {
          ...job,
          has_applied: true,
        };
        onUpdated?.(updatedJob);
      }
    } catch (err) {
      console.error("Apply to job error:", err);
      setError(err.message);
      alert("Failed to apply: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card className="mb-3 shadow-sm">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-start mb-2">
            <div>
              <Card.Title className="mb-1">{job.title}</Card.Title>
              <Card.Subtitle className="mb-2 text-muted">
                {job.is_remote ? (
                  <Badge bg="info" className="me-2">Remote</Badge>
                ) : (
                  <Badge bg="secondary" className="me-2">
                    Onsite: {job.location || "Not specified"}
                  </Badge>
                )}
                {job.payment && (
                  <Badge bg="success">RM{job.payment}</Badge>
                )}
              </Card.Subtitle>
            </div>
            
            {!isOpen && (
              <Badge bg="secondary">{job.status.toUpperCase()}</Badge>
            )}
          </div>

          <Card.Text className="mb-3">{job.description}</Card.Text>

          {job.owner_name && (
            <Card.Text className="text-muted small">
              Posted by: {job.owner_name}
            </Card.Text>
          )}

          {error && (
            <Alert variant="danger" dismissible onClose={() => setError("")}>
              {error}
            </Alert>
          )}

          {/* OWNER ACTIONS */}
          {isOwner && (
            <div className="d-flex gap-2 flex-wrap">
              {isOpen && (
                <>
                  <Button
                    size="sm"
                    variant="warning"
                    onClick={() => setShowEdit(true)}
                    disabled={loading}
                  >
                    Edit
                  </Button>

                  <Button
                    size="sm"
                    variant="danger"
                    onClick={handleDelete}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Spinner
                          as="span"
                          animation="border"
                          size="sm"
                          className="me-1"
                        />
                        Deleting...
                      </>
                    ) : (
                      "Delete"
                    )}
                  </Button>
                </>
              )}

              <Button
                size="sm"
                variant="info"
                onClick={() => setShowInterested(true)}
              >
                View Applicants
              </Button>
            </div>
          )}

          {/* FREELANCER ACTIONS - ✅ ONLY SHOW IF NOT OWNER */}
          {!isOwner && isOpen && !hasApplied && (
            <Button
              size="sm"
              variant="success"
              onClick={handleInterested}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    className="me-1"
                  />
                  Applying...
                </>
              ) : (
                "Apply Now"
              )}
            </Button>
          )}

          {!isOwner && isOpen && hasApplied && (
            <Button size="sm" variant="secondary" disabled>
              ✓ Applied
            </Button>
          )}

          {!isOwner && !isOpen && (
            <Button size="sm" variant="secondary" disabled>
              Job Closed
            </Button>
          )}
        </Card.Body>
      </Card>

      {/* EDIT MODAL */}
      <Modal show={showEdit} onHide={() => setShowEdit(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Edit Job</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Alert variant="info" className="mb-3">
            <small>📍 Currently available for Malaysian locations only</small>
          </Alert>

          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Job Title</Form.Label>
              <Form.Control
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Web Developer Needed"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the job requirements..."
              />
            </Form.Group>

            <Form.Check
              type="checkbox"
              label="Remote Work"
              checked={isRemote}
              onChange={(e) => {
                setIsRemote(e.target.checked);
                if (e.target.checked) setLocation("");
              }}
              className="mb-3"
            />

            {!isRemote && (
              <Form.Group className="mb-3">
                <Form.Label>
                  Location <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., Kuala Lumpur, Selangor, Penang"
                  required={!isRemote}
                />
                <Form.Text className="text-muted">
                  Enter a Malaysian state or territory
                </Form.Text>
              </Form.Group>
            )}

            <Form.Group className="mb-3">
              <Form.Label>
                Payment (RM) <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                type="number"
                value={payment}
                onChange={(e) => setPayment(e.target.value)}
                placeholder="e.g., 1000"
                min="1"
                step="0.01"
                required
              />
              <Form.Text className="text-muted">
                Enter the payment amount in Malaysian Ringgit (RM)
              </Form.Text>
            </Form.Group>
          </Form>
        </Modal.Body>

        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={() => setShowEdit(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button 
            variant="success" 
            onClick={handleEdit} 
            disabled={loading}
          >
            {loading ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  className="me-1"
                />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* APPLICANTS MODAL */}
      {isOwner && (
        <JobInterestsModal
          show={showInterested}
          onHide={() => setShowInterested(false)}
          jobId={job.id}
          onHired={onUpdated}
        />
      )}
    </>
  );
}