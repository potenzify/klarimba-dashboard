import "server-only";
import { z } from "zod";
import { apiFetch } from "@/lib/api/http";
import {
  invitationSchema,
  membershipSchema,
  organizationEntitlementSchema,
  organizationSchema,
  organizationSummarySchema,
  organizationUserSchema,
  seatGrantSchema,
  type CreateInvitationInput,
  type CreateOrganizationInput,
  type CreateSeatGrantInput,
  type Invitation,
  type Membership,
  type Organization,
  type OrganizationEntitlement,
  type OrganizationSummary,
  type OrganizationUser,
  type OrganizationUserStatus,
  type SeatGrant,
  type UpdateMembershipInput,
  type UpdateOrganizationInput,
} from "@/lib/api/schemas";

export type PageQuery = {
  limit?: number;
  offset?: number;
};

// --- Membresías del usuario autenticado -----------------------------------

export async function getMyOrganizations(): Promise<Membership[]> {
  return apiFetch("/me/organizations", { schema: z.array(membershipSchema) });
}

// --- Organización (scope propio o padre) -----------------------------------

export async function getOrganizationSummary(
  orgId: string,
): Promise<OrganizationSummary> {
  return apiFetch(`/organizations/${orgId}`, {
    schema: organizationSummarySchema,
  });
}

export async function getOrganizationEntitlements(
  orgId: string,
): Promise<OrganizationEntitlement[]> {
  return apiFetch(`/organizations/${orgId}/entitlements`, {
    schema: z.array(organizationEntitlementSchema),
  });
}

/**
 * PATCH de la propia organización. Hoy el API solo expone este PATCH en
 * backoffice (gap conocido); si devuelve 404, la vista lo comunica.
 */
export async function updateOrganization(
  orgId: string,
  input: UpdateOrganizationInput,
): Promise<Organization> {
  return apiFetch(`/organizations/${orgId}`, {
    method: "PATCH",
    body: input,
    schema: organizationSchema,
  });
}

// --- Usuarios y membresías --------------------------------------------------

export async function listOrganizationUsers(
  orgId: string,
  params: { status?: OrganizationUserStatus } & PageQuery = {},
): Promise<OrganizationUser[]> {
  return apiFetch(`/organizations/${orgId}/users`, {
    query: params,
    schema: z.array(organizationUserSchema),
  });
}

export async function updateMembership(
  orgId: string,
  membershipId: string,
  input: UpdateMembershipInput,
): Promise<Membership> {
  return apiFetch(`/organizations/${orgId}/members/${membershipId}`, {
    method: "PATCH",
    body: input,
    schema: membershipSchema,
  });
}

export async function revokeMembership(
  orgId: string,
  membershipId: string,
): Promise<Membership> {
  return apiFetch(`/organizations/${orgId}/members/${membershipId}`, {
    method: "DELETE",
    schema: membershipSchema,
  });
}

// --- Invitaciones ------------------------------------------------------------

export async function createInvitation(
  orgId: string,
  input: CreateInvitationInput,
): Promise<Invitation> {
  return apiFetch(`/organizations/${orgId}/invitations`, {
    method: "POST",
    body: input,
    schema: invitationSchema,
  });
}

export async function resendInvitation(
  orgId: string,
  invitationId: string,
): Promise<Invitation> {
  return apiFetch(
    `/organizations/${orgId}/invitations/${invitationId}/resend`,
    { method: "POST", schema: invitationSchema },
  );
}

export async function revokeInvitation(
  orgId: string,
  invitationId: string,
): Promise<Invitation> {
  return apiFetch(`/organizations/${orgId}/invitations/${invitationId}`, {
    method: "DELETE",
    schema: invitationSchema,
  });
}

// --- Partner: hijas y licencias ----------------------------------------------

export async function listChildren(orgId: string): Promise<Organization[]> {
  return apiFetch(`/organizations/${orgId}/children`, {
    schema: z.array(organizationSchema),
  });
}

export async function createChild(
  orgId: string,
  input: Omit<CreateOrganizationInput, "type">,
): Promise<Organization> {
  return apiFetch(`/organizations/${orgId}/children`, {
    method: "POST",
    body: input,
    schema: organizationSchema,
  });
}

/** Concede accesos a una hija; descuenta de la bolsa del padre. */
export async function createSeatGrant(
  orgId: string,
  input: CreateSeatGrantInput,
): Promise<SeatGrant> {
  return apiFetch(`/organizations/${orgId}/seat-grants`, {
    method: "POST",
    body: input,
    schema: seatGrantSchema,
  });
}
