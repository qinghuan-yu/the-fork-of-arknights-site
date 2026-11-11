import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
const out = path.resolve('.capture/evidence');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const errors = [], failed = [], external = [], api = [], checks = [];
await context.route('**/*', route => {
  const url = route.request().url();
  if (/^https?:/.test(url) && !url.startsWith('http://127.0.0.1:4173/')) {
    external.push(url); return route.abort();
  }
  if (url.includes('/api/')) api.push(url);
  return route.continue();
});
const page = await context.newPage();
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
page.on('response', r => { if (r.status() >= 400) failed.push(r.status() + ' ' + r.url()); });
const check = (name, passed, detail) => {
  checks.push({ name, passed, detail });
  console.log(passed ? 'PASS' : 'FAIL', name);
};
const snapshot = async name => {
  check(name + ': only local navigation', await page.locator('a[href]').evaluateAll(
    as => as.every(a => a.getAttribute('href').startsWith('/#'))));
  check(name + ': removed service UI', await page.locator('body').evaluate(body =>
    !/PC下载|立即下载|适龄提示|登录|注册|充值|客服|CUSTOMER SERVICE|TOOLBOX|活动主题网站|视频列表|衍生动画|泰拉记事社/.test(body.innerText)));
  check(name + ': no missing images', await page.locator('img').evaluateAll(imgs =>
    imgs.filter(i => i.offsetWidth && i.getBoundingClientRect().width > 0).every(i => i.complete && i.naturalWidth)));
};
const nav = async id => {
  await page.goto('http://127.0.0.1:4173/#' + id);
  await page.waitForTimeout(2000);
};
try {
  await nav('index');
  await page.locator('.local-footer').waitFor({ state: 'attached' });
  await page.waitForTimeout(3000);
  await snapshot('desktop home');
  check('home download and QR removed', await page.locator('._e32dd037, ._d16ac76f').count() === 0);
  check('header only sound button', await page.locator('._149a6e98 > ._950ab946').count() === 1);
  const music = page.locator('._149a6e98 > ._950ab946');
  const before = await music.getAttribute('class');
  await music.click();
  check('music toggle', before !== await music.getAttribute('class'));
  await music.click();
  check('home background video', await page.locator('video').first().evaluate(v => v.readyState >= 2 && v.currentTime > 0));
  await page.screenshot({ path: path.join(out, 'frontend-home-desktop.png') });
  for (const id of ['information', 'operator', 'world', 'media', 'more']) {
    await page.locator(`a[href="/#${id}"]:visible`).first().click();
    await page.waitForTimeout(1800);
    check('navigation ' + id, new URL(page.url()).hash === '#' + id);
    await snapshot('desktop ' + id);
  }
  check('two local more cards', await page.locator('._d65113f0 > ._638366ab').count() === 2);
  await page.screenshot({ path: path.join(out, 'frontend-more-desktop.png') });
  for (const name of ['集成战略', '生息演算']) {
    await page.getByText(name, { exact: true }).filter({ visible: true }).click();
    await page.waitForTimeout(1500);
    await snapshot(name);
    await page.getByText('返回', { exact: true }).filter({ visible: true }).click();
    await page.waitForTimeout(1000);
  }
  await nav('information');
  for (const title of ['公告', '活动', '新闻']) {
    await page.locator('._5adb7306').filter({ hasText: title }).click();
    await page.waitForTimeout(700);
    check('news category ' + title, (await page.locator('._5adb7306').filter({ hasText: title }).getAttribute('class')).includes('_1d83b18b'));
  }
  check('news and banners are static', await page.locator('a._b6f1b9e5, a._c684c97a').count() === 0);
  await nav('operator');
  for (const name of ['阿米娅', '陈', '德克萨斯', '能天使', '白面鸮', '凯尔希']) {
    await page.locator('._61521ab1').filter({ hasText: name }).click({ force: true });
    await page.waitForTimeout(700);
    check('operator ' + name, (await page.locator('._bc966073').textContent()).includes(name));
  }
  await nav('world');
  await page.locator('._a34a9a95').filter({ hasText: '源石' }).first().click();
  await page.waitForTimeout(1600);
  check('world detail and particles', await page.locator('canvas').count() > 0 && await page.getByText('返回', { exact: true }).filter({ visible: true }).count() === 1);
  await page.getByText('返回', { exact: true }).filter({ visible: true }).click();
  await nav('media');
  check('only local media options', JSON.stringify(await page.locator('._7409d88d > ._7d8e81d6').allTextContents()) === JSON.stringify(['GALLERY', 'VIDEO']));
  await page.screenshot({ path: path.join(out, 'frontend-media-desktop.png') });
  for (const name of ['GALLERY', 'VIDEO']) {
    await page.locator('._7d8e81d6').filter({ hasText: name }).click();
    await page.waitForTimeout(800);
    await page.getByText('查看详情', { exact: true }).filter({ visible: true }).click();
    await page.waitForTimeout(2000);
    await snapshot(name);
    if (name === 'VIDEO') check('local looping preview', await page.locator('video[data-local-preview]').evaluateAll(videos => videos.length > 0 && videos.every(v => v.loop && v.readyState >= 2)));
    await page.getByText('返回', { exact: true }).filter({ visible: true }).click();
    await page.waitForTimeout(1000);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await nav('index');
  await page.locator('._d6b1e15c').click();
  await page.waitForTimeout(900);
  await snapshot('mobile menu');
  await page.screenshot({ path: path.join(out, 'frontend-menu-mobile.png') });
  check('six mobile navigation links', await page.locator('._387897ce a[href]').count() === 6);
  await page.locator('._387897ce a[href="/#more"]').click();
  await page.waitForTimeout(1600);
  await page.screenshot({ path: path.join(out, 'frontend-more-mobile.png') });
  for (const id of ['index', 'information', 'operator', 'world', 'media', 'more']) {
    await nav(id);
    await snapshot('mobile ' + id);
    check('mobile ' + id + ': no overflow', await page.evaluate(() => document.documentElement.scrollWidth === innerWidth));
    if (id === 'index') await page.screenshot({ path: path.join(out, 'frontend-home-mobile.png') });
  }
} catch (error) {
  errors.push(error.stack);
  await page.screenshot({ path: path.join(out, 'frontend-error.png') });
} finally {
  check('no external requests', external.length === 0, external);
  check('no business API requests', api.length === 0, api);
  check('no popup windows', context.pages().length === 1);
  const result = { checks, errors, failed, external, api };
  await fs.writeFile(path.join(out, 'frontend-regression.json'), JSON.stringify(result, null, 2), 'utf8');
  console.log(JSON.stringify({ errors, failed, external, api }, null, 2));
  await browser.close();
  if (errors.length || failed.length || checks.some(c => !c.passed)) process.exitCode = 1;
}
