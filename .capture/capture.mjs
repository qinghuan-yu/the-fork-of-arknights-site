import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

// 将原站各主分区、手机布局和资源请求保存为本地比对证据。
const out = path.resolve('.capture/evidence');
await fs.mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const assets = new Set();
page.on('response', response => { if (response.url().includes('hycdn.cn')) assets.add(response.url()); });
page.on('pageerror', error => console.log('SOURCE_ERROR', error.message));
await page.goto('https://ak.hypergryph.com/', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.locator('a[href="/#information"]').waitFor({ state: 'visible', timeout: 60000 });
await page.waitForTimeout(4000);
await page.screenshot({ path: path.join(out, 'source-index-desktop.png') });
for (const name of ['information', 'operator', 'world', 'media', 'more']) {
  await page.locator(`a[href="/#${name}"]`).first().click();
  await page.waitForTimeout(1800);
  await page.screenshot({ path: path.join(out, `source-${name}-desktop.png`) });
  await fs.writeFile(path.join(out, `source-${name}.html`), await page.content(), 'utf8');
  console.log('CAPTURED', name);
}
await page.locator('a[href="/#index"]:visible').first().click();
await page.setViewportSize({ width: 390, height: 844 });
await page.waitForTimeout(2000);
await page.screenshot({ path: path.join(out, 'source-index-mobile.png') });
await fs.writeFile(path.join(out, 'source-mobile.html'), await page.content(), 'utf8');
await fs.writeFile(path.join(out, 'resource-urls.json'), JSON.stringify([...assets], null, 2), 'utf8');
console.log('SOURCE_CAPTURE_COMPLETE', assets.size);
await browser.close();
