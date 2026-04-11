/**
 * Neutral initial avatar used on doctor profile pages when no photo is
 * available OR when photo_consent is false. Server component — no client JS.
 *
 * Background color is hashed from the DHA ID so the same doctor always gets
 * the same visual identifier, but nothing about the color encodes race, sex,
 * age, or any sensitive attribute.
 */

interface DoctorInitialsAvatarProps {
  name: string;
  dhaUniqueId: string;
  sizePx?: number;
  className?: string;
}

// Curated palette — all dark-enough backgrounds for white text AA contrast.
const PALETTE = [
  "#006828", // Zavis green
  "#1c1c1c",
  "#0b4a6f",
  "#3d2b56",
  "#7a3c0e",
  "#4a1f37",
  "#1e3a5f",
  "#2d4a2b",
  "#5a2e0e",
  "#344054",
];

function hashToIndex(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % PALETTE.length;
}

function extractInitials(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter((p) => p.length > 0);
  if (parts.length === 0) return "DR";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function DoctorInitialsAvatar({
  name,
  dhaUniqueId,
  sizePx = 128,
  className = "",
}: DoctorInitialsAvatarProps) {
  const initials = extractInitials(name);
  const bg = PALETTE[hashToIndex(dhaUniqueId)];
  const fontSize = Math.max(16, Math.round(sizePx * 0.38));
  return (
    <div
      role="img"
      aria-label={`${name} profile illustration`}
      className={`flex items-center justify-center rounded-full text-white font-['Bricolage_Grotesque',sans-serif] font-medium tracking-tight select-none ${className}`}
      style={{
        width: `${sizePx}px`,
        height: `${sizePx}px`,
        backgroundColor: bg,
        fontSize: `${fontSize}px`,
      }}
    >
      {initials}
    </div>
  );
}
