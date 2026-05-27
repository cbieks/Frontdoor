// Path A: scoring for leads with no existing website.
// Deterministic auto-reject first (no LLM cost), then a single Haiku call
// with cached system prompt. See .claude/skills/lead-scoring/SKILL.md.

import type { Lead } from "@/app/generated/prisma/client";
import { anthropic } from "@/lib/anthropic";
import { NO_WEBSITE_SYSTEM_PROMPT, buildNoWebsiteUserMessage } from "./prompts";
import {
  isScoreReasoning,
  type ScoreFactor,
  type ScoringOutcome,
} from "@/types/scoring";

function checkDeterministicReject(lead: Lead): string | undefined {
  if (lead.rating !== null && lead.rating < 3.0) {
    return `rating-too-low: ${lead.rating}`;
  }
  if (lead.reviewCount !== null && lead.reviewCount > 2000) {
    return `chain-or-franchise: ${lead.reviewCount} reviews`;
  }
  const photoCount = Array.isArray(lead.photosJson) ? (lead.photosJson as unknown[]).length : 0;
  // ghost-listing: very few reviews, no photos, no hours signal
  if ((lead.reviewCount ?? 0) < 3 && photoCount === 0) {
    return "ghost-listing: minimal Google Places presence";
  }
  return undefined;
}

type HaikuOutput = {
  score: number;
  reasoning: ScoreFactor[];
};

function isHaikuOutput(value: unknown): value is HaikuOutput {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  if (typeof v.score !== "number" || v.score < 0 || v.score > 100) return false;
  return isScoreReasoning(v.reasoning);
}

export async function scoreNoWebsiteLead(lead: Lead): Promise<ScoringOutcome> {
  const rejectReason = checkDeterministicReject(lead);
  if (rejectReason) {
    return {
      ok: false,
      autoReject: { reason: rejectReason },
      reasoning: [
        {
          factor: "Deterministic filter",
          impact: "negative",
          note: rejectReason,
        },
      ],
    };
  }

  const model = process.env.ANTHROPIC_SCORING_MODEL ?? "claude-haiku-4-5-20251001";

  const response = await anthropic.messages.create({
    model,
    max_tokens: 600,
    system: [
      {
        type: "text",
        text: NO_WEBSITE_SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [
      {
        role: "user",
        content: buildNoWebsiteUserMessage(lead),
      },
    ],
  });

  // Pull the text from the first text block
  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Haiku returned no text content for lead " + lead.id);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(stripJsonFences(textBlock.text));
  } catch (err) {
    throw new Error(
      `Haiku returned invalid JSON for lead ${lead.id}: ${textBlock.text.slice(0, 200)}`
    );
  }

  if (!isHaikuOutput(parsed)) {
    throw new Error(
      `Haiku output failed validation for lead ${lead.id}: ${JSON.stringify(parsed).slice(0, 200)}`
    );
  }

  return {
    ok: true,
    score: Math.round(parsed.score),
    reasoning: parsed.reasoning,
  };
}

function stripJsonFences(text: string): string {
  const trimmed = text.trim();
  if (trimmed.startsWith("```")) {
    return trimmed.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
  }
  return trimmed;
}
