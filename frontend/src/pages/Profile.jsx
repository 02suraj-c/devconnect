/**
 * Profile Page
 *
 * Dual-mode page:
 *   - **View mode**: displays bio, skills, GitHub link, and the user's posts
 *   - **Edit mode** (own profile only): inline editing of bio, skills, GitHub URL
 *
 * Uses the URL param `:id` to determine which profile to show.
 * If `id` matches the authenticated user, edit controls are revealed.
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import PostCard from '../components/PostCard';
import {
  HiOutlinePencilSquare,
  HiOutlineCheck,
  HiOutlineXMark,
  HiOutlineLink,
  HiOutlineChatBubbleLeftRight,
  HiOutlineCalendar,
} from 'react-icons/hi2';

export default function Profile() {
  const { id } = useParams();
  const { user: currentUser, setUser: setCurrentUser } = useAuth();

  const [profile, setProfile]   = useState(null);
  const [posts, setPosts]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [editing, setEditing]   = useState(false);
  const [saving, setSaving]     = useState(false);

  // Edit form state
  const [editBio, setEditBio]         = useState('');
  const [editSkills, setEditSkills]   = useState('');
  const [editGithub, setEditGithub]   = useState('');

  const isOwnProfile = currentUser?._id === id;

  // ── Fetch profile + user's posts ─────────────────────────────────
  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const [profileRes, postsRes] = await Promise.all([
        api.get(`/users/${id}`),
        api.get('/posts?limit=50'),
      ]);

      setProfile(profileRes.data.data);

      // Filter posts to only show this user's posts.
      const userPosts = postsRes.data.data.filter(
        (p) => p.author?._id === id
      );
      setPosts(userPosts);

      // Pre-fill edit form.
      const p = profileRes.data.data;
      setEditBio(p.bio || '');
      setEditSkills(p.skills?.join(', ') || '');
      setEditGithub(p.githubUrl || '');
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // ── Save profile edits ───────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    try {
      const skills = editSkills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await api.put('/users/me', {
        bio: editBio,
        skills,
        githubUrl: editGithub,
      });

      setProfile(res.data.data);
      setEditing(false);

      // Update the auth context if the user changed their own profile.
      if (isOwnProfile) {
        setCurrentUser((prev) => ({ ...prev, ...res.data.data }));
      }
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setEditBio(profile?.bio || '');
    setEditSkills(profile?.skills?.join(', ') || '');
    setEditGithub(profile?.githubUrl || '');
  };

  // ── Post actions (reused from Feed) ──────────────────────────────
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

  const handleDelete = async (postId) => {
    if (!window.confirm('Delete this post?')) return;
    try {
      await api.delete(`/posts/${postId}`);
      setPosts((prev) => prev.filter((p) => p._id !== postId));
    } catch (err) {
      console.error('Failed to delete post:', err);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="feed-loading">
          <div className="spinner" />
          <p>Loading profile…</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="page-container">
        <div className="feed-empty glass-card">
          <p>User not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page page-container">
      {/* ── Profile Header Card ──────────────────────────────────── */}
      <div className="profile-header glass-card" id="profile-header">
        <div className="profile-banner" />

        <div className="profile-info">
          <img
            src={profile.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=3b82f6&color=fff&size=120`}
            alt={profile.name}
            className="profile-avatar"
          />

          <div className="profile-details">
            <h1 className="profile-name">{profile.name}</h1>
            <p className="profile-email">{profile.email}</p>

            <div className="profile-meta">
              <span className="profile-meta-item">
                <HiOutlineCalendar />
                Joined {new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
              {profile.githubUrl && !editing && (
                <a
                  href={profile.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="profile-meta-item profile-github"
                >
                  <HiOutlineLink />
                  GitHub
                </a>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="profile-actions">
            {isOwnProfile && !editing && (
              <button
                className="profile-edit-btn"
                onClick={() => setEditing(true)}
                id="profile-edit-btn"
              >
                <HiOutlinePencilSquare />
                <span>Edit Profile</span>
              </button>
            )}
            {!isOwnProfile && (
              <Link to={`/chat/${id}`} className="profile-edit-btn">
                <HiOutlineChatBubbleLeftRight />
                <span>Message</span>
              </Link>
            )}
          </div>
        </div>

        {/* ── Bio section ────────────────────────────────────────── */}
        {editing ? (
          <div className="profile-edit-section">
            <div className="edit-group">
              <label>Bio</label>
              <textarea
                className="edit-textarea"
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                placeholder="Tell us about yourself…"
                rows={3}
                id="edit-bio"
              />
            </div>
            <div className="edit-group">
              <label>Skills (comma-separated)</label>
              <input
                type="text"
                className="edit-input"
                value={editSkills}
                onChange={(e) => setEditSkills(e.target.value)}
                placeholder="React, Node.js, Python…"
                id="edit-skills"
              />
            </div>
            <div className="edit-group">
              <label>GitHub URL</label>
              <input
                type="url"
                className="edit-input"
                value={editGithub}
                onChange={(e) => setEditGithub(e.target.value)}
                placeholder="https://github.com/username"
                id="edit-github"
              />
            </div>
            <div className="edit-actions">
              <button
                className="edit-save-btn"
                onClick={handleSave}
                disabled={saving}
                id="edit-save"
              >
                {saving ? <span className="btn-spinner" /> : <><HiOutlineCheck /> Save</>}
              </button>
              <button className="edit-cancel-btn" onClick={handleCancel} id="edit-cancel">
                <HiOutlineXMark /> Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            {profile.bio && <p className="profile-bio">{profile.bio}</p>}

            {profile.skills?.length > 0 && (
              <div className="profile-skills">
                {profile.skills.map((skill, i) => (
                  <span key={i} className="skill-chip">{skill}</span>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── User's Posts ─────────────────────────────────────────── */}
      <div className="profile-posts">
        <h2 className="section-title">
          {isOwnProfile ? 'Your Posts' : `${profile.name.split(' ')[0]}'s Posts`}
        </h2>

        {posts.length === 0 ? (
          <div className="feed-empty glass-card">
            <p>No posts yet</p>
          </div>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post._id}
              post={post}
              currentUserId={currentUser?._id}
              onLike={handleLike}
              onComment={handleComment}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>
    </div>
  );
}
