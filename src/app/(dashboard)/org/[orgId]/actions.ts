"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { ApiError } from "@/lib/api/http";
import {
  createChild,
  createInvitation,
  createSeatGrant,
  resendInvitation,
  revokeInvitation,
  revokeMembership,
  updateMembership,
  updateOrganization,
} from "@/lib/api/organizations";
import {
  createOrganizationInputSchema,
  createSeatGrantInputSchema,
  organizationRoleSchema,
} from "@/lib/api/schemas";
import {
  isSessionExpired,
  toActionError,
  type ActionResult,
} from "@/lib/action-result";

const orgIdSchema = z.string().uuid();

// ---------------------------------------------------------------------------
// Usuarios e invitaciones
// ---------------------------------------------------------------------------

const inviteInputSchema = z.object({
  orgId: orgIdSchema,
  emails: z
    .array(z.string().email("Correo inválido"))
    .min(1, "Agrega al menos un correo")
    .max(50, "Máximo 50 correos por envío"),
  roleToGrant: organizationRoleSchema.default("MEMBER"),
});

export interface InviteResult {
  sent: string[];
  failed: { email: string; error: string }[];
}

/**
 * Invita por email (invitación PERSONAL + EMAIL; el API envía el correo).
 * Devuelve el detalle por correo para que la UI informe fallos parciales.
 */
export async function inviteByEmailAction(
  input: z.infer<typeof inviteInputSchema>,
): Promise<ActionResult<InviteResult>> {
  const parsed = inviteInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const { orgId, emails, roleToGrant } = parsed.data;

  const results = await Promise.all(
    emails.map(async (email): Promise<{ email: string; error: ApiError | null }> => {
      try {
        await createInvitation(orgId, {
          type: "PERSONAL",
          identifier: email,
          identifierType: "EMAIL",
          roleToGrant,
        });
        return { email, error: null };
      } catch (error) {
        if (error instanceof ApiError) return { email, error };
        throw error;
      }
    }),
  );

  // Si la sesión murió, fallaron todos por lo mismo: no tiene sentido listar 50
  // errores idénticos. Fuera del try/catch de arriba porque `redirect` lanza.
  if (results.some((r) => isSessionExpired(r.error))) {
    redirect("/login?expired=1");
  }

  revalidatePath(`/org/${orgId}/users`);
  return {
    ok: true,
    data: {
      sent: results.filter((r) => !r.error).map((r) => r.email),
      failed: results
        .filter((r) => r.error)
        .map((r) => ({ email: r.email, error: r.error!.message })),
    },
  };
}

export async function resendInvitationAction(
  orgId: string,
  invitationId: string,
): Promise<ActionResult> {
  try {
    await resendInvitation(orgId, invitationId);
    revalidatePath(`/org/${orgId}/users`);
    return { ok: true };
  } catch (error) {
    return toActionError(error);
  }
}

export async function revokeInvitationAction(
  orgId: string,
  invitationId: string,
): Promise<ActionResult> {
  try {
    await revokeInvitation(orgId, invitationId);
    revalidatePath(`/org/${orgId}/users`);
    return { ok: true };
  } catch (error) {
    return toActionError(error);
  }
}

export async function revokeMemberAction(
  orgId: string,
  membershipId: string,
): Promise<ActionResult> {
  try {
    await revokeMembership(orgId, membershipId);
    revalidatePath(`/org/${orgId}/users`);
    return { ok: true };
  } catch (error) {
    return toActionError(error);
  }
}

export async function reactivateMemberAction(
  orgId: string,
  membershipId: string,
): Promise<ActionResult> {
  try {
    await updateMembership(orgId, membershipId, { status: "ACTIVE" });
    revalidatePath(`/org/${orgId}/users`);
    return { ok: true };
  } catch (error) {
    return toActionError(error);
  }
}

// ---------------------------------------------------------------------------
// Configuración
// ---------------------------------------------------------------------------

const renameInputSchema = z.object({
  orgId: orgIdSchema,
  name: z.string().min(2, "Mínimo 2 caracteres").max(255),
});

export async function renameOrganizationAction(
  input: z.infer<typeof renameInputSchema>,
): Promise<ActionResult> {
  const parsed = renameInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  try {
    await updateOrganization(parsed.data.orgId, { name: parsed.data.name });
    revalidatePath(`/org/${parsed.data.orgId}`, "layout");
    return { ok: true };
  } catch (error) {
    return toActionError(error);
  }
}

// ---------------------------------------------------------------------------
// Partner: empresas hijas y licencias
// ---------------------------------------------------------------------------

const createChildInputSchema = createOrganizationInputSchema
  .omit({ type: true })
  .extend({ parentOrgId: orgIdSchema });

export async function createChildAction(
  input: z.infer<typeof createChildInputSchema>,
): Promise<ActionResult> {
  const parsed = createChildInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const { parentOrgId, ...body } = parsed.data;
  try {
    await createChild(parentOrgId, body);
    revalidatePath(`/org/${parentOrgId}`, "layout");
    return { ok: true };
  } catch (error) {
    return toActionError(error);
  }
}

const allocateSeatsInputSchema = createSeatGrantInputSchema.extend({
  parentOrgId: orgIdSchema,
  childOrgId: orgIdSchema,
});

/** Concede accesos a una hija (descuenta de la bolsa del partner). */
export async function allocateSeatsAction(
  input: z.infer<typeof allocateSeatsInputSchema>,
): Promise<ActionResult> {
  const parsed = allocateSeatsInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const { parentOrgId, childOrgId, ...body } = parsed.data;
  try {
    await createSeatGrant(childOrgId, body);
    revalidatePath(`/org/${parentOrgId}`, "layout");
    return { ok: true };
  } catch (error) {
    return toActionError(error);
  }
}
