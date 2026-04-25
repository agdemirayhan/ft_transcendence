"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import Cookies from "js-cookie";
import Avatar from "@/components/Avatar";
import "../app/i18n";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

function authHeaders(): HeadersInit {
  const token = Cookies.get("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

type UserProfile = {
  id: number;
  username: string;
  avatarUrl?: string | null;
  stats: { posts: number; followers: number; following: number };
};

type FollowUser = { id: number; username: string; avatarUrl?: string | null };

function FollowingModal({ type, onClose }: { type: "following" | "followers"; onClose: () => void }) {
  const router = useRouter();
  const [list, setList] = useState<FollowUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/users/me/${type}`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setList(data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [type]);

  async function unfollow(userId: number, e: React.MouseEvent) {
    e.stopPropagation();
    try {
      await fetch(`${API_URL}/users/${userId}/follow`, { method: "DELETE", headers: authHeaders() });
      setList((prev) => prev.filter((u) => u.id !== userId));
    } catch (err) {
      console.error(err);
    }
  }

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
            <div key={u.id} className="modalListItem" onClick={() => { onClose(); router.push(`/profile/${u.id}`); }}>
              <Avatar name={u.username} avatarUrl={u.avatarUrl} />
              <div style={{ flex: 1 }}>
                <div className="name">{u.username}</div>
                <div className="muted">@{u.username}</div>
              </div>
              {type === "following" && (
                <button className="btn btnSmall" type="button" onClick={(e) => unfollow(u.id, e)}>
                  Unfollow
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ProfileCard({ followingDelta = 0 }: { followingDelta?: number }) {
  const router = useRouter();
  const { t } = useTranslation();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [showModal, setShowModal] = useState<"following" | "followers" | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/auth/me`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((data) => setUser(data))
      .catch(console.error);
  }, []);

  return (
    <>
      <div className="card">
        <div className="cardTitle">{t("home.profile")}</div>
        <div className="profile">
          <Avatar name={user?.username ?? "?"} avatarUrl={user?.avatarUrl} />
          <div>
            <div
              className="profileName"
              style={{ cursor: "pointer" }}
              onClick={() => user && router.push(`/profile/${user.id}`)}
            >
              {user?.username ?? "..."}
            </div>
            <div className="muted">@{user?.username ?? "..."}</div>
          </div>
        </div>
        <div className="stats">
          <div className="stat statClickable" onClick={() => user && router.push(`/profile/${user.id}`)}>
            <div className="statNum">{user?.stats?.posts ?? "-"}</div>
            <div className="muted">{t("home.posts")}</div>
          </div>
          <div className="stat statClickable" onClick={() => setShowModal("followers")}>
            <div className="statNum">{user?.stats?.followers ?? "-"}</div>
            <div className="muted">{t("home.followers")}</div>
          </div>
          <div className="stat statClickable" onClick={() => setShowModal("following")}>
            <div className="statNum">{user ? (user.stats.following + followingDelta) : "-"}</div>
            <div className="muted">{t("home.following")}</div>
          </div>
        </div>
        <button className="btn btnWide" type="button" onClick={() => user && router.push(`/profile/${user.id}`)}>
          {t("home.edit_profile")}
        </button>
      </div>

      {showModal && <FollowingModal type={showModal} onClose={() => setShowModal(null)} />}
    </>
  );
}
