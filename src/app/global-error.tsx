"use client";

import { useEffect } from "react";

/**
 * Último recurso: reemplaza al `layout.tsx` raíz, así que no puede usar sus
 * fuentes, estilos ni componentes — debe traer su propio `<html>`/`<body>` y
 * estilos en línea. Cubre los fallos del layout del dashboard (sesión, sidebar).
 */
export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("[root] global error boundary", error);
  }, [error]);

  return (
    <html lang="es">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1.5rem",
          fontFamily:
            "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          color: "#1a1a1a",
          background: "#fafafa",
        }}
      >
        <div style={{ maxWidth: "26rem", textAlign: "center" }}>
          <h1 style={{ fontSize: "1.125rem", fontWeight: 700, margin: 0 }}>
            Klarimba Enterprise no pudo iniciar
          </h1>
          <p
            style={{
              margin: "0.5rem 0 0",
              fontSize: "0.85rem",
              lineHeight: 1.5,
              color: "#666",
            }}
          >
            Falló algo fuera de las vistas: la sesión o la carga de la consola.
            Reintenta o vuelve a iniciar sesión.
          </p>
          <div
            style={{
              marginTop: "1.5rem",
              display: "flex",
              gap: "0.625rem",
              justifyContent: "center",
            }}
          >
            <button
              type="button"
              onClick={() => unstable_retry()}
              style={{
                cursor: "pointer",
                borderRadius: "0.5rem",
                border: "none",
                background: "#1a1a1a",
                color: "#fff",
                padding: "0.5rem 1rem",
                fontSize: "0.8rem",
                fontWeight: 600,
              }}
            >
              Reintentar
            </button>
            <a
              href="/login"
              style={{
                borderRadius: "0.5rem",
                border: "1px solid #d4d4d4",
                background: "#fff",
                color: "#1a1a1a",
                padding: "0.5rem 1rem",
                fontSize: "0.8rem",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Iniciar sesión
            </a>
          </div>
          {error.digest && (
            <p
              style={{
                marginTop: "1.5rem",
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                fontSize: "0.7rem",
                color: "#999",
              }}
            >
              Referencia: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
