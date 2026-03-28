"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import Image from "next/image";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  function triggerShake() {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  }

  function isValidPassword(password: string): boolean {
    return password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[0-9]/.test(password);
  }

  function isValidEmail(email: string): boolean {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  async function handleSubmit() {
    setError("");
    setLoading(true);

    if (!isValidEmail(email)) {
      setError("Please enter a valid email address.");
      triggerShake();
      setLoading(false);
      return;
    }

    if (mode === "signup" && !isValidPassword(password)) {
      setError("Password must be at least 8 characters, include a number and an uppercase letter.");
      triggerShake();
      setLoading(false);
      return;
    }

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
        triggerShake();
        return;
      }

      // Erfolgreich
      if (mode === "login") {
        Cookies.set("token", data.access_token, { expires: 1 });
        alert("✅ Login successful!");
        router.push("/home");        // ändere zu /profile oder /dashboard wenn du willst
      } else {
        setMode("login");
        setError("Account created! Please login now.");
        setEmail("");
        setUsername("");
        setPassword("");
      }
    } catch (err) {
      setError("Could not connect to server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="authPage">
      {/* ── Brand ── */}
      <div className="authBrand">
        <Image
          src="/android-chrome-192x192.png"
          alt="miniSocial logo"
          width={144}
          height={144}
          className="authLogo"
          priority
        />
        <h1 className="authLogoText">miniSocial</h1>
        <p className="authTagline">where people get social</p>
      </div>

      {/* ── Card ── */}
      <div className={`authCard ${shake ? "shake" : ""}`}>
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
            className={`authInput ${error && !isValidEmail(email) ? "inputError" : ""}`}
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
            className={`authInput ${error && isValidEmail(email) && mode === "signup" && !isValidPassword(password) ? "inputError" : ""}`}
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
