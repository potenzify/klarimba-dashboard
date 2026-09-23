"use client";

import { Eye, Loader2, Undo2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  getRevisionAction,
  listRevisionsAction,
  revertRevisionAction,
} from "@/app/(dashboard)/admin/content/actions";
import { StatusPill } from "@/components/dashboard/status-pill";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ContentEntityType, ContentRevision } from "@/lib/api/content-schemas";
import { LocalDateTime } from "./local-date-time";

const ACTION_LABELS: Record<string, { label: string; tone: "purple" | "green" | "red" | "amber" | "grey" }> = {
  UPDATE: { label: "Editado", tone: "purple" },
  CREATE: { label: "Creado", tone: "green" },
  DELETE: { label: "Borrado", tone: "red" },
  REORDER: { label: "Reordenado", tone: "amber" },
  IMPORT: { label: "Importado", tone: "amber" },
  REVERT: { label: "Revertido", tone: "grey" },
};

const ENTITY_LABELS: Record<ContentEntityType, string> = {
  WORLD: "Mundo",
  MAP: "Mapa",
  MISSION: "Misión",
  STEP: "Step",
};

/** Aplana un snapshot a `ruta → valor` para comparar antes/después. */
function flatten(value: unknown, prefix = "", out = new Map<string, string>()): Map<string, string> {
  if (value === null || value === undefined) {
    if (prefix) out.set(prefix, "—");
    return out;
  }
  if (Array.isArray(value)) {
    if (value.length === 0 && prefix) out.set(prefix, "[]");
    value.forEach((item, index) => flatten(item, `${prefix}[${index}]`, out));
    return out;
  }
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0 && prefix) out.set(prefix, "{}");
    for (const [key, item] of entries) flatten(item, prefix ? `${prefix}.${key}` : key, out);
    return out;
  }
  out.set(prefix, String(value));
  return out;
}

function RevisionDiff({ revision }: { revision: ContentRevision }) {
  const before = flatten(revision.before);
  const after = flatten(revision.after);
  const paths = [...new Set([...before.keys(), ...after.keys()])].filter(
    (path) => before.get(path) !== after.get(path),
  );
  if (paths.length === 0) {
    return <p className="text-[12.5px] text-muted-foreground">No hay diferencias de contenido.</p>;
  }
  return (
    <div className="max-h-[60vh] overflow-auto rounded-lg border">
      <table className="w-full text-left text-[12px]">
        <thead className="sticky top-0 bg-muted">
          <tr>
            <th className="px-2.5 py-1.5 font-semibold">Campo</th>
            <th className="px-2.5 py-1.5 font-semibold">Antes</th>
            <th className="px-2.5 py-1.5 font-semibold">Después</th>
          </tr>
        </thead>
        <tbody>
          {paths.map((path) => (
            <tr key={path} className="border-t align-top">
              <td className="px-2.5 py-1.5 font-mono text-[10.5px] text-muted-foreground">{path}</td>
              <td className="px-2.5 py-1.5 break-words text-destructive">{before.get(path) ?? "—"}</td>
              <td className="px-2.5 py-1.5 break-words text-success">{after.get(path) ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface RevisionHistoryProps {
  initial: ContentRevision[];
  total: number | null;
  filters: { missionId?: string; entityType?: ContentEntityType; entityId?: string };
  /** Muestra enlace a la misión (historial global). */
  linkMissions?: boolean;
  pageSize?: number;
}

/**
 * Historial con "ver cambios" y "revertir". El padre lo monta con `key` ligada
 * a la primera revisión: al refrescar los datos del servidor se reinicia la lista.
 */
export function RevisionHistory({ initial, total, filters, linkMissions, pageSize = 20 }: RevisionHistoryProps) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [count, setCount] = useState(total);
  const [loading, startLoad] = useTransition();
  const [reverting, startRevert] = useTransition();
  const [detail, setDetail] = useState<ContentRevision | null>(null);
  const [loadingDetail, setLoadingDetail] = useState<string | null>(null);

  function loadMore() {
    startLoad(async () => {
      const result = await listRevisionsAction({ ...filters, limit: pageSize, offset: items.length });
      if (result.ok && result.data) {
        setItems((current) => [...current, ...result.data!.items]);
        setCount(result.data.total);
      } else if (!result.ok) {
        toast.error("No se pudo cargar el historial", { description: result.error });
      }
    });
  }

  async function openDetail(id: string) {
    setLoadingDetail(id);
    const result = await getRevisionAction(id);
    setLoadingDetail(null);
    if (result.ok && result.data) setDetail(result.data);
    else if (!result.ok) toast.error("No se pudo cargar el cambio", { description: result.error });
  }

  function revert(revision: ContentRevision) {
    startRevert(async () => {
      const result = await revertRevisionAction(revision.id);
      if (result.ok) {
        toast.success("Cambio revertido");
        for (const warning of result.data?.warnings ?? []) toast.warning(warning);
        router.refresh();
      } else {
        toast.error("No se pudo revertir", { description: result.error, duration: 10_000 });
      }
    });
  }

  if (items.length === 0) {
    return (
      <p className="rounded-xl border border-dashed bg-card p-6 text-center text-[12.5px] text-muted-foreground">
        Todavía no hay cambios hechos desde el panel.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <ol className="flex flex-col divide-y rounded-xl border bg-card">
        {items.map((revision) => {
          const action = ACTION_LABELS[revision.action] ?? { label: revision.action, tone: "grey" as const };
          return (
            <li key={revision.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusPill tone={action.tone}>{action.label}</StatusPill>
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase">
                    {ENTITY_LABELS[revision.entityType]}
                  </span>
                  <span className="truncate text-[12.5px] font-semibold">{revision.summary}</span>
                </div>
                <p className="mt-0.5 text-[11.5px] text-muted-foreground">
                  <LocalDateTime value={revision.createdAt} /> ·{" "}
                  {revision.actor?.name ?? revision.actor?.email ?? "Usuario eliminado"}
                  {linkMissions && revision.missionId && (
                    <>
                      {" · "}
                      <Link
                        href={`/admin/content/missions/${revision.missionId}`}
                        className="underline underline-offset-2 hover:text-foreground"
                      >
                        abrir misión
                      </Link>
                    </>
                  )}
                </p>
              </div>
              <div className="flex gap-1.5">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={loadingDetail === revision.id}
                  onClick={() => void openDetail(revision.id)}
                >
                  {loadingDetail === revision.id ? <Loader2 className="animate-spin" /> : <Eye />}
                  Ver cambios
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" disabled={reverting}>
                      <Undo2 />
                      Revertir
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Revertir este cambio?</AlertDialogTitle>
                      <AlertDialogDescription>
                        {ENTITY_LABELS[revision.entityType]} vuelve al estado anterior a «{revision.summary}». Si hubo
                        cambios posteriores sobre el mismo elemento, también se deshacen. La reversión queda en el
                        historial y se puede volver a revertir.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => revert(revision)}>Revertir</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </li>
          );
        })}
      </ol>
      {count !== null && items.length < count && (
        <Button variant="outline" size="sm" className="self-center" disabled={loading} onClick={loadMore}>
          {loading && <Loader2 className="animate-spin" />}
          Cargar más ({count - items.length})
        </Button>
      )}

      <Dialog open={Boolean(detail)} onOpenChange={(open) => !open && setDetail(null)}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{detail?.summary ?? "Cambio"}</DialogTitle>
            <DialogDescription>
              {detail && (
                <>
                  <LocalDateTime value={detail.createdAt} /> · {detail.actor?.name ?? detail.actor?.email ?? ""}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          {detail && <RevisionDiff revision={detail} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
