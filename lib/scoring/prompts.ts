// System prompts and user-message builders for both scoring paths.
// System prompts are static across leads — they are the cached prefix.
// See .claude/skills/lead-scoring/SKILL.md for the contract.

import type { Lead } from "@/app/generated/prisma/client";
import type { HeuristicFindings } from "@/types/scoring";

export type FirecrawlBrandingSummary = {
  logoUrl?: string;
  primary?: string;
  secondary?: string;
  accent?: string;
  background?: string;
  textPrimary?: string;
  link?: string;
  fonts?: string[];
  tone?: string;
  energy?: string;
  targetAudience?: string;
};

// ─── Path A: no-website ──────────────────────────────────────────────────────

export const NO_WEBSITE_SYSTEM_PROMPT = `You are scoring small-business leads for a website-demo outreach pipeline. The business you are scoring has NO existing website — these are leads where we'd offer to build their first site.

Your job is to assign a numeric opportunity score (0-100) reflecting how good a lead this is for our pitch.

High-score signals (push score UP toward 100):
- Active, healthy reviews (rating 4.0+, with 10-200 reviews — the SMB sweet spot)
- Recent customer engagement
- Service-oriented business category that benefits from a web presence (salons, trades, restaurants, professional services)
- Photos and hours present (indicates an engaged owner)

Low-score signals (push score DOWN toward 0):
- Very low rating (3.5 or below)
- Massive review count (>1000) — likely a chain, not our target
- No photos, no hours, very few reviews — likely a ghost listing or inactive business
- Category that doesn't benefit much from a website (vending machines, ATMs, etc.)

Return STRICT JSON in this exact shape, no preamble, no markdown:

{
  "score": <0-100 integer>,
  "reasoning": [
    { "factor": "<short label>", "impact": "positive" | "negative" | "neutral", "note": "<1 sentence specific to this lead>" }
  ]
}

Aim for 3-6 reasoning factors. Each factor must reference specific data from the lead, not generic statements.`;

export function buildNoWebsiteUserMessage(lead: Lead): string {
  const photoCount = Array.isArray(lead.photosJson) ? (lead.photosJson as unknown[]).length : 0;
  const reviewCount = lead.reviewCount ?? 0;

  return [
    `Business: ${lead.businessName}`,
    `Category: ${lead.category ?? "unknown"}`,
    `Address: ${lead.address ?? "unknown"}`,
    `Rating: ${lead.rating ?? "n/a"} (${reviewCount} reviews)`,
    `Photos on Google: ${photoCount}`,
    `Reviews available: ${Array.isArray(lead.reviewsJson) ? (lead.reviewsJson as unknown[]).length : 0}`,
  ].join("\n");
}

// ─── Path B: outdated-website ────────────────────────────────────────────────

