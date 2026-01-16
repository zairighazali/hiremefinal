
import { Container, Card, Badge } from "react-bootstrap";

export default function About() {
  return (
    <Container className="py-5" style={{ maxWidth: "900px" }}>
      {/* HEADER */}
      <div className="text-center mb-5">
        <h1 className="fw-bold">About HireME!</h1>
        <p className="text-muted mt-3">
          A full-stack web application built for Sigma School Module 3 Assessment
        </p>

        <Badge bg="primary">Learning Project</Badge>
      </div>

      {/* TECH STACK */}
      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <h4 className="mb-3">Tech Stack</h4>

          <p>
            <strong>Frontend:</strong> Built using <b>React</b> to create a smooth
            single-page application experience. <b>Bootstrap</b> is used for
            layout and styling to ensure responsive and clean UI design across
            devices.
          </p>

          <p>
            <strong>Backend:</strong> RESTful APIs are developed using{" "}
            <b>Node.js</b> and <b>Express</b>, and deployed on <b>Replit</b>.
            These APIs handle authentication, hiring flow, project management,
            and messaging features.
          </p>

          <p>
            <strong>Database:</strong> Data is stored using{" "}
            <b>Neon Database (PostgreSQL)</b>, managing users,
            hires and projects. Chat function will be add for capstone.
          </p>

          <p>
            <strong>Image Storage:</strong> <b>Cloudinary</b> is integrated for
            uploading and managing profile images efficiently without loading
            the server.
          </p>
        </Card.Body>
      </Card>

      {/* FEATURES */}
      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <h4 className="mb-3">What This Project Demonstrates</h4>

          <ul className="mb-0">
            <li>Full CRUD operations (Create, Read, Update, Delete)</li>
            <li>Client–freelancer hiring workflow</li>
            <li>Persistent project-based messaging system</li>
            <li>Authentication and protected routes</li>
            <li>Clear separation between frontend and backend</li>
            <li>Integration with third-party services (Cloudinary & Neon)</li>
          </ul>
        </Card.Body>
      </Card>

      {/* FINAL NOTE */}
      <Card className="shadow-sm">
        <Card.Body>
          <h4 className="mb-3">Final Notes</h4>

          <p className="mb-0">
            This project is mainly focused on learning and hands-on practice,
            rather than production use. It reflects my understanding of building
            a complete web application from scratch - from UI design and API
            development to database structure and deployment.
          </p>

          <p className="mt-3 mb-0 text-muted">
            Thanks for checking it out!
          </p>
        </Card.Body>
      </Card>
    </Container>
  );
}
