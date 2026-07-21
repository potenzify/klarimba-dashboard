"use client";

import {
  Building2,
  Check,
  ChevronsUpDown,
  CreditCard,
  LayoutGrid,
  Loader2,
  LogOut,
  Settings,
  Shield,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTransition, type ComponentType } from "react";
import { KlarimbaLogo } from "@/components/brand/logo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ADMIN_NAV,
  modeKicker,
  navGroupLabel,
  orgNav,
  roleLabel,
  type NavIcon,
  type NavItem,
  type SidebarOrgContext,
} from "@/lib/navigation";
import { cn } from "@/lib/utils";

const NAV_ICONS: Record<NavIcon, ComponentType<{ className?: string }>> = {
  overview: LayoutGrid,
  users: Users,
  settings: Settings,
  sparkles: Sparkles,
  building: Building2,
  licenses: CreditCard,
  shield: Shield,
  clients: Building2,
};

interface AppSidebarProps {
  orgs: SidebarOrgContext[];
  superAdmin: boolean;
  user: { name: string; email: string };
  logout: () => Promise<void>;
}

function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "?"
  );
}

export function AppSidebar({ orgs, superAdmin, user, logout }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, startLogout] = useTransition();

  const isAdminArea = pathname.startsWith("/admin");
  const activeOrg = !isAdminArea
    ? orgs.find((org) => pathname.startsWith(`/org/${org.id}`))
    : undefined;

  const navItems: NavItem[] = isAdminArea
    ? ADMIN_NAV
    : activeOrg
      ? orgNav(activeOrg.id, activeOrg.mode)
      : [];

  const groupLabel = isAdminArea
    ? "Administración Klarimba"
    : activeOrg
      ? navGroupLabel(activeOrg.mode)
      : null;

  return (
    <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col gap-1 overflow-y-auto border-r bg-sidebar px-4 py-5 max-md:w-[74px] max-md:px-3">
      <div className="flex items-center gap-3 px-2 pb-5">
        <KlarimbaLogo />
        <div className="max-md:hidden">
          <div className="text-[15px] font-bold tracking-tight">Klarimba</div>
          <div className="-mt-0.5 text-[11px] font-medium text-muted-foreground">
            Enterprise
          </div>
        </div>
      </div>

      {/* Context switcher */}
      {(orgs.length > 0 || superAdmin) && (
        <DropdownMenu>
          <DropdownMenuTrigger className="mb-2 flex w-full items-center gap-2.5 rounded-xl border bg-card p-2 text-left transition-colors hover:border-brand-mid hover:bg-secondary focus-visible:outline-2 focus-visible:outline-ring">
            <ContextMark
              label={isAdminArea ? "KA" : initials(activeOrg?.name ?? "?")}
              variant={isAdminArea ? "admin" : "org"}
            />
            <span className="min-w-0 flex-1 max-md:hidden">
              <span className="block text-[9.5px] font-bold tracking-wider text-muted-foreground uppercase">
                {isAdminArea
                  ? "Interno · Plataforma"
                  : activeOrg
                    ? modeKicker(activeOrg.mode)
                    : "Sin contexto"}
              </span>
              <span className="block truncate text-[13px] font-bold leading-tight">
                {isAdminArea ? "Klarimba Admin" : (activeOrg?.name ?? "—")}
              </span>
            </span>
            <ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground max-md:hidden" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-60">
            {orgs.length > 0 && (
              <DropdownMenuLabel className="text-[10px] font-bold tracking-wider uppercase text-muted-foreground">
                Tus organizaciones
              </DropdownMenuLabel>
            )}
            {orgs.map((org) => (
              <DropdownMenuItem
                key={org.id}
                onSelect={() => router.push(`/org/${org.id}`)}
                className="gap-2.5"
              >
                <ContextMark label={initials(org.name)} variant="org" small />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12.5px] font-semibold">
                    {org.name}
                  </span>
                  <span className="block text-[10.5px] text-muted-foreground">
                    {modeKicker(org.mode)}
                  </span>
                </span>
                {activeOrg?.id === org.id && (
                  <Check className="size-4 text-primary" />
                )}
              </DropdownMenuItem>
            ))}
            {superAdmin && (
              <>
                {orgs.length > 0 && <DropdownMenuSeparator />}
                <DropdownMenuLabel className="text-[10px] font-bold tracking-wider uppercase text-muted-foreground">
                  Plataforma
                </DropdownMenuLabel>
                <DropdownMenuItem
                  onSelect={() => router.push("/admin")}
                  className="gap-2.5"
                >
                  <ContextMark label="KA" variant="admin" small />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[12.5px] font-semibold">
                      Klarimba Admin
                    </span>
                    <span className="block text-[10.5px] text-muted-foreground">
                      Backoffice · Super Admin
                    </span>
                  </span>
                  {isAdminArea && <Check className="size-4 text-primary" />}
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Navegación del contexto */}
      {groupLabel && (
        <div className="px-2.5 pt-3 pb-1.5 text-[10.5px] font-bold tracking-wider text-muted-foreground uppercase max-md:hidden">
          {groupLabel}
        </div>
      )}
      <nav className="flex flex-col gap-1" aria-label="Principal">
        {navItems.map((item) => {
          const Icon = NAV_ICONS[item.icon];
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13.5px] font-medium transition-colors max-md:justify-center",
                isActive
                  ? "bg-primary text-primary-foreground shadow-[0_4px_12px_rgba(107,63,160,0.25)]"
                  : "text-sidebar-foreground hover:bg-secondary hover:text-secondary-foreground",
              )}
            >
              <Icon
                className={cn(
                  "size-[17px] shrink-0",
                  isActive ? "text-primary-foreground" : "text-muted-foreground",
                )}
              />
              <span className="max-md:hidden">{item.title}</span>
            </Link>
          );
        })}
      </nav>

      {/* Usuario + logout */}
      <div className="mt-auto border-t pt-4">
        <div className="flex items-center gap-2.5 rounded-xl bg-secondary p-2.5 max-md:justify-center">
          <Avatar className="size-8">
            <AvatarFallback className="bg-gradient-to-br from-brand-mid to-primary text-xs font-bold text-primary-foreground">
              {initials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 max-md:hidden">
            <div className="truncate text-[12.5px] font-semibold">
              {user.name}
            </div>
            <div className="truncate text-[11px] text-muted-foreground">
              {activeOrg ? roleLabel(activeOrg.role) : user.email}
            </div>
          </div>
          <button
            type="button"
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
            disabled={isLoggingOut}
            onClick={() => startLogout(async () => logout())}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-card hover:text-destructive max-md:hidden"
          >
            {isLoggingOut ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <LogOut className="size-4" />
            )}
          </button>
        </div>
        {superAdmin && (
          <div className="mt-2 flex items-center gap-1.5 px-2.5 text-[10.5px] text-muted-foreground max-md:hidden">
            <ShieldCheck className="size-3.5 text-primary" />
            Super Admin de plataforma
          </div>
        )}
      </div>
    </aside>
  );
}

function ContextMark({
  label,
  variant,
  small,
}: {
  label: string;
  variant: "org" | "admin";
  small?: boolean;
}) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-lg font-bold text-primary-foreground",
        small ? "size-[26px] text-[11px]" : "size-[30px] text-xs",
        variant === "admin" ? "bg-brand-dark" : "bg-primary",
      )}
    >
      {label}
    </span>
  );
}
