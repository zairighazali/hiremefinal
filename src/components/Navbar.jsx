import { useState } from "react";
import { Navbar, Nav, Container, Button } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function AppNavbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false); 

  const handleLogout = async () => {
    await logout();
    navigate("/login");
    setExpanded(false); 
  };

  const handleLinkClick = () => setExpanded(false); 

  return (
    <Navbar bg="dark" variant="dark" expand="lg" expanded={expanded}>
      <Container>
        <Navbar.Brand as={Link} to="/" onClick={handleLinkClick}>HireMe</Navbar.Brand>

        <Navbar.Toggle onClick={() => setExpanded(prev => !prev)} />
        <Navbar.Collapse>
          {/* LEFT MENU */}
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/" onClick={handleLinkClick}>Home</Nav.Link>
            <Nav.Link as={Link} to="/jobs" onClick={handleLinkClick}>Jobs</Nav.Link>

            {user && (
              <>
                <Nav.Link as={Link} to="/messages" onClick={handleLinkClick}>Message</Nav.Link>
                <Nav.Link as={Link} to="/profile" onClick={handleLinkClick}>Profile</Nav.Link>
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
                <Nav.Link as={Link} to="/login" onClick={handleLinkClick}>Login</Nav.Link>
                <Nav.Link as={Link} to="/register" onClick={handleLinkClick}>Register</Nav.Link>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
