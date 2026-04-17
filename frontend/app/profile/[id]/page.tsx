"use client";

import Topbar from "@/components/Topbar";
import LeftSidebar from "@/components/LeftSidebar";
import RightSidebar from "@/components/RightSidebar";
import Post, { PostType } from "@/components/Post";
import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Cookies from "js-cookie";
import { useTranslation } from "react-i18next";
import "../../i18n";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

type UserProfile = {
  id: number;
  username: string;
  bio: string | null;
  stats: { posts: number; followers: number; following: number };
};

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function authHeaders(): HeadersInit {
  const token = Cookies.get("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export default function UserProfilePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { t } = useTranslation();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<PostType[]>([]);
  const [isOwnProfile, setIsOwnProfile] = useState<boolean | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [editingBio, setEditingBio] = useState(false);
  const [bioText, setBioText] = useState("");
  const [bioSaving, setBioSaving] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!dropdownOpen) return;
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [dropdownOpen]);

  useEffect(() => {
    const token = Cookies.get("token");
    if (!token) { router.push("/"); return; }

    fetch(`${API_URL}/auth/me`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((me) => {
        const own = String(me.id) === String(id);
        setIsOwnProfile(own);
        if (!own) {
          fetch(`${API_URL}/users/${id}/follow-status`, { headers: authHeaders() })
            .then((r) => r.json())
            .then((data) => setIsFollowing(data.isFollowing))
            .catch(console.error);
        }
      });

    fetch(`${API_URL}/users/${id}`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((data) => { setUser(data); setBioText(data.bio ?? ""); })
      .catch(console.error);

    fetch(`${API_URL}/users/${id}/posts`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setPosts(data.map((p) => ({
            id: p.id,
            authorId: p.author.id,
            author: p.author.username,
            handle: `@${p.author.username}`,
            time: timeAgo(p.createdAt),
            content: p.content,
            likes: p._count?.likes ?? 0,
            liked: false,
          })));
        }
      })
      .catch(console.error);

  }, [id]);

  async function toggleLike(id: number) {
    setPosts((p) =>
      p.map((post) => {
        if (post.id !== id) return post;
        const liked = !post.liked;
        return { ...post, liked, likes: liked ? post.likes + 1 : Math.max(0, post.likes - 1) };
      })
    );
    try {
      const res = await fetch(`${API_URL}/posts/${id}/like`, {
        method: "POST",
        headers: authHeaders(),
      });
      const data = await res.json();
      setPosts((p) =>
        p.map((post) =>
          post.id === id ? { ...post, liked: data.liked, likes: data.likesCount } : post
        )
      );
    } catch (e) {
      console.error(e);
    }
  }

  async function toggleFollow() {
    setFollowLoading(true);
    const method = isFollowing ? "DELETE" : "POST";
    try {
      const res = await fetch(`${API_URL}/users/${id}/follow`, {
        method,
        headers: authHeaders(),
      });
      const data = await res.json();
      if (typeof data.isFollowing !== "boolean") return;
      setIsFollowing(data.isFollowing);
      setUser((prev) =>
        prev
          ? {
              ...prev,
              stats: {
                ...prev.stats,
                followers: prev.stats.followers + (data.isFollowing ? 1 : -1),
              },
            }
          : prev
      );
    } catch (e) {
      console.error(e);
    } finally {
      setFollowLoading(false);
    }
  }

  async function deletePost(postId: number) {
    try {
      await fetch(`${API_URL}/posts/${postId}`, { method: "DELETE", headers: authHeaders() });
      setPosts((p) => p.filter((post) => post.id !== postId));
      setUser((prev) => prev ? { ...prev, stats: { ...prev.stats, posts: Math.max(0, prev.stats.posts - 1) } } : prev);
    } catch (e) {
      console.error(e);
    }
  }

  async function saveBio() {
    setBioSaving(true);
    try {
      const res = await fetch(`${API_URL}/users/me/bio`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ bio: bioText }),
      });
      const data = await res.json();
      setUser((prev) => prev ? { ...prev, bio: data.bio } : prev);
      setEditingBio(false);
    } catch (e) {
      console.error(e);
    } finally {
      setBioSaving(false);
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
          <div className="profileCover" />

          <div className="profileAvatarRow">
            <div className="profileAvatar">
              {user?.username?.[0]?.toUpperCase() ?? "?"}
            </div>
            {isOwnProfile === true && (
              <div style={{ position: "relative" }} ref={dropdownRef}>
                <button
                  className="ghostBtn"
                  type="button"
                  onClick={() => setDropdownOpen((v) => !v)}
                >
                  {t("profile.edit_profile")}
                </button>
                {dropdownOpen && (
                  <div style={{
                    position: "absolute",
                    top: "calc(100% + 6px)",
                    right: 0,
                    background: "var(--bg)",
                    border: "1px solid var(--border)",
                    borderRadius: 10,
                    minWidth: 180,
                    boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
                    zIndex: 100,
                    overflow: "hidden",
                  }}>
                    <button
                      type="button"
                      style={{ display: "block", width: "100%", padding: "12px 16px", textAlign: "left", background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "var(--text)" }}
                      onClick={() => { setDropdownOpen(false); alert(t("profile.edit_soon")); }}
                    >
                      {t("profile.change_pic")}
                    </button>
                    <div style={{ height: 1, background: "var(--border)" }} />
                    <button
                      type="button"
                      style={{ display: "block", width: "100%", padding: "12px 16px", textAlign: "left", background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "var(--text)" }}
                      onClick={() => { setDropdownOpen(false); setEditingBio(true); setBioText(user?.bio ?? ""); }}
                    >
                      {t("profile.edit_bio")}
                    </button>
                  </div>
                )}
              </div>
            )}
            {isOwnProfile === false && (
              <button
                className={isFollowing ? "ghostBtn" : "btn btnSmall"}
                onClick={toggleFollow}
                disabled={followLoading}
                type="button"
              >
                {followLoading ? "..." : isFollowing ? t("profile.unfollow") : t("profile.follow")}
              </button>
            )}
          </div>

          <div className="profileInfo">
            <div className="profileDisplayName">{user?.username ?? "..."}</div>
            <div className="muted">@{user?.username ?? "..."}</div>
            {editingBio ? (
              <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                <textarea
                  className="authInput"
                  style={{ resize: "vertical", minHeight: 64, padding: "8px 12px", fontSize: 14 }}
                  value={bioText}
                  onChange={(e) => setBioText(e.target.value)}
                  maxLength={200}
                  autoFocus
                />
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn btnSmall" type="button" onClick={saveBio} disabled={bioSaving}>
                    {bioSaving ? "..." : t("profile.save")}
                  </button>
                  <button className="ghostBtn" type="button" onClick={() => setEditingBio(false)}>
                    {t("profile.cancel")}
                  </button>
                </div>
              </div>
            ) : (
              user?.bio && <div className="profileBio">{user.bio}</div>
            )}
          </div>

          <div className="stats profileStats">
            <div className="stat">
              <div className="statNum">{user?.stats?.posts ?? "-"}</div>
              <div className="muted">{t("profile.posts")}</div>
            </div>
            <div className="stat">
              <div className="statNum">{user?.stats?.followers ?? "-"}</div>
              <div className="muted">{t("profile.followers")}</div>
            </div>
            <div className="stat">
              <div className="statNum">{user?.stats?.following ?? "-"}</div>
              <div className="muted">{t("profile.following")}</div>
            </div>
          </div>

          <div className="profileTabs">
            <button type="button" className="profileTab active">{t("profile.posts")}</button>
          </div>

          <div className="feed">
            {posts.length === 0 ? (
              <div className="muted profileEmpty">{t("profile.no_posts")}</div>
            ) : (
              posts.map((p) => (
                <div className="card" key={p.id}>
                  <Post post={p} isOwn={isOwnProfile === true} onToggleLike={toggleLike} onDelete={isOwnProfile === true ? deletePost : undefined} />
                </div>
              ))
            )}
          </div>
        </section>

        <aside className="right">
          <RightSidebar />
        </aside>

        <aside className="volume" />
      </main>
    </div>
  );
}
