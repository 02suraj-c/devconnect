/**
 * App Component
 *
 * Defines all routes and includes a PrivateRoute guard that redirects
 * unauthenticated users to /login.
 *
 * The Navbar is rendered outside of <Routes> so it appears on every
 * page (except login/register, where it's conditionally hidden).
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Feed from './pages/Feed';
import Directory from './pages/Directory';
import Profile from './pages/Profile';
import Chat from './pages/Chat';

/**
 * PrivateRoute — wraps protected pages.
 * If the user isn't logged in, redirects to /login.
 * Shows a loading spinner while the auth check is in progress.
 */
function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p>Loading…</p>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const { user, loading } = useAuth();

  // Don't render anything until the initial auth check completes.
  // This prevents a flash of the login page for already-logged-in users.
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p>Initialising DevConnect…</p>
      </div>
    );
  }

  return (
    <>
      {/* Show navbar only for authenticated users */}
      {user && <Navbar />}

      <main className={user ? 'main-content' : ''}>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
          <Route path="/register" element={user ? <Navigate to="/" replace /> : <Register />} />

          {/* Protected routes */}
          <Route path="/" element={<PrivateRoute><Feed /></PrivateRoute>} />
          <Route path="/directory" element={<PrivateRoute><Directory /></PrivateRoute>} />
          <Route path="/profile/:id" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="/chat" element={<PrivateRoute><Chat /></PrivateRoute>} />
          <Route path="/chat/:userId" element={<PrivateRoute><Chat /></PrivateRoute>} />

          {/* Catch-all → feed */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  );
}
