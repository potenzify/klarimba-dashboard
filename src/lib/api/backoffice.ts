import "server-only";
import { z } from "zod";
import { apiFetch, apiFetchPage, type Page } from "@/lib/api/http";
import {
  auditLogSchema,
  bootstrapAdminResultSchema,
  organizationEntitlementSchema,
  organizationSchema,
  organizationSummarySchema,
  seatGrantSchema,
  type AuditLog,
  type BootstrapAdminInput,
  type BootstrapAdminResult,
  type CreateOrganizationInput,
  type CreateSeatGrantInput,
  type GrantEntitlementInput,
  type Organization,
  type OrganizationEntitlement,
  type OrganizationStatus,
  type OrganizationSummary,
  type OrganizationType,
  type SeatGrant,
  type UpdateOrganizationInput,
} from "@/lib/api/schemas";
import type { PageQuery } from "@/lib/api/organizations";

// Endpoints de backoffice (`@PlatformRoleProtected(SUPER_ADMIN)`).
// La detección de Super Admin se lee de `platformRole` en /auth/me
// (ver dashboard-context.ts); ya no se sondea el backoffice.

export async function listBackofficeOrganizations(
  params: {
    type?: OrganizationType;
    status?: OrganizationStatus;
  } & PageQuery = {},
): Promise<Page<Organization>> {
  return apiFetchPage("/backoffice/organizations", {
    query: params,
    schema: z.array(organizationSchema),
  });
}

/**
 * Total de organizaciones (con filtros) sin traer filas: `limit=1` +
 * `pagination.total`. Alimenta los KPIs del overview sin depender de traer
 * el listado completo (que se trunca a 100).
 */
export async function countBackofficeOrganizations(params: {
  type?: OrganizationType;
  status?: OrganizationStatus;
} = {}): Promise<number | null> {
  const { pagination } = await listBackofficeOrganizations({
    ...params,
    limit: 1,
  });
  return pagination?.total ?? null;
}

export async function getBackofficeOrganization(
  orgId: string,
): Promise<OrganizationSummary> {
  return apiFetch(`/backoffice/organizations/${orgId}`, {
    schema: organizationSummarySchema,
  });
}

export async function createBackofficeOrganization(
  input: CreateOrganizationInput,
): Promise<Organization> {
  return apiFetch("/backoffice/organizations", {
    method: "POST",
    body: input,
    schema: organizationSchema,
  });
}

export async function updateBackofficeOrganization(
  orgId: string,
  input: UpdateOrganizationInput,
): Promise<Organization> {
  return apiFetch(`/backoffice/organizations/${orgId}`, {
    method: "PATCH",
    body: input,
    schema: organizationSchema,
  });
}

// --- Seat grants -------------------------------------------------------------

export async function listBackofficeSeatGrants(
  orgId: string,
  params: PageQuery = {},
): Promise<SeatGrant[]> {
  return apiFetch(`/backoffice/organizations/${orgId}/seat-grants`, {
    query: params,
    schema: z.array(seatGrantSchema),
  });
}

export async function createBackofficeSeatGrant(
  orgId: string,
  input: CreateSeatGrantInput,
): Promise<SeatGrant> {
  return apiFetch(`/backoffice/organizations/${orgId}/seat-grants`, {
    method: "POST",
    body: input,
    schema: seatGrantSchema,
  });
}

export async function revokeBackofficeSeatGrant(
  orgId: string,
  grantId: string,
): Promise<SeatGrant> {
  return apiFetch(
    `/backoffice/organizations/${orgId}/seat-grants/${grantId}`,
    { method: "DELETE", schema: seatGrantSchema },
  );
}

// --- Admin bootstrap / entitlements / auditoría -------------------------------

export async function bootstrapOrgAdmin(
  orgId: string,
  input: BootstrapAdminInput,
): Promise<BootstrapAdminResult> {
  return apiFetch(`/backoffice/organizations/${orgId}/admins`, {
    method: "POST",
    body: input,
    schema: bootstrapAdminResultSchema,
  });
}

export async function listBackofficeAuditLog(
  orgId: string,
  params: PageQuery = {},
): Promise<AuditLog[]> {
  return apiFetch(`/backoffice/organizations/${orgId}/audit-log`, {
    query: params,
    schema: z.array(auditLogSchema),
  });
}

export async function grantEntitlement(
  orgId: string,
  input: GrantEntitlementInput,
): Promise<OrganizationEntitlement> {
  return apiFetch(`/backoffice/organizations/${orgId}/entitlements`, {
    method: "POST",
    body: input,
    schema: organizationEntitlementSchema,
  });
}

export async function revokeEntitlement(
  orgId: string,
  entitlementId: string,
): Promise<OrganizationEntitlement> {
  return apiFetch(
    `/backoffice/organizations/${orgId}/entitlements/${entitlementId}`,
    { method: "DELETE", schema: organizationEntitlementSchema },
  );
}
