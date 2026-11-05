import {normalizeLog,sortLogs,summary,backup,readBackup,mergeLogs,parseCSV,guessMapping,csvToLogs,CSV_FIELDS} from './model.js';
import {loadLogs,saveLog,deleteLog,saveBatch} from './store.js';
import {createMap} from './map.js';
const $=s=>document.querySelector(s),escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const paths={plus:'M12 5v14M5 12h14',minus:'M5 12h14',close:'m6 6 12 12M6 18 18 6',pin:'M20 10c0 6-8 11-8 11S4 16 4 10a8 8 0 1 1 16 0ZM15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0',search:'M21 21l-6-6M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0',globe:'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM3 12h18M12 3c5 5 5 13 0 18-5-5-5-13 0-18',import:'M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5',download:'M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5',info:'M12 11v6m0-10v1M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0',edit:'m16 3 5 5-12 12-6 1 1-6ZM13 6l5 5'};
const icon=name=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[name]||paths.info}"/></svg>`;
const icons=()=>document.querySelectorAll('[data-icon]:not([data-icon-ready])').forEach(el=>{el.insertAdjacentHTML('afterbegin',icon(el.dataset.icon));el.dataset.iconReady='true';});icons();
const samples=[
 {id:'sample-5',number:128,date:'2026-10-18',site:'マンタスクランブル',area:'沖縄・石垣島',lat:24.482,lon:124.151,depth:18.5,duration:48,temperature:27,visibility:25,buddy:'サンプル',creatures:'マンタ、カクレクマノミ',notes:'水面から差す光の下を、マンタがゆっくり横切っていった。\n根の上で待っていた時間まで、覚えておきたい。'},
 {id:'sample-4',number:127,date:'2026-10-17',site:'竹富南',area:'沖縄・石垣島',lat:24.291,lon:124.087,depth:14.2,duration:52,temperature:28,visibility:22,creatures:'デバスズメダイ、チンアナゴ',notes:'白い砂地と、青の向こうまで続くサンゴ。'},
 {id:'sample-3',number:126,date:'2026-09-22',site:'ブルーコーナー',area:'パラオ',lat:7.137,lon:134.222,depth:24.6,duration:42,temperature:29,visibility:30,creatures:'グレイリーフシャーク、ギンガメアジ',notes:'流れの中で、魚の群れがひとつの形になっていた。'},
 {id:'sample-2',number:125,date:'2026-08-09',site:'アポ・アイランド',area:'フィリピン・ネグロス島',lat:9.078,lon:123.271,depth:16.8,duration:55,temperature:28,visibility:20,creatures:'アオウミガメ',notes:'サンゴのすぐ上を、ウミガメと同じ速さで。'},
 {id:'sample-1',number:124,date:'2026-06-14',site:'富戸・ヨコバマ',area:'静岡・伊豆',lat:34.897,lon:139.135,depth:17.4,duration:47,temperature:21,visibility:12,creatures:'ミノカサゴ、アオリイカ',notes:'岸から少し進むだけで、違う世界が広がっていた。'}
].map(normalizeLog);
let logs=[],demo=false,selected='',map,photos=[],editing=false,importRows=null,pending=[],motionPaused=false,pickActive=false,toastTimer=0,storageReady=false;
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

const current=()=>sortLogs(demo?samples:logs);
const shown=()=>{const q=$('#search').value.trim().toLocaleLowerCase();return current().filter(l=>[l.site,l.area,l.notes,l.creatures].join(' ').toLocaleLowerCase().includes(q));};
function toast(message){$('#toast').textContent=message;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),3500);}
function display(n,unit=''){return n===null?'—':`${Number(n).toLocaleString('ja-JP')}${unit}`;}
function render(){const all=current(),list=shown(),s=summary(all);$('#totals').innerHTML=`<div class="total"><strong>${s.dives}</strong><small>本</small><span>DIVES</span></div><div class="total"><strong>${s.places}</strong><small>ヶ所</small><span>POINTS</span></div><div class="total"><strong>${Math.floor(s.minutes/60)}</strong><small>h ${s.minutes%60}m</small><span>UNDERWATER</span></div>`;
 $('#list-count').textContent=(demo?'SAMPLE JOURNAL':'MY DIVES')+' / '+list.length;$('#demo-toggle').textContent=demo?'自分のログへ':'サンプルを見る';$('#sample-badge').hidden=!demo;
 $('#log-list').innerHTML=list.length?list.map(l=>`<button class="log-card ${l.id===selected?'selected':''}" data-log="${escape(l.id)}"><span class="log-no">${l.number!==null?escape(l.number):'<img src="./assets/hibiscus-pink.png" alt="" width="24" height="24">'}</span><span><time datetime="${l.date}">${l.date.replaceAll('-','.')}</time><h3>${escape(l.site)}</h3><span class="area">${escape(l.area||'エリア未設定')}${l.lat===null?' · 場所未設定':''}</span><span class="measures"><span>↧ ${display(l.depth,' m')}</span><span>◷ ${display(l.duration,' min')}</span><span>${display(l.temperature,' °C')}</span></span></span></button>`).join(''):`<div class="empty"><h3>${all.length?'見つかりませんでした':'はじめの1本を、地図に。'}</h3><p>${all.length?'別の言葉で探してみてください。':'TUSAのログを取り込んだり、<br>自分で記録を追加できます。'}</p>${all.length?'':'<button class="primary" id="empty-import">ログを取り込む</button><br><button class="text-button" id="empty-demo">サンプルで試す</button>'}</div>`;
 document.querySelectorAll('[data-log]').forEach(el=>el.onclick=()=>selectLog(el.dataset.log));$('#empty-import')?.addEventListener('click',()=>$('#importer').showModal());$('#empty-demo')?.addEventListener('click',toggleDemo);
 map?.setLogs(list,selected);renderDetail();}
