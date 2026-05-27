// Public entrypoints for the scoring layer. Routes per leadType, writes
// results back, transitions status via the state machine, and handles the
// auto-reject threshold. See .claude/skills/lead-scoring/SKILL.md.

import { LeadStatus, LeadType, Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { assertTransition } from "@/lib/utils/statusMachine";
import { scoreNoWebsiteLead } from "./noWebsite";
import { scoreOutdatedWebsiteLead } from "./outdatedWebsite";
import type { ScoringOutcome } from "@/types/scoring";

function rejectThreshold(): number {
  const raw = process.env.SCORING_REJECT_THRESHOLD;
  const parsed = raw ? parseInt(raw, 10) : NaN;
  return Number.isFinite(parsed) ? parsed : 25;
}

export async function scoreLead(leadId: string): Promise<void> {
  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) throw new Error(`scoreLead: lead ${leadId} not found`);

  // Idempotency: don't re-score leads that have already moved past `scraped`.
  if (lead.status !== LeadStatus.scraped) return;

  let outcome: ScoringOutcome;
  if (lead.leadType === LeadType.OUTDATED_WEBSITE) {
    outcome = await scoreOutdatedWebsiteLead(lead);
  } else {
    outcome = await scoreNoWebsiteLead(lead);
  }

  if (outcome.ok) {
    const belowThreshold = outcome.score <= rejectThreshold();
    // First write: scraped -> scored with the score and reasoning
    assertTransition(LeadStatus.scraped, LeadStatus.scored);
    await prisma.lead.update({
      where: { id: leadId },
      data: {
        score: outcome.score,
        scoreReasoning: outcome.reasoning as unknown as Prisma.InputJsonValue,
        existingSiteAnalysisJson: outcome.existingSiteAnalysis
          ? (outcome.existingSiteAnalysis as unknown as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        status: LeadStatus.scored,
      },
    });
    // Second write (only if below threshold): scored -> rejected
    if (belowThreshold) {
      assertTransition(LeadStatus.scored, LeadStatus.rejected);
      await prisma.lead.update({
        where: { id: leadId },
        data: { status: LeadStatus.rejected },
      });
    }
  } else {
    // autoReject: no meaningful score was produced. The state machine
    // allows scraped -> rejected directly per lib/utils/statusMachine.ts.
    assertTransition(LeadStatus.scraped, LeadStatus.rejected);
    await prisma.lead.update({
      where: { id: leadId },
      data: {
        score: null,
        scoreReasoning: outcome.reasoning
          ? (outcome.reasoning as unknown as Prisma.InputJsonValue)
          : ([
              {
                factor: "Auto-reject",
                impact: "negative",
                note: outcome.autoReject.reason,
              },
            ] as unknown as Prisma.InputJsonValue),
        status: LeadStatus.rejected,
      },
    });
  }
}

// Run scoreLead across many leads with bounded concurrency. One failure must
// not kill the batch; failed leads stay at `scraped` for retry.
const MAX_CONCURRENT = 5;

export async function scoreLeadsBatch(leadIds: string[]): Promise<void> {
  if (leadIds.length === 0) return;

  const queue = [...leadIds];
  const workers: Promise<void>[] = [];

  async function runWorker() {
    while (queue.length > 0) {
      const id = queue.shift();
      if (!id) return;
      try {
        await scoreLead(id);
      } catch (err) {
        console.error(
          `[scoring] lead ${id} failed:`,
          err instanceof Error ? err.message : err
        );
        // Leave the lead at `scraped`. Operator can re-trigger later.
      }
    }
  }

  for (let i = 0; i < Math.min(MAX_CONCURRENT, leadIds.length); i++) {
    workers.push(runWorker());
  }

  await Promise.all(workers);
}
