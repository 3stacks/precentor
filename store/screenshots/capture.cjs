const { chromium } = require('playwright');
// node capture.cjs <outDir> [iphone|ipad] [baseUrl]
const OUT = process.argv[2];
const DEVICES = {
  iphone: { viewport: { width: 440, height: 956 }, deviceScaleFactor: 3 },
  ipad: { viewport: { width: 1032, height: 1376 }, deviceScaleFactor: 2 },
};
const device = DEVICES[process.argv[3] || 'iphone'];
if (!device) throw new Error(`Unknown device: ${process.argv[3]}`);
const BASE = (process.argv[4] || 'https://precentor.app').replace(/\/$/, '');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ serviceWorkers: 'block', ...device, isMobile: true, hasTouch: true });
  const p = await ctx.newPage();
  // iOS hides the Ko-fi link and the App Store offer, so the shots hide them too.
  const hide = () => p.addStyleTag({ content: 'a[href*="ko-fi"],:has(> a[href*="apps.apple.com"]){display:none!important}' });
  const shot = async (n) => { await hide(); await p.waitForTimeout(800); await p.screenshot({ path: `${OUT}/${n}.png` }); console.log(n); };
  await p.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  await shot('list');
  await p.goto(`${BASE}/psalm/023`, { waitUntil: 'networkidle' });
  await p.getByRole('button', { name: 'Play', exact: true }).click();
  await p.getByText('Skip to verse 1').click();
  await p.getByTestId('syllable-now').waitFor({ timeout: 20000 });
  await p.waitForTimeout(2500);
  await shot('playing');
  await p.getByRole('button', { name: 'Pause', exact: true }).click();
  await p.goto(`${BASE}/psalm/023`, { waitUntil: 'networkidle' });
  await p.getByRole('button', { name: /^Tune: / }).click();
  await p.getByText('Choose a tune').waitFor();
  await shot('tunes');
  await p.goto(`${BASE}/psalm/023`, { waitUntil: 'networkidle' });
  await p.getByRole('button', { name: 'Music', exact: true }).click();
  await p.locator('.score-svg svg').first().waitFor();
  await shot('music');
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
