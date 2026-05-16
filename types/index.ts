export type {
  Lead,
  ScrapeJob,
  DemoSite,
  Payment,
  Deployment,
  LeadStatus,
  ScrapeJobStatus,
  DemoSiteStatus,
  PaymentStatus,
  DomainStatus,
  DeploymentStatus,
} from "@/app/generated/prisma/client";

// ─── Extended types used across the app ──────────────────────────────────────

export type ScoreReasoningEntry = {
  factor: string;
  impact: "positive" | "negative" | "neutral";
  note: string;
};

// Lead with all relations loaded
export type LeadWithRelations = import("@/app/generated/prisma/client").Lead & {
  scrapeJob?: import("@/app/generated/prisma/client").ScrapeJob | null;
  demoSite?: import("@/app/generated/prisma/client").DemoSite | null;
  payment?: import("@/app/generated/prisma/client").Payment | null;
  deployment?: import("@/app/generated/prisma/client").Deployment | null;
};

// Paginated API response envelope
export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

// Generic API error response
export type ApiError = {
  error: string;
  details?: string;
};
