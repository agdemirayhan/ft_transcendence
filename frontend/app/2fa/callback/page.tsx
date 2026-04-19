"use client";

import Cookies from "js-cookie";
import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

export default function OAuth2CallbackPage() {
  const [status, setStatus] = useState("Completing OAuth2 setup...");

  useEffect(() => {
    let cancelled = false;

    const finishSetup = async () => {
      try {
        const token = Cookies.get("token");
        if (!token) {
          throw new Error("Missing auth token.");
        }

        const res = await fetch(`${API_URL}/2fa/verify-setup`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(data.message || "Could not complete OAuth2 setup.");
        }

        if (cancelled) {
          return;
        }

        setStatus(data.message || "2FA enabled.");

        if (window.opener && !window.opener.closed) {
          window.opener.postMessage({ type: "twofactor:enabled" }, window.location.origin);
        }

        window.close();
      } catch (error) {
        if (cancelled) {
          return;
        }

        setStatus(error instanceof Error ? error.message : "Could not complete OAuth2 setup.");
      }
    };

    finishSetup();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="authPage">
      <div className="authCard">
        <h2 style={{ marginTop: 0, marginBottom: 8 }}>OAuth2 callback</h2>
        <p className="muted" style={{ marginTop: 0, marginBottom: 0 }}>
          {status}
        </p>
      </div>
    </div>
  );
}