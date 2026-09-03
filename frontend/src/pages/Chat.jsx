/**
 * Chat Page
 *
 * Real-time one-to-one messaging with:
 *   - Sidebar: list of users to chat with (from directory)
 *   - Main panel: message thread with selected user
 *   - Typing indicator + online/offline presence badges
 *   - Auto-scroll to newest message
 *
 * Socket.io handles real-time delivery; messages are also persisted
 * in MongoDB (loaded via REST on conversation open).
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createSocket } from '../services/socket';
import api from '../services/api';
import {
  HiOutlinePaperAirplane,
  HiOutlineMagnifyingGlass,
  HiOutlineUser,
  HiOutlineChatBubbleLeftRight,
} from 'react-icons/hi2';

export default function Chat() {
  const { userId: paramUserId } = useParams();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  // State
  const [contacts, setContacts]           = useState([]);
  const [filteredContacts, setFiltered]   = useState([]);
  const [contactSearch, setContactSearch] = useState('');
  const [selectedUser, setSelectedUser]   = useState(null);
  const [messages, setMessages]           = useState([]);
  const [msgText, setMsgText]             = useState('');
  const [onlineUsers, setOnlineUsers]     = useState(new Set());
  const [typingUser, setTypingUser]       = useState(null);
  const [loading, setLoading]             = useState(false);

  const socketRef       = useRef(null);
  const messagesEndRef  = useRef(null);
  const typingTimeoutRef = useRef(null);

  // ── Auto-scroll to bottom when messages change ───────────────────
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // ── Load contacts ────────────────────────────────────────────────
  useEffect(() => {
    const loadContacts = async () => {
      try {
        const res = await api.get('/users');
        // Filter out the current user.
        const others = res.data.data.filter((u) => u._id !== currentUser?._id);
        setContacts(others);
        setFiltered(others);
      } catch (err) {
        console.error('Failed to load contacts:', err);
      }
    };
    loadContacts();
  }, [currentUser]);

  // ── Filter contacts by search ────────────────────────────────────
  useEffect(() => {
    if (!contactSearch.trim()) {
      setFiltered(contacts);
    } else {
      const q = contactSearch.toLowerCase();
      setFiltered(
        contacts.filter(
          (u) =>
            u.name.toLowerCase().includes(q) ||
            u.skills?.some((s) => s.toLowerCase().includes(q))
        )
      );
    }
  }, [contactSearch, contacts]);

  // ── Socket.io connection ─────────────────────────────────────────
  useEffect(() => {
    const socket = createSocket();
    if (!socket) return;

    socketRef.current = socket;

    // Presence: full list on connect.
    socket.on('presence:list', (userIds) => {
      setOnlineUsers(new Set(userIds));
    });

    // Presence: individual updates.
    socket.on('presence:update', ({ userId, isOnline }) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        isOnline ? next.add(userId) : next.delete(userId);
        return next;
      });
    });

    // Incoming message from someone else.
    socket.on('chat:receive', (message) => {
      // Only add to the current thread if it's from the selected user.
      setMessages((prev) => {
        if (
          message.sender?._id === selectedUser?._id ||
          message.sender === selectedUser?._id
        ) {
          return [...prev, message];
        }
        return prev;
      });
      setTypingUser(null);
    });

    // Echo of our own sent message.
    socket.on('chat:sent', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    // Typing indicator.
    socket.on('chat:typing', ({ senderId }) => {
      setTypingUser(senderId);
      // Clear after 2 seconds of inactivity.
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => setTypingUser(null), 2000);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Update socket listener when selected user changes ───────────
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    // Re-register the receive handler with the current selectedUser in scope.
    const handleReceive = (message) => {
      const senderId = message.sender?._id || message.sender;
      if (senderId === selectedUser?._id) {
        setMessages((prev) => [...prev, message]);
        setTypingUser(null);
      }
    };

    socket.off('chat:receive');
    socket.on('chat:receive', handleReceive);

    return () => {
      socket.off('chat:receive', handleReceive);
    };
  }, [selectedUser]);

  // ── Auto-select user from URL param ──────────────────────────────
  useEffect(() => {
    if (paramUserId && contacts.length > 0) {
      const contact = contacts.find((u) => u._id === paramUserId);
      if (contact) {
        setSelectedUser(contact);
      }
    }
  }, [paramUserId, contacts]);

  // ── Load chat history when a user is selected ────────────────────
  useEffect(() => {
    if (!selectedUser) return;

    const loadHistory = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/users/${selectedUser._id}/messages`);
        setMessages(res.data.data);
      } catch (err) {
        console.error('Failed to load chat history:', err);
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [selectedUser]);

  // ── Select a contact ─────────────────────────────────────────────
  const handleSelectUser = (contact) => {
    setSelectedUser(contact);
    setMessages([]);
    setTypingUser(null);
    navigate(`/chat/${contact._id}`, { replace: true });
  };

  // ── Send a message ───────────────────────────────────────────────
  const handleSend = (e) => {
    e.preventDefault();
    if (!msgText.trim() || !selectedUser || !socketRef.current) return;

    socketRef.current.emit('chat:send', {
      receiverId: selectedUser._id,
      text: msgText.trim(),
    });

    setMsgText('');
  };

  // ── Emit typing indicator ────────────────────────────────────────
  const handleTyping = () => {
    if (!selectedUser || !socketRef.current) return;
    socketRef.current.emit('chat:typing', {
      receiverId: selectedUser._id,
    });
  };

  // ── Helper: format message time ──────────────────────────────────
  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="chat-page">
      {/* ── Sidebar: Contacts ────────────────────────────────────── */}
      <aside className={`chat-sidebar ${selectedUser ? 'mobile-hidden' : ''}`} id="chat-sidebar">
        <div className="sidebar-header">
          <h2>Messages</h2>
        </div>

        <div className="sidebar-search">
          <HiOutlineMagnifyingGlass className="search-icon" />
          <input
            type="text"
            placeholder="Search contacts…"
            value={contactSearch}
            onChange={(e) => setContactSearch(e.target.value)}
            id="contact-search"
          />
        </div>

        <div className="contacts-list">
          {filteredContacts.map((contact) => (
            <button
              key={contact._id}
              className={`contact-item ${selectedUser?._id === contact._id ? 'active' : ''}`}
              onClick={() => handleSelectUser(contact)}
              id={`contact-${contact._id}`}
            >
              <div className="contact-avatar-wrap">
                <img
                  src={contact.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(contact.name)}&background=3b82f6&color=fff&size=40`}
                  alt={contact.name}
                  className="contact-avatar"
                />
                {onlineUsers.has(contact._id) && (
                  <span className="online-badge" />
                )}
              </div>
              <div className="contact-info">
                <span className="contact-name">{contact.name}</span>
                <span className="contact-status">
                  {onlineUsers.has(contact._id) ? 'Online' : 'Offline'}
                </span>
              </div>
            </button>
          ))}
        </div>
      </aside>

      {/* ── Main: Chat Thread ────────────────────────────────────── */}
      <div className={`chat-main ${!selectedUser ? 'mobile-hidden' : ''}`}>
        {selectedUser ? (
          <>
            {/* Chat header */}
            <div className="chat-header" id="chat-header">
              <button
                className="chat-back-btn"
                onClick={() => {
                  setSelectedUser(null);
                  navigate('/chat', { replace: true });
                }}
              >
                ←
              </button>
              <img
                src={selectedUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedUser.name)}&background=3b82f6&color=fff&size=36`}
                alt={selectedUser.name}
                className="chat-header-avatar"
              />
              <div className="chat-header-info">
                <span className="chat-header-name">{selectedUser.name}</span>
                <span className={`chat-header-status ${onlineUsers.has(selectedUser._id) ? 'online' : ''}`}>
                  {onlineUsers.has(selectedUser._id) ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>

            {/* Messages */}
            <div className="chat-messages" id="chat-messages">
              {loading ? (
                <div className="feed-loading">
                  <div className="spinner" />
                  <p>Loading messages…</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="chat-empty">
                  <HiOutlineUser className="chat-empty-icon" />
                  <p>No messages yet. Say hello to {selectedUser.name.split(' ')[0]}!</p>
                </div>
              ) : (
                messages.map((msg, i) => {
                  const senderId = msg.sender?._id || msg.sender;
                  const isMine = senderId === currentUser?._id;
                  return (
                    <div
                      key={msg._id || i}
                      className={`message-bubble ${isMine ? 'mine' : 'theirs'}`}
                    >
                      <p className="message-text">{msg.text}</p>
                      <span className="message-time">{formatTime(msg.createdAt)}</span>
                    </div>
                  );
                })
              )}

              {/* Typing indicator */}
              {typingUser === selectedUser?._id && (
                <div className="typing-indicator">
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Message input */}
            <form className="chat-input-form" onSubmit={handleSend} id="chat-input-form">
              <input
                type="text"
                className="chat-input"
                placeholder="Type a message…"
                value={msgText}
                onChange={(e) => {
                  setMsgText(e.target.value);
                  handleTyping();
                }}
                id="chat-input"
              />
              <button
                type="submit"
                className="chat-send-btn"
                disabled={!msgText.trim()}
                id="chat-send"
              >
                <HiOutlinePaperAirplane />
              </button>
            </form>
          </>
        ) : (
          <div className="chat-placeholder">
            <HiOutlineChatBubbleLeftRight className="chat-placeholder-icon" />
            <h2>Select a conversation</h2>
            <p>Choose a developer from the sidebar to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
}


