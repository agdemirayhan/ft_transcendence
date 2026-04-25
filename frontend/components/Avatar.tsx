import { useMemo } from "react";

export default function Avatar({ name, avatarUrl, size = 42 }: { name: string; avatarUrl?: string | null; size?: number }) {
  const initials = useMemo(() => {
    const parts = name.trim().split(/\s+/);
    return (parts[0]?.[0] ?? "U") + (parts[1]?.[0] ?? "");
  }, [name]);

  const hasPhoto = avatarUrl && !avatarUrl.includes("via.placeholder.com");

  return (
    <div className="avatar" style={{ width: size, height: size, fontSize: size * 0.38, borderRadius: size * 0.33, overflow: "hidden", padding: 0 }}>
      {hasPhoto ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarUrl} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      ) : (
        <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%" }}>
          {initials.toUpperCase()}
        </span>
      )}
    </div>
  );
}
