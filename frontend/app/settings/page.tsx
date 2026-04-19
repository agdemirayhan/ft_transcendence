"use client";

import { useRouter } from "next/navigation";
import { ChangeEvent, useEffect, useState } from "react";
import Cookies from "js-cookie";
import { useTranslation } from "react-i18next";
import "../i18n";
import Topbar from "@/components/Topbar";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

type Language = "en" | "de" | "tr";

export default function SettingsPage() {
  const router = useRouter();
  const { t, i18n } = useTranslation();

  const [isTwoFactorEnabled, setIsTwoFactorEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [oauthPopupOpen, setOauthPopupOpen] = useState(false);
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
          i18n.changeLanguage(savedLanguage);
        }
        if (!token) { setIsLoading(false); return; }
        const res = await fetch(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Could not load profile.");
        setIsTwoFactorEnabled(Boolean(data.twoFactorEnabled));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load profile.");
      } finally {
        setIsLoading(false);
      }
    }
    loadProfile();
  }, []);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) {
        return;
      }

      if (event.data?.type === "twofactor:enabled") {
        setIsTwoFactorEnabled(true);
        setOauthPopupOpen(false);
        setMessage(t("settings.2fa_enabled"));
      }
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [t]);

  async function handleLanguageChange(e: ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value as Language;
    setLanguage(value);
    localStorage.setItem("language", value);
    i18n.changeLanguage(value);
    setMessage(t("settings.language_updated"));
    setError("");

    try {
      const token = Cookies.get("token");
      if (token) {
        await fetch(`${API_URL}/auth/language`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ language: value }),
        });
      }
    } catch {
    }
  }

  async function startEnable2FA() {
    setError(""); setMessage(""); setIsSubmitting(true);
    const popup = window.open("", "oauth2_popup", "popup=yes,width=560,height=760");
    if (!popup) {
      setIsSubmitting(false);
      setError("Popup blocked. Please allow popups and try again.");
      return;
    }

    try {
      const token = Cookies.get("token");
      if (!token) throw new Error("No auth token found.");
      const res = await fetch(`${API_URL}/2fa/generate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        popup.close();
        throw new Error(data.message || "Could not start OAuth2.");
      }

      if (!data.oauth2Url) {
        popup.close();
        throw new Error("OAuth2 URL was not provided by backend.");
      }

      popup.location.href = data.oauth2Url;
      setOauthPopupOpen(true);
      setMessage(t("settings.oauth_popup_started"));
    } catch (err) {
      popup.close();
      setError(err instanceof Error ? err.message : "Could not enable 2FA.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function confirmEnable2FA() {
    setError(""); setMessage(""); setIsSubmitting(true);
    try {
      const token = Cookies.get("token");
      if (!token) throw new Error("No auth token found.");
      const res = await fetch(`${API_URL}/2fa/verify-setup`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "OAuth2 setup not completed yet.");
      setIsTwoFactorEnabled(true);
      setOauthPopupOpen(false);
      setMessage(data.message || "2FA enabled.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not verify OAuth2 setup.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function disable2FA() {
    setError(""); setMessage(""); setIsSubmitting(true);
    try {
      const token = Cookies.get("token");
      if (!token) throw new Error("No auth token found.");
      const res = await fetch(`${API_URL}/2fa/disable`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Could not disable 2FA.");
      setIsTwoFactorEnabled(false);
      setOauthPopupOpen(false);
      setMessage(data.message || "2FA disabled.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not disable 2FA.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function deleteAccount() {
    setError(""); setMessage(""); setIsDeleting(true);
    try {
      const token = Cookies.get("token");
      if (!token) throw new Error("No auth token found.");
      const res = await fetch(`${API_URL}/auth/delete-account`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Could not delete account.");
      Cookies.remove("token");
      localStorage.removeItem("language");
      setShowDeleteModal(false);
      setDeleteConfirmText("");
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete account.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="page">
      <Topbar />

      <main style={{ maxWidth: 600, margin: "40px auto", padding: "0 16px" }}>
        <div className="card">
          <div className="cardTitle">{t("settings.title")}</div>

          {isLoading ? <p className="muted">{t("settings.loading")}</p> : null}

          {!isLoading ? (
            <p className="muted" style={{ marginTop: 0 }}>
              {isTwoFactorEnabled ? t("settings.2fa_enabled") : t("settings.2fa_disabled")}
            </p>
          ) : null}

          {message ? <p style={{ color: "#22c55e" }}>{message}</p> : null}
          {error ? <p className="authError">{error}</p> : null}

          <div style={{ display: "grid", gap: 10, marginBottom: 24 }}>
            <label className="muted" htmlFor="language-select">
              {t("settings.language_label")}
            </label>
            <select
              id="language-select"
              className="authInput language"
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
                {isSubmitting ? t("settings.generating") : t("settings.enable_2fa")}
              </button>
              {oauthPopupOpen ? (
                <button
                  className="btn"
                  type="button"
                  onClick={confirmEnable2FA}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? t("settings.verifying") : t("settings.confirm_setup")}
                </button>
              ) : null}
            </div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              <button
                className="ghostBtn"
                type="button"
                onClick={disable2FA}
                disabled={isSubmitting}
              >
                {isSubmitting ? t("settings.disabling") : t("settings.disable_2fa")}
              </button>
            </div>
          )}

          <div style={{ borderTop: "1px solid #e5e7eb", margin: "24px 0" }} />

          <div style={{ display: "grid", gap: 10 }}>
            <div className="cardTitle" style={{ fontSize: 18 }}>
              {t("settings.danger_zone")}
            </div>
            <p className="muted" style={{ marginTop: 0 }}>
              {t("settings.danger_desc")}
            </p>
            <button
              type="button"
              className="ghostBtn"
              onClick={() => { setDeleteConfirmText(""); setShowDeleteModal(true); }}
              style={{ borderColor: "#ef4444", color: "#ef4444" }}
            >
              {t("settings.delete_account")}
            </button>
          </div>
        </div>
      </main>

      {showDeleteModal ? (
        <div className="modalOverlay" style={{ backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" }}>
          <div className="modal" style={{ maxWidth: 420 }}>
            <h2 style={{ margin: 0 }}>{t("settings.delete_modal_title")}</h2>
            <p className="muted" style={{ margin: 0 }}>
              {t("settings.delete_modal_desc")}
            </p>
            <input
              className="authInput"
              value={deleteConfirmText}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setDeleteConfirmText(e.target.value)}
              placeholder={t("settings.delete_placeholder")}
            />
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                type="button"
                className="ghostBtn"
                onClick={() => { setShowDeleteModal(false); setDeleteConfirmText(""); }}
                disabled={isDeleting}
              >
                {t("settings.cancel")}
              </button>
              <button
                type="button"
                className="btn"
                onClick={deleteAccount}
                disabled={deleteConfirmText !== "DELETE" || isDeleting}
                style={{ background: "#ef4444", borderColor: "#ef4444" }}
              >
                {isDeleting ? t("settings.deleting") : t("settings.delete_permanently")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}