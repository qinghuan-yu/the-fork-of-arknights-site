// 同视口采集静态页面和动画时间线；所有输出写入被忽略的 .capture/fidelity。
import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
const local = !process.argv.includes('--source'), label = local ? 'local' : 'source';
// 官网类名快照：2026-11-12；改版后需重新核对这些选择器。
const maps = {
  "information": {
    "swiper": "_34ed7167"
  },
  "operator": {
    "charAvatar": "_1de22e23",
    "charInfo": "_05e9c63d",
    "illust": "_fbdad2c3",
    "illustStyled": "_14f95653"
  },
  "world": {
    "storyItem": "_a34a9a95",
    "arrowRight": "_734e96fa",
    "title": "_5a164757",
    "text": "_809113d6",
    "subtitle": "_4c6c6ee3",
    "desc": "_ca422980"
  },
  "media": {
    "item": "_7d8e81d6",
    "detailBtn": "_362f44da",
    "home": "_34a2503e"
  },
  "gallery": {
    "cover": "_6d14eba0",
    "celebReview": "_e633f943",
    "fullViewer": "_43cf0a65",
    "closeBtnPortrait": "_560f9fd1",
    "closeBtn": "_a73a2b03"
  },
  "more": {
    "listItem": "_638366ab",
    "list": "_57a63b22"
  },
  "topic": {
    "container": "_5f27e4d0",
    "bg": "_11a72fed"
  },
  "header": {
    "menuBtn": "_d6b1e15c",
    "menu": "_387897ce"
  },
  "navigation": {
    "menuNav": "_3c14782f",
    "item": "_c91e47cc"
  },
  "sections": {
    "sectionItem": "_c629adb0"
  }
};
await fs.mkdir('.capture/fidelity', { recursive: true });
const browser = await chromium.launch({channel:'chrome',headless:true});
const records = [];
try {
  for (const [device, viewport] of Object.entries({desktop:{width:1440,height:900},mobile:{width:390,height:844}})) {
    const page = await browser.newPage({viewport, deviceScaleFactor:1,isMobile:device==='mobile',hasTouch:device==='mobile'});
    page.on('pageerror', e=>console.log('ERROR',e.message));
    const css = (g,k)=>'.'+(local?`${g}-${k}`:maps[g][k]);
    const nav = async id=>{ await page.evaluate(id=>{location.hash=id;},id);await page.waitForTimeout(1700); };
    await page.goto(local?(process.env.FIDELITY_BASE_URL || 'http://127.0.0.1:4173/'):'https://ak.hypergryph.com/',{waitUntil:'domcontentloaded'});
    await page.waitForTimeout(4500);
    const sample = async (name, trigger, selectors, until=1200) => {
      await page.evaluate(({trigger,selectors,until})=>{
        const started=performance.now(); window.motionSamples=[];window.motionStarted=started;
        const tick=()=>{
          const time=performance.now()-started;
          const data=Object.fromEntries(Object.entries(selectors).map(([k,selector])=>{
            const node=document.querySelector(selector);if(!node)return[k,null];
            const style=getComputedStyle(node),r=node.getBoundingClientRect();
            return[k,{x:r.x,y:r.y,width:r.width,height:r.height,opacity:Number(style.opacity),transform:style.transform,text:node.textContent.slice(0,30)}];
          }));
          window.motionSamples.push({time,data}); if(time<until) requestAnimationFrame(tick);
        };
        if(trigger.hash)location.hash=trigger.hash;
        else document.querySelectorAll(trigger.click)[trigger.index||0].click();
        requestAnimationFrame(tick);
      },{trigger,selectors,until});
      await page.waitForTimeout(320);
      const elapsed=await page.evaluate(()=>performance.now()-window.motionStarted);
      await page.screenshot({path:`.capture/fidelity/motion-${label}-${device}-${name}-mid.png`});
      await page.waitForTimeout(until);
      const samples=await page.evaluate(()=>window.motionSamples);
      await page.screenshot({path:`.capture/fidelity/motion-${label}-${device}-${name}-end.png`});
      records.push({device,name,screenshotRequestedAt:elapsed,samples});console.log('MOTION',device,name,Math.round(elapsed));
    };
    for (const id of ['index','information','operator','world','media','more']) {
      await nav(id);
      await page.screenshot({path: `.capture/fidelity/${label}-${device}-${id}.png`});
    }
    await nav('operator');await nav('information');
    await page.locator(css('information','swiper')).evaluate(node=>{node.swiper.autoplay.stop();node.swiper.slideTo(0,0);});await page.waitForTimeout(700);
    const section = local?'#section-operator':`${css('sections','sectionItem')}:nth-child(3)`;
    await sample('section-forward',{hash:'operator'},{section,info:css('operator','charInfo')});
    await sample('section-backward',{hash:'information'},{section});
    await nav('operator');
    await sample('operator-switch',{click:css('operator','charAvatar'),index:1},{illust:css('operator','illust'),info:css('operator','charInfo'),silhouette:css('operator','illustStyled')});
    await nav('world');
    const text={title:css('world','title')+' '+css('world','text'),subtitle:css('world','subtitle')+' '+css('world','text'),desc:css('world','desc')+' '+css('world','text')};
    if(device==='desktop')await sample('world-open',{click:css('world','storyItem')},text,1800);
    await sample('world-switch',{click:css('world','arrowRight')},text);
    await nav('media');
    await page.locator(css('media','item')).filter({hasText:'GALLERY'}).click();await page.waitForTimeout(800);
    await sample('media-detail',{click:css('media','detailBtn')},{home:css('media','home'),gallery:css('gallery','celebReview')});
    await sample('gallery-open',{click:css('gallery','cover')},{viewer:css('gallery','fullViewer')});
    await page.locator(css('gallery',device==='mobile'?'closeBtnPortrait':'closeBtn')).filter({visible:true}).last().click();await page.waitForTimeout(700);
    await nav('more');
    await sample('topic-open',{click:css('more','listItem')},{cards:css('more','list'),background:css('topic','container')+' '+css('topic','bg')});
    if(device==='mobile')await sample('menu-open',{click:css('header','menuBtn')},{menu:css('header','menu'),first:css('navigation','menuNav')+' '+css('navigation','item'),last:css('navigation','menuNav')+' '+css('navigation','item')+':last-child'});
    await page.close();
  }
} finally {await fs.writeFile(`.capture/fidelity/motion-${label}.json`,JSON.stringify(records,null,2),'utf8');await browser.close();}

const states=['index','information','operator','world','media','more'];
const markup=['<!doctype html><meta charset="utf-8"><title>Fidelity comparison</title><style>body{margin:20px;background:#161616;color:#eee;font:16px sans-serif}.pair{display:flex;gap:12px}.pair img{width:calc(50% - 6px);object-fit:contain;align-self:start}h2{margin-top:30px}</style><h1>Source / Local</h1>'];
for(const device of ['desktop','mobile'])for(const state of states)markup.push(`<h2>${device} / ${state}</h2><div class="pair"><img src="source-${device}-${state}.png"><img src="local-${device}-${state}.png"></div>`);
await fs.writeFile('.capture/fidelity/comparison.html',markup.join('\n'),'utf8');
console.log('Comparison: .capture/fidelity/comparison.html');
