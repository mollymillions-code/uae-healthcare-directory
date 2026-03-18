export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateShort(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

export function timeAgo(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diff = now - then;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  return formatDateShort(iso);
}

export function platformIcon(platform: "linkedin" | "x" | "instagram"): string {
  switch (platform) {
    case "linkedin":
      return "in";
    case "x":
      return "𝕏";
    case "instagram":
      return "ig";
  }
}

export function platformColor(platform: "linkedin" | "x" | "instagram"): string {
  switch (platform) {
    case "linkedin":
      return "text-blue-700";
    case "x":
      return "text-ink";
    case "instagram":
      return "text-pink-600";
  }
}
