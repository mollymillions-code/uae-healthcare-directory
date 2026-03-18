import { ImageResponse } from "next/og";
import { type NextRequest } from "next/server";

export const runtime = "edge";

// Category → color palette mapping
const PALETTES: Record<string, { bg: string; accent: string; glow: string; text: string }> = {
  regulatory:            { bg: "#0a1a12", accent: "#00a844", glow: "#00c853", text: "#e0f2e8" },
  "new-openings":        { bg: "#0d1117", accent: "#58a6ff", glow: "#79c0ff", text: "#d2e5ff" },
  financial:             { bg: "#1a1410", accent: "#d4a04a", glow: "#f0c060", text: "#f5e6c8" },
  events:                { bg: "#170d1a", accent: "#b46ee0", glow: "#d09cf0", text: "#ead5f5" },
  "social-pulse":        { bg: "#0d1a1a", accent: "#2ec4b6", glow: "#4de6d8", text: "#d0f0ec" },
  "thought-leadership":  { bg: "#1a0d0d", accent: "#e05555", glow: "#f07070", text: "#f5d5d5" },
  "market-intelligence": { bg: "#0d1117", accent: "#00a844", glow: "#30d070", text: "#d0f0dc" },
  technology:            { bg: "#0d0f1a", accent: "#6c8cff", glow: "#8ca8ff", text: "#d5ddff" },
  workforce:             { bg: "#1a1714", accent: "#c0965a", glow: "#dab07a", text: "#f0e4d0" },
};

const DEFAULT_PALETTE = { bg: "#0a1a12", accent: "#00a844", glow: "#00c853", text: "#e0f2e8" };

// Seeded pseudo-random number generator (deterministic per slug)
function seededRandom(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(31, h) + seed.charCodeAt(i) | 0;
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title") || "Zavis Healthcare Industry Insights";
  const category = searchParams.get("category") || "regulatory";
  const slug = searchParams.get("slug") || "default";

  const palette = PALETTES[category] || DEFAULT_PALETTE;
  const rand = seededRandom(slug);

  // Generate deterministic geometric elements
  const circles = Array.from({ length: 8 }, () => ({
    cx: Math.floor(rand() * 1200),
    cy: Math.floor(rand() * 630),
    r: Math.floor(rand() * 200) + 60,
    opacity: (rand() * 0.15 + 0.03).toFixed(2),
  }));

  const lines = Array.from({ length: 12 }, () => ({
    x1: Math.floor(rand() * 1200),
    y1: Math.floor(rand() * 630),
    x2: Math.floor(rand() * 1200),
    y2: Math.floor(rand() * 630),
    opacity: (rand() * 0.12 + 0.02).toFixed(2),
  }));

  const gridDots = Array.from({ length: 40 }, () => ({
    cx: Math.floor(rand() * 1200),
    cy: Math.floor(rand() * 630),
    r: Math.floor(rand() * 3) + 1,
    opacity: (rand() * 0.3 + 0.1).toFixed(2),
  }));

  // Category label
  const categoryLabel = category
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: "60px",
          backgroundColor: palette.bg,
          fontFamily: "system-ui, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* SVG shader layer */}
        <svg
          width="1200"
          height="630"
          style={{ position: "absolute", top: 0, left: 0 }}
          viewBox="0 0 1200 630"
        >
          {/* Radial glow */}
          <defs>
            <radialGradient id="glow1" cx="30%" cy="40%" r="50%">
              <stop offset="0%" stopColor={palette.glow} stopOpacity="0.15" />
              <stop offset="100%" stopColor={palette.bg} stopOpacity="0" />
            </radialGradient>
            <radialGradient id="glow2" cx="80%" cy="70%" r="40%">
              <stop offset="0%" stopColor={palette.accent} stopOpacity="0.08" />
              <stop offset="100%" stopColor={palette.bg} stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="1200" height="630" fill="url(#glow1)" />
          <rect width="1200" height="630" fill="url(#glow2)" />

          {/* Geometric circles */}
          {circles.map((c, i) => (
            <circle
              key={`c${i}`}
              cx={c.cx}
              cy={c.cy}
              r={c.r}
              fill="none"
              stroke={palette.accent}
              strokeWidth="1"
              opacity={c.opacity}
            />
          ))}

          {/* Connecting lines */}
          {lines.map((l, i) => (
            <line
              key={`l${i}`}
              x1={l.x1}
              y1={l.y1}
              x2={l.x2}
              y2={l.y2}
              stroke={palette.accent}
              strokeWidth="0.5"
              opacity={l.opacity}
            />
          ))}

          {/* Grid dots */}
          {gridDots.map((d, i) => (
            <circle
              key={`d${i}`}
              cx={d.cx}
              cy={d.cy}
              r={d.r}
              fill={palette.accent}
              opacity={d.opacity}
            />
          ))}

          {/* Horizontal scan lines */}
          {Array.from({ length: 6 }, (_, i) => (
            <line
              key={`scan${i}`}
              x1="0"
              y1={100 + i * 90}
              x2="1200"
              y2={100 + i * 90}
              stroke={palette.accent}
              strokeWidth="0.3"
              opacity="0.06"
            />
          ))}
        </svg>

        {/* Content overlay */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            position: "relative",
            zIndex: 10,
            gap: "16px",
          }}
        >
          {/* Category badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div
              style={{
                backgroundColor: palette.accent,
                color: "#ffffff",
                fontSize: "12px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                padding: "4px 10px",
              }}
            >
              {categoryLabel}
            </div>
          </div>

          {/* Title */}
          <div
            style={{
              color: palette.text,
              fontSize: title.length > 80 ? 32 : 40,
              fontWeight: 700,
              lineHeight: 1.2,
              maxWidth: "900px",
              letterSpacing: "-0.01em",
            }}
          >
            {title}
          </div>

          {/* Zavis Media branding */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginTop: "8px",
            }}
          >
            <div
              style={{
                width: "4px",
                height: "16px",
                backgroundColor: palette.accent,
              }}
            />
            <span
              style={{
                color: palette.accent,
                fontSize: "13px",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
              }}
            >
              Zavis Healthcare Industry Insights
            </span>
            <span
              style={{
                color: palette.text,
                opacity: 0.4,
                fontSize: "13px",
                letterSpacing: "0.05em",
              }}
            >
              by Zavis
            </span>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
