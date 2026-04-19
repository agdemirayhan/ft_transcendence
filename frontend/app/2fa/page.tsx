"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function TwoFactorLoginPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => router.replace("/settings"), 1200);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="authPage">
      <div className="authCard">
        <h2 style={{ marginTop: 0, marginBottom: 8 }}>Redirecting</h2>
        <p className="muted" style={{ marginTop: 0, marginBottom: 16 }}>
          2FA verification codes are no longer used. Opening settings...
        </p>
      </div>
    </div>
  );
}
