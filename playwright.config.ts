import { defineConfig, devices } from "@playwright/test";

/**
 * E2E contra un API de Klarimba **real** (dev), no contra mocks: la suite
 * escribe datos (crea y revoca una invitación) y por eso no debe apuntar nunca
 * a producción.
 *
 * Requiere `E2E_EMAIL` y `E2E_PASSWORD` en el entorno; sin ellas la suite se
 * salta con un mensaje explícito en vez de fallar.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false, // la suite muta datos compartidos del API dev
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  timeout: 60_000,
  expect: { timeout: 15_000 },

  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
    // El botón de copiar usa `navigator.clipboard`, que exige contexto seguro
    // (localhost lo es) y permiso explícito en Chromium.
    permissions: ["clipboard-read", "clipboard-write"],
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  webServer: {
    // Build de producción: es lo que se despliega, y en dev el overlay de
    // errores de Next se interpone con los diálogos.
    command: "pnpm build && pnpm start",
    url: "http://localhost:3000/login",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    stdout: "pipe",
    stderr: "pipe",
  },
});
