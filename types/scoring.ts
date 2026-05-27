// Contract types for the lead-scoring layer.
// Source of truth: .claude/skills/lead-scoring/SKILL.md
// ExistingSiteAnalysis must match the generation prompt's input contract
// in .claude/skills/generation-schema/SKILL.md.

export type ScoreFactor = {
  factor: string;
  impact: "positive" | "negative" | "neutral";
  note: string;
};

export type ExtractedColors = {
  primary?: string;       // brand identity color
  secondary?: string;     // supporting brand color (may be absent)
  accent?: string;        // CTA / highlight color
  background?: string;    // page background (usually white)
  textPrimary?: string;   // body text color
  link?: string;          // anchor color
};

export type ExistingSiteAnalysis = {
  brandVoice: string;
  extractedColors: ExtractedColors;
  logoUrl?: string;
  services: string[];
  painPoints: string[];
  whatToPreserve: string;
};

export type HeuristicFindings = {
  modernSignals: string[];
  outdatedSignals: string[];
  freshness: {
    copyrightYear?: number;
    hasMobileViewport: boolean;
    hasHttps: boolean;
  };
};

export type HeuristicVerdict = {
  verdict: "auto-reject-modern" | "needs-vision";
  findings: HeuristicFindings;
};

// Output union returned by per-path scoring functions. Caller writes a score
// for the success branch and transitions to rejected for the autoReject branch.
export type ScoringOutcome =
  | {
      ok: true;
      score: number;
      reasoning: ScoreFactor[];
      existingSiteAnalysis?: ExistingSiteAnalysis;
    }
  | {
      ok: false;
      autoReject: { reason: string };
      // Even when auto-rejected we keep any partial reasoning so the operator
      // can see why later via the "Show rejected" toggle.
      reasoning?: ScoreFactor[];
    };

// ─── Runtime guards ──────────────────────────────────────────────────────────
// Both scoring code and the dashboard's detail page validate untyped JSON
// from the DB against these shapes before rendering or persisting.

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

export function isScoreFactor(r: unknown): r is ScoreFactor {
  if (!r || typeof r !== "object") return false;
  const v = r as Record<string, unknown>;
  return (
    typeof v.factor === "string" &&
    typeof v.note === "string" &&
    typeof v.impact === "string" &&
    ["positive", "negative", "neutral"].includes(v.impact)
  );
}

export function isScoreReasoning(value: unknown): value is ScoreFactor[] {
  return Array.isArray(value) && value.every(isScoreFactor);
}

const COLOR_FIELDS = [
  "primary",
  "secondary",
  "accent",
  "background",
  "textPrimary",
  "link",
] as const;

export function isExistingSiteAnalysis(value: unknown): value is ExistingSiteAnalysis {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  if (typeof v.brandVoice !== "string") return false;
  if (typeof v.whatToPreserve !== "string") return false;
  if (!Array.isArray(v.services) || !v.services.every((s) => typeof s === "string")) return false;
  if (!Array.isArray(v.painPoints) || !v.painPoints.every((s) => typeof s === "string")) return false;
  if (!v.extractedColors || typeof v.extractedColors !== "object") return false;
  const colors = v.extractedColors as Record<string, unknown>;
  for (const field of COLOR_FIELDS) {
    const c = colors[field];
    if (c !== undefined && (typeof c !== "string" || !HEX_RE.test(c))) {
      return false;
    }
  }
  if (v.logoUrl !== undefined && typeof v.logoUrl !== "string") return false;
  return true;
}
