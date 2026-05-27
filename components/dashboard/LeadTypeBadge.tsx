import type { LeadType } from "@/app/generated/prisma/client";
import { Badge } from "@/components/ui/badge";

const LABELS: Record<LeadType, string> = {
  OUTDATED_WEBSITE: "outdated",
  NO_WEBSITE: "no-website",
};

const COLORS: Record<LeadType, string> = {
  OUTDATED_WEBSITE: "border-purple-200 bg-purple-50 text-purple-700",
  NO_WEBSITE: "border-sky-200 bg-sky-50 text-sky-700",
};

export function LeadTypeBadge({ type }: { type: LeadType }) {
  return <Badge className={COLORS[type]}>{LABELS[type]}</Badge>;
}
