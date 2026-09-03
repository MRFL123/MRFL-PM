import { cn } from "@/lib/utils";

type MirrorfulLogoProps = {
  variant?: "light" | "dark";
  size?: "sm" | "md" | "lg";
  className?: string;
  showWordmark?: boolean;
};

const sizes = {
  sm: { mark: 28, wordmarkH: 26, text: "text-[13px] tracking-[0.28em]" },
  md: { mark: 36, wordmarkH: 32, text: "text-[15px] tracking-[0.32em]" },
  lg: { mark: 64, wordmarkH: 48, text: "text-[26px] tracking-[0.34em]" },
};

export function MirrorfulLogo({
  variant = "light",
  size = "md",
  className,
  showWordmark = true,
}: MirrorfulLogoProps) {
  const { mark, wordmarkH, text } = sizes[size];

  if (variant === "light" && showWordmark) {
    return (
      <span className={cn("inline-flex items-center", className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/mirrorful-wordmark.png"
          alt="Mirrorful"
          className="w-auto object-contain object-left"
          style={{ height: wordmarkH }}
        />
      </span>
    );
  }

  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/mirrorful-mark.png"
        alt=""
        width={mark}
        height={mark}
        className="shrink-0 object-contain"
      />
      {showWordmark ? (
        <span
          className={cn(
            "font-semibold uppercase leading-none",
            text,
            variant === "dark" ? "text-white" : "text-zinc-800",
          )}
        >
          Mirrorful
        </span>
      ) : null}
      <span className="sr-only">Mirrorful</span>
    </span>
  );
}
