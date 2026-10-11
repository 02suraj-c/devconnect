import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../services/api";

const initialsOf = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("") || "?";

// Only allow http(s) links for the GitHub URL.
const safeUrl = (url = "") => {
  const u = url.trim();
  if (!u) return "";
  return /^https?:\/\//i.test(u) ? u : `https://${u}`;
};

export default function Profile() {
  const { userId } = useParams();
  const { user: currentUser, setUser } = useAuth();
  const isOwnProfile = String(userId) === String(currentUser?.id);

  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({ bio: "", skills: "", githubUrl: "" });

  const fillForm = (u) =>
    setForm({
      bio: u.bio || "",
      skills: (u.skills || []).join(", "),
      githubUrl: u.githubUrl || "",
    });

  useEffect(() => {
    let cancelled = false;
    setProfile(null);
    setEditing(false);
    setLoadError("");
    setError("");

    api
      .get(`/users/${userId}`)
      .then(({ data }) => {
        if (cancelled) return;
        setProfile(data.user);
        fillForm(data.user);
      })
      .catch((err) => {
        if (!cancelled) {
          setLoadError(err.response?.data?.message || "Could not load this profile");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setError("");

    const skills = form.skills
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 15);

    try {
      const { data } = await api.put("/users/me", {
        bio: form.bio,
        githubUrl: form.githubUrl.trim(),
        skills,
      });
      setProfile(data.user);
      // Merge, and keep the existing id so the rest of the app keeps working.
      setUser({ ...currentUser, ...data.user, id: currentUser.id });
      setEditing(false);
    } catch (err) {
      setError(err.response?.data?.message || "Could not save your profile");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    fillForm(profile);
    setError("");
    setEditing(false);
  };

  if (loadError) return <p className="form-error">{loadError}</p>;
  if (!profile) return <p className="page-loading">Loading profile…</p>;

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="avatar avatar-lg">{initialsOf(profile.name)}</div>
        <div>
          <h1>{profile.name}</h1>
          {profile.isOnline && <span className="profile-online">● Online</span>}
        </div>
      </div>

      {editing ? (
        <form onSubmit={handleSave} className="profile-edit-form">
          <label>
            Bio
            <textarea
              placeholder="Tell other developers about yourself"
              value={form.bio}
              maxLength={300}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
            />
          </label>
          <label>
            Skills
            <input
              placeholder="react, node, mongodb"
              value={form.skills}
              onChange={(e) => setForm({ ...form, skills: e.target.value })}
            />
          </label>
          <label>
            GitHub URL
            <input
              placeholder="https://github.com/yourname"
              value={form.githubUrl}
              onChange={(e) => setForm({ ...form, githubUrl: e.target.value })}
            />
          </label>

          {error && <p className="form-error">{error}</p>}

          <div className="profile-buttons">
            <button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </button>
            <button type="button" className="btn-cancel" onClick={handleCancel}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="profile-card">
          <p className="profile-bio">{profile.bio || "No bio yet."}</p>

          {(profile.skills || []).length > 0 && (
            <div className="skill-tags">
              {profile.skills.map((s) => (
                <span key={s} className="skill-tag">{s}</span>
              ))}
            </div>
          )}

          <div className="profile-links">
            {profile.githubUrl && (
              <a
                href={safeUrl(profile.githubUrl)}
                target="_blank"
                rel="noreferrer"
                className="btn-outline"
              >
                GitHub ↗
              </a>
            )}
            {isOwnProfile ? (
              <button className="btn-edit" onClick={() => setEditing(true)}>
                Edit profile
              </button>
            ) : (
              <Link to={`/chat/${profile._id}`} className="btn-primary">
                Message
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}