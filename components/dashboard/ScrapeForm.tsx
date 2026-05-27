"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type PollResponse = {
  id: string;
  status: "pending" | "running" | "completed" | "failed";
  totalFound: number;
  totalImported: number;
  errorMessage?: string | null;
};

type Phase =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "polling"; jobId: string }
  | { kind: "done"; totalFound: number; totalImported: number }
  | { kind: "error"; message: string };

const POLL_INTERVAL_MS = 1500;

type LeadTypeFilter = "" | "OUTDATED_WEBSITE" | "NO_WEBSITE";

export function ScrapeForm() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [minRating, setMinRating] = useState("3.0");
  const [maxReviewCount, setMaxReviewCount] = useState("500");
  const [maxResults, setMaxResults] = useState("25");
  const [leadTypeFilter, setLeadTypeFilter] = useState<LeadTypeFilter>("");
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    setPhase({ kind: "submitting" });

    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: query.trim(),
          minRating: parseFloat(minRating) || undefined,
          maxReviewCount: parseInt(maxReviewCount, 10) || undefined,
          maxResults: parseInt(maxResults, 10) || undefined,
          leadTypeFilter: leadTypeFilter || undefined,
        }),
      });
      if (!res.ok) throw new Error(`Scrape request failed: ${res.status}`);
      const data = await res.json();
      const jobId = data.jobId as string;
      setPhase({ kind: "polling", jobId });
      pollJob(jobId);
    } catch (err) {
      setPhase({
        kind: "error",
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  function pollJob(jobId: string) {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/scrape/status/${jobId}`);
        if (!res.ok) throw new Error(`Status fetch failed: ${res.status}`);
        const data: PollResponse = await res.json();

        if (data.status === "completed") {
          clearInterval(interval);
          setPhase({
            kind: "done",
            totalFound: data.totalFound,
            totalImported: data.totalImported,
          });
          router.refresh();
        } else if (data.status === "failed") {
          clearInterval(interval);
          setPhase({
            kind: "error",
            message: data.errorMessage ?? "Scrape job failed",
          });
        }
      } catch (err) {
        clearInterval(interval);
        setPhase({
          kind: "error",
          message: err instanceof Error ? err.message : String(err),
        });
      }
    }, POLL_INTERVAL_MS);
  }

  const submitting = phase.kind === "submitting" || phase.kind === "polling";

  return (
    <form onSubmit={submit} className="border border-neutral-200 rounded-lg p-4 bg-white">
      <div className="flex flex-col gap-3 md:flex-row md:items-end">
        <div className="flex-1">
          <label className="block text-xs font-medium text-neutral-600 mb-1">
            Search query
          </label>
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='e.g. "plumbers in Portland OR"'
            required
            disabled={submitting}
          />
        </div>
        <div className="w-24">
          <label className="block text-xs font-medium text-neutral-600 mb-1">Min rating</label>
          <Input
            type="number"
            min="0"
            max="5"
            step="0.1"
            value={minRating}
            onChange={(e) => setMinRating(e.target.value)}
            disabled={submitting}
          />
        </div>
        <div className="w-28">
          <label className="block text-xs font-medium text-neutral-600 mb-1">Max reviews</label>
          <Input
            type="number"
            min="0"
            value={maxReviewCount}
            onChange={(e) => setMaxReviewCount(e.target.value)}
            disabled={submitting}
          />
        </div>
        <div className="w-24">
          <label className="block text-xs font-medium text-neutral-600 mb-1">Max results</label>
          <Input
            type="number"
            min="1"
            max="200"
            value={maxResults}
            onChange={(e) => setMaxResults(e.target.value)}
            disabled={submitting}
          />
        </div>
        <div className="w-44">
          <label className="block text-xs font-medium text-neutral-600 mb-1">Lead type</label>
          <select
            value={leadTypeFilter}
            onChange={(e) => setLeadTypeFilter(e.target.value as LeadTypeFilter)}
            disabled={submitting}
            className="h-9 w-full rounded-md border border-neutral-300 bg-white px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-700 disabled:opacity-50"
          >
            <option value="">Both (default)</option>
            <option value="OUTDATED_WEBSITE">Only outdated-website</option>
            <option value="NO_WEBSITE">Only no-website</option>
          </select>
        </div>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Working…" : "Scrape"}
        </Button>
      </div>
      <PhaseStatus phase={phase} />
    </form>
  );
}

function PhaseStatus({ phase }: { phase: Phase }) {
  if (phase.kind === "idle") return null;
  let text: string;
  let color: string;
  switch (phase.kind) {
    case "submitting":
      text = "Submitting scrape request…";
      color = "text-neutral-600";
      break;
    case "polling":
      text = "Scraping + scoring leads… (this can take 30–90 seconds)";
      color = "text-neutral-600";
      break;
    case "done":
      text = `Done. Found ${phase.totalFound} businesses, imported ${phase.totalImported} new leads.`;
      color = "text-emerald-700";
      break;
    case "error":
      text = `Error: ${phase.message}`;
      color = "text-red-700";
      break;
  }
  return <p className={`mt-3 text-sm ${color}`}>{text}</p>;
}
