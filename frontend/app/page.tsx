"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError("");
    setLoading(true);

    try {
      const url = mode === "login"
        ? `${API_URL}/auth/login`
        : `${API_URL}/auth/signup`;

      const body = mode === "login"
        ? { email, password }
        : { email, username, password };

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Something went wrong.");
        return;
      }

      if (mode === "login") {
        if (data.requiresTwoFactor && data.tempToken) {
          sessionStorage.setItem("tempToken", data.tempToken);
          router.push("/2fa");
          return;
        }

        localStorage.setItem("token", data.access_token);
        router.push("/home");
      } else {
        setMode("login");
        setError("Account created! Please login.");
      }
    } catch {
      setError("Could not connect to server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="authPage">
      <div className="authCard">
        <div className="authTabs">
          <button
            className={`authTab ${mode === "login" ? "active" : ""}`}
            onClick={() => { setMode("login"); setError(""); }}
            type="button"
          >
            Login
          </button>
          <button
            className={`authTab ${mode === "signup" ? "active" : ""}`}
            onClick={() => { setMode("signup"); setError(""); }}
            type="button"
          >
            Sign Up
          </button>
        </div>

        <div className="authFields">
          <input
            className="authInput"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          {mode === "signup" && (
            <input
              className="authInput"
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          )}

          <input
            className="authInput"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && <p className="authError">{error}</p>}

          <button
            className="btn btnWide"
            onClick={handleSubmit}
            disabled={loading}
            type="button"
          >
            {loading ? "Loading..." : mode === "login" ? "Login" : "Sign Up"}
          </button>
        </div>
      </div>
    </div>
  );
}