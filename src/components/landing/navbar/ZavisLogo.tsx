export function ZavisLogo({ color = "black" }: { color?: string }) {
  const src = color === "white" ? "/zavis-logo-light.svg" : "/zavis-logo-dark.svg";
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="Zavis" className="h-[24px] w-auto" draggable={false} />;
}
