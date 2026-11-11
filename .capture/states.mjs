import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
const out = path.resolve('.capture/evidence');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const resources = new Set(JSON.parse(await fs.readFile(path.join(out, 'resource-urls.json'), 'utf8')));
const snapshots = [];
page.on('response', async res => {
  if (res.url().includes('hycdn.cn')) resources.add(res.url());
  if (res.url().includes('/api/archive/')) {
    const body = await res.text().catch(() => '');
    snapshots.push({ url: res.url(), body });
  }
});
await page.goto('https://ak.hypergryph.com/', { waitUntil: 'domcontentloaded' });
await page.locator('a[href="/#operator"]:visible').waitFor();
await page.waitForTimeout(2200);
const capture = async name => {
  await page.waitForTimeout(2400);
  await page.screenshot({ path: path.join(out, `source-${name}.png`) });
  await fs.writeFile(path.join(out, `source-${name}.html`), await page.content(), 'utf8');
  console.log('STATE', name);
};
const nav = async name => { await page.locator(`a[href="/#${name}"]:visible`).first().click(); await page.waitForTimeout(1800); };
try {
  await nav('information');
  for (const text of []) {
    await page.getByText(text, { exact: true }).filter({ visible: true }).first().click();
    await capture(`news-${text}`);
  }
  await nav('operator');
  for (const name of []) {
    const choice = page.locator('._61521ab1').filter({ hasText: name });
    await choice.click({ force: true });
    await capture(`operator-${name}`);
  }
  await nav('world');
  for (const name of []) {
    await page.locator('._a34a9a95').filter({hasText: name}).first().click();
    await capture(`world-${name}`);
    await page.getByText('返回', {exact:true}).filter({visible:true}).first().click();
    await page.waitForTimeout(1600);
  }
  await nav('media');
  await page.locator('._7d8e81d6').filter({hasText:'GALLERY'}).click();
  await capture('media-gallery');
  await page.getByText('查看详情', {exact:true}).filter({visible:true}).click();
  await capture('gallery-open');
  await page.getByText('返回', {exact:true}).filter({visible:true}).click();
  await capture('media-back');
  await page.locator('._7d8e81d6').filter({hasText:'VIDEO'}).click();
  await capture('media-video');
  await page.getByText('查看详情', {exact:true}).filter({visible:true}).click();
  await capture('video-open');
  await page.getByText('返回', {exact:true}).filter({visible:true}).click();
  await nav('more');
  await page.getByText('集成战略', {exact:true}).filter({visible:true}).click();
  await capture('more-strategies');
  await page.getByText('返回', {exact:true}).filter({visible:true}).click();
  await page.getByText('生息演算', {exact:true}).filter({visible:true}).click();
  await capture('more-reclamation');
  await nav('index');
  await page.getByRole('button',{name:'PC下载',exact:true}).click();
  await capture('pc-download');
  await page.reload({waitUntil:'domcontentloaded'});
  await page.setViewportSize({width:390,height:844});
  await page.waitForTimeout(3000);
  await page.locator('._d6b1e15c').click();
  await capture('mobile-menu');
  await page.locator('._d6b1e15c').click();
  for (const section of ['information','operator','world','media','more','index']) {
    await page.goto(`https://ak.hypergryph.com/#${section}`);
    await capture(`${section}-mobile`);
  }
} catch (err) {
  console.log('STATE_CAPTURE_NOTE', err.message);
  await capture('last-state');
} finally {
  await fs.writeFile(path.join(out,'resource-urls.json'), JSON.stringify([...resources],null,2),'utf8');
  await fs.writeFile(path.join(out,'api-snapshots.json'), JSON.stringify(snapshots,null,2),'utf8');
  await browser.close();
}
