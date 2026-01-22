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
  Alert,
} from "react-bootstrap";
import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { authFetch } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import { getDatabase, ref, onValue, off, onChildAdded, onChildChanged } from "firebase/database";

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
  const [typingUsers, setTypingUsers] = useState({});
  const [onlineUsers, setOnlineUsers] = useState({});
  const [showConversations, setShowConversations] = useState(true);
  
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Set user online status
  useEffect(() => {
    if (!user?.uid) return;

    authFetch("/api/chats/online", {
      method: "POST",
      body: JSON.stringify({ isOnline: true }),
    }).catch(console.error);

    return () => {
      authFetch("/api/chats/online", {
        method: "POST",
        body: JSON.stringify({ isOnline: false }),
      }).catch(console.error);
    };
  }, [user?.uid]);

  // Listen for presence (online/offline)
  useEffect(() => {
    if (!user?.uid) return;

    const db = getDatabase();
    const presenceRef = ref(db, 'presence');
    
    const unsubscribe = onValue(presenceRef, (snapshot) => {
      const data = snapshot.val();
      setOnlineUsers(data || {});
    }, (error) => {
      console.error("Firebase presence listener error:", error);
    });

    return () => {
      off(presenceRef);
    };
  }, [user?.uid]);

  // Listen for notifications
  useEffect(() => {
    if (!user?.uid) return;

    const db = getDatabase();
    const notificationsRef = ref(db, `notifications/${user.uid}`);
    
    const unsubscribe = onChildAdded(notificationsRef, (snapshot) => {
      const notif = snapshot.val();
      if (notif && !notif.read) {
        setNotifications(prev => [
          ...prev,
          {
            id: snapshot.key,
            ...notif,
          }
        ]);

        setTimeout(() => {
          setNotifications(prev => prev.filter(n => n.id !== snapshot.key));
        }, 5000);
      }
    }, (error) => {
      console.error("Firebase notifications listener error:", error);
    });

    return () => {
      off(notificationsRef);
    };
  }, [user?.uid]);

  // Listen for unread counts
  useEffect(() => {
    if (!user?.uid) return;

    const db = getDatabase();
    const unreadRef = ref(db, `unread/${user.uid}`);
    
    const unsubscribe = onValue(unreadRef, (snapshot) => {
      const data = snapshot.val();
      setUnreadCounts(data || {});
    }, (error) => {
      console.error("Firebase unread listener error:", error);
    });

    return () => {
      off(unreadRef);
    };
  }, [user?.uid]);

  // Listen for real-time messages in active conversation
  useEffect(() => {
    if (!activeConv?.conversation_id || !user?.uid) return;

    const db = getDatabase();
    const messagesRef = ref(db, `messages/${activeConv.conversation_id}`);
    
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const msgArray = Object.entries(data).map(([key, msg]) => ({
          id: key,
          sender_uid: msg.senderUid,
          content: msg.content,
          created_at: msg.createdAt,
          timestamp: msg.timestamp || 0,
        })).sort((a, b) => a.timestamp - b.timestamp);
        
        setMessages(msgArray);
        setTimeout(scrollToBottom, 100);
      } else {
        setMessages([]);
      }
    }, (error) => {
      console.error("Firebase messages listener error:", error);
    });

    markAsRead(activeConv.conversation_id);

    return () => {
      off(messagesRef);
    };
  }, [activeConv?.conversation_id, user?.uid]);

  // Listen for typing indicators in active conversation
  useEffect(() => {
    if (!activeConv?.conversation_id || !user?.uid) return;

    const db = getDatabase();
    const typingRef = ref(db, `typing/${activeConv.conversation_id}`);
    
    const unsubscribe = onValue(typingRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const now = Date.now();
        const activeTypers = Object.entries(data)
          .filter(([uid, info]) => {
            return uid !== user.uid && 
                   info?.isTyping && 
                   (now - (info.timestamp || 0)) < 3000;
          })
          .map(([uid]) => uid);
        
        setTypingUsers(prev => ({
          ...prev,
          [activeConv.conversation_id]: activeTypers.length > 0 ? activeTypers[0] : null
        }));
      } else {
        setTypingUsers(prev => ({
          ...prev,
          [activeConv.conversation_id]: null
        }));
      }
    }, (error) => {
      console.error("Firebase typing listener error:", error);
    });

    return () => {
      off(typingRef);
    };
  }, [activeConv?.conversation_id, user?.uid]);

  // Fetch conversations list
  const fetchConversations = async () => {
    try {
      const res = await authFetch("/api/chats");
      if (!res.ok) throw new Error("Failed to fetch conversations");
      
      const data = await res.json();
      setConversations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch conversations:", err);
      setConversations([]);
    }
  };

  useEffect(() => {
    if (user?.uid) {
      fetchConversations();
    }
  }, [user?.uid]);

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
    setShowConversations(false); // Hide conversation list on mobile when opening chat
    
    try {
      await markAsRead(conv.conversation_id);
    } catch (err) {
      console.error("Failed to open conversation:", err);
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
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  // Handle typing indicator
  const handleTyping = () => {
    if (!activeConv) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    authFetch(`/api/chats/${activeConv.conversation_id}/typing`, {
      method: "POST",
      body: JSON.stringify({ isTyping: true }),
    }).catch(console.error);

    typingTimeoutRef.current = setTimeout(() => {
      authFetch(`/api/chats/${activeConv.conversation_id}/typing`, {
        method: "POST",
        body: JSON.stringify({ isTyping: false }),
      }).catch(console.error);
    }, 1000);
  };

  // Send message
  const sendMessage = async (e) => {
    e?.preventDefault();
    
    if (!text.trim() || !activeConv || sending) return;

    setSending(true);
    const messageText = text.trim();
    setText("");

    try {
      const res = await authFetch("/api/chats/send", {
        method: "POST",
        body: JSON.stringify({ 
          receiverUid: activeConv.other_user_uid,
          content: messageText,
          conversationId: activeConv.conversation_id,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to send message");
      }

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
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

  // Back to conversations (mobile)
  const handleBackToConversations = () => {
    setShowConversations(true);
    setActiveConv(null);
  };

  // Get total unread count
  const totalUnread = Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);

  // Check if other user is online
  const isOtherUserOnline = activeConv && 
    onlineUsers[activeConv.other_user_uid]?.online;

  // Check if other user is typing
  const isOtherUserTyping = activeConv && 
    typingUsers[activeConv.conversation_id];

  return (
    <Container className="py-3 mb-3" style={{ maxWidth: "1400px" }}>
      {/* Notification Alerts */}
      {notifications.length > 0 && (
        <div style={{ 
          position: "fixed", 
          top: 70, 
          right: 10, 
          left: 10,
          zIndex: 9999, 
          maxWidth: 400,
          marginLeft: "auto",
        }}>
          {notifications.slice(0, 3).map((notif) => (
            <Alert
              key={notif.id}
              variant="info"
              dismissible
              onClose={() => dismissNotification(notif.id)}
              className="mb-2"
              style={{ cursor: "pointer" }}
              onClick={() => {
                if (notif.conversationId) {
                  navigate(`/messages/${notif.conversationId}`);
                }
                dismissNotification(notif.id);
              }}
            >
              {notif.message}
            </Alert>
          ))}
        </div>
      )}

      <Row className="g-3" style={{ height: "calc(100vh - 150px)", minHeight: "600px" }}>
        {/* Conversations list */}
        <Col 
          xs={12} 
          md={4} 
          lg={4}
          xl={3}
          className={`h-100 ${showConversations ? 'd-block' : 'd-none d-md-block'}`}
        >
          <Card className="h-100 d-flex flex-column shadow-sm">
            <Card.Header className="d-flex justify-content-between align-items-center bg-white border-bottom">
              <span className="fw-semibold">
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
                  const isOnline = onlineUsers[conv.other_user_uid]?.online;
                  
                  return (
                    <ListGroup.Item
                      key={conv.conversation_id}
                      action
                      active={
                        activeConv?.conversation_id === conv.conversation_id
                      }
                      onClick={() => openConversation(conv)}
                      className="d-flex align-items-center gap-2 py-3"
                    >
                      <div style={{ position: "relative" }}>
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
                        {isOnline && (
                          <span
                            style={{
                              position: "absolute",
                              bottom: 0,
                              right: 0,
                              width: 12,
                              height: 12,
                              backgroundColor: "#28a745",
                              borderRadius: "50%",
                              border: "2px solid white",
                            }}
                          />
                        )}
                      </div>
                      <div className="flex-grow-1 overflow-hidden">
                        <div className="d-flex justify-content-between align-items-center">
                          <div className="fw-bold text-truncate">
                            {conv.other_user_name || "Unknown User"}
                          </div>
                          {unreadCount > 0 && (
                            <Badge bg="danger" pill>
                              {unreadCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </ListGroup.Item>
                  );
                })}
              </ListGroup>
            </div>
          </Card>
        </Col>

        {/* Active conversation */}
        <Col 
          xs={12} 
          md={8}
          lg={8}
          xl={9}
          className={`h-100 ${!showConversations ? 'd-block' : 'd-none d-md-block'}`}
        >
          {activeConv ? (
            <Card className="h-100 d-flex flex-column shadow-sm">
              <Card.Header className="d-flex align-items-center gap-2 bg-white border-bottom">
                {/* Back button for mobile */}
                <Button
                  variant="link"
                  className="d-md-none p-0 text-decoration-none"
                  onClick={handleBackToConversations}
                >
                  <svg width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                    <path fillRule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z"/>
                  </svg>
                </Button>
                
                <div style={{ position: "relative" }}>
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
                  {isOtherUserOnline && (
                    <span
                      style={{
                        position: "absolute",
                        bottom: 0,
                        right: 0,
                        width: 12,
                        height: 12,
                        backgroundColor: "#28a745",
                        borderRadius: "50%",
                        border: "2px solid white",
                      }}
                    />
                  )}
                </div>
                <div className="flex-grow-1 overflow-hidden">
                  <div className="fw-bold text-truncate">
                    {activeConv.other_user_name || "Unknown User"}
                  </div>
                  <small className="text-muted">
                    {isOtherUserOnline ? "Online" : "Offline"}
                  </small>
                </div>
              </Card.Header>

              <Card.Body className="flex-grow-1 overflow-auto p-3" style={{ backgroundColor: "#f8f9fa" }}>
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
                  <>
                    {messages.map((m) => {
                      const isMine = m.sender_uid === user?.uid;
                      
                      return (
                        <div
                          key={m.id}
                          className={`mb-3 d-flex ${
                            isMine ? "justify-content-end" : "justify-content-start"
                          }`}
                        >
                          <div
                            className={`px-3 py-2 rounded-3 ${
                              isMine
                                ? "bg-primary text-white"
                                : "bg-white text-dark"
                            }`}
                            style={{ 
                              maxWidth: "70%",
                              wordBreak: "break-word",
                              boxShadow: "0 1px 2px rgba(0,0,0,0.1)"
                            }}
                          >
                            <div>{m.content}</div>
                            <small
                              className={`d-block mt-1 ${
                                isMine ? "text-white-50" : "text-muted"
                              }`}
                              style={{ fontSize: "0.7rem" }}
                            >
                              {new Date(m.created_at).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </small>
                          </div>
                        </div>
                      );
                    })}
                    {isOtherUserTyping && (
                      <div className="mb-3 d-flex justify-content-start">
                        <div className="px-3 py-2 rounded-3 bg-white text-dark" style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.1)" }}>
                          <small className="text-muted">typing...</small>
                        </div>
                      </div>
                    )}
                  </>
                )}
                <div ref={messagesEndRef} />
              </Card.Body>

              <Card.Footer className="p-3 bg-white border-top">
                <Form onSubmit={sendMessage} className="d-flex gap-2">
                  <Form.Control
                    value={text}
                    onChange={(e) => {
                      setText(e.target.value);
                      handleTyping();
                    }}
                    placeholder="Type a message..."
                    disabled={sending}
                    className="flex-grow-1"
                    style={{ borderRadius: "20px" }}
                  />
                  <Button 
                    type="submit" 
                    disabled={!text.trim() || sending}
                    style={{ borderRadius: "20px", minWidth: "80px" }}
                  >
                    {sending ? "..." : "Send"}
                  </Button>
                </Form>
              </Card.Footer>
            </Card>
          ) : (
            <Card className="h-100 d-none d-md-flex align-items-center justify-content-center shadow-sm">
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