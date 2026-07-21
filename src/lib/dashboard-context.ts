import "server-only";
import { notFound } from "next/navigation";
import { cache } from "react";
import { getAuthMe } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/http";
import {
  getMyOrganizations,
  getOrganizationEntitlements,
} from "@/lib/api/organizations";
import type { Organization, OrganizationRole } from "@/lib/api/schemas";
import type { DashboardMode, SidebarOrgContext } from "@/lib/navigation";

/**
 * Resolución del "modo" del dashboard con datos reales — equivalente a
 * `currentMode()` del mockup:
 *
 * - `portfolio`    → la org es PARTNER (eje ARL)
 * - `company`      → TENANT con add-on ENTERPRISE activo
 * - `peoplebasic`  → TENANT sin ENTERPRISE (consola People básica)
 * - Super Admin    → consola de plataforma (`/admin`), leída de
 *   `platformRole` en /auth/me.
 *
 * El perfil Manager (rol MEMBER) queda oculto en fase 1.
 */
export type { DashboardMode };

export interface OrgContext {
  org: Organization;
  role: OrganizationRole;
  mode: DashboardMode;
  hasEnterprise: boolean;
}

export interface DashboardContexts {
  orgs: OrgContext[];
  superAdmin: boolean;
}

async function resolveOrgContext(
  org: Organization,
  role: OrganizationRole,
): Promise<OrgContext> {
  let hasEnterprise = false;
  try {
    const entitlements = await getOrganizationEntitlements(org.id);
    hasEnterprise = entitlements.some(
      (e) => e.product === "ENTERPRISE" && e.status === "ACTIVE",
    );
  } catch (error) {
    // Sin permiso VIEW_ENTITLEMENTS u otro fallo no bloqueante → People básico.
    if (!(error instanceof ApiError)) throw error;
  }
  const mode: DashboardMode =
    org.type === "PARTNER"
      ? "portfolio"
      : hasEnterprise
        ? "company"
        : "peoplebasic";
  return { org, role, mode, hasEnterprise };
}

/**
 * Contextos del usuario para el switcher. Cacheado por request para que
 * layout y páginas compartan la misma resolución.
 */
export const getDashboardContexts = cache(
  async (): Promise<DashboardContexts> => {
    const [memberships, me] = await Promise.all([
      getMyOrganizations(),
      getAuthMe(),
    ]);
    const superAdmin = me.platformRole === "SUPER_ADMIN";

    const adminMemberships = memberships.filter(
      (m) =>
        m.status === "ACTIVE" &&
        m.role !== "MEMBER" &&
        m.organization != null,
    );

    const orgs = await Promise.all(
      adminMemberships.map((m) => resolveOrgContext(m.organization!, m.role)),
    );

    return { orgs, superAdmin };
  },
);

export function findOrgContext(
  contexts: DashboardContexts,
  orgId: string,
): OrgContext | undefined {
  return contexts.orgs.find((c) => c.org.id === orgId);
}

/** Contexto de org o 404. Con `modes` restringe la vista a esos modos. */
export async function requireOrgContext(
  orgId: string,
  modes?: DashboardMode[],
): Promise<OrgContext> {
  const contexts = await getDashboardContexts();
  const context = findOrgContext(contexts, orgId);
  if (!context || (modes && !modes.includes(context.mode))) {
    notFound();
  }
  return context;
}

export function toSidebarContexts(
  contexts: DashboardContexts,
): SidebarOrgContext[] {
  return contexts.orgs.map((c) => ({
    id: c.org.id,
    name: c.org.name,
    type: c.org.type,
    role: c.role,
    mode: c.mode,
    hasEnterprise: c.hasEnterprise,
  }));
}
