"use client";

import { useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

export default function TwoFactorLoginPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleVerify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const tempToken = sessionStorage.getItem("tempToken");
      if (!tempToken) {
        setError("Missing temporary login token. Please login again.");
        router.push("/");
        return;
      }

      const res = await fetch(`${API_URL}/2fa/verify-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tempToken, token }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Invalid 2FA token.");
        return;
      }

      sessionStorage.removeItem("tempToken");
      localStorage.setItem("token", data.access_token);
      router.push("/home");
    } catch {
      setError("Could not connect to server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="authPage">
      <div className="authCard">
        <h2 style={{ marginTop: 0, marginBottom: 8 }}>Two-factor verification</h2>
        <p className="muted" style={{ marginTop: 0, marginBottom: 16 }}>
          Enter the 6-digit code from your authenticator app.
        </p>

        <form onSubmit={handleVerify} className="authFields">
          <input
            className="authInput"
            value={token}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setToken(e.target.value.replace(/\D/g, "").slice(0, 6))
            }
            placeholder="123456"
            inputMode="numeric"
            maxLength={6}
          />

          {error ? <p className="authError">{error}</p> : null}

          <button className="btn btnWide" type="submit" disabled={loading || token.length !== 6}>
            {loading ? "Verifying..." : "Verify"}
          </button>

          <button
            className="ghostBtn"
            type="button"
            onClick={() => {
              sessionStorage.removeItem("tempToken");
              router.push("/");
            }}
          >
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
}
