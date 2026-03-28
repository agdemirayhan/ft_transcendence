"use client";

import Avatar from "@/components/Avatar";
import { useState, useEffect } from "react";
import { HeartIcon as HeartSolid } from "@heroicons/react/24/solid";
import { useRouter, useParams } from "next/navigation";
import Cookies from "js-cookie";

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

function Post({ post }: { post: PostType }) {
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
          <HeartSolid className="icon" style={{ width: 18, height: 18, color: "var(--muted)" }} />
          <span className="muted">{post.likes}</span>
        </div>
      </div>
    </div>
  );
}

export default function UserProfilePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [user, setUser] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<PostType[]>([]);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  useEffect(() => {
    const token = Cookies.get("token");
    if (!token) { router.push("/"); return; }

    // Check if this is the current user's profile
    fetch(`${API_URL}/auth/me`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((me) => {
        setIsOwnProfile(String(me.id) === String(id));
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
          })));
        }
      })
      .catch(console.error);
  }, [id]);

  return (
    <div className="page">
      <header className="topbar">
        <button className="ghostBtn" onClick={() => router.back()} type="button">
          ← Back
        </button>
        <span className="profileTopbarName">{user?.username ?? "Profile"}</span>
      </header>

      <main className="profileMain">

        <div className="profileCover" />

        <div className="profileAvatarRow">
          <div className="profileAvatar">
            {user?.username?.[0]?.toUpperCase() ?? "?"}
          </div>
          {isOwnProfile && (
            <button className="ghostBtn" onClick={() => alert("Edit profile will be added soon 🙂")} type="button">
              Edit Profile
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
            <div className="muted">Posts</div>
          </div>
          <div className="stat">
            <div className="statNum">{user?.stats?.followers ?? "-"}</div>
            <div className="muted">Followers</div>
          </div>
          <div className="stat">
            <div className="statNum">{user?.stats?.following ?? "-"}</div>
            <div className="muted">Following</div>
          </div>
        </div>

        <div className="profileTabs">
          <button type="button" className="profileTab active">Posts</button>
        </div>

        <div className="feed">
          {posts.length === 0 ? (
            <div className="muted profileEmpty">No posts yet.</div>
          ) : (
            posts.map((p) => (
              <div className="card" key={p.id}>
                <Post post={p} />
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
