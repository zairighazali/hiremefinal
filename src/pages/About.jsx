import { Container, Card, Badge } from "react-bootstrap";

export default function About() {
  return (
    <Container className="py-5" style={{ maxWidth: "900px" }}>
      {/* HEADER */}
      <div className="text-center mb-5">
        <h1 className="fw-bold">About LokalJOB</h1>
        <p className="text-muted mt-3">
          A full-stack web application built as a capstone project during my
          journey at Sigma School.
        </p>

        <Badge bg="primary">Learning Project</Badge>
      </div>

      {/* TECH STACK */}
      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <h4 className="mb-3">Tech Stack</h4>

          <p>
            <strong>Frontend:</strong> Built using <b>React</b> to deliver a
            smooth single-page application experience. <b>Bootstrap</b> is used
            for layout and styling to ensure a clean, responsive UI across
            different screen sizes.
          </p>

          <p>
            <strong>Backend:</strong> RESTful APIs are developed using{" "}
            <b>Node.js</b> and <b>Express</b>. Development is heavily done using{" "}
            <b>VS Code</b> with local servers for testing and debugging before
            deployment. This setup helps simulate real-world development
            workflows and catch issues early.
          </p>

          <p>
            <strong>Authentication:</strong> <b>Firebase Authentication</b> is
            used to handle user login and registration, including email
            verification, password reset, and protected access to certain
            features.
          </p>

          <p>
            <strong>Database & Realtime Features:</strong> Core application data
            is managed using <b>Neon (PostgreSQL)</b> for relational data such
            as users, jobs, and hires. For real-time communication,{" "}
            <b>Firebase Realtime Database</b> is implemented to support the chat
            system between clients and freelancers.
          </p>

          <p>
            <strong>Image Storage:</strong> Profile images and uploads are
            handled using <b>Firebase Storage</b>, allowing secure uploads and
            easy file management without overloading the backend server.
          </p>

          <p>
            <strong>Payments & External APIs:</strong> <b>Stripe</b> is
            integrated as an external payment API. Setting up the payment flow
            was one of the most challenging parts of the project, especially
            when dealing with platform limitations and advanced features such as
            escrow-style payments.
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
            <li>Real-time chat system using Firebase Realtime Database</li>
            <li>Authentication, email verification & password reset</li>
            <li>Use of local development servers for testing and debugging</li>
            <li>Integration with third-party services (Firebase & Stripe)</li>
            <li>
              Clear separation between frontend, backend, and external services
            </li>
          </ul>
        </Card.Body>
      </Card>

      {/* FINAL NOTE */}
      <Card className="shadow-sm">
        <Card.Body>
          <h4 className="mb-3">Final Notes</h4>

          <p className="mb-0">
            This project is primarily focused on learning and hands-on
            experience rather than production use. It reflects my understanding
            of building a complete web application from scratch — from UI design
            and frontend logic to backend APIs, authentication, real-time
            features, and third-party API integrations.
          </p>

          <p className="mt-3 mb-0 text-muted">Thanks for checking it out!</p>
          <p>
            <strong>Special thanks</strong> to <strong>Ms Safa Yousif</strong>{" "}
            and my classmate heroes <strong>Adam, Jasper,</strong> and{" "}
            <strong>Rumi</strong> for spending their time checking, testing, and
            breaking my website (in a good way).
          </p>
        </Card.Body>
      </Card>
    </Container>
  );
}
