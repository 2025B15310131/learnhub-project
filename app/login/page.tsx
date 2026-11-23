
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (loading) return;

    setLoading(true);
    setError("");

    try {
      const { data, error: loginError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (loginError) {
        setError(loginError.message);
        setLoading(false);
        return;
      }

      if (!data.session) {
        setError("Login session could not be created.");
        setLoading(false);
        return;
      }

      const response = await fetch("/api/auth/role", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${data.session.access_token}`,
        },
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok || !result.authorized) {
        await supabase.auth.signOut();

        if (result.role === "blocked") {
          setError("Your account has been blocked.");
        } else if (result.role === "expired") {
          setError("Your student license has expired.");
        } else {
          setError(result.error || "Your account is not authorized.");
        }

        setLoading(false);
        return;
      }

      if (result.role === "admin") {
        router.replace("/admin");
        router.refresh();
        return;
      }

      if (result.role === "student") {
        router.replace("/");
        router.refresh();
        return;
      }

      await supabase.auth.signOut();

      setError("Invalid account role.");
      setLoading(false);
    } catch (err) {
      console.error("Login error:", err);

      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0b0e14",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        color: "#ffffff",
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
          boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 30 }}>
          <div
            style={{
              width: 60,
              height: 60,
              margin: "0 auto 15px",
              background: "#ff952b",
              color: "#111111",
              borderRadius: 17,
              display: "grid",
              placeItems: "center",
              fontSize: 30,
              fontWeight: 900,
            }}
          >
            L
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: 28,
              color: "#ffffff",
            }}
          >
            LearnHub
          </h1>

          <p
            style={{
              color: "#929bad",
              marginTop: 8,
            }}
          >
            Learn today. Build tomorrow.
          </p>

          <p
            style={{
              color: "#cbd3df",
              fontSize: 14,
              marginTop: 20,
            }}
          >
            Login to continue learning
          </p>
        </div>

        <form onSubmit={handleLogin}>
          <label
            htmlFor="email"
            style={{
              display: "block",
              marginBottom: 8,
              color: "#cbd3df",
              fontSize: 14,
            }}
          >
            Email Address
          </label>

          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            autoComplete="email"
            required
            disabled={loading}
            style={{
              width: "100%",
              padding: 14,
              marginBottom: 18,
              borderRadius: 10,
              background: "#0d121b",
              color: "#ffffff",
              border: "1px solid #30394a",
              boxSizing: "border-box",
              outline: "none",
            }}
          />

          <label
            htmlFor="password"
            style={{
              display: "block",
              marginBottom: 8,
              color: "#cbd3df",
              fontSize: 14,
            }}
          >
            Password
          </label>

          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            autoComplete="current-password"
            required
            disabled={loading}
            style={{
              width: "100%",
              padding: 14,
              marginBottom: 20,
              borderRadius: 10,
              background: "#0d121b",
              color: "#ffffff",
              border: "1px solid #30394a",
              boxSizing: "border-box",
              outline: "none",
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
              padding: 15,
              background: loading ? "#a86c27" : "#ff952b",
              color: "#111111",
              border: "none",
              borderRadius: 10,
              fontWeight: 800,
              fontSize: 15,
              cursor: loading ? "wait" : "pointer",
              opacity: loading ? 0.8 : 1,
            }}
          >
            {loading ? "Signing in..." : "Login to LearnHub →"}
          </button>
        </form>

        <div
          style={{
            marginTop: 25,
            padding: 14,
            background: "#101722",
            border: "1px solid #252d3b",
            borderRadius: 10,
            textAlign: "center",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 12,
              color: "#8995a8",
            }}
          >
            Secure login for students and administrators
          </p>
        </div>
      </div>
    </main>
  );
}
