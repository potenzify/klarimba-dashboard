import { z } from "zod";

/**
 * Schemas del API B2B de Klarimba.
 *
 * Convenciones del API:
 * - Toda respuesta viene envuelta en `{ data, pagination, metadata }`.
 * - Las fechas pueden llegar como ISO string o unix timestamp (number).
 */

export const apiDate = z.union([z.string(), z.number()]);
export const apiDateNullable = apiDate.nullable();

const baseEntity = z.object({
  id: z.string(),
  createdAt: apiDate,
  updatedAt: apiDate,
  deletedAt: apiDateNullable.optional(),
});

/**
 * `pagination` del envelope en los listados B2B (`{ total, limit, offset }`).
 * El API la puebla desde 2026-07; los clientes la tratan como opcional para
 * tolerar un API sin desplegar.
 */
export const pagePaginationSchema = z.object({
  total: z.number().int().nonnegative(),
  limit: z.number().int().positive(),
  offset: z.number().int().nonnegative(),
});
export type PagePagination = z.infer<typeof pagePaginationSchema>;

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const organizationTypeSchema = z.enum(["TENANT", "PARTNER", "COMPANY"]);
export type OrganizationType = z.infer<typeof organizationTypeSchema>;

export const organizationStatusSchema = z.enum([
  "ACTIVE",
  "SUSPENDED",
  "ARCHIVED",
]);
export type OrganizationStatus = z.infer<typeof organizationStatusSchema>;

export const organizationRoleSchema = z.enum([
  "COMPANY_OWNER",
  "HR_ADMIN",
  "MEMBER",
]);
export type OrganizationRole = z.infer<typeof organizationRoleSchema>;

export const membershipStatusSchema = z.enum([
  "ACTIVE",
  "SUSPENDED",
  "REVOKED",
]);
export type MembershipStatus = z.infer<typeof membershipStatusSchema>;

export const organizationUserStatusSchema = z.enum([
  "INVITED",
  "ACTIVE",
  "SUSPENDED",
  "REVOKED",
]);
export type OrganizationUserStatus = z.infer<
  typeof organizationUserStatusSchema
>;

export const invitationTypeSchema = z.enum(["SHARED_CODE", "PERSONAL"]);
export const invitationStatusSchema = z.enum([
  "ACTIVE",
  "REVOKED",
  "EXPIRED",
  "EXHAUSTED",
]);
export const identifierTypeSchema = z.enum(["EMAIL", "PHONE"]);

export const seatGrantStatusSchema = z.enum([
  "ACTIVE",
  "SUSPENDED",
  "EXPIRED",
  "REVOKED",
]);
export type SeatGrantStatus = z.infer<typeof seatGrantStatusSchema>;

export const entitlementProductSchema = z.enum(["ENTERPRISE"]);
export const entitlementStatusSchema = z.enum(["ACTIVE", "REVOKED"]);

export const auditEventTypeSchema = z.enum([
  "ORGANIZATION_CREATED",
  "ORGANIZATION_UPDATED",
  "SEAT_GRANT_CREATED",
  "SEAT_GRANT_UPDATED",
  "SEAT_GRANT_REVOKED",
  "SEAT_GRANT_EXPIRED",
  "SEATS_ALLOCATED_TO_CHILD",
  "INVITATION_CREATED",
  "INVITATION_RESENT",
  "INVITATION_REVOKED",
  "INVITATION_REDEEMED",
  "INVITATION_EXPIRED",
  "ENTITLEMENT_GRANTED",
  "ENTITLEMENT_REVOKED",
  "MEMBERSHIP_CREATED",
  "MEMBERSHIP_UPDATED",
  "MEMBERSHIP_SUSPENDED",
  "MEMBERSHIP_REVOKED",
]);
export type AuditEventType = z.infer<typeof auditEventTypeSchema>;

// ---------------------------------------------------------------------------
// Entidades
// ---------------------------------------------------------------------------

