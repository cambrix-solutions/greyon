/**
 * Capture header-search screenshots at key widths.
 * Usage: node scripts/header-search-screenshots.mjs [baseUrl]
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const baseUrl = (process.argv[2] || "http://127.0.0.1:9000").replace(/\/$/, "");
const outDir = "/opt/cursor/artifacts/screenshots/header-search";
mkdirSync(outDir, { recursive: true });

const widths = [390, 768, 1280, 1440];
const hotelPath = "/hotels/greyon-pp";

const browser = await chromium.launch({ headless: true });

for (const width of widths) {
  const context = await browser.newContext({
    viewport: { width, height: width <= 768 ? 844 : 900 },
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

  const url = `${baseUrl}${hotelPath}`;
  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
    await page.waitForTimeout(1000);

    // Scroll so the page rooms search leaves the viewport and the sticky
    // header compact search (or pill) appears.
    await page.evaluate(() => {
      const rooms = document.getElementById("rooms");
      if (rooms) {
        rooms.scrollIntoView({ block: "start" });
        window.scrollBy(0, 420);
      } else {
        window.scrollBy(0, Math.min(document.body.scrollHeight, 900));
      }
    });
    await page.waitForTimeout(700);

    // Prefer a cropped header shot; fall back to viewport.
    const header = page.locator(".gy-header").first();
    const file = join(outDir, `header-search-${width}.png`);
    if (await header.count()) {
      await header.screenshot({ path: file });
    } else {
      await page.screenshot({ path: file, fullPage: false });
    }
    console.log(`ok header ${width} → ${file}`);

    // At tablet/phone widths, also capture the opened search sheet.
    if (width < 1024) {
      const pill = page.locator(".gy-header__search-pill").first();
      if (await pill.count()) {
        await pill.click({ force: true }).catch(() => {});
        await page.waitForTimeout(500);
        const sheetFile = join(outDir, `header-search-open-${width}.png`);
        await page.screenshot({ path: sheetFile, fullPage: false });
        console.log(`ok open ${width} → ${sheetFile}`);
        await page.keyboard.press("Escape").catch(() => {});
      }
    }
  } catch (e) {
    console.error(`fail ${width}:`, e.message);
  }

  await context.close();
}

await browser.close();
console.log(`done → ${outDir}`);
