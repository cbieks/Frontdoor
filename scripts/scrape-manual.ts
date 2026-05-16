/**
 * Manual scrape runner — use this to test scraping without the dashboard.
 *
 * Usage:
 *   npx tsx scripts/scrape-manual.ts "restaurants in Portland OR"
 *   npx tsx scripts/scrape-manual.ts "hair salons in Austin TX" --min-rating 4.0 --max-results 20
 */
import "dotenv/config";
import { createScrapeJob, runScrapeJob } from "@/lib/scraper";

async function main() {
  const args = process.argv.slice(2);
  const query = args.find((a) => !a.startsWith("--"));

  if (!query) {
    console.error('Usage: npx tsx scripts/scrape-manual.ts "query string"');
    process.exit(1);
  }

  const minRatingArg = args.find((a) => a.startsWith("--min-rating="));
  const maxResultsArg = args.find((a) => a.startsWith("--max-results="));
  const includeWithWebsite = args.includes("--include-with-website");

  const options = {
    query,
    requireNoWebsite: !includeWithWebsite,
    minRating: minRatingArg ? parseFloat(minRatingArg.split("=")[1]) : undefined,
    maxResults: maxResultsArg ? parseInt(maxResultsArg.split("=")[1], 10) : undefined,
  };

  console.log(`Starting scrape: "${query}"`);
  console.log("Options:", options);

  const jobId = await createScrapeJob(options);
  console.log(`Job created: ${jobId}`);

  const result = await runScrapeJob(jobId, options);

  console.log(`\nDone.`);
  console.log(`  Found:    ${result.totalFound} businesses`);
  console.log(`  Imported: ${result.totalImported} new leads`);
  console.log(`  Skipped:  ${result.totalFound - result.totalImported} (duplicates or filtered)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
