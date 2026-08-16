import { E2E_EMAIL, E2E_PASSWORD, expect, orgIdFromUrl, test } from "./fixtures";

test.skip(
  !E2E_EMAIL || !E2E_PASSWORD,
  "Define E2E_EMAIL y E2E_PASSWORD para ejercitar el API real (ver .env.example).",
);

const CODE_PATTERN = /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{8}$/;

test.describe("Invitaciones", () => {
  test("generar códigos al portador, verlos en la lista y revocar uno", async ({
    dashboard,
  }) => {
    const orgId = orgIdFromUrl(dashboard);
    await dashboard.goto(`/org/${orgId}/invitations`);

    await expect(
      dashboard.getByRole("heading", { name: "Invitaciones" }),
    ).toBeVisible();

    // --- Generar (el diálogo abre en la pestaña de códigos) ---------------
    await dashboard.getByRole("button", { name: "Invitar empleados" }).click();
    const dialog = dashboard.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(
      dialog.getByRole("tab", { name: "Generar códigos", selected: true }),
    ).toBeVisible();

    await dialog.getByLabel("Cantidad de códigos").fill("2");
    await dialog.getByRole("button", { name: "Generar códigos" }).click();

    await expect(dashboard.getByText("2 códigos generados")).toBeVisible();
    const generated = dialog.getByRole("list", { name: "Códigos generados" });
    const codes = await generated.getByRole("listitem").allTextContents();
    expect(codes).toHaveLength(2);
    for (const code of codes) expect(code.trim()).toMatch(CODE_PATTERN);

    // --- Copiar todos -----------------------------------------------------
    await dialog.getByRole("button", { name: "Copiar todos" }).click();
    const clipboard = await dashboard.evaluate(() =>
      navigator.clipboard.readText(),
    );
    expect(clipboard.split("\n")).toEqual(codes.map((c) => c.trim()));

    await dialog.getByRole("button", { name: "Listo" }).click();
    await expect(dialog).toBeHidden();

    // --- Aparecen en la lista como "Al portador" activas -----------------
    for (const raw of codes) {
      const code = raw.trim();
      const row = dashboard.getByRole("row").filter({ hasText: code });
      await expect(row).toBeVisible();
      await expect(row.getByText("Al portador")).toBeVisible();
      await expect(row.getByText("Activa")).toBeVisible();
      await expect(row.getByText("0 / 1")).toBeVisible();
    }

    // --- Revocar ambos (deja el API dev como estaba) ---------------------
    for (const raw of codes) {
      const code = raw.trim();
      const row = dashboard.getByRole("row").filter({ hasText: code });
      await row.getByRole("button", { name: "Acciones" }).click();
      await dashboard.getByRole("menuitem", { name: "Revocar código" }).click();
      await dashboard
        .getByRole("dialog")
        .getByRole("button", { name: "Revocar código" })
        .click();
      // `.first()`: el toast de la iteración anterior puede seguir visible.
      await expect(
        dashboard.getByText("Invitación revocada").first(),
      ).toBeVisible();
      await expect(row.getByText("Revocada")).toBeVisible();
    }
  });
});
