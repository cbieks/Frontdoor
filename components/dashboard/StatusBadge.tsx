import type { LeadStatus } from "@/app/generated/prisma/client";
import { Badge } from "@/components/ui/badge";

const STATUS_COLORS: Record<LeadStatus, string> = {
  scraped: "border-neutral-300 bg-neutral-100 text-neutral-700",
  scored: "border-blue-200 bg-blue-50 text-blue-700",
  approved: "border-emerald-200 bg-emerald-50 text-emerald-700",
  rejected: "border-red-200 bg-red-50 text-red-700",
  demo_generated: "border-violet-200 bg-violet-50 text-violet-700",
  contacted: "border-amber-200 bg-amber-50 text-amber-700",
  interested: "border-orange-200 bg-orange-50 text-orange-700",
  paid: "border-teal-200 bg-teal-50 text-teal-700",
  deployed: "border-green-300 bg-green-100 text-green-800",
};

export function StatusBadge({ status }: { status: LeadStatus }) {
  return <Badge className={STATUS_COLORS[status]}>{status}</Badge>;
}
