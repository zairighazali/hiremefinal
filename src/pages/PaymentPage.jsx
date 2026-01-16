import { useState, useEffect, useCallback } from "react";
import { Container, Card, Button, Alert, Spinner, Form } from "react-bootstrap";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { stripePromise } from "../services/stripe";
import { authFetch } from "../services/api";

// 🔹 Checkout form
const CheckoutForm = ({ hire, onSuccess }) => {
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
      const res = await authFetch(`/api/stripe/create-intent/${hire.hire_id}`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to create payment intent");
      const { clientSecret } = await res.json();

      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: elements.getElement(CardElement) },
      });

      if (result.error) setError(result.error.message);
      else if (result.paymentIntent.status === "requires_capture") {
        alert("Payment authorized! Amount held in escrow.");
        onSuccess();
      } else if (result.paymentIntent.status === "succeeded") {
        alert("Payment succeeded!");
        onSuccess();
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Form.Group className="mb-3">
        <Form.Label>Card Details</Form.Label>
        <div className="border p-3 rounded"><CardElement /></div>
      </Form.Group>

      {error && <Alert variant="danger">{error}</Alert>}

      <Button type="submit" variant="primary" className="w-100" disabled={!stripe || loading}>
        {loading ? <Spinner animation="border" size="sm" /> : `Pay RM${hire.amount}`}
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

  const fetchHire = useCallback(async () => {
    try {
      const res = await authFetch(`/api/hires/${hireId}`);
      if (!res.ok) throw new Error("Failed to load hire details");
      const data = await res.json();
      setHire(data);
    } catch (err) {
      console.error(err);
      alert("Failed to load hire details");
      navigate("/profile");
    } finally {
      setLoading(false);
    }
  }, [hireId, navigate]);

  useEffect(() => { if (hireId) fetchHire(); }, [hireId, fetchHire]);

  const handleSuccess = () => navigate("/profile");

  if (loading) return (
    <Container className="py-5 text-center">
      <Spinner animation="border" />
      <p className="mt-2">Loading hire details...</p>
    </Container>
  );

  if (!hire) return (
    <Container className="py-5 text-center">
      <Alert variant="danger">Hire not found</Alert>
      <Button onClick={() => navigate("/profile")}>Back to Profile</Button>
    </Container>
  );

  return (
    <Container className="py-5" style={{ maxWidth: 600 }}>
      <Card>
        <Card.Header><h4>Complete Payment</h4></Card.Header>
        <Card.Body>
          <h5>Job: {hire.job_title}</h5>
          <p>Freelancer: {hire.freelancer_name} ({hire.freelancer_email})</p>
          <p>Amount: RM{hire.amount}</p>

          <Elements stripe={stripePromise}>
            <CheckoutForm hire={hire} onSuccess={handleSuccess} />
          </Elements>
        </Card.Body>
      </Card>
    </Container>
  );
}
