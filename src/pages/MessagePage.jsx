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
import { getDatabase, ref, onValue, off } from "firebase/database";
import { getSocket } from "../services/socket";

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
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [socketConnected, setSocketConnected] = useState(false);
  
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Initialize Socket.io (optional - graceful degradation)
  useEffect(() => {
    if (!user?.uid) return;

    const initSocket = async () => {
      try {
        const socket = await getSocket();
        
        if (!socket) {
          console.log("Running in Firebase-only mode (no Socket.io)");
          return;
        }

        socketRef.current = socket;
        setSocketConnected(true);

        // Listen for new messages
        socket.on("new_message", (data) => {
          const { conversationId: msgConvId, message } = data;
          
          // Show notification if not in active conversation
          if (!activeConv || activeConv.conversation_id !== msgConvId) {
            setNotifications(prev => [
              ...prev,
              {
                id: Date.now(),
                message: `New message from ${message.sender_name}!`,
                conversationId: msgConvId,
              }
            ]);
          }

          // Refresh conversations list
          fetchConversations();
        });

        // Listen for notifications
        socket.on("notification", (data) => {
          setNotifications(prev => [
            ...prev,
            {
              id: data.timestamp,
              message: data.message,
              conversationId: data.conversationId,
            }
          ]);
        });

        // Listen for typing indicator
        socket.on("user_typing", (data) => {
          const { conversationId: typingConvId, userUid, isTyping } = data;
          
          if (activeConv && activeConv.conversation_id === typingConvId) {
            setTypingUsers(prev => ({
              ...prev,
              [typingConvId]: isTyping ? userUid : null
            }));
          }
        });

        // Listen for messages seen
        socket.on("messages_seen", (data) => {
          const { conversationId: seenConvId } = data;
          console.log(`Messages seen in conversation ${seenConvId}`);
        });

        // Listen for online/offline status
        socket.on("user_online", (data) => {
          setOnlineUsers(prev => new Set([...prev, data.userId]));
        });

        socket.on("user_offline", (data) => {
          setOnlineUsers(prev => {
            const newSet = new Set(prev);
            newSet.delete(data.userId);
            return newSet;
          });
        });

      } catch (error) {
        console.warn("Socket.io features disabled:", error.message);
      }
    };

    initSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.off("new_message");
        socketRef.current.off("notification");
        socketRef.current.off("user_typing");
        socketRef.current.off("messages_seen");
        socketRef.current.off("user_online");
        socketRef.current.off("user_offline");
      }
    };
  }, [user?.uid]);

  // Initialize Firebase listeners for unread counts
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
    
    // Listen for real-time updates
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

    // Mark as read when opening conversation
    markAsRead(activeConv.conversation_id);

    // Join conversation room via socket (if available)
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit("join_conversation", activeConv.conversation_id);
    }

    return () => {
      off(messagesRef);
      
      // Leave conversation room (if socket available)
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit("leave_conversation", activeConv.conversation_id);
      }
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
    
    try {
      // Messages will be loaded via Firebase listener
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

  // Handle typing indicator (only if socket connected)
  const handleTyping = () => {
    if (!activeConv || !socketConnected) return;

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Send typing started
    authFetch(`/api/chats/${activeConv.conversation_id}/typing`, {
      method: "POST",
      body: JSON.stringify({ isTyping: true }),
    }).catch(console.error);

    // Set timeout to send typing stopped
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

      // Stop typing indicator (if socket available)
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      if (socketConnected) {
        authFetch(`/api/chats/${activeConv.conversation_id}/typing`, {
          method: "POST",
          body: JSON.stringify({ isTyping: false }),
        }).catch(console.error);
      }

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

  // Get total unread count
  const totalUnread = Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);

  // Check if other user is online (only if socket connected)
  const isOtherUserOnline = socketConnected && activeConv && onlineUsers.has(activeConv.other_user_uid);

  // Check if other user is typing (only if socket connected)
  const isOtherUserTyping = socketConnected && activeConv && typingUsers[activeConv.conversation_id];

  return (
    <Container fluid className="mt-4" style={{ height: "85vh" }}>
      {/* Notification Alerts */}
      {notifications.length > 0 && (
        <div style={{ position: "fixed", top: 70, right: 20, zIndex: 9999, maxWidth: 400 }}>
          {notifications.slice(0, 3).map((notif) => (
            <Alert
              key={notif.id}
              variant="info"
              dismissible
              onClose={() => dismissNotification(notif.id)}
              className="mb-2"
              style={{ cursor: "pointer" }}
              onClick={() => {
                navigate(`/messages/${notif.conversationId}`);
                dismissNotification(notif.id);
              }}
            >
              {notif.message}
            </Alert>
          ))}
        </div>
      )}

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
                  const isOnline = socketConnected && onlineUsers.has(conv.other_user_uid);
                  
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
                <div>
                  <div className="fw-bold">
                    {activeConv.other_user_name || "Unknown User"}
                  </div>
                  {socketConnected && (
                    <small className="text-muted">
                      {isOtherUserOnline ? "Online" : "Offline"}
                    </small>
                  )}
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
                        <div className="px-3 py-2 rounded bg-light text-dark">
                          <small className="text-muted">typing...</small>
                        </div>
                      </div>
                    )}
                  </>
                )}
                <div ref={messagesEndRef} />
              </Card.Body>

              <Card.Footer>
                <Form onSubmit={sendMessage} className="d-flex gap-2">
                  <Form.Control
                    value={text}
                    onChange={(e) => {
                      setText(e.target.value);
                      if (socketConnected) {
                        handleTyping();
                      }
                    }}
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