"use client";
import { useState } from "react";
import type { LeadStatus } from "@/app/generated/prisma/client";
import { Button } from "@/components/ui/button";

type Props = {
  leadId: string;
  status: LeadStatus;
};

// Generation is gated by the lead status — only `scored` or `approved` leads
// should be candidates. `rejected`/`scraped` are not actionable from this UI.
const GENERATABLE_STATUSES = new Set<LeadStatus>(["scored", "approved"]);

export function GenerateButton({ leadId, status }: Props) {
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<string | undefined>();

  const eligible = GENERATABLE_STATUSES.has(status);

  async function click() {
    setPending(true);
    setFeedback(undefined);
    try {
      const res = await fetch(`/api/leads/${leadId}/generate`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFeedback(data.error ?? `Failed (${res.status})`);
      } else {
        setFeedback("Generation started");
      }
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : "Network error");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button size="sm" disabled={!eligible || pending} onClick={click}>
        {pending ? "…" : "Generate"}
      </Button>
      {feedback ? (
        <span className="text-[10px] text-neutral-500 max-w-[180px] text-right">
          {feedback}
        </span>
      ) : null}
    </div>
  );
}
