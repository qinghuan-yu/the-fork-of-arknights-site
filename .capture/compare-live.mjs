import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
const out=path.resolve('.capture/evidence');
const browser=await chromium.launch({channel:'chrome',headless:true});
const pages=await Promise.all(['https://ak.hypergryph.com/','http://127.0.0.1:4173/'].map(async url=>{
  const p=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
  await p.goto(url,{waitUntil:'domcontentloaded'});
  await p.locator('a[href="/#information"]:visible').waitFor();
  return p;
}));
await pages[0].waitForTimeout(6000);
const metrics=[];
for(const section of ['index','operator','information','media','more']){
  if(section!=='index')await Promise.all(pages.map(p=>p.locator(`a[href="/#${section}"]:visible`).first().click()));
  await pages[0].waitForTimeout(4000);
  if(section==='index') {
    await Promise.all(pages.map(p=>p.locator('video').first().evaluate(async v=>{v.pause();v.currentTime=5;await new Promise(resolve=>v.addEventListener('seeked',resolve,{once:true}));})));
    await pages[0].waitForTimeout(500);
  }
  for(const [i,page] of pages.entries()){
    const label=i?'local':'source';
    await page.screenshot({path:path.join(out,`qa-${section}-${label}.png`)});
    metrics.push({section,label,data:await page.evaluate(()=>({font:document.documentElement.style.fontSize, viewport:[innerWidth,innerHeight], images:[...document.images].filter(x=>x.offsetWidth && !x.naturalWidth).map(x=>x.src),canvas:[...document.querySelectorAll('canvas')].map(x=>({width:x.width,height:x.height,class:x.className})),fonts:document.fonts.status}))});
  }
  console.log('COMPARED',section);
}
for(const p of pages){await p.locator('a[href="/#operator"]:visible').first().click();await p.setViewportSize({width:390,height:844});}
await pages[0].waitForTimeout(4000);
for(const [i,p] of pages.entries())await p.screenshot({path:path.join(out,`qa-mobile-${i?'local':'source'}.png`)});
await fs.writeFile(path.join(out,'comparison-metrics.json'),JSON.stringify(metrics,null,2),'utf8');
await browser.close();
