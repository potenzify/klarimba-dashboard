import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { getDashboardContexts } from "@/lib/dashboard-context";

/** Área de backoffice: solo Super Admin (detectado por sondeo del API). */
export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const contexts = await getDashboardContexts();
  if (!contexts.superAdmin) notFound();
  return <>{children}</>;
}
