import { Container, Row, Col } from "react-bootstrap";

export default function Footer() {
  return (
    <footer className="bg-dark text-light mt-auto">
      <Container className="py-4">
        <Row className="gy-3">
          {/* Brand */}
          <Col md={4}>
            <h5 className="mb-2">HireME!</h5>
            <p className="text-secondary small mb-0">
              Search . Connect . Hire .
            </p>
          </Col>

          {/* Links */}
          <Col md={4}>
            <h6>Links</h6>
            <ul className="list-unstyled small">
              <li>
                <a href="/" className="text-secondary text-decoration-none">
                  Home
                </a>
              </li>
              <li>
                <a
                  href="/profile"
                  className="text-secondary text-decoration-none"
                >
                  Profile
                </a>
              </li>
              <li>
                <a
                  href="/about"
                  className="text-secondary text-decoration-none"
                >
                  About Us
                </a>
              </li>
              <li>
                <a
                  href="/privacy-policy"
                  className="text-secondary text-decoration-none"
                >
                  Privacy Policy
                </a>
              </li>
            </ul>
          </Col>

          {/* Copyright */}
          <Col md={4} className="text-md-end">
            <p className="small text-secondary mb-0">
              © {new Date().getFullYear()} HireME!. All rights reserved. Powered
              by{" "}
              <a
                href="https://404found.studio"
                target="_blank"
                rel="noopener noreferrer"
              >
                404found.studio
              </a>
            </p>
          </Col>
        </Row>
      </Container>
    </footer>
  );
}
