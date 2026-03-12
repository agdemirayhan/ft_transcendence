"use client";

import { useRouter } from "next/navigation";
import Avatar from "@/components/Avatar";

export default function ProfilePage() {
  const router = useRouter();

  return (
    <div className="page">
      <header className="topbar">
        <button className="ghostBtn" onClick={() => router.back()} type="button">
          ← Back
        </button>
      </header>

      <main style={{ maxWidth: 600, margin: "40px auto", padding: "0 16px" }}>
        <div className="card">
          <div className="profile">
            <Avatar name="Ayhan" />
            <div>
              <div className="profileName">Ayhan</div>
              <div className="muted">@ayhan</div>
            </div>
          </div>

          <div className="stats">
            <div className="stat"><div className="statNum">12</div><div className="muted">Posts</div></div>
            <div className="stat"><div className="statNum">340</div><div className="muted">Followers</div></div>
            <div className="stat"><div className="statNum">180</div><div className="muted">Following</div></div>
          </div>
        </div>
      </main>
    </div>
  );
}