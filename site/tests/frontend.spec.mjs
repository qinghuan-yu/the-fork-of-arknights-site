import { test, expect } from '@playwright/test';
import fs from 'node:fs';

const external = new WeakMap();
const errors = new WeakMap();
test.beforeEach(async ({ page }) => {
  external.set(page, []); errors.set(page, []);
  await page.route('**/*', route => {
    const url = route.request().url();
    if (/^https?:/.test(url) && !url.startsWith('http://127.0.0.1:4173/')) {
      external.get(page).push(url); return route.abort();
    }
    if (/\/(?:vendor|_next|api)\//.test(url)) errors.get(page).push('旧版请求：' + url);
    return route.continue();
  });
  page.on('pageerror', error => errors.get(page).push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.get(page).push(message.text()); });
  page.on('response', response => { if (response.status() >= 400) errors.get(page).push(response.status() + ' ' + response.url()); });
});
test.afterEach(async ({ page }) => {
  expect(external.get(page), '页面不访问外站').toEqual([]);
  expect(errors.get(page), '页面无错误和旧版运行包请求').toEqual([]);
});
const navigate = async (page, id) => {
  await page.goto('/#' + id);
  await expect(page.locator('#section-' + id)).toHaveClass(/is-active/);
  await page.waitForTimeout(650);
};

test('六个分区、静态素材和纯前端入口', async ({ page }, info) => {
  for (const id of ['index', 'information', 'operator', 'world', 'media', 'more']) {
    await navigate(page, id);
    expect(await page.locator('a[href]').evaluateAll(links => links.every(link => link.getAttribute('href').startsWith('#')))).toBe(true);
    await expect(page.locator('.page-section.is-active')).not.toContainText(/PC下载|扫码下载|登录|充值|客服/);
    const pictures = page.locator('.page-section.is-active img:visible');
    await expect.poll(() => pictures.evaluateAll(images => images.every(image => image.complete && image.naturalWidth > 0))).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(info.project.use.viewport.width);
    await page.screenshot({ path: info.outputPath(`${id}.png`) });
  }
  expect(await page.evaluate(() => typeof window.HG_SDK)).toBe('undefined');
  expect(await page.evaluate(() => typeof window.__next_f)).toBe('undefined');
});

test('新闻分类与轮播切换', async ({ page }) => {
  await navigate(page, 'information');
  for (const label of ['公告', '活动', '新闻']) {
    const tab = page.getByRole('tab', { name: label, exact: true });
    await tab.click(); await expect(tab).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('.information-newsItem').first()).toBeVisible();
  }
  const first = await page.locator('.information-currentBannerInfo .information-title').innerText();
  await expect(page.locator('.information-currentBannerInfo .information-title')).not.toHaveText(first, { timeout: 8000 });
});

test('干员切换、精英化与本地语音', async ({ page }) => {
  await navigate(page, 'operator');
  for (const name of ['阿米娅', '陈', '德克萨斯', '能天使', '白面鸮', '凯尔希']) {
    const button = page.getByRole('button', { name: '选择干员 ' + name, exact: true });
    await button.scrollIntoViewIfNeeded(); await button.click({ force: true });
    await expect(page.locator('.operator-name')).toHaveText(name);
  }
  await page.getByRole('button', { name: '精英化 2', exact: true }).click();
  await expect(page.locator('.operator-illust img')).toHaveAttribute('alt', '凯尔希 精英化 2');
  await page.getByLabel('配音语言').selectOption('1');
  await page.getByRole('button', { name: '播放角色语音', exact: true }).click();
  await expect.poll(() => page.locator('.operator-voice audio').evaluate(audio => audio.currentTime)).toBeGreaterThan(0);
  await navigate(page, 'media');
  expect(await page.locator('.operator-voice audio').evaluate(audio => audio.paused)).toBe(true);
});

