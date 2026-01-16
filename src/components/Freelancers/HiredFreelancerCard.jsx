import { Card, Button, Badge } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

export default function HiredFreelancerCard({ hire, refresh }) {
  const navigate = useNavigate();

  const handlePay = () => {
    navigate(`/payment?hireId=${hire.id}`);
  };

  const getStatusBadge = () => {
    if (hire.status === "paid") {
      return <Badge bg="success">Paid</Badge>;
    } else if (hire.status === "completed") {
      return <Badge bg="info">Completed</Badge>;
    } else {
      return <Badge bg="warning">Pending Payment</Badge>;
    }
  };

  return (
    <Card className="mb-3">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-start mb-2">
          <div>
            <Card.Title>{hire.freelancer_name || hire.job_title || "Hire"}</Card.Title>
            <Card.Text className="text-muted">
              {hire.description || "No description"}
            </Card.Text>
            {hire.amount && (
              <Card.Text>
                <strong>Amount: RM{hire.amount}</strong>
              </Card.Text>
            )}
          </div>
          {getStatusBadge()}
        </div>

        <div className="d-flex gap-2">
          {hire.status === "pending" && (
            <Button variant="success" size="sm" onClick={handlePay}>
              Pay Now
            </Button>
          )}
          <Button variant="outline-secondary" size="sm" onClick={refresh}>
            Refresh
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
}