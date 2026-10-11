import { useEffect, useState } from "react";
import api from "../services/api";
import PostCard from "../components/PostCard.jsx";

export default function Feed() {
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState("");
  const [code, setCode] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [showCode, setShowCode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");

  const loadFeed = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/posts");
      setPosts(data.posts);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load the feed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeed();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() || posting) return;
    setPosting(true);
    setError("");

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean)
      .slice(0, 5);

    try {
      const payload = { content };
      if (code.trim()) payload.codeSnippet = code;
      if (tags.length) payload.tags = tags;

      const { data } = await api.post("/posts", payload);
      setPosts((prev) => [data.post, ...prev]);
      setContent("");
      setCode("");
      setTagsInput("");
      setShowCode(false);
    } catch (err) {
      setError(err.response?.data?.message || "Could not create the post");
    } finally {
      setPosting(false);
    }
  };

  const handleUpdate = (updatedPost) => {
    setPosts((prev) => prev.map((p) => (p._id === updatedPost._id ? updatedPost : p)));
  };

  const handleDelete = (id) => {
    setPosts((prev) => prev.filter((p) => p._id !== id));
  };

  return (
    <div className="feed-page">
      <form className="new-post-form" onSubmit={handleSubmit}>
        <textarea
          placeholder="Share something with other developers…"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />

        {showCode && (
          <textarea
            className="code-input"
            placeholder="Paste a code snippet (optional)"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck={false}
          />
        )}

        <input
          className="tags-input"
          type="text"
          placeholder="Tags, separated by commas (e.g. react, node, mongodb)"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
        />

        {error && <p className="form-error">{error}</p>}

        <div className="new-post-actions">
          <button
            type="button"
            className="toggle-code-btn"
            onClick={() => setShowCode((prev) => !prev)}
          >
            {showCode ? "Hide code" : "Add code"}
          </button>

          <button type="submit" className="submit-post-btn" disabled={posting || !content.trim()}>
            {posting ? "Posting..." : "Post"}
          </button>
        </div>
      </form>

      <div className="feed-list">
        {loading ? (
          <p>Loading posts...</p>
        ) : posts.length === 0 ? (
          <p>No posts yet.</p>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post._id}
              post={post}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>
    </div>
  );
}
