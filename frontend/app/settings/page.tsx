"use client";

import { useRouter } from "next/navigation";
import { ChangeEvent, useEffect, useState } from "react";
import Cookies from "js-cookie";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

type Language = "en" | "de" | "tr";

export default function SettingsPage() {
  const router = useRouter();

  const [isTwoFactorEnabled, setIsTwoFactorEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [setupToken, setSetupToken] = useState("");
  const [disableToken, setDisableToken] = useState("");

  const [language, setLanguage] = useState<Language>("en");

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProfile() {
      const token = Cookies.get("token");

      try {
        const savedLanguage = localStorage.getItem("language") as Language | null;
        if (savedLanguage === "en" || savedLanguage === "de" || savedLanguage === "tr") {
          setLanguage(savedLanguage);
        }

        if (!token) {
          setIsLoading(false);
          return;
        }

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
  }, []);

  function handleLanguageChange(e: ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value as Language;
    setLanguage(value);
    localStorage.setItem("language", value);
    setMessage("Language updated.");
    setError("");

    //i18n comes here
  }

  async function startEnable2FA() {
    setError("");
    setMessage("");
    setIsSubmitting(true);

    try {
      const token = Cookies.get("token");
      if (!token) {
        throw new Error("No auth token found.");
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
      const token = Cookies.get("token");
      if (!token) {
        throw new Error("No auth token found.");
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
      const token = Cookies.get("token");
      if (!token) {
        throw new Error("No auth token found.");
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

  async function deleteAccount() {
    setError("");
    setMessage("");
    setIsDeleting(true);

    try {
      const token = Cookies.get("token");
      if (!token) {
        throw new Error("No auth token found.");
      }

      const res = await fetch(`${API_URL}/auth/delete-account`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || "Could not delete account.");
      }

      Cookies.remove("token");
      localStorage.removeItem("language");

      setShowDeleteModal(false);
      setDeleteConfirmText("");
      router.push("/");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not delete account.";
      setError(msg);
    } finally {
      setIsDeleting(false);
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

          <div style={{ display: "grid", gap: 10, marginBottom: 24 }}>
            <label className="muted" htmlFor="language-select">
              Language
            </label>
            <select
              id="language-select"
              className="authInput"
              value={language}
              onChange={handleLanguageChange}
            >
              <option value="en">English</option>
              <option value="de">Deutsch</option>
              <option value="tr">Türkçe</option>
            </select>
          </div>

          <div style={{ borderTop: "1px solid #e5e7eb", margin: "20px 0" }} />

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

          <div style={{ borderTop: "1px solid #e5e7eb", margin: "24px 0" }} />

          <div style={{ display: "grid", gap: 10 }}>
            <div className="cardTitle" style={{ fontSize: 18 }}>
              Danger Zone
            </div>
            <p className="muted" style={{ marginTop: 0 }}>
              Permanently delete your account and all related data.
            </p>

            <button
              type="button"
              className="ghostBtn"
              onClick={() => {
                setDeleteConfirmText("");
                setShowDeleteModal(true);
              }}
              style={{
                borderColor: "#ef4444",
                color: "#ef4444",
              }}
            >
              Delete account
            </button>
          </div>
        </div>
      </main>

      {showDeleteModal ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            display: "grid",
            placeItems: "center",
            padding: 16,
            zIndex: 1000,
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 420,
              background: "#fff",
              borderRadius: 16,
              padding: 20,
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
              display: "grid",
              gap: 12,
            }}
          >
            <h2 style={{ margin: 0 }}>Delete account</h2>
            <p className="muted" style={{ margin: 0 }}>
              This action cannot be undone. Type <strong>DELETE</strong> to confirm.
            </p>

            <input
              className="authInput"
              value={deleteConfirmText}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setDeleteConfirmText(e.target.value)}
              placeholder='Type "DELETE"'
            />

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                type="button"
                className="ghostBtn"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText("");
                }}
                disabled={isDeleting}
              >
                Cancel
              </button>

              <button
                type="button"
                className="btn"
                onClick={deleteAccount}
                disabled={deleteConfirmText !== "DELETE" || isDeleting}
                style={{
                  background: "#ef4444",
                  borderColor: "#ef4444",
                }}
              >
                {isDeleting ? "Deleting..." : "Delete permanently"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}