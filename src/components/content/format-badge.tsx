import { cn } from "@/lib/utils";
import { FORMAT_LABELS } from "@/lib/content/step-types";

const TONES: Record<string, string> = {
  F1: "bg-[#fde8f0] text-[#b0336b] dark:bg-[#3a1f2b] dark:text-[#f19ac0]",
  F3: "bg-secondary text-primary",
  F4: "bg-[#e6f0fb] text-[#2767a8] dark:bg-[#1c2a3a] dark:text-[#8fc0f0]",
  F5: "bg-warning-soft text-warning",
  F6: "bg-success-soft text-success",
  F8: "bg-[#fdf0e1] text-[#b86b12] dark:bg-[#3a2a17] dark:text-[#f0b56d]",
  F9: "bg-[#eaf5f5] text-[#1d7f80] dark:bg-[#17302f] dark:text-[#7fd0d0]",
  F10: "bg-[#efe9fb] text-[#5b3ea8] dark:bg-[#29213d] dark:text-[#bba6f0]",
};

export function FormatBadge({ code, withLabel = true, className }: { code: string; withLabel?: boolean; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold",
        TONES[code] ?? "bg-muted text-muted-foreground",
        className,
      )}
    >
      {code}
      {withLabel && FORMAT_LABELS[code] && <span className="font-semibold opacity-80">· {FORMAT_LABELS[code]}</span>}
    </span>
  );
}
