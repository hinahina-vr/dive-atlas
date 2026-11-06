import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { extname, join, resolve, sep } from 'node:path';
import { chromium } from 'playwright-core';
import { lessons, newPractice, choose, reveal, needsReview } from '../training/lessons.js';
import { readReview, reviewKey, saveReview } from '../training/reviews.js';

const root = resolve(import.meta.dirname, '..');
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
const checks = [];
const attempt = (practice, action) => choose(practice, action.id, action.attachment?.dock);
for (const lesson of lessons) {
  const practice = newPractice(lesson, 'recall', () => 0);
  const [first, second, third] = lesson.actions;
  assert.notEqual(practice.choices[0], first);
  assert.equal(choose(practice, 'unknown'), null);
  assert.equal(attempt(practice, second).ok, false);
  assert.equal(practice.index, 0);
  assert.equal(attempt(practice, first).ok, true);
  assert.equal(reveal(practice), second);
  for (const action of lesson.actions.slice(1)) {
    if (action.attachment) {
      assert.equal(choose(practice, action.id), null);
      assert.equal(choose(practice, action.id, 'no-such-dock'), null);
    }
    assert.equal(attempt(practice, action).ok, true);
  }
  assert.deepEqual(needsReview(practice), [first, second]);
  assert.equal(choose(practice, third.id), null);
}
const gear = newPractice(lessons[0], 'recall');
assert.equal(choose(gear, 'inspect').ok, true);
assert.equal(choose(gear, 'bcd', 'valve').wrongDock, true);
assert.equal(gear.index, 1);
assert.deepEqual(needsReview(gear).map(action => action.id), ['bcd']);
assert.equal(choose(gear, 'bcd', 'cylinder').ok, true);
checks.push('All drill states: wrong order, wrong destination, hints, full run, completion and review');
const reviewData = new Map();
const storage = { getItem: key => reviewData.get(key), setItem: (key, raw) => reviewData.set(key, raw) };
assert.equal(saveReview(storage, gear, 123), null);
for (const action of lessons[0].actions.slice(gear.index)) assert.equal(attempt(gear, action).ok, true);
const record = saveReview(storage, gear, 123);
assert.deepEqual(record, { completedAt: 123, steps: ['bcd'] });
assert.deepEqual(readReview(storage, lessons[0]), record);
assert.equal(readReview(storage, lessons[1]), null);
reviewData.set(reviewKey(lessons[0]), '{broken');
assert.equal(readReview(storage, lessons[0]), null);
assert.deepEqual(saveReview({ setItem() { throw new Error('storage is blocked'); } }, gear, 123), record);
checks.push('Review storage: separate drills, invalid records and unavailable storage');

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
    headless: true, args: ['--enable-unsafe-swiftshader', '--disable-gpu-shader-disk-cache', '--disk-cache-size=1048576']
  });
  const pageErrors = [];
  const testPage = async (viewport, mobile = false) => {
    const context = await browser.newContext({ viewport, isMobile: mobile, hasTouch: mobile, reducedMotion: mobile ? 'reduce' : 'no-preference' });
    const page = await context.newPage();
    page.on('pageerror', error => pageErrors.push(error.message));
    page.on('console', message => {
      if (message.type() === 'error' && /WebGLProgram|shader error/i.test(message.text())) pageErrors.push(message.text());
    });
    return page;
  };
  const getChoice = (page, id) => page.locator('[data-action="' + id + '"]');
  const part = (page, id) => page.locator('#hotspots [data-part="' + id + '"]');
  const dock = (page, id) => page.locator('#dock-markers [data-dock="' + id + '"]');
  const dockChoice = (page, id) => page.locator('#placement-menu [data-dock-choice="' + id + '"]');
  const value = page => page.locator('#progress').getAttribute('aria-valuenow');
  const center = async locator => {
    await locator.waitFor();
    const box = await locator.boundingBox();
    assert(box);
    return { x: Math.round(box.x + box.width / 2), y: Math.round(box.y + box.height / 2) };
  };
  async function movePart(page, id, target, drag, during = async () => {}) {
    const marker = part(page, id);
    const from = await center(marker);
    await drag.start(from);
    await drag.move({ x: from.x + 14, y: from.y + 7 });
    const end = await center(dock(page, target));
    await drag.move(end);
    await page.waitForFunction(({ id, end }) => {
      const node = [...document.querySelectorAll('#hotspots button')].find(item => item.dataset.part === id);
      const rect = node?.getBoundingClientRect();
      return rect && Math.hypot(rect.x + rect.width / 2 - end.x, rect.y + rect.height / 2 - end.y) < 4;
    }, { id, end });
    await during();
    await drag.end();
  }
  const mouseDrag = page => ({
    async start({ x, y }) { await page.mouse.move(x, y); await page.mouse.down(); },
    move: ({ x, y }) => page.mouse.move(x, y, { steps: 3 }),
    end: () => page.mouse.up()
  });
  const touchDrag = session => ({
    start: point => session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point] }),
    move: point => session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [point] }),
    end: () => session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  });
  async function hold(page, id, drag, threshold = 1, during = async () => {}) {
    await drag.start(await center(part(page, id)));
    await page.waitForFunction(({ id, threshold }) => {
      const node = [...document.querySelectorAll('#hotspots button')].find(item => item.dataset.part === id);
      return node?.classList.contains('is-pressed') && Number(node.style.getPropertyValue('--press-progress')) >= threshold;
    }, { id, threshold });
    await during();
    await drag.end();
  }
  const meterLevel = page => page.locator('#effect-meter').evaluate(node => Number(node.style.getPropertyValue('--level')));
  async function operate(page, action, input) {
    await getChoice(page, action.id)[input]();
    if (action.attachment) await dockChoice(page, action.attachment.dock)[input]();
  }
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
  await desktop.locator('#show-example').click();
  assert(await desktop.locator('#example-controls').isVisible());
  assert(await desktop.locator('#choices').isHidden());
  await desktop.locator('#example-play').click();
  const exampleTime = () => desktop.locator('#example-controls').evaluate(node => node.style.getPropertyValue('--time'));
  const pausedAt = await exampleTime();
  await desktop.waitForTimeout(300);
  assert.equal(await exampleTime(), pausedAt);
  await desktop.locator('#example-play').click();
  await desktop.waitForFunction(() => document.querySelector('#step-title')?.textContent === 'BCDを取り付ける');
  await desktop.locator('#example-play').click();
  await desktop.locator('#example-guide').waitFor({ state: 'visible' });
  assert.equal(await desktop.locator('#example-guide line').getAttribute('hidden'), null);
  await desktop.screenshot({ path: join(output, 'desktop-example.png'), fullPage: true });
  await desktop.locator('#example-next').click();
  assert.equal(await desktop.locator('#step-title').innerText(), 'BCDのバンドを締める');
  await desktop.locator('#example-prev').click();
  assert.equal(await desktop.locator('#step-title').innerText(), 'BCDを取り付ける');
  await desktop.locator('#example-exit').click();
  assert.equal(await value(desktop), '1');
  assert(await desktop.locator('#example-controls').isHidden());
  assert(await desktop.locator('#choices').isVisible());
  checks.push('1440 px example: autoplay, pause, 3D target overlay, seek and return to an in-progress drill');
  await movePart(desktop, 'bcd', 'valve', mouseDrag(desktop));
  assert.equal(await value(desktop), '1');
  assert.equal(await desktop.locator('#feedback').getAttribute('data-tone'), 'retry');
  assert(await desktop.locator('#scene-feedback').isVisible());
  await part(desktop, 'bcd').hover();
  await movePart(desktop, 'bcd', 'cylinder', mouseDrag(desktop), async () => {
    assert.equal(await value(desktop), '1');
    await desktop.screenshot({ path: join(output, 'desktop-placement.png'), fullPage: true });
  });
  assert.equal(await value(desktop), '2');
  for (const action of lessons[0].actions.slice(2)) {
    if (action.attachment) {
      await part(desktop, action.id).hover();
      await movePart(desktop, action.id, action.attachment.dock, mouseDrag(desktop));
    } else {
      await operate(desktop, action, 'click');
    }
  }
  assert.match(await desktop.locator('#review').innerText(), /BCDを取り付ける/);
  assert.equal(await desktop.locator('#result-heading').innerText(), 'もう一度見ておきたい手順');
  await desktop.locator('#next-lesson').click();
  assert.equal(await desktop.locator('#lesson-title').innerText(), 'バディチェック');
  await desktop.locator('#hotspots .is-guide:visible').waitFor();
  await desktop.screenshot({ path: join(output, 'desktop-buddy.png'), fullPage: true });
  for (const action of lessons[1].actions) await getChoice(desktop, action.id).press('Enter');
  assert.equal(await desktop.locator('#result-heading').innerText(), '練習完了');
  checks.push('1440 px desktop WebGL: camera drag, invalid dock, three equipment drags, review, keyboard buddy check');

  await desktop.getByRole('button', { name: 'マスククリア', exact: true }).click();
  await part(desktop, 'mask-breathe').click();
  await part(desktop, 'mask-hold').click();
  assert(await desktop.locator('#mask-overlay').evaluate(node => node.classList.contains('is-sealed')));
  await hold(desktop, 'mask-exhale', mouseDrag(desktop), .20);
  assert.equal(await value(desktop), '2');
  const remaining = await meterLevel(desktop);
  assert(remaining > 0 && remaining < 1, 'An interrupted press preserves the remaining water');
  await desktop.screenshot({ path: join(output, 'desktop-mask-partial.png'), fullPage: true });
  await hold(desktop, 'mask-exhale', mouseDrag(desktop));
  assert.equal(await value(desktop), '3');
  assert.equal(await meterLevel(desktop), 0);
  checks.push('1440 px mask drill: seal, progressive water loss, interrupted press, resume and clear');
  await desktop.context().close();

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
  await getChoice(mobileDrag, 'inspect').press('Enter');
  await mobileDrag.evaluate(() => window.scrollTo(0, 0));
  await mobileDrag.locator('#reset-view').press('Enter');
  await movePart(mobileDrag, 'bcd', 'cylinder', touchDrag(input), async () => {
    await mobileDrag.screenshot({ path: join(output, 'mobile-placement.png'), fullPage: true });
  });
  assert.equal(await value(mobileDrag), '2');
  // Raw DevTools drag input and Playwright tap input use separate touch sessions.
  await mobileDrag.context().close();
  const mobile = await testPage(mobileSize, true);
  await mobile.goto(previewUrl + 'training/');
  await ready(mobile);
  await part(mobile, 'inspect').tap();
  await part(mobile, 'bcd').tap();
  await dock(mobile, 'cylinder').tap();
  assert.equal(await value(mobile), '2');
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
  await mobile.evaluate(() => window.scrollTo(0, 0));
  const waterInput = touchDrag(await mobile.context().newCDPSession(mobile));
  await hold(mobile, 'mask-exhale', waterInput);
  assert.equal(await mobile.locator('#review li').count(), 2);
  assert.equal(await mobile.locator('#mask-overlay').evaluate(node => node.style.getPropertyValue('--mask-water')), '0%');
  const maskReviewKey = reviewKey(lessons[2]);
  const saved = await mobile.evaluate(key => localStorage.getItem(key), maskReviewKey);
  assert.deepEqual(JSON.parse(saved).steps, ['mask-breathe', 'mask-hold']);
  await mobile.reload();
  await ready(mobile);
  await mobile.getByRole('button', { name: 'マスククリア', exact: true }).tap();
  const previous = mobile.locator('#previous-review');
  await previous.locator('summary').tap();
  assert.match(await previous.innerText(), /見直し 2項目/);
  await mobile.screenshot({ path: join(output, 'mobile-review.png'), fullPage: true });
  await previous.getByRole('button', { name: 'マスクの上側を押さえる手順の見本を見る', exact: true }).tap();
  assert.equal(await mobile.locator('#step-title').innerText(), 'マスクの上側を押さえる');
  await mobile.locator('#example-next').tap();
  assert.equal(await mobile.locator('#step-title').innerText(), '今度は自分で試す');
  await mobile.locator('#example-recall').tap();
  assert.equal(await mobile.locator('#recall').getAttribute('aria-pressed'), 'true');
  assert.equal(await value(mobile), '0');
  assert.equal(await mobile.evaluate(key => localStorage.getItem(key), maskReviewKey), saved);
  checks.push('390 px review: saved on completion, survives reload, plays one step and starts fresh recall without overwriting history');
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
    if (lesson.id === 'fins') await mobile.locator('#perspective').tap();
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
      assert.equal(await value(mobile), '2');
      await mobile.locator('#reset-view').tap();
      await part(mobile, 'replace').tap();
      await dock(mobile, 'mouth').tap();
      assert.equal(await value(mobile), '3');
      await hold(mobile, 'purge', waterInput, 1, async () => {
        await mobile.screenshot({ path: join(output, 'mobile-purge.png'), fullPage: true });
      });
      assert.equal(await value(mobile), '4');
      await part(mobile, 'reg-breathe').tap();
    } else if (lesson.id === 'inflator') {
      const initial = await center(part(mobile, 'add-air'));
      await hold(mobile, 'add-air', waterInput, 1, async () => {
        assert.equal(await meterLevel(mobile), 1);
        const lifted = await center(part(mobile, 'add-air'));
        assert(lifted.y < initial.y - 9, 'BCD rises relative to the screen while adding air');
      });
      assert.equal(await value(mobile), '1');
      await part(mobile, 'raise').tap();
      await dock(mobile, 'above').tap();
      assert.equal(await value(mobile), '2');
      const beforeVent = await center(part(mobile, 'vent'));
      await hold(mobile, 'vent', waterInput, 1, async () => {
        assert.equal(await meterLevel(mobile), 0);
        const lowered = await center(part(mobile, 'vent'));
        assert(lowered.y > beforeVent.y + 9, 'BCD drops relative to the screen while venting');
        await mobile.screenshot({ path: join(output, 'mobile-inflator.png'), fullPage: true });
      });
    } else {
      await operate(mobile, lesson.actions[0], 'tap');
      await mobile.evaluate(() => window.scrollTo(0, 0));
      for (const action of lesson.actions.slice(1, 3)) {
        await part(mobile, action.id).tap();
        await dock(mobile, action.attachment.dock).tap();
      }
      await mobile.screenshot({ path: join(output, 'mobile-fins.png'), fullPage: true });
      await operate(mobile, lesson.actions[3], 'tap');
    }
    assert.equal(await mobile.locator('#result-heading').innerText(), '練習完了');
    assert(await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  }
  checks.push('390 px touch WebGL at /dive-atlas/: gear gestures, mask press, recovery and purge, buoyancy response, fin placement, wrong order and review');
  await mobile.context().close();

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
  await noGl.locator('#show-example').tap();
  await noGl.locator('#example-next').tap();
  assert.equal(await noGl.locator('#step-title').innerText(), 'BCDを取り付ける');
  await noGl.locator('#example-exit').tap();
  for (const action of lessons[0].actions) await operate(noGl, action, 'tap');
  assert.equal(await noGl.locator('#result-heading').innerText(), '練習完了');
  await noGl.getByRole('button', { name: 'マスククリア', exact: true }).tap();
  for (const action of lessons[2].actions) await operate(noGl, action, 'tap');
  assert.equal(await noGl.locator('#result-heading').innerText(), '練習完了');
  assert.deepEqual(pageErrors, []);
  checks.push('360 px WebGL-unavailable fallback: gear and mask drills still complete');
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
