import { ChevronLeft, ChevronRight, Info } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { PagePagination } from "@/lib/api/schemas";

interface TablePaginationProps {
  /** `pagination` del envelope; `null` si el API aún no la envía. */
  pagination: PagePagination | null;
  /** Filas visibles en la página actual (para el modo degradado). */
  count: number;
  /** Ruta base de la vista, p. ej. `/org/{id}/users`. */
  basePath: string;
  /** Query params a preservar al cambiar de página (filtros activos). */
  params?: Record<string, string | undefined>;
  /** Sustantivo plural para los textos ("personas", "organizaciones"). */
  noun: string;
}

/**
 * Navegación de página para los listados de servidor (`?page=N`, 1-based; el
 * tamaño lo fija cada vista con `limit`). Sin `pagination` (API sin
 * desplegar) degrada al antiguo aviso de truncamiento: no puede saber si hay
 * más filas, así que lo dice.
 */
export function TablePagination({
  pagination,
  count,
  basePath,
  params = {},
  noun,
}: TablePaginationProps) {
  if (!pagination) {
    // Modo degradado: sin total, un listado lleno es indistinguible de uno
    // truncado. Solo avisa cuando la página vino llena.
    return count > 0 ? (
      <p className="mt-3 flex items-center gap-2 text-[11.5px] text-muted-foreground">
        <Info className="size-3.5 shrink-0 text-brand-mid" />
        Se muestran {count} {noun}. El API aún no informa el total: puede haber
        más sin listar.
      </p>
    ) : null;
  }

  const { total, limit, offset } = pagination;
  const lastPage = Math.max(1, Math.ceil(total / limit));
  const currentPage = Math.min(Math.floor(offset / limit) + 1, lastPage);
  if (total <= limit && currentPage === 1) return null;

  const from = Math.min(offset + 1, total);
  const to = Math.min(offset + count, total);

  const hrefFor = (page: number) => {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value) search.set(key, value);
    }
    if (page > 1) search.set("page", String(page));
    const query = search.toString();
    return query ? `${basePath}?${query}` : basePath;
  };

  return (
    <nav
      aria-label="Paginación"
      className="mt-3 flex items-center justify-between gap-3"
    >
      <p className="text-[11.5px] text-muted-foreground">
        {total === 0
          ? `Sin ${noun}`
          : `${from}–${to} de ${total} ${noun} · página ${currentPage} de ${lastPage}`}
      </p>
      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage <= 1}
          asChild={currentPage > 1}
        >
          {currentPage > 1 ? (
            <Link href={hrefFor(currentPage - 1)} rel="prev">
              <ChevronLeft />
              Anterior
            </Link>
          ) : (
            <>
              <ChevronLeft />
              Anterior
            </>
          )}
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage >= lastPage}
          asChild={currentPage < lastPage}
        >
          {currentPage < lastPage ? (
            <Link href={hrefFor(currentPage + 1)} rel="next">
              Siguiente
              <ChevronRight />
            </Link>
          ) : (
            <>
              Siguiente
              <ChevronRight />
            </>
          )}
        </Button>
      </div>
    </nav>
  );
}

/**
 * `?page=` saneado: entero ≥ 1; cualquier otra cosa vuelve a la página 1.
 * Exportado junto al componente para que todas las vistas lo parseen igual.
 */
export function parsePageParam(raw: string | undefined): number {
  const page = Number.parseInt(raw ?? "1", 10);
  return Number.isFinite(page) && page >= 1 ? page : 1;
}
