import { cn } from "@/lib/utils";

/** Isotipo de Klarimba (círculos del mockup) sobre degradado morado. */
export function KlarimbaLogo({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-[9px] bg-gradient-to-br from-primary to-brand-mid shadow-[0_4px_12px_rgba(107,63,160,0.3)]",
        className,
      )}
    >
      <svg viewBox="0 0 24 24" fill="none" className="size-5">
        <circle cx="7" cy="8" r="3" fill="#fff" opacity=".95" />
        <circle cx="15" cy="7" r="2.2" fill="#fff" opacity=".7" />
        <circle cx="17" cy="15" r="2.8" fill="#fff" opacity=".85" />
        <circle cx="8" cy="16" r="2" fill="#fff" opacity=".6" />
      </svg>
    </div>
  );
}
