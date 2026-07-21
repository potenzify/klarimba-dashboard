import type { OrganizationRole } from "@/lib/api/schemas";

/**
 * Réplica de la matriz de permisos del API
 * (`organization-permission.service.ts`). El backend es la autoridad final:
 * esto solo decide qué mostrar/ocultar en la UI.
 *
 * `scope`:
 * - `own`    → membresía en la organización objetivo
 * - `parent` → membresía en la organización padre, actuando sobre una hija
 */
export type PermissionScope = "own" | "parent";

export type OrganizationPermission =
  | "VIEW_SUMMARY"
  | "MANAGE_ORGANIZATION"
  | "MANAGE_CHILDREN"
  | "ALLOCATE_SEATS"
  | "MANAGE_INVITATIONS"
  | "MANAGE_MEMBERS"
  | "VIEW_AUDIT_LOG"
  | "VIEW_ENTITLEMENTS";

const MATRIX: Record<
  OrganizationPermission,
  Record<PermissionScope, OrganizationRole[]>
> = {
  VIEW_SUMMARY: {
    own: ["COMPANY_OWNER", "HR_ADMIN"],
    parent: ["COMPANY_OWNER", "HR_ADMIN"],
  },
  MANAGE_ORGANIZATION: { own: ["COMPANY_OWNER"], parent: [] },
  MANAGE_CHILDREN: { own: ["COMPANY_OWNER"], parent: ["COMPANY_OWNER"] },
  ALLOCATE_SEATS: { own: ["COMPANY_OWNER"], parent: ["COMPANY_OWNER"] },
  MANAGE_INVITATIONS: { own: ["COMPANY_OWNER", "HR_ADMIN"], parent: [] },
  MANAGE_MEMBERS: { own: ["COMPANY_OWNER", "HR_ADMIN"], parent: [] },
  VIEW_AUDIT_LOG: { own: ["COMPANY_OWNER", "HR_ADMIN"], parent: [] },
  VIEW_ENTITLEMENTS: {
    own: ["COMPANY_OWNER", "HR_ADMIN"],
    parent: ["COMPANY_OWNER", "HR_ADMIN"],
  },
};

export function can(
  role: OrganizationRole,
  permission: OrganizationPermission,
  scope: PermissionScope = "own",
): boolean {
  return MATRIX[permission][scope].includes(role);
}
