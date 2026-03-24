"use client";

import Avatar from "@/components/Avatar";
import React, { useState, useEffect } from "react";
import { HeartIcon as HeartSolid } from "@heroicons/react/24/solid";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import "../i18n";
import Cookies from "js-cookie";

type PostType = {
  id: number;
  author: string;
  handle: string;
  time: string;
  content: string;
  likes: number;
  liked: boolean;
};

const seedPosts: PostType[] = [
  {
    id: 1,
    author: "Ayhan",
    handle: "@ayhan",
    time: "2s ago",
    content: "First post! 🎉 I'm building a simple social media page.",
    likes: 3,
    liked: false,
  },
  {
    id: 2,
    author: "Taha",
    handle: "@tkirmizi",
    time: "5m ago",
    content: "Building small UIs with React is really enjoyable.",
    likes: 7,
    liked: true,
  },
];

function Card({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="card">
      {title ? <div className="cardTitle">{title}</div> : null}
      {children}
    </div>
  );
}

function PostComposer({ onPost }: { onPost: (content: string) => void }) {
  const [text, setText] = useState("");
  const { t } = useTranslation();

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    onPost(trimmed);
    setText("");
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
          />
        </div>
        <div className="composerBottom">
          <span className="muted">{text.length}/240</span>
          <button className="btn" type="submit">
            {t("home.search_btn") === "Search" ? "Post" : t("home.search_btn")}
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
  const [posts, setPosts] = useState<PostType[]>(seedPosts);
  const [showLogout, setShowLogout] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  function addPost(content: string) {
    const newPost: PostType = {
      id: Date.now(),
      author: "You",
      handle: "@you",
      time: t("home.just_now"),
      content,
      likes: 0,
      liked: false,
    };
    setPosts((p) => [newPost, ...p]);
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
            {posts.map((p) => (
              <Card key={p.id}>
                <Post post={p} onToggleLike={toggleLike} />
              </Card>
            ))}
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