import { Firecrawl } from "@mendable/firecrawl-js";

const globalForFirecrawl = globalThis as unknown as {
  firecrawl: Firecrawl | undefined;
};

function createFirecrawlClient() {
  if (!process.env.FIRECRAWL_API_KEY) {
    throw new Error("FIRECRAWL_API_KEY is not set");
  }
  return new Firecrawl(process.env.FIRECRAWL_API_KEY);
}

export const firecrawl = globalForFirecrawl.firecrawl ?? createFirecrawlClient();

if (process.env.NODE_ENV !== "production") globalForFirecrawl.firecrawl = firecrawl;
