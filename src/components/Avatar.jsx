import { useState } from "react";
import defaultAvatar from "../assets/images/avatar/student.avif";

/**
 * Deterministic pastel-safe color from a string (name, id, email…)
 * so the same person always gets the same fallback color.
 */
const PALETTE = [
  "#1E40AF", "#7C3AED", "#0EA5E9", "#16A34A",
  "#D97706", "#DB2777", "#0D9488", "#B45309",
];
function colorFor(seed = "") {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

/** Build initials from a full name, e.g. "Ngu Desmond" -> "ND" */
export function initials(name) {
  if (!name || typeof name !== "string") return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * <Avatar photo={user.photo} name={user.name} size={40} />
 *
 * Resolution order:
 *  1. Real photo URL, if present AND it loads successfully.
 *  2. Initials on a deterministic colored circle, if a name is available.
 *  3. A generic default-user icon, if nothing is available at all.
 *
 * Fully responsive: pass `size` in px (default 40) or size can be
 * driven purely by CSS (width/height: 100%) if the parent controls it —
 * just omit `size` and set dimensions via className/style on the parent.
 */
export default function Avatar({
  photo,
  src, // alias, some call sites use `src`
  name,
  size = 100,
  className = "",
  style = {},
  rounded = true,
}) {
  const url = photo || src;
  const [errored, setErrored] = useState(false);
  const showImage = !!url && !errored;
  const hasName = !!name && typeof name === "string" && name.trim().length > 0;
  const bg = hasName ? colorFor(name) : "#94A3B8";
  const fontSize = Math.max(10, Math.round(size * 0.4));

  const baseStyle = {
    width: size,
    height: size,
    minWidth: size,
    borderRadius: rounded ? "50%" : 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    flexShrink: 0,
    fontWeight: 600,
    fontSize,
    color: "#fff",
    background: showImage ? "transparent" : bg,
    ...style,
  };

  return (
  <div
    className={`avatar ${className}`}
    style={baseStyle}
    title={name || "User"}
  >
    <img
      src={showImage ? url : defaultAvatar}
      alt={name || "User avatar"}
      loading="lazy"
      onError={() => setErrored(true)}
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
        display: "block",
      }}
    />
  </div>
);
}