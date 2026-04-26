"use client";

import { useState, useEffect, useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { HeartIcon as HeartSolid } from "@heroicons/react/24/solid";
import { PhotoIcon } from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";
import Avatar from "@/components/Avatar";
import Cookies from "js-cookie";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

export type PostType = {
  id: number;
  authorId: number;
  author: string;
  authorAvatarUrl?: string | null;
  handle: string;
  time: string;
  content: string;
  files?: Array<{ id: number; filename: string; url: string }>;
  likes: number;
  comments?: number;
  liked: boolean;
  createdAt?: string;
};

function authHeaders(): HeadersInit {
  const token = Cookies.get("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export default function Post({
  post,
  isOwn,
  onToggleLike,
  onDelete,
  onAuthorClick,
}: {
  post: PostType;
  isOwn: boolean;
  onToggleLike: (id: number) => void;
  onDelete?: (id: number) => void;
  onAuthorClick?: (authorId: number) => void;
}) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [isLong, setIsLong] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });
  const menuBtnRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const resizeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [showCommentBox, setShowCommentBox] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [commentCount, setCommentCount] = useState(post.comments ?? 0);
  const [showComments, setShowComments] = useState(false);
  const [commentsList, setCommentsList] = useState<{ id: number; author: { username: string; avatarUrl?: string | null }; content: string; createdAt: string }[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);

  useEffect(() => {
    function handleResize() {
      setIsResizing(true);
      if (resizeTimer.current) clearTimeout(resizeTimer.current);
      resizeTimer.current = setTimeout(() => setIsResizing(false), 200);
    }
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      if (resizeTimer.current) clearTimeout(resizeTimer.current);
    };
  }, []);

  useLayoutEffect(() => {
    if (!contentRef.current) return;
    const el = contentRef.current;
    const lineHeight = parseFloat(getComputedStyle(el).lineHeight) || 23;
    if (el.scrollHeight > Math.ceil(lineHeight) + 2) setIsLong(true);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    function close() { setMenuOpen(false); }
    document.addEventListener("mousedown", close);
    window.addEventListener("scroll", close, true);
    window.addEventListener("keydown", close, true);
    return () => {
      document.removeEventListener("mousedown", close);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("keydown", close, true);
    };
  }, [menuOpen]);

  function openMenu() {
    if (menuBtnRef.current) {
      const rect = menuBtnRef.current.getBoundingClientRect();
      setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    }
    setMenuOpen((v) => !v);
  }

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

  function timeAgo(dateStr: string): string {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  }

  return (
    <div className="post">
      <div>
        <Avatar name={post.author} avatarUrl={post.authorAvatarUrl} />
      </div>
      <div className="postBody">
        <div className="postHeader">
          <div className="postAuthor">
            <span
              className="name"
              style={onAuthorClick ? { cursor: "pointer" } : undefined}
              onClick={() => onAuthorClick?.(post.authorId)}
            >
              {post.author}
            </span>
            <span className="handle">{post.handle}</span>
            <span className="dot">•</span>
            <span className="time">{post.time}</span>
          </div>
          <div style={{ marginLeft: "auto" }}>
            <button
              ref={menuBtnRef}
              type="button"
              className="ghostBtn"
              style={{ padding: "2px 8px", fontSize: 18, lineHeight: 1 }}
              onClick={(e) => { e.stopPropagation(); e.currentTarget.blur(); openMenu(); }}
              aria-label="Post options"
            >
              •••
            </button>
            {menuOpen && createPortal(
              <div
                onMouseDown={(e) => e.stopPropagation()}
                style={{
                  position: "fixed", top: menuPos.top, right: menuPos.right,
                  background: "var(--bg)", border: "1px solid var(--border)",
                  borderRadius: 10, minWidth: 140, boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
                  zIndex: 9999, overflow: "hidden",
                }}
              >
                {isOwn ? (
                  <>
                    <button
                      type="button"
                      style={{ display: "block", width: "100%", padding: "11px 16px", textAlign: "left", background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "#fff" }}
                      onClick={() => { setMenuOpen(false); alert("Edit coming soon"); }}
                    >
                      {t("post.edit")}
                    </button>
                    <div style={{ height: 1, background: "var(--border)" }} />
                    <button
                      type="button"
                      style={{ display: "block", width: "100%", padding: "11px 16px", textAlign: "left", background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "var(--danger, #e0245e)" }}
                      onClick={() => { setMenuOpen(false); onDelete?.(post.id); }}
                    >
                      {t("post.delete")}
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    style={{ display: "block", width: "100%", padding: "11px 16px", textAlign: "left", background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "#fff" }}
                    onClick={() => { setMenuOpen(false); alert(t("post.report_soon")); }}
                  >
                    {t("post.report")}
                  </button>
                )}
              </div>,
              document.body
            )}
          </div>
        </div>

        <div
          ref={contentRef}
          className="postContent"
          dir="auto"
          style={{
            ...(isLong && !expanded ? { whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } : {}),
            paddingRight: "20px",
          }}
        >
          {post.content}
        </div>

        {post.files && post.files.length > 0 && (
          <div style={{ marginTop: 10, display: "grid", gap: 8, marginRight: 22, marginBottom: 10 }}>
            {post.files.map((file) => (
              isResizing ? (
                <div
                  key={file.id}
                  style={{ width: "100%", aspectRatio: "16/9", borderRadius: 12, background: "var(--panel2)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  <PhotoIcon style={{ width: 48, height: 48, color: "var(--muted)", opacity: 0.5 }} />
                </div>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={file.id}
                  src={`${API_URL}${file.url}`}
                  alt={file.filename}
                  style={{ width: "100%", height: "auto", display: "block", borderRadius: 12, border: "1px solid var(--border)" }}
                />
              )
            ))}
          </div>
        )}

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
            {commentCount > 0 && (
              <span className="commentCount" onClick={toggleComments}>
                {commentCount} {t("home.comments")}
              </span>
            )}
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
          </div>
        </div>

        {showCommentBox && (
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <input
              className="authInput"
              dir="auto"
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
        )}
      </div>

      {showComments && (
        <div className="commentsList">
          {loadingComments && <p className="muted">Loading...</p>}
          {commentsList.map((c) => (
            <div key={c.id} className="commentItem">
              <Avatar name={c.author.username} avatarUrl={c.author.avatarUrl} size={38} />
              <div style={{ fontSize: 15, flex: 1 }}>
                <div style={{ display: "flex", gap: 6, alignItems: "baseline" }}>
                  <span className="name">{c.author.username}</span>
                  <span className="muted" style={{ fontSize: 11 }}>{timeAgo(c.createdAt)}</span>
                </div>
                <p dir="auto" style={{ margin: 0 }}>{c.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
