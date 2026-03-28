"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

export default function ProfileRedirect() {
  const router = useRouter();

  useEffect(() => {
    const token = Cookies.get("token");
    if (!token) { router.push("/"); return; }

    fetch(`${API_URL}/auth/me`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((r) => r.json())
      .then((data) => router.replace(`/profile/${data.id}`))
      .catch(() => router.push("/"));
  }, []);

  return null;
}
