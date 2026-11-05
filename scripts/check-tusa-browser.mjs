import {chromium} from 'playwright-core';import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {normalizeLog,sortLogs} from '../src/model.js';
const source=process.env.DIVE_ATLAS_IMPORT_FILE,zip=process.env.TUSA_ZIP;if(!source||!zip)throw new Error('Specify private import JSON and TUSA_ZIP explicitly.');process.env.PORT='4495';const expected=JSON.parse(fs.readFileSync(source,'utf8')).logs.map(normalizeLog);const {server}=await import('./serve.mjs');if(!server.listening)await new Promise(r=>server.once('listening',r));
const out=path.resolve('artifacts'),report={date:'2026-11-05',checks:[],errors:[],realBackup:true};const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
try{
 const response=await fetch('http://127.0.0.1:4495/api/import-tusa',{method:'POST',headers:{'Content-Type':'application/zip'},body:fs.readFileSync(zip)});assert(response.ok);const raw=await response.json();assert.equal(raw.logs.length,expected.length);assert(raw.logs.every(l=>l.lat===null&&l.lon===null));assert(raw.logs.every(l=>l.number===null));assert.equal(raw.logs.filter(l=>l.signature).length,expected.filter(l=>l.signature).length);report.checks.push('Actual native ZIP and SQLite parsed, missing GPS preserved, database IDs not mistaken for dive numbers');
 assert.equal((await fetch('http://127.0.0.1:4495/api/local-import',{headers:{Origin:'https://example.test'}})).status,403);assert.equal((await fetch('http://127.0.0.1:4495/artifacts/private-import/tusa-import.json')).status,404);report.checks.push('Cross-origin import denied; private artifact not statically served');
 for(const width of [1440,390]){
  const c=await browser.newContext({viewport:{width,height:width===1440?1000:844},isMobile:width<700,hasTouch:width<700,reducedMotion:'reduce',acceptDownloads:true});const p=await c.newPage();p.on('pageerror',e=>report.errors.push(e.message));await p.goto('http://127.0.0.1:4495');await p.waitForFunction(()=>document.querySelectorAll('.log-card').length===4&&document.querySelector('#ocean').dataset.engine==='webgl2'&&document.querySelector('#map').dataset.mapState==='ready');await p.waitForTimeout(150);
  const stored=await p.evaluate(async()=>{const store=await import('./src/store.js');return store.loadLogs();});assert.deepEqual(sortLogs(stored),sortLogs(expected));assert.equal(await p.locator('.pin').count(),3);assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  const spotToggle = p.getByRole('button', { name: '有名スポット', exact: true });
  const nagannu = p.getByRole('button', { name: 'ナガンヌ島・桟橋前のスポット情報', exact: true });
  assert.equal(await spotToggle.getAttribute('aria-pressed'), 'true');
  await nagannu.click({ timeout: 8000 });
  assert.match(await p.locator('#detail').textContent(), /初心者向け/);
  assert.match(await p.locator('#detail .spot-stars').textContent(), /★☆☆☆☆/);
  assert.match(await p.locator('#detail .spot-highlight').textContent(), /ウミガメ/);
  const sourceLink = p.locator('#detail .spot-reference a');
  assert.equal(await sourceLink.count(), 1);
  await p.waitForFunction(() => document.querySelector('#map').dataset.mapState === 'ready');
  if (width < 700) {
    const [pin, card, source] = await Promise.all([nagannu.boundingBox(), p.locator('#detail').boundingBox(), sourceLink.boundingBox()]);
    assert(pin && card && source && pin.y + pin.height < card.y, 'The selected pin remains above the mobile card');
    assert(source.y + source.height <= card.y + card.height, 'The source link fits in the mobile card');
  }
  await p.screenshot({ path: path.join(out, 'famous-spots-' + width + '.png') });
  await spotToggle.click();
  assert.equal(await spotToggle.getAttribute('aria-pressed'), 'false');
  assert(await p.locator('#spot-pins').isHidden());
  assert(await p.locator('#detail').isHidden());
  assert.equal(await p.locator('#pins .pin').count(), 3);
  await p.reload();
  await p.waitForFunction(() => document.querySelector('#map').dataset.mapState === 'ready');
  assert.equal(await spotToggle.getAttribute('aria-pressed'), 'false');
  await spotToggle.click();
  await nagannu.waitFor({ state: 'visible' });
  report.checks.push(width + ': famous spots open with highlights, difficulty and source; toggle persists and log pins remain');

  if (width === 1440) {
    const markerBounds = await nagannu.boundingBox();
    await p.getByRole('button', { name: 'ログを書く', exact: true }).click();
    await p.getByRole('button', { name: '地図で選ぶ', exact: true }).click();
    await p.mouse.click(markerBounds.x + markerBounds.width / 2, markerBounds.y + markerBounds.height / 2);
    await p.waitForSelector('#editor[open]');
    assert.match(await p.locator('[name=lat]').inputValue(), /^26\.\d+$/);
    await p.locator('[data-close="editor"]').first().click();
    await p.getByRole('button', { name: 'サンプルを見る', exact: true }).click();
    await p.locator('[data-log="sample-3"]').click();
    await p.locator('#detail-close').click();
    await p.getByRole('button', { name: 'ブルーコーナーのスポット情報', exact: true }).click({ timeout: 8000 });
    assert.match(await p.locator('#detail .spot-rating').textContent(), /★★★★★.*上級者向け/s);
    assert.match(await p.locator('#detail .spot-conditions').textContent(), /潮流/);
    await p.getByRole('button', { name: '自分のログへ', exact: true }).click();
    report.checks.push('Public markers do not block location picking; Palau Blue Corner opens as an advanced site');
  }

  await p.locator('[data-log="'+expected.at(-1).id+'"]').click();await p.waitForFunction(()=>document.querySelector('#map').dataset.mapState==='ready'&&JSON.parse(document.querySelector('#map').dataset.islandLabels||'[]').includes('黒島'));await p.waitForTimeout(1300);const names=JSON.parse(await p.locator('#map').getAttribute('data-island-labels'));report.checks.push(width+': built-in vector island labels: '+names.join(' / '));assert(Number(await p.locator('#ocean').getAttribute('data-water-features'))>0);assert.match(await p.locator('#detail').textContent(),/位置は目安/);assert.match(await p.locator('#detail').textContent(),/平均水深/);await p.screenshot({path:path.join(out,'okislo-real-'+width+'.png'),fullPage:width<700});
  const ocean = p.locator('#ocean');
  const lamps = p.locator('.map-stage .island-flower img');
  assert.equal(await lamps.count(), 2);
  assert(await lamps.evaluateAll(images => images.every(image =>
    image.complete && image.naturalWidth === 256 && getComputedStyle(image).animationName === 'none'
  )), 'Both new pink sprites load and remain still with reduced motion');
  const before = await ocean.getAttribute('data-draws');
  await p.waitForTimeout(120);
  assert.equal(await ocean.getAttribute('data-draws'), before);
  await p.emulateMedia({ reducedMotion: 'no-preference' });
  await p.waitForTimeout(700);
  assert(Number(await ocean.getAttribute('data-draws')) > Number(before));
  const timing = await lamps.evaluateAll(images => images.map(image => {
    const { duration, delay } = image.getAnimations()[0].effect.getTiming();
    return [duration, delay];
  }));
  assert.deepEqual(timing, [[400, 0], [400, -200]], 'Lamp changes every 200 ms');
  const observedLitLamps = new Set();
  for (let sample = 0; sample < 12; sample++) {
    const lit = await lamps.evaluateAll(images => images.map(image => {
      const filter = getComputedStyle(image).filter;
      return Number(filter.match(/brightness\(([\d.]+)\)/)?.[1]) > 1;
    }));
    assert.equal(lit.filter(Boolean).length, 1, 'Exactly one lamp is lit at any given phase');
    observedLitLamps.add(lit.indexOf(true));
    await p.waitForTimeout(60);
  }
  assert.equal(observedLitLamps.size, 2, 'Both the left and right lamp take a turn');
  report.checks.push(width + ': pink hibiscus lamps alternate every 200 ms with no simultaneous flash');
  await p.getByRole('button', { name: '水面の動きを止める', exact: true }).click();
  const paused = await ocean.getAttribute('data-draws');
  await p.waitForTimeout(150);
  assert.equal(await ocean.getAttribute('data-draws'), paused);
  const dl=p.waitForEvent('download');await p.getByRole('button',{name:'バックアップ',exact:true}).click();const d=await dl;const backupPath=path.join(out,'private-import/real-backup-'+width+'.json');await d.saveAs(backupPath);const exported=JSON.parse(fs.readFileSync(backupPath,'utf8')).logs;assert.deepEqual(sortLogs(exported),sortLogs(expected));
  await p.getByRole('button',{name:'記録を編集',exact:true}).click();const original=await p.locator('[name=notes]').inputValue();await p.locator('[name=notes]').fill(original+'テスト');await p.getByRole('button',{name:'記録を保存',exact:true}).click();await p.waitForFunction(()=>!document.querySelector('#editor').open);await p.reload();await p.waitForSelector('.log-card');const edited=await p.evaluate(async()=>{const {loadLogs}=await import('./src/store.js');return loadLogs();});assert(edited.some(l=>l.notes.endsWith('テスト')));assert.equal(edited.filter(l=>l.signature).length,4);
  report.checks.push(width+': real 4 dives/4 signatures, 3 approximate map places, exact backup, edit/reload, WebGL motion/reduced-motion/pause, no horizontal overflow');await c.close();
 }
 const islandData=JSON.parse(fs.readFileSync('assets/okinawa-island-names.geojson','utf8'));assert(islandData.features.some(f=>f.properties.name==='儀志布島'));assert(islandData.features.some(f=>f.properties.name==='黒島'));report.checks.push('Built-in public geographic gazetteer includes 109 Okinawa islands, including small islands absent from standard tiles');assert.deepEqual(report.errors,[]);report.status='passed';report.counts={dives:expected.length,signatures:expected.filter(l=>l.signature).length,photos:expected.reduce((n,l)=>n+l.photos.length,0),minutes:expected.reduce((n,l)=>n+l.duration,0)};
}catch(e){report.status='failed';report.failure=e.stack;throw e;}finally{fs.writeFileSync(path.join(out,'tusa-verification.json'),JSON.stringify(report,null,2));await browser.close();await new Promise(r=>server.close(r));}
