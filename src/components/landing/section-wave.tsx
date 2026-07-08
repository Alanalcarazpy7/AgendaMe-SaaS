import { useId } from "react";

type SectionWaveProps = {
  className?: string;
  flip?: boolean;
  variant?: "solid" | "gradient";
};

export function SectionWave({ className, flip, variant = "solid" }: SectionWaveProps) {
  const gradientId = useId();

  return (
    <svg
      viewBox="0 0 1440 90"
      preserveAspectRatio="none"
      aria-hidden="true"
      className={`block h-[52px] w-full sm:h-[72px] ${flip ? "-scale-y-100" : ""} ${className ?? ""}`}
    >
      {variant === "gradient" ? (
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--primary)" />
            <stop offset="100%" stopColor="var(--ring)" />
          </linearGradient>
        </defs>
      ) : null}
      <path
        d="M0,32 C240,80 480,0 720,24 C960,48 1200,88 1440,40 L1440,90 L0,90 Z"
        fill={variant === "gradient" ? `url(#${gradientId})` : "currentColor"}
      />
    </svg>
  );
}
