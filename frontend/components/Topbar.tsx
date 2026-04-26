"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import Cookies from "js-cookie";
import "../app/i18n";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

export default function Topbar() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const [searchQuery, setSearchQuery] = useState("");
  const [showLogout, setShowLogout] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const token = Cookies.get("token");
    if (!token) return;

    fetch(`${API_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => { if (data.role === "admin") setIsAdmin(true); })
      .catch(() => {});

    const fetchCount = () =>
      fetch(`${API_URL}/auth/unread-count`, { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .then((data) => { if (typeof data.count === "number") setUnreadCount(data.count); })
        .catch(() => {});

    fetchCount();
    const interval = setInterval(fetchCount, 5000);
    return () => clearInterval(interval);
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
  }

  async function confirmLogout() {
    const token = Cookies.get("token");
    if (token) {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000"}/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
    Cookies.remove("token");
    router.push("/");
  }

  function navigate(path: string) {
    setMobileMenuOpen(false);
    router.push(path);
  }

  return (
    <>
      <header className="topbar">
        <div className="brand" style={{ cursor: "pointer" }} onClick={() => router.push("/home")}>
          <img src="/favicon-32x32.png" alt="miniSocial" width={32} height={32} />
        </div>
        <form onSubmit={handleSearch} style={{ display: "flex", gap: 8, flex: 1 }}>
          <input
            className="search"
            placeholder={t("home.search")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            dir={isRTL ? "rtl" : "ltr"}
          />
          <button className="btn btnSmall topbarSearchBtn" type="submit">
            {t("home.search_btn")}
          </button>
        </form>
        <span className="spacer" />
        <button className="btn btnSmall btnOutline topbarLogout" onClick={() => setShowLogout(true)} type="button" style={{ whiteSpace: "nowrap", flexShrink: 0 }}>
          {t("home.logout")}
        </button>
        <button
          className="mobileMenuBtn"
          type="button"
          onClick={() => setMobileMenuOpen((v) => !v)}
          aria-label="Menu"
        >
          {mobileMenuOpen ? "✕" : "☰"}
          {!mobileMenuOpen && unreadCount > 0 && (
            <span className="mobileMenuBadge">{unreadCount}</span>
          )}
        </button>
      </header>

      {mobileMenuOpen && (
        <nav className="mobileMenu">
          <button className="mobileMenuLink" type="button" onClick={() => navigate("/home")}>{t("home.feed")}</button>
          <button className="mobileMenuLink" type="button" onClick={() => navigate("/explore")}>{t("home.explore")}</button>
          <button className="mobileMenuLink" type="button" onClick={() => navigate("/messages")} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {t("home.messages")}
            {unreadCount > 0 && <span className="mobileMenuBadge" style={{ position: "static" }}>{unreadCount}</span>}
          </button>
          <button className="mobileMenuLink" type="button" onClick={() => navigate("/settings")}>{t("home.settings")}</button>
          {isAdmin && (
            <button className="mobileMenuLink" type="button" onClick={() => navigate("/admin")} style={{ color: "var(--accent)", fontWeight: 700 }}>
              {t("home.admin_panel")}
            </button>
          )}
          <button className="mobileMenuLink mobileMenuLinkLogout" type="button" onClick={() => { setMobileMenuOpen(false); setShowLogout(true); }}>
            {t("home.logout")}
          </button>
        </nav>
      )}

      {showLogout && (
        <div className="modalOverlay" style={{ backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" }} onClick={() => setShowLogout(false)}>
          <div className="modal" style={{ maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
            <div className="modalHeader">
              <h2>{t("home.logout")}</h2>
              <button className="ghostBtn" onClick={() => setShowLogout(false)} type="button">✕</button>
            </div>
            <p className="muted">{t("home.logout_confirm")}</p>
            <div className="modalActions">
              <button type="button" className="ghostBtn" onClick={() => setShowLogout(false)}>{t("settings.cancel")}</button>
              <button type="button" className="btn" onClick={confirmLogout}>{t("home.logout")}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
