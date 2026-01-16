import { Navbar, Nav, Container, Button } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function AppNavbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <Navbar bg="dark" variant="dark" expand="lg">
      <Container>
        <Navbar.Brand as={Link} to="/">HireMe</Navbar.Brand>

        <Navbar.Toggle />
        <Navbar.Collapse>
          {/* LEFT MENU */}
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/">Home</Nav.Link>
            <Nav.Link as={Link} to="/jobs">Jobs</Nav.Link>

            {user && (
              <>
                <Nav.Link as={Link} to="/messages">Message</Nav.Link>
                <Nav.Link as={Link} to="/profile">Profile</Nav.Link>
              </>
            )}
          </Nav>

          {/* RIGHT MENU */}
          <Nav className="align-items-center">
            {user ? (
              <Button
                variant="outline-light"
                size="sm"
                onClick={handleLogout}
              >
                Logout
              </Button>
            ) : (
              <>
                <Nav.Link as={Link} to="/login">Login</Nav.Link>
                <Nav.Link as={Link} to="/register">Register</Nav.Link>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
