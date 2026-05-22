import Image from "next/image";

export function ZavisLogo({ color = "black" }: { color?: string }) {
  const isWhite = color === "white";

  return (
    <Image
      src={isWhite ? "/zavis-logo-light.svg" : "/zavis-logo-dark.svg"}
      alt="Zavis"
      width={743}
      height={263}
      className="h-8 w-auto"
      priority
    />
  );
}