export const OUTDATED_WEBSITE_SYSTEM_PROMPT = `You are evaluating a small business's EXISTING website. Your job is the QUALITATIVE analysis only: scoring, reasoning, brand voice, services, pain points, and what to preserve. You will NOT extract colors or logo URLs — those come from Firecrawl's CSS-based extractor and are merged into the final analysis after your response.

You will receive:
- A screenshot of the homepage
- A markdown extract of the page content
- A set of heuristic findings from a regex pre-filter that already ran (modern signals detected, outdated signals detected, freshness facts)
- A CSS-extracted branding profile from Firecrawl: logo URL, color palette, font families, and personality signals (tone/energy/audience). Treat this as ground truth — use it in your reasoning ("body font is Times New Roman per Firecrawl — dated") but don't repeat the data in your output.

The score is an OPPORTUNITY score, not a quality-of-business score. A high score means the site is outdated and we'd have a strong pitch. A low score means the site is already modern and there's nothing to sell.

Scoring guide:
- 0-25: Modern, well-designed, well-maintained site. Do not pitch. (Will be auto-rejected by the system.)
- 26-50: Mid — borderline, some outdated signals but the site mostly works
- 51-80: Clearly outdated — slow, dated typography, default templates, poor mobile, stale content
- 81-100: Severely outdated — legacy CMS defaults, table layouts, broken links, looks abandoned

Things that push the score UP:
- Legacy CMS templates (default Wordpress themes, old Wix free-tier, old Squarespace, Joomla, Drupal)
- Visual design from pre-2018 era
- No mobile responsiveness
- Slow, heavy pages
- Stale content (old copyright, old blog posts, broken nav)
- Default placeholder content still visible

Things that push the score DOWN:
- Modern framework fingerprints (Next.js, Astro, modern React)
- Recent typography, generous whitespace, modern layout patterns
- Mobile-first responsive design
- Custom branding clearly designed for this business
- Recent maintenance signals

For the brand extraction, look at logos, navigation, headlines, color usage, and the business's voice in their own copy. Be specific — generic answers ("friendly", "professional") are useless to the generator.

Return STRICT JSON in this exact shape, no preamble, no markdown fences:

{
  "score": <0-100 integer>,
  "reasoning": [
    { "factor": "<short label>", "impact": "positive" | "negative" | "neutral", "note": "<1 sentence with specific evidence from the site>" }
  ],
  "existingSiteAnalysis": {
    "brandVoice": "<phrase, e.g. 'casual neighborhood-trades voice with strong emphasis on family-owned history'>",
    "services": ["<service name>", "..."],
    "painPoints": ["<specific issue with the current site>", "..."],
    "whatToPreserve": "<1 sentence on what about the brand to keep in the demo>"
  }
}

DO NOT include extractedColors, logoUrl, or any color/image fields in your response. Those are merged from Firecrawl's CSS extraction after your response and will be stripped if you include them.

Rules:
- 3-6 reasoning factors. Each must cite specific evidence (e.g. "Footer reads © 2017", "Body font is Times New Roman per Firecrawl").
- 3-8 services. List the actual services the site advertises, not invented ones.
- 2-5 painPoints. Be concrete ("hero image is a 1990s clipart", not "looks bad").
- whatToPreserve is critical — what makes this business specific that the demo must keep?

ANTI-HALLUCINATION RULES:
- For pain points about technical issues (mobile responsiveness, viewport, slow loading), check the screenshot first. The pre-filter heuristics you received are HINTS, not facts — if the screenshot clearly shows a responsive mobile-friendly layout, do not parrot a "no mobile viewport" finding as a pain point. Modern frameworks often inject viewport meta via JS and the raw HTML we scraped may not reflect the rendered DOM. Trust the screenshot over the heuristic when they disagree.`;

export function buildOutdatedWebsiteUserMessage(
  lead: Lead,
  firecrawlMarkdown: string,
  heuristic: HeuristicFindings,
  branding: FirecrawlBrandingSummary | undefined
): string {
  // Cap markdown at ~6000 chars to keep token cost predictable
  const markdownCapped =
    firecrawlMarkdown.length > 6000
      ? firecrawlMarkdown.slice(0, 6000) + "\n\n[...truncated...]"
      : firecrawlMarkdown;

  const brandingLines: string[] = [];
  if (branding) {
    brandingLines.push("", "Firecrawl branding profile (authoritative — copy these values):");
    if (branding.logoUrl) brandingLines.push(`  Logo URL: ${branding.logoUrl}`);
    if (branding.primary) brandingLines.push(`  Primary color: ${branding.primary}`);
    if (branding.secondary) brandingLines.push(`  Secondary color: ${branding.secondary}`);
    if (branding.accent) brandingLines.push(`  Accent color: ${branding.accent}`);
    if (branding.background) brandingLines.push(`  Background color: ${branding.background}`);
    if (branding.textPrimary) brandingLines.push(`  Text color: ${branding.textPrimary}`);
    if (branding.fonts && branding.fonts.length > 0) {
      brandingLines.push(`  Font families: ${branding.fonts.join(", ")}`);
    }
    if (branding.tone) brandingLines.push(`  Brand tone: ${branding.tone}`);
    if (branding.energy) brandingLines.push(`  Brand energy: ${branding.energy}`);
    if (branding.targetAudience) brandingLines.push(`  Target audience: ${branding.targetAudience}`);
  } else {
    brandingLines.push("", "Firecrawl branding profile: not available (extract from screenshot only).");
  }

  return [
    `Business: ${lead.businessName}`,
    `Category: ${lead.category ?? "unknown"}`,
    `Address: ${lead.address ?? "unknown"}`,
    `Existing site: ${lead.website}`,
    "",
    `Heuristic pre-filter findings:`,
    `  Modern signals detected: ${heuristic.modernSignals.length > 0 ? heuristic.modernSignals.join(", ") : "none"}`,
    `  Outdated signals detected: ${heuristic.outdatedSignals.length > 0 ? heuristic.outdatedSignals.join(", ") : "none"}`,
    `  Copyright year: ${heuristic.freshness.copyrightYear ?? "not found"}`,
    `  Mobile viewport: ${heuristic.freshness.hasMobileViewport ? "present" : "missing"}`,
    `  HTTPS: ${heuristic.freshness.hasHttps ? "yes" : "no"}`,
    ...brandingLines,
    "",
    `Markdown extract of homepage:`,
    "```markdown",
    markdownCapped,
    "```",
  ].join("\n");
}
