import "server-only";
import { ApiError } from "@/lib/api/http";
import {
  getOrganizationSummary,
  listChildren,
} from "@/lib/api/organizations";
import type { Organization, SeatUsage } from "@/lib/api/schemas";

export interface ChildWithUsage {
  org: Organization;
  /** null si el summary de la hija no está disponible (p. ej. sin grant). */
  seatUsage: SeatUsage | null;
}

/** Hijas del partner con su uso de accesos (resuelto en paralelo). */
export async function loadChildrenWithUsage(
  orgId: string,
): Promise<ChildWithUsage[]> {
  const children = await listChildren(orgId);
  return Promise.all(
    children.map(async (child) => {
      try {
        const summary = await getOrganizationSummary(child.id);
        return { org: child, seatUsage: summary.seatUsage };
      } catch (error) {
        if (error instanceof ApiError) return { org: child, seatUsage: null };
        throw error;
      }
    }),
  );
}
