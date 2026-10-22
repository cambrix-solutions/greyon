/**
 * Capture header search trigger + dialog screenshots (viewport, not full-page).
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

async function ensureTrigger(page) {
  // /hotels always shows the compact trigger (no in-page search).
  await page.goto(`${baseUrl}/hotels`, {
    waitUntil: "networkidle",
    timeout: 60000
  });
  await page.waitForTimeout(700);
}

async function openSearch(page, width) {
  if (width < 1024) {
    const pill = page.locator(".gy-header__search-pill").first();
    await pill.waitFor({ state: "visible", timeout: 10000 });
    await pill.click();
  } else {
    const trigger = page.locator(".gy-header__search-trigger").first();
    await trigger.waitFor({ state: "visible", timeout: 10000 });
    await trigger.click();
  }
  await page.waitForTimeout(500);
  await page.locator(".gy-header-search-sheet").waitFor({
    state: "visible",
    timeout: 5000
  });
}

const shots = [
  { width: 1024, height: 900, tag: "1024" },
  { width: 1440, height: 900, tag: "1440" },
  { width: 390, height: 844, tag: "390" }
];

for (const { width, height, tag } of shots) {
  await withPage(width, height, async page => {
    await ensureTrigger(page);
    const triggerFile = join(outDir, `trigger-${tag}.png`);
    await page.screenshot({ path: triggerFile, fullPage: false });
    console.log(`ok trigger ${tag} → ${triggerFile}`);

    await openSearch(page, width);
    const dialogFile = join(outDir, `dialog-${tag}.png`);
    await page.screenshot({ path: dialogFile, fullPage: false });
    console.log(`ok dialog ${tag} → ${dialogFile}`);
  });
}

// Extra: 1280 trigger + dialog for the mid desktop check
await withPage(1280, 900, async page => {
  await ensureTrigger(page);
  await page.screenshot({
    path: join(outDir, "trigger-1280.png"),
    fullPage: false
  });
  await openSearch(page, 1280);
  await page.screenshot({
    path: join(outDir, "dialog-1280.png"),
    fullPage: false
  });
  console.log("ok 1280 trigger + dialog");
});

await browser.close();
console.log(`done → ${outDir}`);
