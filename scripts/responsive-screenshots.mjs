/**
 * Capture responsive screenshots for the audit.
 * Usage: node scripts/responsive-screenshots.mjs <before|after> <baseUrl>
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const phase = process.argv[2] || "after";
const baseUrl = (process.argv[3] || "http://127.0.0.1:9000").replace(/\/$/, "");
const outDir = join(
  "/opt/cursor/artifacts/screenshots",
  phase === "before" ? "before" : "after"
);
mkdirSync(outDir, { recursive: true });

const widths = [390, 768, 1280];
const pages = [
  { name: "home", path: "/" },
  { name: "hotel-shv", path: "/hotels/greyon-shv" },
  { name: "hotel-pp", path: "/hotels/greyon-pp" },
  { name: "booking", path: "/booking" },
  { name: "hotels", path: "/hotels" },
  { name: "apartments", path: "/apartments" },
  { name: "about", path: "/about" }
];

const browser = await chromium.launch({ headless: true });

for (const width of widths) {
  const context = await browser.newContext({
    viewport: { width, height: 844 },
    deviceScaleFactor: 1
  });
  const page = await context.newPage();
  // Clear cookie acceptance so the banner shows for drawer checks on home.
  await page.addInitScript(() => {
    try {
      localStorage.removeItem("greyon_cookie_ok");
    } catch {
      /* ignore */
    }
  });

  for (const route of pages) {
    const url = `${baseUrl}${route.path}`;
    const file = join(outDir, `${route.name}-${width}.png`);
    try {
      await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
      await page.waitForTimeout(800);
      // Open mobile drawer on home @390 for cookie/drawer coverage.
      if (route.name === "home" && width === 390) {
        const menu = page.locator(".gy-menu-btn");
        if (await menu.count()) {
          await menu
            .first()
            .click({ force: true })
            .catch(() => {});
          await page.waitForTimeout(500);
          await page.screenshot({
            path: join(outDir, `home-drawer-${width}.png`),
            fullPage: false
          });
          await page.keyboard.press("Escape").catch(() => {});
        }
      }
      await page.screenshot({ path: file, fullPage: true });
      console.log(`ok ${phase} ${route.name} ${width}`);
    } catch (e) {
      console.error(`fail ${phase} ${route.name} ${width}:`, e.message);
    }
  }

  await context.close();
}

await browser.close();
console.log(`done ${phase} → ${outDir}`);
