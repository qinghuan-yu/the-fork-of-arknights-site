import { test, expect } from '@playwright/test';
import fs from 'node:fs';

const external = new WeakMap();
const errors = new WeakMap();
test.beforeEach(async ({ page, baseURL }) => {
  const origin = new URL(baseURL).origin;
  external.set(page, []); errors.set(page, []);
  await page.route('**/*', route => {
    const url = route.request().url();
    if (/^https?:/.test(url) && !url.startsWith(origin + '/')) {
      external.get(page).push(url); return route.abort();
    }
    if (/\/(?:vendor|_next|api)\//.test(url)) errors.get(page).push('旧版请求：' + url);
    return route.continue();
  });
  page.on('pageerror', error => errors.get(page).push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.get(page).push(message.text()); });
  page.on('response', response => { if (response.status() >= 400) errors.get(page).push(response.status() + ' ' + response.url()); });
});
test.afterEach(async ({ page }, info) => {
  expect(external.get(page), '页面不访问外站').toEqual([]);
  const expected = info.annotations.filter(item => item.type === 'expected-console-error').map(item => item.description);
  for (const message of expected) expect(errors.get(page)).toContain(message);
  expect(errors.get(page).filter(message => !expected.includes(message)), '页面无意外错误和旧版运行包请求').toEqual([]);
});
const navigate = async (page, id) => {
  await page.goto('/#' + id);
  await expect(page.locator('#section-' + id)).toHaveClass(/is-active/);
  await expect(page.locator('.page-section.is-active .section-loading')).toHaveCount(0);
  await expect(page.locator('.loading-container')).toBeHidden();
  await page.waitForTimeout(1050);
};
const selectGalleryYear = async (page, year) => {
  if (await page.locator('.gallery-mobileSelector').isVisible()) {
    for (let i = 0; i < 10 && await page.locator('.gallery-current').innerText() !== year; i++) {
      await page.getByRole('button', { name: '下一个图集年份' }).click();
    }
  } else {
    if (!await page.locator('.gallery-yearList').isVisible()) await page.getByRole('button', { name: '图集年份', exact: true }).click();
    await page.locator('.gallery-yearList').getByRole('button', { name: year, exact: true }).click();
  }
  await expect(page.locator('.gallery-current')).toHaveText(year);
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
  await page.getByRole('button', { name: '配音语言', exact: true }).click();
  await page.getByRole('option').first().click();
  await page.getByRole('button', { name: '播放角色语音', exact: true }).click();
  await expect.poll(() => page.locator('.operator-voice audio').evaluate(audio => audio.currentTime)).toBeGreaterThan(0);
  await navigate(page, 'media');
  expect(await page.locator('.operator-voice audio').evaluate(audio => audio.paused)).toBe(true);
});

