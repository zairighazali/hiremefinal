import { Card, Button, Badge } from "react-bootstrap";
import { Link } from "react-router-dom";
import '../App.css';

export default function FreelancerCard({ freelancer }) {
  return (
    <Card className="freelancer-card text-center border-0">
      {/* IMAGE */}
      <div className="freelancer-img-wrapper">
        <img
          src={freelancer.image_url || "https://via.placeholder.com/300"}
          alt={freelancer.name}
          className="freelancer-img"
        />
      </div>

      <Card.Body className="py-3 px-3">
        <h6 className="fw-bold mb-1">{freelancer.name}</h6>

        {/* <p className="text-muted small mb-2">
          {freelancer.bio || "Freelancer"}
        </p> */}

        {/* SKILLS */}
        {freelancer.skills && (
          <div className="mb-2">
            {(Array.isArray(freelancer.skills)
              ? freelancer.skills
              : freelancer.skills.split(",")
            )
              .slice(0, 3)
              .map((skill, index) => (
                <Badge
                  key={index}
                  bg="light"
                  text="dark"
                  className="me-1 mb-1 small"
                >
                  {skill.trim()}
                </Badge>
              ))}
          </div>
        )}

        <Button
          as={Link}
          to={`/freelancer/${freelancer.uid}`}
          size="sm"
          className="px-3"
        >
          View Profile
        </Button>
      </Card.Body>
    </Card>
  );
}
