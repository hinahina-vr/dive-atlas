import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { chromium } from 'playwright-core';
import { backup, normalizeLog, readBackup, sortLogs } from '../src/model.js';
import { diveSpots } from '../src/dive-spots.js';

const prefix = '/dive-atlas/';
fs.mkdirSync('artifacts/private-import', { recursive: true });
const folder = fs.mkdtempSync(path.resolve('artifacts', 'viewer-'));
const fixtureDir = fs.mkdtempSync(path.resolve('artifacts/private-import', 'viewer-'));
const fixture = path.join(fixtureDir, 'journal.json');
const original = process.env.DIVE_ATLAS_IMPORT_FILE;
const privateLogs = original
 ? readBackup(JSON.parse(fs.readFileSync(original, 'utf8')))
 : [
    normalizeLog({ id:'qa-local', date:'2026-10-15', site:'QA local only', lat:26.263, lon:127.547,
     temperature:0, notes:'<img src=x onerror=alert(1)>', depth:18.5, duration:45 }),
    normalizeLog({ id:'qa-missing', date:'2026-10-16', site:'QA missing position', depth:12 })
   ];
fs.writeFileSync(fixture, JSON.stringify(backup(privateLogs)));
process.env.DIVE_ATLAS_IMPORT_FILE = fixture;
process.env.PORT = '4494';
const { server } = await import('./serve.mjs');
if (!server.listening) await new Promise(resolve => server.once('listening', resolve));

const pages = path.join(folder, 'site');
execFileSync(process.execPath, ['scripts/build-pages.mjs', pages]);
const contents = fs.readdirSync(pages, { recursive:true }).map(String);
assert(!contents.some(file => /private|artifacts|\.zip$|\.db$|store\.js/.test(file)));
const revision = JSON.parse(fs.readFileSync(path.join(pages, 'revision.json'), 'utf8'));
assert.equal(revision.spots, diveSpots.length);
const publicRows = JSON.parse(fs.readFileSync(path.join(pages, 'journal.json'), 'utf8'));
for (const row of publicRows) assert.deepEqual(Object.keys(row).sort(), ['date','depth','duration','site']);
const mime = { '.html':'text/html', '.css':'text/css', '.js':'text/javascript', '.mjs':'text/javascript', '.json':'application/json', '.png':'image/png', '.geojson':'application/geo+json' };
const published = http.createServer((req,res)=>{
 if(!req.url.startsWith(prefix)) return res.writeHead(404).end();
 const filename = path.resolve(pages, req.url.slice(prefix.length).split('?')[0] || 'index.html');
 if(!filename.startsWith(pages+path.sep)||!fs.existsSync(filename)||!fs.statSync(filename).isFile()) return res.writeHead(404).end();
 res.writeHead(200, {'Content-Type':mime[path.extname(filename)]||'application/octet-stream'});
 res.end(fs.readFileSync(filename));
});
await new Promise(resolve=>published.listen(4495,'127.0.0.1',resolve));

