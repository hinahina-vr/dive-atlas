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
 salamander: `
  <path class="paper-edge" fill="#a77755" d="M28.8 9.7c1.5 1.7.2 5.6-3.2 6.7l-3.8.5 2.1 2.9-1.4 2.2-2.2-1.3-2.6-3-3.3.5-1.8 3.7 1.3 2.1-2.4 1.1-2.4-2.7 1.4-4.8C4.6 20.5.7 17.2 2 12.2c1.1 3.1 4.6 4 8.3 1.9l2.1-3.5-.3-2.7 2.5-.8 1 2.9 2.5 1.3.4-3.4 2.4-1.6 1.5 1.8-.9 2.6c2.2-2.2 5.4-2.9 7.3-1z"/>
  <path fill="#ddb37a" d="M5 16.4c5.7.7 8.8-4 12.6-3.3l4.9-.7c2.7-1.8 5-1.8 5.8-.7-1 2-3.7 3.4-7.5 3.2-3.3-.2-6.7 1.7-9.4 2.5-3.7 1.1-5.7.7-6.4-1z"/>
  <g fill="#634638"><circle cx="26.1" cy="11.6" r="1.05"/><circle cx="21.8" cy="14.8" r=".9"/><circle cx="18.4" cy="14.4" r=".7"/><circle cx="14.3" cy="15.4" r=".8"/><circle cx="10.6" cy="17" r=".7"/></g>
 `,
 seahorse: `
  <path class="paper-edge" fill="#ef8d92" d="M13.4 3.3 16.8 5l4.1-.4 3.2 2.8 4.4 1.2-.6 3.2-5.7 1.5-2.6-.6c-.1 2.3 2.3 3.2 2.4 6.4.2 4.5-4.5 7.1-6.8 7.3-1.8.2-1.7 2.2-.5 2.3.7.1 1.2-.6 1.1-1.2 2.7-.9 3.7 1.7 2.4 3-2 2-6.4 1.1-7.6-1.9-.8-2 .4-4.3 2.8-5.3 1.8-.8 3-2 2.7-3.2-3.9-.3-6.4-3-6.5-6.1-.2-1.5.3-3 .9-4.2L7.4 7l3.8-.2z"/>
  <path fill="#ffc580" d="m12.6 8.6 3.3.4c-1.1 2.6-.7 4.6 1.6 6.1 2.2 1.4 3 3.1 2.3 4.7-2 .4-4.2 0-6-1.8-2.4-2.3-2.4-5.9-1.2-9.4z"/>
  <path fill="#bd5793" class="paper-edge" d="M10.9 13.4c-1.4.2-4.8 1.4-5.5 4.5 2.2.8 4.1.1 6.2-1.3z"/>
  <circle fill="#593b67" cx="20.2" cy="8.9" r="1.25"/>
 `,
 arch: `
  <path class="paper-edge" fill="#d59a63" d="m2.4 24.8 3-9.4 4.3-4.3 4.9-1.2 3.8-3.6 5.1 1.3 3.2 5.2 2.9 11.5-7 2.1-2.5-7.6-3.3-3-3.8 1-2.6 3.7-1.2 5.5z"/>
  <path fill="#ffd589" d="m5.4 15.4 4.3-4.3 4.9-1.2 3.8-3.6 5.1 1.3 1.5 2.4-5.9-.3-4.1 3.7-4.1 1.1-4.1 5.8z"/>
  <path fill="#966b69" d="m16.8 15.8 4.7-3.3 2.2 5.9 2.1 7-3.2 1-2.5-7.6z"/>
  <path fill="none" stroke="#61c9c7" stroke-width="1.6" stroke-linecap="round" d="M11.2 24.9q2.3 1.2 4.5 0t4.8 0"/>
 `,
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
 submergedTree: `
  <path fill="#bc8057" class="paper-edge" d="M3 27.6 6.2 23l5.5-2.7 3.3-5.1-5.4-2.5L4.5 8.1l1.8-2.4 5.3 3.6 3.5 1.3 1.1-6.8 3.1.3.1 6.1 4.8-4.5 2.1 2-4.9 6.2 6.8-1.7 1 2.6-8.7 3-4.7 5.6-4.4 2.2-1.1 3.2z"/>
  <path fill="#8e554d" d="m4.6 27.6 6.3-4.1 4.1-1.8 4.2-5.9 8.8-2 .7 1-8.6 3.1-4.7 5.5-4.5 2.3-1 2.9z"/>
  <path fill="none" stroke="#f4bf88" stroke-width="1.3" stroke-linecap="round" d="m8.3 24.8 6.3-3.3 4.3-5.9m-.4-2.7 4.7-4.6M12.8 11.7 8.7 9.4"/>
  <g fill="#9ee5d3"><circle cx="6.3" cy="16.1" r="1.55"/><circle cx="24.3" cy="21.7" r="1.3"/><circle cx="27.2" cy="19" r=".9"/></g>
 `,
 ufo: `
  <path fill="#f0e0aa" class="paper-edge" d="M2 15.4c0-3 4.3-5.3 8-6.3l2.6-3.3h6.8L22 9.1c3.7 1 8 3.3 8 6.3v3.1c0 4-6.4 7.4-14 7.4S2 22.5 2 18.5z"/>
  <path fill="#559fb5" d="M2 15.4c1.3 3.3 7 5.7 14 5.7s12.7-2.4 14-5.7v3.1c0 4-6.4 7.4-14 7.4S2 22.5 2 18.5z"/>
  <path fill="#84d0d1" d="M2 15.4c0-3 6.3-6.2 14-6.2s14 3.2 14 6.2c-1.3 3.3-7 5.7-14 5.7s-12.7-2.4-14-5.7z"/>
  <path fill="#e6f7eb" d="m10 9.1 2.6-3.3h6.8L22 9.1c1.4 2.6-1.5 4.2-6 4.2s-7.4-1.6-6-4.2z"/>
  <path fill="none" stroke="#f7dea2" stroke-width="1.45" stroke-linecap="round" d="M5.7 19.2c4.9 3.5 15.7 3.7 20.6 0"/>
 `,
 torii: `
  <path class="paper-edge" fill="#d25560" d="m2 4 5.5 2.3h17L30 4l-1.1 5.2-3.8.8-.9 3.4H28v3.2h-4.3l-1.5 11.1H18l1.6-11.1h-7.2L14 27.7H9.8L8.3 16.6H4v-3.2h3.8L6.9 10l-3.8-.8zM11.4 10l.5 3.4h8.2l.5-3.4z" fill-rule="evenodd"/>
  <path fill="#ffb16f" d="m3.2 6.2 4.3 1.3h17l4.3-1.3-.4 1.7-3.5.8H7.1l-3.5-.8zM5.5 14.4h21v1.3h-21z"/>
  <path fill="#8f4059" d="m9.4 19 1.3 8h2.1l-1.2-8zm11 0-1.2 8h2.1l1.3-8z"/>
  <path fill="none" stroke="#68c9ca" stroke-linecap="round" stroke-width="1.6" d="M3 29q3.2-1.8 6.5 0t6.5 0 6.5 0 6.5 0"/>
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
 spring: `
  <path fill="#5ab9ad" class="paper-edge" d="M2 22.5c0-4.2 6.3-7.5 14-7.5s14 3.3 14 7.5S23.7 30 16 30 2 26.7 2 22.5z"/>
  <ellipse cx="16" cy="22" rx="9.5" ry="3.8" fill="#88e2d0" stroke="#e7fff2" stroke-width="1.3"/>
  <path fill="#86d9f4" class="paper-edge" d="M16 2.5C13.9 6.4 9.3 10.2 9.3 14.1a6.7 6.7 0 0 0 13.4 0c0-3.9-4.6-7.7-6.7-11.6z"/>
  <path d="M13.1 13.4c-.6 1.8.2 3 1.5 3.6" fill="none" stroke="#f5ffff" stroke-width="1.5" stroke-linecap="round"/>
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
 aircraftWreck: `
  <path class="paper-edge" fill="#90a7d8" d="M16 2.8c2.1 0 3.4 2.8 3.4 5.4v4.2l10.1 5.1v3l-10.7-2.1-.8 4.9 4.1 2.8v2.2L16 26.6l-6.1 1.7v-2.2l4.1-2.8-.8-4.9-10.7 2.1v-3l10.1-5.1V8.2c0-2.6 1.3-5.4 3.4-5.4z"/>
  <path fill="#566eaa" d="m16 26.6 2-3.3.8-4.9 10.7 2.1v-3l-10.1-5.1V8.2c0-2.6-1.3-5.4-3.4-5.4z"/>
  <path fill="#e3f8f3" d="M16 6.3c1.2 0 1.9 2.2 1.9 4.2-1.2-.6-2.6-.6-3.8 0 0-2 .7-4.2 1.9-4.2z"/>
  <path fill="#f7b367" d="m4.2 17.6 4.2-2.1v2.2l-4.2.9zm19.4-2.1 4.2 2.1v1l-4.2-.9z"/>
 `,
 vehicleWreck: `
  <path class="paper-edge" fill="#efb764" d="M4 15.6h2.5l2.3-4.3h4.5l1.9-3.4h6.5l2.1 3.4h3.7l2.2 5.2v5.6L26 26H7l-4.5-4.2z"/>
  <path fill="#885844" d="M6.7 17.5h18.8c2 0 3.4 1.4 3.4 3.3s-1.5 3.4-3.4 3.4H7c-2 0-3.4-1.3-3.4-3.4 0-1.5 1.4-3.3 3.1-3.3z"/>
  <path fill="#ffdc84" d="M9.3 12.3h14.2l2.3 3.7H7.2z"/><path fill="#ffe9a8" d="m15.9 9.1 4.9-.1 1.4 2.5h-7.6z"/>
  <g fill="#f5c47e"><circle cx="8.4" cy="20.8" r="1.5"/><circle cx="13.6" cy="20.8" r="1.5"/><circle cx="18.8" cy="20.8" r="1.5"/><circle cx="24" cy="20.8" r="1.5"/></g>
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
 clownfish: `
  <path class="paper-edge" fill="#613947" d="M8.5 12.6 4.4 9.7c-1.5-1-3-.4-2.8 1.3l1.2 5-1.2 4.8c-.3 1.7 1.3 2.3 2.8 1.4l4.1-2.8c2.1 2.6 4.2 4 7.2 4.8l2.7 2.9 3.1-3.1c4-.9 7.2-3.3 8.6-6.5.8-1.8.6-3.1-.4-4.5-1.8-2.6-4.9-4.4-8.4-4.8l-4.5-2.5-3.3 3c-1.9.8-3.6 2-5 3.9z"/>
  <path fill="#f47c3d" d="M8.6 14 4.1 11.4l.9 4.6-.9 4.5 4.5-2.7 2.2 2.4c1.9 2 4.8 3 8.1 3 4.7 0 8.5-2.6 9.9-6.2.8-2-.2-3.8-2.2-5.3-2.3-1.8-5.3-2.6-8.7-2.4-3.5.2-6.4 1.7-9.3 4.7z"/>
  <path fill="#fff8e8" stroke="#613947" stroke-width=".8" d="M9.7 12.9 12.4 11c1 2.7 1.2 5.9.3 9.4l-2.8-1.9c.5-1.9.5-3.7-.2-5.6zM17 9.5l3.6-.3c1.8 3.9 1.8 9.8-.2 13.8l-3.5-.2c1.4-4.7 1.5-8.4.1-13.3z"/>
  <path fill="#d65340" d="m14.1 16.9 3.2.4-2.2 2.6-1.9-.3z"/>
  <circle fill="#613947" cx="25.7" cy="14.9" r="1.25"/>
 `,
 anchor: `
  <path class="paper-edge" fill="#eca969" d="M15.9 2.8a4 4 0 0 0-1.8 7.6v3.1H8.8v3.3h5.3v7.4c-3.5-.4-6.3-2.5-7.5-4.7l3.3-.6-6.2-4.1-1.1 7.9 1.8-1.3c1.9 4.4 6.6 7.5 11.6 7.5s9.7-3.1 11.6-7.5l1.8 1.3-1.1-7.9-6.2 4.1 3.3.6c-1.2 2.2-4 4.3-7.5 4.7v-7.4h5.3v-3.3h-5.3v-3.1a4 4 0 0 0-2-7.6z"/>
  <circle cx="16" cy="6.8" r="1.65" fill="#765c68"/>
  <path fill="none" stroke="#ffd694" stroke-width="1.4" stroke-linecap="round" d="M15.8 11.8v12.8m-6.4-9.7h12.8"/>
  <path fill="#bf704d" d="M5.1 22.6c2.2 3.6 6.4 6.3 10.9 6.3 4.5 0 8.7-2.7 10.9-6.3-3.1 3.3-7.1 4.3-10.9 4.3-3.8 0-7.8-1-10.9-4.3z"/>
 `,
 sunfish: `
  <path fill="#99a9d9" class="paper-edge" d="M5 15.5c0-3.4 2.7-6.3 6.1-7.5l2.8-5.1 2.7-.9 2.4 6.1c2.8.8 4.7 2.1 6.1 4l2.8-.9 1.7 3.1-.5 5.2-1.9 2.4-2.7-1c-1.3 1.3-3 2.3-5 2.9l-2.4 5.7-2.7.8-2.1-6.7C8.1 22.3 5 19.6 5 15.5z"/>
  <path fill="#cce3ee" d="M5.8 15.6c0-2.7 2-4.8 4.9-6 2.3-.9 4.2-.9 5.9-.6-4.4 2.6-3.8 8.9.2 13.9-5.8.3-11-2.8-11-7.3z"/>
  <path fill="#6d82b5" d="m19 8.1-2.4-6.1-1.4.5 1 6.2zm.5 15.7-2.4 5.7-1.5.4.8-6.4zm4.1-9.4 2.2-1.4 1.2 2.1-.6 3.9-1.1.9-1.9-.9z"/>
  <path fill="#768dbb" d="M14.8 14.9c2.6-1.2 4.7-.5 5.2 1.1-1.2 1.7-3.3 2-5.4 1.4z"/>
  <circle fill="#343e63" cx="9.6" cy="14" r="1.2"/><path d="m5.8 17 1.6.3" stroke="#495c84" stroke-linecap="round" stroke-width="1.2"/>
 `,
 lumpfish: `
  <path fill="#b38cc3" class="paper-edge" d="m8.3 13-4.2-2.3-2.1 1.5 1.1 4.5L2 21.4l2.2 1.4 4.4-2.4c2 4.5 5.2 7.1 10.2 7.1 5.9 0 10.1-3.5 11.2-8.8.7-3.7-.4-6.8-3.5-9-1.7-2.7-4.9-4.1-7.8-3.8-4.4.3-8 3.1-10.4 7.1z"/>
  <path fill="#eaaec2" d="M13.1 11.6c2.7-3.7 8.3-4.4 12-1.4 3.1 2.5 3.4 5.7 2.7 8.5-.9 4.1-4.5 7-9.1 7.1-5.4.1-8.8-2.9-8.6-6.8.1-2.5 1-5 3-7.4z"/>
  <path fill="#f6d4cd" d="M15.7 21.2c3 .9 7.5.2 11-2.3-1.1 4.5-5 6.8-9.7 6.4-2.4-.2-3.7-1.8-1.3-4.1z"/>
  <path fill="#8b719f" d="M11.8 17.3c2-1.2 4.4-.7 5.7.9-1.7 2.3-4.1 3.5-6.3 2.2z"/><g fill="#fff0c6"><circle cx="17" cy="11.8" r=".85"/><circle cx="19.6" cy="10.7" r=".7"/><circle cx="15" cy="14.1" r=".7"/></g>
  <circle fill="#4d3f64" cx="24.6" cy="14.4" r="1.2"/><path d="m27.1 18.8 1.9-.8" stroke="#684868" stroke-linecap="round" stroke-width="1.15"/>
 `,
 dolphin: `
  <path fill="#81bed3" class="paper-edge" d="M3 21.5c3.9-.2 6.3-1.8 8.1-4.6l-2.2-2.6 2.2-1.4 3.2 1.1c2.1-3.3 4.7-5.2 8-5l.9-4.3 2.4 1.5 1.3 4.2c1.6 1 2.1 2.5 1.6 4l2 1.5-.7 2.1-5.1-.4c-1.6 1.5-3.6 2.6-6.5 3.1L16 25l-2.5-1.4.5-2.7c-2.6 1.6-5.5 2.4-8.7 2.4l-2.4 3.2L1.5 25l1.5-2.7-1.6-1.7 1.2-1.4z"/>
  <path fill="#d4f3ef" d="M5.3 21.6c4.4-.8 6.4-2.5 8.4-4.7 3-3.2 6.4-5.2 10.4-4.5 1.8.3 2.6 1.4 2.9 2.1l2 1.6-4.5-.5c-1.7 1.9-4.9 3.2-8.4 3.5-3.2 2-7.5 3.1-10.8 2.5z"/>
  <circle cx="24.3" cy="12.3" r="1.05" fill="#27516d"/>
 `,
 fishSchool: `
  <path class="paper-edge" fill="#81c4d6" d="m13 4 3.5 1.7 3.4-2.1c3.3-1.2 6.6-.7 8.6 1.6-1.1 2.5-3.9 4.1-7.2 4l-4.6-.8-3.7 2 .9-3.3z"/>
  <path class="paper-edge" fill="#4faebf" d="m2.2 12.4 4.8 2.1 4.4-2.6c4.4-1.2 8.5-.3 10.8 2.8-1.8 3.6-5.6 5.6-9.7 4.7l-5.6-1.3-4.7 2.6 1.4-4.4z"/>
  <path class="paper-edge" fill="#6f94d2" d="m10.8 23 4.1 1.1 3.6-2.8c3.7-1.7 7.3-1.2 10 1.4-1 3.1-4 5.3-7.9 5.1l-4.7-.8-3.7 2.7.2-3.6z"/>
  <path fill="#d7f2e9" d="m17.8 7.2 4.2-1.9 4.9-.4c-1.3 1.6-3.4 2.7-5.7 2.8zm-9.5 9.5 6.7-2.5 5.5.4c-2 2-4.7 2.9-7.3 2.6zm8.3 9.4 4.7-2.1 5.8-.5c-1.7 1.7-3.5 2.4-6.3 2.5z"/>
  <g fill="#204b65"><circle cx="26.1" cy="5.4" r=".7"/><circle cx="19.5" cy="14.8" r=".86"/><circle cx="26.1" cy="23" r=".74"/></g>
 `,
 octopus: `
  <path class="paper-edge" fill="#ee786b" d="M10 14C8.2 9.5 10.5 4 16 3.4c6-.4 9 4.6 7.6 10.3l-1 2.6c1.5 2.4 4 3.5 6 1.3l1.6 2.3c-2.7 3.5-6 3.4-8.5.9 1.1 3 3.6 5 6.6 4.6l.5 2.5c-4.9 1-8.4-1.6-9.5-5-1.1 3.2-2.7 5.9-6.8 5.6l-.2-2.5c2.3-.2 3.5-1.9 3.6-4.3-2.4 4.1-5.9 5.6-9.7 4.2L7 23.5c2.9.6 4.9-.9 5.8-3.5C8.9 22.7 4.5 22.1 2 19l1.7-2c2.5 2.5 5.3 1.6 7.1-.7z"/>
  <path fill="#bf4b62" d="M12 15.7c2 1.4 6.6 1.9 10.6.6l-.9 4.5c-1.7-2.1-4.7-2.6-6.7-.5-1.2-1.2-2.9-2.1-4.7-2.1z"/>
  <path fill="#ffac81" d="M11.4 11.4C10.9 7.6 13.5 5.6 16 5.4c2.8-.2 4.3 1.1 5.2 2.7-4.9-1.5-7.3.2-9.8 3.3z"/>
  <g fill="#483853"><circle cx="13.5" cy="13.1" r="1.05"/><circle cx="20.2" cy="13.1" r="1.05"/></g>
 `,
 frogfish: `
  <path class="paper-edge" fill="#ee9853" d="m2.7 11.9 6.6 1.6 3.5-5.5 5.3-.7 3.3-2.9 3 1.2.5 2.2-3.2.1-1 1.5 4.4 1.5 3.4 3.2 1.2 4.9-2.9 2.4-4.3.3-1.7 4.5-4.9 1.2-2.3-2-3.6 1.6-2.1-2.4 1.8-3.3-7-1.3 2-4.1z"/>
  <path fill="#cb6254" d="m9.7 21.3 5.7-2.6 4.2 1.6 3.1 1.4-1.7 4.5-4.9 1.2-2.3-2-3.6 1.6-2.1-2.4z"/>
  <path fill="#ffd683" d="m12.5 9 5.6-1.7 2.6 2.1 4.4 1.5 2.1 2-4.6 2.3-3.3-.5-4.5 1.7-4.1-2.9z"/>
  <g fill="#994a63"><circle cx="15.2" cy="13" r="1.1"/><circle cx="13.7" cy="17.5" r=".85"/><circle cx="19.5" cy="17.3" r="1.2"/><circle cx="11.7" cy="22.9" r=".8"/></g>
  <circle cx="25.3" cy="14.6" r="1.3" fill="#394454"/>
  <path d="m24.3 19.3 4-.6" fill="none" stroke="#803d4d" stroke-width="1.25" stroke-linecap="round"/>
 `,
 mandarinFish: `
  <path class="paper-edge" fill="#3994c6" d="m2.4 8.8 7.1 4.3 4.2-3.1 2.6-4.8 3.5 1.8 2.2 2.3 4.8 1.8 3.1 4.4-2 4.1-5.8 2-3.3 4.4-3.1-2.9-5.5-3.6-7.8 3.8 1.8-7z"/>
  <path fill="#225c9d" d="m2.4 8.8 7.1 4.3.7 6.4-7.8 3.8 1.8-7zm14-3.6 3.4 1.8 2.2 2.3-5.5 1.9-2.8-1.2z"/>
  <path fill="none" stroke="#ffa35f" stroke-linecap="round" stroke-width="2.1" d="M9.9 16.3c2.1-2.5 3.1 1.8 5.4.1s-.1-4.1 2.6-4.2c2 0 2.4 1.6 4.6.7m-8.4 7c2.6-2 4.1 2 6.8-.1 1.1-.9 1.4-3 3.1-3.6"/>
  <circle cx="26.2" cy="14.5" r="1.2" fill="#1e4165"/>
 `,
 butterflyfish: `
  <path class="paper-edge" fill="#fff1bb" d="m2.6 11.3 7.2 2.2 4.4-5 5.1-3.7 4.1 3 4.1 5.9 3.2 2.4-3.4 2.3-2.7 5.6-5.9 3.1-5.2-4.4-4-3.9-6.9 2.2 1.5-5.1z"/>
  <path fill="#f1bd4f" d="m2.6 11.3 7.2 2.2-.3 5.3-6.9 2.2 1.5-5.1zm11.6-2.8 5.1-3.7 4.1 3-4 2.6-3.2 1.2zm-.7 14.2 5.2 4.4 5.9-3.1-4.2-1.2-4.1-2.1z"/>
  <path fill="#47566c" d="m23.4 7.8 2.6 3.6-1.1 4.9.5 6-2.2 2.1-1.6-7.5.7-5.6z"/>
  <circle cx="25.4" cy="14.2" r="1.12" fill="#fff5ca"/>
 `,
 batfish: `
  <path fill="#e5bc6e" class="paper-edge" d="m2.8 11.5 6.4 2.1 4.6-4.4L18 3l3.7 6.3 4.9 4 2.8 2.2-1 2.9-5.1 2.7-4.5 7.2-5-6.5-4.6-3.9-6.4 2.6 1.5-4.5z"/>
  <path fill="#a06852" d="m13.8 9.2 2.3-3.4L18 12l-1 7.5 2.9 7.1-1.1 1.7-5-6.5 1.3-6.3zm7.9.1 3 2.4-1.9 6.3.5 3.1-2.3 3.7-1-7z"/>
  <path fill="#fff0b6" d="m18 12 2.9.2-1 4.8 1.1 7.8-1.1 1.8-2.9-7.1z"/>
  <circle cx="26.2" cy="15.2" r="1.15" fill="#304651"/>
 `,
 ribbonEel: `
  <path fill="#4e93dc" class="paper-edge" d="M2 23.2c4.3-1.8 4.6 2.6 8.5 2.6 5.9 0 2.8-11.9 7.2-16.7 2.3-2.5 6.9-3.6 10.2-1.3l2.5 1.6-1.1 2-5.5-.3 2.6 3.5-1.3 1.6-4.6-2.7c-2.6 2.6.7 10.8-5.7 14.6C8.7 31.5 5.1 24 2 24.8z"/>
  <path fill="#f8ce4d" d="M10.5 25.8c5.9 0 2.8-11.9 7.2-16.7 2.3-2.5 6.9-3.6 10.2-1.3l2.5 1.6-1.1 2-5.5-.3 2.6 3.5-1.3 1.6-4.6-2.7 1.4-2.4-1.5-.5c-4.9 2.6-3 13.8-8.5 16.2-1.6.7-3.1.4-4.1-.6 1.2.4 2.1.3 2.7-.4z"/>
  <circle cx="25.1" cy="9.2" r="1.1" fill="#263f71"/>
 `,
 hammerhead: `
  <path class="paper-edge" fill="#7199cf" d="M4.5 4.5c.8-1 3.4-1.3 5.7-1.1l5.7.6 5.9-.6c2.4-.2 4.8.1 5.7 1.1l.5 4.1c-1.6 1.8-4.7 1.6-8.8 1.1l.1 3.5 8.1 5.6-.4 2.9-7.8-2.8-1.1 5.2 4.5 1.6-5.7 4.6-3-3.3 1.2-3.1-2.1-5-7.8 2.8-.4-2.9 8.1-5.6.1-3.5c-4.1.5-7.2.7-8.8-1.1z"/>
  <path fill="#456ca8" d="m16 5.3 5.8-1.9c2.4-.2 4.8.1 5.7 1.1l.5 4.1c-1.6 1.8-4.7 1.6-8.8 1.1l.1 3.5 8.1 5.6-.4 2.9-7.8-2.8-1.1 5.2L16 24z"/>
  <path fill="#a6e1eb" d="M5.7 8.2c2.5.5 6-.1 9.8-1.3l.7 4.1-1.2 5.7-3.1.9 2-5.6.1-2.6c-4.2.7-6.4.6-8.3-1.2z"/>
  <g fill="#273e64"><circle cx="6.5" cy="6.9" r="1.1"/><circle cx="25.5" cy="6.9" r="1.1"/></g>
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
 puffer: `
  <path fill="#4ba5bd" class="paper-edge" d="m3 15 6 2 1.4-5.3 4-4.3 5.8-2.1 5.1 1.5 3.4 3.4 1.3 5.3-1.7 5.9-4.2 4.1-5.5 1.3-5.9-1.8-3.7-4.7-6 2.7 2.2-4z"/>
  <path fill="#b3e6e7" d="m10 19 4.9-1.6 5.8 1.3 5-2.2 4.3-1-1.7 5.9-4.2 4.1-5.5 1.3-5.9-1.8z"/>
  <path fill="#23768d" d="m13.4 15 5.1-.8-2.1 4.7-3.6 1z"/>
  <g fill="#fff3c5"><circle cx="17.8" cy="10.3" r="1"/><circle cx="21.5" cy="8.9" r=".8"/><circle cx="21.5" cy="13.6" r="1"/><circle cx="18.7" cy="20.9" r=".8"/><circle cx="23" cy="21.6" r="1"/></g>
  <circle cx="26" cy="12.7" r="2.2" fill="#f9ffe9"/>
  <circle cx="26.8" cy="13" r="1" fill="#244462"/>
  <path d="m27.4 17.9 2-.5" stroke="#244462" stroke-width="1.4" stroke-linecap="round"/>
 `,
 clam: `
  <path fill="#f4be78" class="paper-edge" d="M3 16 5 9l4-1 3-4 4 2 4-2 3 4 4 1 2 7-2 7-5 2-2 3h-8l-2-3-5-2z"/>
  <path fill="#d98463" d="m3 16 6 2 7 5 7-5 6-2-2 7-5 2-2 3h-8l-2-3-5-2z"/>
  <path fill="#654477" d="m5 13 4 1 3-2 4 2 4-2 3 2 4-1-2 7-5 1-4 4-4-4-5-1z"/>
  <path fill="#7cd6cd" d="m7 15 3 1 3-2 3 2 3-2 3 2 3-1-2 4-4 1-3 3-3-3-4-1z"/>
  <path fill="#ffe1a3" d="m9 8 3-4 4 2 4-2 3 4-3-1-4 3-4-3z"/>
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
 const waterLayers = ['water-main', 'water-local'];
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
  const r=dimensions();if(!r.width||!r.height)return;mask.width=Math.ceil(r.width);mask.height=Math.ceil(r.height);ctx.fillStyle='#fff';const water=map.queryRenderedFeatures({layers:waterLayers});
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
  for (const layer of waterLayers) {
   if (map.getLayer(layer)) map.setPaintProperty(layer, 'fill-color', journalMode ? '#53309d' : normalWaterColor);
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
 function enableWorldMap() {
  canvas.dataset.worldView = 'true';
  // The regular Mercator constraint fills the viewport and crops the world on phones.
  map.setTransformConstrain((center, zoom) => ({
   center: new LngLat(clamp(center.lng, -180, 180), clamp(center.lat, -mercatorLimit, mercatorLimit)),
   zoom: clamp(zoom, minZoom, maxZoom),
  }));
  map.setRenderWorldCopies(false);
 }
 function showWorld() {
  enableWorldMap();
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
 function rememberView() {
  return {
   center: map.getCenter().toArray(),
   zoom: map.getZoom(),
   bearing: map.getBearing(),
   pitch: map.getPitch(),
   padding: map.getPadding(),
   world: !map.getRenderWorldCopies()
  };
 }
 function restoreView(view) {
  const { center, zoom, bearing, pitch, padding } = view ?? {};
  if (!Array.isArray(center) || center.length !== 2 || Math.abs(center[1]) > mercatorLimit ||
      ![...center, zoom, bearing, pitch, padding?.top, padding?.right, padding?.bottom, padding?.left].every(Number.isFinite)) return;
  if (view.world === true) enableWorldMap();
  map.jumpTo({ center, zoom, bearing, pitch, padding });
 }
 return {setLogs,setJournalMode,fit,showWorld,showJapan,focusSpot,rememberView,restoreView,select(log){selected=log.id;setLogs(logs,selected);if(log.lat!==null){const r=dimensions();map.easeTo({center:[log.lon,log.lat],zoom:Math.max(map.getZoom(),12.8),offset:[r.width<700?0:r.width*.13,-r.height*(r.width<700?.2:.06)],duration:motion.matches?0:1050});map.once('moveend',()=>{const p=map.project([log.lon,log.lat]);oceanView.ripple(p.x,p.y);});}},zoomBy(f){map.zoomTo(map.getZoom()+Math.log2(f),{duration:motion.matches?0:500});},pauseMotion:value=>oceanView.pause(value)};
}