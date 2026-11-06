import {LngLat,Map as VectorMap,setWorkerUrl} from '../vendor/maplibre-gl.mjs';
import {startOcean} from './ocean.js';
import {diveSpots} from './dive-spots.js';
setWorkerUrl(new URL('../vendor/maplibre-gl-worker.mjs', import.meta.url).href);
const japanBounds = [[122.8, 24], [146.2, 46]];
const mercatorLimit = 85.051129;
const worldBounds = [[-180, -mercatorLimit], [180, mercatorLimit]];
const minZoom = -2;
const maxZoom = 18;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const wrap=n=>((n+180)%360+360)%360-180;

const gogglesIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 8c3-2 6-2 9-1 3-1 6-1 9 1l-1 5a3 3 0 0 1-3 2h-2l-3-2-3 2H7a3 3 0 0 1-3-2Z"/><path d="m7 10 2-.5m6 .5 2-.5"/></svg>';

const paperSpotIcons = {
 gardenEel: `
  <path fill="none" stroke="#fffdf0" stroke-width="5" stroke-linecap="round" d="M8 24V13c0-2 1.4-4.6 4-4.6M16 24V7.6c0-3 2.4-4.7 5.3-4M24 24v-8c0-2 1.7-4 4-3.7"/>
  <path fill="none" stroke="#f6a751" stroke-width="2.7" stroke-linecap="round" d="M8 24V13c0-2 1.4-4.6 4-4.6M24 24v-8c0-2 1.7-4 4-3.7"/>
  <path fill="none" stroke="#659bab" stroke-width="2.7" stroke-linecap="round" d="M16 24V7.6c0-3 2.4-4.7 5.3-4"/>
  <path fill="#ffd484" class="paper-edge" d="M3 25c3.6-2.3 6.9-3.3 13-3.3s9.7 1 13 3.3v2.3c-4.7 1.3-8.3 1.8-13 1.8s-8.5-.5-13-1.8z"/>
  <g fill="#40606a"><circle cx="20.5" cy="4" r=".75"/><circle cx="11.7" cy="8.5" r=".75"/><circle cx="27.5" cy="12.4" r=".75"/></g>
 `,
 squid: `
  <path fill="#dba3dd" class="paper-edge" d="M16 2.3 7.5 9.8 6.1 17l5.6-1.1c0 2 .9 3.4 1 4.9.2 2.3-3 4.1-4 6.2l2.4 1.5c1.4-2.2 4-3.2 4.9-6.2.6 2.3.6 4.6.5 7.2l2.8-.4c.1-3.7.2-4.7-.4-7.6 1.2 2.3 3.3 4.1 5.2 4.9l1.2-2.3c-3.4-1.8-4.8-4.5-4.8-8.2l5.4 1.1-1.6-7.2z"/>
  <path fill="#f8cce9" d="M16 3.8c-4.7 4.5-6 8.3-4.3 12.1 1.3 2.5 2.9 3.5 4.3 3.5 1.7 0 3.6-1.3 4.5-3.5 1.6-4.1-.3-8-4.5-12.1z"/>
  <path fill="#75568e" d="M13.1 14.5a1 1 0 1 0 2 0 1 1 0 0 0-2 0m4 0a1 1 0 1 0 2 0 1 1 0 0 0-2 0"/>
 `,
 postbox: `
  <path fill="#f75d6c" class="paper-edge" d="M7.7 8.2c0-3.6 3.8-6 8.3-6s8.3 2.4 8.3 6v19.1c-2.7 1.4-5.4 2.2-8.3 2.2s-5.7-.8-8.3-2.2z"/>
  <path fill="#bf415e" d="M20.1 8.4c0-2.1-.7-3.7-1.9-4.9 3 .6 5 2.2 5 4.8v18.4l-3.1 1.1z"/>
  <path fill="#552f55" d="M10 10.5h9.5v2.2H10z"/>
  <path fill="none" stroke="#fff3cc" stroke-width="1.6" stroke-linecap="round" d="M12 16.2h5.9M12 18.5h5.9M15 18.5v4.1"/>
 `,
 sand: `
  <path fill="#ffc672" class="paper-edge" d="M2.6 22.5c4.9-4.8 8.3-9 12.4-9 3.3 0 5.6 2 8 2 2.2 0 3.8-.9 6.3-2.4v12.8c-3.4 1.8-8.1 2.8-13.6 2.8-5.1 0-9.4-1-13.1-2.8z"/>
  <path fill="#ffe9a8" d="M3.8 23.6c5.8-.3 8.2-5.1 12-5.1 2.6 0 4.7 2.1 7.9 2.1 1.6 0 3-.4 4.4-1v3.1c-2.1 1-4.8 1-6.4.7-2.4-.6-4.1-1.6-5.9-1.6-2.8 0-5.1 2.6-8 3.3z"/>
  <path fill="none" stroke="#80ddd6" stroke-width="2.5" stroke-linecap="round" d="M4 10.3c2.4.5 4.6-.4 6.6-2s4.1-2.4 7-1.7c2.3.6 3.7 1.9 6.1 1.5 1.2-.2 2.5-.8 3.8-1.7"/>
 `,
 kelp: `
  <path fill="#5bb85f" class="paper-edge" d="M14.2 28.6 12 22.5c-6 .2-10-5.2-10-10.9 4.7.1 9.4 3.3 11.4 6.8-.4-3.5-2.4-5.7-2.3-9.2.1-3 1.5-5.9 4.9-7.6 3.3 3.3 4.2 6.6 3.1 9.4-.9 2.3-1.7 4.4-1.4 6.3 1.2-3.5 5.7-7.7 11.6-8.3.5 6.1-2.8 11.8-9.7 12.8l-1.5 6.8z"/>
  <path fill="none" stroke="#d5e978" stroke-width="1.7" stroke-linecap="round" d="M15.9 25.9c0-3.2.9-8 .3-11-.7-3.3-1.2-5.7-.4-8.8m-1.5 16.5-7.4-5.8m10.9 6.3 7.2-8.7"/>
  <path fill="#238e74" d="m11.5 27.2 5.2-1.1 5.4 1 1.6 2.7H9.6z"/>
 `,
 ufo: `
  <path fill="#f0e0aa" class="paper-edge" d="M2 15.4c0-3 4.3-5.3 8-6.3l2.6-3.3h6.8L22 9.1c3.7 1 8 3.3 8 6.3v3.1c0 4-6.4 7.4-14 7.4S2 22.5 2 18.5z"/>
  <path fill="#559fb5" d="M2 15.4c1.3 3.3 7 5.7 14 5.7s12.7-2.4 14-5.7v3.1c0 4-6.4 7.4-14 7.4S2 22.5 2 18.5z"/>
  <path fill="#84d0d1" d="M2 15.4c0-3 6.3-6.2 14-6.2s14 3.2 14 6.2c-1.3 3.3-7 5.7-14 5.7s-12.7-2.4-14-5.7z"/>
  <path fill="#e6f7eb" d="m10 9.1 2.6-3.3h6.8L22 9.1c1.4 2.6-1.5 4.2-6 4.2s-7.4-1.6-6-4.2z"/>
  <path fill="none" stroke="#f7dea2" stroke-width="1.45" stroke-linecap="round" d="M5.7 19.2c4.9 3.5 15.7 3.7 20.6 0"/>
 `,
 structure: `
  <path fill="#88b5cd" class="paper-edge" d="m4.1 9.4 11.9-6 11.9 6.1v13.8L16 29.4 4.1 23.3z"/>
  <path fill="#d0e5e8" d="M4.1 9.4 16 3.4l11.9 6.1L16 15.6z"/>
  <path fill="#527ca0" d="m16 15.6 11.9-6.1v13.8L16 29.4z"/>
  <path fill="#346374" d="m8 12.5 4.8 2.5v4.1L8 16.6zm11 5.2 5.1-2.6v4.3L19 22z"/>
  <path fill="#ffe18b" d="m8 21 4.8 2.5v1.7L8 22.7zm11 3.4 5.1-2.6v1.7L19 26z"/>
 `,
 nudibranch: `
  <path fill="#fda13b" class="paper-edge" d="M3 23.3c2.2-1.8 4.8-1.3 6.1-3.1 1-1.4 1.8-2.7 3.5-3.8l-1.2-5.8 2.4-1.1 2.2 4.7 1.7-8 2.7.2.4 7.3 3-4.4 2.4 1.1-1.5 6.1c3.5 1 5.1 3.8 4 6.3-1.3 3.2-5.9 4.5-10.2 4.9-5.1.4-11.9-.9-15.5-4.4z"/>
  <path fill="#f45e89" d="M6.4 23.8c3.1-1.5 4.6-4.5 8-5.8 4.5-1.7 8.5-.4 12 .8-2.1 3.8-6.4 5.1-10.6 5.6-3.7.5-6.4.2-9.4-.6z"/>
  <path fill="#fff1a7" d="M13.8 21a1.2 1.2 0 1 0 2.4 0 1.2 1.2 0 0 0-2.4 0m5.4-.8a1.1 1.1 0 1 0 2.2 0 1.1 1.1 0 0 0-2.2 0"/>
 `,
 vent: `
  <path fill="#af8bd8" class="paper-edge" d="M3.6 26.1 7.1 20l5.1-1.2 3-5 3.7 4.6 6.2 1.4 3.2 6.3-4.5 3H8z"/>
  <path fill="#725a9c" d="m7.1 20 5.1-1.2 3-5 3.7 4.6 6.2 1.4-5.5 2.4-3.9-1.3-4.5 2.3z"/>
  <g fill="#88e2e5" stroke="#fffdf0" stroke-width="1.2"><circle cx="13" cy="11.6" r="2.2"/><circle cx="20.4" cy="8.3" r="2.6"/><circle cx="15.2" cy="4.1" r="1.8"/></g>
 `,
 anemone: `
  <path fill="#e67c91" class="paper-edge" d="M8.1 27.1 7 22.6 3 18.2l1-3.3 3.6.2.7-4.9 3.5-.7 2 4.6.6-8.2 3.5-.2 1.2 8.1 2.5-4.5 3.3 1.4.3 4.4 3.3-1 1.6 3.5-3.9 5-1.4 4.6z"/>
  <path fill="#f8a56c" d="m10.7 23.5 4-6.8 2.2 3.8 4.2-4.2 1.1 7.1-5.7 3.4z"/>
  <path fill="#fff0b5" d="m4.5 16.4 3.1.2.6 2.6zm5.1-5.2 2-.3 1.9 4.1-2.9-.6zm6.1-4 1.4-.1.9 5.5-2.3-1.1zm7.1 4 1.2.4.2 3.4-2.5 1.1z"/>
 `,
 turtle: `
  <path class="paper-edge" fill="#80cd71" d="M12.7 9.1c-1.6-1.1-2-3.1-1-4.9 1-1.7 2.6-2.4 4.3-2.4s3.3.7 4.3 2.4c1 1.8.6 3.8-1 4.9l4-1.1 4.4-2.8 2.2 1.1-1.1 4.7-4.8 4.7-1.2 4 3.3 3.5-1.7 2.7-4.3-1-4.1 4.9-4.1-4.9-4.3 1-1.7-2.7 3.3-3.5-1.2-4-4.8-4.7-1.1-4.7 2.2-1.1L8.7 8z"/>
  <path fill="#188e72" d="m16 8.5 5.7 2.6 2.5 5.2-1.9 6.6-6.3 3.2-6.3-3.2-1.9-6.6 2.5-5.2z"/>
  <path fill="#d7ed83" d="m16 11 4.6 2.8v5.8L16 22.4l-4.6-2.8v-5.8z"/>
  <path fill="#aad357" d="m16 11 4.6 2.8v5.8L16 22.4v-5.7z"/>
  <path fill="#4bac65" d="m3.8 7.3 5.8 4.2L8 14l-3.3-2.9zm24.4 0-5.8 4.2L24 14l3.3-2.9z"/>
  <circle cx="14" cy="5.8" r=".85" fill="#184547"/><circle cx="18" cy="5.8" r=".85" fill="#184547"/>
 `,
 coral: `
  <path class="paper-edge" fill="#f95f85" d="M6 28.5 7 25l5.5-1.8v-6l-5-2.5-3-4.4 2.8-1.7 2.6 3.4 2.6.9V8.8L9.6 5.5l2.5-2.2 4 4 2.2-4.5 3 1.4-2.6 6.1v3.1l4.1-2.4 1.5-4 3.2.9-1.5 4.6 3-1.2 1.2 3-6.6 3-4.9 2.9v3.1l5.7 2.1.7 3.1z"/>
  <path fill="#ff9f88" d="M12.5 23.2v-6l-5-2.5-3-4.4 2.8-1.7 2.6 3.4 2.6.9V8.8L9.6 5.5l2.5-2.2 4 4L16 24z"/>
  <path fill="#ca426e" d="m16 24 2.7-3.8v3.1l5.7 2.1.7 3.1H6l3-2.2z"/>
 `,
 wreck: `
  <path class="paper-edge" fill="#f7af61" d="m3 13 4.4 1 1.2-5.3 5.2 1.2 1.1-5 2.9.6-1 5.1 5.3 1.2-1.2 5.4 8.1 1.9-6.4 6.6-14.3-3.3z"/>
  <path fill="#de744d" d="m3 13 26 6.1-6.4 6.6-14.3-3.3z"/>
  <path fill="#843e53" d="m7.3 20.7 16.9 3.9-1.6 1.1-14.3-3.3zm2.3-9.3 3.6.8-.5 2.3-3.6-.8zm5.9 1.3 3.6.8-.5 2.3-3.6-.8z"/>
  <path fill="#7ee4ec" class="paper-edge" d="M3 26c2.4-2.3 4.8-2.3 7.2 0 2.4-2.3 4.8-2.3 7.2 0 2.4-2.3 4.8-2.3 7.2 0 1.6-1.7 3.4-1.9 5.4-.8v3.3H3z"/>
 `,
 cave: `
  <path fill="#e8b36b" class="paper-edge" d="m2.4 25.8 3.5-9.4 4.2-7.7 6-4.6 5.6 2.8 5.2 6.1 2.7 12.8z"/>
  <path fill="#f6cd84" d="m5.9 16.4 4.2-7.7 6-4.6 5.6 2.8-6.3 4-4.8 9z"/>
  <path fill="#956e68" d="m29.6 25.8-2.7-12.8-5.2-6.1-2.3 7.2 4.5 11.7z"/>
  <path fill="#205a72" d="m9 25.8 2.1-7.7 5.3-5.4 5 4.2 2.5 8.9z"/>
  <path fill="#79dace" d="m12.8 25.8 1.3-5.7 3.2-2.8 3.2 2.7 1.3 5.8z"/>
 `,
 fish: `
  <path fill="#ffbd58" class="paper-edge" d="M2.5 9.3 10 13l4.6-3.7 1.8-3.1 4 2.4c4.1.2 7.1 3.2 9.3 7.5-2.3 4.5-5.3 7-9.8 7.4l-3.1 2.7-2.3-3.9L10 19l-7.5 3.7 1.9-6.6z"/>
  <path fill="#fff2be" d="m13.8 10 2.9-1.3L19 16l-2.1 7.3-2.8-1.6 1.6-5.7zm7.4-.9 2.6.9 1.7 6.1-1.9 5.6-2.6 1.4 2.1-7z"/>
  <path fill="#e47754" d="m2.5 22.7 1.9-6.6H10l4.5 6.2-4.5-3.3zm14.3 3.5-2.3-3.9 5.4 1.2z"/>
  <circle cx="26.2" cy="14.6" r="1.15" fill="#305461"/>
 `,
 shark: `
  <path fill="#6e9dca" class="paper-edge" d="m2.4 9.8 6 4.3 6.3-2.2 3-6.9 3.7 6.7 5.7.8 2.6 2.2-.3 3.2-3.8 2.3-5.1.6-4.2 5.3-1.1-5.6L8.5 18l-6.1 3.8 1.7-5.6z"/>
  <path fill="#a6e5ed" d="M8.5 18 16 16.6l13.7-1.9-.3 3.2-3.8 2.3-5.1.6-4.2 5.3-1.1-5.6z"/>
  <path fill="#426d9b" d="m17.7 5 3.7 6.7-6.7.2zm-15.3 4.8 6 4.3.1 3.9-6.1 3.8 1.7-5.6z"/>
  <circle cx="26.9" cy="15" r="1.05" fill="#284d67"/>
 `,
 ray: `
  <path fill="none" d="M16.4 20.2c-.8 5 2.4 6.2 5.8 8.8" stroke="#fffdf0" stroke-width="4" stroke-linecap="round"/>
  <path fill="none" d="M16.4 20.2c-.8 5 2.4 6.2 5.8 8.8" stroke="#8a70ba" stroke-width="2.4" stroke-linecap="round"/>
  <path fill="#bc9be3" class="paper-edge" d="m2.4 9.2 7.5 1.1 4.1-5.2 4-1 4.1 6.2 7.5-1.1-3.8 8.5-9.8 5.8-9.8-5.8z"/>
  <path fill="#8a70ba" d="m2.4 9.2 8 4.3 5.6 10-9.8-5.8zm27.2 0-8 4.3-5.6 10 9.8-5.8z"/>
  <path fill="#ebc3ee" d="m16 9 5.6 4.5-5.6 10-5.6-10z"/>
  <circle cx="14.1" cy="10.5" r=".8" fill="#4b4a77"/><circle cx="17.9" cy="10.5" r=".8" fill="#4b4a77"/>
 `,
 reef: `
  <path fill="#57b9a0" class="paper-edge" d="m2.3 18.5 4.6-5.6 2.9-5.7 5.9-2.6 6 3.2 3.7 6.2 4.3 4.5-2.4 7.8H4.6z"/>
  <path fill="#a4dc83" d="m6.9 12.9 2.9-5.7 5.9-2.6 6 3.2 3.7 6.2-4.6 1.5-5.6-2.1-5.3 3.1z"/>
  <path fill="#397f8e" d="m2.3 18.5 5.7 1.2 6-1.4 5.2 2.1 6.2-2.6 4.3.7-2.4 7.8H4.6z"/>
  <path fill="#6ed2bc" d="m6.4 21.4 6.8-.7 4.9 1.5 7.5-2.1-2.4 2.2-5.7 1.4-4.8-1.5-5.8.7z"/>
 `,
 macro: `
  <path fill="#55bdc7" class="paper-edge" d="M19.2 4.3a10 10 0 0 1 4.1 15.5l6 5.8-3.7 3.8-6-5.9A10 10 0 1 1 19.2 4.3z"/>
  <circle cx="15" cy="13.5" r="7.3" fill="#d5f6ed"/>
  <path fill="#f27799" d="M10.1 16.5c.9-3.7 3.3-6.3 5.7-5.4 1.2.5 1.4 1.9 2.4 2.4.9.4 1.6.1 2.1.8-1.4 2.1-6.8 3.9-10.2 2.2z"/>
  <path fill="#ab648a" d="m12 14.1.2-3.8 1.5 2.5 1.2-3.4 1 3.1-1.3 2.1z"/>
 `,
};

