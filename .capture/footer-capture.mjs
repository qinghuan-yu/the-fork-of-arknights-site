import { chromium } from 'playwright';
const browser=await chromium.launch({channel:'chrome',headless:true});
const p=await browser.newPage({viewport:{width:1440,height:900}});
await p.goto('https://ak.hypergryph.com/#more',{waitUntil:'domcontentloaded'});
await p.locator('.container__jEaFQy').waitFor();
await p.waitForTimeout(3000);
await p.locator('.container__jEaFQy').scrollIntoViewIfNeeded();
await p.screenshot({path:'.capture/evidence/qa-footer-source.png'});
await browser.close();
