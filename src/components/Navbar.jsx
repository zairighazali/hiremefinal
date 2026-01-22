import { useState } from "react";
import { Navbar, Nav, Container, Button } from "react-bootstrap";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function AppNavbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [expanded, setExpanded] = useState(false); 

  const handleLogout = async () => {
    await logout();
    navigate("/login");
    setExpanded(false); 
  };

  const handleLinkClick = () => setExpanded(false); 

  // Check if link is active
  const isActive = (path) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <Navbar bg="dark" variant="dark" expand="lg" expanded={expanded}>
      <Container>
        <Navbar.Brand as={Link} to="/" onClick={handleLinkClick}>LokalJOB</Navbar.Brand>

        <Navbar.Toggle onClick={() => setExpanded(prev => !prev)} />
        <Navbar.Collapse>
          {/* LEFT MENU */}
          <Nav className="me-auto">
            <Nav.Link 
              as={Link} 
              to="/" 
              onClick={handleLinkClick}
              className={isActive("/") ? "active-navlink" : ""}
            >
              Home
            </Nav.Link>
            <Nav.Link 
              as={Link} 
              to="/jobs" 
              onClick={handleLinkClick}
              className={isActive("/jobs") ? "active-navlink" : ""}
            >
              Jobs
            </Nav.Link>

            {user && (
              <>
                <Nav.Link 
                  as={Link} 
                  to="/messages" 
                  onClick={handleLinkClick}
                  className={isActive("/messages") ? "active-navlink" : ""}
                >
                  Message
                </Nav.Link>
                <Nav.Link 
                  as={Link} 
                  to="/profile" 
                  onClick={handleLinkClick}
                  className={isActive("/profile") ? "active-navlink" : ""}
                >
                  Profile
                </Nav.Link>
              </>
            )}
          </Nav>

          {/* RIGHT MENU */}
          <Nav className="align-items-center">
            {user ? (
              <Button
                variant="outline-warning"
                size="sm"
                onClick={handleLogout}
              >
                Logout
              </Button>
            ) : (
              <>
                <Nav.Link 
                  as={Link} 
                  to="/login" 
                  onClick={handleLinkClick}
                  className={isActive("/login") ? "active-navlink" : ""}
                >
                  Login
                </Nav.Link>
                <Nav.Link 
                  as={Link} 
                  to="/register" 
                  onClick={handleLinkClick}
                  className={isActive("/register") ? "active-navlink" : ""}
                >
                  Register
                </Nav.Link>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}