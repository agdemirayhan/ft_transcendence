"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import Cookies from "js-cookie";
import "../app/i18n";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

function authHeaders(): HeadersInit {
  const token = Cookies.get("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

type TrendingTag = { tag: string; count: number };

export default function RightSidebar() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const [trendingTags, setTrendingTags] = useState<TrendingTag[]>([]);
  const [isRTL, setIsRTL] = useState(false);

  useEffect(() => {
    const update = () => setIsRTL(i18n.language === "ar" || localStorage.getItem("language") === "ar");
    update();
    i18n.on("languageChanged", update);
    return () => i18n.off("languageChanged", update);
  }, [i18n]);

  useEffect(() => {
    fetch(`${API_URL}/posts/trending-hashtags`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setTrendingTags(data); })
      .catch(console.error);
  }, []);

  const textStyle = isRTL ? { direction: "rtl" as const, textAlign: "right" as const } : {};

  return (
    <>
      <div className="card">
        <div className="cardTitle" style={textStyle}>{t("home.trending")}</div>
        <div className="chips">
          {trendingTags.length === 0 && (
            <div className="muted" style={{ fontSize: 13, ...textStyle }}>No trending hashtags yet.</div>
          )}
          {trendingTags.map(({ tag, count }) => (
            <button
              key={tag}
              type="button"
              className="chip chipBtn"
              onClick={() => router.push(`/search?q=${encodeURIComponent(tag)}`)}
              title={`${count} post${count !== 1 ? "s" : ""}`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
