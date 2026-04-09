import React, { useState } from "react";
import axios from "axios";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

export default function Login({ onLogin }) {
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [form, setForm] = useState({ username: "", password: "", email: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (mode === "login") {
        const res = await axios.post(`${API}/api/auth/login`, {
          username: form.username,
          password: form.password,
        });
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        onLogin(res.data.user, res.data.token);
      } else {
        await axios.post(`${API}/api/auth/register`, form);
        setMode("login");
        setForm({ username: form.username, password: "", email: "" });
        setError("✅ Registered! Please log in.");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logoWrap}>
          <span style={styles.logoIcon}>✍️</span>
          <h1 style={styles.logoText}>inkwell</h1>
          <p style={styles.tagline}>your thoughts, beautifully published</p>
        </div>

        {/* Tab Toggle */}
        <div style={styles.tabs}>
          <button
            style={{ ...styles.tab, ...(mode === "login" ? styles.tabActive : {}) }}
            onClick={() => { setMode("login"); setError(""); }}
          >
            Sign In
          </button>
          <button
            style={{ ...styles.tab, ...(mode === "register" ? styles.tabActive : {}) }}
            onClick={() => { setMode("register"); setError(""); }}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Username</label>
            <input
              name="username"
              value={form.username}
              onChange={handleChange}
              placeholder="your_username"
              required
              style={styles.input}
              autoComplete="username"
            />
          </div>

          {mode === "register" && (
            <div style={styles.field}>
              <label style={styles.label}>Email</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
                style={styles.input}
              />
            </div>
          )}

          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
              style={styles.input}
              autoComplete="current-password"
            />
          </div>

          {error && (
            <p style={{
              ...styles.errorMsg,
              color: error.startsWith("✅") ? "#22c55e" : "#ef4444"
            }}>
              {error}
            </p>
          )}

          <button type="submit" disabled={loading} style={styles.submitBtn}>
            {loading ? "Please wait..." : mode === "login" ? "Sign In →" : "Create Account →"}
          </button>
        </form>

        <p style={styles.hint}>
          {mode === "login" ? "Demo: admin / admin123" : "Fill in details to create your account"}
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    fontFamily: "'Georgia', serif",
  },
  card: {
    background: "rgba(255,255,255,0.05)",
    backdropFilter: "blur(20px)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "24px",
    padding: "48px 40px",
    width: "100%",
    maxWidth: "420px",
    boxShadow: "0 32px 64px rgba(0,0,0,0.4)",
  },
  logoWrap: {
    textAlign: "center",
    marginBottom: "32px",
  },
  logoIcon: { fontSize: "36px" },
  logoText: {
    color: "#fff",
    fontSize: "32px",
    fontWeight: "400",
    letterSpacing: "2px",
    margin: "8px 0 4px",
    fontFamily: "'Georgia', serif",
  },
  tagline: {
    color: "rgba(255,255,255,0.45)",
    fontSize: "13px",
    fontFamily: "sans-serif",
    margin: 0,
    letterSpacing: "0.5px",
  },
  tabs: {
    display: "flex",
    background: "rgba(255,255,255,0.05)",
    borderRadius: "12px",
    padding: "4px",
    marginBottom: "28px",
  },
  tab: {
    flex: 1,
    padding: "10px",
    border: "none",
    borderRadius: "9px",
    background: "transparent",
    color: "rgba(255,255,255,0.5)",
    cursor: "pointer",
    fontSize: "14px",
    fontFamily: "sans-serif",
    transition: "all 0.2s",
  },
  tabActive: {
    background: "rgba(255,255,255,0.15)",
    color: "#fff",
    fontWeight: "600",
  },
  form: { display: "flex", flexDirection: "column", gap: "16px" },
  field: { display: "flex", flexDirection: "column", gap: "6px" },
  label: {
    color: "rgba(255,255,255,0.6)",
    fontSize: "12px",
    letterSpacing: "1px",
    textTransform: "uppercase",
    fontFamily: "sans-serif",
  },
  input: {
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: "10px",
    padding: "12px 16px",
    color: "#fff",
    fontSize: "15px",
    fontFamily: "sans-serif",
    outline: "none",
    transition: "border 0.2s",
  },
  errorMsg: {
    fontSize: "13px",
    fontFamily: "sans-serif",
    margin: 0,
    textAlign: "center",
  },
  submitBtn: {
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    padding: "14px",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
    fontFamily: "sans-serif",
    letterSpacing: "0.5px",
    marginTop: "8px",
    transition: "opacity 0.2s",
  },
  hint: {
    textAlign: "center",
    color: "rgba(255,255,255,0.3)",
    fontSize: "12px",
    fontFamily: "sans-serif",
    marginTop: "20px",
    marginBottom: 0,
  },
};
