import {normalizeLog,sortLogs,summary,readBackup,readPublicJournal} from './model.js';
import {createMap} from './map.js';
import {diveSpots} from './dive-spots.js';

const journalSites = new Map([
 ['黒島北', diveSpots.find(spot => spot.id === 'kerama-kuroshima')?.coordinates],
 ['黒島南', diveSpots.find(spot => spot.id === 'kerama-kuroshima-south')?.coordinates],
 // Between northern Tokashiki and Gishibu: https://www.okinawa-kahana.com/fun-diving/kerama.html
 ['カメ吉', [127.361, 26.2255]],
 // Dedicated dive area: https://www.naminouebeach.jp/about/map/
 ['那覇シーサイドパーク', [127.6661, 26.22115]],
]);

function withJournalPosition(log) {
 const coordinates = journalSites.get(log.site);
 if (!coordinates) return log;
 const [lon, lat] = coordinates;
 // Keep recorded locations and same-name sites outside the identified area.
 if (log.lat !== null && (log.locationKind !== 'approximate' || Math.hypot(log.lat - lat, log.lon - lon) > .05)) return log;
 return {...log, lon, lat, locationKind:'approximate', locationLabel:'公開案内から見たダイビングポイントの目安'};
}
const $=s=>document.querySelector(s),escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const paths={plus:'M12 5v14M5 12h14',minus:'M5 12h14',close:'m6 6 12 12M6 18 18 6',pin:'M20 10c0 6-8 11-8 11S4 16 4 10a8 8 0 1 1 16 0ZM15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0',search:'M21 21l-6-6M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0',japan:'m18 3 3 1-1 3-3 1-1-2zM16 9l2 2-2 3-4 1-2 3-3 1-1-2 4-2 1-3 3-1zM6 19l-1 2-2-1 1-2zM2 22h.1',globe:'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM3 12h18M12 3c5 5 5 13 0 18-5-5-5-13 0-18',info:'M12 11v6m0-10v1M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0'};
const icon=name=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[name]||paths.info}"/></svg>`;
const icons=()=>document.querySelectorAll('[data-icon]:not([data-icon-ready])').forEach(el=>{el.insertAdjacentHTML('afterbegin',icon(el.dataset.icon));el.dataset.iconReady='true';});icons();
const samples=[
 {id:'sample-5',number:128,date:'2026-10-18',site:'マンタスクランブル',area:'沖縄・石垣島',lat:24.482,lon:124.151,depth:18.5,duration:48,temperature:27,visibility:25,buddy:'サンプル',creatures:'マンタ、カクレクマノミ',notes:'水面から差す光の下を、マンタがゆっくり横切っていった。\n根の上で待っていた時間まで、覚えておきたい。'},
 {id:'sample-4',number:127,date:'2026-10-17',site:'竹富南',area:'沖縄・石垣島',lat:24.291,lon:124.087,depth:14.2,duration:52,temperature:28,visibility:22,creatures:'デバスズメダイ、チンアナゴ',notes:'白い砂地と、青の向こうまで続くサンゴ。'},
 {id:'sample-3',number:126,date:'2026-09-22',site:'ブルーコーナー',area:'パラオ',lat:7.137,lon:134.222,depth:24.6,duration:42,temperature:29,visibility:30,creatures:'グレイリーフシャーク、ギンガメアジ',notes:'流れの中で、魚の群れがひとつの形になっていた。'},
 {id:'sample-2',number:125,date:'2026-08-09',site:'アポ・アイランド',area:'フィリピン・ネグロス島',lat:9.078,lon:123.271,depth:16.8,duration:55,temperature:28,visibility:20,creatures:'アオウミガメ',notes:'サンゴのすぐ上を、ウミガメと同じ速さで。'},
 {id:'sample-1',number:124,date:'2026-06-14',site:'富戸・ヨコバマ',area:'静岡・伊豆',lat:34.897,lon:139.135,depth:17.4,duration:47,temperature:21,visibility:12,creatures:'ミノカサゴ、アオリイカ',notes:'岸から少し進むだけで、違う世界が広がっていた。'}
].map(normalizeLog);
const localJournal = $('meta[name="dive-atlas-mode"]').content === 'local';
const publicJournalToggle = $('#public-journal-toggle');
const journalPanel = $('#journal');
const workspace = $('.workspace');
publicJournalToggle.hidden = localJournal;
if (!localJournal) journalPanel.hidden = true;
$('#journal-source').textContent = localJournal
 ? 'この端末にあるログを表示します。記録の更新はローカルで行います。'
 : 'このページでは、公開ログとダイビングスポットを閲覧できます。';
