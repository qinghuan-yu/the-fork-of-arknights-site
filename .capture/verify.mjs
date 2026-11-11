import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const out = path.resolve('.capture/evidence');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const external = new Set();
await context.route('**/*', route => {
  const url = route.request().url();
  if (/^https?:/.test(url) && !url.startsWith('http://127.0.0.1:4173/')) { external.add(url); return route.abort(); }
  return route.continue();
});
const page = await context.newPage();
const errors = [], failed = [], screenshots = [], checks = [];
page.on('pageerror', err => errors.push(err.message));
page.on('console', msg => { if(msg.type() === 'error') errors.push(msg.text()); });
page.on('response', res => {if(res.status() >= 400) failed.push(`${res.status()} ${res.url()}`);});
const shot = async name => {
  await page.waitForTimeout(2400);
  await page.screenshot({path:path.join(out,`local-${name}.png`)});
  screenshots.push(name);
  console.log('VERIFIED',name);
};
const nav = async name => {
  await page.locator(`a[href="/#${name}"]:visible`).first().click();
  await page.waitForTimeout(1800);
};
try {
  await page.goto('http://127.0.0.1:4173/', {waitUntil:'domcontentloaded'});
  await page.locator('a[href="/#information"]:visible').waitFor();
  await shot('index-desktop');
  checks.push({name:'background video', result:await page.locator('video').first().evaluate(v=>({time:v.currentTime,ready:v.readyState,src:v.currentSrc}))});
  for(const section of ['information','operator','world','media','more']) { await nav(section); await shot(`${section}-desktop`); }
  await nav('information');
  for(const text of ['公告','活动','新闻']) {await page.getByText(text,{exact:true}).filter({visible:true}).first().click(); await shot(`news-${text}`);}
  await nav('operator');
  for(const name of ['阿米娅','陈','德克萨斯','能天使','白面鸮','凯尔希']) {
    await page.locator('._61521ab1').filter({hasText:name}).click({force:true});
    await shot(`operator-${name}`);
    checks.push({name:`operator ${name}`,result:await page.locator('._bc966073').textContent()});
  }
  await nav('world');
  for(const name of ['源石','源石技艺','整合运动','感染者','移动城邦','罗德岛']) {
    await page.locator('._a34a9a95').filter({hasText:name}).first().click();
    await shot(`world-${name}`);
    await page.getByText('返回',{exact:true}).filter({visible:true}).first().click();
    await page.waitForTimeout(1600);
  }
  await nav('media');
  for(const [name,caption] of [['GALLERY','gallery'],['VIDEO','video']]) {
    await page.locator('._7d8e81d6').filter({hasText:name}).click();
    await shot(`media-${caption}`);
    await page.getByText('查看详情',{exact:true}).filter({visible:true}).click();
    await shot(`${caption}-open`);
    if(name==='VIDEO') checks.push({name:'looping video placeholder',result:await page.locator('video[data-local-preview]').evaluateAll(vs=>vs.map(v=>({src:v.currentSrc,loop:v.loop,ready:v.readyState,time:v.currentTime})))});
    await page.getByText('返回',{exact:true}).filter({visible:true}).click();
    await page.waitForTimeout(1400);
  }
  await nav('more');
  await page.getByText('集成战略',{exact:true}).filter({visible:true}).click();
  await shot('more-strategies');
  await page.getByText('返回',{exact:true}).filter({visible:true}).click();
  await page.getByText('生息演算',{exact:true}).filter({visible:true}).click();
  await shot('more-reclamation');
  await nav('index');
  checks.push({name:'download controls removed',result:await page.locator('._e32dd037, ._d16ac76f').count()===0});
  await page.reload({waitUntil:'domcontentloaded'});
  await page.setViewportSize({width:390,height:844});
  await page.waitForTimeout(3000);
  await page.locator('._d6b1e15c').click();
  await shot('mobile-menu');
  await page.locator('._d6b1e15c').click();
  for(const section of ['information','operator','world','media','more','index']) {
    await page.goto(`http://127.0.0.1:4173/#${section}`);
    await shot(`${section}-mobile`);
  }
  checks.push({name:'mobile overflow',result:await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth}))});
  checks.push({name:'broken images',result:await page.locator('img').evaluateAll(imgs=>imgs.filter(i=>i.offsetWidth>0 && (!i.complete || i.naturalWidth===0)).map(i=>i.src))});
} catch(error) {
  errors.push(error.stack);
  console.log('VERIFICATION_ERROR',error.message);
  await page.screenshot({path:path.join(out,'local-error.png')});
} finally {
  await fs.writeFile(path.join(out,'verification.json'),JSON.stringify({screenshots,checks,errors,failed,external:[...external]},null,2),'utf8');
  console.log('CHECKS',JSON.stringify(checks));
  console.log('ERRORS',JSON.stringify(errors));
  console.log('FAILED',JSON.stringify(failed));
  console.log('EXTERNAL',JSON.stringify([...external]));
  await browser.close();
}
