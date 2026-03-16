"use client";

import { useRouter } from "next/navigation";
import { ChangeEvent, useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

export default function SettingsPage() {
  const router = useRouter();
  const [isTwoFactorEnabled, setIsTwoFactorEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [setupToken, setSetupToken] = useState("");
  const [disableToken, setDisableToken] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProfile() {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/");
        return;
      }

      try {
        const res = await fetch(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || "Could not load profile.");
        }

        setIsTwoFactorEnabled(Boolean(data.twoFactorEnabled));
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Could not load profile.";
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    }

    loadProfile();
  }, [router]);

  async function startEnable2FA() {
    setError("");
    setMessage("");
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/");
        return;
      }

      const res = await fetch(`${API_URL}/2fa/generate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Could not generate QR code.");
      }

      setQrCodeDataUrl(data.qrCodeDataUrl);
      setMessage("QR code generated. Scan it and enter your 6-digit code.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not enable 2FA.";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function confirmEnable2FA() {
    setError("");
    setMessage("");
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/");
        return;
      }

      const res = await fetch(`${API_URL}/2fa/verify-setup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ token: setupToken }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Invalid setup token.");
      }

      setIsTwoFactorEnabled(true);
      setSetupToken("");
      setQrCodeDataUrl(null);
      setMessage(data.message || "2FA enabled.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not verify setup token.";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function disable2FA() {
    setError("");
    setMessage("");
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/");
        return;
      }

      const res = await fetch(`${API_URL}/2fa/disable`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ token: disableToken }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Could not disable 2FA.");
      }

      setIsTwoFactorEnabled(false);
      setDisableToken("");
      setQrCodeDataUrl(null);
      setMessage(data.message || "2FA disabled.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not disable 2FA.";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="page">
      <header className="topbar">
        <button className="ghostBtn" onClick={() => router.back()} type="button">
          ← Back
        </button>
      </header>

      <main style={{ maxWidth: 600, margin: "40px auto", padding: "0 16px" }}>
        <div className="card">
          <div className="cardTitle">Settings</div>

          {isLoading ? <p className="muted">Loading...</p> : null}
          {!isLoading ? (
            <p className="muted" style={{ marginTop: 0 }}>
              Two-factor authentication is {isTwoFactorEnabled ? "enabled" : "disabled"}.
            </p>
          ) : null}

          {message ? <p style={{ color: "#22c55e" }}>{message}</p> : null}
          {error ? <p className="authError">{error}</p> : null}

          {!isTwoFactorEnabled ? (
            <div style={{ display: "grid", gap: 12 }}>
              <button className="btn" type="button" onClick={startEnable2FA} disabled={isSubmitting}>
                {isSubmitting ? "Generating..." : "Enable 2FA"}
              </button>

              {qrCodeDataUrl ? (
                <>
                  <img src={qrCodeDataUrl} alt="2FA QR code" className="qrPreview" />

                  <input
                    className="authInput"
                    value={setupToken}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setSetupToken(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    placeholder="Enter 6-digit code"
                    inputMode="numeric"
                    maxLength={6}
                  />

                  <button
                    className="btn"
                    type="button"
                    onClick={confirmEnable2FA}
                    disabled={isSubmitting || setupToken.length !== 6}
                  >
                    {isSubmitting ? "Verifying..." : "Confirm setup"}
                  </button>
                </>
              ) : null}
            </div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              <input
                className="authInput"
                value={disableToken}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setDisableToken(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="Enter current 6-digit code"
                inputMode="numeric"
                maxLength={6}
              />
              <button
                className="ghostBtn"
                type="button"
                onClick={disable2FA}
                disabled={isSubmitting || disableToken.length !== 6}
              >
                {isSubmitting ? "Disabling..." : "Disable 2FA"}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}