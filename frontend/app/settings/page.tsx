"use client";

import { useRouter } from "next/navigation";

export default function SettingsPage() {
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
          <div className="cardTitle">Settings</div>
          <p className="muted">Nothing here yet.</p>
        </div>
      </main>
    </div>
  );
}