import { expect, test as base, type Page } from "@playwright/test";

export const E2E_EMAIL = process.env.E2E_EMAIL;
export const E2E_PASSWORD = process.env.E2E_PASSWORD;

/**
 * Dominio reservado por IANA para documentación y pruebas (RFC 2606): no tiene
 * MX, así que el correo de invitación que dispara el API no llega a ningún
 * buzón real. Nunca usar un dominio de verdad aquí.
 */
export const TEST_EMAIL_DOMAIN = "example.com";

export function uniqueTestEmail(): string {
  return `e2e-${Date.now()}@${TEST_EMAIL_DOMAIN}`;
}

export const test = base.extend<{ dashboard: Page }>({
  /** Página ya autenticada, situada en el primer contexto del usuario. */
  dashboard: async ({ page }, use) => {
    await login(page);
    await use(page);
  },
});

export async function login(page: Page): Promise<void> {
  await page.goto("/login");
  await page.getByLabel("Correo electrónico").fill(E2E_EMAIL!);
  await page.getByLabel("Contraseña").fill(E2E_PASSWORD!);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();

  // `/` redirige al primer contexto disponible.
  await page.waitForURL(/\/(org|admin)\//, { timeout: 30_000 });
}

/** Id de la organización del contexto actual, leído de la URL. */
export function orgIdFromUrl(page: Page): string {
  const match = page.url().match(/\/org\/([0-9a-f-]{36})/);
  expect(match, `la URL no contiene un orgId: ${page.url()}`).not.toBeNull();
  return match![1];
}

export { expect };
