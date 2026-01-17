import {
  Container,
  Row,
  Col,
  ListGroup,
  Form,
  Button,
  Card,
  Spinner,
  Badge,
  Toast,
  ToastContainer,
} from "react-bootstrap";
import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { authFetch } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import { getDatabase, ref, onValue, push, set, get, off } from "firebase/database";

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
  const [unreadCounts, setUnreadCounts] = useState({});
  const [notifications, setNotifications] = useState([]);
  
  const messagesEndRef = useRef(null);
  const audioRef = useRef(null);

  // Scroll to bottom
  const scrollToBottom = () =>
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

  // Play notification sound
  const playNotificationSound = () => {
    if (audioRef.current) {
      audioRef.current.play().catch(e => console.log("Audio play failed:", e));
    }
  };

  // Initialize Firebase listeners
  useEffect(() => {
    if (!user?.uid) return;

    const db = getDatabase();

    // Listen for new notifications
    const notificationsRef = ref(db, `notifications/${user.uid}`);
    const unsubscribeNotifications = onValue(notificationsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const notifArray = Object.entries(data).map(([key, val]) => ({
          id: key,
          ...val,
        }));
        
        // Show only unread notifications
        const unread = notifArray.filter(n => !n.read);
        setNotifications(unread);
        
        // Play sound for new messages
        if (unread.length > 0) {
          playNotificationSound();
        }
      }
    });

    // Listen for unread counts
    const unreadRef = ref(db, `unread/${user.uid}`);
    const unsubscribeUnread = onValue(unreadRef, (snapshot) => {
      const data = snapshot.val();
      setUnreadCounts(data || {});
    });

    return () => {
      off(notificationsRef);
      off(unreadRef);
    };
  }, [user?.uid]);

  // Listen for real-time messages in active conversation
  useEffect(() => {
    if (!activeConv?.id || !user?.uid) return;

    const db = getDatabase();
    const messagesRef = ref(db, `messages/${activeConv.id}`);
    
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const msgArray = Object.values(data)
          .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        
        // Update messages state
        setMessages(msgArray.map(msg => ({
          id: msg.id,
          chat_id: msg.chatId,
          sender_uid: msg.senderUid,
          content: msg.content,
          created_at: msg.createdAt,
        })));
      }
    });

    // Mark as read when opening conversation
    markAsRead(activeConv.id);

    return () => {
      off(messagesRef);
    };
  }, [activeConv?.id, user?.uid]);

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
      
      // Mark as read
      await markAsRead(conv.conversation_id);
    } catch (err) {
      console.error("Failed to fetch messages:", err);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  // Mark conversation as read
  const markAsRead = async (chatId) => {
    try {
      await authFetch(`/api/chats/${chatId}/read`, {
        method: "POST",
      });
      
      // Clear notifications for this chat
      const db = getDatabase();
      const notificationsRef = ref(db, `notifications/${user.uid}`);
      const snapshot = await get(notificationsRef);
      const data = snapshot.val();
      
      if (data) {
        Object.entries(data).forEach(([key, val]) => {
          if (val.chatId === chatId) {
            set(ref(db, `notifications/${user.uid}/${key}`), null);
          }
        });
      }
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  // Send message
  const sendMessage = async (e) => {
    e?.preventDefault();
    
    if (!text.trim() || !activeConv || sending) return;

    setSending(true);
    const messageText = text.trim();
    setText("");

    try {
      const res = await authFetch(
        `/api/conversations/${activeConv.conversation_id}/messages`,
        {
          method: "POST",
          body: JSON.stringify({ content: messageText }),
        }
      );

      if (!res.ok) throw new Error("Failed to send message");

      // Message will appear via Firebase listener
    } catch (err) {
      console.error("Failed to send message:", err);
      alert("Failed to send message: " + err.message);
      setText(messageText);
    } finally {
      setSending(false);
    }
  };

  // Dismiss notification
  const dismissNotification = (notifId) => {
    setNotifications(prev => prev.filter(n => n.id !== notifId));
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Get total unread count
  const totalUnread = Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);

  return (
    <Container fluid className="mt-4" style={{ height: "85vh" }}>
      {/* Notification Sound */}
      <audio ref={audioRef} src="/notification.mp3" preload="auto" />
      
      {/* Notification Toasts */}
      <ToastContainer position="top-end" className="p-3" style={{ zIndex: 9999 }}>
        {notifications.slice(0, 3).map((notif) => (
          <Toast
            key={notif.id}
            onClose={() => dismissNotification(notif.id)}
            delay={5000}
            autohide
          >
            <Toast.Header>
              <strong className="me-auto">New Message</strong>
              <small>just now</small>
            </Toast.Header>
            <Toast.Body>{notif.content}</Toast.Body>
          </Toast>
        ))}
      </ToastContainer>

      <Row className="g-3 h-100">
        {/* Conversations list */}
        <Col md={4} className="h-100">
          <Card className="h-100 d-flex flex-column">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <span>
                Conversations
                {totalUnread > 0 && (
                  <Badge bg="danger" className="ms-2">
                    {totalUnread}
                  </Badge>
                )}
              </span>
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
                {conversations.map((conv) => {
                  const unreadCount = unreadCounts[conv.conversation_id] || 0;
                  
                  return (
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
                        <div className="d-flex justify-content-between align-items-center">
                          <div className="fw-bold">
                            {conv.other_user_name || "Unknown User"}
                          </div>
                          {unreadCount > 0 && (
                            <Badge bg="danger" pill>
                              {unreadCount}
                            </Badge>
                          )}
                        </div>
                        {conv.last_message && (
                          <div className="small text-muted text-truncate">
                            {conv.last_message}
                          </div>
                        )}
                      </div>
                    </ListGroup.Item>
                  );
                })}
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