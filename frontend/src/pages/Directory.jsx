/**
 * Developer Directory Page
 *
 * Searchable grid of all registered developers.
 * Features:
 *   - Debounced search (filters by name or skill)
 *   - Developer cards with avatar, name, skills, and GitHub link
 *   - Click to view full profile
 */

import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import {
  HiOutlineMagnifyingGlass,
  HiOutlineLink,
  HiOutlineChatBubbleLeftRight,
} from 'react-icons/hi2';

export default function Directory() {
  const [users, setUsers]     = useState([]);
  const [search, setSearch]   = useState('');
  const [loading, setLoading] = useState(true);
  const debounceRef = useRef(null);

  // ── Fetch users (with debounced search) ──────────────────────────
  useEffect(() => {
    // Clear any pending debounce timer.
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      try {
        setLoading(true);
        const params = search ? `?search=${encodeURIComponent(search)}` : '';
        const res = await api.get(`/users${params}`);
        setUsers(res.data.data);
      } catch (err) {
        console.error('Failed to load users:', err);
      } finally {
        setLoading(false);
      }
    }, 300); // 300 ms debounce

    return () => clearTimeout(debounceRef.current);
  }, [search]);

  return (
    <div className="directory-page page-container">
      {/* ── Header + Search ──────────────────────────────────────── */}
      <div className="page-header">
        <h1 className="page-title">Developer Directory</h1>
        <p className="page-subtitle">
          Discover and connect with {users.length}+ developers
        </p>

        <div className="search-bar glass-card" id="directory-search">
          <HiOutlineMagnifyingGlass className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search by name or skill…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            id="directory-search-input"
          />
        </div>
      </div>

      {/* ── Developer Grid ───────────────────────────────────────── */}
      {loading ? (
        <div className="feed-loading">
          <div className="spinner" />
          <p>Loading developers…</p>
        </div>
      ) : users.length === 0 ? (
        <div className="feed-empty glass-card">
          <p>No developers found matching &ldquo;{search}&rdquo;</p>
        </div>
      ) : (
        <div className="directory-grid">
          {users.map((dev) => (
            <div key={dev._id} className="developer-card glass-card" id={`dev-${dev._id}`}>
              <Link to={`/profile/${dev._id}`} className="dev-card-link">
                <img
                  src={dev.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(dev.name)}&background=3b82f6&color=fff&size=80`}
                  alt={dev.name}
                  className="dev-avatar"
                />
                <h3 className="dev-name">{dev.name}</h3>
                {dev.bio && <p className="dev-bio">{dev.bio.slice(0, 100)}{dev.bio.length > 100 ? '…' : ''}</p>}
              </Link>

              {/* Skills */}
              {dev.skills?.length > 0 && (
                <div className="dev-skills">
                  {dev.skills.slice(0, 5).map((skill, i) => (
                    <span key={i} className="skill-chip">{skill}</span>
                  ))}
                  {dev.skills.length > 5 && (
                    <span className="skill-chip skill-more">+{dev.skills.length - 5}</span>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="dev-card-actions">
                {dev.githubUrl && (
                  <a
                    href={dev.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="dev-action-btn"
                    title="GitHub"
                  >
                    <HiOutlineLink />
                    <span>GitHub</span>
                  </a>
                )}
                <Link to={`/chat/${dev._id}`} className="dev-action-btn">
                  <HiOutlineChatBubbleLeftRight />
                  <span>Chat</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
