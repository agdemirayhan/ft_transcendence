import { useMemo } from "react";

export default function Avatar({ name, size = 42 }: { name: string; size?: number }) {
  const initials = useMemo(() => {
    const parts = name.trim().split(/\s+/);
    return (parts[0]?.[0] ?? "U") + (parts[1]?.[0] ?? "");
  }, [name]);

  return (
    <div className="avatar" style={{ width: size, height: size, fontSize: size * 0.38, borderRadius: size * 0.33 }}>
      {initials.toUpperCase()}
    </div>
  );
}