import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { extname, join, resolve, sep } from 'node:path';
import { chromium } from 'playwright-core';
import { lessons, newPractice, choose, reveal, needsReview } from '../training/lessons.js';

const root = resolve(import.meta.dirname, '..');
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
const checks = [];
for (const lesson of lessons) {
  const practice = newPractice(lesson, 'recall', () => 0);
  const [first, second, third] = lesson.actions;
  assert.notEqual(practice.choices[0], first);
  assert.equal(choose(practice, 'unknown'), null);
  assert.equal(choose(practice, second.id).ok, false);
  assert.equal(practice.index, 0);
  assert.equal(choose(practice, first.id).ok, true);
  assert.equal(reveal(practice), second);
  for (const action of lesson.actions.slice(1)) assert.equal(choose(practice, action.id).ok, true);
  assert.deepEqual(needsReview(practice), [first, second]);
  assert.equal(choose(practice, third.id), null);
}
checks.push('All drill states: wrong order, hints, full run, completion and review');

const artifactBase = join(root, 'artifacts');
await mkdir(artifactBase, { recursive: true });
const output = await mkdtemp(join(artifactBase, 'training-'));
const dist = join(output, 'pages');
execFileSync(process.execPath, ['scripts/build-pages.mjs', dist], { cwd: root });
const revision = JSON.parse(await readFile(join(dist, 'revision.json'), 'utf8'));
assert.equal(revision.revision, git('rev-parse', 'HEAD'));

