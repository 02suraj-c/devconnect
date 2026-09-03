/**
 * Feed Page
 *
 * The main landing page after login. Displays:
 *   - A post composer (text, optional code snippet, tags)
 *   - A paginated feed of posts rendered via PostCard
 *   - A "Load More" button for pagination
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import PostCard from '../components/PostCard';
import {
  HiOutlinePaperAirplane,
  HiOutlineCodeBracket,
  HiOutlineTag,
} from 'react-icons/hi2';

export default function Feed() {
  const { user } = useAuth();
  const [posts, setPosts]       = useState([]);
  const [page, setPage]         = useState(1);
  const [totalPages, setTotal]  = useState(1);
  const [loading, setLoading]   = useState(true);
  const [posting, setPosting]   = useState(false);

  // Composer state
  const [text, setText]             = useState('');
  const [codeSnippet, setCode]      = useState('');
  const [tagInput, setTagInput]     = useState('');
  const [showCodeInput, setShowCode] = useState(false);

  // ── Fetch posts ──────────────────────────────────────────────────
  const fetchPosts = useCallback(async (pageNum = 1, append = false) => {
    try {
      setLoading(true);
      const res = await api.get(`/posts?page=${pageNum}&limit=10`);
      if (append) {
        setPosts((prev) => [...prev, ...res.data.data]);
      } else {
        setPosts(res.data.data);
      }
      setTotal(res.data.totalPages);
      setPage(pageNum);
    } catch (err) {
      console.error('Failed to load posts:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts(1);
  }, [fetchPosts]);

  // ── Create a new post ────────────────────────────────────────────
  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    setPosting(true);
    try {
      // Split comma-separated tags into an array.
      const tags = tagInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const res = await api.post('/posts', {
        text: text.trim(),
        codeSnippet: codeSnippet.trim(),
        tags,
      });

      // Prepend the new post to the feed.
      setPosts((prev) => [res.data.data, ...prev]);
      setText('');
      setCode('');
      setTagInput('');
      setShowCode(false);
    } catch (err) {
      console.error('Failed to create post:', err);
    } finally {
      setPosting(false);
    }
  };

  // ── Like a post ──────────────────────────────────────────────────
  const handleLike = async (postId) => {
    try {
      const res = await api.put(`/posts/${postId}/like`);
      setPosts((prev) =>
        prev.map((p) => (p._id === postId ? { ...p, likes: res.data.data } : p))
      );
    } catch (err) {
      console.error('Failed to like post:', err);
    }
  };

  // ── Comment on a post ────────────────────────────────────────────
  const handleComment = async (postId, commentText) => {
    try {
      const res = await api.post(`/posts/${postId}/comments`, { text: commentText });
      setPosts((prev) =>
        prev.map((p) => (p._id === postId ? { ...p, comments: res.data.data } : p))
      );
    } catch (err) {
      console.error('Failed to add comment:', err);
    }
  };

  // ── Delete a post ────────────────────────────────────────────────
  const handleDelete = async (postId) => {
    if (!window.confirm('Delete this post?')) return;
    try {
      await api.delete(`/posts/${postId}`);
      setPosts((prev) => prev.filter((p) => p._id !== postId));
    } catch (err) {
      console.error('Failed to delete post:', err);
    }
  };

  // ── Load more ────────────────────────────────────────────────────
  const handleLoadMore = () => {
    if (page < totalPages) {
      fetchPosts(page + 1, true);
    }
  };

  return (
    <div className="feed-page page-container">
      <div className="feed-content">
        {/* ── Post Composer ──────────────────────────────────────── */}
        <div className="glass-card composer-card" id="post-composer">
          <div className="composer-header">
            <img
              src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=3b82f6&color=fff&size=40`}
              alt={user?.name}
              className="composer-avatar"
            />
            <span className="composer-greeting">What&apos;s on your mind, {user?.name?.split(' ')[0]}?</span>
          </div>

          <form onSubmit={handleCreatePost}>
            <textarea
              className="composer-textarea"
              id="composer-text"
              placeholder="Share something with the community…"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={3}
            />

            {/* Optional code snippet input */}
            {showCodeInput && (
              <textarea
                className="composer-code"
                id="composer-code"
                placeholder="Paste your code snippet here…"
                value={codeSnippet}
                onChange={(e) => setCode(e.target.value)}
                rows={5}
              />
            )}

            {/* Tag input */}
            <input
              type="text"
              className="composer-tags-input"
              id="composer-tags"
              placeholder="Tags (comma-separated, e.g. React, Node.js)"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
            />

            <div className="composer-footer">
              <div className="composer-tools">
                <button
                  type="button"
                  className={`composer-tool-btn ${showCodeInput ? 'active' : ''}`}
                  onClick={() => setShowCode((prev) => !prev)}
                  title="Add code snippet"
                >
                  <HiOutlineCodeBracket />
                </button>
                <button type="button" className="composer-tool-btn" title="Add tags">
                  <HiOutlineTag />
                </button>
              </div>

              <button
                type="submit"
                className="composer-submit"
                id="composer-submit"
                disabled={posting || !text.trim()}
              >
                {posting ? (
                  <span className="btn-spinner" />
                ) : (
                  <>
                    <HiOutlinePaperAirplane />
                    <span>Post</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* ── Post Feed ──────────────────────────────────────────── */}
        <div className="feed-list">
          {posts.map((post) => (
            <PostCard
              key={post._id}
              post={post}
              currentUserId={user?._id}
              onLike={handleLike}
              onComment={handleComment}
              onDelete={handleDelete}
            />
          ))}

          {loading && (
            <div className="feed-loading">
              <div className="spinner" />
              <p>Loading posts…</p>
            </div>
          )}

          {!loading && posts.length === 0 && (
            <div className="feed-empty glass-card">
              <p>No posts yet. Be the first to share something!</p>
            </div>
          )}

          {!loading && page < totalPages && (
            <button className="load-more-btn" onClick={handleLoadMore} id="load-more">
              Load More
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
