import type { HTMLAttributes } from "react";

type LogoVariant = "full" | "icon";
type LogoTheme = "light" | "dark" | "auto";
type LogoSize = "sm" | "md" | "lg" | "xl";

type AgendaMeLogoProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: LogoVariant;
  theme?: LogoTheme;
  size?: LogoSize;
};

const sizeClass: Record<LogoSize, string> = {
  sm: "h-8",
  md: "h-11",
  lg: "h-14",
  xl: "h-20",
};

function cn(...classes: Array<string | undefined | false | null>) {
  return classes.filter(Boolean).join(" ");
}

function getLogoAsset(variant: LogoVariant, mode: "light" | "dark" | "base") {
  const prefix = variant === "icon" ? "icon-agendame" : "logo-agendame";

  if (mode === "base") {
    return `/brand/${prefix}.svg`;
  }

  // "light"/"dark" ya coinciden con el sufijo del archivo: el asset
  // "-light" trae texto oscuro para fondos claros y "-dark" trae texto
  // claro para fondos oscuros. No invertir este mapeo.
  return `/brand/${prefix}-${mode}.svg`;
}

function LogoImage({
  variant,
  mode,
  className,
}: {
  variant: LogoVariant;
  mode: "light" | "dark" | "base";
  className?: string;
}) {
  return (
    <img
      src={getLogoAsset(variant, mode)}
      alt="AgendaMe"
      className={cn(
        "block h-full w-auto select-none object-contain",
        variant === "icon" && "aspect-square",
        className,
      )}
      draggable={false}
    />
  );
}

export function AgendaMeLogo({
  variant = "full",
  theme = "auto",
  size = "md",
  className,
  ...props
}: AgendaMeLogoProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center align-middle",
        sizeClass[size],
        className,
      )}
      aria-label="AgendaMe"
      {...props}
    >
      {theme === "auto" ? (
        <>
          <LogoImage variant={variant} mode="light" className="dark:hidden" />
          <LogoImage variant={variant} mode="dark" className="hidden dark:block" />
        </>
      ) : (
        <LogoImage variant={variant} mode={theme} />
      )}
    </span>
  );
}

export function AgendaMeIcon({
  theme = "auto",
  size = "md",
  className,
  ...props
}: Omit<AgendaMeLogoProps, "variant">) {
  return (
    <AgendaMeLogo
      variant="icon"
      theme={theme}
      size={size}
      className={className}
      {...props}
    />
  );
}
