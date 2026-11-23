
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (loginError || !data.session) {
        setError(loginError?.message || "Login failed");
        setLoading(false);
        return;
      }

      const response = await fetch("/api/admin/students", {
        headers: {
          Authorization: `Bearer ${data.session.access_token}`,
        },
      });

      if (!response.ok) {
        await supabase.auth.signOut();
        setError("This account is not authorized as LearnHub Admin.");
        setLoading(false);
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setError("Connection error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0b0e14",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        color: "#fff",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: "#151a23",
          border: "1px solid #252d3b",
          borderRadius: 20,
          padding: 32,
          boxShadow: "0 20px 60px rgba(0,0,0,.35)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 30 }}>
          <div
            style={{
              width: 56,
              height: 56,
              margin: "0 auto 15px",
              background: "#ff952b",
              color: "#111",
              borderRadius: 16,
              display: "grid",
              placeItems: "center",
              fontSize: 28,
              fontWeight: 900,
            }}
          >
            L
          </div>

          <h1 style={{ margin: 0, fontSize: 26 }}>LearnHub Admin</h1>
          <p style={{ color: "#929bad", marginTop: 8 }}>
            Sign in to manage your learning platform
          </p>
        </div>

        <form onSubmit={handleLogin}>
          <label style={{ display: "block", marginBottom: 8, color: "#cbd3df" }}>
            Admin Email
          </label>

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@example.com"
            required
            style={{
              width: "100%",
              padding: 14,
              marginBottom: 18,
              borderRadius: 10,
              background: "#0d121b",
              color: "#fff",
              border: "1px solid #30394a",
              boxSizing: "border-box",
            }}
          />

          <label style={{ display: "block", marginBottom: 8, color: "#cbd3df" }}>
            Password
          </label>

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
            style={{
              width: "100%",
              padding: 14,
              marginBottom: 20,
              borderRadius: 10,
              background: "#0d121b",
              color: "#fff",
              border: "1px solid #30394a",
              boxSizing: "border-box",
            }}
          />

          {error && (
            <div
              style={{
                padding: 12,
                marginBottom: 16,
                background: "#3a1c23",
                border: "1px solid #79323e",
                color: "#ff929f",
                borderRadius: 9,
                fontSize: 13,
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: 14,
              background: loading ? "#a86c27" : "#ff952b",
              color: "#111",
              border: "none",
              borderRadius: 10,
              fontWeight: 800,
              fontSize: 15,
              cursor: loading ? "wait" : "pointer",
            }}
          >
            {loading ? "Signing in..." : "Login to Admin →"}
          </button>
        </form>

        <p
          style={{
            textAlign: "center",
            color: "#697487",
            fontSize: 12,
            marginTop: 25,
          }}
        >
          Secure LearnHub Administration
        </p>
      </div>
    </main>
  );
}