function renderDetail(){const l=current().find(l=>l.id===selected),el=$('#detail');if(!l){if(selectedSpot)renderSpotDetail(el,selectedSpot);else el.hidden=true;return;}clearSpotSelection();el.hidden=false;el.innerHTML=`<div class="detail-top"><span>${demo?'SAMPLE · ':''}DIVE ${escape(l.number??'')} / ${l.date.replaceAll('-','.')}</span><button class="icon-button" id="detail-close" aria-label="ログ詳細を閉じる">${icon('close')}</button></div><h2>${escape(l.site)}</h2><div class="detail-area">${icon('pin')}${escape(l.area||'エリア未設定')}${l.lat===null?' · 地図の場所を追加できます':''}${l.locationKind==='approximate'?'<span class="location-approx">位置は目安</span>':''}</div><div class="detail-numbers"><div><strong>${display(l.depth)}</strong><small>m</small><span>最大水深</span></div><div><strong>${display(l.duration)}</strong><small>min</small><span>潜水時間</span></div><div><strong>${display(l.temperature)}</strong><small>°C</small><span>水温</span></div></div><div class="tags">${l.creatures.split(/[、,]/).filter(Boolean).map(t=>`<span class="tag">${escape(t.trim())}</span>`).join('')}</div>${l.notes?`<p class="detail-notes">${escape(l.notes)}</p>`:''}${l.visibility!==null||l.buddy||l.tusa?`<div class="detail-meta">${l.visibility!==null?'透明度 '+display(l.visibility,' m'):''}${l.buddy?'　バディ '+escape(l.buddy):''}${l.tusa?.original?.AVE_DEPTH>=0?'　平均水深 '+display(l.tusa.original.AVE_DEPTH,' m'):''}</div>${l.locationKind==='approximate'?`<p class="detail-meta">${escape(l.locationLabel)}を表示中。<br>ログを編集して、潜った位置へ直せます。</p>`:''}`:''}${l.photos.length?`<div class="detail-photos">${l.photos.map((p,i)=>`<img src="${p}" alt="${escape(l.site)}の写真 ${i+1}" loading="lazy">`).join('')}</div>`:''}${l.signature?`<details class="signature"><summary>サインを見る</summary><img src="${l.signature}" alt="TUSAログに保存されたサイン"></details>`:''}<div class="detail-footer"><small>${demo?'体験用の架空の記録':l.source?'取り込み：'+escape(l.source):'MY OCEAN MEMORY'}</small>${!demo?`<button class="quiet" id="edit-log">${icon('edit')}記録を編集</button>`:''}</div>`;
 $('#detail-close').onclick=()=>{selected='';render();};$('#edit-log')?.addEventListener('click',()=>openEditor(l));}
