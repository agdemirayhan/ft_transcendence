"use client";

import Avatar from "@/components/Avatar";
import Topbar from "@/components/Topbar";
import LeftSidebar from "@/components/LeftSidebar";
import RightSidebar from "@/components/RightSidebar";
import React, { useState, useEffect, useLayoutEffect, useRef } from "react";
import { HeartIcon as HeartSolid } from "@heroicons/react/24/solid";
import { PaperClipIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import "../i18n";
import Cookies from "js-cookie";
import Image from "next/image";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

type PostType = {
  id: number;
  authorId: number;
  author: string;
  handle: string;
  time: string;
  //author: {
  //  id: number;
  //  username: string;
  //  avatarUrl: string;
  //};
  content: string;
  files: Array<{
    id: number;
    filename: string;
    url: string;
  }>;
  likes: number;
  comments: number;
  liked: boolean;
  createdAt: string;
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
  author: { id: number; username: string };
  counts: { likes: number; comments: number };
  files?: Array<{ id: number; filename: string; url: string }>;
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
    liked: false,
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

function PostComposer({ onPost, username }: { onPost: (content: string, attachment?: File | null) => Promise<void>; username: string }) {
  const [text, setText] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation();

  async function submit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    setIsLoading(true);
    try {
      await onPost(trimmed, attachment);
      setText("");
      setAttachment(null);
    } finally {
      setIsLoading(false);
    }
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
  const router = useRouter();
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [commentCount, setCommentCount] = useState(post.comments ?? 0);
  const [showComments, setShowComments] = useState(false);
  const [commentsList, setCommentsList] = useState<{ id: number; author: { username: string }; content: string; createdAt: string }[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [isLong, setIsLong] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!contentRef.current) return;
    const el = contentRef.current;
    const lineHeight = parseFloat(getComputedStyle(el).lineHeight) || 23;
    if (el.scrollHeight > Math.ceil(lineHeight) + 2) setIsLong(true);
  }, []);

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
        <div
          ref={contentRef}
          className="postContent"
          style={isLong && !expanded ? { whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", paddingRight: "20px" } : { paddingRight: "20px" }}
        >
          {post.content}
        </div>
        {post.files.length > 0 ? (
          <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
            {post.files.map((file) => (
              <Image
                key={file.id}
                src={`${API_URL}${file.url}`}
                alt={file.filename}
                width={1200}
                height={900}
                style={{ width: "100%", borderRadius: 12, border: "1px solid var(--border)" }}
                unoptimized
              />
            ))}
          </div>
        ) : null}
        <div className="postActions">
          <div style={{ flex: 1, display: "flex", gap: 8, alignItems: "center" }}>
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
          </div>
          <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
            {isLong && (
              <button
                className="ghostBtn"
                style={{ fontSize: 13, padding: "2px 10px" }}
                onClick={() => setExpanded((v) => !v)}
                type="button"
              >
                {expanded ? t("home.show_less") : t("home.show_more")}
              </button>
            )}
          </div>
          <div style={{ flex: 1, display: "flex", gap: 8, justifyContent: "flex-end", alignItems: "center" }}>
            <button className="btn btnSmall" onClick={() => setShowCommentBox((v) => !v)} type="button">
              {t("home.comment")}
            </button>
            <button className="ghostBtn" onClick={() => alert("We'll add this later 🙂")} type="button">
              {t("home.share")}
            </button>
          </div>
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


export default function Home() {
  const router = useRouter();
  const { t } = useTranslation();
  const [posts, setPosts] = useState<PostType[]>([]);
  const [showLogout, setShowLogout] = useState(false);
  const [authChecked] = useState(() => Boolean(Cookies.get("token")));
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [showFollowing, setShowFollowing] = useState<"following" | "followers" | null>(null);

  useEffect(() => {
    const token = Cookies.get("token");
    if (!token) {
      router.push("/");
      return;
    }

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

  async function addPost(content: string, attachment?: File | null) {
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

        if (!uploadRes.ok) {
          return;
        }

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

          <LeftSidebar />
        </aside>

        <section className="center">
          <PostComposer onPost={addPost} username={currentUser?.username ?? "You"} />
          <div className="feed">
            {posts.length === 0 ? (
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
          <RightSidebar onFollow={() => setCurrentUser((u) => u ? { ...u, stats: { ...u.stats, following: u.stats.following + 1 } } : u)} />
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
