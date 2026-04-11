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

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
  }

  function logout() {
    Cookies.remove("token");
    router.push("/");
  }

  return (
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
      <button className="btn btnSmall btnOutline" onClick={logout} type="button" style={{ whiteSpace: "nowrap", flexShrink: 0 }}>
        Log out
      </button>
    </header>
  );
}
