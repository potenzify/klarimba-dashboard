/** Copia al portapapeles; `false` si el navegador lo bloquea (contexto inseguro). */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