export const organizationSchema = baseEntity.extend({
  name: z.string(),
  slug: z.string(),
  type: organizationTypeSchema,
  status: organizationStatusSchema,
  parentId: z.string().nullable(),
});
export type Organization = z.infer<typeof organizationSchema>;

export const seatUsageSchema = z.object({
  totalSeats: z.number(),
  consumedSeats: z.number(),
  allocatedToChildren: z.number(),
  availableSeats: z.number(),
});
export type SeatUsage = z.infer<typeof seatUsageSchema>;

export const organizationSummarySchema = z.object({
  organization: organizationSchema,
  seatUsage: seatUsageSchema,
});
export type OrganizationSummary = z.infer<typeof organizationSummarySchema>;

export const seatGrantSchema = baseEntity.extend({
  totalSeats: z.number(),
  validFrom: apiDate,
  validUntil: apiDateNullable,
  status: seatGrantStatusSchema,
  notes: z.string().nullable(),
  organizationId: z.string(),
  grantorOrganizationId: z.string().nullable(),
});
export type SeatGrant = z.infer<typeof seatGrantSchema>;

export const invitationSchema = baseEntity.extend({
  type: invitationTypeSchema,
  code: z.string(),
  identifier: z.string().nullable(),
  identifierType: identifierTypeSchema.nullable(),
  maxRedemptions: z.number().nullable(),
  redemptionsCount: z.number(),
  expiresAt: apiDateNullable,
  status: invitationStatusSchema,
  roleToGrant: organizationRoleSchema,
  organizationId: z.string(),
});
export type Invitation = z.infer<typeof invitationSchema>;

export const memberUserSchema = z.object({
  id: z.string(),
  email: z.string().nullable(),
  firstName: z.string(),
  lastName: z.string(),
});
export type MemberUser = z.infer<typeof memberUserSchema>;

export const membershipSchema = baseEntity.extend({
  role: organizationRoleSchema,
  status: membershipStatusSchema,
  joinedAt: apiDate,
  revokedAt: apiDateNullable.optional(),
  user: memberUserSchema.optional().nullable(),
  organization: organizationSchema.optional().nullable(),
  invitationId: z.string().nullable().optional(),
});
export type Membership = z.infer<typeof membershipSchema>;

/** Vista consolidada de `GET /organizations/:orgId/users` (miembros + invitados). */
export const organizationUserSchema = z.object({
  id: z.string(),
  status: organizationUserStatusSchema,
  role: organizationRoleSchema,
  identifier: z.string().nullable(),
  user: memberUserSchema.nullable(),
  membershipId: z.string().nullable(),
  invitationId: z.string().nullable(),
  /**
   * Código de la invitación pendiente; solo en filas con estado INVITED.
   * `nullish` a propósito: es un campo accesorio y añadido después, así que un
   * API sin desplegar debe degradar la columna, no tumbar la página entera.
   */
  invitationCode: z.string().nullish(),
  joinedAt: apiDateNullable.optional(),
  invitedAt: apiDateNullable.optional(),
});
export type OrganizationUser = z.infer<typeof organizationUserSchema>;

export const organizationEntitlementSchema = baseEntity.extend({
  product: entitlementProductSchema,
  status: entitlementStatusSchema,
  validFrom: apiDate,
  validUntil: apiDateNullable,
  organizationId: z.string(),
});
export type OrganizationEntitlement = z.infer<
  typeof organizationEntitlementSchema
>;

export const auditLogSchema = z.object({
  id: z.string(),
  eventType: auditEventTypeSchema,
  createdAt: apiDate,
  actorUserId: z.string().nullable(),
  subjectUserId: z.string().nullable(),
  invitationId: z.string().nullable(),
  seatGrantId: z.string().nullable(),
  membershipId: z.string().nullable(),
  metadata: z.record(z.string(), z.unknown()).nullable(),
});
export type AuditLog = z.infer<typeof auditLogSchema>;

