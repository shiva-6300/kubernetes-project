import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function Blog({ user, token, onLogout }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editPost, setEditPost] = useState(null);
  const [viewPost, setViewPost] = useState(null);
  const [form, setForm] = useState({ title: "", content: "", tags: "" });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  const authHeader = { Authorization: `Bearer ${token}` };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const fetchPosts = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/api/posts`);
      setPosts(res.data.posts);
    } catch {
      showToast("Failed to load posts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const openCreate = () => {
    setEditPost(null);
    setForm({ title: "", content: "", tags: "" });
    setShowForm(true);
    setViewPost(null);
  };

  const openEdit = (post) => {
    setEditPost(post);
    setForm({ title: post.title, content: post.content, tags: post.tags?.join(", ") || "" });
    setShowForm(true);
    setViewPost(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      title: form.title,
      content: form.content,
      tags: form.tags.split(",").map(t => t.trim()).filter(Boolean),
    };
    try {
      if (editPost) {
        const res = await axios.put(`${API}/api/posts/${editPost.id}`, payload, { headers: authHeader });
        setPosts(posts.map(p => p.id === editPost.id ? res.data : p));
        showToast("✅ Post updated!");
      } else {
        const res = await axios.post(`${API}/api/posts`, payload, { headers: authHeader });
        setPosts([res.data, ...posts]);
        showToast("✅ Post published!");
      }
      setShowForm(false);
    } catch (err) {
      showToast(err.response?.data?.error || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (post) => {
    if (!window.confirm(`Delete "${post.title}"?`)) return;
    try {
      await axios.delete(`${API}/api/posts/${post.id}`, { headers: authHeader });
      setPosts(posts.filter(p => p.id !== post.id));
      if (viewPost?.id === post.id) setViewPost(null);
      showToast("🗑️ Post deleted");
    } catch {
      showToast("Delete failed");
    }
  };

  // ── Post Detail View ──────────────────────────────────────────────────────
  if (viewPost) {
    return (
      <div style={styles.page}>
        <NavBar user={user} onLogout={onLogout} onNew={openCreate} />
        <div style={styles.detailWrap}>
          <button onClick={() => setViewPost(null)} style={styles.backBtn}>← Back to posts</button>
          <article style={styles.article}>
            <div style={styles.articleMeta}>
              <span style={styles.authorChip}>✍️ {viewPost.author}</span>
              <span style={styles.timeChip}>{timeAgo(viewPost.created_at)}</span>
            </div>
            <h1 style={styles.articleTitle}>{viewPost.title}</h1>
            {viewPost.tags?.length > 0 && (
              <div style={styles.tagRow}>
                {viewPost.tags.map(t => <span key={t} style={styles.tag}>{t}</span>)}
              </div>
            )}
            <div style={styles.articleBody}>
              {viewPost.content.split("\n").map((p, i) => <p key={i}>{p}</p>)}
            </div>
            {viewPost.author === user.username && (
              <div style={styles.articleActions}>
                <button onClick={() => openEdit(viewPost)} style={styles.editBtn}>✏️ Edit</button>
                <button onClick={() => handleDelete(viewPost)} style={styles.deleteBtn}>🗑️ Delete</button>
              </div>
            )}
          </article>
        </div>
        {toast && <Toast msg={toast} />}
      </div>
    );
  }

  // ── Write / Edit Form ─────────────────────────────────────────────────────
  if (showForm) {
    return (
      <div style={styles.page}>
        <NavBar user={user} onLogout={onLogout} onNew={openCreate} />
        <div style={styles.formWrap}>
          <div style={styles.formCard}>
            <h2 style={styles.formTitle}>{editPost ? "Edit Post" : "New Post"}</h2>
            <form onSubmit={handleSave} style={styles.form}>
              <div style={styles.field}>
                <label style={styles.label}>Title</label>
                <input
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="Your post title..."
                  required
                  style={{ ...styles.input, fontSize: "20px" }}
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Content</label>
                <textarea
                  value={form.content}
                  onChange={e => setForm({ ...form, content: e.target.value })}
                  placeholder="Write your story here..."
                  required
                  rows={12}
                  style={{ ...styles.input, resize: "vertical", lineHeight: "1.7" }}
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Tags (comma separated)</label>
                <input
                  value={form.tags}
                  onChange={e => setForm({ ...form, tags: e.target.value })}
                  placeholder="devops, kubernetes, python"
                  style={styles.input}
                />
              </div>
              <div style={styles.formBtns}>
                <button type="button" onClick={() => setShowForm(false)} style={styles.cancelBtn}>Cancel</button>
                <button type="submit" disabled={saving} style={styles.publishBtn}>
                  {saving ? "Saving..." : editPost ? "Update Post" : "Publish →"}
                </button>
              </div>
            </form>
          </div>
        </div>
        {toast && <Toast msg={toast} />}
      </div>
    );
  }

  // ── Post List / Home ──────────────────────────────────────────────────────
  return (
    <div style={styles.page}>
      <NavBar user={user} onLogout={onLogout} onNew={openCreate} />

      <div style={styles.hero}>
        <h2 style={styles.heroTitle}>The Blog</h2>
        <p style={styles.heroSub}>{posts.length} post{posts.length !== 1 ? "s" : ""} published</p>
      </div>

      <div style={styles.grid}>
        {loading ? (
          <p style={styles.emptyMsg}>Loading posts...</p>
        ) : posts.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyEmoji}>📝</p>
            <p style={styles.emptyMsg}>No posts yet. Be the first to write!</p>
            <button onClick={openCreate} style={styles.publishBtn}>Write a Post</button>
          </div>
        ) : (
          posts.map(post => (
            <PostCard
              key={post.id}
              post={post}
              user={user}
              onView={() => setViewPost(post)}
              onEdit={() => openEdit(post)}
              onDelete={() => handleDelete(post)}
            />
          ))
        )}
      </div>

      {toast && <Toast msg={toast} />}
    </div>
  );
}

function NavBar({ user, onLogout, onNew }) {
  return (
    <nav style={styles.nav}>
      <div style={styles.navBrand}>✍️ <span style={styles.navTitle}>inkwell</span></div>
      <div style={styles.navRight}>
        <span style={styles.navUser}>👤 {user.username}</span>
        <button onClick={onNew} style={styles.navNewBtn}>+ New Post</button>
        <button onClick={onLogout} style={styles.navLogout}>Sign Out</button>
      </div>
    </nav>
  );
}

function PostCard({ post, user, onView, onEdit, onDelete }) {
  const preview = post.content.length > 150 ? post.content.slice(0, 150) + "…" : post.content;
  return (
    <div style={styles.card}>
      <div style={styles.cardMeta}>
        <span style={styles.authorChip}>✍️ {post.author}</span>
        <span style={styles.timeChip}>{timeAgo(post.created_at)}</span>
      </div>
      <h3 style={styles.cardTitle} onClick={onView}>{post.title}</h3>
      <p style={styles.cardPreview}>{preview}</p>
      {post.tags?.length > 0 && (
        <div style={styles.tagRow}>
          {post.tags.map(t => <span key={t} style={styles.tag}>{t}</span>)}
        </div>
      )}
      <div style={styles.cardFooter}>
        <button onClick={onView} style={styles.readBtn}>Read more →</button>
        {post.author === user.username && (
          <div style={styles.cardActions}>
            <button onClick={onEdit} style={styles.editBtnSm}>✏️</button>
            <button onClick={onDelete} style={styles.deleteBtnSm}>🗑️</button>
          </div>
        )}
      </div>
    </div>
  );
}

function Toast({ msg }) {
  return <div style={styles.toast}>{msg}</div>;
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#0d0d14",
    fontFamily: "'Georgia', serif",
    color: "#e8e8f0",
  },
  nav: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 32px",
    height: "64px",
    background: "rgba(255,255,255,0.04)",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    position: "sticky",
    top: 0,
    zIndex: 100,
    backdropFilter: "blur(12px)",
  },
  navBrand: { display: "flex", alignItems: "center", gap: "8px", fontSize: "20px" },
  navTitle: { color: "#fff", fontWeight: "400", letterSpacing: "2px" },
  navRight: { display: "flex", alignItems: "center", gap: "12px" },
  navUser: { color: "rgba(255,255,255,0.5)", fontSize: "13px", fontFamily: "sans-serif" },
  navNewBtn: {
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    color: "#fff", border: "none", borderRadius: "8px",
    padding: "8px 16px", fontSize: "13px", cursor: "pointer", fontFamily: "sans-serif",
  },
  navLogout: {
    background: "transparent", color: "rgba(255,255,255,0.4)",
    border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px",
    padding: "8px 14px", fontSize: "13px", cursor: "pointer", fontFamily: "sans-serif",
  },
  hero: {
    textAlign: "center",
    padding: "60px 24px 32px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  },
  heroTitle: {
    fontSize: "48px", fontWeight: "400", margin: "0 0 8px",
    background: "linear-gradient(135deg, #fff 40%, rgba(255,255,255,0.4))",
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
    letterSpacing: "3px",
  },
  heroSub: { color: "rgba(255,255,255,0.3)", fontFamily: "sans-serif", fontSize: "14px", margin: 0 },
  grid: {
    maxWidth: "900px",
    margin: "0 auto",
    padding: "40px 24px",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  card: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "16px",
    padding: "28px 32px",
    transition: "border-color 0.2s",
  },
  cardMeta: { display: "flex", gap: "12px", marginBottom: "12px" },
  authorChip: {
    fontSize: "12px", color: "#a78bfa", fontFamily: "sans-serif",
    background: "rgba(167,139,250,0.1)", padding: "3px 10px", borderRadius: "20px",
  },
  timeChip: {
    fontSize: "12px", color: "rgba(255,255,255,0.3)", fontFamily: "sans-serif",
    padding: "3px 10px",
  },
  cardTitle: {
    fontSize: "22px", fontWeight: "400", margin: "0 0 12px",
    color: "#fff", cursor: "pointer", lineHeight: "1.3",
  },
  cardPreview: {
    fontSize: "15px", color: "rgba(255,255,255,0.5)", lineHeight: "1.7",
    margin: "0 0 16px", fontFamily: "sans-serif",
  },
  tagRow: { display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "16px" },
  tag: {
    fontSize: "11px", padding: "3px 10px", borderRadius: "20px",
    background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.45)",
    fontFamily: "sans-serif", letterSpacing: "0.5px",
  },
  cardFooter: { display: "flex", alignItems: "center", justifyContent: "space-between" },
  readBtn: {
    background: "transparent", color: "#a78bfa", border: "none",
    cursor: "pointer", fontSize: "14px", padding: 0, fontFamily: "sans-serif",
  },
  cardActions: { display: "flex", gap: "8px" },
  editBtnSm: {
    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "8px", padding: "6px 10px", cursor: "pointer", fontSize: "14px",
  },
  deleteBtnSm: {
    background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)",
    borderRadius: "8px", padding: "6px 10px", cursor: "pointer", fontSize: "14px",
  },
  emptyState: { textAlign: "center", padding: "80px 0" },
  emptyEmoji: { fontSize: "48px", marginBottom: "16px" },
  emptyMsg: { color: "rgba(255,255,255,0.4)", fontFamily: "sans-serif", fontSize: "15px" },
  // Detail view
  detailWrap: { maxWidth: "760px", margin: "0 auto", padding: "40px 24px" },
  backBtn: {
    background: "transparent", border: "none", color: "#a78bfa",
    cursor: "pointer", fontSize: "14px", fontFamily: "sans-serif", marginBottom: "32px", padding: 0,
  },
  article: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "20px", padding: "48px",
  },
  articleMeta: { display: "flex", gap: "12px", marginBottom: "20px" },
  articleTitle: { fontSize: "36px", fontWeight: "400", margin: "0 0 20px", lineHeight: "1.25", color: "#fff" },
  articleBody: {
    fontSize: "16px", lineHeight: "1.85", color: "rgba(255,255,255,0.7)",
    fontFamily: "sans-serif",
  },
  articleActions: { display: "flex", gap: "12px", marginTop: "40px", paddingTop: "24px", borderTop: "1px solid rgba(255,255,255,0.08)" },
  editBtn: {
    background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)",
    color: "#fff", borderRadius: "10px", padding: "10px 20px", cursor: "pointer",
    fontFamily: "sans-serif", fontSize: "14px",
  },
  deleteBtn: {
    background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)",
    color: "#f87171", borderRadius: "10px", padding: "10px 20px", cursor: "pointer",
    fontFamily: "sans-serif", fontSize: "14px",
  },
  // Form view
  formWrap: { maxWidth: "760px", margin: "0 auto", padding: "40px 24px" },
  formCard: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "20px", padding: "48px",
  },
  formTitle: { fontSize: "26px", fontWeight: "400", margin: "0 0 32px", color: "#fff" },
  form: { display: "flex", flexDirection: "column", gap: "20px" },
  field: { display: "flex", flexDirection: "column", gap: "8px" },
  label: {
    color: "rgba(255,255,255,0.4)", fontSize: "11px",
    letterSpacing: "1.5px", textTransform: "uppercase", fontFamily: "sans-serif",
  },
  input: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "12px", padding: "14px 18px",
    color: "#fff", fontSize: "15px", fontFamily: "Georgia, serif",
    outline: "none", width: "100%", boxSizing: "border-box",
  },
  formBtns: { display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "8px" },
  cancelBtn: {
    background: "transparent", border: "1px solid rgba(255,255,255,0.1)",
    color: "rgba(255,255,255,0.5)", borderRadius: "10px", padding: "12px 24px",
    cursor: "pointer", fontFamily: "sans-serif", fontSize: "14px",
  },
  publishBtn: {
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    color: "#fff", border: "none", borderRadius: "10px",
    padding: "12px 28px", fontSize: "14px", fontWeight: "600",
    cursor: "pointer", fontFamily: "sans-serif",
  },
  toast: {
    position: "fixed", bottom: "32px", left: "50%", transform: "translateX(-50%)",
    background: "rgba(30,30,50,0.95)", backdropFilter: "blur(12px)",
    border: "1px solid rgba(255,255,255,0.12)", borderRadius: "12px",
    color: "#fff", padding: "12px 24px", fontSize: "14px",
    fontFamily: "sans-serif", zIndex: 999, boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
  },
};
