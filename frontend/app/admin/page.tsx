"use client";

import Topbar from "@/components/Topbar";
import LeftSidebar from "@/components/LeftSidebar";
import RightSidebar from "@/components/RightSidebar";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import "../i18n";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

function authHeaders(): HeadersInit {
  const token = Cookies.get("token");
  return { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

function authUploadHeaders(): HeadersInit {
  const token = Cookies.get("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

type AdminUser = {
  id: number;
  username: string;
  email: string;
  bio: string | null;
  avatarUrl: string | null;
  role: string;
  createdAt: string;
  _count: { posts: number; followers: number; following: number };
};

type AdminPost = {
  id: number;
  content: string;
  createdAt: string;
  author: { id: number; username: string };
  _count: { likes: number; comments: number };
};

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function UserRow({ user, onDelete, onAvatarChange, onBioChange, onRoleChange }: {
  user: AdminUser;
  onDelete: (id: number) => void;
  onAvatarChange: (id: number, file: File) => void;
  onBioChange: (id: number, bio: string) => void;
  onRoleChange: (id: number, role: string) => void;
}) {
  const [editingBio, setEditingBio] = useState(false);
  const [bioText, setBioText] = useState(user.bio ?? "");
  const avatarInputRef = useRef<HTMLInputElement>(null);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12, background: "var(--card)", border: "2px solid var(--border)",
        display: "grid", placeItems: "center", fontWeight: 800, fontSize: 18, flexShrink: 0, overflow: "hidden",
      }}>
        {user.avatarUrl && !user.avatarUrl.includes("via.placeholder.com")
          ? <img src={user.avatarUrl} alt={user.username} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : user.username[0].toUpperCase()
        }
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 14 }}>{user.username}</div>
        <div style={{ fontSize: 12, color: "var(--muted)" }}>{user.email}</div>
        {editingBio ? (
          <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
            <input
              className="authInput"
              style={{ fontSize: 12, padding: "4px 8px", flex: 1 }}
              value={bioText}
              onChange={(e) => setBioText(e.target.value)}
              maxLength={200}
              autoFocus
            />
            <button className="btn btnSmall" type="button" onClick={() => { onBioChange(user.id, bioText); setEditingBio(false); }}>Save</button>
            <button className="ghostBtn" type="button" onClick={() => setEditingBio(false)}>✕</button>
          </div>
        ) : (
          <div style={{ fontSize: 12, color: "var(--muted)" }}>{user.bio || <em>No bio</em>}</div>
        )}
        <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
          {user._count.posts} posts · {user._count.followers} followers ·{" "}
          <span style={{ color: user.role === "admin" ? "var(--accent)" : "var(--muted)", fontWeight: user.role === "admin" ? 700 : 400 }}>
            {user.role}
          </span>
        </div>
      </div>

      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
        <input ref={avatarInputRef} type="file" hidden accept="image/png,image/jpeg"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onAvatarChange(user.id, f); e.target.value = ""; }} />
        <button className="ghostBtn" type="button" title="Change avatar" onClick={() => avatarInputRef.current?.click()}>
          🖼
        </button>
        <button className="ghostBtn" type="button" title="Edit bio" onClick={() => { setBioText(user.bio ?? ""); setEditingBio(true); }}>
          ✏️
        </button>
        <button
          className="ghostBtn"
          type="button"
          title={user.role === "admin" ? "Demote to user" : "Promote to admin"}
          onClick={() => onRoleChange(user.id, user.role === "admin" ? "user" : "admin")}
        >
          {user.role === "admin" ? "👑" : "⬆️"}
        </button>
        <button
          type="button"
          style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", fontSize: 14, padding: "4px 8px", borderRadius: 6 }}
          onClick={() => { if (confirm(`Delete user "${user.username}"?`)) onDelete(user.id); }}
        >
          Delete
        </button>
      </div>
    </div>
  );
}

