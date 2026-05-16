import { after } from "next/server";
import { createScrapeJob, runScrapeJob } from "@/lib/scraper";
import type { ScraperOptions } from "@/lib/scraper/types";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (!body?.query || typeof body.query !== "string" || !body.query.trim()) {
    return Response.json({ error: "query is required" }, { status: 400 });
  }

  const options: ScraperOptions = {
    query: body.query.trim(),
    requireNoWebsite: body.requireNoWebsite ?? true,
    minRating: typeof body.minRating === "number" ? body.minRating : undefined,
    maxReviewCount:
      typeof body.maxReviewCount === "number" ? body.maxReviewCount : undefined,
    maxResults:
      typeof body.maxResults === "number" ? body.maxResults : undefined,
  };

  const jobId = await createScrapeJob(options);

  // Respond immediately with the jobId, run the scrape after the response is sent
  after(async () => {
    await runScrapeJob(jobId, options).catch((err) => {
      console.error(`Scrape job ${jobId} failed:`, err);
    });
  });

  return Response.json({ jobId }, { status: 202 });
}
