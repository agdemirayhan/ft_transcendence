"use client";

import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import "../app/i18n";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

export default function LeftSidebar() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isRTL, setIsRTL] = useState(false);

  useEffect(() => {
    const update = () => setIsRTL(i18n.language === "ar" || localStorage.getItem("language") === "ar");
    update();
    i18n.on("languageChanged", update);
    return () => i18n.off("languageChanged", update);
  }, [i18n]);

  useEffect(() => {
    const token = Cookies.get("token");
    if (!token) return;

    fetch(`${API_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => { if (data.role === "admin") setIsAdmin(true); })
      .catch(() => {});

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

  const textStyle = isRTL ? { direction: "rtl" as const, textAlign: "right" as const } : {};

  return (
    <div className="card">
      <div className="cardTitle" style={textStyle}>{t("home.shortcuts")}</div>
      <div className="list">
        <button className="linkBtn" type="button" style={textStyle} onClick={() => router.push("/home")}>{t("home.feed")}</button>
        <button className="linkBtn" type="button" style={textStyle} onClick={() => router.push("/explore")}>{t("home.explore")}</button>
        <button className="linkBtn" type="button" onClick={() => router.push("/messages")} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", ...textStyle }}>
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
        <button className="linkBtn" type="button" style={textStyle} onClick={() => router.push("/settings")}>{t("home.settings")}</button>
        {isAdmin && (
          <button className="linkBtn" type="button" onClick={() => router.push("/admin")} style={{ color: "var(--accent)", fontWeight: 700, ...textStyle }}>
            {t("home.admin_panel")}
          </button>
        )}
      </div>
    </div>
  );
}
