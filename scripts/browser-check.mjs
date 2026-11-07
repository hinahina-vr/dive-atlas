import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { chromium, devices } from 'playwright-core';
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
const publicJournalFile = path.join(pages, 'journal.json');
const builtRows = JSON.parse(fs.readFileSync(publicJournalFile, 'utf8'));
for (const row of builtRows) assert.deepEqual(Object.keys(row).sort(), ['date','depth','duration','site']);
// Use synthetic measurements to exercise real site names in the four-field Pages format.
const pinSites = ['黒島北','黒島南','カメ吉','那覇シーサイドパーク'];
const publicRows = pinSites.map(site => ({date:'2026-01-01', site, depth:15, duration:40}));
fs.writeFileSync(publicJournalFile, JSON.stringify(publicRows));
const mime = { '.html':'text/html', '.css':'text/css', '.js':'text/javascript', '.mjs':'text/javascript', '.json':'application/json', '.webmanifest':'application/manifest+json', '.svg':'image/svg+xml', '.png':'image/png', '.geojson':'application/geo+json' };
const published = http.createServer((req,res)=>{
 if(!req.url.startsWith(prefix)) return res.writeHead(404).end();
 const relative = req.url.slice(prefix.length).split('?')[0];
 const filename = path.resolve(pages, !relative || relative.endsWith('/') ? relative+'index.html' : relative);
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
 const localMusic = await (await fetch(localBase+'journal-bgm.json')).json();
 assert.deepEqual(JSON.parse(fs.readFileSync(path.join(pages, 'journal-bgm.json'), 'utf8')), []);
 assert(!contents.some(file => file.endsWith('.mp3')));
 assert.equal((await fetch(localBase+'api/import-tusa',{method:'POST'})).status,405);
 assert.equal((await fetch(localBase+'api/local-import',{headers:{Origin:'https://example.test'}})).status,403);
 assert.equal((await fetch(localBase+'artifacts/private-import/tusa-import.json')).status,404);
 const { defaultBrowserType, ...pixel } = devices['Pixel 7'];
 for (const width of [1440, pixel.viewport.width]) {
  const mobile = width === pixel.viewport.width;
  const context = await browser.newContext({
   ...(mobile ? pixel : { viewport:{width,height:1000} }),
   reducedMotion:'reduce'
  });
  await context.addInitScript(() => {
   window.__qaBonusRoll = .99;
   window.addEventListener('click', event => {
    if (!(event.target instanceof Element) || !event.target.closest('#public-journal-toggle,#journal-sound [value=silent]')) return;
    const originalRandom = Math.random;
    Math.random = () => window.__qaBonusRoll;
    setTimeout(() => { Math.random = originalRandom; }, 0);
   }, true);
  });
  const page = await context.newPage();
  page.on('pageerror', e=>errors.push(e.message));
  const mapReady=async ()=>{
   try {
    await page.waitForFunction(()=>document.querySelector('#map').dataset.mapState==='ready'&&document.querySelector('#ocean').dataset.engine==='webgl2',null,{timeout:90000});
   } catch (error) {
    const state = await page.evaluate(()=>({map:{...document.querySelector('#map').dataset},ocean:{...document.querySelector('#ocean').dataset}, camera:{moving:window.__verifiedDiveMap?.isMoving(), styleLoaded:window.__verifiedDiveMap?.isStyleLoaded(), tilesLoaded:window.__verifiedDiveMap?.areTilesLoaded()}}));
    throw new Error('Map readiness failed: '+JSON.stringify(state),{cause:error});
   }
  };
  async function checkOceanPalette(journalOpen) {
   await page.waitForFunction(open => {
    const ocean = document.querySelector('#ocean');
    return window.__verifiedDiveMap.getPaintProperty('water-main', 'fill-color') === (open ? '#53309d' : '#08779e')
     && getComputedStyle(ocean).mixBlendMode === (open ? 'screen' : 'soft-light');
   }, journalOpen);
  }
  async function waitForWaterAt(coordinates) {
   await page.waitForFunction(center => {
    const map = window.__verifiedDiveMap;
    const ocean = document.querySelector('#ocean');
    return Number(getComputedStyle(ocean).opacity) > 0
     && map.queryRenderedFeatures(map.project(center), {layers:['water-main']}).length > 0;
   }, coordinates, {timeout:60000});
  }
  const journal = page.locator('#journal');
  const journalToggle = page.getByRole('switch',{name:'管理人のダイブログ',exact:true});
  const spotToggle = page.getByRole('switch',{name:'ダイブスポット',exact:true});
  const soundDialog = page.getByRole('dialog',{name:'音が鳴るけどいい？',exact:true});
  async function toggleJournal(action = 'click') {
   const wasOpen = (await journalToggle.getAttribute('aria-checked')) === 'true';
   if (action === 'Space') await journalToggle.press('Space');
   else await journalToggle[action]();
   if (!wasOpen && localMusic.length && page.url().startsWith(localBase)) {
    await soundDialog.waitFor();
    assert.equal(await journalToggle.getAttribute('aria-checked'),'false');
    assert(await journal.isHidden());
    await checkOceanPalette(false);
    const silent = soundDialog.getByRole('button',{name:'鳴らさない',exact:true});
    assert(await silent.evaluate(button => document.activeElement === button));
    await silent.click();
   }
   await page.waitForFunction(open=>document.querySelector('#public-journal-toggle').getAttribute('aria-checked')===String(open),!wasOpen);
   assert(await soundDialog.isHidden());
   assert.equal(await page.locator('iframe[src*="youtube"],.journal-music').count(),0);
  }

  async function checkSwitch(toggle, on) {
   assert.equal(await toggle.getAttribute('aria-checked'), String(on));
   assert((await toggle.boundingBox()).height >= 44);
   const appearance = await toggle.locator('.toggle-track').evaluate(track => ({
    color: getComputedStyle(track).backgroundColor,
    thumb: getComputedStyle(track, '::before').transform,
   }));
   assert.deepEqual(appearance, on
    ? {color:'rgb(0, 130, 119)', thumb:'matrix(1, 0, 0, 1, 20, 0)'}
    : {color:'rgb(96, 120, 128)', thumb:'none'});
  }
  const journalBonus = page.locator('#journal-bonus');
  const lamps = page.locator('.island-flower img');
  async function checkLampsOff() {
   assert.deepEqual(await lamps.evaluateAll(images=>images.map(image=>image.getAnimations().length)),[0,0]);
   for (const filter of await lamps.evaluateAll(images=>images.map(image=>getComputedStyle(image).filter))) {
    assert.match(filter,/brightness\(0\.2\)/);
   }
   assert(await journalBonus.isHidden());
  }
  await page.route('**/src/map.js',async route=>{
   const response=await route.fetch();
   const source=await response.text();
   const instrumented=source.replace("canvas.dataset.mapState='loading'", "window.__verifiedDiveMap=map; canvas.dataset.mapState='loading'");
   await route.fulfill({response,body:instrumented});
  });
  const trainingLink = page.getByRole('link', { name:'OWD スキルラボ', exact:true });
  const mapLink = page.getByRole('link', { name:'地図に戻る', exact:true });
  const openTraining = async base => {
   await trainingLink[mobile ? 'tap' : 'click']();
   await page.waitForURL(base + 'training/');
   await page.getByRole('heading', { name:'OWD スキルラボ', exact:true }).waitFor();
   await page.locator('#scene canvas').waitFor();
  };
  const camera = () => page.evaluate(() => {
   const map = window.__verifiedDiveMap;
   return { center:map.getCenter().toArray(), zoom:map.getZoom(), world:!map.getRenderWorldCopies() };
  });
  function checkCamera(before, after) {
   assert.equal(after.world, before.world);
   assert(Math.abs(after.zoom - before.zoom) < 1e-5);
   assert(after.center.every((coordinate, i) => Math.abs(coordinate - before.center[i]) < 1e-5));
  }
  await page.goto(localBase,{waitUntil:'domcontentloaded',timeout:60000});
  await mapReady();
  await openTraining(localBase);
  await mapLink[mobile ? 'tap' : 'click']();
  await page.waitForURL(localBase);
  await mapReady();
  assert(await journalToggle.isVisible());
  await checkSwitch(journalToggle, false);
  await checkOceanPalette(false);
  assert(await journal.isHidden());
  assert.equal(await page.locator('#pins .pin').count(),0);
  await checkLampsOff();
  await toggleJournal();
  await mapReady();
  await checkOceanPalette(true);
  assert.equal(await page.locator('.log-card').count(),privateLogs.length);
  if (pinSites.every(site=>privateLogs.some(log=>log.site===site))) {
   for (const site of pinSites) {
    assert(await page.getByRole('button',{name:site+'のログを開く',exact:true}).isVisible());
   }
  }
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
  await page.reload({waitUntil:'domcontentloaded',timeout:60000});
  await mapReady();
  assert(await journal.isHidden());
  await checkLampsOff();
  await toggleJournal();
  await mapReady();
  assert.equal(await page.locator('.log-card').count(),privateLogs.length);
  assert(!await page.evaluate(async()=> (await indexedDB.databases()).some(db=>db.name==='dive-atlas')));
  report.checks.push(width+'px: local JSON, search, reload, consent before mode change when audio is configured, no edit controls, no new journal DB');

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
   await page.reload({waitUntil:'domcontentloaded',timeout:60000});
   await mapReady();
   await toggleJournal();
   await mapReady();
   assert.equal(await page.locator('.log-card').count(),1);
   assert.match(await page.locator('.log-card').textContent(),/QA prior journal edit/);
   fs.writeFileSync(fixture,JSON.stringify(backup(privateLogs))+'\n');
   await page.reload({waitUntil:'domcontentloaded',timeout:60000});
   await mapReady();
   await toggleJournal();
   await mapReady();
   assert.equal(await page.locator('.log-card').count(),privateLogs.length);
   report.checks.push('Previous browser edits visible for the old snapshot; a newly converted snapshot takes precedence');
  }

  const publicRequests = [];
  page.on('request', request=>publicRequests.push(request.url()));
  const pagesBase = 'http://127.0.0.1:4495' + prefix;
  await page.goto(pagesBase,{waitUntil:'domcontentloaded',timeout:60000});
  await mapReady();
  assert.equal(await page.locator(updateControls).count(),0);
  const spotPins = page.locator('.spot-pin');
  assert.equal(await spotPins.count(),diveSpots.length);
  const renderedIcons = await spotPins.evaluateAll(pins => pins.map(pin => [
   pin.dataset.spot, pin.dataset.spotIcon, pin.querySelector('svg')?.getAttribute('viewBox'),
  ]));
  assert.deepEqual(renderedIcons,diveSpots.map(spot => [spot.id, spot.icon, '0 0 32 32']));
  const examples = [
   ['chibishi','turtle'],
   ['sunabe','coral'],
   ['ogasawara','wreck'],
   ['blue-cave','cave'],
   ['mikomoto-jabune','hammerhead'],
   ['kin-cape','shark'],
   ['bohol-napaling','fishSchool'],
   ['manta-scramble','ray'],
   ['hayakawa-beach','sand'],
   ['nebukawa-platform','structure'],
   ['hayama-sangashita','nudibranch'],
   ['miura-mitohama','kelp'],
   ['taketomi-hot-spring','vent'],
   ['fukuura-beach','anemone'],
   ['hachijokojima-wada','gardenEel'],
   ['futo','squid'],
   ['susami-underwater-post','postbox'],
  ];
  const iconMarkup = new Set();
  for (const [id,icon] of examples) {
   const pin = page.locator('[data-spot="'+id+'"]');
   assert.equal(await pin.getAttribute('data-spot-icon'),icon);
   iconMarkup.add(await pin.locator('svg').innerHTML());
  }
  assert.equal(iconMarkup.size,examples.length);

  const catshark = diveSpots.find(spot=>spot.id==='usami-catshark-pipes');
  const catsharkPin = page.locator('[data-spot="'+catshark.id+'"]');
  await page.evaluate(center=>window.__verifiedDiveMap.jumpTo({center,zoom:18}),catshark.coordinates);
  await waitForWaterAt(catshark.coordinates);
  if (mobile) await catsharkPin.tap();
  else await catsharkPin.click();
  assert.equal(await page.locator('#detail h2').textContent(),catshark.name);
  await page.evaluate(()=>window.__verifiedDiveMap.setZoom(13.4));
  assert(await catsharkPin.isVisible(), 'The open spot keeps its pin when nearby pins overlap');
  assert.equal(await catsharkPin.getAttribute('aria-pressed'),'true');
  assert.equal(await catsharkPin.getAttribute('data-spot-icon'),'shark');
  await page.locator('#spot-close').click();
  assert.equal(await catsharkPin.getAttribute('aria-pressed'),'false');

  const turtleSpot = diveSpots.find(spot=>spot.id==='nagannu-north');
  const turtlePin = page.getByRole('button',{name:turtleSpot.name+'のスポット情報',exact:true});
  await page.evaluate(center=>window.__verifiedDiveMap.jumpTo({center,zoom:14}),turtleSpot.coordinates);
  await mapReady();
  await waitForWaterAt(turtleSpot.coordinates);
  assert(await turtlePin.isVisible());
  await page.mouse.move(0,0);
  const badgeOpacity = () => turtlePin.evaluate(pin=>getComputedStyle(pin,'::before').opacity);
  assert.equal(await badgeOpacity(),'0');
  assert.equal(await turtlePin.locator('svg').evaluate(svg=>getComputedStyle(svg).backgroundColor),'rgba(0, 0, 0, 0)');
  assert((await turtlePin.locator('svg [fill]').count())>=4);
  await page.screenshot({path:path.join(folder,'turtle-cutout-'+width+'.png')});
  if (mobile) await turtlePin.tap();
  else {
   await turtlePin.hover();
   assert.equal(await badgeOpacity(),'1');
   await turtlePin.click();
  }
  assert.equal(await badgeOpacity(),'1');
  assert.equal(await page.locator('#detail h2').textContent(),turtleSpot.name);
  assert.match(await page.locator('#detail').textContent(),/ウミガメ/);
  await page.screenshot({path:path.join(folder,'turtle-pin-'+width+'.png')});
  const spotCamera = await camera();
  await openTraining(pagesBase);
  await mapLink[mobile ? 'tap' : 'click']();
  await page.waitForURL(pagesBase);
  await mapReady();
  checkCamera(spotCamera, await camera());
  await waitForWaterAt(turtleSpot.coordinates);
  assert.equal(await page.locator('#detail h2').textContent(), turtleSpot.name);
  assert.equal(await turtlePin.getAttribute('aria-pressed'), 'true');
  await page.screenshot({path:path.join(folder,'training-map-return-'+width+'.png')});
  await page.locator('#detail button').first().click();
  await checkLampsOff();
  assert.equal(await journalToggle.getAttribute('aria-checked'),'false');
  assert(await journal.isHidden());
  assert.equal(await page.locator('.log-card').count(),0);
  assert(!publicRequests.some(url=>url.endsWith('/journal.json')));
  assert(await page.evaluate(()=>document.querySelector('.map-stage').clientWidth===document.querySelector('.workspace').clientWidth));

  await page.getByRole('button',{name:'世界地図を表示',exact:true}).click();
  await mapReady();
  assert.match(await page.locator('#map-coordinate').textContent(),/0\.0°E$/);
  const worldCamera = await camera();
  await openTraining(pagesBase);
  await page.goBack();
  await page.waitForURL(pagesBase);
  await mapReady();
  checkCamera(worldCamera, await camera());
  assert(await page.locator('#detail').isHidden());
  assert.equal(await page.evaluate(() => sessionStorage.getItem('dive-atlas:training-return')), null);
  report.checks.push(width+'px: map link opens 3D training locally and under /dive-atlas/; return restores a selected spot and browser Back restores world view');
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

  assert.equal(await page.getByText('NO DIVE, NO LIFE.',{exact:true}).count(),0);
  await checkSwitch(spotToggle, true);
  await page.screenshot({path:path.join(folder,'switches-default-'+width+'.png')});
  if (mobile) await spotToggle.tap();
  else await spotToggle.press('Space');
  await checkSwitch(spotToggle, false);
  assert(await page.locator('#spot-pins').isHidden());
  await page.reload({waitUntil:'domcontentloaded',timeout:60000});
  await mapReady();
  await checkSwitch(spotToggle, false);
  assert(await page.locator('#spot-pins').isHidden());
  const journalResponse = page.waitForResponse(response=>response.url().endsWith('/journal.json')&&response.ok());
  await toggleJournal(mobile ? 'tap' : 'Space');
  await journalResponse;
  await page.waitForFunction(()=>document.querySelector('#storage-status').textContent==='ログ閲覧専用');
  await checkSwitch(journalToggle, true);
  await checkOceanPalette(true);
  assert(await journal.isVisible());
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

  assert.equal(await page.locator('.log-card').count(),publicRows.length);
  await mapReady();
  assert.equal(await page.locator('#pins .pin:visible').count(),pinSites.length);
  assert.equal(await page.locator('#pins .pin').evaluateAll(pins=>pins.every(pin=>
   getComputedStyle(pin,'::before').backgroundImage.includes('hibiscus-pink.png')
  )),true);
  assert(await page.evaluate(()=>scrollY===0));
  await page.screenshot({path:path.join(folder,'journal-'+width+'.png')});
  for (const site of pinSites) {
   await page.getByRole('button',{name:site+'のログを開く',exact:true}).click();
   assert.equal(await page.locator('#detail h2').textContent(),site);
   assert.deepEqual(await page.locator('.detail-numbers span').allTextContents(),['最大水深','潜水時間']);
   assert.equal(await page.locator('.signature,.detail-photos,.detail-notes,.detail-area,.detail-meta').count(),0);
   assert.match(await page.locator('.detail-footer').textContent(),/地図の位置は目安/);
   await toggleJournal();
   assert.equal(await page.locator('#pins .pin').count(),0);
   await toggleJournal();
   await mapReady();
  }
  const row = publicRows[0];
  const publicCard = page.locator('.log-card').filter({hasText:row.site});
  assert.equal(await publicCard.locator('time').getAttribute('datetime'),row.date);
  await publicCard.click();
  assert.equal(await page.locator('#detail h2').textContent(),row.site);
  await toggleJournal();
  assert(await journal.isHidden());
  assert(await page.locator('#detail').isHidden());
  assert.equal(await page.locator('.log-card').count(),0);
  await checkOceanPalette(false);
  await checkLampsOff();

  await page.evaluate(()=>{ window.__qaBonusRoll = 0; });
  await page.emulateMedia({reducedMotion:'no-preference'});
  await toggleJournal();
  await journalBonus.waitFor({state:'visible'});
  assert.equal(await journalBonus.textContent(),'BIG BONUS');
  await journalToggle.locator('.toggle-track').evaluate(async track => {
   await Promise.all(track.getAnimations({subtree:true}).map(animation => animation.finished));
  });
  await journalBonus.locator('span').evaluate(title=>title.getAnimations()[0].currentTime = 520);
  await page.screenshot({path:path.join(folder,'journal-premium-'+width+'.png')});
  await toggleJournal();
  await checkLampsOff();
  await toggleJournal();
  await journalBonus.waitFor({state:'visible'});
  await journalBonus.waitFor({state:'hidden',timeout:5000});
  await checkOceanPalette(true);
  assert.equal(await journalToggle.getAttribute('aria-checked'),'true');
  assert.deepEqual(await lamps.evaluateAll(images=>images.map(image=>getComputedStyle(image).animationName)),
   ['hibiscus-alternate','hibiscus-alternate']);
  await page.emulateMedia({reducedMotion:'reduce'});
  assert.equal(await page.locator('.log-card').count(),publicRows.length);
  await page.getByRole('button',{name:'サンプルを見る',exact:true}).click();
  assert.equal(await page.locator('.log-card').count(),5);
  await page.locator('[data-log="sample-5"]').click();
  assert(await page.locator('#detail').isVisible());
  assert.equal(await page.locator(updateControls).count(),0);
  assert(!publicRequests.some(url=>url.includes('/api/')||url.endsWith('/src/store.js')));
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await spotToggle.click();
  await checkSwitch(spotToggle, true);
  assert(await page.locator('#spot-pins').isVisible());
  await mapReady();
  await page.screenshot({path:path.join(folder,'pages-'+width+'.png')});
  await page.reload({waitUntil:'domcontentloaded',timeout:60000});
  await mapReady();
  assert(await journal.isHidden());
  assert.equal(await journalToggle.getAttribute('aria-checked'),'false');
  await checkOceanPalette(false);
  report.checks.push(width+'px: public map, world/Japan controls, off/alternating lamps and premium, journal water palette, opt-in journal, four public fields, separate hibiscus pins, paper-cut spot icons, selected pin stays visible on zoom-out, interaction badges, sample, switch visuals and keyboard/touch operation');
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
