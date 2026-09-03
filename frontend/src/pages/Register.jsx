/**
 * Register Page
 *
 * Name/email/password registration form.
 * Mirrors the Login page design for visual consistency.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  HiOutlineUser,
  HiOutlineEnvelope,
  HiOutlineLockClosed,
  HiOutlineBolt,
} from 'react-icons/hi2';

export default function Register() {
  const { register } = useAuth();
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register(name, email, password);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed — please try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Same animated background as Login for consistency */}
      <div className="auth-bg">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      <div className="auth-card" id="register-card">
        <div className="auth-header">
          <div className="auth-logo">
            <HiOutlineBolt className="auth-logo-icon" />
          </div>
          <h1>Join DevConnect</h1>
          <p className="auth-subtitle">Create your developer profile</p>
        </div>

        {error && <div className="auth-error" id="register-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <div className="input-icon">
              <HiOutlineUser />
            </div>
            <input
              type="text"
              id="register-name"
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
            />
          </div>

          <div className="form-group">
            <div className="input-icon">
              <HiOutlineEnvelope />
            </div>
            <input
              type="email"
              id="register-email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <div className="input-icon">
              <HiOutlineLockClosed />
            </div>
            <input
              type="password"
              id="register-password"
              placeholder="Password (6+ characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            className="auth-btn"
            id="register-submit"
            disabled={loading}
          >
            {loading ? <span className="btn-spinner" /> : 'Create Account'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account?{' '}
          <Link to="/login" className="auth-link">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
