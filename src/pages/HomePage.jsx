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

      // shuffle every fetch
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
      {/* ===== Carousel ===== */}
       <Carousel interval={3000} pause={false} className="responsive-carousel">
      {banners.map((img, index) => (
        <Carousel.Item key={index}>
          <img
            className="d-block w-100 carousel-img"
            src={img}
            alt={`Banner ${index + 1}`}
          />
        </Carousel.Item>
      ))}
    </Carousel>


      <style jsx>{`
        @media (min-width: 768px) {
          .carousel-container img {
            height: 400px; /* desktop height */
          }
        }
        @media (min-width: 1200px) {
          .carousel-container img {
            height: 500px; /* large desktop */
          }
        }
      `}</style>

      {/* ===== Hero + Search ===== */}
      <Container className="text-center text-black mt-4">
        <h1 className="fw-bold display-5">
          Hire <span className="text-primary">top freelancers</span> in minutes
        </h1>

        <p className="fs-5 mb-4 opacity-75">
          Search, hire, and work with skilled professionals.
        </p>

        <Form.Control
          placeholder="Search freelancer by skill..."
          value={search}
          onChange={handleSearch}
        />

        <p className="small mt-3 opacity-50">
          Example searches: Web Developer, Graphic Designer, Musician
        </p>
      </Container>

      {/* ===== Freelancers ===== */}
      <Container className="mt-4">
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
