import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../services/api";

const initialsOf = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "?";

export default function PostCard({ post, onUpdate, onDelete }) {
  const { user } = useAuth();
  const [commentText, setCommentText] = useState("");
  const [error, setError] = useState("");

  const likes = post.likes || [];
  const comments = post.comments || [];
  const liked = likes.includes(user?.id);
  const isOwner =
    post.author?._id && user?.id && String(post.author._id) === String(user.id);

  const handleLike = async () => {
    setError("");
    try {
      const { data } = await api.put(`/posts/${post._id}/like`);
      onUpdate({
        ...post,
        likes: data.liked
          ? [...likes, user.id]
          : likes.filter((id) => id !== user.id),
      });
    } catch (err) {
      setError(err.response?.data?.message || "Could not update like");
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setError("");
    try {
      const { data } = await api.post(`/posts/${post._id}/comments`, {
        text: commentText,
      });
      onUpdate({ ...post, comments: data.comments });
      setCommentText("");
    } catch (err) {
      setError(err.response?.data?.message || "Could not add comment");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this post?")) return;
    setError("");
    try {
      await api.delete(`/posts/${post._id}`);
      onDelete?.(post._id);
    } catch (err) {
      setError(err.response?.data?.message || "Could not delete post");
    }
  };

  return (
    <article className="post-card">
      <header>
        <div className="post-author">
          <div className="avatar avatar-sm">{initialsOf(post.author?.name)}</div>
          {post.author?._id ? (
            <Link to={`/profile/${post.author._id}`} className="post-author-name">
              {post.author.name}
            </Link>
          ) : (
            <strong>{post.author?.name || "Unknown"}</strong>
          )}
        </div>
        <time>{new Date(post.createdAt).toLocaleString()}</time>
      </header>

      <p>{post.content}</p>

      {post.codeSnippet && (
        <pre className="post-code">
          <code>{post.codeSnippet}</code>
        </pre>
      )}

      {post.tags?.length > 0 && (
        <div className="skill-tags">
          {post.tags.map((t) => (
            <span key={t} className="skill-tag">#{t}</span>
          ))}
        </div>
      )}

      <div className="post-actions">
        <button onClick={handleLike} className={liked ? "liked" : ""}>
          ▲ {likes.length}
        </button>
        <span>
          {comments.length} {comments.length === 1 ? "comment" : "comments"}
        </span>
        {isOwner && (
          <button className="post-delete" onClick={handleDelete}>
            Delete
          </button>
        )}
      </div>

      {error && <p className="form-error">{error}</p>}

      {comments.length > 0 && (
        <ul className="post-comments">
          {comments.map((c) => (
            <li key={c._id}>
              <strong>{c.author?.name}: </strong>
              {c.text}
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleComment} className="comment-form">
        <input
          placeholder="Write a comment…"
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
        />
        <button type="submit">Post</button>
      </form>
    </article>
  );
}