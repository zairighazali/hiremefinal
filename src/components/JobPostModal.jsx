import { useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { authFetch } from "../services/api";

export default function JobPostModal({ show, onHide, onPosted }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    is_remote: false,
    location: "",
    payment: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // POST ke backend
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
        // Tangkap error backend
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to post job");
      }

      const newJob = await response.json();
      onPosted?.(newJob);

      // Reset form
      setForm({
        title: "",
        description: "",
        is_remote: false,
        location: "",
        payment: "",
      });

      onHide();
    } catch (error) {
      alert(error.message);
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
                setForm({ ...form, is_remote: e.target.checked })
              }
            />
          </Form.Group>

          {/* ===== Location ===== */}
          {!form.is_remote && (
            <Form.Group className="mb-3">
              <Form.Label>Location</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g. Kuala Lumpur"
                value={form.location}
                onChange={(e) =>
                  setForm({ ...form, location: e.target.value })
                }
              />
            </Form.Group>
          )}

          {/* ===== Payment ===== */}
          <Form.Group className="mb-3">
            <Form.Label>Payment (RM)</Form.Label>
            <Form.Control
              type="number"
              placeholder="e.g. 500"
              value={form.payment}
              onChange={(e) =>
                setForm({ ...form, payment: e.target.value })
              }
            />
          </Form.Group>

          {/* ===== Buttons ===== */}
          <div className="d-flex gap-2">
            <Button variant="secondary" onClick={onHide}>
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
