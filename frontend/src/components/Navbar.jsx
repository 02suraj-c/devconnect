import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">DevConnect</Link>
      <div className="navbar-links">
        <Link to="/">Feed</Link>
        <Link to="/directory">Developers</Link>
           <Link to={`/profile/${user.id}`}>My Profile</Link>
        <button onClick={handleLogout} className="navbar-logout">Log out</button>
      </div>
    </nav>
  );
}
