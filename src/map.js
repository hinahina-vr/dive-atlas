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
export async function createMap({canvas,ocean,pins,spotPins,onSelect,onSpotSelect,onMove}){
 const oceanView=startOcean(ocean),motion=matchMedia('(prefers-reduced-motion: reduce)');let logs=[],selected='',maskTimer=0;
 const [style,gazetteer]=await Promise.all(['./assets/map-style.json','./assets/okinawa-island-names.geojson'].map(url=>fetch(url).then(r=>{if(!r.ok)throw new Error('地図設定を読み込めませんでした。');return r.json();})));let gazetteerKey='';const nameKey=s=>String(s||'').normalize('NFKD').toLowerCase().replace(/[\u0300-\u036f]/g,'').replace(/[\s\-_.’']/g,'').replace(/(islands?|shima|jima|諸島|島)$/,'');
 const map=new VectorMap({container:canvas,style,bounds:japanBounds,fitBoundsOptions:{padding:36},minZoom,maxZoom,attributionControl:false,localIdeographFontFamily:'sans-serif',canvasContextAttributes:{alpha:true,antialias:true},dragRotate:false,pitchWithRotate:false,fadeDuration:motion.matches?0:220});
 canvas.dataset.mapState='loading';const mask=document.createElement('canvas'),ctx=mask.getContext('2d');ocean.style.opacity='0';
 const dimensions=()=>canvas.getBoundingClientRect();
 const spotMarkers = diveSpots.map(spot => {
  const marker = document.createElement('button');
  marker.type = 'button';
  marker.className = 'spot-pin';
  marker.dataset.spot = spot.id;
  marker.title = spot.name;
  marker.setAttribute('aria-label', `${spot.name}のスポット情報`);
  marker.setAttribute('aria-controls', 'detail');
  marker.setAttribute('aria-pressed', 'false');
  marker.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 8c3-2 6-2 9-1 3-1 6-1 9 1l-1 5a3 3 0 0 1-3 2h-2l-3-2-3 2H7a3 3 0 0 1-3-2Z"/><path d="m7 10 2-.5m6 .5 2-.5"/></svg>';
  marker.hidden = true;
  marker.onclick = () => onSpotSelect(spot, marker);
  return { spot, marker };
 });
 spotPins.append(...spotMarkers.map(({ marker }) => marker));

 function placeSpotPins(viewport, logPoints, centerLongitude) {
  const placed = [];
  for (const { spot, marker } of spotMarkers) {
   const [longitude, latitude] = spot.coordinates;
   const visibleLongitude = map.getRenderWorldCopies() ? centerLongitude + wrap(longitude - centerLongitude) : longitude;
   const point = map.project([visibleLongitude, latitude]);
   // Keep both pins reachable when a log and a public spot share the same water.
   const overlappingLog = logPoints.some(log => Math.hypot(log.x - point.x, log.y - point.y) < 28);
   const y = point.y - (overlappingLog ? 32 : 0);
   const inView = point.x >= 17 && point.x <= viewport.width - 17 && y >= 17 && y <= viewport.height - 17;
   marker.hidden = !inView || placed.some(pin => Math.hypot(pin.x - point.x, pin.y - y) < 33);
   if (marker.hidden) continue;
   marker.style.left = `${point.x}px`;
   marker.style.top = `${y}px`;
   placed.push({ x: point.x, y });
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
 function updateWaterMask(){if(!map.isStyleLoaded()||map.isMoving())return;
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
 map.on('load',()=>{update();scheduleMask();});map.on('move',update);map.on('movestart',()=>{canvas.dataset.mapState='moving';ocean.style.opacity='0';});map.on('moveend',scheduleMask);map.on('idle',scheduleMask);map.on('error',e=>{canvas.dataset.mapError=e.error?.message||'Map data unavailable';});
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
 return {setLogs,fit,showWorld,showJapan,focusSpot,select(log){selected=log.id;setLogs(logs,selected);if(log.lat!==null){const r=dimensions();map.easeTo({center:[log.lon,log.lat],zoom:Math.max(map.getZoom(),12.8),offset:[r.width<700?0:r.width*.13,-r.height*(r.width<700?.2:.06)],duration:motion.matches?0:1050});map.once('moveend',()=>{const p=map.project([log.lon,log.lat]);oceanView.ripple(p.x,p.y);});}},zoomBy(f){map.zoomTo(map.getZoom()+Math.log2(f),{duration:motion.matches?0:500});},pauseMotion:value=>oceanView.pause(value)};
}