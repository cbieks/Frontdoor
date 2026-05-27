import Link from "next/link";
import type { Lead } from "@/app/generated/prisma/client";
import { GenerateButton } from "./GenerateButton";
import { LeadTypeBadge } from "./LeadTypeBadge";
import { StatusBadge } from "./StatusBadge";

type Props = {
  leads: Lead[];
};

export function LeadsTable({ leads }: Props) {
  if (leads.length === 0) {
    return (
      <div className="border border-dashed border-neutral-300 rounded-lg p-12 text-center text-neutral-500 text-sm">
        No leads to show. Run a scrape above to populate this list.
      </div>
    );
  }

  return (
    <div className="border border-neutral-200 rounded-lg overflow-hidden bg-white">
      <table className="w-full text-sm">
        <thead className="bg-neutral-50 text-neutral-600 text-xs uppercase tracking-wide">
          <tr>
            <th className="text-left px-3 py-2 font-medium">Business</th>
            <th className="text-left px-3 py-2 font-medium">Type</th>
            <th className="text-left px-3 py-2 font-medium">Rating</th>
            <th className="text-left px-3 py-2 font-medium">Reviews</th>
            <th className="text-left px-3 py-2 font-medium">Website</th>
            <th className="text-left px-3 py-2 font-medium">Status</th>
            <th className="text-left px-3 py-2 font-medium">Score</th>
            <th className="text-right px-3 py-2 font-medium">Action</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <LeadRow key={lead.id} lead={lead} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LeadRow({ lead }: { lead: Lead }) {
  return (
    <tr className="border-t border-neutral-100 hover:bg-neutral-50">
      <td className="px-3 py-2.5">
        <Link
          href={`/dashboard/leads/${lead.id}`}
          className="font-medium text-neutral-900 hover:text-blue-700 hover:underline inline-flex items-center gap-1"
        >
          {lead.businessName}
          <span className="text-neutral-400" aria-hidden>→</span>
        </Link>
        {lead.address ? (
          <div className="text-xs text-neutral-500 truncate max-w-[300px]">{lead.address}</div>
        ) : null}
      </td>
      <td className="px-3 py-2.5">
        <LeadTypeBadge type={lead.leadType} />
      </td>
      <td className="px-3 py-2.5 text-neutral-700">{lead.rating?.toFixed(1) ?? "—"}</td>
      <td className="px-3 py-2.5 text-neutral-700">{lead.reviewCount ?? "—"}</td>
      <td className="px-3 py-2.5">
        {lead.website ? (
          <a
            href={lead.website}
            target="_blank"
            rel="noreferrer"
            className="text-blue-600 hover:underline truncate inline-block max-w-[180px]"
            title={lead.website}
          >
            {new URL(lead.website).hostname.replace(/^www\./, "")}
          </a>
        ) : (
          <span className="text-neutral-400">—</span>
        )}
      </td>
      <td className="px-3 py-2.5">
        <StatusBadge status={lead.status} />
      </td>
      <td className="px-3 py-2.5">
        <ScoreCell score={lead.score} />
      </td>
      <td className="px-3 py-2.5">
        <GenerateButton leadId={lead.id} status={lead.status} />
      </td>
    </tr>
  );
}

function ScoreCell({ score }: { score: number | null }) {
  if (score === null) return <span className="text-neutral-400">—</span>;

  const color =
    score >= 70 ? "bg-emerald-500" : score >= 40 ? "bg-amber-500" : "bg-neutral-300";

  return (
    <div className="flex items-center gap-2">
      <span className="font-medium text-neutral-900 tabular-nums w-7 text-right">{score}</span>
      <div className="w-12 h-1.5 bg-neutral-200 rounded-full overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}
