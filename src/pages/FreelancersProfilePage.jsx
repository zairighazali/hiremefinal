import {
  Container,
  Row,
  Col,
  Button,
  Card,
  Spinner,
  Badge,
} from "react-bootstrap";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { authFetch } from "../services/api";
import defaultImage from "../assets/images/default.jpg";

export default function FreelancerProfilePage() {
  const { uid } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chatLoading, setChatLoading] = useState(false);
  const DEFAULT_IMAGE = defaultImage;

  // Fetch freelancer profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        let res;
        if (user?.uid) {
          // Logged in → use authFetch
          res = await authFetch(`/api/users/${uid}`);
        } else {
          // Guest → public endpoint
          const API_URL = import.meta.env.VITE_API_URL;
          res = await fetch(`${API_URL}/api/users/public/${uid}`);
        }

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
      } catch (err) {
        console.error("Failed to fetch freelancer profile:", err);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [uid, user]);

  // Start chat
  const handleChat = async () => {
    if (!user?.uid) {
      alert("You must be logged in to start a chat");
      navigate("/login");
      return;
    }

    if (!profile?.uid) {
      alert("Profile information not available");
      return;
    }

    if (user.uid === profile.uid) {
      alert("You cannot chat with yourself");
      return;
    }

    setChatLoading(true);

    try {
      const res = await authFetch("/api/conversations/start", {
        method: "POST",
        body: JSON.stringify({ other_uid: profile.uid }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to start conversation");
      }

      const data = await res.json();

      if (!data?.conversation_id) {
        throw new Error("Conversation ID not returned");
      }

      navigate(`/messages/${data.conversation_id}`);
    } catch (err) {
      console.error("Failed to start chat:", err);
      alert("Cannot start chat: " + err.message);
    } finally {
      setChatLoading(false);
    }
  };

  if (loading) {
    return (
      <Container className="py-5" style={{ minHeight: "60vh" }}>
        <div className="text-center">
          <Spinner animation="border" />
          <p className="mt-2">Loading profile...</p>
        </div>
      </Container>
    );
  }

  if (!profile) {
    return (
      <Container className="py-5" style={{ minHeight: "60vh" }}>
        <Card className="text-center p-5">
          <h4>Freelancer not found</h4>
          <Button
            variant="primary"
            className="mt-3"
            onClick={() => navigate("/")}
          >
            Back to Home
          </Button>
        </Card>
      </Container>
    );
  }

  const skillsArray = profile.skills
    ? profile.skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  return (
    <Container className="py-4" style={{ minHeight: "60vh" }}>
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <Card className="shadow-sm">
            <Card.Body className="p-4">
              {/* Profile Image */}
              <div className="text-center mb-4">
                <img
                  src={
                    profile.image_url && profile.image_url.trim() !== ""
                      ? profile.image_url
                      : DEFAULT_IMAGE
                  }
                  alt={profile.name}
                  width={150}
                  height={150}
                  className="rounded-circle mb-3"
                  style={{ objectFit: "cover" }}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = DEFAULT_IMAGE;
                  }}
                />

                {profile.is_best_hired && (
                  <div className="ribbon ribbon-top-right">
                    <span>💎 Verified Pro</span>
                  </div>
                )}

                <h3 className="mb-1">{profile.name || "Unnamed Freelancer"}</h3>
                {profile.email && <p className="text-muted">{profile.email}</p>}
              </div>

              {/* Skills */}
              {skillsArray.length > 0 && (
                <div className="mb-4">
                  <h5 className="mb-2">Skills</h5>
                  <div className="d-flex flex-wrap gap-2">
                    {skillsArray.map((skill, idx) => (
                      <Badge key={idx} bg="primary" className="px-3 py-2">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Bio */}
              {profile.bio && (
                <div className="mb-4">
                  <h5 className="mb-2">About</h5>
                  <p className="text-muted">{profile.bio}</p>
                </div>
              )}

              {/* Actions */}
              <div className="d-flex gap-2 justify-content-center mt-4">
                <Button
                  variant="primary"
                  onClick={handleChat}
                  disabled={chatLoading || !user?.uid}
                  title={!user?.uid ? "Login to start chat" : ""}
                >
                  {chatLoading ? (
                    <>
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        className="me-2"
                      />
                      Opening...
                    </>
                  ) : (
                    "Start Chat"
                  )}
                </Button>

                <Button
                  variant="outline-secondary"
                  onClick={() => navigate(-1)}
                >
                  Back
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}