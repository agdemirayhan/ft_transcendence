"use client";

import Avatar from "@/components/Avatar";
import React, { useState, useEffect } from "react";
import { HeartIcon as HeartSolid } from "@heroicons/react/24/solid";
import { PaperClipIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import "../i18n";
import Cookies from "js-cookie";

type PostType = {
  id: number;
  author: {
    id: number;
    username: string;
    avatarUrl: string;
  };
  content: string;
  files: Array<{
    id: number;
    filename: string;
    url: string;
  }>;
  likes: number;
  liked: boolean;
  createdAt: string;
};

function Card({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="card">
      {title ? <div className="cardTitle">{title}</div> : null}
      {children}
    </div>
  );
}

function PostComposer({ onPost }: { onPost: (content: string, file?: File) => void }) {
  const [text, setText] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation();

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    onPost(trimmed, attachment || undefined);
    setText("");
    setAttachment(null);
  }

  return (
    <Card>
      <form onSubmit={submit} className="composer">
        <div className="composerTop">
          <Avatar name="You" />
          <textarea
            value={text}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setText(e.target.value)}
            className="textarea"
            placeholder={t("home.whats_happening")}
            rows={3}
            maxLength={240}
            disabled={isLoading}
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

function Post({
  post,
  onToggleLike,
}: {
  post: PostType;
  onToggleLike: (id: number) => void;
}) {
  const { t } = useTranslation();
  const timeAgo = new Date(post.createdAt).toLocaleString();

  return (
    <div className="post">
      <Avatar name={post.author.username} />
      <div className="postBody">
        <div className="postHeader">
          <div className="postAuthor">
            <span className="name">{post.author.username}</span>
            <span className="handle">@{post.author.username.toLowerCase()}</span>
            <span className="dot">•</span>
            <span className="time">{timeAgo}</span>
          </div>
        </div>
        <div className="postContent">{post.content}</div>
        {post.files && post.files.length > 0 && (
          <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {post.files.map((file) => (
              <img
                key={file.id}
                src={file.url}
                alt={file.filename}
                style={{
                  maxWidth: '100%',
                  height: 'auto',
                  borderRadius: '12px',
                  marginTop: '8px',
                }}
              />
            ))}
          </div>
        )}
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

function LogoutModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  const { t } = useTranslation();

   return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
      display: "grid", placeItems: "center", padding: 16, zIndex: 1000,
    }}>
      <div style={{
        width: "100%", maxWidth: 420, background: "var(--card)",
        border: "1px solid var(--border)", borderRadius: 16, padding: 20,
        boxShadow: "0 20px 40px rgba(0,0,0,0.2)", display: "grid", gap: 12,
      }}>
        <h2 style={{ margin: 0 }}>Log out</h2>
        <p className="muted" style={{ margin: 0 }}>
          Are you sure you want to log out?
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            type="button"
            className="ghostBtn"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn"
            onClick={onConfirm}
          >
            Log out
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const { t } = useTranslation();
  const [posts, setPosts] = useState<PostType[]>([]);
  const [showLogout, setShowLogout] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);

  async function fetchPosts() {
    try {
      const response = await fetch("http://localhost:3000/posts");
      if (!response.ok) throw new Error("Failed to fetch posts");
      const data = await response.json();
      setPosts(data);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setIsLoadingPosts(false);
    }
  }

  async function addPost(content: string, file?: File) {
    const token = Cookies.get("token");
    if (!token) {
      alert("Not authenticated");
      return;
    }

    try {
      let fileId: number | undefined;

      // Upload file if provided
      if (file) {
        const formData = new FormData();
        formData.append("file", file);

        const uploadResponse = await fetch("http://localhost:3000/upload", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        if (!uploadResponse.ok) {
          const error = await uploadResponse.json();
          throw new Error(error.message || "Failed to upload file");
        }

        const uploadedFile = await uploadResponse.json();
        fileId = uploadedFile.id;
      }

      // Create post
      const postResponse = await fetch("http://localhost:3000/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content,
          fileId,
        }),
      });

      if (!postResponse.ok) {
        const error = await postResponse.json();
        throw new Error(error.message || "Failed to create post");
      }

      const newPost = await postResponse.json();
      setPosts((p) => [newPost, ...p]);
    } catch (error) {
      console.error("Error creating post:", error);
      alert(`Failed to create post: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  function toggleLike(id: number) {
    setPosts((p) =>
      p.map((post) => {
        if (post.id !== id) return post;
        const liked = !post.liked;
        return { ...post, liked, likes: liked ? post.likes + 1 : Math.max(0, post.likes - 1) };
      })
    );
  }

  useEffect(() => {
    const token = Cookies.get("token");
    if (!token) {
      router.push("/");
    } else {
      setAuthChecked(true);
      fetchPosts();
    }
  }, []);

  return (
    <div className="page">
      <header className="topbar">
        <div className="brand">
          <img src="/favicon-32x32.png" alt="miniSocial" width={32} height={32} />
        </div>
        <input className="search" placeholder={t("home.search")} />
        <button className="btn btnSmall" onClick={() => alert("Search later 🙂")} type="button">
          {t("home.search_btn")}
        </button>
        <span style={{ flex: 1 }} />
        <button className="btn btnSmall btnOutline" onClick={() => setShowLogout(true)} type="button">
          Log out
        </button>
      </header>

      <main className="layout">
        <aside className="volume" />

        <aside className="left">
          <Card title={t("home.profile")}>
            <div className="profile">
              <Avatar name="Ayhan" />
              <div>
                <div className="profileName">Ayhan</div>
                <div className="muted">@ayhan</div>
              </div>
            </div>
            <div className="stats">
              <div className="stat">
                <div className="statNum">12</div>
                <div className="muted">{t("home.posts")}</div>
              </div>
              <div className="stat">
                <div className="statNum">340</div>
                <div className="muted">{t("home.followers")}</div>
              </div>
              <div className="stat">
                <div className="statNum">180</div>
                <div className="muted">{t("home.following")}</div>
              </div>
            </div>
            <button className="btn btnWide" onClick={() => router.push("/profile")} type="button">
              {t("home.edit_profile")}
            </button>
          </Card>

          <Card title={t("home.shortcuts")}>
            <div className="list">
              <button className="linkBtn" type="button">{t("home.feed")}</button>
              <button className="linkBtn" type="button">{t("home.explore")}</button>
              <button className="linkBtn" onClick={() => router.push("/messages")} type="button">
                {t("home.messages")}
              </button>
              <button className="linkBtn" onClick={() => router.push("/settings")} type="button">
                {t("home.settings")}
              </button>
            </div>
          </Card>
        </aside>

        <section className="center">
          <PostComposer onPost={addPost} />
          <div className="feed">
            {isLoadingPosts ? (
              <Card>
                <div style={{ padding: "20px", textAlign: "center", color: "var(--muted)" }}>
                  Loading posts...
                </div>
              </Card>
            ) : posts.length === 0 ? (
              <Card>
                <div style={{ padding: "20px", textAlign: "center", color: "var(--muted)" }}>
                  No posts yet. Be the first to post!
                </div>
              </Card>
            ) : (
              posts.map((p) => (
                <Card key={p.id}>
                  <Post post={p} onToggleLike={toggleLike} />
                </Card>
              ))
            )}
          </div>
        </section>

        <aside className="right">
          <Card title={t("home.trending")}>
            <div className="chips">
              <span className="chip">#react</span>
              <span className="chip">#frontend</span>
              <span className="chip">#42school</span>
              <span className="chip">#nextjs</span>
            </div>
          </Card>

          <Card title={t("home.suggestions")}>
            <div className="suggestions">
              {[
                { name: "Manuel", handle: "@mhummel" },
                { name: "Taha", handle: "@tkirmizi" },
                { name: "Leon", handle: "@ldick" },
              ].map((u) => (
                <div className="suggestion" key={u.handle}>
                  <div className="row">
                    <Avatar name={u.name} />
                    <div>
                      <div className="name">{u.name}</div>
                      <div className="muted">{u.handle}</div>
                    </div>
                  </div>
                  <button
                    className="btn btnSmall"
                    onClick={() => alert(`${u.name} followed (fake) 🙂`)}
                    type="button"
                  >
                    {t("home.follow")}
                  </button>
                </div>
              ))}
            </div>
          </Card>
        </aside>

        <aside className="volume" />
      </main>

      <footer className="footer muted">miniSocial</footer>
      {showLogout && (
        <LogoutModal
          onConfirm={() => {
            Cookies.remove("token");
            setShowLogout(false);
            router.push("/");
          }}
          onCancel={() => setShowLogout(false)}
        />
      )}
    </div>
    
  );
}