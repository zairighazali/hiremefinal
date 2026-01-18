import { useState, useEffect } from "react";
import {
  Container,
  Card,
  Button,
  Alert,
  Spinner,
  Badge,
} from "react-bootstrap";
import { authFetch } from "../services/api";
import { useSearchParams, useNavigate } from "react-router-dom";

export default function StripeOnboardingPage() {
  const [accountStatus, setAccountStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [onboarding, setOnboarding] = useState(false);
  const [error, setError] = useState("");
  const [searchParams] = useSearchParams();
  const success = searchParams.get("success");
  const navigate = useNavigate();

  // Fetch account status
  const fetchAccountStatus = async () => {
    try {
      const res = await authFetch("/api/stripe/account-status");
      if (!res.ok) throw new Error("Failed to fetch account status");
      const data = await res.json();
      setAccountStatus(data);
      setError("");
    } catch (err) {
      console.error("Fetch account status error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccountStatus();

    // Refresh status after successful onboarding
    if (success === "true") {
      setTimeout(fetchAccountStatus, 2000);
    }
  }, [success]);

  // Start Stripe Connect onboarding
  const handleStartOnboarding = async () => {
    setOnboarding(true);
    setError("");

    try {
      const res = await authFetch("/api/stripe/onboard", { method: "POST" });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(
          errorData.error || errorData.message || `Failed to start onboarding (${res.status})`
        );
      }

      const data = await res.json();

      if (!data.url) throw new Error("No onboarding URL received from server");

      window.location.href = data.url; // Redirect to Stripe
    } catch (err) {
      console.error("Onboarding error:", err);
      setError(err.message || "An unexpected error occurred");
      setOnboarding(false);
    }
  };

  // Open Stripe dashboard
  // const handleOpenDashboard = async () => {
  //   try {
  //     const res = await authFetch("/api/stripe/login-link");
      
  //     if (!res.ok) {
  //       const errorData = await res.json().catch(() => ({}));
  //       throw new Error(errorData.message || "Failed to get dashboard link");
  //     }
      
  //     const data = await res.json();
      
  //     if (!data.url) {
  //       throw new Error("No dashboard URL received");
  //     }
      
  //     console.log("Redirecting to Stripe dashboard:", data.url);
  //     window.location.href = data.url;
  //   } catch (err) {
  //     console.error("Dashboard error:", err);
  //     setError(err.message || "Failed to open Stripe dashboard");
  //   }
  // };

  // if (loading) {
  //   return (
  //     <Container className="py-5 text-center">
  //       <Spinner animation="border" />
  //       <p className="mt-2">Loading payment settings...</p>
  //     </Container>
  //   );
  // }

  return (
    <Container className="py-5" style={{ maxWidth: 600 }}>
      <h2 className="mb-4">Payment Settings</h2>

      {success === "true" && (
        <Alert variant="success">
          🎉 Payment setup completed successfully!
          <div className="mt-2">
            <Button variant="outline-success" onClick={() => navigate("/settings/payment")}>
              Go Back
            </Button>
          </div>
        </Alert>
      )}

      {error && <Alert variant="danger">{error}</Alert>}

      {!success && (
        <Card>
          <Card.Header>
            <h5>Stripe Connect Status</h5>
          </Card.Header>
          <Card.Body>
            {!accountStatus?.hasAccount ? (
              <div>
                <p>
                  Set up your payment account to receive payments from clients.
                </p>
                <p className="text-muted small">
                  You'll be redirected to Stripe to complete a secure onboarding
                  process. This is required to receive payments.
                </p>
                <Button
                  variant="primary"
                  onClick={handleStartOnboarding}
                  disabled={onboarding}
                  className="w-100"
                >
                  {onboarding ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Starting onboarding...
                    </>
                  ) : (
                    "Set Up Payment Account"
                  )}
                </Button>
              </div>
            ) : !accountStatus?.onboarded ? (
              <div>
                <Alert variant="warning">
                  Your payment account setup is incomplete.
                </Alert>
                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span>Account Created:</span>
                    <Badge bg="success">✓</Badge>
                  </div>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span>Charges Enabled:</span>
                    <Badge
                      bg={accountStatus.chargesEnabled ? "success" : "warning"}
                    >
                      {accountStatus.chargesEnabled ? "✓" : "Pending"}
                    </Badge>
                  </div>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span>Payouts Enabled:</span>
                    <Badge
                      bg={accountStatus.payoutsEnabled ? "success" : "warning"}
                    >
                      {accountStatus.payoutsEnabled ? "✓" : "Pending"}
                    </Badge>
                  </div>
                </div>
                <Button
                  variant="primary"
                  onClick={handleStartOnboarding}
                  disabled={onboarding}
                  className="w-100"
                >
                  {onboarding ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Redirecting...
                    </>
                  ) : (
                    "Complete Setup"
                  )}
                </Button>
              </div>
            ) : (
              <div>
                <Alert variant="success">
                  <strong>✓ Your payment account is active!</strong>
                  <br />
                  You can now receive payments from clients.
                </Alert>
                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span>Charges Enabled:</span>
                    <Badge bg="success">✓</Badge>
                  </div>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span>Payouts Enabled:</span>
                    <Badge bg="success">✓</Badge>
                  </div>
                </div>
                <p className="text-muted small">
                  Need to update your payment information? Click below to access
                  your Stripe dashboard.
                </p>
                <Button
                  variant="outline-primary"
                  onClick={handleStartOnboarding}
                  disabled={onboarding}
                  className="w-100 mb-2"
                >
                  Update Payment Settings
                </Button>
                {/* <Button
                  variant="outline-primary"
                  onClick={handleOpenDashboard}
                  className="w-100"
                >
                  Open Stripe Dashboard
                </Button> */}
              </div>
            )}
          </Card.Body>
        </Card>
      )}

      <Card className="mt-4">
        <Card.Body>
          <h6>About Stripe Connect</h6>
          <p className="text-muted small mb-0">
            We use Stripe Connect to ensure secure and compliant payment
            processing. Your banking and personal information is handled
            securely by Stripe and never stored on our servers. Payments are
            held in escrow until work is completed.
          </p>
        </Card.Body>
      </Card>
    </Container>
  );
}
