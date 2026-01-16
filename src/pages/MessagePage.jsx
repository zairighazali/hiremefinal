// src/pages/MessagePage.jsx - FIXED
import {
  Container,
  Row,
  Col,
  ListGroup,
  Form,
  Button,
  Card,
  Spinner,
} from "react-bootstrap";
import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { authFetch } from "../services/api";
import { initSocket } from "../services/socket";
import { useAuth } from "../hooks/useAuth";

export default function MessagePage() {
  const { user } = useAuth();
  const { conversationId } = useParams();
  const navigate = useNavigate();
  
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  // Scroll to bottom
  const scrollToBottom = () =>
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

  // Initialize socket
  useEffect(() => {
    const setupSocket = async () => {
      try {
        const socket = await initSocket();
        socketRef.current = socket;

        socket.on("receive_message", (data) => {
          console.log("Received message:", data);
          
          // Check if message belongs to active conversation
          if (data.message?.conversation_id === activeConv?.conversation_id) {
            setMessages((prev) => [...prev, data.message]);
          }
          
          // Refresh conversation list to show latest message
          fetchConversations();
        });

        return () => {
          socket.off("receive_message");
        };
      } catch (err) {
        console.error("Socket setup error:", err);
      }
    };

    if (user) {
      setupSocket();
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.off("receive_message");
      }
    };
  }, [user, activeConv?.conversation_id]);

  // Fetch conversations list
  const fetchConversations = async () => {
    try {
      const res = await authFetch("/api/conversations");
      if (!res.ok) throw new Error("Failed to fetch conversations");
      
      const data = await res.json();
      setConversations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch conversations:", err);
      setConversations([]);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  // Open conversation from URL param
  useEffect(() => {
    if (conversationId && conversations.length > 0) {
      const conv = conversations.find(
        (c) => c.conversation_id == conversationId
      );
      if (conv) {
        openConversation(conv);
      }
    }
  }, [conversationId, conversations]);

  // Open/Load conversation
  const openConversation = async (conv) => {
    setActiveConv(conv);
    setLoading(true);
    
    try {
      const res = await authFetch(
        `/api/conversations/${conv.conversation_id}/messages`
      );
      
      if (!res.ok) throw new Error("Failed to fetch messages");
      
      const data = await res.json();
      setMessages(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch messages:", err);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  // Send message
  const sendMessage = async (e) => {
    e?.preventDefault();
    
    if (!text.trim() || !activeConv || sending) return;

    setSending(true);
    const messageText = text.trim();
    setText(""); // Clear input immediately for better UX

    try {
      const res = await authFetch(
        `/api/conversations/${activeConv.conversation_id}/messages`,
        {
          method: "POST",
          body: JSON.stringify({ content: messageText }),
        }
      );

      if (!res.ok) throw new Error("Failed to send message");

      const newMessage = await res.json();
      
      // Add message to local state
      setMessages((prev) => [...prev, newMessage]);
      
      // Socket will emit to receiver automatically from backend
    } catch (err) {
      console.error("Failed to send message:", err);
      alert("Failed to send message: " + err.message);
      setText(messageText); // Restore text on error
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <Container fluid className="mt-4" style={{ height: "85vh" }}>
      <Row className="g-3 h-100">
        {/* Conversations list */}
        <Col md={4} className="h-100">
          <Card className="h-100 d-flex flex-column">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <span>Conversations</span>
              <Button 
                size="sm" 
                variant="outline-primary"
                onClick={fetchConversations}
              >
                Refresh
              </Button>
            </Card.Header>
            <div className="flex-grow-1 overflow-auto">
              <ListGroup variant="flush">
                {conversations.length === 0 && (
                  <ListGroup.Item className="text-muted text-center py-4">
                    No conversations yet
                  </ListGroup.Item>
                )}
                {conversations.map((conv) => (
                  <ListGroup.Item
                    key={conv.conversation_id}
                    action
                    active={
                      activeConv?.conversation_id === conv.conversation_id
                    }
                    onClick={() => openConversation(conv)}
                    className="d-flex align-items-center gap-2"
                  >
                    <img
                      src={
                        conv.other_user_image ||
                        "https://via.placeholder.com/40"
                      }
                      width={40}
                      height={40}
                      className="rounded-circle"
                      alt={conv.other_user_name}
                    />
                    <div className="flex-grow-1">
                      <div className="fw-bold">
                        {conv.other_user_name || "Unknown User"}
                      </div>
                      {conv.last_message && (
                        <div className="small text-muted text-truncate">
                          {conv.last_message}
                        </div>
                      )}
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </div>
          </Card>
        </Col>

        {/* Active conversation */}
        <Col md={8} className="h-100">
          {activeConv ? (
            <Card className="h-100 d-flex flex-column">
              <Card.Header className="d-flex align-items-center gap-2">
                <img
                  src={
                    activeConv.other_user_image ||
                    "https://via.placeholder.com/40"
                  }
                  width={40}
                  height={40}
                  className="rounded-circle"
                  alt={activeConv.other_user_name}
                />
                <div>
                  <div className="fw-bold">
                    {activeConv.other_user_name || "Unknown User"}
                  </div>
                </div>
              </Card.Header>

              <Card.Body className="flex-grow-1 overflow-auto">
                {loading ? (
                  <div className="text-center py-4">
                    <Spinner animation="border" />
                    <p className="mt-2">Loading messages...</p>
                  </div>
                ) : messages.length === 0 ? (
                  <p className="text-muted text-center py-4">
                    No messages yet. Start the conversation!
                  </p>
                ) : (
                  messages.map((m) => {
                    const isMine = m.sender_uid === user?.uid;
                    
                    return (
                      <div
                        key={m.id}
                        className={`mb-3 d-flex ${
                          isMine ? "justify-content-end" : "justify-content-start"
                        }`}
                      >
                        <div
                          className={`px-3 py-2 rounded ${
                            isMine
                              ? "bg-primary text-white"
                              : "bg-light text-dark"
                          }`}
                          style={{ maxWidth: "70%" }}
                        >
                          <div>{m.content}</div>
                          <small
                            className={`d-block mt-1 ${
                              isMine ? "text-white-50" : "text-muted"
                            }`}
                          >
                            {new Date(m.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </small>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </Card.Body>

              <Card.Footer>
                <Form onSubmit={sendMessage} className="d-flex gap-2">
                  <Form.Control
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Type a message..."
                    disabled={sending}
                  />
                  <Button 
                    type="submit" 
                    disabled={!text.trim() || sending}
                  >
                    {sending ? "..." : "Send"}
                  </Button>
                </Form>
              </Card.Footer>
            </Card>
          ) : (
            <Card className="h-100 d-flex align-items-center justify-content-center">
              <p className="text-muted">
                Select a conversation to start chatting
              </p>
            </Card>
          )}
        </Col>
      </Row>
    </Container>
  );
}