function selectLog(id){selected=id;render();const l=current().find(l=>l.id===id);if(l)map?.select(l);if(innerWidth<700)$('.map-stage').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'});}
function toggleDemo(){clearSpotSelection();demo=!demo;selected='';$('#search').value='';render();map?.fit();if(demo)toast('サンプルはあなたの保存データには入りません');}
function openEditor(log){if(!storageReady){toast('保存先を利用できません。ページを開き直してください。');return;}if(demo){demo=false;selected='';render();}editing=Boolean(log);const form=$('#log-form');form.reset();for(const name of ['id','date','number','site','area','lat','lon','depth','duration','temperature','visibility','buddy','creatures','notes'])form.elements[name].value=log?.[name]??(name==='date'?new Date(Date.now()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,10):'');photos=[...(log?.photos??[])];renderPhotos();$('#editor-title').textContent=log?'海の記録を編集':'海の記録を残す';$('#delete-log').hidden=!log;$('#editor-error').textContent='';$('#editor').showModal();}
function renderPhotos(){$('#photo-preview').innerHTML=photos.map((p,i)=>`<button type="button" data-photo="${i}" aria-label="写真${i+1}を外す"><img src="${p}" alt="選んだ写真${i+1}"></button>`).join('');document.querySelectorAll('[data-photo]').forEach(b=>b.onclick=()=>{photos.splice(Number(b.dataset.photo),1);renderPhotos();});}
async function photoURL(file){if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>20*1024*1024)throw new Error('JPEG・PNG・WebP（20MB以下）の写真を選んでください。');const bitmap=await createImageBitmap(file);const factor=Math.min(1,1400/Math.max(bitmap.width,bitmap.height)),c=document.createElement('canvas');c.width=Math.max(1,Math.round(bitmap.width*factor));c.height=Math.max(1,Math.round(bitmap.height*factor));c.getContext('2d').drawImage(bitmap,0,0,c.width,c.height);bitmap.close();return c.toDataURL('image/jpeg',.84);}
$('#photos').onchange=async e=>{try{if(photos.length+e.target.files.length>6)throw new Error('写真は6枚までです。');const values=await Promise.all([...e.target.files].map(photoURL));photos.push(...values);renderPhotos();$('#editor-error').textContent='';}catch(err){$('#editor-error').textContent=err.message;}finally{e.target.value='';}};
$('#log-form').onsubmit=async e=>{e.preventDefault();const button=$('#save-log');button.disabled=true;try{const raw=Object.fromEntries(new FormData(e.target)),old=logs.find(l=>l.id===raw.id);const sameLocation=old&&Number(raw.lat)===old.lat&&Number(raw.lon)===old.lon;const log=normalizeLog({...raw,photos,source:old?.source??'',tusa:old?.tusa,signature:old?.signature,locationKind:sameLocation?old.locationKind:'specified',locationLabel:sameLocation?old.locationLabel:'',locationSource:sameLocation?old.locationSource:''});await saveLog(log);logs=logs.filter(l=>l.id!==log.id).concat(log);selected=log.id;demo=false;$('#search').value='';$('#editor').close();render();map?.select(log);toast('海の記録を保存しました');}catch(err){$('#editor-error').textContent=err.message||'保存できませんでした。';}finally{button.disabled=false;}};
$('#delete-log').onclick=async()=>{const id=$('#log-form').elements.id.value;if(!confirm('このログを削除しますか？'))return;try{await deleteLog(id);logs=logs.filter(l=>l.id!==id);selected='';$('#editor').close();render();toast('ログを削除しました');}catch(err){$('#editor-error').textContent=err.message;}};
function pickLocation(value){pickActive=value;spotPins.inert=value;map?.setPicking(value);$('#pick-hint').hidden=!value;}
$('#pick-location').onclick=()=>{$('#editor').close();pickLocation(true);$('.map-stage').scrollIntoView({behavior:'smooth'});};$('#pick-cancel').onclick=()=>{pickLocation(false);$('#editor').showModal();};
$('#new-log').onclick=()=>openEditor();$('#demo-toggle').onclick=toggleDemo;$('#search').oninput=render;$('#zoom-in').onclick=()=>map?.zoomBy(1.4);$('#zoom-out').onclick=()=>map?.zoomBy(1/1.4);$('#fit').onclick=()=>map?.fit();$('#motion-toggle').onclick=()=>{motionPaused=!motionPaused;map?.pauseMotion(motionPaused);$('#motion-toggle').textContent=motionPaused?'水面を動かす':'水面の動きを止める';};
$('#import-open').onclick=()=>$('#importer').showModal();$('#about-open').onclick=()=>$('#about').showModal();document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>$('#'+b.dataset.close).close());
$('#backup').onclick=()=>{if(!storageReady){toast('保存先を確認できていません。');return;}const url=URL.createObjectURL(new Blob([JSON.stringify(backup(logs),null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download=`dive-atlas-${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);toast(`${logs.length}本のバックアップを保存します`);};
function showImportPreview(){const errors=[];if(importRows){const mapping=Object.fromEntries(CSV_FIELDS.map(([k])=>[k,Number($(`[data-field="${k}"]`).value)]));const result=csvToLogs(importRows,mapping,$('#import-file').files[0].name);pending=result.logs;errors.push(...result.errors);}const duplicates=pending.length-(mergeLogs(logs,pending).length-logs.length);$('#import-error').textContent=errors.slice(0,5).join('\n')+(errors.length>5?`\nほか${errors.length-5}件`:'');let view=$('#import-records');if(!view){view=document.createElement('div');view.id='import-records';$('#import-preview').append(view);}view.innerHTML=`<p class="preview-count">${pending.length}本を確認${duplicates?' · 重複 '+duplicates+'本':''}</p><p class="field-note">${pending.filter(l=>l.lat!==null).length}本に位置情報があります。位置未設定の記録も一覧に追加できます。</p><div class="preview-table"><table><thead><tr><th>日付</th><th>ポイント</th><th>最大水深</th><th>潜水時間</th></tr></thead><tbody>${pending.slice(0,20).map(l=>`<tr><td>${l.date}</td><td>${escape(l.site)}</td><td>${display(l.depth,'m')}</td><td>${display(l.duration,'分')}</td></tr>`).join('')}</tbody></table></div>`;$('#confirm-import').disabled=!storageReady||!pending.length||errors.length>0;}
$('#import-file').onchange=async e=>{pending=[];importRows=null;$('#confirm-import').disabled=true;$('#import-preview').replaceChildren();$('#import-error').textContent='';const file=e.target.files[0];if(!file)return;try{if(file.size>80*1024*1024)throw new Error('80MB以下のファイルを選んでください。');const buffer=await file.arrayBuffer();let text=new TextDecoder('utf-8',{fatal:false}).decode(buffer);if(text.includes('\uFFFD'))text=new TextDecoder('shift-jis').decode(buffer);if(file.name.toLowerCase().endsWith('.zip')){const response=await fetch('/api/import-tusa',{method:'POST',headers:{'Content-Type':'application/zip'},body:buffer});const result=await response.json();if(!response.ok)throw new Error(result.error||'ZIPを確認できませんでした。');pending=readBackup(result);}else if(file.name.toLowerCase().endsWith('.json'))pending=readBackup(JSON.parse(text));else {importRows=parseCSV(text);const mapping=guessMapping(importRows[0]);$('#import-preview').innerHTML='<h3>列の対応を確認</h3><p class="field-note">単位はm・分・°Cです。見出しのない独自形式は、実ファイルを確認してから対応します。</p><div class="import-mapping">'+CSV_FIELDS.map(([key,label])=>`<label>${label}<select data-field="${key}"><option value="-1">使用しない</option>${importRows[0].map((h,i)=>`<option value="${i}" ${mapping[key]===i?'selected':''}>${escape(h||'列 '+(i+1))}</option>`).join('')}</select></label>`).join('')+'</div>';document.querySelectorAll('[data-field]').forEach(s=>s.onchange=()=>{try{showImportPreview();}catch(err){$('#import-error').textContent=err.message;$('#confirm-import').disabled=true;}});}showImportPreview();}catch(err){$('#import-error').textContent=err.message;}};
$('#confirm-import').onclick=async()=>{const button=$('#confirm-import');button.disabled=true;try{const all=mergeLogs(logs,pending),added=all.length-logs.length;await saveBatch(all.filter(l=>!logs.some(old=>old.id===l.id)));logs=all;demo=false;selected='';$('#search').value='';$('#importer').close();render();map?.fit();toast(`${added}本のログを取り込みました`);}catch(err){$('#import-error').textContent=err.message;button.disabled=false;}};
try{logs=await loadLogs();storageReady=true;const response=await fetch('/api/local-import');if(response.ok){const local=await response.json();if(local.enabled&&local.digest){const key='dive-atlas:imported:'+local.digest;if(!localStorage.getItem(key)){const incoming=readBackup(local.backup),merged=mergeLogs(logs,incoming);await saveBatch(merged.filter(l=>!logs.some(old=>old.id===l.id)));logs=merged;localStorage.setItem(key,'done');toast(incoming.length+'本のTUSAログを取り込みました');}}}}catch(e){$('#storage-status').textContent='保存先を利用できません';$('#storage-status').style.color='#f1b3a7';toast('ブラウザの保存機能を確認してください');}render();
try{map=await createMap({canvas:$('#map'),ocean:$('#ocean'),pins:$('#pins'),spotPins,onSelect:selectLog,onSpotSelect:selectSpot,onPick:({lat,lon})=>{if(!pickActive)return;$('#log-form').elements.lat.value=lat.toFixed(5);$('#log-form').elements.lon.value=lon.toFixed(5);pickLocation(false);$('#editor').showModal();},onMove:({lat,lon})=>{$('#map-coordinate').textContent=`${Math.abs(lat).toFixed(1)}°${lat<0?'S':'N'} / ${Math.abs(lon).toFixed(1)}°${lon<0?'W':'E'}`;}});map.setLogs(shown(),selected);if(logs.length)map.fit();}catch(e){toast('地図を読み込めませんでした。ログは一覧から使えます。');console.error(e);}
