import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, LeadStatus, Prisma } from "../app/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const JsonNull = Prisma.JsonNull;

const SEED_LEADS = [
  {
    businessName: "Rosario's Tacos",
    address: "1234 SE Division St, Portland, OR 97202",
    phone: "(503) 555-0101",
    category: "Mexican Restaurant",
    rating: 4.6,
    reviewCount: 312,
    website: null,
    googlePlaceId: "seed_place_001",
    status: LeadStatus.scored,
    score: 87,
    scoreReasoning: [
      { factor: "No website", impact: "positive", note: "Strong signal — no online presence" },
      { factor: "High rating", impact: "positive", note: "4.6 stars with 312 reviews" },
      { factor: "Review volume", impact: "positive", note: "Active, established business" },
    ],
  },
  {
    businessName: "Green Leaf Hair Studio",
    address: "890 NW 23rd Ave, Portland, OR 97210",
    phone: "(503) 555-0202",
    category: "Hair Salon",
    rating: 4.8,
    reviewCount: 156,
    website: null,
    googlePlaceId: "seed_place_002",
    status: LeadStatus.approved,
    score: 91,
    scoreReasoning: [
      { factor: "No website", impact: "positive", note: "No online presence at all" },
      { factor: "Excellent rating", impact: "positive", note: "4.8 stars" },
      { factor: "Service business", impact: "positive", note: "Salons benefit greatly from online booking" },
    ],
  },
  {
    businessName: "Pacific Rim Auto Repair",
    address: "5678 Sandy Blvd, Portland, OR 97213",
    phone: "(503) 555-0303",
    category: "Auto Repair",
    rating: 4.3,
    reviewCount: 89,
    website: null,
    googlePlaceId: "seed_place_003",
    status: LeadStatus.scraped,
    score: null,
    scoreReasoning: JsonNull,
  },
  {
    businessName: "Burnside Brew & Bites",
    address: "400 E Burnside St, Portland, OR 97214",
    phone: "(503) 555-0404",
    category: "Bar & Grill",
    rating: 4.1,
    reviewCount: 204,
    website: null,
    googlePlaceId: "seed_place_004",
    status: LeadStatus.contacted,
    score: 79,
    scoreReasoning: [
      { factor: "No website", impact: "positive", note: "No web presence found" },
      { factor: "Moderate rating", impact: "neutral", note: "4.1 — decent but not exceptional" },
      { factor: "High review count", impact: "positive", note: "Active customer base" },
    ],
    demoUrl: "/preview/burnside-brew-bites",
  },
  {
    businessName: "Mt. Tabor Cleaners",
    address: "6001 SE Hawthorne Blvd, Portland, OR 97215",
    phone: "(503) 555-0505",
    category: "Dry Cleaning",
    rating: 3.9,
    reviewCount: 41,
    website: "https://mttabordrycleaning.com",
    googlePlaceId: "seed_place_005",
    status: LeadStatus.rejected,
    score: 18,
    scoreReasoning: [
      { factor: "Has website", impact: "negative", note: "Already has an established website" },
      { factor: "Low review count", impact: "negative", note: "41 reviews suggests lower engagement" },
    ],
  },
];

async function main() {
  console.log("Seeding database...");

  // Clear existing seed data
  await prisma.lead.deleteMany({
    where: { googlePlaceId: { startsWith: "seed_place_" } },
  });

  // Create a seed scrape job
  const scrapeJob = await prisma.scrapeJob.create({
    data: {
      query: "restaurants and service businesses in Portland OR",
      category: "various",
      location: "Portland, OR",
      status: "completed",
      totalFound: 5,
      totalImported: 5,
      startedAt: new Date(Date.now() - 5 * 60 * 1000),
      completedAt: new Date(),
    },
  });

  // Create leads
  for (const lead of SEED_LEADS) {
    await prisma.lead.create({
      data: {
        ...lead,
        scrapeJobId: scrapeJob.id,
      },
    });
  }

  console.log(`Seeded ${SEED_LEADS.length} leads with 1 scrape job.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
