import { useState, useEffect, useCallback } from "react";
import { Container, Card, Button, Alert, Spinner, Form } from "react-bootstrap";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { stripePromise } from "../services/stripe";
import { authFetch } from "../services/api";

// 🔹 Checkout form
const CheckoutForm = ({ hireId, hire, clientSecret, paymentMethod, onPaymentMethodChange, onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements || !clientSecret) return;

    setLoading(true);
    setError("");

    try {
      const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${process.env.REACT_APP_FRONTEND_URL}/payment-success?hireId=${hireId}`,
        },
      });

      if (stripeError) {
        setError(stripeError.message);
      } else if (paymentIntent) {
        if (paymentIntent.status === "requires_capture") {
          alert("Payment authorized (card escrow)!");
        } else if (paymentIntent.status === "succeeded") {
          alert("Payment succeeded!");
        }
        onSuccess();
      }
    } catch (err) {
      console.error("Payment submit error:", err);
      setError(err.message || "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Form.Group className="mb-3">
        <Form.Label>Choose Payment Method</Form.Label>
        <Form.Select value={paymentMethod} onChange={(e) => onPaymentMethodChange(e.target.value)}>
          <option value="card">Card</option>
          <option value="fpx">FPX (Online Banking)</option>
          <option value="grabpay">GrabPay</option>
        </Form.Select>
      </Form.Group>

      {clientSecret ? (
        <div className="border p-3 rounded mb-3">
          <PaymentElement />
        </div>
      ) : (
        <p>Loading payment options...</p>
      )}

      {error && <Alert variant="danger">{error}</Alert>}

      <Button type="submit" className="w-100" disabled={loading || !stripe || !clientSecret}>
        {loading ? (
          <>
            <Spinner animation="border" size="sm" className="me-2" />
            Processing...
          </>
        ) : (
          `Pay RM${hire?.amount || 0}`
        )}
      </Button>
    </Form>
  );
};

// 🔹 PaymentPage
export default function PaymentPage() {
  const [searchParams] = useSearchParams();
  const hireId = searchParams.get("hireId");
  const navigate = useNavigate();

  const [hire, setHire] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("card");

  // Fetch hire details
  const fetchHire = useCallback(async () => {
    if (!hireId) {
      setError("No hire ID provided");
      setLoading(false);
      return;
    }

    try {
      const res = await authFetch(`/api/hires/${hireId}`);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to load hire details");
      }

      const data = await res.json();
      setHire(data);
      setError("");
    } catch (err) {
      console.error("Fetch hire error:", err);
      setError(err.message || "Failed to load hire details");
    } finally {
      setLoading(false);
    }
  }, [hireId]);

  useEffect(() => {
    fetchHire();
  }, [fetchHire]);

  // Fetch client secret whenever payment method changes
  useEffect(() => {
    async function fetchClientSecret() {
      if (!hireId) return;
      setClientSecret("");
      try {
        const res = await authFetch(`/api/stripe/create-intent/${hireId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentMethod }),
        });
        const data = await res.json();
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
        } else {
          setError("Failed to create payment intent");
        }
      } catch (err) {
        console.error("Error fetching client secret:", err);
        setError(err.message || "Failed to create payment intent");
      }
    }

    fetchClientSecret();
  }, [hireId, paymentMethod]);

  const handleSuccess = () => {
    navigate("/profile");
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" />
        <p className="mt-2">Loading hire details...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5 text-center">
        <Alert variant="danger">{error}</Alert>
        <Button onClick={() => navigate("/profile")}>Back to Profile</Button>
      </Container>
    );
  }

  if (!hire) {
    return (
      <Container className="py-5 text-center">
        <Alert variant="danger">Hire not found</Alert>
        <Button onClick={() => navigate("/profile")}>Back to Profile</Button>
      </Container>
    );
  }

  return (
    <Container className="py-5" style={{ maxWidth: 600 }}>
      <Card>
        <Card.Header>
          <h4>Complete Payment</h4>
        </Card.Header>
        <Card.Body>
          <h5>Job: {hire.job_title || "N/A"}</h5>
          <p>Freelancer: {hire.freelancer_name || "N/A"} ({hire.freelancer_email || "N/A"})</p>
          <p><strong>Amount: RM{hire.amount}</strong></p>
          <p className="text-muted small">
            Payment will be held in escrow until work is completed
          </p>

          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <CheckoutForm
              hireId={hireId}
              hire={hire}
              clientSecret={clientSecret}
              paymentMethod={paymentMethod}
              onPaymentMethodChange={setPaymentMethod}
              onSuccess={handleSuccess}
            />
          </Elements>
        </Card.Body>
      </Card>
    </Container>
  );
}
