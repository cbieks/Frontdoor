import Link from "next/link";
import type { LeadType } from "@/app/generated/prisma/client";

type Counts = {
  all: number;
  OUTDATED_WEBSITE: number;
  NO_WEBSITE: number;
};

type Props = {
  currentType: LeadType | undefined;
  counts: Counts;
  showRejected: boolean;
};

function buildHref(type: LeadType | undefined, showRejected: boolean): string {
  const params = new URLSearchParams();
  if (type) params.set("type", type);
  if (showRejected) params.set("showRejected", "1");
  const qs = params.toString();
  return qs ? `/dashboard?${qs}` : "/dashboard";
}

function tabClass(active: boolean): string {
  return active
    ? "px-3 py-1.5 text-sm font-medium rounded-md bg-neutral-900 text-white"
    : "px-3 py-1.5 text-sm font-medium rounded-md text-neutral-700 hover:bg-neutral-100";
}

export function LeadTypeFilter({ currentType, counts, showRejected }: Props) {
  return (
    <div className="flex gap-1 border border-neutral-200 rounded-lg p-1 bg-neutral-50 w-fit">
      <Link href={buildHref(undefined, showRejected)} className={tabClass(currentType === undefined)}>
        All ({counts.all})
      </Link>
      <Link
        href={buildHref("OUTDATED_WEBSITE", showRejected)}
        className={tabClass(currentType === "OUTDATED_WEBSITE")}
      >
        Outdated ({counts.OUTDATED_WEBSITE})
      </Link>
      <Link
        href={buildHref("NO_WEBSITE", showRejected)}
        className={tabClass(currentType === "NO_WEBSITE")}
      >
        No-website ({counts.NO_WEBSITE})
      </Link>
    </div>
  );
}
