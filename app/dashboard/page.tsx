import { LeadStatus, LeadType, Prisma } from "@/app/generated/prisma/client";
import { LeadTypeFilter } from "@/components/dashboard/LeadTypeFilter";
import { LeadsTable } from "@/components/dashboard/LeadsTable";
import { ScrapeForm } from "@/components/dashboard/ScrapeForm";
import { ShowRejectedToggle } from "@/components/dashboard/ShowRejectedToggle";
import { prisma } from "@/lib/prisma";

type SearchParams = Promise<{
  type?: string;
  showRejected?: string;
}>;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const currentType =
    params.type === "OUTDATED_WEBSITE" || params.type === "NO_WEBSITE"
      ? (params.type as LeadType)
      : undefined;
  const showRejected = params.showRejected === "1";

  const whereClause: Prisma.LeadWhereInput = {
    ...(currentType ? { leadType: currentType } : {}),
    ...(showRejected ? {} : { status: { not: LeadStatus.rejected } }),
  };

  const [leads, allCount, outdatedCount, noWebsiteCount, rejectedCount] = await Promise.all([
    prisma.lead.findMany({
      where: whereClause,
      orderBy: [{ score: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
      take: 100,
    }),
    prisma.lead.count({
      where: showRejected ? {} : { status: { not: LeadStatus.rejected } },
    }),
    prisma.lead.count({
      where: {
        leadType: LeadType.OUTDATED_WEBSITE,
        ...(showRejected ? {} : { status: { not: LeadStatus.rejected } }),
      },
    }),
    prisma.lead.count({
      where: {
        leadType: LeadType.NO_WEBSITE,
        ...(showRejected ? {} : { status: { not: LeadStatus.rejected } }),
      },
    }),
    prisma.lead.count({ where: { status: LeadStatus.rejected } }),
  ]);

  return (
    <div className="flex flex-col gap-5">
      <ScrapeForm />

      <div className="flex items-center justify-between flex-wrap gap-3">
        <LeadTypeFilter
          currentType={currentType}
          counts={{
            all: allCount,
            OUTDATED_WEBSITE: outdatedCount,
            NO_WEBSITE: noWebsiteCount,
          }}
          showRejected={showRejected}
        />
        <ShowRejectedToggle count={rejectedCount} active={showRejected} />
      </div>

      <LeadsTable leads={leads} />
    </div>
  );
}
