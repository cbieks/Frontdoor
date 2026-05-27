// Path B: scoring for leads with an existing website.
// 1. Firecrawl scrape (markdown + html + screenshot)
// 2. Regex heuristics — auto-reject if obviously modern
// 3. Sonnet vision pass — full score + brand extraction
// See .claude/skills/lead-scoring/SKILL.md.

import type { Lead } from "@/app/generated/prisma/client";
import { anthropic } from "@/lib/anthropic";
import { firecrawl } from "@/lib/firecrawl";
import { classifyHtml } from "./heuristics";
import {
  OUTDATED_WEBSITE_SYSTEM_PROMPT,
  buildOutdatedWebsiteUserMessage,
  type FirecrawlBrandingSummary,
} from "./prompts";
import {
  isScoreReasoning,
  type ExistingSiteAnalysis,
  type ExtractedColors,
  type ScoreFactor,
  type ScoringOutcome,
} from "@/types/scoring";

// What Sonnet now returns: qualitative analysis only. Colors and logo are
// merged from Firecrawl's extractor after the Sonnet call.
type SonnetQualitative = {
  brandVoice: string;
  services: string[];
  painPoints: string[];
  whatToPreserve: string;
};

type SonnetOutput = {
  score: number;
  reasoning: ScoreFactor[];
  existingSiteAnalysis: SonnetQualitative;
};

function isSonnetQualitative(value: unknown): value is SonnetQualitative {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  if (typeof v.brandVoice !== "string") return false;
  if (typeof v.whatToPreserve !== "string") return false;
  if (!Array.isArray(v.services) || !v.services.every((s) => typeof s === "string")) return false;
  if (!Array.isArray(v.painPoints) || !v.painPoints.every((s) => typeof s === "string")) return false;
  return true;
}

function isSonnetOutput(value: unknown): value is SonnetOutput {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  if (typeof v.score !== "number" || v.score < 0 || v.score > 100) return false;
  if (!isScoreReasoning(v.reasoning)) return false;
  if (!isSonnetQualitative(v.existingSiteAnalysis)) return false;
  return true;
}

function stripJsonFences(text: string): string {
  const trimmed = text.trim();
  if (trimmed.startsWith("```")) {
    return trimmed.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
  }
  return trimmed;
}

