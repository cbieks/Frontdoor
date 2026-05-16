import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  ctx: RouteContext<"/api/scrape/status/[jobId]">
) {
  const { jobId } = await ctx.params;

  const job = await prisma.scrapeJob.findUnique({
    where: { id: jobId },
    select: {
      id: true,
      query: true,
      status: true,
      totalFound: true,
      totalImported: true,
      errorMessage: true,
      startedAt: true,
      completedAt: true,
      createdAt: true,
    },
  });

  if (!job) {
    return Response.json({ error: "Job not found" }, { status: 404 });
  }

  return Response.json(job);
}
