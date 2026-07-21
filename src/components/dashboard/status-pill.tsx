import { cn } from "@/lib/utils";

type PillTone = "green" | "amber" | "red" | "grey" | "purple";

const TONES: Record<PillTone, string> = {
  green: "bg-success-soft text-success",
  amber: "bg-warning-soft text-warning",
  red: "bg-destructive-soft text-destructive",
  grey: "bg-muted text-muted-foreground",
  purple: "bg-secondary text-primary",
};

export function StatusPill({
  tone,
  children,
  className,
}: {
  tone: PillTone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Tonos por estado de usuario/miembro (INVITED/ACTIVE/SUSPENDED/REVOKED). */
export function userStatusPill(status: string): {
  tone: PillTone;
  label: string;
} {
  switch (status) {
    case "ACTIVE":
      return { tone: "green", label: "Activo" };
    case "INVITED":
      return { tone: "amber", label: "Invitado" };
    case "SUSPENDED":
      return { tone: "grey", label: "Suspendido" };
    case "REVOKED":
      return { tone: "red", label: "Revocado" };
    default:
      return { tone: "grey", label: status };
  }
}

/** Tonos por estado de organización. */
export function orgStatusPill(status: string): {
  tone: PillTone;
  label: string;
} {
  switch (status) {
    case "ACTIVE":
      return { tone: "green", label: "Activa" };
    case "SUSPENDED":
      return { tone: "amber", label: "Suspendida" };
    case "ARCHIVED":
      return { tone: "grey", label: "Archivada" };
    default:
      return { tone: "grey", label: status };
  }
}

/** Tonos por estado de seat grant. */
export function seatGrantStatusPill(status: string): {
  tone: PillTone;
  label: string;
} {
  switch (status) {
    case "ACTIVE":
      return { tone: "green", label: "Activo" };
    case "SUSPENDED":
      return { tone: "amber", label: "Suspendido" };
    case "EXPIRED":
      return { tone: "grey", label: "Expirado" };
    case "REVOKED":
      return { tone: "red", label: "Revocado" };
    default:
      return { tone: "grey", label: status };
  }
}
