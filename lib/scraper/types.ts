export type ScraperOptions = {
  query: string;
  maxResults?: number;         // default: SCRAPER_MAX_RESULTS env var or 50
  requireNoWebsite?: boolean;  // default: true — filter out leads with existing sites
  minRating?: number;          // optional minimum rating filter
  maxReviewCount?: number;     // optional ceiling (avoid huge chains)
};

// Raw business data returned by the Places API before any DB mapping
export type RawBusiness = {
  googlePlaceId: string;
  businessName: string;
  address: string | null;
  phone: string | null;
  category: string | null;
  rating: number | null;
  reviewCount: number | null;
  website: string | null;
};

export type ScrapeResult = {
  jobId: string;
  totalFound: number;
  totalImported: number;
};