export async function scoreOutdatedWebsiteLead(lead: Lead): Promise<ScoringOutcome> {
  if (!lead.website) {
    // Defensive: caller should only route here for leads with a website.
    return { ok: false, autoReject: { reason: "no-website-url" } };
  }

  const tag = `[scoring B ${lead.id.slice(-6)} ${lead.website}]`;
  console.log(`${tag} starting`);

  // ─── Step 1: Firecrawl scrape ─────────────────────────────────────────────
  const tFirecrawl = Date.now();
  let markdown = "";
  let html = "";
  let screenshotUrl: string | undefined;
  let branding: FirecrawlBrandingSummary | undefined;
  try {
    const doc = await firecrawl.scrape(lead.website, {
      formats: ["markdown", "html", "screenshot", "branding"],
    });
    markdown = doc.markdown ?? "";
    html = doc.html ?? doc.rawHtml ?? "";
    screenshotUrl = doc.screenshot;
    branding = summarizeBranding(doc.branding);
    console.log(
      `${tag} firecrawl ok in ${Date.now() - tFirecrawl}ms (md=${markdown.length} html=${html.length} shot=${screenshotUrl ? "yes" : "no"} branding=${branding ? `logo=${branding.logoUrl ? "y" : "n"},primary=${branding.primary ?? "—"}` : "none"})`
    );
  } catch (err) {
    console.log(`${tag} firecrawl FAILED in ${Date.now() - tFirecrawl}ms: ${err instanceof Error ? err.message : err}`);
    return {
      ok: false,
      autoReject: {
        reason: `firecrawl-failed: ${err instanceof Error ? err.message : String(err)}`,
      },
    };
  }

  if (!html || !screenshotUrl) {
    console.log(`${tag} firecrawl-incomplete`);
    return {
      ok: false,
      autoReject: { reason: "firecrawl-incomplete: missing html or screenshot" },
    };
  }

  // ─── Step 2: Heuristic verdict ────────────────────────────────────────────
  const verdict = classifyHtml(html, lead.website);
  console.log(
    `${tag} heuristic verdict=${verdict.verdict} modern=[${verdict.findings.modernSignals.join(",")}] outdated=[${verdict.findings.outdatedSignals.join(",")}]`
  );

  if (verdict.verdict === "auto-reject-modern") {
    return {
      ok: false,
      autoReject: {
        reason: `heuristic-modern: ${verdict.findings.modernSignals.join(", ")}`,
      },
      reasoning: verdict.findings.modernSignals.map((sig) => ({
        factor: "Modern signal detected",
        impact: "negative" as const,
        note: `Regex matched: ${sig}`,
      })),
    };
  }

  // ─── Step 3: Sonnet vision pass ───────────────────────────────────────────
  const model = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6";
  console.log(`${tag} calling ${model}...`);
  const tSonnet = Date.now();

  const response = await anthropic.messages.create({
    model,
    max_tokens: 2000,
    system: [
      {
        type: "text",
        text: OUTDATED_WEBSITE_SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "url",
              url: screenshotUrl,
            },
          },
          {
            type: "text",
            text: buildOutdatedWebsiteUserMessage(lead, markdown, verdict.findings, branding),
          },
        ],
      },
    ],
  });

  console.log(
    `${tag} ${model} returned in ${Date.now() - tSonnet}ms (in=${response.usage.input_tokens} out=${response.usage.output_tokens} cached=${response.usage.cache_read_input_tokens ?? 0})`
  );

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Sonnet returned no text content for lead " + lead.id);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(stripJsonFences(textBlock.text));
  } catch {
    throw new Error(
      `Sonnet returned invalid JSON for lead ${lead.id}: ${textBlock.text.slice(0, 200)}`
    );
  }

  if (!isSonnetOutput(parsed)) {
    throw new Error(
      `Sonnet output failed validation for lead ${lead.id}: ${JSON.stringify(parsed).slice(0, 400)}`
    );
  }

  // Merge Sonnet's qualitative output with Firecrawl's CSS-extracted visuals.
  // Colors + logo come exclusively from Firecrawl per the lead-scoring skill;
  // Sonnet does not produce these fields. Missing colors are simply omitted
  // from the stored palette (all fields are optional).
  const extractedColors: ExtractedColors = {};
  if (branding?.primary) extractedColors.primary = branding.primary;
  if (branding?.secondary) extractedColors.secondary = branding.secondary;
  if (branding?.accent) extractedColors.accent = branding.accent;
  if (branding?.background) extractedColors.background = branding.background;
  if (branding?.textPrimary) extractedColors.textPrimary = branding.textPrimary;
  if (branding?.link) extractedColors.link = branding.link;

  const finalAnalysis: ExistingSiteAnalysis = {
    ...parsed.existingSiteAnalysis,
    extractedColors,
    ...(branding?.logoUrl ? { logoUrl: branding.logoUrl } : {}),
  };

  return {
    ok: true,
    score: Math.round(parsed.score),
    reasoning: parsed.reasoning,
    existingSiteAnalysis: finalAnalysis,
  };
}

// Pull the fields we care about from Firecrawl's BrandingProfile into the
// flat summary shape we pass to the Sonnet prompt and use for overrides.
// Returns undefined if no useful data is present.
function summarizeBranding(
  raw: unknown
): FirecrawlBrandingSummary | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const b = raw as Record<string, unknown>;
  const images = (b.images ?? {}) as Record<string, unknown>;
  const colors = (b.colors ?? {}) as Record<string, unknown>;
  const personality = (b.personality ?? {}) as Record<string, unknown>;
  const fontsRaw = Array.isArray(b.fonts) ? (b.fonts as Array<Record<string, unknown>>) : [];
  const fonts = fontsRaw
    .map((f) => (typeof f.family === "string" ? f.family : undefined))
    .filter((s): s is string => Boolean(s));

  const summary: FirecrawlBrandingSummary = {
    logoUrl: typeof images.logo === "string" ? images.logo : undefined,
    primary: typeof colors.primary === "string" ? colors.primary : undefined,
    secondary: typeof colors.secondary === "string" ? colors.secondary : undefined,
    accent: typeof colors.accent === "string" ? colors.accent : undefined,
    background: typeof colors.background === "string" ? colors.background : undefined,
    textPrimary: typeof colors.textPrimary === "string" ? colors.textPrimary : undefined,
    link: typeof colors.link === "string" ? colors.link : undefined,
    fonts: fonts.length > 0 ? fonts : undefined,
    tone: typeof personality.tone === "string" ? personality.tone : undefined,
    energy: typeof personality.energy === "string" ? personality.energy : undefined,
    targetAudience:
      typeof personality.targetAudience === "string" ? personality.targetAudience : undefined,
  };

  // If literally nothing useful was extracted, return undefined so callers
  // can branch on `branding ? ... : ...`.
  const hasAny = Object.values(summary).some((v) => v !== undefined);
  return hasAny ? summary : undefined;
}
