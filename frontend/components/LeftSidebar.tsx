"use client";

import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import "../app/i18n";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

export default function LeftSidebar() {
  const router = useRouter();
  const { t } = useTranslation();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const token = Cookies.get("token");
    if (!token) return;

    const fetchCount = () =>
      fetch(`${API_URL}/auth/unread-count`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((data) => { if (typeof data.count === "number") setUnreadCount(data.count); })
        .catch(() => {});

    fetchCount();
    const interval = setInterval(fetchCount, 5 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="card">
      <div className="cardTitle">{t("home.shortcuts")}</div>
      <div className="list">
        <button className="linkBtn" type="button" onClick={() => router.push("/home")}>{t("home.feed")}</button>
        <button className="linkBtn" type="button">{t("home.explore")}</button>
        <button className="linkBtn" type="button" onClick={() => router.push("/messages")} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {t("home.messages")}
          {unreadCount > 0 && (
            <span style={{
              background: "var(--accent)",
              color: "#fff",
              borderRadius: "999px",
              fontSize: 11,
              fontWeight: 700,
              padding: "2px 7px",
              minWidth: 20,
              textAlign: "center",
            }}>{unreadCount}</span>
          )}
        </button>
        <button className="linkBtn" type="button" onClick={() => router.push("/settings")}>{t("home.settings")}</button>
      </div>
    </div>
  );
}