const browser = await chromium.launch({ executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe', headless:true });
const errors = [];
const report = { revision, checks:[], errors };
const updateControls = '#import-open,#backup,#new-log,#edit-log,#delete-log,#editor,#importer,input[type=file]';
try {
 const localBase = 'http://127.0.0.1:4494/';
 assert.equal((await fetch(localBase+'api/import-tusa',{method:'POST'})).status,405);
 assert.equal((await fetch(localBase+'api/local-import',{headers:{Origin:'https://example.test'}})).status,403);
 assert.equal((await fetch(localBase+'artifacts/private-import/tusa-import.json')).status,404);
 for(const width of [1440,390]) {
  const mobile = width === 390;
  const context = await browser.newContext({viewport:{width,height:mobile?844:1000},isMobile:mobile,hasTouch:mobile,reducedMotion:'reduce'});
  const page = await context.newPage();
  page.on('pageerror', e=>errors.push(e.message));
  const mapReady=()=>page.waitForFunction(()=>document.querySelector('#map').dataset.mapState==='ready'&&document.querySelector('#ocean').dataset.engine==='webgl2',null,{timeout:45000});
  await page.goto(localBase);
  await mapReady();
  assert.equal(await page.locator('.log-card').count(),privateLogs.length);
  assert.equal(await page.locator(updateControls).count(),0);
  const log = sortLogs(privateLogs).find(row=>row.lat!==null);
  const card = page.locator('[data-log]').filter({hasText:log.site}).first();
  await card.click();
  assert.equal(await page.locator('#detail h2').textContent(),log.site);
  if(log.notes) assert.equal(await page.locator('.detail-notes').textContent(),log.notes);
  if(log.locationKind==='approximate') assert(await page.locator('#detail .location-approx').isVisible());
  if(log.signature) assert.equal(await page.locator('#detail .signature img').count(),1);
  assert.equal(await page.locator(updateControls).count(),0);
  await page.getByRole('searchbox').fill('---no result---');
  assert.equal(await page.locator('.log-card').count(),0);
  await page.reload();
  await mapReady();
  assert.equal(await page.locator('.log-card').count(),privateLogs.length);
  assert(!await page.evaluate(async()=> (await indexedDB.databases()).some(db=>db.name==='dive-atlas')));
  report.checks.push(width+'px: local JSON, search, reload, no edit controls, no new journal DB');

  if (!mobile) {
   const localRecord = {...privateLogs[0], id:'qa-prior-journal', site:'QA prior journal edit'};
   await page.evaluate(async record=>{
    await new Promise((resolve,reject)=>{
     const request = indexedDB.open('dive-atlas',1);
     request.onupgradeneeded=()=>request.result.createObjectStore('logs',{keyPath:'id'});
     request.onerror=()=>reject(request.error);
     request.onsuccess=()=>{
      const db=request.result;
      const tx=db.transaction('logs','readwrite');
      tx.objectStore('logs').put(record);
      tx.oncomplete=()=>{db.close();resolve();};
      tx.onabort=()=>reject(tx.error);
     };
    });
   },localRecord);
   const {digest} = await (await fetch(localBase+'api/local-import')).json();
   await page.evaluate(digest=>localStorage.setItem('dive-atlas:imported:'+digest,'done'),digest);
   await page.reload();
   await mapReady();
   assert.equal(await page.locator('.log-card').count(),1);
   assert.match(await page.locator('.log-card').textContent(),/QA prior journal edit/);
   fs.writeFileSync(fixture,JSON.stringify(backup(privateLogs))+'\n');
   await page.reload();
   await mapReady();
   assert.equal(await page.locator('.log-card').count(),privateLogs.length);
   report.checks.push('Previous browser edits visible for the old snapshot; a newly converted snapshot takes precedence');
  }

  const publicRequests = [];
  page.on('request', request=>publicRequests.push(request.url()));
  await page.route('**/src/map.js',async route=>{
   const response=await route.fetch();
   const source=await response.text();
   const instrumented=source.replace("canvas.dataset.mapState='loading'", "window.__verifiedDiveMap=map; canvas.dataset.mapState='loading'");
   await route.fulfill({response,body:instrumented});
  });
  await page.goto('http://127.0.0.1:4495'+prefix);
  await mapReady();
  assert.equal(await page.locator(updateControls).count(),0);
  assert.equal(await page.locator('.spot-pin').count(),diveSpots.length);
  const journal = page.locator('#journal');
  const journalToggle = page.getByRole('button',{name:'管理人（ひなひな）のダイブログ',exact:true});
  assert.equal(await journalToggle.getAttribute('aria-pressed'),'false');
  assert(await journal.isHidden());
  assert.equal(await page.locator('.log-card').count(),0);
  assert(!publicRequests.some(url=>url.endsWith('/journal.json')));
  assert(await page.evaluate(()=>document.querySelector('.map-stage').clientWidth===document.querySelector('.workspace').clientWidth));

  await page.getByRole('button',{name:'世界地図を表示',exact:true}).click();
  await mapReady();
  assert.match(await page.locator('#map-coordinate').textContent(),/0\.0°E$/);
  assert(await page.evaluate(()=>{
   const map=window.__verifiedDiveMap;
   const canvas=map.getCanvas();
   return [[-179,0],[179,0],[0,80],[0,-80]].every(coordinates=>{
    const {x,y}=map.project(coordinates);
    return x>=0&&x<=canvas.clientWidth&&y>=0&&y<=canvas.clientHeight;
   });
  }));
  await page.screenshot({path:path.join(folder,'world-'+width+'.png')});
  await page.getByRole('button',{name:'日本地図を表示',exact:true}).click();
  await mapReady();
  assert.match(await page.locator('#map-coordinate').textContent(),/134\.5°E$/);
  await page.screenshot({path:path.join(folder,'japan-'+width+'.png')});

  await page.emulateMedia({reducedMotion:'no-preference'});
  const lamp = await page.locator('.island-flower img').evaluateAll(images=>images.map(image=>{
   const animation = image.getAnimations()[0];
   animation.pause();
   animation.currentTime=0;
   return {duration:animation.effect.getTiming().duration, filter:getComputedStyle(image).filter};
  }));
  assert.deepEqual(lamp.map(value=>value.duration),[300,300]);
  assert.match(lamp[0].filter,/brightness\(1\.16\)/);
  assert.match(lamp[1].filter,/brightness\(0\.26\)/);
  await page.emulateMedia({reducedMotion:'reduce'});

  const journalResponse = page.waitForResponse(response=>response.url().endsWith('/journal.json')&&response.ok());
  await journalToggle.click();
  await journalResponse;
  await page.waitForFunction(()=>document.querySelector('#storage-status').textContent==='ログ閲覧専用');
  assert.equal(await journalToggle.getAttribute('aria-pressed'),'true');
  assert(await journal.isVisible());
  assert.equal(await page.locator('.log-card').count(),publicRows.length);
  await page.screenshot({path:path.join(folder,'journal-'+width+'.png')});
  if (publicRows.length) {
   const card = page.locator('.log-card').first();
   const row = publicRows[0];
   assert.equal(await card.locator('time').getAttribute('datetime'),row.date);
   await card.click();
   assert.equal(await page.locator('#detail h2').textContent(),row.site);
   assert.deepEqual(await page.locator('.detail-numbers span').allTextContents(),['最大水深','潜水時間']);
   assert.equal(await page.locator('.signature,.detail-photos,.detail-notes,.detail-area,.detail-meta').count(),0);
  }
  await journalToggle.click();
  assert(await journal.isHidden());
  assert(await page.locator('#detail').isHidden());
  assert.equal(await page.locator('.log-card').count(),0);
  await journalToggle.click();
  assert.equal(await page.locator('.log-card').count(),publicRows.length);
  await page.getByRole('button',{name:'サンプルを見る',exact:true}).click();
  assert.equal(await page.locator('.log-card').count(),5);
  await page.locator('[data-log="sample-5"]').click();
  assert(await page.locator('#detail').isVisible());
  assert.equal(await page.locator(updateControls).count(),0);
  assert(!publicRequests.some(url=>url.includes('/api/')||url.endsWith('/src/store.js')));
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  const toggle=page.locator('#spot-toggle');
  await toggle.click();
  assert(await page.locator('#spot-pins').isHidden());
  await toggle.click();
  assert(await page.locator('#spot-pins').isVisible());
  await mapReady();
  await page.screenshot({path:path.join(folder,'pages-'+width+'.png')});
  await page.reload();
  await mapReady();
  assert(await journal.isHidden());
  assert.equal(await journalToggle.getAttribute('aria-pressed'),'false');
  report.checks.push(width+'px: public map, world/Japan controls, alternating lamps, opt-in journal, four public fields, sample and POI toggle');
  await context.close();
 }
 assert.deepEqual(errors,[]);
 report.status='passed';
 console.log(report.checks.join('\n'));
} catch(error) {
 report.status='failed';
 report.failure=error.stack;
 throw error;
} finally {
 fs.writeFileSync(path.join(folder,'verification.json'),JSON.stringify(report,null,2));
 await browser.close();
 await Promise.all([new Promise(resolve=>server.close(resolve)),new Promise(resolve=>published.close(resolve))]);
}
