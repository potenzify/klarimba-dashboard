"use client";

import { Film, ImageIcon, Loader2, Upload, X } from "lucide-react";
import { useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { contentFileSchema, type ContentFile } from "@/lib/api/content-schemas";
import { FieldShell } from "./fields";

type Kind = "image" | "video";

const ACCEPT: Record<Kind, string> = {
  image: "image/png,image/jpeg,image/webp,image/gif",
  video: "video/mp4,video/quicktime,video/webm",
};

/** Sube un archivo al bucket público vía `/api/content/upload` (proxy en streaming al API). */
export async function uploadContentFile(file: File): Promise<ContentFile> {
  const body = new FormData();
  body.append("file", file);
  const response = await fetch("/api/content/upload", { method: "POST", body });
  const json = await response.json().catch(() => null);
  if (!response.ok) {
    const message = Array.isArray(json?.message)
      ? json.message.map((m: { constraints?: Record<string, string> }) => Object.values(m.constraints ?? {}).join(", ")).join(" · ")
      : json?.message;
    throw new Error(message || `Error ${response.status} al subir el archivo`);
  }
  return contentFileSchema.parse(json?.data);
}

/** Duración (segundos, redondeada) de un video local, leída en el navegador. */
function readVideoDuration(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    const url = URL.createObjectURL(file);
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(Number.isFinite(video.duration) ? Math.round(video.duration) : null);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    video.src = url;
  });
}

interface FileFieldProps {
  label: ReactNode;
  kind: Kind;
  file: ContentFile | null | undefined;
  onUploaded: (file: ContentFile, meta: { durationSec: number | null }) => void;
  /** Si existe, muestra "Quitar" (vuelve al placeholder / quita el campo). */
  onClear?: () => void;
  hint?: ReactNode;
}

export function FileField({ label, kind, file, onUploaded, onClear, hint }: FileFieldProps) {
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const showPreview = file?.url && !file.isPlaceholder;

  async function handle(selected: File | undefined) {
    if (!selected) return;
    setUploading(true);
    try {
      const durationSec = kind === "video" ? await readVideoDuration(selected) : null;
      const uploaded = await uploadContentFile(selected);
      onUploaded(uploaded, { durationSec });
      toast.success(`${kind === "video" ? "Video" : "Imagen"} subido`, {
        description: "Se aplicará al guardar el step.",
      });
    } catch (error) {
      toast.error("No se pudo subir el archivo", { description: (error as Error).message });
    } finally {
      setUploading(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <FieldShell label={label} hint={hint}>
      <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-card p-2.5">
        <div className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">
          {showPreview && kind === "image" && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={file.url!} alt={file.originalName} className="size-full object-cover" />
          )}
          {showPreview && kind === "video" && (
            <video src={file.url!} className="size-full object-cover" muted preload="metadata" />
          )}
          {!showPreview &&
            (kind === "video" ? (
              <Film className="size-6 text-muted-foreground" />
            ) : (
              <ImageIcon className="size-6 text-muted-foreground" />
            ))}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12.5px] font-semibold">
            {file ? (file.isPlaceholder ? "Placeholder genérico (sin imagen propia)" : file.originalName) : "Sin archivo"}
          </p>
          {file && !file.isPlaceholder && (
            <p className="text-[11px] text-muted-foreground">
              {file.mimeType} · {(file.size / 1024 / 1024).toFixed(2)} MB
              {file.url && (
                <>
                  {" · "}
                  <a href={file.url} target="_blank" rel="noreferrer" className="underline underline-offset-2">
                    abrir
                  </a>
                </>
              )}
            </p>
          )}
          <div className="mt-2 flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="outline" disabled={uploading} onClick={() => input.current?.click()}>
              {uploading ? <Loader2 className="animate-spin" /> : <Upload />}
              {uploading ? "Subiendo…" : file && !file.isPlaceholder ? "Reemplazar" : "Subir"}
            </Button>
            {onClear && file && !file.isPlaceholder && (
              <Button type="button" size="sm" variant="ghost" disabled={uploading} onClick={onClear}>
                <X />
                Quitar
              </Button>
            )}
          </div>
        </div>
        <input
          ref={input}
          type="file"
          accept={ACCEPT[kind]}
          className="hidden"
          onChange={(event) => void handle(event.target.files?.[0])}
        />
      </div>
    </FieldShell>
  );
}