let logs=[],demo=false,selected='',map,motionPaused=false,toastTimer=0;
let showPublicJournal = false;
let publicJournalRequest;
let selectedSpot = null;
const spotPins = $('#spot-pins');
const spotToggle = $('#spot-toggle');
const spotPreferenceKey = 'dive-atlas:show-famous-spots';
const difficultyNames = ['', '初心者向け', '初心者向け（ガイド同行）', '中級者向け', '上級者向け', '上級者向け'];

function clearSpotSelection() {
 selectedSpot?.marker.setAttribute('aria-pressed', 'false');
 selectedSpot = null;
}

function selectSpot(spot, marker) {
 clearSpotSelection();
 selected = '';
 selectedSpot = { spot, marker };
 marker.setAttribute('aria-pressed', 'true');
 render();
 if (innerWidth < 700) map?.focusSpot(spot);
 $('#spot-close').focus({ preventScroll: true });
}

function renderSpotDetail(el, { spot, marker }) {
 const stars = '★'.repeat(spot.difficulty);
 const empty = '☆'.repeat(5 - spot.difficulty);
 el.hidden = false;
 el.innerHTML = `
  <div class="detail-top"><span>ダイビング海域の代表ポイント</span>
   <button class="icon-button" id="spot-close" aria-label="スポット詳細を閉じる">${icon('close')}</button>
  </div>
  <h2>${escape(spot.name)}</h2>
  <div class="detail-area">${icon('pin')}${escape(spot.area)}<span class="location-approx">位置は目安</span></div>
  <div class="spot-rating">
   <span>難易度の目安</span>
   <span class="spot-stars" role="img" aria-label="5段階中 ${spot.difficulty}">${stars}<span>${empty}</span></span>
   <strong>${difficultyNames[spot.difficulty]}</strong>
  </div>
  <p class="spot-highlight"><strong>見どころ</strong>${escape(spot.highlight)}</p>
  <p class="spot-conditions">${escape(spot.conditions)}</p>
  <div class="spot-reference">
   <small>当日の海況や必要な資格は現地ガイドに確認</small>
   <a href="${escape(spot.source)}" target="_blank" rel="noopener noreferrer">${escape(spot.sourceName)}の案内 ↗</a>
  </div>`;
 $('#spot-close').onclick = () => {
  clearSpotSelection();
  renderDetail();
  if (!marker.hidden) marker.focus({ preventScroll: true });
 };
}

function showSpotPins(visible) {
 spotPins.hidden = !visible;
 spotToggle.setAttribute('aria-pressed', String(visible));
 spotToggle.querySelector('.spot-toggle-state').textContent = visible ? 'オン' : 'オフ';
 if (!visible && selectedSpot) {
  clearSpotSelection();
  renderDetail();
 }
}

try { showSpotPins(localStorage.getItem(spotPreferenceKey) !== 'off'); } catch { showSpotPins(true); }
spotToggle.onclick = () => {
 const visible = spotPins.hidden;
 showSpotPins(visible);
 try { localStorage.setItem(spotPreferenceKey, visible ? 'on' : 'off'); } catch { /* The toggle also works without storage. */ }
};

