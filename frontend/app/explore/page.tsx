"use client";

import Topbar from "@/components/Topbar";
import LeftSidebar from "@/components/LeftSidebar";
import RightSidebar from "@/components/RightSidebar";
import Post, { PostType } from "@/components/Post";
import Suggestions from "@/components/Suggestions";
import React, { useState, useEffect } from "react";
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

function mapPost(p: {
  id: number;
  content: string;
  createdAt: string;
  author: { id: number; username: string };
  counts: { likes: number; comments: number };
  files?: Array<{ id: number; filename: string; url: string }>;
  liked?: boolean;
}): PostType {
  return {
    id: p.id,
    authorId: p.author.id,
    author: p.author.username,
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

function Card({ children }: { children: React.ReactNode }) {
  return <div className="card">{children}</div>;
}

export default function Explore() {
  const router = useRouter();
  const { t } = useTranslation();
  const [posts, setPosts] = useState<PostType[]>([]);
  const [authChecked, setAuthChecked] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  useEffect(() => {
    const token = Cookies.get("token");
    if (!token) {
      router.push("/");
      return;
    }
    setAuthChecked(true);

    fetch(`${API_URL}/auth/me`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((data) => setCurrentUserId(data?.id ?? null))
      .catch(console.error);

    fetch(`${API_URL}/posts/explore`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setPosts(data.map(mapPost));
      })
      .catch(console.error);
  }, [router]);

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
    <div className="page">
      <Topbar />

      <main className="layout">
        <aside className="volume" />

        <aside className="left">
          <LeftSidebar />
        </aside>

        <section className="center">
          <div className="profileTabs">
            <button className="profileTab active" type="button">{t("home.explore")}</button>
          </div>
          <div className="feed">
            {posts.length === 0 ? (
              <Card>
                <div style={{ padding: "20px", textAlign: "center", color: "var(--muted)" }}>
                  No posts to explore yet.
                </div>
              </Card>
            ) : (
              posts.map((p) => (
                <Card key={p.id}>
                  <Post
                    post={p}
                    isOwn={currentUserId === p.authorId}
                    onToggleLike={toggleLike}
                    onDelete={async () => {}}
                    onAuthorClick={(id) => router.push(`/profile/${id}`)}
                  />
                </Card>
              ))
            )}
          </div>
        </section>

        <aside className="right">
          <RightSidebar />
          <Suggestions />
        </aside>

        <aside className="volume" />
      </main>

      <footer className="footer muted">miniSocial</footer>
    </div>
  );
}
