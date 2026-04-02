import svgPaths from "@/imports/svg-a821gkm5bu";

export function ZavisLogo({ color = "black" }: { color?: string }) {
  return (
    <svg width="80" height="21" viewBox="0 0 80 21" fill="none" aria-label="Zavis" role="img">
      <g clipPath="url(#zavisLogo)">
        <path d={svgPaths.p5d2e200} fill={color} />
      </g>
      <defs>
        <clipPath id="zavisLogo">
          <rect width="80" height="21" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}
