import Image from "next/image";
import { useId } from "react";

type LogoSpinnerProps = {
  size?: "small" | "medium" | "large";
  text?: string;
  fullScreen?: boolean;
  background?: string;
  className?: string;
};

const sizes = {
  small: { frame: "h-14 w-24", orbit: "size-12", logo: "w-24", glow: "size-16" },
  medium: { frame: "h-20 w-40", orbit: "size-[4.5rem]", logo: "w-40", glow: "size-24" },
  large: { frame: "h-28 w-56", orbit: "size-24", logo: "w-56", glow: "size-32" }
} as const;

export function LogoSpinner({
  size = "medium",
  // text,
  fullScreen = false,
  background,
  className = ""
}: LogoSpinnerProps) {
  const dimensions = sizes[size];
  const gradientId = `eventsphere-spinner-${useId().replace(/:/g, "")}`;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      // aria-label={text || "Loading"}
      className={`${fullScreen ? "fixed inset-0 z-[100] grid place-items-center" : "inline-flex flex-col items-center justify-center"} ${className}`}
      style={background ? { backgroundColor: background } : undefined}
    >
      <div className={`relative grid ${dimensions.frame} place-items-center`}>
        <div className={`logo-spinner-glow absolute rounded-full bg-gradient-to-br from-[#6D35E8]/35 via-[#C02BD8]/25 to-[#FF8A35]/20 blur-xl ${dimensions.glow}`} />
        <svg
          aria-hidden="true"
          className={`logo-spinner-orbit absolute text-[#6D35E8] ${dimensions.orbit}`}
          viewBox="0 0 100 100"
          fill="none"
        >
          <circle cx="50" cy="50" r="44" stroke="currentColor" strokeOpacity=".12" strokeWidth="3" />
          <circle
            cx="50"
            cy="50"
            r="44"
            stroke={`url(#${gradientId})`}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="72 204"
          />
          <defs>
            <linearGradient id={gradientId} x1="5" y1="5" x2="95" y2="95">
              <stop stopColor="#6D35E8" />
              <stop offset=".62" stopColor="#C02BD8" />
              <stop offset="1" stopColor="#FF8A35" />
            </linearGradient>
          </defs>
        </svg>
        <Image
          src="/eventsphere-logo.svg"
          alt=""
          aria-hidden="true"
          width={240}
          height={84}
          priority
          className={`logo-spinner-pulse relative z-10 h-auto ${dimensions.logo}`}
        />
      </div>
      {/* {text && <span className="mt-3 text-center text-sm font-semibold text-[#51465f]">{text}</span>} */}
    </div>
  );
}
