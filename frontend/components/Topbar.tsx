"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import Cookies from "js-cookie";
import "../app/i18n";

export default function Topbar() {
  const router = useRouter();
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [showLogout, setShowLogout] = useState(false);

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
          />
          <button className="btn btnSmall" type="submit">
            {t("home.search_btn")}
          </button>
        </form>
        <span className="spacer" />
        <button className="btn btnSmall btnOutline" onClick={() => setShowLogout(true)} type="button" style={{ whiteSpace: "nowrap", flexShrink: 0 }}>
          Log out
        </button>
      </header>

      {showLogout && (
        <div className="modalOverlay" style={{ backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" }} onClick={() => setShowLogout(false)}>
          <div className="modal" style={{ maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
            <div className="modalHeader">
              <h2>Log out</h2>
              <button className="ghostBtn" onClick={() => setShowLogout(false)} type="button">✕</button>
            </div>
            <p className="muted">Are you sure you want to log out?</p>
            <div className="modalActions">
              <button type="button" className="ghostBtn" onClick={() => setShowLogout(false)}>Cancel</button>
              <button type="button" className="btn" onClick={confirmLogout}>Log out</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
