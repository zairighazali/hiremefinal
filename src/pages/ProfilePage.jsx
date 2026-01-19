import {
  Container,
  Row,
  Col,
  Button,
  Card,
  Modal,
  Form,
  Spinner,
  Badge,
} from "react-bootstrap";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../hooks/useAuth";
import { uploadFile } from "../utils/storage";
import { authFetch } from "../services/api";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";

export default function ProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [showEdit, setShowEdit] = useState(false);
  const [profile, setProfile] = useState({});
  const [myHires, setMyHires] = useState([]);
  const [myWork, setMyWork] = useState([]);
  const [imagePreview, setImagePreview] = useState("");
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch profile
  const fetchProfile = useCallback(async () => {
    if (!user?.uid) return;

    try {
      const res = await authFetch("/api/users/me");

      if (!res.ok) throw new Error("Failed to fetch profile");

      const data = await res.json();

      setProfile({
        ...data,
        skills:
          typeof data.skills === "string"
            ? data.skills
            : Array.isArray(data.skills)
            ? data.skills.join(", ")
            : "",
      });

      setImagePreview(data.image_url || "");
    } catch (err) {
      console.error("Failed to fetch profile:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch hires (jobs I've hired for)
  const fetchMyHires = useCallback(async () => {
    try {
      const res = await authFetch("/api/hires/my/jobs");

      if (!res.ok) throw new Error("Failed to fetch hires");

      const data = await res.json();
      setMyHires(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch my hires:", err);
      setMyHires([]);
    }
  }, []);

  // Fetch work (jobs offered to me)
  const fetchMyWork = useCallback(async () => {
    try {
      const res = await authFetch("/api/hires/my/work");

      if (!res.ok) throw new Error("Failed to fetch work");

      const data = await res.json();
      setMyWork(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch my work:", err);
      setMyWork([]);
    }
  }, []);

  useEffect(() => {
    if (user?.uid) {
      fetchProfile();
      fetchMyHires();
      fetchMyWork();
    }
  }, [user, fetchProfile, fetchMyHires, fetchMyWork]);

  // Image upload
  const handleImageUpload = async (file) => {
    if (!file || !user?.uid) {
      alert("No file selected or user not logged in");
      return;
    }

    setUploading(true);

    try {
      const url = await uploadFile(file, `profilePhotos/${user.uid}`);
      setProfile((prev) => ({ ...prev, image_url: url }));
      setImagePreview(url);
    } catch (err) {
      console.error("Upload failed", err);
      alert("Image upload failed: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  // Save profile
  const handleSaveProfile = async () => {
    if (!user?.uid) return;

    setUploading(true);

    try {
      const res = await authFetch("/api/users/me", {
        method: "PUT",
        body: JSON.stringify({
          name: profile.name || "Unnamed User",
          skills: profile.skills || "",
          bio: profile.bio || "",
          image_url: profile.image_url || null,
        }),
      });

      if (!res.ok) throw new Error("Failed to save profile");

      const updated = await res.json();
      setProfile({
        ...updated,
        skills:
          typeof updated.skills === "string"
            ? updated.skills
            : Array.isArray(updated.skills)
            ? updated.skills.join(", ")
            : "",
      });

      setShowEdit(false);
      alert("Profile updated successfully!");
    } catch (err) {
      console.error("Failed to save profile:", err);
      alert("Failed to save profile: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  // Handle payment
  const handlePay = (hireId) => {
    navigate(`/payment?hireId=${hireId}`);
  };

  if (loading) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <Spinner animation="border" />
          <p className="mt-2">Loading profile...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="pt-5 mt-4">
      <Row className="g-4">
        {/* LEFT - Profile Card */}
        <Col md={5}>
          <Card className="shadow-sm">
            <Card.Body className="text-center p-4">
              <img
                src={imagePreview || "https://via.placeholder.com/150"}
                alt="Profile"
                width={150}
                height={150}
                className="rounded-circle mb-3"
                style={{ objectFit: "cover" }}
              />

              <h4 className="mb-1">
                {profile.name || user?.displayName || "User"}
              </h4>

              {profile.email && (
                <p className="text-muted small mb-2">{profile.email}</p>
              )}

              {profile.skills && (
                <div className="mb-3">
                  {profile.skills
                    .split(",")
                    .slice(0, 3)
                    .map((skill, idx) => (
                      <Badge key={idx} bg="primary" className="me-1 mb-1">
                        {skill.trim()}
                      </Badge>
                    ))}
                </div>
              )}

              {profile.bio && (
                <p className="text-muted small mb-3">{profile.bio}</p>
              )}

              <Button
                variant="outline-primary"
                onClick={() => setShowEdit(true)}
                className="w-100"
              >
                Edit Profile
              </Button>
              <Button
                as={Link}
                to="/settings/payment"
                variant="outline-primary"
                className="w-100 mt-2"
              >
                Payment Settings
              </Button>
            </Card.Body>
          </Card>
        </Col>

        {/* RIGHT - Hires & Work */}
        <Col md={7}>
          {/* People I Hired */}
          <Card className="shadow-sm mb-4">
            <Card.Header className="bg-primary text-white">
              <h5 className="mb-0">People I Hired</h5>
            </Card.Header>
            <Card.Body>
              {myHires.length === 0 ? (
                <p className="text-muted mb-0">You haven't hired anyone yet</p>
              ) : (
                <div className="d-flex flex-column gap-2">
                  {myHires.map((hire) => (
                    <Card key={hire.hire_id} className="border">
                      <Card.Body className="py-2">
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <strong>{hire.job_title}</strong>
                            <div className="small text-muted">
                              Freelancer: {hire.freelancer_name}
                            </div>
                            <div className="small">
                              Amount: RM{hire.amount || 0}
                            </div>
                          </div>
                          <div>
                            <Badge
                              bg={hire.paid ? "success" : "warning"}
                              className="mb-1"
                            >
                              {hire.paid ? "Paid" : "Pending"}
                            </Badge>
                            {!hire.paid && hire.amount > 0 && (
                              <div>
                                <Button
                                  size="sm"
                                  variant="outline-primary"
                                  onClick={() => handlePay(hire.hire_id)}
                                >
                                  Pay Now
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>

          {/* Jobs Offered To Me */}
          <Card className="shadow-sm">
            <Card.Header className="bg-success text-white">
              <h5 className="mb-0">Jobs Offered To Me</h5>
            </Card.Header>
            <Card.Body>
              {myWork.length === 0 ? (
                <p className="text-muted mb-0">No jobs offered yet</p>
              ) : (
                <div className="d-flex flex-column gap-2">
                  {myWork.map((hire) => (
                    <Card key={hire.hire_id} className="border">
                      <Card.Body className="py-2">
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <strong>{hire.job_title}</strong>
                            <div className="small text-muted">
                              Client: {hire.owner_name}
                            </div>
                            <div className="small">
                              Amount: RM{hire.amount || 0}
                            </div>
                          </div>
                          <Badge bg={hire.paid ? "success" : "warning"}>
                            {hire.paid ? "Paid" : "Pending Payment"}
                          </Badge>
                        </div>
                      </Card.Body>
                    </Card>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* EDIT MODAL */}
      <Modal show={showEdit} onHide={() => setShowEdit(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Edit Profile</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Form>
            <div className="text-center mb-3">
              <img
                src={imagePreview || "https://via.placeholder.com/100"}
                alt="Preview"
                width={100}
                height={100}
                className="rounded-circle mb-2"
                style={{ objectFit: "cover" }}
              />
              <Form.Control
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e.target.files[0])}
                disabled={uploading}
              />
            </div>

            <Form.Group className="mb-3">
              <Form.Label>Name</Form.Label>
              <Form.Control
                placeholder="Your name"
                value={profile.name || ""}
                onChange={(e) =>
                  setProfile({ ...profile, name: e.target.value })
                }
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Skills (comma-separated)</Form.Label>
              <Form.Control
                placeholder="e.g. React, Node.js, UI/UX"
                value={profile.skills || ""}
                onChange={(e) =>
                  setProfile({ ...profile, skills: e.target.value })
                }
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Bio</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                placeholder="Tell us about yourself"
                value={profile.bio || ""}
                onChange={(e) =>
                  setProfile({ ...profile, bio: e.target.value })
                }
              />
            </Form.Group>
          </Form>
        </Modal.Body>

        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowEdit(false)}
            disabled={uploading}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSaveProfile}
            disabled={uploading}
          >
            {uploading ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  className="me-2"
                />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}
