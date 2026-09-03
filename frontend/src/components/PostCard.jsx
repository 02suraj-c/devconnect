/**
 * PostCard Component
 *
 * Renders a single feed post with:
 *   - Author avatar + name
 *   - Post text + optional code snippet
 *   - Tags as coloured chips
 *   - Like button with count (toggleable)
 *   - Expandable comment section
 *   - Relative timestamps ("2 hours ago")
 *
 * The component is fully controlled — like/comment actions bubble up
 * to the parent (Feed page) via callbacks, keeping PostCard stateless
 * with respect to API calls.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  HiOutlineHeart,
  HiHeart,
  HiOutlineChatBubbleLeft,
  HiOutlineTrash,
  HiOutlineCodeBracket,
} from 'react-icons/hi2';

/**
 * Formats an ISO date string as a relative time (e.g. "3h ago").
 */
function timeAgo(dateStr) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  const intervals = [
    { label: 'y', seconds: 31536000 },
    { label: 'mo', seconds: 2592000 },
    { label: 'w', seconds: 604800 },
    { label: 'd', seconds: 86400 },
    { label: 'h', seconds: 3600 },
    { label: 'm', seconds: 60 },
  ];

  for (const { label, seconds: s } of intervals) {
    const count = Math.floor(seconds / s);
    if (count >= 1) return `${count}${label} ago`;
  }
  return 'just now';
}

export default function PostCard({
  post,
  currentUserId,
  onLike,
  onComment,
  onDelete,
}) {
  const [commentText, setCommentText] = useState('');
  const [showComments, setShowComments] = useState(false);

  const isLiked = post.likes?.some(
    (id) => (typeof id === 'string' ? id : id?._id || id) === currentUserId
  );
  const isOwner = post.author?._id === currentUserId;

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onComment(post._id, commentText.trim());
    setCommentText('');
  };

  return (
    <article className="post-card" id={`post-${post._id}`}>
      {/* ── Header: author info + timestamp ──────────────────────── */}
      <div className="post-header">
        <Link to={`/profile/${post.author?._id}`} className="post-author">
          <img
            src={post.author?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author?.name || 'U')}&background=3b82f6&color=fff&size=40`}
            alt={post.author?.name}
            className="post-avatar"
          />
          <div>
            <span className="post-author-name">{post.author?.name}</span>
            <span className="post-time">{timeAgo(post.createdAt)}</span>
          </div>
        </Link>

        {isOwner && (
          <button
            className="post-delete-btn"
            onClick={() => onDelete(post._id)}
            title="Delete post"
          >
            <HiOutlineTrash />
          </button>
        )}
      </div>

      {/* ── Body: text + code snippet ────────────────────────────── */}
      <div className="post-body">
        <p className="post-text">{post.text}</p>

        {post.codeSnippet && (
          <div className="post-code-block">
            <div className="code-block-header">
              <HiOutlineCodeBracket />
              <span>Code Snippet</span>
            </div>
            <pre className="code-content">
              <code>{post.codeSnippet}</code>
            </pre>
          </div>
        )}

        {/* Tags */}
        {post.tags?.length > 0 && (
          <div className="post-tags">
            {post.tags.map((tag, i) => (
              <span key={i} className="post-tag">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Actions: like + comment toggle ───────────────────────── */}
      <div className="post-actions">
        <button
          className={`post-action-btn like-btn ${isLiked ? 'liked' : ''}`}
          onClick={() => onLike(post._id)}
          id={`like-btn-${post._id}`}
        >
          {isLiked ? <HiHeart /> : <HiOutlineHeart />}
          <span>{post.likes?.length || 0}</span>
        </button>

        <button
          className="post-action-btn comment-btn"
          onClick={() => setShowComments((prev) => !prev)}
          id={`comment-toggle-${post._id}`}
        >
          <HiOutlineChatBubbleLeft />
          <span>{post.comments?.length || 0}</span>
        </button>
      </div>

      {/* ── Comments section (expandable) ────────────────────────── */}
      {showComments && (
        <div className="post-comments">
          {/* Existing comments */}
          {post.comments?.length > 0 && (
            <div className="comments-list">
              {post.comments.map((comment) => (
                <div key={comment._id} className="comment-item">
                  <Link to={`/profile/${comment.user?._id}`} className="comment-author">
                    <img
                      src={comment.user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.user?.name || 'U')}&background=8b5cf6&color=fff&size=28`}
                      alt={comment.user?.name}
                      className="comment-avatar"
                    />
                    <span className="comment-author-name">{comment.user?.name}</span>
                  </Link>
                  <p className="comment-text">{comment.text}</p>
                  <span className="comment-time">{timeAgo(comment.createdAt)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Comment form */}
          <form className="comment-form" onSubmit={handleCommentSubmit}>
            <input
              type="text"
              className="comment-input"
              placeholder="Write a comment…"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              id={`comment-input-${post._id}`}
            />
            <button type="submit" className="comment-submit" disabled={!commentText.trim()}>
              Post
            </button>
          </form>
        </div>
      )}
    </article>
  );
}
