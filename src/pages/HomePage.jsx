import { Container, Carousel, Form, Row, Col } from "react-bootstrap";
import { useState, useEffect, useMemo } from "react";
import FreelancerCard from "../components/FreelancerCard";
import { useAuth } from "../hooks/useAuth";
import { authFetch } from "../services/api";
import "../App.css";

export default function HomePage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [freelancers, setFreelancers] = useState([]);
  const [loading, setLoading] = useState(true);
  const API = import.meta.env.VITE_API_URL;

  /* ===== Banners ===== */
  const banners = [
    "/landing-banner-1.webp",
    "/landing-banner-2.jpg",
    "/landing-banner-3.jpg",
  ];

  /* ===== Utils ===== */
  const shuffleArray = (arr) => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  /* ===== Fetch Freelancers ===== */
  const fetchFreelancers = async (q = "") => {
    setLoading(true);
    try {
      let url;
      let data;

      if (user) {
        url = `/api/users/freelancers${q ? `?q=${encodeURIComponent(q)}` : ""}`;
        const res = await authFetch(url);
        if (!res.ok) throw new Error("Auth fetch failed");
        data = await res.json();
      } else {
        url = `${API}/api/users/public/freelancers${q ? `?q=${encodeURIComponent(q)}` : ""}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Public fetch failed");
        data = await res.json();
      }

      setFreelancers(shuffleArray(data));
    } catch (err) {
      console.error("Failed to fetch freelancers:", err);
      setFreelancers([]);
    } finally {
      setLoading(false);
    }
  };

  /* ===== Initial Load ===== */
  useEffect(() => {
    fetchFreelancers();
  }, [user]);

  /* ===== Search Handler ===== */
  const handleSearch = (e) => {
    const val = e.target.value;
    setSearch(val);
    fetchFreelancers(val);
  };

  /* ===== Display Logic ===== */
  const isSearching = search.trim().length > 0;

  const displayedFreelancers = useMemo(() => {
    return isSearching ? freelancers : freelancers.slice(0, 6);
  }, [freelancers, isSearching]);

  /* ===== Render ===== */
  return (
    <>
      {/* ===== Carousel with Hero Overlay ===== */}
      <div style={{ position: "relative", width: "100%", margin: 0, padding: 0 }}>
        <Carousel interval={3000} pause={false} style={{ width: "100%" }}>
          {banners.map((img, index) => (
            <Carousel.Item key={index}>
              <img
                className="d-block w-100 carousel-img"
                src={img}
                alt={`Banner ${index + 1}`}
                style={{ filter: "brightness(0.7)" }}
              />
            </Carousel.Item>
          ))}
        </Carousel>

        {/* Hero Content Overlay */}
        <div
          style={{
            position: "absolute",
            top: "70%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 10,
            width: "90%",
            maxWidth: "800px",
            textAlign: "center",
          }}
        >
          <h1 className="fw-bold display-4 text-white mb-3">
            Hire <span style={{ color: "#F59127" }}>top freelancers</span> in minutes
          </h1>

          <p className="fs-5 text-white mb-4" style={{ opacity: 0.95 }}>
            Search, hire, and work with skilled professionals.
          </p>

          <div style={{ position: "relative", maxWidth: "600px", margin: "0 auto" }}>
            <Form.Control
              placeholder="Search for any service..."
              value={search}
              onChange={handleSearch}
              style={{
                padding: "16px 60px 16px 20px",
                fontSize: "16px",
                borderRadius: "8px",
                border: "none",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              }}
            />
            <button
              style={{
                position: "absolute",
                right: "8px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "#F59127",
                border: "none",
                borderRadius: "6px",
                padding: "10px 20px",
                color: "white",
                fontWeight: "600",
                cursor: "pointer",
              }}
              onClick={() => fetchFreelancers(search)}
            >
              Search
            </button>
          </div>

          <p className="small mt-3 text-white" style={{ opacity: 0.8 }}>
            Example: Web Developer, Graphic Designer, Musician
          </p>
        </div>
      </div>

      {/* ===== Freelancers ===== */}
      <Container className="mt-5">
        <h3 className="mb-4">
          {isSearching ? "Search Results" : "Available Freelancers"}
        </h3>

        {loading ? (
          <p>Loading freelancers...</p>
        ) : displayedFreelancers.length === 0 ? (
          <p className="text-muted">
            No freelancers found matching your search.
          </p>
        ) : (
          <>
            <Row>
              {displayedFreelancers.map((f) => (
                <Col md={4} key={f.uid} className="mb-4">
                  <FreelancerCard freelancer={f} />
                </Col>
              ))}
            </Row>

            {!isSearching && freelancers.length > 6 && (
              <div className="text-center mt-3">
                {/* <a href="/freelancers" className="btn btn-outline-primary">
                  View all freelancers
                </a> */}
              </div>
            )}
          </>
        )}
      </Container>
    </>
  );
}