export async function createMap({canvas,ocean,pins,spotPins,onSelect,onSpotSelect,onMove}){
 const oceanView=startOcean(ocean),motion=matchMedia('(prefers-reduced-motion: reduce)');let logs=[],selected='',maskTimer=0;
 const [style,gazetteer]=await Promise.all(['./assets/map-style.json','./assets/okinawa-island-names.geojson'].map(url=>fetch(url).then(r=>{if(!r.ok)throw new Error('地図設定を読み込めませんでした。');return r.json();})));let gazetteerKey='';const nameKey=s=>String(s||'').normalize('NFKD').toLowerCase().replace(/[\u0300-\u036f]/g,'').replace(/[\s\-_.’']/g,'').replace(/(islands?|shima|jima|諸島|島)$/,'');
 const normalWaterColor = style.layers.find(layer => layer.id === 'water-main').paint['fill-color'];
 let journalMode = false;
 const map=new VectorMap({container:canvas,style,bounds:japanBounds,fitBoundsOptions:{padding:36},minZoom,maxZoom,attributionControl:false,localIdeographFontFamily:'sans-serif',canvasContextAttributes:{alpha:true,antialias:true},dragRotate:false,pitchWithRotate:false,fadeDuration:motion.matches?0:220});
 canvas.dataset.mapState='loading';const mask=document.createElement('canvas'),ctx=mask.getContext('2d');ocean.style.opacity='0';
 const dimensions=()=>canvas.getBoundingClientRect();
 let lastSpotSelection;
 const spotMarkers = diveSpots.map(spot => {
  const marker = document.createElement('button');
  marker.type = 'button';
  marker.className = 'spot-pin';
  marker.dataset.spot = spot.id;
  marker.title = spot.name;
  marker.setAttribute('aria-label', `${spot.name}のスポット情報`);
  marker.setAttribute('aria-controls', 'detail');
  marker.setAttribute('aria-pressed', 'false');
  const icon = Object.hasOwn(paperSpotIcons, spot.icon) ? spot.icon : 'goggles';
  marker.dataset.spotIcon = icon;
  marker.classList.toggle('spot-pin--paper', icon !== 'goggles');
  marker.innerHTML = icon === 'goggles' ? gogglesIcon
   : '<svg viewBox="0 0 32 32" aria-hidden="true">' + paperSpotIcons[icon] + '</svg>';
  marker.hidden = true;
  const entry = { spot, marker };
  marker.onclick = () => {
   lastSpotSelection = entry;
   onSpotSelect(spot, marker);
  };
  return entry;
 });
 spotPins.append(...spotMarkers.map(({ marker }) => marker));

 function placeSpotPins(viewport, logPoints, centerLongitude) {
  const placed = [];
  const place = ({ spot, marker }) => {
   const [longitude, latitude] = spot.coordinates;
   const visibleLongitude = map.getRenderWorldCopies() ? centerLongitude + wrap(longitude - centerLongitude) : longitude;
   const point = map.project([visibleLongitude, latitude]);
   // Keep both pins reachable when a log and a public spot share the same water.
   const overlappingLog = logPoints.some(log => Math.hypot(log.x - point.x, log.y - point.y) < 28);
   const y = point.y - (overlappingLog ? 32 : 0);
   const inView = point.x >= 17 && point.x <= viewport.width - 17 && y >= 17 && y <= viewport.height - 17;
   marker.hidden = !inView || placed.some(pin => Math.hypot(pin.x - point.x, pin.y - y) < 33);
   if (marker.hidden) return;
   marker.style.left = `${point.x}px`;
   marker.style.top = `${y}px`;
   placed.push({ x: point.x, y });
  };
  // Give the open detail card's pin first claim when zooming brings pins together.
  const selectedSpot = lastSpotSelection?.marker.getAttribute('aria-pressed') === 'true'
   ? lastSpotSelection : null;
  if (selectedSpot) place(selectedSpot);
  for (const entry of spotMarkers) {
   if (entry !== selectedSpot) place(entry);
  }
 }

 function update() {
  const viewport = dimensions();
  const logPoints = [];
  const center = map.getCenter();
  for (const el of pins.children) {
   const log = logs.find(item => item.id === el.dataset.id);
   if (!log) continue;
   const longitude = map.getRenderWorldCopies() ? center.lng + wrap(log.lon - center.lng) : log.lon;
   const point = map.project([longitude, log.lat]);
   el.style.top = `${point.y}px`;
   el.hidden = point.x < 0 || point.x > viewport.width || point.y < 0 || point.y > viewport.height;
   el.classList.toggle('active', log.id === selected);
   if (el.hidden) continue;
   // Leave separate tap targets for nearby sites even when zoomed out.
   const offset = [0, 38, -38, 76, -76].find(dx => {
    const x = point.x + dx;
    return x >= 18 && x <= viewport.width - 18
     && logPoints.every(other => Math.abs(x - other.x) >= 38 || Math.abs(point.y - other.y) >= 38);
   }) ?? 0;
   const x = point.x + offset;
   el.style.left = x + 'px';
   el.style.setProperty('--pin-offset', offset + 'px');
   el.style.setProperty('--pin-leader-width', Math.abs(offset) + 'px');
   logPoints.push({x, y:point.y});
  }
  placeSpotPins(viewport, logPoints, center.lng);
  onMove?.({ lat: center.lat, lon: wrap(center.lng) });
 }
 function updateWaterMask(){
  if (map.isMoving() || !map.getLayer('water-main') || !map.getSource('island-gazetteer')) return;
  const native=map.querySourceFeatures('openmaptiles',{sourceLayer:'place'}).filter(f=>['island','islet'].includes(f.properties.class)&&f.geometry.type==='Point').map(f=>({coordinates:f.geometry.coordinates,keys:['name','name:ja','name:nonlatin','name:latin','name:en'].map(k=>nameKey(f.properties[k])).filter(k=>k.length>1)}));
  const extra=gazetteer.features.filter(f=>!native.some(n=>Math.abs(n.coordinates[0]-f.geometry.coordinates[0])<.07&&Math.abs(n.coordinates[1]-f.geometry.coordinates[1])<.07&&n.keys.some(k=>f.properties.aliasKeys.split('|').includes(k))));const nextKey=extra.map(f=>f.id).join(',');if(nextKey!==gazetteerKey){gazetteerKey=nextKey;map.getSource('island-gazetteer').setData({...gazetteer,features:extra});}
  const r=dimensions();if(!r.width||!r.height)return;mask.width=Math.ceil(r.width);mask.height=Math.ceil(r.height);ctx.fillStyle='#fff';const water=map.queryRenderedFeatures({layers:['water-main']});
  if (!map.getRenderWorldCopies()) {
   // Continue the water effect past the edge of the map on narrow screens.
   const northwest = map.project([-180, mercatorLimit]);
   const southeast = map.project([180, -mercatorLimit]);
   ctx.fillRect(0, 0, mask.width, mask.height);
   ctx.clearRect(northwest.x, northwest.y, southeast.x - northwest.x, southeast.y - northwest.y);
  }
  for(const f of water){const polygons=f.geometry.type==='Polygon'?[f.geometry.coordinates]:f.geometry.type==='MultiPolygon'?f.geometry.coordinates:[];for(const polygon of polygons){ctx.beginPath();for(const ring of polygon){for(let i=0;i<ring.length;i++){const p=map.project(ring[i]);if(!i)ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y);}ctx.closePath();}ctx.fill('evenodd');}}
  ocean.style.maskImage=`url("${mask.toDataURL()}")`;ocean.style.maskSize='100% 100%';ocean.style.opacity=water.length?'.78':'0';ocean.dataset.waterFeatures=String(water.length);
  const islands=map.queryRenderedFeatures({layers:['island-names','island-local-names']}).map(f=>f.properties['name:ja']||f.properties['name:nonlatin']||f.properties.name).filter(Boolean);canvas.dataset.islandLabels=JSON.stringify([...new Set(islands)]);canvas.dataset.mapState='ready';
 }
 const scheduleMask=()=>{clearTimeout(maskTimer);maskTimer=setTimeout(updateWaterMask,70);};
 function paintWater() {
  if (map.getLayer('water-main')) {
   map.setPaintProperty('water-main', 'fill-color', journalMode ? '#53309d' : normalWaterColor);
  }
 }
 function setJournalMode(active) {
  if (journalMode === active) return;
  journalMode = active;
  oceanView.setJournalMode(active);
  paintWater();
 }
 map.on('load',()=>{if (journalMode) paintWater();update();scheduleMask();});map.on('move',update);map.on('movestart',()=>{canvas.dataset.mapState='moving';ocean.style.opacity='0';});map.on('moveend',scheduleMask);map.on('idle',scheduleMask);map.on('error',e=>{canvas.dataset.mapError=e.error?.message||'Map data unavailable';});
 map.on('click',e=>oceanView.ripple(e.point.x,e.point.y));
 function setLogs(next, id) {
  logs = next;
  selected = id;
  pins.replaceChildren();
  const groups = new Map();
  for (const log of logs) {
   if (log.lat === null) continue;
   const key = log.lat.toFixed(3) + ',' + log.lon.toFixed(3);
   const group = groups.get(key);
   if (group) group.push(log);
   else groups.set(key, [log]);
  }
  for (const group of groups.values()) {
   const selectedIndex = group.findIndex(log => log.id === selected);
   const log = group[Math.max(0, selectedIndex)];
   const approximate = log.locationKind === 'approximate';
   const pin = document.createElement('button');
   pin.type = 'button';
   pin.className = 'pin';
   pin.dataset.id = log.id;
   pin.setAttribute('aria-label', log.site + 'のログを開く');
   pin.setAttribute('aria-pressed', String(selectedIndex !== -1));
   if (approximate) pin.title = log.site + '（位置は目安）';

   const leader = document.createElement('i');
   leader.className = 'pin-leader';
   leader.setAttribute('aria-hidden', 'true');
   const label = document.createElement('span');
   label.className = 'pin-label';
   label.textContent = log.site + (group.length > 1 ? ' · ' + group.length + '本' : '') + (approximate ? '（目安）' : '');
   pin.append(leader, label);

   if (group.length > 1) {
    const count = document.createElement('span');
    count.className = 'pin-count';
    count.textContent = group.length;
    pin.append(count);
   }
   pin.onclick = event => {
    event.stopPropagation();
    const point = map.project([log.lon, log.lat]);
    oceanView.ripple(point.x, point.y);
    onSelect(group[(selectedIndex + 1) % group.length].id);
   };
   pins.append(pin);
  }
  update();
 }
 function showWorld() {
  canvas.dataset.worldView = 'true';
  // The regular Mercator constraint fills the viewport and crops the world on phones.
  map.setTransformConstrain((center, zoom) => ({
   center: new LngLat(clamp(center.lng, -180, 180), clamp(center.lat, -mercatorLimit, mercatorLimit)),
   zoom: clamp(zoom, minZoom, maxZoom),
  }));
  map.setRenderWorldCopies(false);
  map.fitBounds(worldBounds, { padding: 18, duration: motion.matches ? 0 : 950 });
 }
 function enableWrappedMap() {
  delete canvas.dataset.worldView;
  map.setRenderWorldCopies(true);
  map.setTransformConstrain();
 }
 function showJapan() {
  enableWrappedMap();
  map.fitBounds(japanBounds, { padding: 36, duration: motion.matches ? 0 : 850 });
 }
 function fit(){map.resize();const p=logs.filter(l=>l.lat!==null),r=dimensions();if(!p.length){showJapan();return;}enableWrappedMap();if(p.length===1){map.easeTo({center:[p[0].lon,p[0].lat],zoom:12,duration:motion.matches?0:900});return;}const base=p[0].lon,longs=p.map(l=>base+wrap(l.lon-base)),lats=p.map(l=>l.lat);map.fitBounds([[Math.min(...longs),Math.min(...lats)],[Math.max(...longs),Math.max(...lats)]],{padding:{top:150,bottom:95,left:r.width<700?40:90,right:65},maxZoom:13,duration:motion.matches?0:950});}
 new ResizeObserver(()=>{map.resize();oceanView.resize();update();scheduleMask();}).observe(canvas.parentElement);oceanView.resize();
 function focusSpot(spot) {
  // Keep the selected pin above the detail card on narrow screens.
  map.easeTo({
   center: spot.coordinates,
   offset: [0, -dimensions().height * .3],
   duration: motion.matches ? 0 : 480,
  });
 }
 return {setLogs,setJournalMode,fit,showWorld,showJapan,focusSpot,select(log){selected=log.id;setLogs(logs,selected);if(log.lat!==null){const r=dimensions();map.easeTo({center:[log.lon,log.lat],zoom:Math.max(map.getZoom(),12.8),offset:[r.width<700?0:r.width*.13,-r.height*(r.width<700?.2:.06)],duration:motion.matches?0:1050});map.once('moveend',()=>{const p=map.project([log.lon,log.lat]);oceanView.ripple(p.x,p.y);});}},zoomBy(f){map.zoomTo(map.getZoom()+Math.log2(f),{duration:motion.matches?0:500});},pauseMotion:value=>oceanView.pause(value)};
}