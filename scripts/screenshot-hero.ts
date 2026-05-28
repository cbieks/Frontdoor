import "dotenv/config";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { chromium, type Page } from "playwright";

// Captures a frame strip of the marketing hero so Claude (and humans) can
// review the door-scroll animation without watching the whole scroll live.
//
// Usage:  npm run dev   (in another terminal)
//         npm run screens:hero
//
// Output: docs/screens/hero/*.png (one PNG per frame)

const URL = process.env.SCREENSHOT_URL ?? "http://localhost:3000/home";
const OUT_DIR = "docs/screens/hero";
const VIEWPORT = { width: 1440, height: 900 } as const;

type Frame = { name: string; progress: number };

// Progress is fraction of the hero's scroll range, 0 = top of hero, 1 = bottom.
const HERO_FRAMES: Frame[] = [
  { name: "01-top-doors-closed", progress: 0.0 },
  { name: "02-intro-fading", progress: 0.15 },
  { name: "03-doors-parting", progress: 0.3 },
  { name: "04-mid-open", progress: 0.5 },
  { name: "05-payoff-arriving", progress: 0.68 },
  { name: "06-payoff-settled", progress: 0.82 },
  { name: "07-hero-end", progress: 1.0 },
];

async function captureFrame(page: Page, name: string, scrollY: number) {
  // Programmatic scrollTo in headless Chromium doesn't always fire a scroll
  // event that motion's useScroll hears; dispatch one explicitly to be safe.
  await page.evaluate((y) => {
    window.scrollTo({ top: y, behavior: "instant" });
    window.dispatchEvent(new Event("scroll"));
  }, scrollY);
  // Two rAF ticks + a generous timeout so chained useTransform values settle.
  await page.evaluate(
    () => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r()))),
  );
  await page.waitForTimeout(600);
  const file = join(OUT_DIR, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  console.log(`  ✓ ${name}  (scrollY=${Math.round(scrollY)})`);
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  console.log(`screenshotting ${URL} → ${OUT_DIR}`);

  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 1,
    reducedMotion: "no-preference",
  });
  const page = await ctx.newPage();

  try {
    await page.goto(URL, { waitUntil: "networkidle", timeout: 20_000 });
  } catch {
    console.error(`could not load ${URL}. Is \`npm run dev\` running?`);
    await browser.close();
    process.exit(1);
  }

  // Wait for web fonts so headlines aren't FOUT during capture.
  await page.evaluate(() => document.fonts.ready);

  // Scroll range of the hero (#hero section minus one viewport).
  const heroScrollMax = await page.evaluate(() => {
    const hero = document.getElementById("hero");
    if (!hero) return 0;
    return hero.getBoundingClientRect().height - window.innerHeight;
  });

  if (heroScrollMax <= 0) {
    console.error("hero section not found, or shorter than viewport");
    await browser.close();
    process.exit(1);
  }

  for (const frame of HERO_FRAMES) {
    await captureFrame(page, frame.name, frame.progress * heroScrollMax);
  }

  // One additional frame past the hero, showing the bridge transition.
  await captureFrame(page, "08-past-hero-bridge", heroScrollMax + VIEWPORT.height * 0.6);

  await browser.close();
  console.log("done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
