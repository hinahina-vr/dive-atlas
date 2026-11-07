import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, resolve } from 'node:path';
import { chromium, devices, firefox, webkit } from 'playwright-core';
import { lessonRoute, lessons, neutralAir } from '../training/lessons.js';
import { draftKey } from '../training/drafts.js';
import { reviewKey } from '../training/reviews.js';

const [engine, pages, output] = process.argv.slice(2);
assert(pages && output && ['chromium','firefox','webkit'].includes(engine),
  'Usage: node scripts/training-cross-browser-check.mjs <chromium|firefox|webkit> <built pages directory> <artifacts directory>');
await mkdir(output, { recursive: true });
const browser = await { chromium, firefox, webkit }[engine].launch({
  ...(engine === 'firefox' ? {firefoxUserPrefs:{'network.proxy.type':0}} : {}),
  ...(engine === 'chromium' ? { executablePath: process.env.CHROME_PATH || (process.platform === 'win32' ? 'C:/Program Files/Google/Chrome/Application/chrome.exe' : undefined),
    args: ['--enable-unsafe-swiftshader','--disable-gpu-shader-disk-cache'] } : {})
});
const mime = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json',
  '.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.png':'image/png'};
const server = createServer(async (req,res) => {
  const path = new URL(req.url,'http://127.0.0.1').pathname;
  if (!/^\/(?:training\/[a-zA-Z0-9._-]*|vendor\/three\.(?:core|module)\.js|revision\.json)$/.test(path)) {
    res.writeHead(404).end();
    return;
  }
  const filename = path === '/training/' ? 'training/index.html' : path.slice(1);
  try {
    const content = await readFile(resolve(pages,filename));
    res.writeHead(200, {
      'Content-Type': mime[extname(filename)],
      'Content-Length': content.length,
      'Cache-Control': 'no-store'
    });
    res.end(content);
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
const url = 'http://127.0.0.1:' + server.address().port + '/training/';
async function stopServer() {
  if (!server.listening) return;
  await new Promise(resolve => {
    server.close(resolve);
    server.closeAllConnections();
  });
}
const context = await browser.newContext({
  ...(engine === 'webkit' ? devices['iPhone 13'] : {viewport:{width:1440,height:960}}),
  reducedMotion:'reduce'
});
context.setDefaultTimeout(14000);
await context.addInitScript(() => {
  window.qaInput = {};
  for (const name of ['pointerdown','touchstart']) {
    addEventListener(name, event => {
      const id = name + ':' + (event.pointerType || 'touch');
      window.qaInput[id] = (window.qaInput[id] || 0) + 1;
    }, { capture:true, passive:true });
  }
});
const report = { engine, version: browser.version(), checks: [], errors: [], failures: [] };
const verified = name => { report.checks.push(name); console.log('PASS',name); };
function observe(page) {
  page.on('pageerror', error => report.errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error' && /shader|WebGLProgram/i.test(message.text())) report.errors.push(message.text());
  });
  return page;
}
let page = observe(await context.newPage());
const $ = selector => page.locator(selector);
const choice = id => $('#choices [data-action="' + id + '"]');
const dock = id => $('#placement-menu [data-dock-choice="' + id + '"]');
const answer = id => $('#inspection-panel [data-answer="' + id + '"]');
const read = key => page.evaluate(key => JSON.parse(localStorage.getItem(key)), key);
const water = () => $('#mask-overlay').evaluate(el => Number.parseFloat(el.style.getPropertyValue('--mask-water')));
const tap = loc => engine === 'webkit' ? loc.tap() : loc.click();
const select = lesson => tap(page.getByRole('button', { name: lesson.tab || lesson.title, exact: true }));
const progress = count => page.waitForFunction(value =>
  document.querySelector('#progress')?.getAttribute('aria-valuenow') === String(value), count);
const shot = name => page.screenshot({ path: join(output, engine + '-' + name + '.png'), timeout: 6000 });
const [gear,buddy,mask,recovery,inflator,fins] = lessons;

async function ready() {
  await page.waitForFunction(() => document.querySelector('#scene canvas:not([hidden])') || document.querySelector('#scene-status.scene-error'), null, {timeout:60000});
  const canvas = $('#scene canvas');
  if (!await canvas.isVisible()) return false;
  return canvas.evaluate(canvas => {
    const gl = canvas.getContext('webgl2');
    return Boolean(gl && !gl.isContextLost());
  });
}
async function step(lesson, action) {
  const control = choice(action.id);
  if (action.pressTime) await control.press('Enter');
  else await tap(control);
  if (action.attachment) await tap(dock(action.attachment.dock));
  if (action.inspection) {
    const needsRepair = lesson.scenarios.walkthrough.includes(action.id);
    await tap(answer(needsRepair ? 'repair' : 'normal'));
  }
}
async function finish(lesson, from = 0) {
  for (const [i, action] of lesson.actions.slice(from).entries()) {
    await step(lesson,action);
    await progress(i+from+1);
  }
  await $('#result-heading').waitFor();
  verified(lesson.id + ': all ' + lesson.actions.length + ' operations');
}
async function tryCheck(name, callback) {
  try { await callback(); }
  catch (error) { report.failures.push({name,error:error.message}); console.log('FAIL',name,error.message); }
}

try {
  report.build = await fetch(new URL('../revision.json',url)).then(response => response.json());
  await page.goto(url,{waitUntil:'commit',timeout:50000});
  report.webgl = await ready();
  assert(report.webgl, 'A live WebGL 2 scene is required for this check');
  report.viewport = await page.evaluate(() => ({ width: innerWidth, touch: navigator.maxTouchPoints, agent: navigator.userAgent }));
  report.firstSceneStatus = await $('#scene-status').textContent();
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  verified('real WebGL 2 renders the training scene');
  console.log(JSON.stringify({ webgl:report.webgl, viewport:report.viewport, scene:report.firstSceneStatus }));
  await shot('start');

  await finish(gear);
  await tap($('#next-lesson'));
  await finish(buddy);
  const fullMask = lessonRoute(mask,'mask-full');
  await select(mask);
  await $('#mask-fill').selectOption('mask-full');
  await tap($('#recall'));
  await tap(choice('mask-hold'));
  await progress(0);
  assert.equal(await $('#feedback').getAttribute('data-tone'),'retry');
  await tap(choice('mask-breathe'));
  await tap($('#hint'));
  await tap(choice('mask-hold'));
  await progress(2);
  const exhale = choice('mask-exhale');
  await exhale.scrollIntoViewIfNeeded();
  const box = await exhale.boundingBox();
  assert(box);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForFunction(() => Number(document.querySelector('#choices [data-action="mask-exhale"]')
    .style.getPropertyValue('--press-progress')) > .18);
  await page.mouse.up();
  const partial = await water();
  assert(partial > 0 && partial < 100);
  const draft = await read(draftKey);
  assert.equal(draft.route,'mask-full');
  await page.reload({waitUntil:'domcontentloaded'});
  await ready();
  await tap($('#resume-practice'));
  await progress(2);
  assert.deepEqual(await read(draftKey),draft);
  assert(Math.abs(await water() - partial) < 1);
  await finish(fullMask,2);
  assert.deepEqual((await read(reviewKey(mask))).steps,['mask-breathe','mask-hold']);
  await tap($('#review [data-review-step="mask-hold"]'));
  await $('#example-controls').waitFor();
  assert(await $('#example-next').isHidden());
  await tap($('#example-exit'));
  verified('mask reload restores the same attempt, hints, water and missed-step replay');

  await select(recovery);
  await tap($('#guided'));
  await $('#recovery-search').selectOption('reach');
  await $('#recovery-clear').selectOption('exhale');
  await finish(lessonRoute(recovery,'reach-exhale'));

  await select(inflator);
  for (const action of inflator.actions.slice(0,-1)) await step(inflator,action);
  await progress(3);
  for (let i=0;i<3;i++) await tap($('#trim-add'));
  assert.equal(Number(await $('#effect-meter').evaluate(el=>el.style.getPropertyValue('--level'))),neutralAir);
  await finish(inflator,3);

  await select(fins);
  await finish(fins);

  await tryCheck('offline navigation and resume', async () => {
    // Preparation runs in the background while the user can already train.
    await $('#offline-status[data-state="ready"]').waitFor({ timeout: 90000 });
    assert(await page.evaluate(() => Boolean(navigator.serviceWorker.controller)));
    await tap($('#install-app'));
    assert(await $('#install-help').isVisible());
    assert.match(await $('#install-help').innerText(),/Safari/);
    await tap($('#install-app'));
    const manifestUrl = new URL(await $('link[rel="manifest"]').getAttribute('href'),url);
    const manifest = await fetch(manifestUrl).then(response => response.json());
    const startUrl = new URL(manifest.start_url,manifestUrl);
    assert.equal(startUrl.href,url);
    verified('worker caches all training assets and shows installation help');

    await select(mask);
    await tap($('#recall'));
    await tap(choice('mask-breathe'));
    await progress(1);
    report.inputEvents = await page.evaluate(() => window.qaInput);
    if (engine === 'webkit') assert(report.inputEvents['pointerdown:touch'] > 0);
    // Playwright's offline switch intercepts even service-worker responses on WebKit.
    // Stop the origin so the browser can still read its saved application files.
    await stopServer();
    assert(await page.evaluate(async () => {
      try { await fetch('../revision.json?networkProbe='+Math.random(),{cache:'no-store'}); return false; }
      catch { return true; }
    }), 'The origin is unreachable');
    const previousPage = page;
    page = observe(await context.newPage());
    startUrl.searchParams.set('offline-check', String(Date.now()));
    const response = await page.goto(startUrl.href,{waitUntil:'domcontentloaded',timeout:35000});
    assert.equal(response?.status(),200);
    await previousPage.close();
    assert.equal(await ready(),report.webgl);
    assert(await page.evaluate(() => Boolean(navigator.serviceWorker.controller)));
    await tap($('#resume-practice'));
    await progress(1);
    await tap(choice('mask-hold'));
    await progress(2);
    await shot('offline-mask');
    verified('offline reload resumes the saved drill and accepts the next operation');
    report.offlineOriginStopped = true;
  });
} catch (error) {
  report.failures.push({ name:'training journey', error:error.stack });
  console.log(error.stack);
  report.lastUrl = page.url();
  await shot('failed').catch(() => {});
} finally {
  await writeFile(join(output, engine + '-report.json'), JSON.stringify(report,null,2));
  await browser.close();
  await stopServer();
}
if (report.failures.length || report.errors.length) process.exitCode=1;
