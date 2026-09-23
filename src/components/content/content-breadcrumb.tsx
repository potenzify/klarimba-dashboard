import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { Fragment } from "react";

export interface Crumb {
  label: string;
  href?: string;
}

/** Contenido › Mundo › Mapa › Misión */
export function ContentBreadcrumb({ items }: { items: Crumb[] }) {
  const all: Crumb[] = [{ label: "Contenido", href: "/admin/content" }, ...items];
  return (
    <nav aria-label="Ruta" className="mb-3 flex flex-wrap items-center gap-1 text-[12px] text-muted-foreground">
      {all.map((crumb, index) => (
        <Fragment key={`${crumb.label}-${index}`}>
          {index > 0 && <ChevronRight className="size-3" />}
          {crumb.href && index < all.length - 1 ? (
            <Link href={crumb.href} className="font-medium hover:text-foreground">
              {crumb.label}
            </Link>
          ) : (
            <span className="font-semibold text-foreground">{crumb.label}</span>
          )}
        </Fragment>
      ))}
    </nav>
  );
}
