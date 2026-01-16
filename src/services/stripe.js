import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export { stripePromise };

export async function createPaymentIntent(hireId) {
  const response = await fetch(`${import.meta.env.VITE_API_URL}/api/stripe/create-intent/${hireId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${await getAuthToken()}`,
    },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to create payment intent');
  }

  return response.json(); // { clientSecret }
}


export async function confirmPayment(clientSecret, paymentMethod) {
  const stripe = await stripePromise;
  return stripe.confirmCardPayment(clientSecret, {
    payment_method: paymentMethod,
  });
}


async function getAuthToken() {
  const { auth } = await import('../../firebase');
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  return user.getIdToken();
}
