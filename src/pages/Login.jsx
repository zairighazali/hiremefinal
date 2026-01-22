import { useState } from "react";
import {
  Form,
  Button,
  Container,
  Alert,
  InputGroup,
} from "react-bootstrap";
import { useNavigate, Link } from "react-router-dom";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "../../firebase";
import { Eye, EyeSlash } from "react-bootstrap-icons";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);

  const API_BASE_URL = "https://hire-me-server-nine.vercel.app"
    //"https://41bbbbbf-93d5-4a52-aef1-e65635945258-00-3tcqp4xlzxntf.pike.replit.dev";

  // ===== LOGIN =====
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const cred = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      if (!cred.user.emailVerified) {
        setError("Please verify your email before logging in.");
        await auth.signOut();
        return;
      }

      const token = await cred.user.getIdToken();

      // Sync backend
      await fetch(`${API_BASE_URL}/api/users/me`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      navigate("/");
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  // ===== FORGOT PASSWORD =====
  const handleForgotPassword = async () => {
    if (!email) {
      setError("Please enter your email first.");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess(
        "Password reset email sent. Please check Inbox or Spam/Junk folder."
      );
      setForgotMode(false);
    } catch (err) {
      setError(err.message || "Failed to send reset email.");
    }
  };

  return (
    <Container className="py-5" style={{ maxWidth: 400 }}>
      <h3 className="mb-4 text-center">
        {forgotMode ? "Reset Password" : "Login"}
      </h3>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      {!forgotMode ? (
        <Form onSubmit={handleSubmit}>
          <Form.Control
            className="mb-3"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          {/* PASSWORD */}
          <InputGroup className="mb-2">
            <Form.Control
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <InputGroup.Text
              style={{ cursor: "pointer" }}
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeSlash /> : <Eye />}
            </InputGroup.Text>
          </InputGroup>

          <div className="text-end mb-3">
            <Button
              variant="link"
              size="sm"
              className="p-0"
              onClick={() => {
                setForgotMode(true);
                setError("");
                setSuccess("");
              }}
            >
              Forgot password?
            </Button>
          </div>

          <Button
            type="submit"
            className="w-100 mb-3"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </Button>
        </Form>
      ) : (
        <>
          <Form.Group className="mb-3">
            <Form.Control
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Form.Group>

          <Button
            className="w-100 mb-2"
            onClick={handleForgotPassword}
          >
            Send Reset Email
          </Button>

          <Button
            variant="secondary"
            className="w-100"
            onClick={() => {
              setForgotMode(false);
              setError("");
              setSuccess("");
            }}
          >
            Back to Login
          </Button>
        </>
      )}

      {!forgotMode && (
        <p className="text-center small text-muted mt-3">
          No account?{" "}
          <Link
            to="/register"
            className="text-primary fw-semibold text-decoration-none"
          >
            Register
          </Link>
        </p>
      )}
    </Container>
  );
}
