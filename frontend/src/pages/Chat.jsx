import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { getSocket } from "../services/socket";
import api from "../services/api";

const idOf = (v) => String(v?._id || v || "");

const initialsOf = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("") || "?";

export default function Chat() {
  const { userId: receiverId } = useParams();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [other, setOther] = useState(null);
  const [text, setText] = useState("");
  const [otherTyping, setOtherTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);
  const typingHideTimer = useRef(null);
  const lastTypingEmit = useRef(0);

  // Add a message only if we don't already have it.
  const addMessage = (message) =>
    setMessages((prev) =>
      prev.some((m) => m._id === message._id) ? prev : [...prev, message]
    );

  // Load history + the other person's name when the conversation changes.
  useEffect(() => {
    let cancelled = false;
    setMessages([]);
    setOther(null);
    setOtherTyping(false);
    setError("");
    setLoading(true);

    api
      .get(`/users/${receiverId}/messages`)
      .then(({ data }) => {
        if (!cancelled) setMessages(data.messages || []);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.response?.data?.message || "Could not load messages");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    api
      .get(`/users/${receiverId}`)
      .then(({ data }) => {
        if (!cancelled) setOther(data.user || data);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [receiverId]);

  // Live socket listeners.
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleReceive = (message) => {
      if (idOf(message.sender) === receiverId) {
        addMessage(message);
        setOtherTyping(false);
      }
    };
    const handleSent = (message) => {
      if (idOf(message.receiver) === receiverId) addMessage(message);
    };
    const handleTyping = ({ senderId }) => {
      if (String(senderId) !== receiverId) return;
      setOtherTyping(true);
      clearTimeout(typingHideTimer.current);
      typingHideTimer.current = setTimeout(() => setOtherTyping(false), 2000);
    };

    socket.on("chat:receive", handleReceive);
    socket.on("chat:sent", handleSent);
    socket.on("chat:typing", handleTyping);

    return () => {
      socket.off("chat:receive", handleReceive);
      socket.off("chat:sent", handleSent);
      socket.off("chat:typing", handleTyping);
      clearTimeout(typingHideTimer.current);
    };
  }, [receiverId]);

  // Auto-scroll to the newest message.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, otherTyping]);

  const handleSend = (e) => {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    const socket = getSocket();
    if (!socket || !socket.connected) {
      setError("Not connected to chat. Refresh the page and try again.");
      return;
    }
    setError("");
    socket.emit("chat:send", { receiverId, text: body });
    setText("");
  };

  const handleChangeText = (e) => {
    setText(e.target.value);
    const socket = getSocket();
    const now = Date.now();
    // Tell the other side we're typing, at most once every 1.5s.
    if (socket?.connected && now - lastTypingEmit.current > 1500) {
      socket.emit("chat:typing", { receiverId });
      lastTypingEmit.current = now;
    }
  };

  const formatTime = (iso) =>
    iso
      ? new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : "";

  return (
    <div className="chat-page">
      <div className="chat-header">
        <Link to="/directory" className="chat-back" aria-label="Back to developers">
          ←
        </Link>
        <div className="avatar avatar-sm">{initialsOf(other?.name)}</div>
        <div className="chat-header-name">{other?.name || "Chat"}</div>
      </div>

      <div className="chat-messages">
        {loading && <p className="chat-empty">Loading messages…</p>}

        {!loading && messages.length === 0 && !error && (
          <p className="chat-empty">No messages yet. Say hello! 👋</p>
        )}

        {messages.map((m) => {
          const own = idOf(m.sender) === String(user.id);
          return (
            <div key={m._id} className={`chat-bubble ${own ? "own" : "theirs"}`}>
              <span>{m.text}</span>
              <span className="chat-time">{formatTime(m.createdAt)}</span>
            </div>
          );
        })}

        {otherTyping && <div className="chat-typing">Typing…</div>}
        <div ref={bottomRef} />
      </div>

      {error && <p className="form-error">{error}</p>}

      <form className="chat-input-form" onSubmit={handleSend}>
        <input
          value={text}
          onChange={handleChangeText}
          placeholder="Type a message…"
          autoFocus
        />
        <button type="submit" disabled={!text.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}