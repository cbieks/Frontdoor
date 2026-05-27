// Pure regex classifier for Stage 1 of Path B scoring.
// No LLM, no I/O — fast, free, deterministic. Decides if a site is so
// obviously modern that we shouldn't pay Sonnet to look at it.
// Signal lists are the source-of-truth contract from
// .claude/skills/lead-scoring/SKILL.md.

import type { HeuristicFindings, HeuristicVerdict } from "@/types/scoring";

const CURRENT_YEAR = new Date().getFullYear();

// ─── Strong-modern signal detectors ──────────────────────────────────────────

function detectModernSignals(html: string, siteUrl: string): string[] {
  const signals: string[] = [];

  if (/_next\/static\//.test(html)) signals.push("nextjs");
  if (/__nuxt|__NUXT__/.test(html)) signals.push("nuxt");
  if (/_app\/immutable\//.test(html)) signals.push("sveltekit");
  if (/astro-island/.test(html)) signals.push("astro");

  // Tailwind class density — a heuristic for hand-rolled modern styling.
  // We look at the body, count utility-style class attributes, divide by kB.
  const bodyMatch = html.match(/<body[\s\S]*?<\/body>/i);
  if (bodyMatch) {
    const body = bodyMatch[0];
    const sizeKb = Math.max(1, body.length / 1024);
    const utilityMatches = body.match(
      /class(Name)?="[^"]*(\b(flex|grid|gap-|md:|lg:|hover:|sm:|xl:|2xl:|space-x-|space-y-)[^"]*)"/g
    );
    const density = (utilityMatches?.length ?? 0) / sizeKb;
    if (density > 3) signals.push("tailwind-density");
  }

  // "Modern baseline": recent copyright + viewport + a modern sans-serif font
  // family declared. Each individually is weak; together they're strong.
  const recentCopyright = matchCopyrightYear(html) ?? 0;
  const hasViewport = detectMobileViewport(html);
  const hasModernFont = /font-family\s*:\s*[^;]*(inter|dm sans|söhne|sohne|geist|satoshi|figtree|outfit|space grotesk)/i.test(
    html
  );
  if (
    (recentCopyright === CURRENT_YEAR || recentCopyright === CURRENT_YEAR - 1) &&
    hasViewport &&
    hasModernFont
  ) {
    signals.push("modern-baseline");
  }

  return signals;
}

// ─── Strong-outdated signal detectors ────────────────────────────────────────

function detectOutdatedSignals(html: string, siteUrl: string): string[] {
  const signals: string[] = [];

  if (
    /\/wp-content\/themes\/twenty(ten|eleven|twelve|thirteen|fourteen|fifteen)\//i.test(
      html
    )
  ) {
    signals.push("wp-default-old-theme");
  }

  // Wix free-tier indicators
  if (/wixstatic\.com/.test(html) && /wix\.com\/website/.test(html)) {
    signals.push("wix-free");
  }

  // Squarespace v6
  if (/static1\.squarespace\.com/.test(html) && /Squarespace-v6/.test(html)) {
    signals.push("squarespace-old");
  }

  // Joomla
  if (/index\.php\?option=com_/.test(html)) {
    signals.push("joomla");
  }

  // Drupal 7
  if (/\/sites\/default\/files\//.test(html) && /Drupal\.settings/.test(html)) {
    signals.push("drupal-7");
  }

  if (!detectMobileViewport(html)) {
    signals.push("no-viewport");
  }

  const copyrightYear = matchCopyrightYear(html);
  if (copyrightYear === undefined || copyrightYear < CURRENT_YEAR - 2) {
    signals.push("stale-copyright");
  }

  if (/jquery-1\.|jquery-2\.|jquery\/1\.|jquery\/2\./i.test(html)) {
    signals.push("old-jquery");
  }

  // Table-based layout: 3+ non-presentation <table> blocks inside <body>
  const bodyMatch = html.match(/<body[\s\S]*?<\/body>/i);
  if (bodyMatch) {
    const tableMatches = bodyMatch[0].match(/<table\b(?![^>]*role=["']presentation["'])/gi);
    if (tableMatches && tableMatches.length >= 3) {
      signals.push("table-layout");
    }
  }

  if (bodyMatch && /<(font|center)\b/i.test(bodyMatch[0])) {
    signals.push("deprecated-html");
  }

  if (siteUrl.startsWith("http://")) {
    signals.push("no-https");
  }

  // Default placeholder content cliches
  if (
    /welcome to my new website|welcome to our (new )?(website|site)|lorem ipsum/i.test(html)
  ) {
    signals.push("placeholder-content");
  }

  return signals;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function matchCopyrightYear(html: string): number | undefined {
  // Look for © followed by a 4-digit year, possibly with range/punctuation
  const match = html.match(/©|&copy;|copyright/i);
  if (!match) return undefined;
  // Search in a window after the first copyright marker
  const idx = html.search(/©|&copy;|copyright/i);
  if (idx === -1) return undefined;
  const window = html.slice(idx, idx + 200);
  const years = [...window.matchAll(/(19|20)\d{2}/g)].map((m) => parseInt(m[0], 10));
  if (years.length === 0) return undefined;
  return Math.max(...years);
}

function detectMobileViewport(html: string): boolean {
  // Match <meta ... name="viewport" ...> regardless of attribute order.
  // Many sites write <meta content="..." name="viewport"> with attributes in
  // the opposite order than the common "name first" convention.
  return /<meta\b[^>]*\bname=["']viewport["']/i.test(html);
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function classifyHtml(html: string, siteUrl: string): HeuristicVerdict {
  const modernSignals = detectModernSignals(html, siteUrl);
  const outdatedSignals = detectOutdatedSignals(html, siteUrl);

  const findings: HeuristicFindings = {
    modernSignals,
    outdatedSignals,
    freshness: {
      copyrightYear: matchCopyrightYear(html),
      hasMobileViewport: detectMobileViewport(html),
      hasHttps: !siteUrl.startsWith("http://"),
    },
  };

  // Verdict rule from SKILL.md: auto-reject only if ANY modern signal AND ZERO
  // outdated signals. Anything else goes to vision — bias toward keeping leads.
  const verdict =
    modernSignals.length >= 1 && outdatedSignals.length === 0
      ? "auto-reject-modern"
      : "needs-vision";

  return { verdict, findings };
}