const mime = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css' };
const preview = createServer(async (req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  if (!pathname.startsWith('/dive-atlas/')) return res.writeHead(404).end();
  const relative = pathname.slice('/dive-atlas/'.length);
  const file = resolve(dist, relative + (relative.endsWith('/') || !relative ? 'index.html' : ''));
  if (!file.startsWith(dist + sep)) return res.writeHead(404).end();
  try {
    const content = await readFile(file);
    res.writeHead(200, { 'Content-Type': mime[extname(file)] || 'application/octet-stream' }).end(content);
  } catch {
    res.writeHead(404).end();
  }
});
process.env.PORT = '4497';
const local = await import('./serve.mjs');
if (!local.server.listening) await new Promise(resolve => local.server.once('listening', resolve));
await new Promise(resolve => preview.listen(0, '127.0.0.1', resolve));
const localUrl = 'http://127.0.0.1:' + local.server.address().port;
const previewUrl = 'http://127.0.0.1:' + preview.address().port + '/dive-atlas/';
let browser;
try {
  const redirect = await fetch(localUrl + '/training', { redirect: 'manual' });
  assert.equal(redirect.status, 308);
  assert.equal(redirect.headers.get('location'), '/training/');
  assert.equal((await fetch(localUrl + '/package.json')).status, 404);

  browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true, args: ['--enable-unsafe-swiftshader']
  });
  const pageErrors = [];
  const testPage = async (viewport, mobile = false) => {
    const context = await browser.newContext({ viewport, isMobile: mobile, hasTouch: mobile, reducedMotion: mobile ? 'reduce' : 'no-preference' });
    const page = await context.newPage();
    page.on('pageerror', error => pageErrors.push(error.message));
    return page;
  };
  const getChoice = (page, id) => page.locator('[data-action="' + id + '"]');
  const position = locator => locator.evaluate(item => [item.style.left, item.style.top].join('/'));
  async function ready(page) {
    await page.locator('#scene canvas').waitFor({ state: 'visible' });
    await page.locator('#hotspots .is-guide:visible').waitFor();
    assert(await page.locator('#scene canvas').evaluate(canvas => {
      const gl = canvas.getContext('webgl2');
      return gl instanceof WebGL2RenderingContext && !gl.isContextLost();
    }));
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  }

  const desktop = await testPage({ width: 1440, height: 960 });
  await desktop.goto(localUrl + '/training/');
  await ready(desktop);
  const firstMarker = desktop.locator('#hotspots .is-guide');
  const original = await position(firstMarker);
  const canvas = await desktop.locator('#scene canvas').boundingBox();
  await desktop.mouse.move(canvas.x + canvas.width * .62, canvas.y + canvas.height * .61);
  await desktop.mouse.down();
  await desktop.mouse.move(canvas.x + canvas.width * .71, canvas.y + canvas.height * .65, { steps: 4 });
  await desktop.mouse.up();
  await desktop.waitForFunction(original => {
    const marker = document.querySelector('#hotspots .is-guide');
    return [marker.style.left, marker.style.top].join('/') !== original;
  }, original);
  await desktop.locator('#reset-view').click();
  await desktop.waitForFunction(original => {
    const marker = document.querySelector('#hotspots .is-guide');
    return [marker.style.left, marker.style.top].join('/') === original;
  }, original);
  await desktop.screenshot({ path: join(output, 'desktop-gear.png'), fullPage: true });
  await firstMarker.click();
  assert.equal(await desktop.locator('#progress').getAttribute('aria-valuenow'), '1');
  for (const action of lessons[0].actions.slice(1)) await getChoice(desktop, action.id).click();
  assert.equal(await desktop.locator('#result-heading').innerText(), '練習完了');
  await desktop.locator('#next-lesson').click();
  assert.equal(await desktop.locator('#lesson-title').innerText(), 'バディチェック');
  await desktop.locator('#hotspots .is-guide:visible').waitFor();
  await desktop.screenshot({ path: join(output, 'desktop-buddy.png'), fullPage: true });
  for (const action of lessons[1].actions) await getChoice(desktop, action.id).press('Enter');
  assert.equal(await desktop.locator('#result-heading').innerText(), '練習完了');
  checks.push('1440 px desktop WebGL: drag, reset, model hotspot, gear, next drill and keyboard buddy check');

  const mobileSize = { width: 390, height: 844 };
  const mobileDrag = await testPage(mobileSize, true);
  await mobileDrag.goto(previewUrl + 'training/');
  await ready(mobileDrag);
  const mobileMarker = mobileDrag.locator('#hotspots .is-guide');
  const before = await position(mobileMarker);
  const viewport = await mobileDrag.locator('#scene canvas').boundingBox();
  const input = await mobileDrag.context().newCDPSession(mobileDrag);
  const x = Math.round(viewport.x + viewport.width * .84);
  const y = Math.round(viewport.y + viewport.height * .24);
  assert.equal(await mobileDrag.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.tagName, { x, y }), 'CANVAS');
  await input.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
  await input.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x - 62, y: y + 14 }] });
  await input.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await mobileDrag.waitForFunction(before => {
    const marker = document.querySelector('#hotspots .is-guide');
    return [marker.style.left, marker.style.top].join('/') !== before;
  }, before);
  // Raw DevTools drag input and Playwright tap input use separate touch sessions.
  await mobileDrag.context().close();
  const mobile = await testPage(mobileSize, true);
  await mobile.goto(previewUrl + 'training/');
  await ready(mobile);
  await mobile.getByRole('button', { name: 'マスククリア', exact: true }).tap();
  assert.equal(await mobile.locator('#lesson-title').innerText(), 'マスククリア');
  assert(await mobile.locator('#mask-overlay').isVisible());
  await mobile.locator('#recall').tap();
  assert.equal(await mobile.locator('#recall').getAttribute('aria-pressed'), 'true');
  await getChoice(mobile, 'mask-exhale').tap();
  assert.equal(await mobile.locator('#progress').getAttribute('aria-valuenow'), '0');
  assert.equal(await mobile.locator('#feedback').getAttribute('data-tone'), 'retry');
  await getChoice(mobile, 'mask-breathe').tap();
  await mobile.locator('#hint').tap();
  await getChoice(mobile, 'mask-hold').tap();
  await getChoice(mobile, 'mask-exhale').tap();
  assert.equal(await mobile.locator('#review li').count(), 2);
  assert.equal(await mobile.locator('#mask-overlay').evaluate(node => node.style.getPropertyValue('--mask-water')), '0%');
  await mobile.locator('#reset').tap();
  assert.equal(await mobile.locator('#progress').getAttribute('aria-valuenow'), '0');
  await mobile.locator('#guided').tap();
  await mobile.evaluate(() => window.scrollTo(0, 0));
  await mobile.locator('#hotspots .is-guide:visible').waitFor();
  await mobile.screenshot({ path: join(output, 'mobile-mask.png'), fullPage: true });
  await mobile.locator('#perspective').tap();
  assert.equal(await mobile.locator('#perspective').getAttribute('aria-pressed'), 'false');
  assert(await mobile.locator('#mask-overlay').isHidden());
  for (const lesson of lessons.slice(3)) {
    await mobile.getByRole('button', { name: lesson.tab || lesson.title, exact: true }).tap();
    await mobile.locator('#hotspots .is-guide:visible').waitFor();
    await mobile.locator('#perspective').tap();
    assert.equal(await mobile.locator('#perspective').getAttribute('aria-pressed'), 'true');
    await mobile.locator('#hotspots .is-guide:visible').waitFor();
    if (lesson.id === 'recovery') {
      await getChoice(mobile, 'bubbles').tap();
      await mobile.evaluate(() => window.scrollTo(0, 0));
      const sweep = mobile.getByRole('button', { name: '右腕でホースをすくう', exact: true }).and(mobile.locator('#hotspots button'));
      assert(await sweep.isHidden());
      for (let i = 0; i < 3; i += 1) await mobile.locator('#rotate-right').tap();
      await sweep.waitFor();
      await mobile.screenshot({ path: join(output, 'mobile-recovery.png'), fullPage: true });
      await sweep.tap();
      assert.equal(await mobile.locator('#progress').getAttribute('aria-valuenow'), '2');
    }
    for (const action of lesson.actions.slice(lesson.id === 'recovery' ? 2 : 0)) await getChoice(mobile, action.id).tap();
    assert.equal(await mobile.locator('#result-heading').innerText(), '練習完了');
    assert(await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  }
  checks.push('390 px touch WebGL at /dive-atlas/: rotate, wrong order, hint, review, reset and all other drills');

  const noGl = await testPage({ width: 360, height: 800 }, true);
  await noGl.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      if (type === 'webgl2' || type === 'webgl') return null;
      return getContext.call(this, type, ...args);
    };
  });
  await noGl.goto(previewUrl + 'training/');
  await noGl.locator('.scene-error').waitFor();
  for (const action of lessons[0].actions) await getChoice(noGl, action.id).tap();
  assert.equal(await noGl.locator('#result-heading').innerText(), '練習完了');
  assert.deepEqual(pageErrors, []);
  checks.push('360 px WebGL-unavailable fallback: gear drill still completes');
  await writeFile(join(output, 'report.json'), JSON.stringify({ revision, checks }, null, 2));
  console.log(output);
  for (const check of checks) console.log('PASS ' + check);
} catch (error) {
  if (browser) {
    for (const [i, context] of browser.contexts().entries()) {
      const page = context.pages()[0];
      if (page) await page.screenshot({ path: join(output, 'failed-' + i + '.png'), fullPage: true }).catch(() => {});
    }
  }
  console.error('Training check artifacts: ' + output);
  throw error;
} finally {
  await browser?.close();
  preview.close();
  local.server.close();
}
