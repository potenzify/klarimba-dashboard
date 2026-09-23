import type { ContentFile, StepContent } from "@/lib/api/content-schemas";
import type { Path } from "@/lib/content/content-state";

export interface StepFormContext {
  formatCode: string;
  missionType: string;
  /** Archivos conocidos (los de la misión + los subidos en esta sesión), por id. */
  files: Record<string, ContentFile>;
  registerFile: (file: ContentFile) => void;
}

/** Props comunes: contenido en español del step y setter por ruta. */
export interface StepFormProps {
  content: StepContent;
  set: (path: Path, value: unknown) => void;
  context: StepFormContext;
}
