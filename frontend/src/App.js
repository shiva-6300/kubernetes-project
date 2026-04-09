import React, { useState, useEffect } from "react";
import Login from "./Login";
import Blog from "./Blog";

export default function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  // Restore session from localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");
    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.clear();
      }
    }
  }, []);

  const handleLogin = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setToken(null);
  };

  if (!user || !token) {
    return <Login onLogin={handleLogin} />;
  }

  return <Blog user={user} token={token} onLogout={handleLogout} />;
}