test('六个粒子模型及反复进入场景', async ({ page }, info) => {
  await navigate(page, 'world');
  for (const name of ['源石', '源石技艺', '整合运动', '感染者', '移动城邦', '罗德岛']) {
    if (info.project.name === 'mobile') await page.locator('.world-nav').getByRole('button', { name, exact: true }).click();
    else await page.locator('.world-storyItem').filter({ has: page.getByText(name, { exact: true }) }).click();
    await expect(page.locator('.world-title')).toHaveText(name);
    await page.waitForTimeout(400);
    if (name === '源石') await page.screenshot({ path: info.outputPath('world-detail.png') });
    if (info.project.name !== 'mobile') await page.locator('.world-closeBtn').click();
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
  await selectGalleryYear(page, '2021');
  await expect(page.getByLabel('4月', { exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: '放大图片' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect.poll(() => page.locator('.gallery-cover img').evaluate(image => image.complete && image.naturalWidth > 0 && Number(getComputedStyle(image).opacity) === 1)).toBe(true);
  await page.screenshot({ path: info.outputPath('gallery.png') });
  await page.locator('.gallery-celebReview > .gallery-closeBtn').click();
  await expect(page.locator('.media-moduleMenu')).toBeVisible();
});

test('视频目录与循环播放器', async ({ page }, info) => {
  await navigate(page, 'media');
  await page.locator('.media-moduleMenu').getByRole('button', { name: 'VIDEO', exact: true }).click();
  await page.getByRole('button', { name: '查看详情 READ MORE' }).click();
  await expect.poll(() => page.locator('.video-preview video').evaluate(video => video.readyState)).toBeGreaterThan(1);
  await page.getByRole('button', { name: '播放完整预览' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  expect(await page.getByRole('dialog').locator('video').evaluate(video => video.loop && video.muted)).toBe(true);
  await page.getByRole('button', { name: '关闭预览' }).click();
  await page.screenshot({ path: info.outputPath('video.png') });
  await page.locator('.video-returnBtn').click();
});

test('主题切换与本地视频', async ({ page }, info) => {
  await navigate(page, 'more');
  for (const name of ['集成战略', '生息演算']) {
    await page.locator('.more-listItem').filter({ hasText: name }).click();
    await expect(page.locator('.topic-container.topic-active .topic-title')).not.toBeEmpty();
    const firstTab = page.locator('.topic-container.topic-active .topic-tabItem').first();
    await firstTab.click();
    await expect(page.locator('.topic-container.topic-active .topic-title')).toHaveText(await firstTab.innerText());
    await page.locator('.topic-container.topic-active .topic-action').first().click();
    await expect(page.getByRole('dialog').locator('video')).toBeVisible();
    // 官网主题弹窗通过遮罩或 Escape 关闭，没有屏内的关闭图标。
    await page.getByRole('dialog').click({ position: { x: 5, y: 5 } });
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await page.screenshot({ path: info.outputPath('topic-' + name + '.png') });
    await page.locator('.topic-container.topic-active .topic-returnBtn').click();
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

test('切页揭幕、快速切换和图集延迟入场', async ({ page }) => {
  await navigate(page, 'operator');
  await page.evaluate(() => { location.hash = 'information'; });
  await page.waitForTimeout(1200);
  const progress = await page.evaluate(async () => {
    location.hash = 'operator';
    await new Promise(resolve => setTimeout(resolve, 200));
    const element = document.querySelector('#section-operator');
    return { width: element.getBoundingClientRect().width, child: element.firstElementChild.getBoundingClientRect().width, viewport: innerWidth };
  });
  expect(progress.width).toBeGreaterThan(0);
  expect(progress.width).toBeLessThan(progress.viewport);
  expect(progress.child).toBe(progress.viewport);
  await page.waitForTimeout(1000);
  await page.locator('.operator-charAvatar').nth(1).evaluate(node => node.click());
  await page.waitForTimeout(100);
  await page.locator('.operator-charAvatar').last().evaluate(node => node.click());
  await expect(page.locator('.operator-name')).toHaveText('白面鸮');
  await expect.poll(() => page.locator('.operator-charInfo').evaluate(node => Number(getComputedStyle(node).opacity))).toBe(1);
  await page.evaluate(() => { location.hash = 'media'; });
  await page.waitForTimeout(1200);
  await page.locator('.media-moduleMenu').getByRole('button', { name: 'GALLERY', exact: true }).click();
  await page.getByRole('button', { name: '查看详情 READ MORE' }).click();
  await page.waitForTimeout(1100);
  const opacity = await page.evaluate(async () => {
    document.querySelector('.gallery-cover').click();
    await new Promise(resolve => setTimeout(resolve, 150));
    return Number(getComputedStyle(document.querySelector('.gallery-layer > div')).opacity);
  });
  expect(opacity).toBe(0);
  await expect.poll(() => page.locator('.gallery-layer > div').evaluate(node => Number(getComputedStyle(node).opacity))).toBe(1);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('减少动态效果与 WebGL 不可用时保留内容', async ({ page }, info) => {
  info.annotations.push({ type: 'expected-console-error', description: 'THREE.WebGLRenderer: THREE.WebGLRenderer: Error creating WebGL context.' });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      return /webgl/.test(type) ? null : original.call(this, type, ...args);
    };
  });
  await navigate(page, 'world');
  if (info.project.name === 'desktop') await page.locator('.world-storyItem').first().click();
  await expect(page.locator('.particle-fallback')).toBeVisible();
  await expect(page.locator('.world-title')).toHaveText('源石');
  expect(await page.locator('.particle-fallback').evaluate(image => image.complete && image.naturalWidth > 0)).toBe(true);
  await page.setViewportSize({ width: 844, height: 390 });
  await expect(page.locator('.world-title')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(844);
});

test('生产入口没有旧编译包或 SDK 引导', () => {
  const html = fs.readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8');
  expect(html).not.toMatch(/_next|__next_f|HG_SDK|local-runtime|vendor/);
  expect(fs.existsSync(new URL('../public/vendor', import.meta.url))).toBe(false);
});


test('缩略图淡出与图集月份命中区域', async ({ page }, info) => {
  await navigate(page, 'media');
  await page.locator('.media-moduleMenu').getByRole('button', { name: 'GALLERY', exact: true }).click();
  await page.getByRole('button', { name: '查看详情 READ MORE' }).click();
  await expect.poll(() => page.locator('.gallery-item.gallery-active').evaluate(element => Number(getComputedStyle(element, '::before').opacity))).toBe(0);
  await selectGalleryYear(page, '2021');
  const month = page.locator('.gallery-month[aria-pressed="true"]');
  await expect(month).toHaveAttribute('aria-label', '4月');
  const monthBox = await month.boundingBox();
  const stripBox = await page.locator('.gallery-monthSelector').boundingBox();
  expect(monthBox.x).toBeGreaterThanOrEqual(stripBox.x - 1);
  expect(monthBox.x + monthBox.width).toBeLessThanOrEqual(stripBox.x + stripBox.width + 1);
  if (info.project.name === 'mobile') {
    const timeline = await page.locator('.gallery-timeline').boundingBox();
    const cover = await page.locator('.gallery-cover').boundingBox();
    // 原站手机刻度在封面左侧，年份在封面上方。
    expect(monthBox.x + monthBox.width).toBeLessThanOrEqual(cover.x + 1);
    expect(timeline.y).toBeLessThan(cover.y);
  }
  const cover = page.locator('.gallery-cover img');
  await expect.poll(() => cover.evaluate(image => image.complete && image.naturalWidth > 0 && Number(getComputedStyle(image).opacity) === 1)).toBe(true);
  const source = await cover.getAttribute('src');
  for (let iteration = 0; iteration < 3; iteration++) {
    await page.getByRole('button', { name: '放大图片' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    if (iteration % 2) await page.getByRole('button', { name: '关闭预览' }).click();
    else await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByRole('button', { name: '放大图片' })).toBeFocused();
    await expect(cover).toHaveAttribute('src', source);
    await expect.poll(() => cover.evaluate(image => image.complete && image.naturalWidth > 0 && Number(getComputedStyle(image).opacity) === 1)).toBe(true);
  }
  await page.locator('.gallery-celebReview > .gallery-closeBtn').click();
  await page.locator('.media-moduleMenu').getByRole('button', { name: 'VIDEO', exact: true }).click();
  await page.getByRole('button', { name: '查看详情 READ MORE' }).click();
  await expect.poll(() => page.locator('.video-item.video-active').evaluate(element => Number(getComputedStyle(element, '::before').opacity))).toBe(0);
  await page.locator('.video-returnBtn').click();
});

test('窄短屏主题按钮与重复弹窗可用', async ({ page }, info) => {
  await page.setViewportSize(info.project.name === 'mobile' ? { width: 320, height: 568 } : { width: 1280, height: 720 });
  await navigate(page, 'more');
  for (const name of ['集成战略', '生息演算']) {
    await page.locator('.more-listItem').filter({ hasText: name }).click();
    const tabs = page.locator('.topic-container.topic-active .topic-tabItem');
    for (const position of [0, (await tabs.count()) - 1]) {
      await tabs.nth(position).click();
      await expect(page.locator('.topic-container.topic-active .topic-title')).toHaveText(await tabs.nth(position).innerText());
      await expect.poll(() => page.locator('.topic-container.topic-active .topic-topicInfo').evaluate(element => element.getAnimations().some(animation => animation.playState === 'running'))).toBe(false);
      const action = page.locator('.topic-container.topic-active .topic-action').first();
      await action.scrollIntoViewIfNeeded();
      if (info.project.name === 'mobile') {
        expect(await page.locator('.topic-container.topic-active .topic-navItem.topic-active').evaluate(element => getComputedStyle(element).backgroundColor)).toBe('rgb(24, 209, 255)');
      }
      await action.click();
      await expect(page.getByRole('dialog').locator('video')).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(page.getByRole('dialog')).toHaveCount(0);
      await expect(action).toBeFocused();
    }
    await page.locator('.topic-container.topic-active .topic-returnBtn').click();
    await expect(page.locator('.more-listItem').first()).toBeVisible();
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(info.project.name === 'mobile' ? 320 : 1280);
});

test('首页只挂载当前分区且短分片视频可播放', async ({ page }) => {
  const requests = [];
  page.on('request', request => requests.push(request.url()));
  await navigate(page, 'index');
  await expect(page.locator('.home-background-video')).toBeVisible();
  await expect.poll(() => page.locator('.home-background-video').evaluate(video => video.currentTime), { timeout: 15000 }).toBeGreaterThan(0.2);
  for (const id of ['information', 'operator', 'world', 'media', 'more']) {
    await expect(page.locator(`#section-${id} > *`)).toHaveCount(0);
  }
  expect(requests.filter(url => /(?:News|Operator|World|Media|More)Section-|ParticleScene-|scrollbar-/.test(url))).toEqual([]);
  // No hidden-section DOM means no eager banners, portraits or media artwork.
  await expect(page.locator('main img')).toHaveCount(0);
  expect(requests.some(url => /PV04_(?:landscape|portrait)\.m3u8/.test(url))).toBe(true);
  const video = await page.locator('.home-background-video').evaluate(video => ({ width: video.videoWidth, height: video.videoHeight }));
  expect(video.width > 0 && video.height > 0).toBe(true);
  await verifyHomeLoopAndResume(page, requests);
});

test('直接进入分区不会下载首页视频并保留已访问状态', async ({ page }) => {
  const requests = [];
  page.on('request', request => requests.push(request.url()));
  await navigate(page, 'operator');
  const button = page.getByRole('button', { name: '选择干员 陈', exact: true });
  await button.scrollIntoViewIfNeeded();
  await button.click();
  await page.getByRole('button', { name: '精英化 2', exact: true }).click();
  await navigate(page, 'information');
  await page.getByRole('tab', { name: '活动', exact: true }).click();
  await navigate(page, 'operator');
  await expect(page.locator('.operator-name')).toHaveText('陈');
  await expect(page.locator('.operator-illust img')).toHaveAttribute('alt', '陈 精英化 2');
  await navigate(page, 'information');
  await expect(page.getByRole('tab', { name: '活动', exact: true })).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#section-index > *')).toHaveCount(0);
  expect(requests.filter(url => /hls\.light-|PV04_|ParticleScene-/.test(url))).toEqual([]);
});

test('快速离开未加载分区不会启动隐藏视频', async ({ page }) => {
  await page.route('**/MoreSection-*.js', async route => {
    await new Promise(resolve => setTimeout(resolve, 600));
    await route.continue();
  });
  await navigate(page, 'index');
  await page.evaluate(() => { location.hash = '#more'; });
  await expect(page.locator('#section-more')).toHaveClass(/is-active/);
  await page.evaluate(() => { location.hash = '#operator'; });
  await expect(page.locator('.operator-name')).toBeVisible();
  await expect(page.locator('#section-more .more-list')).toBeAttached();
  await expect(page.locator('#section-more')).toHaveAttribute('inert', '');
  expect(await page.locator('.home-background-video').evaluate(video => video.paused && !video.getAttribute('src'))).toBe(true);
  await navigate(page, 'more');
  await expect(page.locator('.more-list')).toBeVisible();
  await expect(page.locator('.section-loading')).toHaveCount(0);
});

// Native HLS owns its request/cache policy. Only the hls.js branch uses our
// forward/back-buffer settings; verify that branch separately below.
async function verifyHomeLoopAndResume(page, requests) {
  // The background has no seek controls. Verify the full natural loop, including
  // every middle fragment, rather than jumping into an unbuffered final frame.
  const playbackState = () => page.locator('.home-background-video').evaluate(video => ({
    time: video.currentTime, duration: video.duration, paused: video.paused, readyState: video.readyState,
    loop: video.loop, source: video.currentSrc, nativeHls: video.canPlayType('application/vnd.apple.mpegurl'), error: video.error?.message || null,
    buffered: Array.from({ length: video.buffered.length }, (_, i) => [video.buffered.start(i), video.buffered.end(i)]),
  }));
  const firstFragmentCount = () => requests.filter(url => /PV04_(?:landscape|portrait)-short-000\.ts/.test(url)).length;
  const startupRequests = firstFragmentCount();
  try {
    await expect.poll(async () => (await playbackState()).time, { timeout: 25000 }).toBeGreaterThan(16);
    await expect.poll(async () => {
      const state = await playbackState();
      return state.time > 0.2 && state.time < 3 && !state.paused;
    }, { timeout: 8000 }).toBe(true);
  } finally {
    console.log('Home video playback:', JSON.stringify({ ...await playbackState(), startupRequests, requestsAfterLoop: firstFragmentCount() }));
  }
  expect(startupRequests).toBeGreaterThan(0);
  if ((await playbackState()).source.startsWith('blob:')) {
    expect(firstFragmentCount(), 'hls.js loop should reuse the downloaded first fragment').toBe(startupRequests);
  }
  // Exercise the visibility handler deterministically; this is not a real OS-tab switch.
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  expect(await page.locator('.home-background-video').evaluate(video => video.paused)).toBe(true);
  await page.evaluate(() => {
    delete document.hidden;
    document.dispatchEvent(new Event('visibilitychange'));
  });
  const resumedAt = (await playbackState()).time;
  await expect.poll(async () => {
    const state = await playbackState();
    return !state.paused && state.time > resumedAt + 0.1;
  }).toBe(true);
}


test('HLS 轻量回退可完整循环并从隐藏状态恢复', async ({ page }) => {
  // Exercise hls.js even on Chromium builds that support HLS natively.
  await page.addInitScript(() => {
    const original = HTMLMediaElement.prototype.canPlayType;
    HTMLMediaElement.prototype.canPlayType = function(type) {
      return /mpegurl/i.test(type) ? '' : original.call(this, type);
    };
  });
  const requests = [];
  page.on('request', request => requests.push(request.url()));
  await navigate(page, 'index');
  await expect.poll(() => page.locator('.home-background-video').evaluate(video => video.currentTime), { timeout: 15000 }).toBeGreaterThan(0.2);
  await expect(page.locator('.home-background-video')).toHaveAttribute('src', /^blob:/);
  expect(requests.some(url => /hls\.light-/.test(url))).toBe(true);
  await verifyHomeLoopAndResume(page, requests);
});
