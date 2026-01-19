import { useState } from "react";
import { getAuth } from "firebase/auth";
import { Card, Button, Badge, Modal, Form, Spinner } from "react-bootstrap";
import JobInterestsModal from "./JobInterestsModal";
import { authFetch } from "../services/api";

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

  // user permissions and job state
  const isOwner = currentUserUid && job.owner_uid === currentUserUid;
  const isOpen = job.status === "open";
  const hasApplied = job.has_applied === true;

  // Edit job
  const handleEdit = async () => {
    if (!confirm("Save changes to this job?")) return;

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
      onUpdated?.(updatedJob);
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
      // FIXED: Changed from /interested to /interest
      const res = await authFetch(`/api/jobs/${job.id}/interest`, {
        method: "POST",
        body: JSON.stringify({
          message: "" // Optional message
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
      }

      // Reload to refresh the job card state
      window.location.reload();
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
            <div className="alert alert-danger py-2 mb-2">{error}</div>
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

          {/* FREELANCER ACTIONS */}
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
              onChange={(e) => setIsRemote(e.target.checked)}
              className="mb-3"
            />

            {!isRemote && (
              <Form.Group className="mb-3">
                <Form.Label>Location</Form.Label>
                <Form.Control
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., Kuala Lumpur"
                />
              </Form.Group>
            )}

            <Form.Group className="mb-3">
              <Form.Label>Payment (RM)</Form.Label>
              <Form.Control
                type="number"
                value={payment}
                onChange={(e) => setPayment(e.target.value)}
                placeholder="e.g., 1000"
              />
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