"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ApiError } from "@/lib/api/http";
import {
  bootstrapOrgAdmin,
  createBackofficeOrganization,
  createBackofficeSeatGrant,
  grantEntitlement,
  revokeBackofficeSeatGrant,
  revokeEntitlement,
  updateBackofficeOrganization,
} from "@/lib/api/backoffice";
import {
  createOrganizationInputSchema,
  createSeatGrantInputSchema,
  organizationStatusSchema,
} from "@/lib/api/schemas";
import type { ActionResult } from "@/lib/action-result";

function toActionError(error: unknown): ActionResult<never> {
  if (error instanceof ApiError) return { ok: false, error: error.message };
  throw error;
}

const orgIdSchema = z.string().uuid();

// --- Clientes (organizaciones raíz) ----------------------------------------

export async function createClientAction(
  input: z.infer<typeof createOrganizationInputSchema>,
): Promise<ActionResult<{ id: string }>> {
  const parsed = createOrganizationInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  try {
    const org = await createBackofficeOrganization(parsed.data);
    revalidatePath("/admin", "layout");
    return { ok: true, data: { id: org.id } };
  } catch (error) {
    return toActionError(error);
  }
}

const updateClientSchema = z.object({
  orgId: orgIdSchema,
  name: z.string().min(2).max(255).optional(),
  status: organizationStatusSchema.optional(),
});

export async function updateClientAction(
  input: z.infer<typeof updateClientSchema>,
): Promise<ActionResult> {
  const parsed = updateClientSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const { orgId, ...body } = parsed.data;
  try {
    await updateBackofficeOrganization(orgId, body);
    revalidatePath("/admin", "layout");
    return { ok: true };
  } catch (error) {
    return toActionError(error);
  }
}

// --- Seat grants --------------------------------------------------------------

const backofficeGrantSchema = createSeatGrantInputSchema.extend({
  orgId: orgIdSchema,
});

export async function createGrantAction(
  input: z.infer<typeof backofficeGrantSchema>,
): Promise<ActionResult> {
  const parsed = backofficeGrantSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const { orgId, ...body } = parsed.data;
  try {
    await createBackofficeSeatGrant(orgId, body);
    revalidatePath(`/admin/clients/${orgId}`);
    return { ok: true };
  } catch (error) {
    return toActionError(error);
  }
}

export async function revokeGrantAction(
  orgId: string,
  grantId: string,
): Promise<ActionResult> {
  try {
    await revokeBackofficeSeatGrant(orgId, grantId);
    revalidatePath(`/admin/clients/${orgId}`);
    return { ok: true };
  } catch (error) {
    return toActionError(error);
  }
}

// --- Entitlements (add-on ENTERPRISE) ------------------------------------------

export async function grantEnterpriseAction(
  orgId: string,
): Promise<ActionResult> {
  try {
    await grantEntitlement(orgId, { product: "ENTERPRISE" });
    revalidatePath(`/admin/clients/${orgId}`);
    return { ok: true };
  } catch (error) {
    return toActionError(error);
  }
}

export async function revokeEnterpriseAction(
  orgId: string,
  entitlementId: string,
): Promise<ActionResult> {
  try {
    await revokeEntitlement(orgId, entitlementId);
    revalidatePath(`/admin/clients/${orgId}`);
    return { ok: true };
  } catch (error) {
    return toActionError(error);
  }
}

// --- Bootstrap del primer admin --------------------------------------------------

const bootstrapSchema = z.object({
  orgId: orgIdSchema,
  email: z.string().email("Correo inválido"),
  role: z.enum(["COMPANY_OWNER", "HR_ADMIN"]),
});

export async function bootstrapAdminAction(
  input: z.infer<typeof bootstrapSchema>,
): Promise<ActionResult<{ existed: boolean }>> {
  const parsed = bootstrapSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  try {
    const result = await bootstrapOrgAdmin(parsed.data.orgId, {
      identifier: parsed.data.email,
      identifierType: "EMAIL",
      role: parsed.data.role,
    });
    revalidatePath(`/admin/clients/${parsed.data.orgId}`);
    return { ok: true, data: { existed: Boolean(result.membership) } };
  } catch (error) {
    return toActionError(error);
  }
}
