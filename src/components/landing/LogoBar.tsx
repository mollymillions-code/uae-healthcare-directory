import { type FC } from "react";

interface LogoBarProps {
  logos: { icon: FC<{ className?: string }>; name: string }[];
  title?: string;
  className?: string;
  iconSize?: string;
}

export function LogoBar({ logos, title, className = "", iconSize = "w-10 h-10" }: LogoBarProps) {
  // Repeat logos enough times so one "half" fills the viewport, then duplicate for seamless loop
  const fillCount = logos.length <= 3 ? 4 : logos.length <= 6 ? 3 : 2;
  const singleSet = Array.from({ length: fillCount }, () => logos).flat();
  // Two identical sets back-to-back — animation translates -50% for seamless loop
  const tickerLogos = [...singleSet, ...singleSet];
  // Slower for more logos, faster for fewer
  const duration = `${singleSet.length * 3}s`;

  return (
    <div
      className={`bg-white/50 rounded-2xl px-6 sm:px-8 py-5 sm:py-6 ring-1 ring-black/5 ${className}`}
    >
      {title && (
        <p className="font-['Geist',sans-serif] text-xs font-medium uppercase tracking-widest text-black/40 text-center mb-5">
          {title}
        </p>
      )}
      <div className="overflow-hidden">
        <div
          className="flex items-center gap-10 lg:gap-14 animate-ticker w-max"
          style={{ "--ticker-duration": duration } as React.CSSProperties}
        >
          {tickerLogos.map((logo, i) => {
            const LogoIcon = logo.icon;
            return (
              <div
                key={`${logo.name}-${i}`}
                className="flex flex-col items-center gap-1.5 flex-shrink-0"
                title={logo.name}
              >
                <LogoIcon className={iconSize} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