function PostRow({ post, onDelete }: { post: AdminPost; onDelete: (id: number) => void }) {
  return (
    <div style={{ padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>
            <strong>{post.author.username}</strong> · {timeAgo(post.createdAt)} · {post._count.likes} likes · {post._count.comments} comments
          </div>
          <div style={{ fontSize: 14, wordBreak: "break-word" }}>{post.content}</div>
        </div>
        <button
          type="button"
          style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", fontSize: 14, padding: "4px 8px", borderRadius: 6, flexShrink: 0 }}
          onClick={() => { if (confirm("Delete this post?")) onDelete(post.id); }}
        >
          Delete
        </button>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"users" | "posts">("users");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = Cookies.get("token");
    if (!token) { router.push("/"); return; }

    fetch(`${API_URL}/auth/me`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((me) => {
        if (me.role !== "admin") { router.push("/home"); return; }
        loadAll();
      })
      .catch(() => router.push("/"));
  }, []);

  function loadAll() {
    setLoading(true);
    Promise.all([
      fetch(`${API_URL}/admin/users`, { headers: authHeaders() }).then((r) => r.json()),
      fetch(`${API_URL}/admin/posts`, { headers: authHeaders() }).then((r) => r.json()),
    ])
      .then(([u, p]) => {
        if (Array.isArray(u)) setUsers(u);
        if (Array.isArray(p)) setPosts(p);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  async function deleteUser(id: number) {
    await fetch(`${API_URL}/admin/users/${id}`, { method: "DELETE", headers: authHeaders() });
    setUsers((prev) => prev.filter((u) => u.id !== id));
  }

  async function changeUserAvatar(id: number, file: File) {
    const formData = new FormData();
    formData.append("file", file);
    const uploadRes = await fetch(`${API_URL}/upload`, { method: "POST", headers: authUploadHeaders(), body: formData });
    if (!uploadRes.ok) return;
    const uploaded = await uploadRes.json();
    const avatarUrl = `${API_URL}${uploaded.url}`;
    const res = await fetch(`${API_URL}/admin/users/${id}/avatar`, {
      method: "PATCH", headers: authHeaders(), body: JSON.stringify({ avatarUrl }),
    });
    if (!res.ok) return;
    setUsers((prev) => prev.map((u) => u.id === id ? { ...u, avatarUrl } : u));
  }

  async function changeUserBio(id: number, bio: string) {
    const res = await fetch(`${API_URL}/admin/users/${id}/bio`, {
      method: "PATCH", headers: authHeaders(), body: JSON.stringify({ bio }),
    });
    if (!res.ok) return;
    setUsers((prev) => prev.map((u) => u.id === id ? { ...u, bio } : u));
  }

  async function changeUserRole(id: number, role: string) {
    const res = await fetch(`${API_URL}/admin/users/${id}/role`, {
      method: "PATCH", headers: authHeaders(), body: JSON.stringify({ role }),
    });
    if (!res.ok) return;
    setUsers((prev) => prev.map((u) => u.id === id ? { ...u, role } : u));
  }

  async function deletePost(id: number) {
    await fetch(`${API_URL}/admin/posts/${id}`, { method: "DELETE", headers: authHeaders() });
    setPosts((prev) => prev.filter((p) => p.id !== id));
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
          <div className="card">
            <div className="cardTitle" style={{ fontSize: 18, marginBottom: 12 }}>Admin Panel</div>

            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              <button
                type="button"
                className={tab === "users" ? "btn btnSmall" : "ghostBtn"}
                onClick={() => setTab("users")}
              >
                Users ({users.length})
              </button>
              <button
                type="button"
                className={tab === "posts" ? "btn btnSmall" : "ghostBtn"}
                onClick={() => setTab("posts")}
              >
                Posts ({posts.length})
              </button>
            </div>

            {loading ? (
              <div className="muted">Loading...</div>
            ) : tab === "users" ? (
              <div>
                {users.map((u) => (
                  <UserRow
                    key={u.id}
                    user={u}
                    onDelete={deleteUser}
                    onAvatarChange={changeUserAvatar}
                    onBioChange={changeUserBio}
                    onRoleChange={changeUserRole}
                  />
                ))}
              </div>
            ) : (
              <div>
                {posts.map((p) => (
                  <PostRow key={p.id} post={p} onDelete={deletePost} />
                ))}
              </div>
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
