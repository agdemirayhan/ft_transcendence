"use client";

import Avatar from "@/components/Avatar";
import Topbar from "@/components/Topbar";
import React, { useState, useEffect } from "react";
import { HeartIcon as HeartSolid } from "@heroicons/react/24/solid";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import "../i18n";
import Cookies from "js-cookie";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

type PostType = {
  id: number;
  authorId: number;
  author: string;
  handle: string;
  time: string;
  content: string;
  likes: number;
  comments: number;
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

function mapPost(p: {
  id: number;
  content: string;
  createdAt: string;
  author: { id: number; username: string };
  counts: { likes: number; comments: number };
}): PostType {
  return {
    id: p.id,
    authorId: p.author.id,
    author: p.author.username,
    handle: `@${p.author.username}`,
    time: timeAgo(p.createdAt),
    content: p.content,
    likes: p.counts.likes,
    comments: p.counts.comments ?? 0,
    liked: false,
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

function PostComposer({ onPost, username }: { onPost: (content: string) => void; username: string }) {
  const [text, setText] = useState("");
  const { t } = useTranslation();

  function submit(e: React.SyntheticEvent<HTMLFormElement>) {
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
          <Avatar name={username} />
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
  const router = useRouter();
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [commentCount, setCommentCount] = useState(post.comments ?? 0);
  const [showComments, setShowComments] = useState(false);
  const [commentsList, setCommentsList] = useState<{ id: number; author: { username: string }; content: string; createdAt: string }[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);

  async function toggleComments() {
    if (showComments) { setShowComments(false); return; }
    setShowComments(true);
    if (commentsList.length > 0) return;
    setLoadingComments(true);
    try {
      const res = await fetch(`${API_URL}/posts/${post.id}/comments`, { headers: authHeaders() });
      const data = await res.json();
      if (Array.isArray(data)) setCommentsList(data);
    } finally {
      setLoadingComments(false);
    }
  }

  async function submitComment() {
    const trimmed = commentText.trim();
    if (!trimmed || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/posts/${post.id}/comments`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ content: trimmed }),
      });
      const newComment = await res.json();
      setCommentCount((c) => c + 1);
      setCommentsList((prev) => [newComment, ...prev]);
      setShowComments(true);
      setCommentText("");
      setShowCommentBox(false);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="post">
      <Avatar name={post.author} />
      <div className="postBody">
        <div className="postHeader">
          <div className="postAuthor">
            <span className="name" onClick={() => router.push(`/profile/${post.authorId}`)}>{post.author}</span>
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
          {commentCount > 0 ? <span className="commentCount" onClick={toggleComments}>{commentCount} {t("home.comments")}</span> : null}
          <span className="spacer" />
          <button className="btn btnSmall" onClick={() => setShowCommentBox((v) => !v)} type="button">
            {t("home.comment")}
          </button>
          <button className="ghostBtn" onClick={() => alert("We'll add this later 🙂")} type="button">
            {t("home.share")}
          </button>
        </div>
        {showCommentBox ? (
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <input
              className="authInput"
              style={{ flex: 1, padding: "8px 12px" }}
              placeholder={t("home.write_comment")}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") submitComment(); }}
              autoFocus
            />
            <button
              className="btn"
              type="button"
              onClick={submitComment}
              disabled={!commentText.trim() || isSubmitting}
            >
              {t("home.send")}
            </button>
          </div>
        ) : null}
      </div>
      {showComments ? (
        <div className="commentsList">
          {loadingComments ? <p className="muted">Loading...</p> : null}
          {commentsList.map((c) => (
            <div key={c.id} className="commentItem">
              <Avatar name={c.author.username} size={38} />
              <div style={{ fontSize: 15 }}>
                <div style={{ display: "flex", gap: 6, alignItems: "baseline" }}>
                  <span className="name">{c.author.username}</span>
                  <span className="muted" style={{ fontSize: 11 }}>{timeAgo(c.createdAt)}</span>
                </div>
                <p style={{ margin: 0 }}>{c.content}</p>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

type FollowUser = { id: number; username: string; followers: number };

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
              <Avatar name={u.username} />
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

function LogoutModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div className="modalOverlay" style={{ backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" }} onClick={onCancel}>
      <div className="modal" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
        <h2>Log out</h2>
        <p className="muted">Are you sure you want to log out?</p>
        <div className="modalActions">
          <button type="button" className="ghostBtn" onClick={onCancel}>Cancel</button>
          <button type="button" className="btn" onClick={onConfirm}>Log out</button>
        </div>
      </div>
    </div>
  );
}

type UserProfile = {
  id: number;
  username: string;
  stats: { posts: number; followers: number; following: number };
};

type Suggestion = {
  id: number;
  username: string;
  followers: number;
  isFollowing: boolean;
};

export default function Home() {
  const router = useRouter();
  const { t } = useTranslation();
  const [posts, setPosts] = useState<PostType[]>([]);
  const [showLogout, setShowLogout] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [fadingIds, setFadingIds] = useState<Set<number>>(new Set());
  const [showFollowing, setShowFollowing] = useState<"following" | "followers" | null>(null);

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

    fetch(`${API_URL}/users/suggestions`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setSuggestions(data);
      })
      .catch(console.error);
  }, []);

  async function addPost(content: string) {
    try {
      const res = await fetch(`${API_URL}/posts`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ content }),
      });
      if (!res.ok) return;
      const data = await res.json();
      setPosts((p) => [mapPost(data), ...p]);
      setCurrentUser((u) => u ? { ...u, stats: { ...u.stats, posts: u.stats.posts + 1 } } : u);
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

  async function toggleSuggestionFollow(userId: number) {
    try {
      const res = await fetch(`${API_URL}/users/${userId}/follow`, {
        method: "POST",
        headers: authHeaders(),
      });
      const data = await res.json();
      if (typeof data.isFollowing !== "boolean") return;

      setFadingIds((prev) => new Set(prev).add(userId));
      setTimeout(() => {
        setSuggestions((prev) => prev.filter((s) => s.id !== userId));
        setFadingIds((prev) => { const next = new Set(prev); next.delete(userId); return next; });
        setCurrentUser((prev) => prev ? {
          ...prev,
          stats: { ...prev.stats, following: prev.stats.following + 1 },
        } : prev);
      }, 400);
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
          <Card title={t("home.profile")}>
            <div className="profile">
              <Avatar name={currentUser?.username ?? "?"} />
              <div>
                <div className="profileName" style={{ cursor: "pointer" }} onClick={() => currentUser && router.push(`/profile/${currentUser.id}`)}>{currentUser?.username ?? "..."}</div>
                <div className="muted">@{currentUser?.username ?? "..."}</div>
              </div>
            </div>
            <div className="stats">
              <div className="stat statClickable" onClick={() => currentUser && router.push(`/profile/${currentUser.id}`)}>
                <div className="statNum">{currentUser?.stats?.posts ?? "-"}</div>
                <div className="muted">{t("home.posts")}</div>
              </div>
              <div className="stat statClickable" onClick={() => setShowFollowing("followers")}>
                <div className="statNum">{currentUser?.stats?.followers ?? "-"}</div>
                <div className="muted">{t("home.followers")}</div>
              </div>
              <div className="stat statClickable" onClick={() => setShowFollowing("following")}>
                <div className="statNum">{currentUser?.stats?.following ?? "-"}</div>
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
          <PostComposer onPost={addPost} username={currentUser?.username ?? "You"} />
          <div className="feed">
            {posts.length === 0 ? (
              <p className="muted" style={{ textAlign: "center", marginTop: 32 }}>{t("home.empty_feed")}</p>
            ) : posts.map((p) => (
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
              {suggestions.map((u) => (
                <div
                  className="suggestion"
                  key={u.id}
                  style={{
                    opacity: fadingIds.has(u.id) ? 0 : 1,
                    transform: fadingIds.has(u.id) ? "translateX(12px)" : "none",
                  }}
                >
                  <div className="row" onClick={() => router.push(`/profile/${u.id}`)}>
                    <Avatar name={u.username} />
                    <div>
                      <div className="name">{u.username}</div>
                      <div className="muted">@{u.username}</div>
                    </div>
                  </div>
                  <button
                    className="btn btnSmall"
                    onClick={() => toggleSuggestionFollow(u.id)}
                    type="button"
                  >
                    {t("home.follow")}
                  </button>
                </div>
              ))}
              {suggestions.length === 0 && (
                <div className="muted" style={{ fontSize: 13 }}>No suggestions yet.</div>
              )}
            </div>
          </Card>
        </aside>

        <aside className="volume" />
      </main>

      <footer className="footer muted">miniSocial</footer>
    </div>
    {showFollowing && <FollowingModal type={showFollowing} onClose={() => setShowFollowing(null)} />}
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
    </>
  );
}
