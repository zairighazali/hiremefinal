import { Card, Button, Badge } from "react-bootstrap";
import { Link } from "react-router-dom";
import "../App.css";

const DEFAULT_IMAGE = "/public/images/default.jpg";

export default function FreelancerCard({ freelancer }) {
  return (
    <Card className="freelancer-card text-center border-0">
      {/* IMAGE */}
      <div className="freelancer-img-wrapper position-relative">
        <img
          src={
            freelancer.image_url && freelancer.image_url.trim() !== ""
              ? freelancer.image_url
              : DEFAULT_IMAGE
          }
          alt={freelancer.name}
          className="freelancer-img"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = DEFAULT_IMAGE;
          }}
        />

        {freelancer.is_best_hired && (
          <div className="ribbon ribbon-top-right">
            <span>💎 Verified Pro</span>
          </div>
        )}
      </div>

      <Card.Body className="py-3 px-3">
        <h6 className="fw-bold mb-1">{freelancer.name}</h6>

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
          variant="outline-primary"
          className="px-3"
        >
          View Profile
        </Button>
      </Card.Body>
    </Card>
  );
}
