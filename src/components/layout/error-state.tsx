import { AlertTriangle } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
  title: string;
  description: ReactNode;
  /** `digest` del error: el identificador que aparece en los logs del servidor. */
  digest?: string;
  actions?: ReactNode;
  className?: string;
}

/**
 * Estado de fallo a página completa. Compartido por los `error.tsx`,
 * `not-found.tsx` y `global-error.tsx` para que un fallo se vea igual venga de
 * donde venga.
 */
export function ErrorState({
  title,
  description,
  digest,
  actions,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-[60vh] flex-col items-center justify-center px-6 text-center",
        className,
      )}
    >
      <span className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-secondary">
        <AlertTriangle className="size-6 text-brand-mid" />
      </span>
      <h1 className="text-lg font-bold tracking-tight">{title}</h1>
      <p className="mx-auto mt-1.5 max-w-sm text-[13px] text-muted-foreground">
        {description}
      </p>
      {actions && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
          {actions}
        </div>
      )}
      {digest && (
        <p className="mt-6 font-mono text-[11px] text-muted-foreground/70">
          Referencia: {digest}
        </p>
      )}
    </div>
  );
}
