import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createServer } from 'node:http';
import { cp, mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { extname, join, resolve, sep } from 'node:path';
import { chromium } from 'playwright-core';
import { lessons, newPractice, choose, reveal, needsReview, lessonRoute, remainingMaskWater, recoveryRoute,
  neutralAir, adjustAir, balanceStatus, inflatorAir } from '../training/lessons.js';
import { readReview, reviewKey, saveReview } from '../training/reviews.js';
import { readDraft, draftKey, saveDraft, clearDraft } from '../training/drafts.js';
import { writeTrainingWorker } from './training-offline.mjs';

const root = resolve(import.meta.dirname, '..');
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
const checks = [];
const inspectionAnswer = (lesson, scenario, action) => lesson.scenarios[scenario].includes(action.id) ? 'repair' : 'normal';
const attempt = (practice, action) => {
  if (action.balance && practice.lesson.actions[practice.index] === action) practice.pressure.balance = neutralAir;
  return choose(practice, action.id,
    action.inspection ? inspectionAnswer(practice.lesson, practice.scenario, action) : action.attachment?.dock);
};
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
const gear = newPractice(lessons[0], 'recall', () => .9);
for (const action of gear.lesson.actions.slice(0, 2)) assert.equal(attempt(gear, action).ok, true);
assert.equal(choose(gear, 'bcd', 'valve').wrongDock, true);
assert.equal(gear.index, 2);
assert.deepEqual(needsReview(gear).map(action => action.id), ['bcd']);
assert.equal(choose(gear, 'bcd', 'cylinder').ok, true);
checks.push('All drill states: wrong order, wrong destination, hints, full run, completion and review');
const buddy = lessons[1];
const finLesson = lessons.find(lesson => lesson.id === 'fins');
for (const lesson of [gear.lesson, buddy, finLesson]) {
  const scenarios = Object.keys(lesson.scenarios).slice(1);
  for (const [index, scenario] of scenarios.entries()) {
    const run = newPractice(lesson, 'recall', () => (index + .25) / scenarios.length);
    assert.equal(run.scenario, scenario);
    for (const action of lesson.actions) {
      if (action.inspection) {
        const answer = inspectionAnswer(lesson, scenario, action);
        const before = run.index;
        assert.equal(choose(run, action.id), null);
        assert.equal(choose(run, action.id, answer === 'repair' ? 'normal' : 'repair').wrongInspection, true);
        assert.equal(run.index, before);
      }
      assert.equal(attempt(run, action).ok, true);
    }
    assert.equal(run.index, lesson.actions.length);
  }
}
checks.push('Gear, buddy and fin diagnosis: all recall scenarios, false positives and missed faults, correction before proceeding');
const reviewData = new Map();
const storage = { getItem: key => reviewData.get(key), setItem: (key, raw) => reviewData.set(key, raw) };
assert.equal(saveReview(storage, gear, 123), null);
for (const action of lessons[0].actions.slice(gear.index)) assert.equal(attempt(gear, action).ok, true);
const record = saveReview(storage, gear, 123);
assert.deepEqual(record, { completedAt: 123, steps: ['bcd'], scenario: 'ready' });
assert.deepEqual(readReview(storage, lessons[0]), record);
assert.equal(readReview(storage, lessons[1]), null);
const legacyGearReview = { completedAt: 123, steps: ['inspect'] };
reviewData.set(reviewKey(lessons[0]), JSON.stringify(legacyGearReview));
assert.deepEqual(readReview(storage, lessons[0]), legacyGearReview);
reviewData.set(reviewKey(lessons[0]), '{broken');
assert.equal(readReview(storage, lessons[0]), null);
assert.deepEqual(saveReview({ setItem() { throw new Error('storage is blocked'); } }, gear, 123), record);
checks.push('Review storage: separate drills, invalid records and unavailable storage');
const mask = lessons.find(lesson => lesson.id === 'mask');
const fullMask = lessonRoute(mask, 'mask-full');
assert.equal(remainingMaskWater(mask.maskFill, false), .46);
assert.equal(remainingMaskWater(fullMask.maskFill, false, .25), .75);
assert.equal(remainingMaskWater(fullMask.maskFill, true), 0);
assert(fullMask.actions.at(-1).pressTime > mask.actions.at(-1).pressTime);
const fullRun = newPractice(fullMask, 'recall');
assert.equal(choose(fullRun, 'mask-exhale').ok, false);
for (const action of fullMask.actions) assert.equal(attempt(fullRun, action).ok, true);
const fullReview = saveReview(storage, fullRun, 235);
assert.deepEqual(fullReview, { completedAt: 235, steps: ['mask-breathe'], route: 'mask-full' });
assert.deepEqual(readReview(storage, mask), fullReview);
checks.push('Mask water: starts at the selected level and keeps the original full-water scene in review');
const recovery = recoveryRoute('sweep-purge');
for (const search of ['sweep', 'reach']) {
  for (const clear of ['purge', 'exhale']) {
    const lesson = recoveryRoute(search + '-' + clear);
    const run = newPractice(lesson, 'recall', () => .3);
    const routeSteps = search === 'sweep' ? ['sweep'] : ['reach', 'trace-hose'];
    const clearing = clear === 'purge' ? 'purge' : 'reg-exhale';
    assert.deepEqual(lesson.actions.map(action => action.id), ['bubbles', ...routeSteps, 'replace', clearing, 'reg-breathe']);
    for (const action of lesson.actions) {
      if (action.id === clearing) {
        assert.equal(choose(run, 'reg-breathe').ok, false);
        assert.equal(reveal(run), action);
      }
      assert.equal(attempt(run, action).ok, true);
    }
    const saved = saveReview(storage, run, 234);
    assert.deepEqual(saved.steps, [clearing]);
    assert.deepEqual(readReview(storage, recovery), saved);
  }
}
checks.push('All four recovery routes: correct order, clearing before breathing and compatible saved reviews');
const draftData = new Map();
const draftStorage = {
  getItem: key => draftData.get(key),
  setItem: (key, value) => draftData.set(key, value),
  removeItem: key => draftData.delete(key)
};
const draftRun = newPractice(fullMask, 'recall', () => .4);
assert.equal(saveDraft(draftStorage, 'mask-draft', draftRun, true), false);
assert.equal(choose(draftRun, 'mask-hold').ok, false);
assert.equal(attempt(draftRun, draftRun.lesson.actions[0]).ok, true);
assert.equal(reveal(draftRun).id, 'mask-hold');
assert.equal(attempt(draftRun, draftRun.lesson.actions[1]).ok, true);
draftRun.pressure['mask-exhale'] = .37;
assert.equal(saveDraft(draftStorage, 'mask-draft', draftRun, true), true);
clearDraft(draftStorage, 'other-run');
assert.deepEqual(readDraft(draftStorage), { id: 'mask-draft', practice: draftRun, immersive: true });
const rawDraft = draftData.get(draftKey);
const incompatible = JSON.parse(rawDraft);
incompatible.done.reverse();
draftData.set(draftKey, JSON.stringify(incompatible));
assert.equal(readDraft(draftStorage), null);
draftData.set(draftKey, rawDraft);
clearDraft(draftStorage, 'mask-draft');
assert.equal(readDraft(draftStorage), null);
assert.equal(saveDraft({ setItem() { throw new Error('storage is blocked'); } }, 'mask-draft', draftRun, true), false);
const buddyDraft = newPractice(buddy, 'recall', () => .38);
assert.equal(attempt(buddyDraft, buddy.actions[0]).ok, true);
assert.equal(saveDraft(draftStorage, 'buddy-draft', buddyDraft, false), true);
assert.deepEqual(readDraft(draftStorage), { id: 'buddy-draft', practice: buddyDraft, immersive: false });
checks.push('Draft storage: preserves route, order, scenario, water and review flags, rejects changed steps and protects another run');
const inflatorLesson = lessons.find(lesson => lesson.id === 'inflator');
const airRun = newPractice(inflatorLesson, 'recall');
assert.equal(adjustAir(airRun, 1), false);
assert.equal(attempt(airRun, inflatorLesson.actions[0]).ok, true);
assert.equal(inflatorAir(true, false, airRun.pressure), .48);
saveDraft(draftStorage, 'pre-adjustment', airRun, true);
const oldInflatorDraft = JSON.parse(draftData.get(draftKey));
oldInflatorDraft.choices = oldInflatorDraft.choices.filter(id => id !== 'balance');
draftData.set(draftKey, JSON.stringify(oldInflatorDraft));
assert.equal(readDraft(draftStorage).practice.choices.at(-1).id, 'balance');
assert.equal(readDraft(draftStorage).practice.index, 1);
for (const action of inflatorLesson.actions.slice(1, -1)) assert.equal(attempt(airRun, action).ok, true);
assert.equal(choose(airRun, 'balance').wrongBalance, true);
assert.equal(balanceStatus(inflatorAir(true, true, airRun.pressure)), 'sink');
for (let i = 0; i < 4; i += 1) assert.equal(adjustAir(airRun, 1), true);
assert.equal(balanceStatus(inflatorAir(true, true, airRun.pressure)), 'rise');
assert.equal(choose(airRun, 'balance').wrongBalance, true);
assert.equal(adjustAir(airRun, -1), true);
assert.equal(airRun.pressure.balance, neutralAir);
assert.equal(balanceStatus(inflatorAir(true, true, airRun.pressure)), 'steady');
assert.equal(saveDraft(draftStorage, 'air-draft', airRun, true), true);
assert.equal(readDraft(draftStorage).practice.pressure.balance, neutralAir);
assert.equal(choose(airRun, 'balance').ok, true);
checks.push('Inflator adjustment: refuses false balance, supports overshoot and correction, saves air and upgrades an existing draft');
const legacyFin = newPractice(finLesson, 'recall', () => .9);
for (const action of finLesson.actions.slice(0, 3)) assert.equal(attempt(legacyFin, action).ok, true);
assert.equal(saveDraft(draftStorage, 'fin-draft', legacyFin, true), true);
const oldFinDraft = JSON.parse(draftData.get(draftKey));
delete oldFinDraft.scenario;
oldFinDraft.choices = oldFinDraft.choices.filter(id => id !== 'fin-wiggle');
draftData.set(draftKey, JSON.stringify(oldFinDraft));
const upgradedFin = readDraft(draftStorage).practice;
assert.equal(upgradedFin.scenario, 'ready');
assert.equal(upgradedFin.lesson.actions[upgradedFin.index].id, 'fin-wiggle');
assert.equal(upgradedFin.choices.at(-1).id, 'fin-wiggle');
checks.push('Legacy fin draft: keeps the three fitted steps and resumes at the newly added movement check');

const artifactBase = join(root, 'artifacts');
await mkdir(artifactBase, { recursive: true });
const output = await mkdtemp(join(artifactBase, 'training-'));
const dist = join(output, 'pages');
execFileSync(process.execPath, ['scripts/build-pages.mjs', dist], { cwd: root });
const revision = JSON.parse(await readFile(join(dist, 'revision.json'), 'utf8'));
assert.equal(revision.revision, git('rev-parse', 'HEAD'));

let servedPages = dist;
const mime = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.json':'application/json', '.webmanifest':'application/manifest+json', '.svg':'image/svg+xml', '.png':'image/png' };
const preview = createServer(async (req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  if (!pathname.startsWith('/dive-atlas/')) return res.writeHead(404).end();
  const relative = pathname.slice('/dive-atlas/'.length);
  const serving = servedPages;
  const file = resolve(serving, relative + (relative.endsWith('/') || !relative ? 'index.html' : ''));
  if (!file.startsWith(serving + sep)) return res.writeHead(404).end();
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
  const testPage = async (viewport, mobile = false, serviceWorkers = 'block') => {
    const context = await browser.newContext({ viewport, isMobile: mobile, hasTouch: mobile, serviceWorkers, reducedMotion: mobile ? 'reduce' : 'no-preference' });
    context.on('page', page => {
      page.on('pageerror', error => pageErrors.push(error.message));
      page.on('console', message => {
        if (message.type() === 'error' && /WebGLProgram|shader error/i.test(message.text())) pageErrors.push(message.text());
      });
    });
    return context.newPage();
  };
  const getChoice = (page, id) => page.locator('[data-action="' + id + '"]');
  const part = (page, id) => page.locator('#hotspots [data-part="' + id + '"]');
  const dock = (page, id) => page.locator('#dock-markers [data-dock="' + id + '"]');
  const dockChoice = (page, id) => page.locator('#placement-menu [data-dock-choice="' + id + '"]');
  const value = page => page.locator('#progress').getAttribute('aria-valuenow');
  const answer = (page, id) => page.locator('#inspection-panel [data-answer="' + id + '"]');
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
  const maskLevel = page => page.locator('#mask-overlay').evaluate(node => Number.parseFloat(node.style.getPropertyValue('--mask-water')));
  async function operate(page, action, input) {
    await getChoice(page, action.id)[input]();
    if (action.attachment) await dockChoice(page, action.attachment.dock)[input]();
    if (action.inspection) await answer(page, ['inspect-ring', 'fin-check'].includes(action.id) ? 'repair' : 'normal')[input]();
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
    assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme), 'light');
  }

  const desktop = await testPage({ width: 1440, height: 960 });
  await desktop.goto(localUrl + '/training/');
  await ready(desktop);
  assert.match(await desktop.locator('#review-overview-status').innerText(), /0 \/ 6種目/);
  assert.equal(await desktop.locator('#lessons [data-review="new"]').count(), lessons.length);
  await desktop.locator('#review-next').press('Enter');
  assert.equal(await desktop.locator('#recall').getAttribute('aria-pressed'), 'true');
  assert.equal(await desktop.locator('#instruction').evaluate(node => document.activeElement === node), true);
  await desktop.locator('#guided').click();
  await desktop.locator('#hotspots .is-guide:visible').waitFor();
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
  assert(await desktop.locator('#viewport.has-detail').isVisible());
  assert.match(await desktop.locator('#inspection-panel').innerText(), /2026年11月/);
  await desktop.screenshot({ path: join(output, 'desktop-cylinder-date.png'), fullPage: true });
  await answer(desktop, 'repair').click();
  assert.equal(await value(desktop), '0');
  await answer(desktop, 'normal').click();
  await getChoice(desktop, 'inspect-ring').press('Enter');
  assert(await desktop.locator('#viewport.has-detail').isVisible());
  await desktop.screenshot({ path: join(output, 'desktop-cylinder-seal.png'), fullPage: true });
  await answer(desktop, 'repair').press('Enter');
  assert.equal(await value(desktop), '2');
  await desktop.locator('#show-example').click();
  assert(await desktop.locator('#example-controls').isVisible());
  assert(await desktop.locator('#choices').isHidden());
  await desktop.locator('#example-play').click();
  const exampleTime = () => desktop.locator('#example-controls').evaluate(node => node.style.getPropertyValue('--time'));
  const pausedAt = await exampleTime();
  await desktop.waitForTimeout(300);
  assert.equal(await exampleTime(), pausedAt);
  await desktop.locator('#example-play').click();
  await desktop.waitForFunction(() => document.querySelector('#step-title')?.textContent === 'Oリングを確認');
  await desktop.locator('#example-play').click();
  await desktop.locator('#example-next').click();
  assert.equal(await desktop.locator('#step-title').innerText(), 'BCDを取り付ける');
  await desktop.locator('#example-guide').waitFor({ state: 'visible' });
  assert.equal(await desktop.locator('#example-guide line').getAttribute('hidden'), null);
  await desktop.screenshot({ path: join(output, 'desktop-example.png'), fullPage: true });
  await desktop.locator('#example-next').click();
  assert.equal(await desktop.locator('#step-title').innerText(), 'BCDのバンドを締める');
  await desktop.locator('#example-prev').click();
  assert.equal(await desktop.locator('#step-title').innerText(), 'BCDを取り付ける');
  await desktop.locator('#example-exit').click();
  assert.equal(await value(desktop), '2');
  assert(await desktop.locator('#example-controls').isHidden());
  assert(await desktop.locator('#choices').isVisible());
  checks.push('1440 px example: autoplay, pause, 3D target overlay, seek and return to an in-progress drill');
  await movePart(desktop, 'bcd', 'valve', mouseDrag(desktop));
  assert.equal(await value(desktop), '2');
  assert.equal(await desktop.locator('#feedback').getAttribute('data-tone'), 'retry');
  assert(await desktop.locator('#scene-feedback').isVisible());
  await part(desktop, 'bcd').hover();
  await movePart(desktop, 'bcd', 'cylinder', mouseDrag(desktop), async () => {
    assert.equal(await value(desktop), '2');
    await desktop.screenshot({ path: join(output, 'desktop-placement.png'), fullPage: true });
  });
  assert.equal(await value(desktop), '3');
  for (const action of lessons[0].actions.slice(3)) {
    if (action.attachment) {
      await part(desktop, action.id).hover();
      await movePart(desktop, action.id, action.attachment.dock, mouseDrag(desktop));
    } else if (action.id === 'pressure') {
      await getChoice(desktop, 'pressure').click();
      assert(await desktop.locator('#viewport.has-detail').isVisible());
      await desktop.waitForTimeout(650);
      await desktop.screenshot({ path: join(output, 'desktop-pressure-gauge.png'), fullPage: true });
      await answer(desktop, 'repair').click();
      assert.equal(await value(desktop), String(gear.lesson.actions.length - 1));
      await answer(desktop, 'normal').click();
    } else {
      await operate(desktop, action, 'click');
    }
  }
  assert.match(await desktop.locator('#review').innerText(), /BCDを取り付ける/);
  checks.push('1440 px gear close-ups: date, seal, gauge, correct and incorrect answers');
  assert.equal(await desktop.locator('#result-heading').innerText(), 'もう一度見ておきたい手順');
  await desktop.locator('#next-lesson').click();
  assert.equal(await desktop.locator('#lesson-title').innerText(), 'バディチェック');
  await desktop.locator('#hotspots .is-guide:visible').waitFor();
  await desktop.screenshot({ path: join(output, 'desktop-buddy.png'), fullPage: true });
  for (const id of ['buoyancy', 'buddy-vent']) await hold(desktop, id, mouseDrag(desktop));

  await part(desktop, 'weights').click();
  await answer(desktop, 'normal').click();
  assert.equal(await value(desktop), '2');
  assert.equal(await desktop.locator('#feedback').getAttribute('data-tone'), 'retry');
  await desktop.screenshot({ path: join(output, 'desktop-buddy-loose-weight.png'), fullPage: true });
  await answer(desktop, 'repair').click();
  assert.equal(await value(desktop), '3');
  assert.match(await desktop.locator('#feedback').innerText(), /差し直して固定/);
  await getChoice(desktop, 'releases').press('Enter');
  await answer(desktop, 'normal').press('Enter');
  await part(desktop, 'buddy-valve').click();
  await hold(desktop, 'air', mouseDrag(desktop));
  await part(desktop, 'alternate').click();
  await answer(desktop, 'repair').click();
  await getChoice(desktop, 'final').press('Enter');
  assert.match(await desktop.locator('#review').innerText(), /ウエイトを確認/);
  await desktop.screenshot({ path: join(output, 'desktop-buddy-complete.png'), fullPage: true });
  checks.push('1440 px gear-to-buddy: inflate, vent, incorrect weight decision, two repairs, air and final check');

  await desktop.getByRole('button', { name: 'マスククリア', exact: true }).click();
  assert.equal(await maskLevel(desktop), 46);
  assert.equal(await meterLevel(desktop), .46);
  await part(desktop, 'mask-breathe').click();
  await part(desktop, 'mask-hold').click();
  assert(await desktop.locator('#mask-overlay').evaluate(node => node.classList.contains('is-sealed')));
  await hold(desktop, 'mask-exhale', mouseDrag(desktop), .20);
  assert.equal(await value(desktop), '2');
  const remaining = await meterLevel(desktop);
  assert(remaining > 0 && remaining < .46, 'An interrupted press preserves the remaining water');
  await desktop.screenshot({ path: join(output, 'desktop-mask-partial.png'), fullPage: true });
  await hold(desktop, 'mask-exhale', mouseDrag(desktop));
  assert.equal(await value(desktop), '3');
  assert.equal(await meterLevel(desktop), 0);
  checks.push('1440 px mask drill: seal, progressive water loss, interrupted press, resume and clear');
  const waterCanvas = desktop.locator('#scene canvas');
  const waterBounds = await waterCanvas.boundingBox();
  const viewDrag = mouseDrag(desktop);
  const lookPoint = { x: waterBounds.x + waterBounds.width * .72, y: waterBounds.y + waterBounds.height * .61 };
  await viewDrag.start(lookPoint);
  await viewDrag.move({ ...lookPoint, y: lookPoint.y - 31 });
  await viewDrag.end();
  await desktop.waitForTimeout(680);
  const firstWaterFrame = await waterCanvas.screenshot();
  await desktop.waitForTimeout(250);
  assert(!(await waterCanvas.screenshot()).equals(firstWaterFrame), 'Water light keeps moving after the exercise settles');
  await desktop.screenshot({ path: join(output, 'desktop-shallows.png'), fullPage: true });
  checks.push('1440 px shallow-water view: mask clears, camera can look down and water light continues moving');
  await desktop.locator('#mask-fill').selectOption('mask-full');
  assert.equal(await value(desktop), '0');
  assert.equal(await maskLevel(desktop), 100);
  await desktop.locator('#perspective').click();
  assert(await desktop.locator('#mask-overlay').isHidden());
  await desktop.locator('#show-example').click();
  await desktop.locator('#example-play').click();
  assert.equal(await maskLevel(desktop), 100);
  await desktop.locator('#example-next').click();
  await desktop.locator('#example-next').click();
  assert.equal(await desktop.locator('#step-title').innerText(), '鼻から息を吐く');
  await desktop.locator('#example-play').click();
  await desktop.waitForFunction(() => {
    const level = Number.parseFloat(document.querySelector('#mask-overlay').style.getPropertyValue('--mask-water'));
    return level > 0 && level < 90;
  });
  await desktop.locator('#example-exit').click();
  assert.equal(await value(desktop), '0');
  assert.equal(await maskLevel(desktop), 100);
  assert(await desktop.locator('#mask-overlay').isHidden());
  await desktop.locator('#perspective').click();
  for (const id of ['mask-breathe', 'mask-hold', 'mask-exhale']) await getChoice(desktop, id).press('Enter');
  assert.equal(await maskLevel(desktop), 0);
  checks.push('1440 px flooded mask: model view, gradual clear in the demonstration, keyboard run and return to practice');
  await desktop.locator('#next-lesson').click();
  await desktop.locator('#recovery-search').selectOption('reach');
  await desktop.locator('#show-example').click();
  await desktop.locator('#example-play').click();
  await desktop.locator('#example-next').click();
  assert.equal(await desktop.locator('#step-title').innerText(), '右肩の後ろでホースを探す');
  await desktop.locator('#example-guide').waitFor({ state: 'visible' });
  await desktop.locator('#example-next').click();
  assert.equal(await desktop.locator('#step-title').innerText(), 'ホースをたどる');
  await desktop.locator('#example-exit').click();
  await getChoice(desktop, 'bubbles').press('Enter');
  await getChoice(desktop, 'reach').press('Enter');
  await getChoice(desktop, 'trace-hose').press('Enter');
  await getChoice(desktop, 'replace').press('Enter');
  await dockChoice(desktop, 'mouth').press('Enter');
  await getChoice(desktop, 'purge').press('Enter');
  await getChoice(desktop, 'reg-breathe').press('Enter');
  assert.equal(await desktop.locator('#result-heading').innerText(), '練習完了');
  checks.push('1440 px recovery: reach demonstration aims toward the shoulder and the drill completes by keyboard');
  await desktop.getByRole('button', { name: 'フィンの履き方', exact: true }).click();
  await desktop.evaluate(() => { window.__originalRandom = Math.random; Math.random = () => .9; });
  await desktop.locator('#recall').click();
  await desktop.evaluate(() => { Math.random = window.__originalRandom; delete window.__originalRandom; });
  await getChoice(desktop, 'fin-strap').press('Enter');
  await getChoice(desktop, 'fin-foot').press('Enter');
  await dockChoice(desktop, 'pocket').press('Enter');
  await getChoice(desktop, 'fin-lock').press('Enter');
  await dockChoice(desktop, 'heel').press('Enter');
  await getChoice(desktop, 'fin-wiggle').press('Enter');
  await getChoice(desktop, 'fin-check').press('Enter');
  assert(await desktop.locator('#viewport.has-detail').isVisible());
  await desktop.screenshot({ path: join(output, 'desktop-fin-fit.png'), fullPage: true });
  await answer(desktop, 'repair').press('Enter');
  assert.equal(await value(desktop), '4');
  await answer(desktop, 'normal').press('Enter');
  assert.equal(await value(desktop), '5');
  const storedFin = await desktop.evaluate(key => JSON.parse(localStorage.getItem(key)), reviewKey(finLesson));
  assert.deepEqual(storedFin.steps, ['fin-check']);
  assert.equal(storedFin.scenario, 'ready');
  checks.push('1440 px fin fit: keyboard movement and close-up, rejects a false adjustment and records the ready case');
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
  await answer(mobileDrag, 'normal').press('Enter');
  await getChoice(mobileDrag, 'inspect-ring').press('Enter');
  await answer(mobileDrag, 'repair').press('Enter');
  await mobileDrag.evaluate(() => window.scrollTo(0, 0));
  await mobileDrag.locator('#reset-view').press('Enter');
  await movePart(mobileDrag, 'bcd', 'cylinder', touchDrag(input), async () => {
    await mobileDrag.screenshot({ path: join(output, 'mobile-placement.png'), fullPage: true });
  });
  assert.equal(await value(mobileDrag), '3');
  await mobileDrag.setViewportSize({ width: 844, height: 390 });
  await mobileDrag.waitForFunction(() => {
    const scene = document.querySelector('#viewport').getBoundingClientRect();
    const instruction = document.querySelector('#instruction').getBoundingClientRect();
    return scene.top >= 0 && scene.bottom <= innerHeight + 1 && instruction.top >= 0 &&
      instruction.bottom <= innerHeight && scene.right < instruction.left;
  });
  assert(await mobileDrag.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  assert.equal(await value(mobileDrag), '3');
  await getChoice(mobileDrag, 'lock').press('Enter');
  await getChoice(mobileDrag, 'uncap').press('Enter');
  await movePart(mobileDrag, 'first', 'valve', touchDrag(input), async () => {
    await mobileDrag.screenshot({ path: join(output, 'mobile-landscape-placement.png') });
  });
  assert.equal(await value(mobileDrag), '6');
  await mobileDrag.locator('.back-to-lessons').press('Enter');
  await mobileDrag.waitForFunction(() => {
    const menu = document.querySelector('#lessons').getBoundingClientRect();
    return menu.top >= 0 && menu.bottom <= innerHeight;
  });
  await mobileDrag.locator('#show-example').press('Enter');
  assert(await mobileDrag.locator('#example-controls').isVisible());
  assert(await mobileDrag.locator('#example-controls').evaluate(node =>
    node.getBoundingClientRect().left > document.querySelector('#viewport').getBoundingClientRect().right));
  await mobileDrag.locator('#example-exit').press('Enter');
  await mobileDrag.setViewportSize(mobileSize);
  await mobileDrag.evaluate(() => window.scrollTo(0, 0));
  assert.equal(await value(mobileDrag), '6');
  assert(await mobileDrag.locator('.back-to-lessons').isVisible());
  await mobileDrag.waitForFunction(() =>
    document.querySelector('.panel').getBoundingClientRect().top >= document.querySelector('#viewport').getBoundingClientRect().bottom);
  checks.push('844 × 390 mobile landscape: visible model and instructions, touch placement, menu and example, then back to portrait with progress');
  await mobileDrag.setViewportSize({ width: 568, height: 320 });
  await mobileDrag.getByRole('button', { name: 'マスククリア', exact: true }).press('Enter');
  await mobileDrag.waitForFunction(() => {
    const scene = document.querySelector('#viewport').getBoundingClientRect();
    const instruction = document.querySelector('#instruction').getBoundingClientRect();
    const choice = document.querySelector('#choices .is-guide').getBoundingClientRect();
    const settings = document.querySelector('#mask-settings').getBoundingClientRect();
    return scene.top >= 0 && scene.bottom <= innerHeight + 1 && scene.right < instruction.left &&
      instruction.top >= 0 && choice.bottom <= innerHeight && settings.top >= choice.bottom;
  });
  await mobileDrag.screenshot({ path: join(output, 'mobile-landscape-mask.png') });
  checks.push('568 × 320 mobile landscape: mask scene and next action remain visible before settings');
  // Raw DevTools drag input and Playwright tap input use separate touch sessions.
  await mobileDrag.context().close();

  const portrait = await testPage({ width: 360, height: 640 }, true);
  await portrait.goto(previewUrl + 'training/');
  await ready(portrait);
  const maskLesson = portrait.getByRole('button', { name: 'マスククリア', exact: true });
  await maskLesson.tap();
  const sceneAndActionVisible = () => portrait.evaluate(() => {
    const scene = document.querySelector('#viewport').getBoundingClientRect();
    const action = document.querySelector('#choices .is-guide').getBoundingClientRect();
    return scene.top >= 0 && scene.bottom <= action.top && action.bottom <= innerHeight;
  });
  assert(await sceneAndActionVisible());
  await getChoice(portrait, 'mask-breathe').tap();
  assert.equal(await value(portrait), '1');
  assert(await sceneAndActionVisible());
  await portrait.getByRole('link', { name: '種目一覧', exact: true }).tap();
  assert(await portrait.locator('#lessons').evaluate(node => {
    const rect = node.getBoundingClientRect();
    return rect.top >= 0 && rect.bottom <= innerHeight;
  }));
  await maskLesson.press('Enter');
  assert.equal(await value(portrait), '1');
  assert(await portrait.locator('#instruction').evaluate(node => document.activeElement === node));
  assert(await sceneAndActionVisible());
  await portrait.screenshot({ path: join(output, 'mobile-portrait-practice.png') });
  await portrait.context().close();
  checks.push('360 × 640 mobile portrait: lesson selection shows the 3D view and next action together, menu return and keyboard resume keep progress');

  const mobile = await testPage(mobileSize, true);
  let loadScene;
  const sceneGate = new Promise(resolve => { loadScene = resolve; });
  await mobile.route('**/training/view.js', async route => { await sceneGate; await route.continue(); });
  try {
    await mobile.goto(previewUrl + 'training/', { waitUntil: 'commit' });
    assert.match(await mobile.locator('#scene-status').innerText(), /3Dを準備しています/);
    assert(await mobile.locator('#scene-status').isVisible());
    await mobile.getByRole('button', { name: 'インフレーター', exact: true }).tap();
    await getChoice(mobile, 'add-air').tap();
    assert.equal(await value(mobile), '1');
    assert(await mobile.locator('#scene-status').isVisible());
  } finally {
    loadScene();
  }
  await mobile.locator('#viewport.is-water #scene canvas').waitFor();
  assert(await mobile.locator('#scene-status').isHidden());
  assert.equal(await value(mobile), '1');
  assert.equal(await meterLevel(mobile), .48);
  await part(mobile, 'raise').waitFor();
  await mobile.unroute('**/training/view.js');
  await mobile.getByRole('button', { name: '機材セッティング', exact: true }).tap();
  await ready(mobile);
  checks.push('390 px cold start: loading notice, text input during 3D loading, then the same progress and BCD air in water view');
  await part(mobile, 'inspect').tap();
  assert(await mobile.locator('#viewport.has-detail').isVisible());
  await answer(mobile, 'normal').tap();
  await getChoice(mobile, 'inspect-ring').tap();
  await mobile.screenshot({ path: join(output, 'mobile-cylinder-seal.png'), fullPage: true });
  await answer(mobile, 'repair').tap();
  await part(mobile, 'bcd').tap();
  await dock(mobile, 'cylinder').tap();
  assert.equal(await value(mobile), '3');
  for (const action of gear.lesson.actions.slice(3, -1)) await operate(mobile, action, 'tap');
  await getChoice(mobile, 'pressure').tap();
  await mobile.screenshot({ path: join(output, 'mobile-pressure-gauge.png'), fullPage: true });
  await answer(mobile, 'normal').tap();
  assert.equal(await value(mobile), String(gear.lesson.actions.length));
  await mobile.evaluate(() => { window.__originalRandom = Math.random; Math.random = () => .1; });
  await mobile.locator('#recall').tap();
  await mobile.evaluate(() => { Math.random = window.__originalRandom; delete window.__originalRandom; });
  await getChoice(mobile, 'inspect').tap();
  await mobile.screenshot({ path: join(output, 'mobile-cylinder-expired.png'), fullPage: true });
  await answer(mobile, 'normal').tap();
  assert.equal(await value(mobile), '0');
  await answer(mobile, 'repair').tap();
  assert.match(await mobile.locator('#feedback').innerText(), /検査期限内のシリンダーに交換/);
  checks.push('390 px touch: open close-ups, find a damaged seal, attach BCD, read gauge and replace an expired cylinder');
  await mobile.evaluate(() => { window.__originalRandom = Math.random; Math.random = () => .38; });
  await mobile.getByRole('button', { name: 'バディチェック', exact: true }).tap();
  await mobile.evaluate(() => { Math.random = window.__originalRandom; delete window.__originalRandom; });
  for (const id of ['buoyancy', 'buddy-vent']) await getChoice(mobile, id).press('Enter');
  await getChoice(mobile, 'weights').tap();
  await answer(mobile, 'normal').tap();
  await getChoice(mobile, 'releases').tap();
  await answer(mobile, 'normal').tap();
  assert.equal(await value(mobile), '3');
  await mobile.screenshot({ path: join(output, 'mobile-buddy-open-buckle.png'), fullPage: true });
  await answer(mobile, 'repair').tap();
  assert.match(await mobile.locator('#feedback').innerText(), /胸のバックルを閉じました/);
  await getChoice(mobile, 'buddy-valve').tap();
  await getChoice(mobile, 'air').press('Enter');
  await getChoice(mobile, 'alternate').tap();
  await answer(mobile, 'normal').tap();
  await getChoice(mobile, 'final').tap();
  const buddySaved = await mobile.evaluate(key => JSON.parse(localStorage.getItem(key)), reviewKey(buddy));
  assert.deepEqual(buddySaved.steps, ['releases']);
  assert.equal(buddySaved.scenario, 'buckle');
  checks.push('390 px buddy recall: identify and close the open buckle, save the missed step and its scenario');
  await mobile.locator('#guided').tap();
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
  const overview = mobile.locator('#review-overview-status');
  assert.match(await overview.innerText(), /2 \/ 6種目.*見直し 2種目/);
  assert.equal(await mobile.locator('#review-state-mask').innerText(), '見直し 2項目');
  assert.equal(await mobile.locator('#review-state-buddy').innerText(), '見直し 1項目');
  await getChoice(mobile, 'inspect').tap();
  await answer(mobile, 'normal').tap();
  const savedGearDraft = await mobile.evaluate(key => localStorage.getItem(key), draftKey);
  assert(savedGearDraft);
  const reviewShortcut = mobile.locator('#review-next');
  await reviewShortcut.tap();
  const queue = mobile.locator('#review-queue');
  assert.equal(await reviewShortcut.getAttribute('aria-expanded'), 'true');
  assert(await mobile.locator('#review-queue-title').evaluate(node => document.activeElement === node));
  assert.equal(await mobile.locator('#lesson-title').innerText(), '機材セッティング');
  assert.deepEqual(await queue.locator('h3:visible').allTextContents(), ['バディチェック', 'マスククリア']);
  assert.equal(await queue.getByRole('button').count(), 3);
  const replayBuckle = queue.getByRole('button', { name: 'バックル類を確認手順の見本を見る', exact: true });
  const replayMask = queue.getByRole('button', { name: 'マスクの上側を押さえる手順の見本を見る', exact: true });
  await replayBuckle.focus();
  const anotherTab = await mobile.context().newPage();
  await anotherTab.goto(previewUrl + 'revision.json');
  const finReview = reviewKey(lessons.at(-1));
  await anotherTab.evaluate(key => localStorage.setItem(key, JSON.stringify({ completedAt: Date.now(), steps: [] })), finReview);
  await mobile.waitForFunction(() => document.querySelector('#review-state-fins').textContent === '復習済み');
  assert.match(await overview.innerText(), /3 \/ 6種目.*見直し 2種目/);
  await anotherTab.evaluate(key => localStorage.removeItem(key), finReview);
  await mobile.waitForFunction(() => document.querySelector('#review-state-fins').textContent === '未復習');
  await anotherTab.close();
  assert.equal(await value(mobile), '1');
  assert(await queue.isVisible());
  assert(await replayBuckle.evaluate(node => document.activeElement === node));
  await mobile.screenshot({ path: join(output, 'mobile-review-overview.png'), fullPage: true });
  await replayBuckle.tap();
  assert(await queue.isHidden());
  assert.equal(await mobile.locator('#lesson-title').innerText(), 'バディチェック');
  assert.match(await mobile.locator('#step-description').innerText(), /両側が離れています/);
  await mobile.locator('#example-exit').tap();
  assert(await replayBuckle.evaluate(node => document.activeElement === node));
  await replayMask.press('Enter');
  assert.equal(await mobile.locator('#step-title').innerText(), 'マスクの上側を押さえる');
  await mobile.keyboard.press('Escape');
  assert(await replayMask.evaluate(node => document.activeElement === node));
  assert.equal(await mobile.locator('#lesson-title').innerText(), '機材セッティング');
  assert.equal(await value(mobile), '1');
  assert.equal(await mobile.evaluate(key => localStorage.getItem(key), draftKey), savedGearDraft);
  await reviewShortcut.tap();
  assert.equal(await reviewShortcut.getAttribute('aria-expanded'), 'false');
  assert(await queue.isHidden());
  checks.push('390 px review queue: reload restores missed steps from two lessons, tap and keyboard play the original scenarios, focus and an active draft survive');
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
  checks.push('390 px review: survives reload, replays the original fault and starts fresh recall without overwriting history');
  await mobile.locator('#guided').tap();
  await mobile.evaluate(() => window.scrollTo(0, 0));
  await mobile.locator('#hotspots .is-guide:visible').waitFor();
  await mobile.screenshot({ path: join(output, 'mobile-mask.png'), fullPage: true });
  const mobileCanvas = mobile.locator('#scene canvas');
  const reducedMotionFrame = await mobileCanvas.screenshot();
  await mobile.waitForTimeout(250);
  assert((await mobileCanvas.screenshot()).equals(reducedMotionFrame), 'Reduced motion keeps the water light still');
  checks.push('390 px shallow-water view: reduced-motion preference keeps the scene still');
  await mobile.locator('#perspective').tap();
  assert.equal(await mobile.locator('#perspective').getAttribute('aria-pressed'), 'false');
  assert(await mobile.locator('#mask-overlay').isHidden());
  await mobile.locator('#perspective').tap();
  await mobile.locator('#mask-fill').selectOption('mask-full');
  await mobile.locator('#recall').tap();
  assert.equal(await maskLevel(mobile), 100);
  assert.equal(await meterLevel(mobile), 1);
  await mobile.locator('#mask-overlay.is-flooded').waitFor();
  await mobile.screenshot({ path: join(output, 'mobile-mask-full.png'), fullPage: true });
  await getChoice(mobile, 'mask-exhale').press('Enter');
  assert.equal(await value(mobile), '0');
  await getChoice(mobile, 'mask-breathe').tap();
  await getChoice(mobile, 'mask-hold').tap();
  await mobile.evaluate(() => window.scrollTo(0, 0));
  await hold(mobile, 'mask-exhale', waterInput, .25);
  const fullRemaining = await maskLevel(mobile);
  assert(fullRemaining > 0 && fullRemaining < 90);
  assert.equal(await mobile.locator('#view-subtitle').innerText(), 'マスク内に水が残っている');
  assert.equal(await value(mobile), '2');
  await mobile.screenshot({ path: join(output, 'mobile-mask-full-partly-clear.png'), fullPage: true });
  assert.equal(await maskLevel(mobile), fullRemaining);
  await hold(mobile, 'mask-exhale', waterInput);
  assert.equal(await maskLevel(mobile), 0);
  assert.equal(await mobile.locator('#view-subtitle').innerText(), 'マスク内の水が抜けた');
  assert.equal(await value(mobile), '3');
  const savedFull = await mobile.evaluate(key => JSON.parse(localStorage.getItem(key)), maskReviewKey);
  assert.deepEqual(savedFull.steps, ['mask-breathe']);
  assert.equal(savedFull.route, 'mask-full');
  await mobile.reload();
  await mobile.getByRole('button', { name: 'マスククリア', exact: true }).tap();
  await mobile.locator('#mask-fill').selectOption('mask-partial');
  await previous.locator('summary').tap();
  await previous.getByRole('button', { name: '口で呼吸する手順の見本を見る', exact: true }).tap();
  assert.equal(await maskLevel(mobile), 100);
  await mobile.locator('#example-exit').tap();
  assert.equal(await maskLevel(mobile), 46);
  checks.push('390 px flooded mask: touch interruption, stable remaining water, complete clear and original scene replay after reload');
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
      assert.equal(await value(mobile), '5');
      await mobile.locator('#recovery-search').selectOption('reach');
      await mobile.locator('#recovery-clear').selectOption('exhale');
      assert.equal(await value(mobile), '0');
      assert.equal(await mobile.locator('#progress').getAttribute('aria-valuemax'), '6');
      await mobile.evaluate(() => { window.__originalRandom = Math.random; Math.random = () => .36; });
      await mobile.locator('#recall').tap();
      await mobile.evaluate(() => { Math.random = window.__originalRandom; delete window.__originalRandom; });
      await getChoice(mobile, 'bubbles').tap();
      await mobile.evaluate(() => window.scrollTo(0, 0));
      for (let i = 0; i < 3; i += 1) await mobile.locator('#rotate-right').tap();
      await part(mobile, 'reach').tap();
      await hold(mobile, 'trace-hose', waterInput, .30);
      assert.equal(await value(mobile), '2');
      assert.match(await mobile.locator('#feedback').innerText(), /ホースの途中/);
      await mobile.screenshot({ path: join(output, 'mobile-reach-hose.png'), fullPage: true });
      await hold(mobile, 'trace-hose', waterInput);
      assert.equal(await value(mobile), '3');
      await mobile.locator('#reset-view').tap();
      assert(await part(mobile, 'reg-breathe').isHidden());
      assert(await part(mobile, 'reg-exhale').isHidden());
      await part(mobile, 'replace').tap();
      await dock(mobile, 'mouth').tap();
      await getChoice(mobile, 'reg-breathe').tap();
      assert.equal(await value(mobile), '4');
      assert.equal(await mobile.locator('#feedback').getAttribute('data-tone'), 'retry');
      await hold(mobile, 'reg-exhale', waterInput, 1, async () => {
        await mobile.screenshot({ path: join(output, 'mobile-regulator-exhale.png'), fullPage: true });
      });
      await getChoice(mobile, 'reg-breathe').tap();
      assert.equal(await value(mobile), '6');
      const savedRecovery = await mobile.evaluate(key => JSON.parse(localStorage.getItem(key)), reviewKey(recovery));
      assert.deepEqual(savedRecovery.steps, ['reg-exhale']);
      assert.equal(savedRecovery.route, 'reach-exhale');
      await mobile.reload();
      await mobile.getByRole('button', { name: 'レギュレーター回収', exact: true }).tap();
      await mobile.locator('#recovery-search').selectOption('sweep');
      await mobile.locator('#recovery-clear').selectOption('purge');
      const recoveryHistory = mobile.locator('#previous-review');
      await recoveryHistory.locator('summary').tap();
      await recoveryHistory.getByRole('button', { name: '口から息を吐いて水を出す手順の見本を見る' }).tap();
      assert.equal(await mobile.locator('#step-title').innerText(), '口から息を吐いて水を出す');
      await mobile.locator('#example-exit').tap();
      assert.equal(await mobile.locator('#recovery-clear').inputValue(), 'purge');
      assert.equal(await value(mobile), '0');
      await mobile.locator('#recovery-clear').selectOption('exhale');
      await getChoice(mobile, 'bubbles').tap();
      await getChoice(mobile, 'sweep').tap();
      await getChoice(mobile, 'replace').tap();
      await dockChoice(mobile, 'mouth').tap();
      await getChoice(mobile, 'reg-exhale').press('Enter');
      await getChoice(mobile, 'reg-breathe').tap();
      assert.equal(await value(mobile), '5');
      checks.push('390 px recovery: shoulder and hose touch, interrupted trace, alternative clear, replay after reload and independent method selection');
    } else if (lesson.id === 'inflator') {
      const initial = await center(part(mobile, 'add-air'));
      await hold(mobile, 'add-air', waterInput, 1, async () => {
        assert.equal(await meterLevel(mobile), .48);
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
      assert.equal(await value(mobile), '3');
      assert.equal(await mobile.locator('#buoyancy-status').innerText(), '沈み気味');
      const trimMarker = part(mobile, 'trim-add');
      await trimMarker.waitFor();
      const markerY = () => trimMarker.evaluate(node => Number.parseFloat(node.style.top));
      const trimStart = await markerY();
      await trimMarker.tap();
      for (let i = 0; i < 3; i += 1) await mobile.locator('#trim-add').tap();
      assert.equal(await meterLevel(mobile), .64);
      assert.equal(await mobile.locator('#buoyancy-status').innerText(), '浮き気味');
      await trimMarker.scrollIntoViewIfNeeded();
      await mobile.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      const trimHigh = await markerY();
      assert(trimHigh < trimStart - 30, 'Short air pulses raise the model relative to the reference');
      const storedAir = await mobile.evaluate(key => JSON.parse(localStorage.getItem(key)).progress, draftKey);
      assert.equal(storedAir, .64);
      await part(mobile, 'trim-vent').tap();
      assert.equal(await meterLevel(mobile), neutralAir);
      assert.equal(await mobile.locator('#buoyancy-status').innerText(), '高さが安定');
      assert.equal(await mobile.locator('#effect-meter span').innerText(), '高さが安定');
      await mobile.waitForFunction(high =>
        Number.parseFloat(document.querySelector('#hotspots [data-part="trim-add"]').style.top) > high + 5, trimHigh);
      await mobile.screenshot({ path: join(output, 'mobile-inflator-balance.png'), fullPage: true });
      await getChoice(mobile, 'balance').tap();
      assert.equal(await value(mobile), '4');
      checks.push('390 px inflator: short pulses on 3D and touch controls raise the BCD, venting returns it to steady height');
    } else {
      await operate(mobile, lesson.actions[0], 'tap');
      await mobile.evaluate(() => window.scrollTo(0, 0));
      for (const action of lesson.actions.slice(1, 3)) {
        await part(mobile, action.id).tap();
        await dock(mobile, action.attachment.dock).tap();
      }
      await mobile.screenshot({ path: join(output, 'mobile-fins.png'), fullPage: true });
      const heel = part(mobile, 'fin-wiggle');
      const heelY = () => heel.evaluate(node => Number.parseFloat(node.style.top));
      await heel.waitFor();
      const initialHeel = await heelY();
      await hold(mobile, 'fin-wiggle', waterInput, 1, async () => {
        await mobile.waitForFunction(initial =>
          Math.abs(Number.parseFloat(document.querySelector('[data-part="fin-wiggle"]').style.top) - initial) > 10, initialHeel);
      });
      assert.equal(await value(mobile), '4');
      await part(mobile, 'fin-check').tap();
      assert(await mobile.locator('#viewport.has-detail').isVisible());
      await mobile.screenshot({ path: join(output, 'mobile-fin-loose.png'), fullPage: true });
      await answer(mobile, 'repair').tap();
      assert.equal(await value(mobile), '5');
      assert.match(await mobile.locator('#feedback').innerText(), /ストラップの長さを調整/);
      checks.push('390 px fin fit: a hold lifts the boot, heel close-up exposes the loose strap, and adjustment completes');
    }
    assert.equal(await mobile.locator('#result-heading').innerText(), '練習完了');
    assert(await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  }
  checks.push('390 px touch WebGL at /dive-atlas/: gear gestures, mask press, recovery and purge, buoyancy response, fin placement, wrong order and review');
  await mobile.context().close();

  const graphics = await testPage(mobileSize, true);
  await graphics.goto(previewUrl + 'training/');
  await ready(graphics);
  const graphicsCanvas = graphics.locator('#scene canvas');
  const sceneStatus = graphics.locator('#scene-status');
  async function loseGraphics() {
    await graphicsCanvas.evaluate(node => {
      node.testContextLoss = node.getContext('webgl2').getExtension('WEBGL_lose_context');
      if (!node.testContextLoss) throw new Error('WEBGL_lose_context is unavailable');
      node.testContextLoss.loseContext();
    });
    await sceneStatus.waitFor();
    assert.match(await sceneStatus.innerText(), /一時的に中断/);
    assert(await graphicsCanvas.isHidden());
    assert(await graphics.locator('#view-controls').isHidden());
    assert(await graphics.locator('#viewport').evaluate(node => node.clientHeight < 160));
  }
  async function restoreGraphics() {
    await graphicsCanvas.evaluate(node => node.testContextLoss.restoreContext());
    await graphicsCanvas.waitFor();
    await sceneStatus.waitFor({ state: 'hidden' });
    assert.equal(await graphicsCanvas.count(), 1);
    assert(await graphicsCanvas.evaluate(node => !node.getContext('webgl2').isContextLost()));
    assert(await graphics.locator('#viewport').evaluate(node => node.clientHeight > 240));
  }
  await part(graphics, 'inspect').tap();
  await answer(graphics, 'normal').focus();
  await loseGraphics();
  assert.equal(await value(graphics), '0');
  assert.match(await graphics.locator('#inspection-panel').innerText(), /検査期限は2028年5月/);
  assert(await answer(graphics, 'normal').evaluate(node => document.activeElement === node));
  await answer(graphics, 'normal').tap();
  assert.equal(await value(graphics), '1');
  await getChoice(graphics, 'inspect-ring').tap();
  await restoreGraphics();
  assert(await graphics.locator('#viewport.has-detail').isVisible());
  assert(await answer(graphics, 'repair').isVisible());
  await answer(graphics, 'repair').tap();
  assert.equal(await value(graphics), '2');
  await part(graphics, 'bcd').tap();
  await dock(graphics, 'cylinder').waitFor();
  await dockChoice(graphics, 'cylinder').focus();
  await loseGraphics();
  assert(await graphics.locator('#placement-menu').isVisible());
  assert.equal(await graphics.locator('#dock-markers button:visible').count(), 0);
  assert(await dockChoice(graphics, 'cylinder').evaluate(node => document.activeElement === node));
  await dockChoice(graphics, 'cylinder').tap();
  assert.equal(await value(graphics), '3');
  await restoreGraphics();
  await part(graphics, 'lock').waitFor();
  checks.push('390 px real WebGL loss: gear inspection and placement switch between 3D and text, preserving progress and focus');

  await graphics.getByRole('button', { name: 'マスククリア', exact: true }).tap();
  await graphics.locator('#mask-fill').selectOption('mask-full');
  await graphics.locator('#recall').tap();
  await getChoice(graphics, 'mask-exhale').press('Enter');
  assert.equal(await value(graphics), '0');
  await getChoice(graphics, 'mask-breathe').tap();
  await getChoice(graphics, 'mask-hold').tap();
  await graphics.evaluate(() => window.scrollTo(0, 0));
  const graphicsInput = touchDrag(await graphics.context().newCDPSession(graphics));
  await hold(graphics, 'mask-exhale', graphicsInput, .23, loseGraphics);
  const waterAtLoss = await maskLevel(graphics);
  assert(waterAtLoss > 0 && waterAtLoss < 90);
  assert.equal(await value(graphics), '2');
  assert(await getChoice(graphics, 'mask-exhale').isVisible());
  await graphics.screenshot({ path: join(output, 'mobile-graphics-interrupted.png'), fullPage: true });
  await restoreGraphics();
  assert.equal(await maskLevel(graphics), waterAtLoss);
  assert(await graphics.locator('#mask-overlay.is-sealed').isVisible());
  await graphics.evaluate(() => window.scrollTo(0, 0));
  await hold(graphics, 'mask-exhale', graphicsInput);
  assert.equal(await value(graphics), '3');
  assert.equal(await maskLevel(graphics), 0);
  await graphics.reload();
  assert.equal(await graphics.locator('#review-state-mask').innerText(), '見直し 1項目');
  await graphics.context().close();
  checks.push('390 px real WebGL loss during mask clear: cancel the interrupted press, preserve water through restoration and save the review');

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
  assert(await noGl.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  await noGl.locator('#show-example').tap();
  await noGl.locator('#example-next').tap();
  assert.equal(await noGl.locator('#step-title').innerText(), 'Oリングを確認');
  await noGl.locator('#example-exit').tap();
  for (const action of lessons[0].actions) await operate(noGl, action, 'tap');
  assert.equal(await noGl.locator('#result-heading').innerText(), '練習完了');
  await noGl.getByRole('button', { name: 'マスククリア', exact: true }).tap();
  for (const action of lessons[2].actions) await operate(noGl, action, 'tap');
  assert.equal(await noGl.locator('#result-heading').innerText(), '練習完了');
  await noGl.locator('#mask-fill').selectOption('mask-full');
  assert.match(await noGl.locator('#view-subtitle').innerText(), /全体に水が入った/);
  for (const action of fullMask.actions) await operate(noGl, action, 'tap');
  assert.equal(await noGl.locator('#result-heading').innerText(), '練習完了');
  await noGl.getByRole('button', { name: 'レギュレーター回収', exact: true }).tap();
  await noGl.locator('#recovery-search').selectOption('reach');
  await noGl.locator('#recovery-clear').selectOption('exhale');
  for (const action of recoveryRoute('reach-exhale').actions) await operate(noGl, action, 'tap');
  assert.equal(await noGl.locator('#result-heading').innerText(), '練習完了');
  await noGl.getByRole('button', { name: 'インフレーター', exact: true }).tap();
  for (const action of inflatorLesson.actions.slice(0, -1)) await operate(noGl, action, 'tap');
  for (let i = 0; i < 3; i += 1) await noGl.locator('#trim-add').press('Enter');
  assert.equal(await noGl.locator('#buoyancy-status').innerText(), '高さが安定');
  await getChoice(noGl, 'balance').press('Enter');
  assert.equal(await noGl.locator('#result-heading').innerText(), '練習完了');
  await noGl.getByRole('button', { name: 'フィンの履き方', exact: true }).tap();
  for (const action of finLesson.actions.slice(0, -1)) await operate(noGl, action, 'tap');
  await getChoice(noGl, 'fin-check').tap();
  assert.match(await noGl.locator('#inspection-panel').innerText(), /間にすき間ができました/);
  await answer(noGl, 'repair').tap();
  assert.equal(await noGl.locator('#result-heading').innerText(), '練習完了');
  checks.push('360 px WebGL-unavailable fallback: gear, mask, alternate recovery, inflator and loose fin fit still complete');
  await noGl.context().close();

  const offlineUrl = previewUrl + 'training/';
  async function preparePage(page) {
    await page.goto(offlineUrl);
    await ready(page);
    await page.locator('#offline-status[data-state="ready"]').waitFor({ timeout: 45000 });
    assert(await page.evaluate(() => navigator.serviceWorker.controller?.scriptURL.endsWith('/training/offline-worker.js')));
  }

  let offPhone = await testPage(mobileSize, true, 'allow');
  const offlineContext = offPhone.context();
  await offlineContext.addInitScript(() => {
    window.addEventListener('beforeinstallprompt', event => {
      if (event.isTrusted) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    }, { capture: true });
  });
  await preparePage(offPhone);
  const manifestSession = await offlineContext.newCDPSession(offPhone);
  const manifest = await manifestSession.send('Page.getAppManifest');
  assert.deepEqual(manifest.errors, []);
  const app = JSON.parse(manifest.data);
  const startUrl = new URL(app.start_url, manifest.url).href;
  assert.equal(startUrl, offlineUrl);
  assert.equal(new URL(app.scope, manifest.url).href, offlineUrl);
  assert.equal(app.display, 'standalone');
  const { installabilityErrors } = await manifestSession.send('Page.getInstallabilityErrors');
  assert.deepEqual(installabilityErrors.filter(error => error.errorId !== 'in-incognito'), []);
  const install = offPhone.getByRole('button', { name: '端末に追加', exact: true });
  await install.tap();
  assert(await offPhone.locator('#install-help').isVisible());
  assert.equal(await install.getAttribute('aria-expanded'), 'true');
  await offPhone.screenshot({ path: join(output, 'mobile-install-help.png'), fullPage: true });
  await offPhone.evaluate(() => {
    const event = new Event('beforeinstallprompt', { cancelable: true });
    event.prompt = async () => { document.documentElement.dataset.testInstall = 'opened'; };
    event.userChoice = Promise.resolve({ outcome: 'dismissed' });
    window.dispatchEvent(event);
  });
  await install.tap();
  assert.equal(await offPhone.locator('html').getAttribute('data-test-install'), 'opened');
  assert(await offPhone.locator('#install-help').isHidden());
  assert(await install.isVisible());
  checks.push('390 px static build: standalone manifest and icons pass Chrome checks apart from incognito; install help and dismissed prompt keep practice available');
  await offPhone.getByRole('button', { name: 'マスククリア', exact: true }).tap();
  await offPhone.locator('#mask-fill').selectOption('mask-full');
  await offPhone.locator('#recall').tap();
  await getChoice(offPhone, 'mask-exhale').tap();
  await getChoice(offPhone, 'mask-breathe').tap();
  await getChoice(offPhone, 'mask-hold').tap();
  const firstInput = touchDrag(await offPhone.context().newCDPSession(offPhone));
  await offPhone.evaluate(() => window.scrollTo(0, 0));
  await hold(offPhone, 'mask-exhale', firstInput, .30);
  const beforeClose = await maskLevel(offPhone);
  assert(beforeClose > 0 && beforeClose < 90);
  await offPhone.getByRole('button', { name: 'フィンの履き方', exact: true }).tap();
  assert.match(await offPhone.locator('#draft-description').innerText(), /マスククリア.*2 \/ 3手順/);
  await offPhone.close();
  await offlineContext.setOffline(true);
  await offlineContext.addInitScript(() => {
    Object.defineProperty(navigator, 'standalone', { value: true });
  });
  offPhone = await offlineContext.newPage();
  const offlineNavigation = await offPhone.goto(startUrl);
  assert(offlineNavigation?.fromServiceWorker());
  await ready(offPhone);
  await offPhone.locator('#offline-status[data-state="offline"]').waitFor();
  await offPhone.getByRole('link', { name: '地図に戻る', exact: true }).tap();
  assert.equal(offPhone.url(), startUrl);
  assert.match(await offPhone.locator('#offline-status').innerText(), /地図は通信が戻ると開けます/);
  assert(await offPhone.locator('#resume-practice').isVisible());
  await offPhone.screenshot({ path: join(output, 'mobile-resume-offline.png'), fullPage: true });
  await offPhone.locator('#resume-practice').tap();
  assert.equal(await value(offPhone), '2');
  assert.equal(await maskLevel(offPhone), beforeClose);
  assert.equal(await offPhone.locator('#mask-fill').inputValue(), 'mask-full');
  assert.equal(await offPhone.locator('#recall').getAttribute('aria-pressed'), 'true');
  assert(await offPhone.locator('#resume-practice').isHidden());
  await getChoice(offPhone, 'mask-exhale').press('Enter');
  assert.match(await offPhone.locator('#review').innerText(), /口で呼吸する/);
  assert.equal(await offPhone.evaluate(key => localStorage.getItem(key), draftKey), null);
  const finishedNavigation = await offPhone.reload();
  assert(finishedNavigation?.fromServiceWorker());
  await ready(offPhone);
  assert(await offPhone.locator('#resume-practice').isHidden());
  const savedFiles = await offPhone.evaluate(async scope => {
    const [name] = (await caches.keys()).filter(key => key.startsWith('dive-atlas-training@' + scope + '#'));
    const cache = await caches.open(name);
    return (await cache.keys()).map(item => new URL(item.url).pathname).sort();
  }, offlineUrl);
  assert(savedFiles.includes('/dive-atlas/vendor/three.module.js'));
  assert(savedFiles.includes('/dive-atlas/vendor/three.core.js'));
  assert(savedFiles.includes('/dive-atlas/training/drafts.js'));
  assert(savedFiles.includes('/dive-atlas/training/app.webmanifest'));
  for (const size of [192, 512]) {
    const dimensions = await offPhone.evaluate(async size => {
      const image = await createImageBitmap(await (await fetch('./icon-' + size + '.png')).blob());
      return [image.width, image.height];
    }, size);
    assert.deepEqual(dimensions, [size, size]);
  }
  assert(savedFiles.every(path => /^\/dive-atlas\/(training\/|vendor\/three\.)/.test(path)));
  assert(await offPhone.evaluate(async () => {
    try { await fetch('../journal.json'); return false; } catch { return true; }
  }), 'A training page must not cache the logbook');
  await offPhone.getByRole('button', { name: 'マスククリア', exact: true }).tap();
  await offPhone.locator('#previous-review summary').tap();
  await offPhone.locator('#previous-review').getByRole('button', { name: '口で呼吸する手順の見本を見る', exact: true }).tap();
  assert.equal(await offPhone.locator('#step-title').innerText(), '口で呼吸する');
  await offPhone.locator('#example-exit').tap();
  await offPhone.screenshot({ path: join(output, 'mobile-offline.png'), fullPage: true });
  await getChoice(offPhone, 'mask-breathe').tap();
  assert.equal(await value(offPhone), '1');
  assert(await offPhone.evaluate(key => Boolean(localStorage.getItem(key)), draftKey));
  await offPhone.locator('#reset').tap();
  assert.equal(await value(offPhone), '0');
  assert.equal(await offPhone.evaluate(key => localStorage.getItem(key), draftKey), null);
  assert.equal(await offPhone.locator('#review-state-mask').innerText(), '見直し 1項目');
  await offlineContext.setOffline(false);
  await offPhone.locator('#offline-status[data-state="ready"]').waitFor();
  assert(await offPhone.locator('#install-app').isHidden());
  await offlineContext.close();
  checks.push('390 px static build: manifest start URL launches offline, resumes the full-mask draft, saves the review, and keeps the offline map link in the app');

  const offPc = await testPage({ width: 1440, height: 960 }, false, 'allow');
  await preparePage(offPc);
  const updateContext = offPc.context();
  const observer = await updateContext.newPage();
  await observer.goto(previewUrl + 'revision.json');
  assert(await observer.evaluate(() => !navigator.serviceWorker.controller));
  await observer.evaluate(() => caches.open('test-unrelated-cache'));
  const updated = join(output, 'next-pages');
  await cp(dist, updated, { recursive: true });
  const nextHtml = join(updated, 'training', 'index.html');
  const baselineHtml = await readFile(nextHtml, 'utf8');
  await writeFile(nextHtml, baselineHtml.replace('id="title"', 'id="title" data-update="second"'));
  const nextVersion = await writeTrainingWorker(updated);

  servedPages = updated;
  const updatedStyle = join(updated, 'training', 'style.css');
  const validStyle = await readFile(updatedStyle, 'utf8');
  await writeFile(updatedStyle, validStyle + '\n/* invalid offline bundle */\n');
  const rejected = await offPc.evaluate(async () => {
    const registration = await navigator.serviceWorker.getRegistration();
    const outcome = new Promise(resolve => registration.addEventListener('updatefound', () => {
      const worker = registration.installing;
      worker.addEventListener('statechange', () => {
        if (worker.state === 'redundant' || worker.state === 'installed') resolve(worker.state);
      });
    }, { once: true }));
    await registration.update();
    return Promise.race([outcome, new Promise(resolve => setTimeout(() => resolve('timeout'), 10000))]);
  });
  assert.equal(rejected, 'redundant');
  assert.equal(await offPc.locator('#title').getAttribute('data-update'), null);
  await writeFile(updatedStyle, validStyle);
  await offPc.evaluate(async () => { await (await navigator.serviceWorker.getRegistration()).update(); });
  const waitingWorker = await observer.evaluateHandle(async scope => {
    const deadline = Date.now() + 10000;
    do {
      const worker = (await navigator.serviceWorker.getRegistration(scope))?.waiting;
      if (worker?.state === 'installed') return worker;
      await new Promise(resolve => setTimeout(resolve, 100));
    } while (Date.now() < deadline);
    throw new Error('The corrected offline worker did not reach the waiting state');
  }, offlineUrl);
  await offPc.reload();
  assert.equal(await offPc.locator('#title').getAttribute('data-update'), null);
  const oldKeys = await observer.evaluate(() => caches.keys());
  assert.equal(oldKeys.filter(key => key.startsWith('dive-atlas-training@')).length, 2);
  await offPc.close();
  await observer.waitForFunction(worker => worker.state === 'activated', waitingWorker);
  await waitingWorker.dispose();
  const activeKeys = await observer.evaluate(() => caches.keys());
  assert.deepEqual(activeKeys.filter(key => key.startsWith('dive-atlas-training@' + offlineUrl + '#')),
    ['dive-atlas-training@' + offlineUrl + '#' + nextVersion]);
  assert((await observer.evaluate(() => caches.keys())).includes('test-unrelated-cache'));
  await updateContext.setOffline(true);
  const newPc = await updateContext.newPage();
  const newNavigation = await newPc.goto(offlineUrl + 'index.html');
  assert(newNavigation?.fromServiceWorker());
  await ready(newPc);
  assert.equal(await newPc.locator('#title').getAttribute('data-update'), 'second');
  assert.deepEqual(pageErrors, []);
  checks.push('1440 px offline update: rejects a mismatched file, retains existing tab, activates the corrected build and preserves unrelated caches');
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
