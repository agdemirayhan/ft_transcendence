"use client";

import Avatar from "@/components/Avatar";
import { useState, useEffect } from "react";
import { HeartIcon as HeartSolid } from "@heroicons/react/24/solid";
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

type PostType = {
  id: number;
  author: string;
  handle: string;
  time: string;
  content: string;
  likes: number;
  liked: boolean;
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

function Post({ post, onToggleLike }: { post: PostType; onToggleLike: (id: number) => void }) {
  const { t } = useTranslation();
  return (
    <div className="post">
      <Avatar name={post.author} />
      <div className="postBody">
        <div className="postHeader">
          <div className="postAuthor">
            <span className="name">{post.author}</span>
            <span className="handle">{post.handle}</span>
            <span className="dot">•</span>
            <span className="time">{post.time}</span>
          </div>
        </div>
        <div className="postContent">{post.content}</div>
        <div className="postActions">
          <button
            className={`iconBtn ${post.liked ? "liked" : ""}`}
            onClick={() => onToggleLike(post.id)}
            aria-label="Like"
            type="button"
          >
            <HeartSolid className={`icon ${post.liked ? "liked" : ""}`} />
          </button>
          <span className="muted">{post.likes}</span>
          <span className="spacer" />
          <button className="ghostBtn" onClick={() => alert("We'll add this later 🙂")} type="button">
            {t("home.comment")}
          </button>
          <button className="ghostBtn" onClick={() => alert("We'll add this later 🙂")} type="button">
            {t("home.share")}
          </button>
        </div>
      </div>
    </div>
  );
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

  useEffect(() => {
    const token = Cookies.get("token");
    if (!token) { router.push("/"); return; }

    // Check if this is the current user's profile and get follow status
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
      .then((data) => setUser(data))
      .catch(console.error);

    fetch(`${API_URL}/users/${id}/posts`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setPosts(data.map((p) => ({
            id: p.id,
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

  return (
    <div className="page">
      <header className="topbar">
        <button className="ghostBtn" onClick={() => router.back()} type="button">
          {t("profile.back")}
        </button>
        <span className="profileTopbarName">{user?.username ?? "Profile"}</span>
      </header>

      <main className="profileMain">

        <div className="profileCover" />

        <div className="profileAvatarRow">
          <div className="profileAvatar">
            {user?.username?.[0]?.toUpperCase() ?? "?"}
          </div>
          {isOwnProfile === true && (
            <button className="ghostBtn" onClick={() => alert(t("profile.edit_soon"))} type="button">
              {t("profile.edit_profile")}
            </button>
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
          {user?.bio && <div className="profileBio">{user.bio}</div>}
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
                <Post post={p} onToggleLike={toggleLike} />
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
