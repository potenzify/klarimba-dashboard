import {
  E2E_EMAIL,
  E2E_PASSWORD,
  expect,
  orgIdFromUrl,
  test,
  uniqueTestEmail,
} from "./fixtures";

test.skip(
  !E2E_EMAIL || !E2E_PASSWORD,
  "Define E2E_EMAIL y E2E_PASSWORD para ejercitar el API real (ver .env.example).",
);

test.describe("Usuarios", () => {
  test("login y render de la tabla con datos reales", async ({ dashboard }) => {
    const orgId = orgIdFromUrl(dashboard);
    await dashboard.goto(`/org/${orgId}/users`);

    await expect(
      dashboard.getByRole("heading", { name: "Usuarios" }),
    ).toBeVisible();
    await expect(
      dashboard.getByRole("columnheader", { name: "Código" }),
    ).toBeVisible();
    // El propio usuario tiene que aparecer como miembro activo.
    await expect(dashboard.getByText(E2E_EMAIL!)).toBeVisible();
  });

  test("invitar, copiar el código al portapapeles y revocar", async ({
    dashboard,
  }) => {
    const orgId = orgIdFromUrl(dashboard);
    const email = uniqueTestEmail();
    await dashboard.goto(`/org/${orgId}/users`);

    // --- Invitar ---------------------------------------------------------
    await dashboard.getByRole("button", { name: "Invitar empleados" }).click();
    const dialog = dashboard.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await dialog.getByPlaceholder("empleado@empresa.com").fill(email);
    await dialog.getByRole("button", { name: "Enviar invitaciones" }).click();

    await expect(dashboard.getByText(`Invitación enviada a ${email}`)).toBeVisible();
    await expect(dialog).toBeHidden();

    // --- La fila aparece con su código -----------------------------------
    const row = dashboard.getByRole("row").filter({ hasText: email });
    await expect(row).toBeVisible();
    await expect(row.getByText("Invitado")).toBeVisible();

    const copyButton = row.getByRole("button", {
      name: /^Copiar código de invitación/,
    });
    await expect(copyButton).toBeVisible();

    const code = (await copyButton.textContent())?.trim() ?? "";
    // Alfabeto sin caracteres ambiguos del API (invitation-code.service.ts).
    expect(code).toMatch(/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{8}$/);

    // --- Copiar ----------------------------------------------------------
    await copyButton.click();
    await expect(dashboard.getByText(`Código ${code} copiado`)).toBeVisible();

    const clipboard = await dashboard.evaluate(() =>
      navigator.clipboard.readText(),
    );
    expect(clipboard).toBe(code);

    // --- Revocar (deja el API dev como estaba) ---------------------------
    await row.getByRole("button", { name: "Acciones" }).click();
    await dashboard
      .getByRole("menuitem", { name: "Revocar invitación" })
      .click();

    await expect(dashboard.getByText("Invitación revocada")).toBeVisible();
    await expect(
      dashboard.getByRole("row").filter({ hasText: email }),
    ).toHaveCount(0);
  });

  test("el filtro de invitados no rompe la vista", async ({ dashboard }) => {
    const orgId = orgIdFromUrl(dashboard);
    await dashboard.goto(`/org/${orgId}/users?status=INVITED`);
    await expect(
      dashboard.getByRole("heading", { name: "Usuarios" }),
    ).toBeVisible();
  });
});

test.describe("Sesión", () => {
  test("una organización inexistente muestra el not-found propio", async ({
    dashboard,
  }) => {
    await dashboard.goto("/org/00000000-0000-0000-0000-000000000000");
    await expect(dashboard.getByText("No encontramos esto")).toBeVisible();
  });

  test("logout devuelve al login y la sesión queda cerrada", async ({
    dashboard,
  }) => {
    await dashboard.getByRole("button", { name: /Cerrar sesión/i }).click();
    await dashboard.waitForURL(/\/login/, { timeout: 30_000 });

    // Sin sesión, el middleware ya no deja entrar al dashboard.
    await dashboard.goto("/");
    await expect(dashboard).toHaveURL(/\/login/);
  });
});
