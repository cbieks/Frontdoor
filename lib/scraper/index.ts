import { LeadType, Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { searchPlaces } from "./googlePlaces";
import type { ScraperOptions, ScrapeResult } from "./types";

// Runs the full scrape job lifecycle:
// 1. Marks job as running
// 2. Fetches results from Google Places
// 3. Applies operator filters (rating/review-count) and drops non-operational listings
// 4. Classifies each result by leadType (website presence) — no scrape-time filter on type
// 5. Deduplicates against existing leads by googlePlaceId
// 6. Bulk-inserts new leads with all enriched data
// 7. Hands the new lead IDs to the scoring layer (called below)
// 8. Marks job completed (or failed)
export async function runScrapeJob(
  jobId: string,
  options: ScraperOptions
): Promise<ScrapeResult> {
  await prisma.scrapeJob.update({
    where: { id: jobId },
    data: { status: "running", startedAt: new Date() },
  });

  try {
    // Over-fetch from Google when a leadTypeFilter is set so the post-classify
    // filter has room to find matches. Hard cap at 100 to prevent runaway
    // Places API spend.
    const targetResults =
      options.maxResults ?? parseInt(process.env.SCRAPER_MAX_RESULTS ?? "50", 10);
    const fetchTarget = options.leadTypeFilter
      ? Math.min(targetResults * 3, 100)
      : targetResults;

    const raw = await searchPlaces({ ...options, maxResults: fetchTarget });
    const totalFound = raw.length;

    let filtered = raw.filter((b) => {
      if (b.businessStatus && b.businessStatus !== "OPERATIONAL") return false;
      if (options.minRating !== undefined && (b.rating ?? 0) < options.minRating)
        return false;
      if (
        options.maxReviewCount !== undefined &&
        (b.reviewCount ?? 0) > options.maxReviewCount
      )
        return false;
      return true;
    });

    if (options.leadTypeFilter) {
      const wantWebsite = options.leadTypeFilter === "OUTDATED_WEBSITE";
      filtered = filtered.filter((b) => Boolean(b.website) === wantWebsite);
    }

    // Cap at the user's requested maxResults — over-fetched extras are dropped here.
    filtered = filtered.slice(0, targetResults);

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

    const newBusinesses = filtered.filter(
      (b) => !existingIds.has(b.googlePlaceId)
    );

    if (newBusinesses.length > 0) {
      await prisma.lead.createMany({
        data: newBusinesses.map((b) => ({
          googlePlaceId: b.googlePlaceId,
          businessName: b.businessName,
          address: b.address,
          phone: b.phone,
          category: b.category,
          rating: b.rating,
          reviewCount: b.reviewCount,
          website: b.website,
          leadType: b.website ? LeadType.OUTDATED_WEBSITE : LeadType.NO_WEBSITE,
          scrapeJobId: jobId,
          status: "scraped",
          photosJson: b.photos.length > 0 ? (b.photos as unknown as Prisma.InputJsonValue) : Prisma.JsonNull,
          reviewsJson: b.reviews.length > 0 ? (b.reviews as unknown as Prisma.InputJsonValue) : Prisma.JsonNull,
        })),
      });
    }

    const totalImported = newBusinesses.length;

    // Score the newly inserted leads. createMany doesn't return IDs, so re-fetch.
    // Scoring runs inside the existing `after()`-deferred job per ADR-0003,
    // so POST /api/scrape stays fast. We import lazily to keep the dep graph
    // clean — scraper doesn't strictly require scoring to be present.
    if (totalImported > 0) {
      const inserted = await prisma.lead.findMany({
        where: { googlePlaceId: { in: newBusinesses.map((b) => b.googlePlaceId) } },
        select: { id: true },
      });
      const { scoreLeadsBatch } = await import("@/lib/scoring");
      await scoreLeadsBatch(inserted.map((l) => l.id));
    }

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
  const job = await prisma.scrapeJob.create({
    data: {
      query: options.query,
      filters: {
        minRating: options.minRating ?? null,
        maxReviewCount: options.maxReviewCount ?? null,
        maxResults: options.maxResults ?? null,
      },
      status: "pending",
    },
  });
  return job.id;
}
