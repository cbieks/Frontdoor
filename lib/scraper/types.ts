export type ScraperOptions = {
  query: string;
  maxResults?: number;         // default: SCRAPER_MAX_RESULTS env var or 50
  minRating?: number;          // optional minimum rating filter
  maxReviewCount?: number;     // optional ceiling (avoid huge chains)
  leadTypeFilter?: "OUTDATED_WEBSITE" | "NO_WEBSITE";
                               // undefined = both (default); when set, the scraper
                               // over-fetches from Google and keeps only matches
};

export type RawPhoto = {
  name: string;                // "places/<id>/photos/<photo_id>"
  widthPx?: number;
  heightPx?: number;
  authorAttributions?: { displayName?: string; uri?: string; photoUri?: string }[];
};

export type RawReview = {
  name?: string;
  rating?: number;
  text?: { text?: string; languageCode?: string };
  authorAttribution?: { displayName?: string; uri?: string; photoUri?: string };
  publishTime?: string;
  relativePublishTimeDescription?: string;
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
  businessStatus: string | null;
  editorialSummary: string | null;
  photos: RawPhoto[];
  reviews: RawReview[];
};

export type ScrapeResult = {
  jobId: string;
  totalFound: number;
  totalImported: number;
};
