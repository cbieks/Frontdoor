/**
 * Re-score one or more leads in place. Useful for iterating on the scoring
 * prompt without re-running a full scrape.
 *
 * Usage:
 *   npx tsx scripts/rescore.ts <leadId> [<leadId> ...]
 *   npx tsx scripts/rescore.ts --all-scored          (re-score everything that's currently `scored`)
 *   npx tsx scripts/rescore.ts --businessName="Henco" (case-insensitive substring match)
 *
 * Behavior:
 * - Resets the lead's status to `scraped` so scoreLead can re-run the full
 *   pipeline (state machine requires starting from `scraped`).
 * - Calls scoreLeadsBatch with the affected IDs.
 * - Costs a Firecrawl + Sonnet call per outdated-website lead (~$0.035 each).
 */
import "dotenv/config";
import { LeadStatus, Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { scoreLeadsBatch } from "@/lib/scoring";

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('Usage: npx tsx scripts/rescore.ts <leadId> [...] | --all-scored | --businessName="..."');
    process.exit(1);
  }

  let where: Prisma.LeadWhereInput | undefined;
  if (args.includes("--all-scored")) {
    where = { status: LeadStatus.scored };
  } else {
    const nameArg = args.find((a) => a.startsWith("--businessName="));
    if (nameArg) {
      const name = nameArg.split("=").slice(1).join("=").replace(/^["']|["']$/g, "");
      where = { businessName: { contains: name, mode: "insensitive" } };
    }
  }

  let leadIds: string[];
  if (where) {
    const leads = await prisma.lead.findMany({ where, select: { id: true, businessName: true } });
    leadIds = leads.map((l) => l.id);
    console.log(`Matched ${leads.length} lead(s):`);
    leads.forEach((l) => console.log(`  ${l.id}  ${l.businessName}`));
  } else {
    leadIds = args.filter((a) => !a.startsWith("--"));
  }

  if (leadIds.length === 0) {
    console.error("No leads matched.");
    process.exit(1);
  }

  // Reset to `scraped` so scoreLead will re-process. Clear prior reasoning
  // and analysis so the new run writes fresh data.
  await prisma.lead.updateMany({
    where: { id: { in: leadIds } },
    data: {
      status: LeadStatus.scraped,
      score: null,
      scoreReasoning: Prisma.JsonNull,
      existingSiteAnalysisJson: Prisma.JsonNull,
    },
  });

  console.log(`\nRe-scoring ${leadIds.length} lead(s)...`);
  await scoreLeadsBatch(leadIds);

  // Print final states
  const final = await prisma.lead.findMany({
    where: { id: { in: leadIds } },
    select: { id: true, businessName: true, status: true, score: true },
    orderBy: { score: { sort: "desc", nulls: "last" } },
  });
  console.log("\nDone:");
  final.forEach((l) =>
    console.log(`  ${l.businessName.padEnd(50)} ${l.status.padEnd(10)} ${l.score ?? "—"}`)
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
