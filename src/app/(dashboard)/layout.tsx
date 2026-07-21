import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { getAuthMe } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/http";
import {
  getDashboardContexts,
  toSidebarContexts,
} from "@/lib/dashboard-context";
import { logoutAction } from "@/app/logout-action";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  let contexts;
  let me;
  try {
    [contexts, me] = await Promise.all([getDashboardContexts(), getAuthMe()]);
  } catch (error) {
    if (error instanceof ApiError && error.isUnauthorized) {
      redirect("/login?expired=1");
    }
    throw error;
  }

  const name =
    [me.firstName, me.lastName].filter(Boolean).join(" ") ||
    me.email ||
    "Usuario";

  return (
    <div className="flex min-h-screen">
      <AppSidebar
        orgs={toSidebarContexts(contexts)}
        superAdmin={contexts.superAdmin}
        user={{ name, email: me.email ?? "" }}
        logout={logoutAction}
      />
      <main className="min-w-0 flex-1">
        <div className="mx-auto w-full max-w-6xl px-7 py-7 pb-16 max-md:px-4">
          {children}
        </div>
      </main>
    </div>
  );
}
