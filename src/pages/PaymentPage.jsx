import { useState, useEffect, useCallback } from "react";
import { Container, Card, Button, Alert, Spinner, Form } from "react-bootstrap";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { stripePromise } from "../services/stripe";
import { authFetch } from "../services/api";

// 🔹 Checkout form
const CheckoutForm = ({ hireId, hire, onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError("");

    try {
      // Use hireId directly, not hire.hire_id
      const res = await authFetch(`/api/stripe/create-intent/${hireId}`, { 
        method: "POST" 
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to create payment intent");
      }
      
      const { clientSecret } = await res.json();

      if (!clientSecret) {
        throw new Error("No client secret received");
      }

      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { 
          card: elements.getElement(CardElement) 
        },
      });

      if (result.error) {
        setError(result.error.message);
      } else if (result.paymentIntent.status === "requires_capture") {
        alert("Payment authorized! Amount held in escrow.");
        onSuccess();
      } else if (result.paymentIntent.status === "succeeded") {
        alert("Payment succeeded!");
        onSuccess();
      }
    } catch (err) {
      console.error("Payment error:", err);
      setError(err.message || "An error occurred during payment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Form.Group className="mb-3">
        <Form.Label>Card Details</Form.Label>
        <div className="border p-3 rounded">
          <CardElement options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
              invalid: {
                color: '#9e2146',
              },
            },
          }} />
        </div>
      </Form.Group>

      {error && <Alert variant="danger">{error}</Alert>}

      <Button 
        type="submit" 
        variant="primary" 
        className="w-100" 
        disabled={!stripe || loading}
      >
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

  const fetchHire = useCallback(async () => {
    if (!hireId) {
      setError("No hire ID provided");
      setLoading(false);
      return;
    }

    try {
      const res = await authFetch(`/api/hires/${hireId}`);
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to load hire details");
      }
      
      const data = await res.json();
      console.log("Hire data:", data); // Debug log
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

          <Elements stripe={stripePromise}>
            <CheckoutForm 
              hireId={hireId} 
              hire={hire} 
              onSuccess={handleSuccess} 
            />
          </Elements>
        </Card.Body>
      </Card>
    </Container>
  );
}
