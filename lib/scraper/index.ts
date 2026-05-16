import { prisma } from "@/lib/prisma";
import { searchPlaces } from "./googlePlaces";
import type { ScraperOptions, ScrapeResult } from "./types";

// Runs the full scrape job lifecycle:
// 1. Marks job as running
// 2. Fetches results from Google Places
// 3. Applies filters (no website, min rating, etc.)
// 4. Deduplicates against existing leads by googlePlaceId
// 5. Bulk-inserts new leads
// 6. Marks job completed (or failed)
export async function runScrapeJob(
  jobId: string,
  options: ScraperOptions
): Promise<ScrapeResult> {
  await prisma.scrapeJob.update({
    where: { id: jobId },
    data: { status: "running", startedAt: new Date() },
  });

  try {
    const raw = await searchPlaces(options);
    const totalFound = raw.length;

    // Apply filters
    const filtered = raw.filter((b) => {
      if (options.requireNoWebsite !== false && b.website) return false;
      if (options.minRating !== undefined && (b.rating ?? 0) < options.minRating)
        return false;
      if (
        options.maxReviewCount !== undefined &&
        (b.reviewCount ?? 0) > options.maxReviewCount
      )
        return false;
      return true;
    });

    // Deduplicate against existing leads
    const existingIds = new Set(
      (
        await prisma.lead.findMany({
          where: {
            googlePlaceId: { in: filtered.map((b) => b.googlePlaceId) },
          },
          select: { googlePlaceId: true },
        })
      ).map((l) => l.googlePlaceId)
    );

    const newLeads = filtered.filter(
      (b) => !existingIds.has(b.googlePlaceId)
    );

    // Bulk insert
    if (newLeads.length > 0) {
      await prisma.lead.createMany({
        data: newLeads.map((b) => ({
          ...b,
          scrapeJobId: jobId,
          status: "scraped",
        })),
      });
    }

    const totalImported = newLeads.length;

    await prisma.scrapeJob.update({
      where: { id: jobId },
      data: {
        status: "completed",
        totalFound,
        totalImported,
        completedAt: new Date(),
      },
    });

    return { jobId, totalFound, totalImported };
  } catch (err) {
    await prisma.scrapeJob.update({
      where: { id: jobId },
      data: {
        status: "failed",
        errorMessage: err instanceof Error ? err.message : String(err),
        completedAt: new Date(),
      },
    });
    throw err;
  }
}

// Creates the ScrapeJob record and returns the jobId.
// The caller is responsible for running runScrapeJob() after responding.
export async function createScrapeJob(options: ScraperOptions): Promise<string> {
  // Attempt to extract category and location from the free-text query
  const job = await prisma.scrapeJob.create({
    data: {
      query: options.query,
      filters: {
        requireNoWebsite: options.requireNoWebsite ?? true,
        minRating: options.minRating ?? null,
        maxReviewCount: options.maxReviewCount ?? null,
        maxResults: options.maxResults ?? null,
      },
      status: "pending",
    },
  });
  return job.id;
}
