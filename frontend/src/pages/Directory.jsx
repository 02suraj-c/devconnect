import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

const initialsOf = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "?";

export default function Directory() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Debounced search: also handles the first load on mount.
  useEffect(() => {
    let cancelled = false;

    const timeout = setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const { data } = await api.get("/users", { params: { search } });
        if (!cancelled) setUsers(data.users || []);
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.message || "Could not load developers");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [search]);

  return (
    <div className="directory-page">
      <h2>Developers</h2>

      <input
        placeholder="Search by name or skill…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {error && <p className="form-error">{error}</p>}

      {!loading && !error && (
        <p className="directory-count">
          {users.length} {users.length === 1 ? "developer" : "developers"}
          {search.trim() ? ` matching "${search.trim()}"` : ""}
        </p>
      )}

      {loading ? (
        <p className="page-loading">Loading developers…</p>
      ) : users.length === 0 && !error ? (
        <p className="page-loading">No developers found. Try another search.</p>
      ) : (
        <ul className="directory-list">
          {users.map((u) => (
            <li key={u._id} className="directory-item">
              <div className="avatar">{initialsOf(u.name)}</div>

              <div className="directory-info">
                <strong>{u.name}</strong>
                {u.isOnline && <span className="online-dot" title="Online" />}
                {u.bio && <p className="directory-bio">{u.bio}</p>}
                <div className="skill-tags">
                  {(u.skills || []).slice(0, 6).map((s) => (
                    <span key={s} className="skill-tag">{s}</span>
                  ))}
                </div>
              </div>

              <div className="directory-actions">
                <Link to={`/chat/${u._id}`} className="btn-primary">Message</Link>
                <Link to={`/profile/${u._id}`} className="btn-outline">Profile</Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}