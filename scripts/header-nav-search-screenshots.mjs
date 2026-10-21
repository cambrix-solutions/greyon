/**
 * Capture header nav + search trigger screenshots (viewport, not full-page).
 * Usage: node scripts/header-nav-search-screenshots.mjs [baseUrl]
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const baseUrl = (process.argv[2] || "http://127.0.0.1:9000").replace(/\/$/, "");
const outDir = "/opt/cursor/artifacts/screenshots/header-nav-search";
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });

async function withPage(width, height, run) {
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 1
  });
  const page = await context.newPage();
  await page.addInitScript(() => {
    try {
      localStorage.setItem("greyon_cookie_ok", "1");
    } catch {
      /* ignore */
    }
  });
  try {
    await run(page);
  } finally {
    await context.close();
  }
}

async function scrollPastPageSearch(page) {
  await page.evaluate(() => {
    const search =
      document.querySelector("[data-gy-page-search]") ||
      document.querySelector(".gy-search");
    if (search) {
      const top = search.getBoundingClientRect().top + window.scrollY;
      window.scrollTo(0, top + search.getBoundingClientRect().height + 80);
      return;
    }
    window.scrollBy(
      0,
      Math.min(document.body.scrollHeight, window.innerHeight + 200)
    );
  });
  await page.waitForTimeout(700);
}

// Home scrolled — 1280 (pill with text) and 1440
for (const width of [1280, 1440]) {
  await withPage(width, 900, async page => {
    await page.goto(`${baseUrl}/`, {
      waitUntil: "networkidle",
      timeout: 60000
    });
    await page.waitForTimeout(800);
    await scrollPastPageSearch(page);
    const file = join(outDir, `home-scrolled-${width}.png`);
    await page.screenshot({ path: file, fullPage: false });
    console.log(`ok home scrolled ${width} → ${file}`);
  });
}

// Hotels list — 1280
await withPage(1280, 900, async page => {
  await page.goto(`${baseUrl}/hotels`, {
    waitUntil: "networkidle",
    timeout: 60000
  });
  await page.waitForTimeout(800);
  await scrollPastPageSearch(page);
  const file = join(outDir, `hotels-1280.png`);
  await page.screenshot({ path: file, fullPage: false });
  console.log(`ok hotels 1280 → ${file}`);
});

// Search dialog open — 1280
await withPage(1280, 900, async page => {
  await page.goto(`${baseUrl}/hotels`, {
    waitUntil: "networkidle",
    timeout: 60000
  });
  await page.waitForTimeout(800);
  await scrollPastPageSearch(page);
  const trigger = page.locator(".gy-header__search-trigger").first();
  await trigger.waitFor({ state: "visible", timeout: 10000 });
  await trigger.click();
  await page.waitForTimeout(600);
  const file = join(outDir, `search-dialog-open-1280.png`);
  await page.screenshot({ path: file, fullPage: false });
  console.log(`ok search dialog → ${file}`);
});

await browser.close();
console.log(`done → ${outDir}`);
