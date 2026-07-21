import { requireOrgContext } from "@/lib/dashboard-context";
import { CompanyOverview } from "./company-overview";
import { PortfolioOverview } from "./portfolio-overview";

interface OrgPageProps {
  params: Promise<{ orgId: string }>;
}

export default async function OrgOverviewPage({ params }: OrgPageProps) {
  const { orgId } = await params;
  const context = await requireOrgContext(orgId);

  if (context.mode === "portfolio") {
    return <PortfolioOverview context={context} />;
  }
  return <CompanyOverview context={context} />;
}
