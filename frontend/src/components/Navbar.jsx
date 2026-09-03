/**
 * Navbar Component
 *
 * Sticky top navigation with logo, page links, and user controls.
 * Uses react-router-dom's NavLink for active-link highlighting.
 * Responsive: collapses into a hamburger menu on mobile.
 */

import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  HiOutlineNewspaper,
  HiOutlineUsers,
  HiOutlineChatBubbleLeftRight,
  HiOutlineArrowRightOnRectangle,
  HiOutlineBars3,
  HiOutlineXMark,
} from 'react-icons/hi2';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const closeMenu = () => setMobileOpen(false);

  return (
    <nav className="navbar" id="main-navbar">
      <div className="navbar-inner">
        {/* ── Logo ──────────────────────────────────────────────── */}
        <NavLink to="/" className="navbar-logo" onClick={closeMenu}>
          <span className="logo-icon">⚡</span>
          <span className="logo-text">DevConnect</span>
        </NavLink>

        {/* ── Hamburger toggle (mobile only) ────────────────────── */}
        <button
          className="navbar-toggle"
          id="navbar-toggle"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-label="Toggle navigation"
        >
          {mobileOpen ? <HiOutlineXMark /> : <HiOutlineBars3 />}
        </button>

        {/* ── Nav links ─────────────────────────────────────────── */}
        <div className={`navbar-links ${mobileOpen ? 'open' : ''}`}>
          <NavLink
            to="/"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={closeMenu}
            end
          >
            <HiOutlineNewspaper />
            <span>Feed</span>
          </NavLink>

          <NavLink
            to="/directory"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={closeMenu}
          >
            <HiOutlineUsers />
            <span>Directory</span>
          </NavLink>

          <NavLink
            to="/chat"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={closeMenu}
          >
            <HiOutlineChatBubbleLeftRight />
            <span>Chat</span>
          </NavLink>

          {/* ── User section ──────────────────────────────────────── */}
          <div className="nav-user">
            {user && (
              <NavLink
                to={`/profile/${user._id}`}
                className="nav-avatar-link"
                onClick={closeMenu}
              >
                <img
                  src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=3b82f6&color=fff&size=32`}
                  alt={user.name}
                  className="nav-avatar"
                />
                <span className="nav-username">{user.name}</span>
              </NavLink>
            )}

            <button
              className="nav-logout"
              id="logout-button"
              onClick={handleLogout}
              title="Log out"
            >
              <HiOutlineArrowRightOnRectangle />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