const isPublicLog=()=>!localJournal&&!demo;
const current=()=>sortLogs(demo?samples:localJournal||showPublicJournal?logs:[]);
const shown=()=>{const q=$('#search').value.trim().toLocaleLowerCase();return current().filter(l=>[l.site,l.area,l.notes,l.creatures].join(' ').toLocaleLowerCase().includes(q));};
function toast(message){$('#toast').textContent=message;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),3500);}
function display(n,unit=''){return n===null?'—':`${Number(n).toLocaleString('ja-JP')}${unit}`;}
function render(){const all=current(),list=shown(),s=summary(all);if(isPublicLog())s.places=new Set(all.map(l=>l.site)).size;$('#totals').innerHTML=`<div class="total"><strong>${s.dives}</strong><small>本</small><span>DIVES</span></div><div class="total"><strong>${s.places}</strong><small>ヶ所</small><span>POINTS</span></div><div class="total"><strong>${Math.floor(s.minutes/60)}</strong><small>h ${s.minutes%60}m</small><span>UNDERWATER</span></div>`;
 $('#list-count').textContent=(demo?'SAMPLE JOURNAL':localJournal?'MY DIVES':'DIVE JOURNAL')+' / '+list.length;$('#demo-toggle').textContent=demo?(localJournal?'自分のログへ':'管理人のログに戻る'):'サンプルを見る';$('#sample-badge').hidden=!demo;
 $('#log-list').innerHTML=list.length?list.map(l=>`<button class="log-card ${l.id===selected?'selected':''}" data-log="${escape(l.id)}"><span class="log-no">${l.number!==null?escape(l.number):'<img src="./assets/hibiscus-pink.png" alt="" width="24" height="24">'}</span><span><time datetime="${l.date}">${l.date.replaceAll('-','.')}</time><h3>${escape(l.site)}</h3>${isPublicLog()?'':`<span class="area">${escape(l.area||'エリア未設定')}${l.lat===null?' · 場所未設定':''}</span>`}<span class="measures"><span>↧ ${display(l.depth,' m')}</span><span>◷ ${display(l.duration,' min')}</span>${isPublicLog()?'':`<span>${display(l.temperature,' °C')}</span>`}</span></span></button>`).join(''):`<div class="empty"><h3>${all.length?'見つかりませんでした':'表示できるログはありません'}</h3><p>${all.length?'別の言葉で探してみてください。':localJournal?'ローカルに用意したログをここに表示します。':'地図のピンからダイビングスポットを見られます。'}</p></div>`;
 document.querySelectorAll('[data-log]').forEach(el=>el.onclick=()=>selectLog(el.dataset.log));
 map?.setLogs(list,selected);renderDetail();}
function renderDetail(){const l=current().find(l=>l.id===selected),el=$('#detail');if(!l){if(selectedSpot)renderSpotDetail(el,selectedSpot);else el.hidden=true;return;}clearSpotSelection();el.hidden=false;el.innerHTML=`<div class="detail-top"><span>${demo?'SAMPLE · ':''}DIVE${l.number===null?'':' '+escape(l.number)} / ${l.date.replaceAll('-','.')}</span><button class="icon-button" id="detail-close" aria-label="ログ詳細を閉じる">${icon('close')}</button></div><h2>${escape(l.site)}</h2>${isPublicLog()?'':`<div class="detail-area">${icon('pin')}${escape(l.area||'エリア未設定')}${l.lat===null?' · 位置未設定':''}${l.locationKind==='approximate'?'<span class="location-approx">位置は目安</span>':''}</div>`}<div class="detail-numbers ${isPublicLog()?'detail-numbers--public':''}"><div><strong>${display(l.depth)}</strong><small>m</small><span>最大水深</span></div><div><strong>${display(l.duration)}</strong><small>min</small><span>潜水時間</span></div>${isPublicLog()?'':`<div><strong>${display(l.temperature)}</strong><small>°C</small><span>水温</span></div>`}</div><div class="tags">${l.creatures.split(/[、,]/).filter(Boolean).map(t=>`<span class="tag">${escape(t.trim())}</span>`).join('')}</div>${l.notes?`<p class="detail-notes">${escape(l.notes)}</p>`:''}${l.visibility!==null||l.buddy||l.tusa?`<div class="detail-meta">${l.visibility!==null?'透明度 '+display(l.visibility,' m'):''}${l.buddy?'　バディ '+escape(l.buddy):''}${l.tusa?.original?.AVE_DEPTH>=0?'　平均水深 '+display(l.tusa.original.AVE_DEPTH,' m'):''}</div>${l.locationKind==='approximate'?`<p class="detail-meta">${escape(l.locationLabel)}を表示中。</p>`:''}`:''}${l.photos.length?`<div class="detail-photos">${l.photos.map((p,i)=>`<img src="${p}" alt="${escape(l.site)}の写真 ${i+1}" loading="lazy">`).join('')}</div>`:''}${l.signature?`<details class="signature"><summary>サインを見る</summary><img src="${l.signature}" alt="TUSAログに保存されたサイン"></details>`:''}<div class="detail-footer"><small>${demo?'体験用の架空の記録':l.source?'取り込み：'+escape(l.source):l.locationKind==='approximate'?'地図の位置は目安':'MY OCEAN MEMORY'}</small></div>`;
 $('#detail-close').onclick=()=>{selected='';render();};}
