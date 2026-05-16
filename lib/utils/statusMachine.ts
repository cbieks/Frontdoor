import { LeadStatus } from "@/app/generated/prisma/client";

// Valid forward transitions for Lead.status.
// Only transitions listed here are allowed via API routes.
const TRANSITIONS: Partial<Record<LeadStatus, LeadStatus[]>> = {
  [LeadStatus.scraped]:        [LeadStatus.scored, LeadStatus.rejected],
  [LeadStatus.scored]:         [LeadStatus.approved, LeadStatus.rejected],
  [LeadStatus.approved]:       [LeadStatus.demo_generated, LeadStatus.rejected],
  [LeadStatus.demo_generated]: [LeadStatus.contacted, LeadStatus.rejected],
  [LeadStatus.contacted]:      [LeadStatus.interested, LeadStatus.rejected],
  [LeadStatus.interested]:     [LeadStatus.paid, LeadStatus.rejected],
  [LeadStatus.paid]:           [LeadStatus.deployed],
  // rejected and deployed are terminal — no outbound transitions
};

export function canTransition(from: LeadStatus, to: LeadStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTransition(from: LeadStatus, to: LeadStatus): void {
  if (!canTransition(from, to)) {
    throw new Error(
      `Invalid status transition: ${from} → ${to}`
    );
  }
}

export function nextStatuses(from: LeadStatus): LeadStatus[] {
  return TRANSITIONS[from] ?? [];
}
