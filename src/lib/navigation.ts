/**
 * Navegación por modo de contexto (client-safe, sin `server-only`).
 * Réplica de `NAV` del mockup recortada a lo conectable en fase 1
 * (ver docs/frontend-phase1-map.md): sin métricas, programas, facturación,
 * equipos/sedes ni perfil Manager.
 */

export type DashboardMode = "company" | "peoplebasic" | "portfolio";

/** Contexto serializable que recibe el sidebar (client component). */
export interface SidebarOrgContext {
  id: string;
  name: string;
  type: "TENANT" | "PARTNER" | "COMPANY";
  role: string;
  mode: DashboardMode;
  hasEnterprise: boolean;
}

export type NavIcon =
  | "overview"
  | "users"
  | "settings"
  | "sparkles"
  | "building"
  | "licenses"
  | "shield"
  | "clients";

export interface NavItem {
  title: string;
  href: string;
  icon: NavIcon;
  /** Coincidencia exacta (Overview) o por prefijo (subrutas). */
  exact?: boolean;
}

export function orgNav(orgId: string, mode: DashboardMode): NavItem[] {
  const base = `/org/${orgId}`;
  switch (mode) {
    case "company":
      return [
        { title: "Overview", href: base, icon: "overview", exact: true },
        { title: "Usuarios", href: `${base}/users`, icon: "users" },
        { title: "Configuración", href: `${base}/settings`, icon: "settings" },
      ];
    case "peoplebasic":
      return [
        { title: "Overview", href: base, icon: "overview", exact: true },
        { title: "Usuarios", href: `${base}/users`, icon: "users" },
        {
          title: "Añadir Enterprise",
          href: `${base}/enterprise`,
          icon: "sparkles",
        },
      ];
    case "portfolio":
      return [
        { title: "Overview", href: base, icon: "overview", exact: true },
        { title: "Empresas", href: `${base}/companies`, icon: "building" },
        {
          title: "Licencias y accesos",
          href: `${base}/licenses`,
          icon: "licenses",
        },
        { title: "Configuración", href: `${base}/settings`, icon: "settings" },
      ];
  }
}

export const ADMIN_NAV: NavItem[] = [
  { title: "Overview", href: "/admin", icon: "overview", exact: true },
  { title: "Clientes", href: "/admin/clients", icon: "clients" },
  { title: "Partners", href: "/admin/partners", icon: "shield" },
];

export function modeKicker(mode: DashboardMode): string {
  switch (mode) {
    case "company":
      return "Empresa · Enterprise";
    case "peoplebasic":
      return "Empresa · solo People";
    case "portfolio":
      return "Partner";
  }
}

export function navGroupLabel(mode: DashboardMode): string {
  switch (mode) {
    case "company":
      return "Empresa";
    case "peoplebasic":
      return "Consola People";
    case "portfolio":
      return "Portfolio";
  }
}

export function roleLabel(role: string): string {
  switch (role) {
    case "COMPANY_OWNER":
      return "Company Owner";
    case "HR_ADMIN":
      return "HR Admin";
    case "MEMBER":
      return "Miembro";
    default:
      return role;
  }
}
