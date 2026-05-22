export function ZavisLogo({ color = "black" }: { color?: string }) {
  const isWhite = color === "white";

  return (
    <span
      aria-label="Zavis"
      className={`inline-flex h-[32px] items-center font-['Geist',sans-serif] text-[29px] font-black leading-none tracking-[-0.08em] ${
        isWhite ? "text-white" : "text-[#1c1c1c]"
      }`}
    >
      zavis
      <span className={isWhite ? "text-white" : "text-[#00c853]"}>.</span>
    </span>
  );
}
