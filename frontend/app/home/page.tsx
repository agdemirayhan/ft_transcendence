"use client";

import Avatar from "@/components/Avatar";
import Topbar from "@/components/Topbar";
import LeftSidebar from "@/components/LeftSidebar";
import RightSidebar from "@/components/RightSidebar";
import ProfileCard from "@/components/ProfileCard";
import Post, { PostType } from "@/components/Post";
import React, { useState, useEffect } from "react";
import { PaperClipIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import "../i18n";
import Cookies from "js-cookie";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

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

function authUploadHeaders(): HeadersInit {
  const token = Cookies.get("token");
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function mapPost(p: {
  id: number;
  content: string;
  createdAt: string;
  author: { id: number; username: string; avatarUrl?: string | null };
  counts: { likes: number; comments: number };
  files?: Array<{ id: number; filename: string; url: string }>;
  liked?: boolean;
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
    liked: p.liked ?? false,
    createdAt: p.createdAt,
  };
}

function Card({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="card">
      {title ? <div className="cardTitle">{title}</div> : null}
      {children}
    </div>
  );
}

function PostComposer({ onPost, username, avatarUrl }: { onPost: (content: string, attachment?: File | null) => Promise<boolean>; username: string; avatarUrl?: string | null }) {
  const [text, setText] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  async function submit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed && !attachment) return;
    setIsLoading(true);
    try {
      const ok = await onPost(trimmed, attachment);
      if (ok) {
        setText("");
        setAttachment(null);
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <form onSubmit={submit} className="composer">
        <div className="composerTop">
          <Avatar name={username} avatarUrl={avatarUrl} />
          <textarea
            value={text}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setText(e.target.value)}
            className="textarea"
            placeholder={t("home.whats_happening")}
            rows={3}
            maxLength={240}
            disabled={isLoading}
            dir={isRTL ? "rtl" : "auto"}
          />
        </div>
        <div className="composerBottom">
          <div className="composerMetaLeft">
            <input
              id="post-attachment"
              type="file"
              hidden
              accept="image/png,image/jpeg"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setAttachment(e.target.files?.[0] || null)
              }
            />
            <button
              className="attachBtn"
              type="button"
              aria-label="Attach file"
              title="Attach file"
              onClick={() => document.getElementById("post-attachment")?.click()}
              disabled={isLoading}
            >
              <PaperClipIcon className="attachIcon" />
            </button>
            <span className="muted">{text.length}/240</span>
            {attachment ? <span className="muted">• {attachment.name}</span> : null}
          </div>
          <button className="btn" type="submit" disabled={isLoading}>
            {isLoading ? "Posting..." : (t("home.search_btn") === "Search" ? "Post" : t("home.search_btn"))}
          </button>
        </div>
      </form>
    </Card>
  );
}

type FollowUser = { id: number; username: string; avatarUrl?: string | null; followers: number };

function FollowingModal({ type, onClose }: { type: "following" | "followers"; onClose: () => void }) {
  const router = useRouter();
  const [list, setList] = useState<FollowUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  useEffect(() => {
    fetch(`${API_URL}/users/me/${type}`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setList(data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [type]);

  return (
    <div className="modalOverlay" style={{ backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" }} onClick={onClose}>
      <div className="modal" style={{ maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
        <div className="modalHeader">
          <h2>{type === "following" ? "Following" : "Followers"}</h2>
          <button className="ghostBtn" onClick={onClose} type="button">✕</button>
        </div>
        <div className="modalList">
          {loading && <div className="muted">Loading...</div>}
          {!loading && list.length === 0 && <div className="muted">No {type} yet.</div>}
          {list.map((u) => (
            <div key={u.id} className="modalListItem"
              onClick={() => { onClose(); router.push(`/profile/${u.id}`); }}>
              <Avatar name={u.username} avatarUrl={u.avatarUrl} />
              <div>
                <div className="name">{u.username}</div>
                <div className="muted">@{u.username}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


type UserProfile = {
  id: number;
  username: string;
  avatarUrl?: string | null;
  stats: { posts: number; followers: number; following: number };
};


export default function Home() {
  const router = useRouter();
  const { t } = useTranslation();
  const [posts, setPosts] = useState<PostType[]>([]);

  const [authChecked, setAuthChecked] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    const token = Cookies.get("token");
    if (!token) {
      router.push("/");
      return;
    }
    setAuthChecked(true);

    fetch(`${API_URL}/auth/me`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((data) => setCurrentUser(data))
      .catch(console.error);

    fetch(`${API_URL}/posts/feed`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setPosts(data.map(mapPost));
        }
      })
      .catch(console.error);

  }, [router]);

  async function addPost(content: string, attachment?: File | null): Promise<boolean> {
    try {
      let fileId: number | undefined;

      if (attachment) {
        const formData = new FormData();
        formData.append("file", attachment);

        const uploadRes = await fetch(`${API_URL}/upload`, {
          method: "POST",
          headers: authUploadHeaders(),
          body: formData,
        });

        if (!uploadRes.ok) return false;

        const uploaded = await uploadRes.json();
        if (typeof uploaded?.id === "number") {
          fileId = uploaded.id;
        }
      }

      const res = await fetch(`${API_URL}/posts`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ content, fileId }),
      });
      if (!res.ok) return false;
      const data = await res.json();
      setPosts((p) => [mapPost(data), ...p]);
      setCurrentUser((u) => u ? { ...u, stats: { ...u.stats, posts: u.stats.posts + 1 } } : u);
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  async function deletePost(id: number) {
    try {
      await fetch(`${API_URL}/posts/${id}`, { method: "DELETE", headers: authHeaders() });
      setPosts((p) => p.filter((post) => post.id !== id));
      setCurrentUser((u) => u ? { ...u, stats: { ...u.stats, posts: Math.max(0, u.stats.posts - 1) } } : u);
    } catch (e) {
      console.error(e);
    }
  }

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
      if (!res.ok) {
        setPosts((p) =>
          p.map((post) => {
            if (post.id !== id) return post;
            const liked = !post.liked;
            return { ...post, liked, likes: liked ? post.likes + 1 : Math.max(0, post.likes - 1) };
          })
        );
        return;
      }
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


  if (!authChecked) return null;

  return (
    <>
    <div className="page">
      <Topbar />

      <main className="layout">
        <aside className="volume" />

        <aside className="left">
          <ProfileCard />
          <LeftSidebar />
        </aside>

        <section className="center">
          <PostComposer onPost={addPost} username={currentUser?.username ?? "You"} avatarUrl={currentUser?.avatarUrl} />
          <div className="feed">
            {posts.length === 0 ? (
              <Card>
                <div style={{ padding: "20px", textAlign: "center", color: "var(--muted)" }}>
                  {t("home.empty_feed")}
                </div>
              </Card>
            ) : (
              posts.map((p) => (
                <Card key={p.id}>
                  <Post post={p} isOwn={currentUser?.id === p.authorId} onToggleLike={toggleLike} onDelete={deletePost} onAuthorClick={(id) => router.push(`/profile/${id}`)} />
                </Card>
              ))
            )}
          </div>
        </section>

        <aside className="right">
          <RightSidebar />
        </aside>

        <aside className="volume" />
      </main>

      <footer className="footer muted">miniSocial</footer>
    </div>
</>
  );
}
