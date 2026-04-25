"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import Cookies from "js-cookie";
import Avatar from "@/components/Avatar";
import "../app/i18n";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

function authHeaders(): HeadersInit {
  const token = Cookies.get("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

type Suggestion = { id: number; username: string; avatarUrl?: string | null; followers: number; isFollowing: boolean };

export default function Suggestions({ onFollow }: { onFollow?: () => void }) {
  const router = useRouter();
  const { t } = useTranslation();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [fadingIds, setFadingIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetch(`${API_URL}/users/suggestions`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setSuggestions(data); })
      .catch(console.error);
  }, []);

  async function toggleFollow(userId: number) {
    try {
      const res = await fetch(`${API_URL}/users/${userId}/follow`, { method: "POST", headers: authHeaders() });
      const data = await res.json();
      if (typeof data.isFollowing !== "boolean") return;
      if (data.isFollowing) onFollow?.();
      setFadingIds((prev) => new Set(prev).add(userId));
      setTimeout(() => {
        setSuggestions((prev) => prev.filter((s) => s.id !== userId));
        setFadingIds((prev) => { const next = new Set(prev); next.delete(userId); return next; });
      }, 400);
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div className="card">
      <div className="cardTitle">{t("home.suggestions")}</div>
      <div className="suggestions">
        {suggestions.map((u) => (
          <div
            key={u.id}
            className="suggestion"
            style={{
              opacity: fadingIds.has(u.id) ? 0 : 1,
              transform: fadingIds.has(u.id) ? "translateX(12px)" : "none",
            }}
          >
            <div className="row" onClick={() => router.push(`/profile/${u.id}`)}>
              <Avatar name={u.username} avatarUrl={u.avatarUrl} />
              <div>
                <div className="name">{u.username}</div>
                <div className="muted">@{u.username}</div>
              </div>
            </div>
            <button className="btn btnSmall" onClick={() => toggleFollow(u.id)} type="button">
              {t("home.follow")}
            </button>
          </div>
        ))}
        {suggestions.length === 0 && (
          <div className="muted" style={{ fontSize: 13 }}>No suggestions yet.</div>
        )}
      </div>
    </div>
  );
}
