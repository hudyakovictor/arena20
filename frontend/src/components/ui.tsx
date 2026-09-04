import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../utils/cn";

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "acid" | "outline" | "ghost" | "danger" | "gold" | "dark";
  size?: "sm" | "md" | "lg";
  drip?: boolean;
  children: ReactNode;
};

export function Button({ variant = "acid", size = "md", drip, className, children, ...rest }: BtnProps) {
  const sizes = {
    sm: "h-9 px-3 text-[13px]",
    md: "h-11 px-4 text-[15px]",
    lg: "h-14 px-6 text-[18px]",
  }[size];
  const variants = {
    acid: "bg-acid text-ink shadow-acid-soft hover:bg-[#d4ff2a]",
    outline: "border-2 border-acid text-acid bg-ink/40 hover:bg-acid/10",
    ghost: "border border-line-strong text-text bg-elevated/70 hover:bg-hover",
    danger: "border-2 border-bad text-bad bg-ink/40 hover:bg-bad/10",
    gold: "bg-gradient-to-b from-[#ffd76a] to-[#d9a520] text-ink shadow-[0_0_14px_rgba(245,197,66,0.35)]",
    dark: "bg-ink/70 border border-line text-sub hover:text-text",
  }[variant];
  return (
    <button
      className={cn(
        "press relative inline-flex items-center justify-center gap-2 rounded-xl font-display font-bold uppercase tracking-wide transition-colors select-none disabled:opacity-40",
        sizes,
        variants,
        drip && "drip",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

export function Chip({
  children,
  active,
  tone = "acid",
  className,
  onClick,
}: {
  children: ReactNode;
  active?: boolean;
  tone?: "acid" | "gold" | "muted";
  className?: string;
  onClick?: () => void;
}) {
  const activeCls = {
    acid: "border-acid text-acid shadow-acid-soft",
    gold: "border-gold text-gold",
    muted: "border-line-strong text-text",
  }[tone];
  return (
    <button
      onClick={onClick}
      className={cn(
        "press h-10 rounded-full border-2 px-4 font-display text-[15px] font-semibold uppercase tracking-wide transition-colors",
        active ? cn("bg-ink/60", activeCls) : "border-line-strong bg-elevated/60 text-sub",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function Tag({ children, color = "bg-acid text-ink", className }: { children: ReactNode; color?: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 font-display text-[11px] font-bold uppercase tracking-wider", color, className)}>
      {children}
    </span>
  );
}

export function ScreenTitle({ title, subtitle, accent, center }: { title: string; subtitle?: string; accent?: boolean; center?: boolean }) {
  return (
    <div className={cn("mb-4", center && "text-center")}>
      <h1 className={cn("stencil relative inline-block text-[34px] leading-none", accent ? "text-acid acid-glow-text drip drip-right" : "text-text drip drip-right drip-dark")}>{title}</h1>
      {subtitle && <p className="mt-2 text-[15px] text-sub">{subtitle}</p>}
    </div>
  );
}

export function Card({ children, className, acid, gold, cyan }: { children: ReactNode; className?: string; acid?: boolean; gold?: boolean; cyan?: boolean }) {
  return (
    <div
      className={cn(
        "card noise relative p-4",
        acid && "acid-ring",
        gold && "border-gold/70 shadow-[0_0_0_1px_rgba(245,197,66,0.5),0_0_20px_rgba(245,197,66,0.15)]",
        cyan && "border-cyan/70 shadow-[0_0_0_1px_rgba(69,224,208,0.5),0_0_20px_rgba(69,224,208,0.15)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Avatar({ src, emoji, size = 44, ring, className }: { src?: string; emoji?: string; size?: number; ring?: string; className?: string }) {
  return (
    <div
      style={{ width: size, height: size }}
      className={cn("flex shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 bg-elevated", ring ?? "border-line-strong", className)}
    >
      {src ? <img src={src} alt="" className="h-full w-full object-cover" /> : <span style={{ fontSize: size * 0.55 }}>{emoji}</span>}
    </div>
  );
}
