import { chromium } from "playwright-core";

const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });

const errors = [];
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
page.on("console", (m) => m.type() === "error" && errors.push(`console: ${m.text()}`));

await page.goto("http://localhost:5173", { waitUntil: "networkidle" });
await page.waitForSelector("text=Lumina", { timeout: 15000 });
await page.waitForTimeout(1600); // let stagger/number animations settle
await page.screenshot({ path: "/tmp/lumina-dashboard.png" });

// Expenses tab with a filter applied
await page.click("text=Expenses");
await page.waitForSelector("text=Filters");
await page.click("aside >> text=Grocery");
await page.waitForTimeout(800);
await page.screenshot({ path: "/tmp/lumina-expenses.png" });

// Groups tab
await page.click("nav >> text=Groups");
await page.waitForTimeout(900);
await page.screenshot({ path: "/tmp/lumina-groups.png" });

// Settle up drawer from dashboard
await page.click("nav >> text=Dashboard");
await page.waitForTimeout(600);
await page.click("text=Settle up");
await page.waitForTimeout(900);
await page.screenshot({ path: "/tmp/lumina-settle.png" });

console.log(errors.length ? `ERRORS:\n${errors.join("\n")}` : "no console errors");
await browser.close();
