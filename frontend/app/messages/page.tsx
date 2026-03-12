"use client";

import { useRouter } from "next/navigation";

export default function MessagesPage() {
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
          <div className="cardTitle">Messages</div>
          <p className="muted">No messages yet.</p>
        </div>
      </main>
    </div>
  );
}