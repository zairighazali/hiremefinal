import { useState, useEffect } from "react";
import {
  Form,
  Button,
  Container,
  Alert,
  InputGroup,
  ProgressBar,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
} from "firebase/auth";
import { auth } from "../../firebase";
import {
  Eye,
  EyeSlash,
  CheckCircleFill,
  XCircleFill,
} from "react-bootstrap-icons";

export default function Register() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [countdown, setCountdown] = useState(10);
  const [showPassword, setShowPassword] = useState(false);
  const [resendMsg, setResendMsg] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const API_BASE_URL = "https://hire-me-server-nine.vercel.app"
    
  //"https://41bbbbbf-93d5-4a52-aef1-e65635945258-00-3tcqp4xlzxntf.pike.replit.dev";

  // ===== PASSWORD MATCH =====
  const passwordMatch =
    form.password &&
    form.confirmPassword &&
    form.password === form.confirmPassword;

  // ===== PASSWORD STRENGTH =====
  const getPasswordStrength = () => {
    let score = 0;
    if (form.password.length >= 8) score += 25;
    if (/[A-Z]/.test(form.password)) score += 25;
    if (/[0-9]/.test(form.password)) score += 25;
    if (/[^A-Za-z0-9]/.test(form.password)) score += 25;
    return score;
  };

  const strength = getPasswordStrength();

  const strengthLabel =
    strength < 50
      ? "Weak"
      : strength < 75
      ? "Medium"
      : "Strong";

  // ===== COUNTDOWN REDIRECT =====
  useEffect(() => {
    if (!success) return;

    if (countdown === 0) {
      navigate("/login");
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((c) => c - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [success, countdown, navigate]);

  // ===== SUBMIT =====
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!passwordMatch) {
      setError("Password does not match");
      return;
    }

    if (strength < 75) {
      setError("Password is too weak");
      return;
    }

    setLoading(true);

    try {
      const cred = await createUserWithEmailAndPassword(
        auth,
        form.email,
        form.password
      );

      await updateProfile(cred.user, {
        displayName: form.name,
      });

      await sendEmailVerification(cred.user);

      const token = await cred.user.getIdToken();

      await fetch(`${API_BASE_URL}/api/users/me`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
        }),
      });

      setSuccess(
        "Account created successfully! Please verify your email. Check Inbox or Spam/Junk folder."
      );
    } catch (err) {
      setError(err.message || "Register failed");
    } finally {
      setLoading(false);
    }
  };

  // ===== RESEND EMAIL =====
  const resendVerification = async () => {
    try {
      if (!auth.currentUser) return;
      await sendEmailVerification(auth.currentUser);
      setResendMsg("Verification email resent successfully.");
    } catch {
      setResendMsg("Failed to resend verification email.");
    }
  };

  return (
    <Container className="py-5" style={{ maxWidth: 420 }}>
      <h3 className="mb-4">Register</h3>

      {error && <Alert variant="danger">{error}</Alert>}

      {success && (
        <Alert variant="success">
          {success}
          <br />
          Redirecting to login in <b>{countdown}</b> seconds...
          <div className="mt-2">
            <Button
              size="sm"
              variant="link"
              onClick={resendVerification}
            >
              Resend verification email
            </Button>
          </div>
          {resendMsg && <div>{resendMsg}</div>}
        </Alert>
      )}

      <Form onSubmit={handleSubmit}>
        <Form.Control
          className="mb-3"
          placeholder="Name"
          value={form.name}
          onChange={(e) =>
            setForm({ ...form, name: e.target.value })
          }
          required
        />

        <Form.Control
          className="mb-3"
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) =>
            setForm({ ...form, email: e.target.value })
          }
          required
        />

        {/* PASSWORD */}
        <InputGroup className="mb-2">
          <Form.Control
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={form.password}
            onChange={(e) =>
              setForm({ ...form, password: e.target.value })
            }
            required
          />
          <InputGroup.Text
            style={{ cursor: "pointer" }}
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeSlash /> : <Eye />}
          </InputGroup.Text>
        </InputGroup>

        {/* STRENGTH */}
        <ProgressBar
          now={strength}
          className="mb-3"
          label={strengthLabel}
        />

        {/* CONFIRM PASSWORD */}
        <InputGroup className="mb-3">
          <Form.Control
            type={showPassword ? "text" : "password"}
            placeholder="Confirm Password"
            value={form.confirmPassword}
            onChange={(e) =>
              setForm({
                ...form,
                confirmPassword: e.target.value,
              })
            }
            isValid={passwordMatch}
            isInvalid={
              form.confirmPassword && !passwordMatch
            }
            required
          />
          <InputGroup.Text>
            {passwordMatch ? (
              <CheckCircleFill color="green" />
            ) : (
              form.confirmPassword && (
                <XCircleFill color="red" />
              )
            )}
          </InputGroup.Text>
        </InputGroup>

        <Button
          type="submit"
          className="w-100"
          disabled={
            loading ||
            success ||
            !passwordMatch ||
            strength < 75
          }
        >
          {loading ? "Creating account..." : "Register"}
        </Button>
      </Form>
    </Container>
  );
}