test('六个粒子模型及反复进入场景', async ({ page }, info) => {
  await navigate(page, 'world');
  for (const name of ['源石', '源石技艺', '整合运动', '感染者', '移动城邦', '罗德岛']) {
    await page.locator('.world-storyItem').filter({ has: page.getByText(name, { exact: true }) }).click();
    await expect(page.locator('.world-title')).toHaveText(name);
    await page.waitForTimeout(400);
    if (name === '源石') await page.screenshot({ path: info.outputPath('world-detail.png') });
    await page.locator('.world-back').click();
  }
  for (let i = 0; i < 3; i++) { await navigate(page, 'operator'); await navigate(page, 'world'); }
  await expect(page.locator('.particle-canvas')).toBeVisible();
  await expect(page.locator('.particle-fallback')).toHaveCount(0);
});

test('图集年月、预览与返回', async ({ page }, info) => {
  await navigate(page, 'media');
  await page.locator('.media-moduleMenu').getByRole('button', { name: 'GALLERY', exact: true }).click();
  await page.getByRole('button', { name: '查看详情 READ MORE' }).click();
  await expect(page.locator('.gallery-cover img')).toBeVisible();
  await page.getByLabel('图集年份').selectOption('2021');
  await expect(page.getByLabel('4月', { exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: '放大图片' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.screenshot({ path: info.outputPath('gallery.png') });
  await page.locator('.gallery-back').click();
  await expect(page.locator('.media-moduleMenu')).toBeVisible();
});

test('视频目录与循环播放器', async ({ page }, info) => {
  await navigate(page, 'media');
  await page.locator('.media-moduleMenu').getByRole('button', { name: 'VIDEO', exact: true }).click();
  await page.getByRole('button', { name: '查看详情 READ MORE' }).click();
  await expect.poll(() => page.locator('.video-preview video').evaluate(video => video.readyState)).toBeGreaterThan(1);
  await page.getByRole('button', { name: '播放完整预览' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  expect(await page.locator('dialog video').evaluate(video => video.loop && video.muted)).toBe(true);
  await page.getByRole('button', { name: '关闭预览' }).click();
  await page.screenshot({ path: info.outputPath('video.png') });
  await page.locator('.video-back').click();
});

test('主题切换与本地视频', async ({ page }, info) => {
  await navigate(page, 'more');
  for (const name of ['集成战略', '生息演算']) {
    await page.locator('.more-listItem').filter({ hasText: name }).click();
    await expect(page.locator('.topic-title')).not.toBeEmpty();
    await page.locator('.topic-tabItem').first().click();
    await page.locator('.topic-action').first().click();
    await expect(page.locator('dialog video')).toBeVisible();
    await page.getByRole('button', { name: '关闭预览' }).click();
    await page.screenshot({ path: info.outputPath('topic-' + name + '.png') });
    await page.locator('.topic-back').click();
  }
});

test('导航菜单、背景音乐与历史记录', async ({ page }, info) => {
  await navigate(page, 'index');
  const sound = page.getByRole('button', { name: '背景音乐' });
  await sound.click(); await expect(sound).toHaveAttribute('aria-pressed', 'true');
  await sound.click(); await expect(sound).toHaveAttribute('aria-pressed', 'false');
  if (info.project.name === 'mobile') {
    await page.getByRole('button', { name: '打开菜单' }).click();
    await expect(page.getByRole('navigation', { name: '手机导航' }).getByRole('link')).toHaveCount(6);
    await page.screenshot({ path: info.outputPath('menu.png') });
    await page.getByRole('navigation', { name: '手机导航' }).getByRole('link', { name: 'WORLD 设定' }).click();
  } else await page.getByRole('navigation', { name: '主导航' }).getByRole('link', { name: 'WORLD 设定' }).click();
  await expect(page).toHaveURL(/#world$/);
  await page.goBack(); await expect(page).toHaveURL(/#index$/);
});

test('生产入口没有旧编译包或 SDK 引导', () => {
  const html = fs.readFileSync(new URL('../dist/client/index.html', import.meta.url), 'utf8');
  expect(html).not.toMatch(/_next|__next_f|HG_SDK|local-runtime|vendor/);
  expect(fs.existsSync(new URL('../public/vendor', import.meta.url))).toBe(false);
});
