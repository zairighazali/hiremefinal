import React from "react";
import { Container } from "react-bootstrap";

export default function PrivacyPolicy() {
  return (
    <Container className="my-5">
      <h1>Privacy Policy</h1>
      <p>Last updated: January 17, 2026</p>

      <h2>Information We Collect</h2>
      <p>
        When you use our website, we may collect personal information such as your
        name, email address, payment information, and any other details you provide
        when creating an account, making a purchase, or interacting with our services.
      </p>

      <h2>How We Use Your Information</h2>
      <p>We use the information we collect for purposes including:</p>
      <ul>
        <li>Processing payments and managing orders</li>
        <li>Providing, improving, and personalizing our services</li>
        <li>Communicating with you about your account or transactions</li>
        <li>Sending promotional materials (with your consent)</li>
      </ul>

      <h2>Information Sharing & Disclosure</h2>
      <p>
        We do not sell your personal information. However, we may share your
        information with trusted third parties in the following cases:
      </p>
      <ul>
        <li>Payment processors (e.g., Stripe) to complete transactions</li>
        <li>Service providers who help us operate our website and services</li>
        <li>If required by law or to protect our rights</li>
      </ul>

      <h2>How We Protect Your Information</h2>
      <p>
        We implement security measures to protect your personal information from
        unauthorized access, alteration, disclosure, or destruction. This includes
        encryption of sensitive data, secure servers, and access controls.
      </p>

      <h2>Cookies & Tracking</h2>
      <p>
        We may use cookies and similar technologies to enhance your browsing
        experience, analyze traffic, and understand user behavior on our website.
      </p>

      <h2>Your Rights</h2>
      <p>
        You have the right to access, update, or delete your personal information.
        You can contact us anytime for assistance regarding your data.
      </p>

      <h2>Contact Us</h2>
      <p>
        If you have any questions or concerns about our privacy practices, you can
        contact us at: <a href="mailto:mohdzairighazali@yahoo.com">privacy@lokaljob.com</a>
      </p>

      <p>
        By using our website, you agree to the terms outlined in this Privacy Policy.
      </p>
    </Container>
  );
}
