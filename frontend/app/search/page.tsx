"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import Cookies from "js-cookie";
import Avatar from "@/components/Avatar";
import Topbar from "@/components/Topbar";
import LeftSidebar from "@/components/LeftSidebar";
import RightSidebar from "@/components/RightSidebar";
import "../i18n";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

function authHeaders(): HeadersInit {
  const token = Cookies.get("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

type SearchUser = {
  id: number;
  username: string;
  bio: string | null;
  followers: number;
  posts: number;
  isFollowing: boolean;
};
function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();

  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [results, setResults] = useState<SearchUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [followingIds, setFollowingIds] = useState<Set<number>>(new Set());

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/users/search?q=${encodeURIComponent(q.trim())}`, {
        headers: authHeaders(),
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        const sorted = [...data].sort((a: SearchUser, b: SearchUser) => Number(b.isFollowing) - Number(a.isFollowing));
        setResults(sorted);
        setFollowingIds(new Set(data.filter((u: SearchUser) => u.isFollowing).map((u: SearchUser) => u.id)));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = Cookies.get("token");
    if (!token) { router.push("/"); return; }
    const q = searchParams.get("q") ?? "";
    setQuery(q);
    doSearch(q);
  }, [searchParams, doSearch, router]);

  async function toggleFollow(userId: number) {
    const isFollowing = followingIds.has(userId);
    try {
      await fetch(`${API_URL}/users/${userId}/follow`, {
        method: isFollowing ? "DELETE" : "POST",
        headers: authHeaders(),
      });
      setFollowingIds((prev) => {
        const next = new Set(prev);
        isFollowing ? next.delete(userId) : next.add(userId);
        return next;
      });
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div className="page">
      <Topbar />

      <main className="layout">
        <aside className="volume" />

        <aside className="left">
          <LeftSidebar />
        </aside>

        <section className="center">
          {loading && <p className="muted" style={{ textAlign: "center" }}>{t("search.loading")}</p>}

          {!loading && results.length === 0 && query.trim() && (
            <p className="muted" style={{ textAlign: "center", marginTop: 48 }}>
              {t("search.no_results", { query })}
            </p>
          )}

          {!loading && results.length > 0 && (
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              {results.map((user, idx) => (
                <div
                  key={user.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "14px 20px",
                    borderBottom: idx < results.length - 1 ? "1px solid var(--border)" : "none",
                    cursor: "pointer",
                  }}
                  onClick={() => router.push(`/profile/${user.id}`)}
                >
                  <Avatar name={user.username} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="name" style={{ fontWeight: 600 }}>{user.username}</div>
                    <div className="muted" style={{ fontSize: 13 }}>@{user.username}</div>
                    {user.bio && (
                      <div style={{ fontSize: 14, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {user.bio}
                      </div>
                    )}
                    <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                      {user.followers} {t("home.followers")} · {user.posts} {t("home.posts")}
                    </div>
                  </div>
                  <button
                    className={followingIds.has(user.id) ? "ghostBtn" : "btn btnSmall"}
                    type="button"
                    onClick={(e) => { e.stopPropagation(); toggleFollow(user.id); }}
                  >
                    {followingIds.has(user.id) ? t("profile.unfollow") : t("home.follow")}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <aside className="right">
          <RightSidebar />
        </aside>

        <aside className="volume" />
      </main>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="page"><Topbar /></div>}>
      <SearchContent />
    </Suspense>
  );
}