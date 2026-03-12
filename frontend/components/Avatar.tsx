import { useMemo } from "react";

export default function Avatar({ name }: { name: string }) {
  const initials = useMemo(() => {
    const parts = name.trim().split(/\s+/);
    return (parts[0]?.[0] ?? "U") + (parts[1]?.[0] ?? "");
  }, [name]);

  return <div className="avatar">{initials.toUpperCase()}</div>;
}