export const authTokensSchema = z.object({
  accessToken: z.string(),
  refreshAccessToken: z.string(),
});
export type AuthTokens = z.infer<typeof authTokensSchema>;

export const authMeSchema = z
  .object({
    id: z.string(),
    email: z.string().nullable().optional(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    /** Rol de plataforma (backoffice). `SUPER_ADMIN` o null/ausente. */
    platformRole: z.string().nullable().optional(),
  })
  .passthrough();
export type AuthMe = z.infer<typeof authMeSchema>;

/** Respuesta cruda de `POST /backoffice/organizations/:orgId/admins`. */
export const bootstrapAdminResultSchema = z
  .object({
    membership: z.unknown().optional(),
    invitation: z.unknown().optional(),
  })
  .passthrough();
export type BootstrapAdminResult = z.infer<typeof bootstrapAdminResultSchema>;

// ---------------------------------------------------------------------------
// Inputs (request DTOs) — se validan también en el cliente con RHF
// ---------------------------------------------------------------------------

export const loginInputSchema = z.object({
  email: z
    .string()
    .min(3, "Mínimo 3 caracteres")
    .max(255, "Máximo 255 caracteres"),
  password: z
    .string()
    .min(6, "Mínimo 6 caracteres")
    .max(20, "Máximo 20 caracteres"),
});
export type LoginInput = z.infer<typeof loginInputSchema>;

export const orgSlugSchema = z
  .string()
  .min(2, "Mínimo 2 caracteres")
  .max(100, "Máximo 100 caracteres")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Solo minúsculas, números y guiones (ej. acme-co)",
  );

export const createOrganizationInputSchema = z.object({
  name: z.string().min(2, "Mínimo 2 caracteres").max(255),
  slug: orgSlugSchema,
  type: z.enum(["TENANT", "PARTNER"]).optional(),
});
export type CreateOrganizationInput = z.infer<
  typeof createOrganizationInputSchema
>;

export const updateOrganizationInputSchema = z.object({
  name: z.string().min(2, "Mínimo 2 caracteres").max(255).optional(),
  status: organizationStatusSchema.optional(),
});
export type UpdateOrganizationInput = z.infer<
  typeof updateOrganizationInputSchema
>;

export const createSeatGrantInputSchema = z.object({
  totalSeats: z.coerce
    .number()
    .int("Debe ser un número entero")
    .min(1, "Mínimo 1 acceso"),
  validFrom: z.string().optional(),
  validUntil: z.string().optional(),
  notes: z.string().max(1000).optional(),
});
export type CreateSeatGrantInput = z.infer<typeof createSeatGrantInputSchema>;

export const createInvitationInputSchema = z.object({
  type: invitationTypeSchema,
  code: z
    .string()
    .regex(/^[A-Z0-9_-]{4,32}$/, "4–32 caracteres: A-Z, 0-9, guiones")
    .optional(),
  maxRedemptions: z.coerce.number().int().min(1).optional(),
  identifier: z.string().optional(),
  identifierType: identifierTypeSchema.optional(),
  expiresAt: z.string().optional(),
  roleToGrant: organizationRoleSchema.optional(),
});
export type CreateInvitationInput = z.infer<typeof createInvitationInputSchema>;

export const bootstrapAdminInputSchema = z.object({
  identifier: z.string().min(3, "Requerido"),
  identifierType: identifierTypeSchema,
  role: z.enum(["COMPANY_OWNER", "HR_ADMIN"]).optional(),
});
export type BootstrapAdminInput = z.infer<typeof bootstrapAdminInputSchema>;

export const grantEntitlementInputSchema = z.object({
  product: entitlementProductSchema,
  validUntil: z.string().optional(),
});
export type GrantEntitlementInput = z.infer<typeof grantEntitlementInputSchema>;

export const updateMembershipInputSchema = z.object({
  role: organizationRoleSchema.optional(),
  status: z.enum(["ACTIVE", "SUSPENDED"]).optional(),
});
export type UpdateMembershipInput = z.infer<typeof updateMembershipInputSchema>;
