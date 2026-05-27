import type { RawBusiness, RawPhoto, RawReview, ScraperOptions } from "./types";

const BASE_URL = "https://places.googleapis.com/v1/places:searchText";

// Fields we request — covers everything in the Lead model plus the data
// generation will consume later (photos, reviews). Places API bills per field
// mask, so we ask only for what we use downstream.
const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.nationalPhoneNumber",
  "places.rating",
  "places.userRatingCount",
  "places.websiteUri",
  "places.primaryTypeDisplayName",
  "places.businessStatus",
  "places.editorialSummary",
  "places.photos",
  "places.reviews",
  "nextPageToken",
].join(",");

type PlacesTextSearchResponse = {
  places?: PlaceResult[];
  nextPageToken?: string;
};

type PlaceResult = {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  nationalPhoneNumber?: string;
  rating?: number;
  userRatingCount?: number;
  websiteUri?: string;
  primaryTypeDisplayName?: { text: string };
  businessStatus?: string;
  editorialSummary?: { text?: string; languageCode?: string };
  photos?: RawPhoto[];
  reviews?: RawReview[];
};

async function searchPage(
  query: string,
  apiKey: string,
  pageToken?: string
): Promise<{ places: RawBusiness[]; nextPageToken?: string }> {
  const body: Record<string, unknown> = {
    textQuery: query,
    maxResultCount: 20,
  };
  if (pageToken) body.pageToken = pageToken;

  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": FIELD_MASK,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Places API error ${res.status}: ${text}`);
  }

  const data: PlacesTextSearchResponse = await res.json();

  const places: RawBusiness[] = (data.places ?? []).map((p) => ({
    googlePlaceId: p.id,
    businessName: p.displayName?.text ?? "Unknown",
    address: p.formattedAddress ?? null,
    phone: p.nationalPhoneNumber ?? null,
    category: p.primaryTypeDisplayName?.text ?? null,
    rating: p.rating ?? null,
    reviewCount: p.userRatingCount ?? null,
    website: p.websiteUri ?? null,
    businessStatus: p.businessStatus ?? null,
    editorialSummary: p.editorialSummary?.text ?? null,
    photos: p.photos ?? [],
    reviews: p.reviews ?? [],
  }));

  return { places, nextPageToken: data.nextPageToken };
}

export async function searchPlaces(
  options: ScraperOptions
): Promise<RawBusiness[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_PLACES_API_KEY is not set");

  const maxResults =
    options.maxResults ??
    parseInt(process.env.SCRAPER_MAX_RESULTS ?? "50", 10);

  const all: RawBusiness[] = [];
  let pageToken: string | undefined;

  while (all.length < maxResults) {
    const { places, nextPageToken } = await searchPage(
      options.query,
      apiKey,
      pageToken
    );

    all.push(...places);

    if (!nextPageToken || all.length >= maxResults) break;
    pageToken = nextPageToken;

    // Brief pause between paginated requests to respect API rate limits
    await new Promise((r) => setTimeout(r, 150));
  }

  return all.slice(0, maxResults);
}
