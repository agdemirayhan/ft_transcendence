"use client";

import { useState, useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import Image from "next/image";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

function LegalModal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div
      className="modalOverlay"
      style={{ backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", zIndex: 1000 }}
      onClick={onClose}
    >
      <div
        className="modal"
        style={{ maxWidth: 640, maxHeight: "80vh", overflowY: "auto", lineHeight: 1.7 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modalHeader">
          <h2>{title}</h2>
          <button className="ghostBtn" onClick={onClose} type="button">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function PrivacyContent() {
  return (
    <>
      <p className="muted" style={{ marginBottom: "1rem" }}>Last updated: April 25, 2026</p>

      <h3>1. Information We Collect</h3>
      <p>When you create an account we collect your email address, username, and password (stored as a secure hash). You may optionally provide a profile photo and a short bio.</p>
      <p>We also store content you create: posts, comments, likes, and direct messages.</p>

      <h3>2. How We Use Your Information</h3>
      <p>We use your information solely to operate miniSocial. We do not sell, rent, or share your personal data with third parties for marketing purposes.</p>
      <p>Your email is used only for authentication. We do not send promotional emails.</p>

      <h3>3. Data Storage</h3>
      <p>All data is stored in a PostgreSQL database. We take reasonable technical measures to protect your data.</p>

      <h3>4. Cookies</h3>
      <p>We use a single session cookie to keep you logged in. No tracking or advertising cookies are used.</p>

      <h3>5. Your Rights</h3>
      <p>You may delete your account at any time from the settings page. Upon deletion all your posts, messages, and personal data are permanently removed.</p>

      <h3>6. Contact</h3>
      <p>For privacy-related questions please contact the administrator via the platform.</p>
    </>
  );
}

function TermsContent() {
  return (
    <>
      <p className="muted" style={{ marginBottom: "1rem" }}>Last updated: April 25, 2026</p>

      <h3>1. Acceptance of Terms</h3>
      <p>By creating an account or using miniSocial you agree to these Terms of Service. If you do not agree, do not use the platform.</p>

      <h3>2. Eligibility</h3>
      <p>You must be at least 13 years old to use miniSocial.</p>

      <h3>3. Your Account</h3>
      <p>You are responsible for keeping your credentials secure. You are responsible for all activity that occurs under your account.</p>

      <h3>4. Acceptable Use</h3>
      <p>You agree not to post illegal or harmful content, impersonate others, attempt unauthorized access, or use automated tools to spam the platform.</p>

      <h3>5. Content Ownership</h3>
      <p>You retain ownership of the content you post. By posting you grant us a limited license to display that content to other users.</p>

      <h3>6. Content Removal</h3>
      <p>We reserve the right to remove content that violates these terms. Repeat violators may be suspended or deleted.</p>

      <h3>7. Disclaimer</h3>
      <p>miniSocial is provided as-is without warranties of any kind. We are not liable for any damages arising from your use of the platform.</p>

      <h3>8. Contact</h3>
      <p>For questions about these terms please contact the administrator via the platform.</p>
    </>
  );
}

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const [modal, setModal] = useState<"privacy" | "terms" | null>(null);

  useEffect(() => {
    if (Cookies.get("token")) router.replace("/home");
  }, []);

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

      if (mode === "login") {
        Cookies.set("token", data.access_token, { expires: 1 });
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
            onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
          />

          {mode === "signup" && (
            <input
              className="authInput"
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
            />
          )}

          <input
            className={`authInput ${error && isValidEmail(email) && mode === "signup" && !isValidPassword(password) ? "inputError" : ""}`}
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
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

        <p className="muted" style={{ fontSize: 12, textAlign: "center", marginTop: "1rem" }}>
          By continuing you agree to our{" "}
          <button type="button" onClick={() => setModal("terms")} style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer", fontSize: 12, padding: 0 }}>
            Terms of Service
          </button>
          {" "}and{" "}
          <button type="button" onClick={() => setModal("privacy")} style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer", fontSize: 12, padding: 0 }}>
            Privacy Policy
          </button>.
        </p>
      </div>

      {modal === "terms" && (
        <LegalModal title="Terms of Service" onClose={() => setModal(null)}>
          <TermsContent />
        </LegalModal>
      )}

      {modal === "privacy" && (
        <LegalModal title="Privacy Policy" onClose={() => setModal(null)}>
          <PrivacyContent />
        </LegalModal>
      )}
    </div>
  );
}
