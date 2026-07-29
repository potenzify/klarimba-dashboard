import { Info } from "lucide-react";

/**
 * Aviso de listado posiblemente incompleto.
 *
 * El API acepta `?limit&offset` pero aún no devuelve `pagination.total`
 * (pendiente 1.4), así que las vistas traen una página grande y filtran en
 * memoria. Si el listado llega exactamente al límite, es indistinguible de uno
 * truncado: se avisa en vez de dar por completa una lista que quizá no lo está.
 */
export function TruncationNotice({
  count,
  limit,
  noun,
}: {
  count: number;
  limit: number;
  noun: string;
}) {
  if (count < limit) return null;

  return (
    <p className="mt-3 flex items-center gap-2 text-[11.5px] text-muted-foreground">
      <Info className="size-3.5 shrink-0 text-brand-mid" />
      Se muestran {limit} {noun}, el máximo por página. Puede haber más sin
      listar: la paginación de servidor está pendiente en el API.
    </p>
  );
}
