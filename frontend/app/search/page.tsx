"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import Cookies from "js-cookie";
import Avatar from "@/components/Avatar";
import Topbar from "@/components/Topbar";
import LeftSidebar from "@/components/LeftSidebar";
import RightSidebar from "@/components/RightSidebar";
import Post, { PostType } from "@/components/Post";
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
  avatarUrl?: string | null;
  bio: string | null;
  followers: number;
  posts: number;
  isFollowing: boolean;
};

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function mapPost(p: {
  id: number;
  content: string;
  createdAt: string;
  author: { id: number; username: string; avatarUrl?: string | null };
  counts: { likes: number; comments: number };
  files?: Array<{ id: number; filename: string; url: string }>;
}): PostType {
  return {
    id: p.id,
    authorId: p.author.id,
    author: p.author.username,
    authorAvatarUrl: p.author.avatarUrl,
    handle: `@${p.author.username}`,
    time: timeAgo(p.createdAt),
    content: p.content,
    files: Array.isArray(p.files) ? p.files : [],
    likes: p.counts.likes,
    comments: p.counts.comments ?? 0,
    liked: false,
    createdAt: p.createdAt,
  };
}

function getSearchMode(q: string): "user" | "hashtag" | "both" {
  const trimmed = q.trim();
  if (trimmed.startsWith("#")) return "hashtag";
  if (trimmed.startsWith("@")) return "user";
  return "both";
}

async function fetchUsers(q: string): Promise<SearchUser[]> {
  const res = await fetch(`${API_URL}/users/search?q=${encodeURIComponent(q)}`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!Array.isArray(data)) return [];
  return [...data].sort((a: SearchUser, b: SearchUser) => Number(b.isFollowing) - Number(a.isFollowing));
}

async function fetchPosts(q: string): Promise<PostType[]> {
  const res = await fetch(`${API_URL}/posts/search?q=${encodeURIComponent(q)}`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!Array.isArray(data)) return [];
  return data.map(mapPost);
}

function UserCard({
  user,
  isFollowing,
  onFollow,
  onNavigate,
}: {
  user: SearchUser;
  isFollowing: boolean;
  onFollow: () => void;
  onNavigate: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="card searchUserCard" onClick={onNavigate}>
      <div className="searchUserCardInner">
        <Avatar name={user.username} avatarUrl={user.avatarUrl} />
        <div className="searchUserInfo">
          <div className="name">{user.username}</div>
          <div className="muted" style={{ fontSize: 13 }}>@{user.username}</div>
          {user.bio && (
            <div className="searchUserBio">{user.bio}</div>
          )}
          <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
            {user.followers} {t("home.followers")} · {user.posts} {t("home.posts")}
          </div>
        </div>
        <button
          className={isFollowing ? "ghostBtn" : "btn btnSmall"}
          type="button"
          onClick={(e) => { e.stopPropagation(); onFollow(); }}
        >
          {isFollowing ? t("profile.unfollow") : t("home.follow")}
        </button>
      </div>
    </div>
  );
}

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();

  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [userResults, setUserResults] = useState<SearchUser[]>([]);
  const [postResults, setPostResults] = useState<PostType[]>([]);
  const [loading, setLoading] = useState(false);
  const [followingIds, setFollowingIds] = useState<Set<number>>(new Set());

  const mode = getSearchMode(query);
  const trimmed = query.trim();

  const doSearch = useCallback(async (q: string) => {
    const t2 = q.trim();
    if (!t2) { setUserResults([]); setPostResults([]); return; }
    setLoading(true);
    try {
      const m = getSearchMode(t2);
      if (m === "hashtag") {
        const posts = await fetchPosts(t2);
        setPostResults(posts);
        setUserResults([]);
      } else if (m === "user") {
        const users = await fetchUsers(t2.slice(1));
        setUserResults(users);
        setFollowingIds(new Set(users.filter((u) => u.isFollowing).map((u) => u.id)));
        setPostResults([]);
      } else {
        const [users, posts] = await Promise.all([fetchUsers(t2), fetchPosts(t2)]);
        setUserResults(users);
        setFollowingIds(new Set(users.filter((u) => u.isFollowing).map((u) => u.id)));
        setPostResults(posts);
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

  async function toggleLike(id: number) {
    setPostResults((p) =>
      p.map((post) => {
        if (post.id !== id) return post;
        const liked = !post.liked;
        return { ...post, liked, likes: liked ? post.likes + 1 : Math.max(0, post.likes - 1) };
      })
    );
    try {
      const res = await fetch(`${API_URL}/posts/${id}/like`, { method: "POST", headers: authHeaders() });
      const data = await res.json();
      setPostResults((p) =>
        p.map((post) => post.id === id ? { ...post, liked: data.liked, likes: data.likesCount } : post)
      );
    } catch (e) {
      console.error(e);
    }
  }

  const hasResults = userResults.length > 0 || postResults.length > 0;

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

          {!loading && trimmed && !hasResults && (
            <p className="muted" style={{ textAlign: "center", marginTop: 48 }}>
              No results for <strong>{trimmed}</strong>.
            </p>
          )}

          {!loading && userResults.length > 0 && (
            <>
              <div className="profileTabs">
                <div className="profileTab active">People</div>
              </div>
              <div className="feed">
                {userResults.map((user) => (
                  <UserCard
                    key={user.id}
                    user={user}
                    isFollowing={followingIds.has(user.id)}
                    onFollow={() => toggleFollow(user.id)}
                    onNavigate={() => router.push(`/profile/${user.id}`)}
                  />
                ))}
              </div>
            </>
          )}

          {!loading && postResults.length > 0 && (
            <>
              <div className="profileTabs">
                <div className="profileTab active">
                  {mode === "hashtag" ? trimmed : "Posts"}
                </div>
              </div>
              <div className="feed">
                {postResults.map((p) => (
                  <div className="card" key={p.id}>
                    <Post
                      post={p}
                      isOwn={false}
                      onToggleLike={toggleLike}
                      onDelete={() => {}}
                      onAuthorClick={(id) => router.push(`/profile/${id}`)}
                    />
                  </div>
                ))}
              </div>
            </>
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
