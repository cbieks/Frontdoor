import Link from "next/link";
import { notFound } from "next/navigation";
import { GenerateButton } from "@/components/dashboard/GenerateButton";
import { LeadTypeBadge } from "@/components/dashboard/LeadTypeBadge";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { prisma } from "@/lib/prisma";
import {
  isExistingSiteAnalysis,
  isScoreReasoning,
  type ExistingSiteAnalysis,
  type ScoreFactor,
} from "@/types/scoring";

type Params = Promise<{ id: string }>;

export default async function LeadDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const lead = await prisma.lead.findUnique({ where: { id } });
  if (!lead) notFound();

  const reasoning: ScoreFactor[] | null = isScoreReasoning(lead.scoreReasoning)
    ? lead.scoreReasoning
    : null;
  const analysis: ExistingSiteAnalysis | null = isExistingSiteAnalysis(lead.existingSiteAnalysisJson)
    ? lead.existingSiteAnalysisJson
    : null;

  const photoCount = Array.isArray(lead.photosJson) ? lead.photosJson.length : 0;

  return (
    <div className="flex flex-col gap-6">
      <Link href="/dashboard" className="text-sm text-neutral-600 hover:text-neutral-900 w-fit">
        ← Back to dashboard
      </Link>

      <header className="border border-neutral-200 rounded-lg p-5 bg-white">
        <h1 className="text-2xl font-semibold text-neutral-900">{lead.businessName}</h1>
        <div className="mt-1.5 text-sm text-neutral-600 flex flex-wrap gap-x-4 gap-y-1">
          {lead.category ? <span>{lead.category}</span> : null}
          {lead.address ? <span>{lead.address}</span> : null}
          {lead.phone ? <span>{lead.phone}</span> : null}
          {lead.rating !== null ? (
            <span>
              ⭐ {lead.rating.toFixed(1)} ({lead.reviewCount ?? 0} reviews)
            </span>
          ) : null}
        </div>
        {lead.website ? (
          <a
            href={lead.website}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-block text-sm text-blue-600 hover:underline"
          >
            View live site ↗
          </a>
        ) : null}
      </header>

      <section className="border border-neutral-200 rounded-lg p-5 bg-white flex items-center gap-4 flex-wrap">
        <StatusBadge status={lead.status} />
        <LeadTypeBadge type={lead.leadType} />
        <div className="flex items-baseline gap-1">
          <span className="text-xs text-neutral-500">Score</span>
          <span className="text-3xl font-semibold text-neutral-900 tabular-nums">
            {lead.score ?? "—"}
          </span>
        </div>
        <div className="ml-auto">
          <GenerateButton leadId={lead.id} status={lead.status} />
        </div>
      </section>

      <section className="border border-neutral-200 rounded-lg p-5 bg-white">
        <h2 className="text-lg font-semibold text-neutral-900 mb-3">Why this score</h2>
        {reasoning && reasoning.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {reasoning.map((factor, i) => (
              <ReasoningRow key={i} factor={factor} />
            ))}
          </ul>
        ) : (
          <p className="text-sm text-neutral-500">No reasoning recorded for this lead.</p>
        )}
      </section>

      {analysis ? <AnalysisSection analysis={analysis} /> : null}

      {(photoCount > 0 || lead.reviewCount) ? (
        <section className="text-xs text-neutral-500">
          Google Places: {photoCount} photo{photoCount === 1 ? "" : "s"}
          {lead.reviewCount !== null ? `, ${lead.reviewCount} reviews` : ""}
        </section>
      ) : null}
    </div>
  );
}

function ReasoningRow({ factor }: { factor: ScoreFactor }) {
  const color =
    factor.impact === "positive"
      ? "text-emerald-700 bg-emerald-50 border-emerald-200"
      : factor.impact === "negative"
        ? "text-red-700 bg-red-50 border-red-200"
        : "text-neutral-600 bg-neutral-50 border-neutral-200";
  const icon = factor.impact === "positive" ? "+" : factor.impact === "negative" ? "−" : "·";

  return (
    <li className="flex gap-3 items-start">
      <span
        className={`inline-flex items-center justify-center w-5 h-5 rounded-full border text-xs font-bold ${color}`}
        aria-label={factor.impact}
      >
        {icon}
      </span>
      <div className="flex-1">
        <div className="font-medium text-sm text-neutral-900">{factor.factor}</div>
        <div className="text-sm text-neutral-600">{factor.note}</div>
      </div>
    </li>
  );
}

function AnalysisSection({ analysis }: { analysis: ExistingSiteAnalysis }) {
  return (
    <section className="border border-neutral-200 rounded-lg p-5 bg-white flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-neutral-900">Existing site analysis</h2>

      <div>
        <div className="text-xs uppercase tracking-wide text-neutral-500 mb-1">Brand voice</div>
        <blockquote className="text-sm text-neutral-700 border-l-2 border-neutral-300 pl-3">
          {analysis.brandVoice}
        </blockquote>
      </div>

      <div>
        <div className="text-xs uppercase tracking-wide text-neutral-500 mb-2">
          Extracted colors
        </div>
        <div className="flex gap-3 flex-wrap">
          {analysis.extractedColors.primary ? (
            <ColorSwatch label="Primary" hex={analysis.extractedColors.primary} />
          ) : null}
          {analysis.extractedColors.secondary ? (
            <ColorSwatch label="Secondary" hex={analysis.extractedColors.secondary} />
          ) : null}
          {analysis.extractedColors.accent ? (
            <ColorSwatch label="Accent" hex={analysis.extractedColors.accent} />
          ) : null}
          {analysis.extractedColors.background ? (
            <ColorSwatch label="Background" hex={analysis.extractedColors.background} />
          ) : null}
          {analysis.extractedColors.textPrimary ? (
            <ColorSwatch label="Text" hex={analysis.extractedColors.textPrimary} />
          ) : null}
          {analysis.extractedColors.link ? (
            <ColorSwatch label="Link" hex={analysis.extractedColors.link} />
          ) : null}
        </div>
      </div>

      {analysis.logoUrl ? (
        <div>
          <div className="text-xs uppercase tracking-wide text-neutral-500 mb-1">Logo</div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={analysis.logoUrl}
            alt="Detected logo"
            className="max-h-16 border border-neutral-200 bg-white rounded p-1"
          />
        </div>
      ) : null}

      <div>
        <div className="text-xs uppercase tracking-wide text-neutral-500 mb-1">Services</div>
        <ul className="list-disc list-inside text-sm text-neutral-700 flex flex-col gap-0.5">
          {analysis.services.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
      </div>

      <div>
        <div className="text-xs uppercase tracking-wide text-neutral-500 mb-1">Pain points</div>
        <ul className="list-disc list-inside text-sm text-neutral-700 flex flex-col gap-0.5">
          {analysis.painPoints.map((p, i) => (
            <li key={i}>{p}</li>
          ))}
        </ul>
      </div>

      <div>
        <div className="text-xs uppercase tracking-wide text-neutral-500 mb-1">
          What to preserve
        </div>
        <blockquote className="text-sm text-neutral-700 border-l-2 border-neutral-300 pl-3">
          {analysis.whatToPreserve}
        </blockquote>
      </div>
    </section>
  );
}

function ColorSwatch({ label, hex }: { label: string; hex: string }) {
  return (
    <div className="flex flex-col items-center">
      <div
        className="w-16 h-16 rounded-md border border-neutral-200"
        style={{ backgroundColor: hex }}
      />
      <div className="text-xs text-neutral-500 mt-1">{label}</div>
      <code className="text-xs text-neutral-700 tabular-nums">{hex}</code>
    </div>
  );
}