function selectLog(id){selected=id;render();const l=current().find(l=>l.id===id);if(l)map?.select(l);if(innerWidth<700)$('.map-stage').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'});}
function toggleDemo(){clearSpotSelection();demo=!demo;selected='';$('#search').value='';render();map?.fit();}
publicJournalToggle.onclick = () => {
 showPublicJournal = !showPublicJournal;
 journalPanel.hidden = !showPublicJournal;
 workspace.classList.toggle('workspace--journal-open', showPublicJournal);
 publicJournalToggle.setAttribute('aria-pressed', String(showPublicJournal));
 publicJournalToggle.querySelector('.journal-toggle-state').textContent = showPublicJournal ? 'オン' : 'オフ';
 if (!showPublicJournal) {
  demo = false;
  selected = '';
  $('#search').value = '';
 }
 render();
 if (showPublicJournal) {
  loadPublicJournal().then(() => {
   if (showPublicJournal && !demo && !selected && !selectedSpot && logs.some(log => log.lat !== null)) map?.fit();
  });
 }
};
$('#demo-toggle').onclick=toggleDemo;
$('#search').oninput=render;
$('#zoom-in').onclick=()=>map?.zoomBy(1.4);
$('#zoom-out').onclick=()=>map?.zoomBy(1/1.4);
$('#view-world').onclick=()=>map?.showWorld();
$('#view-japan').onclick=()=>map?.showJapan();
$('#motion-toggle').onclick=()=>{
 motionPaused=!motionPaused;
 map?.pauseMotion(motionPaused);
 $('#motion-toggle').textContent=motionPaused?'水面を動かす':'水面の動きを止める';
};
$('#about-open').onclick=()=>$('#about').showModal();
document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>$('#'+b.dataset.close).close());

async function readLocalJournal() {
 const response = await fetch('./api/local-import');
 if (!response.ok) throw new Error('ローカルログを読み込めませんでした。');
 const local = await response.json();
 const snapshot = local.enabled ? readBackup(local.backup) : null;
 if (snapshot) {
  let alreadyImported = false;
  try { alreadyImported = localStorage.getItem('dive-atlas:imported:'+local.digest) === 'done'; } catch {}
  if (!alreadyImported) return snapshot;
 }
 try {
  const {loadLogs} = await import('./store.js');
  return (await loadLogs()) ?? snapshot ?? [];
 } catch (error) {
  if (snapshot) return snapshot;
  throw error;
 }
}
function loadPublicJournal() {
 if (publicJournalRequest) return publicJournalRequest;
 $('#storage-status').textContent = '公開ログを読み込み中';
 publicJournalRequest = fetch('./journal.json').then(async response => {
  if (!response.ok) throw new Error('公開ログを読み込めませんでした。');
  logs = readPublicJournal(await response.json()).map(withJournalPosition);
  $('#storage-status').textContent = 'ログ閲覧専用';
  render();
 }).catch(error => {
  publicJournalRequest = undefined;
  $('#storage-status').textContent = error.message;
 });
 return publicJournalRequest;
}
if (localJournal) {
 try {
  logs = (await readLocalJournal()).map(withJournalPosition);
 } catch (error) {
  $('#storage-status').textContent = error.message;
 }
}
render();

try{map=await createMap({canvas:$('#map'),ocean:$('#ocean'),pins:$('#pins'),spotPins,onSelect:selectLog,onSpotSelect:selectSpot,onMove:({lat,lon})=>{$('#map-coordinate').textContent=`${Math.abs(lat).toFixed(1)}°${lat<0?'S':'N'} / ${Math.abs(lon).toFixed(1)}°${lon<0?'W':'E'}`;}});map.setLogs(shown(),selected);if(shown().some(log=>log.lat!==null))map.fit();}catch(e){toast('地図を読み込めませんでした。ログは一覧から使えます。');console.error(e);}
