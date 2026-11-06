import * as T from '../vendor/three.module.js';

const mat = (color, roughness = .55, metalness = 0) => new T.MeshStandardMaterial({ color, roughness, metalness });
const rubber = mat(0x172933, .83);
const cloth = mat(0x234c53, .86);
const teal = mat(0x2db6a7, .42);
const lime = mat(0xd5e48a, .52);
const white = mat(0xe4f7ef, .41);
const aluminum = mat(0x9fb8b7, .31, .52);
const gray = mat(0x507783, .55);
const amber = mat(0xeeb84f, .37);
const coral = mat(0xeb6d57, .46);
const lens = new T.MeshStandardMaterial({ color: 0x79d8d5, transparent: true, opacity: .38, roughness: .18, depthWrite: false });
const metal = mat(0xbda782, .34, .52);
const deck = mat(0x153a43, .56, .16);
const neopreneSkin = mat(0x9c6d55, .81);
const faceSkin = mat(0xb78468, .81);
const v = (x, y, z) => new T.Vector3(x, y, z);

function place(parent, object, x = 0, y = 0, z = 0) {
  object.position.set(x, y, z);
  parent.add(object);
  return object;
}
const group = (parent, ...point) => place(parent, new T.Group(), ...point);
function mesh(parent, geometry, material, ...point) {
  const object = place(parent, new T.Mesh(geometry, material), ...point);
  return object;
}
const box = (parent, w, h, d, material, ...point) => mesh(parent, new T.BoxGeometry(w, h, d), material, ...point);
function sphere(parent, w, h, d, material, ...point) {
  const object = mesh(parent, new T.SphereGeometry(1, 24, 16), material, ...point);
  object.scale.set(w, h, d);
  return object;
}
function cyl(parent, r, h, material, x, y, z, axis = 'y', lower = r) {
  const part = mesh(parent, new T.CylinderGeometry(r, lower, h, 32), material, x, y, z);
  if (axis === 'z') part.rotation.x = Math.PI / 2;
  if (axis === 'x') part.rotation.z = Math.PI / 2;
  return part;
}
function hose(parent, coordinates, radius = .036, material = rubber) {
  const path = new T.CatmullRomCurve3(coordinates.map(point => v(...point)));
  return mesh(parent, new T.TubeGeometry(path, 28, radius, 8, false), material);
}
function flexibleHose(parent, radius, material, route) {
  const tube = mesh(parent, new T.BufferGeometry(), material);
  const lastFrom = v(Infinity, 0, 0);
  const lastTo = v(Infinity, 0, 0);
  return (from, to) => {
    if (lastFrom.distanceToSquared(from) < .000001 && lastTo.distanceToSquared(to) < .000001) return;
    lastFrom.copy(from);
    lastTo.copy(to);
    const path = new T.CatmullRomCurve3([from, ...route(from, to), to]);
    tube.geometry.dispose();
    tube.geometry = new T.TubeGeometry(path, 22, radius, 8, false);
  };
}
function plate(parent, coords, depth, round, material, ...point) {
  const shape = new T.Shape();
  shape.moveTo(...coords[0]);
  for (const point of coords.slice(1)) shape.lineTo(...point);
  shape.closePath();
  return mesh(parent, new T.ExtrudeGeometry(shape, {
    depth, bevelEnabled: true, bevelThickness: round, bevelSize: round, bevelSegments: 3, steps: 1
  }), material, ...point);
}
function ring(parent, r, section, material, ...point) {
  return mesh(parent, new T.TorusGeometry(r, section, 9, 36), material, ...point);
}
function textPlate(parent, text, color, width, x, y, z) {
  const canvas = document.createElement('canvas');
  canvas.width = 384;
  canvas.height = 80;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = color;
  ctx.font = '700 48px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 192, 40, 368);
  const texture = new T.CanvasTexture(canvas);
  texture.colorSpace = T.SRGBColorSpace;
  return mesh(parent, new T.PlaneGeometry(width, width / 4.8), new T.MeshBasicMaterial({
    map: texture, transparent: true, depthWrite: false
  }), x, y, z);
}

function stage(parent, y = -1.27) {
  const platform = group(parent, 0, y, 0);
  cyl(platform, 1.62, .12, deck, 0, -.055, 0);
  const edge = ring(platform, 1.53, .013, gray, 0, .012, 0);
  edge.rotation.x = -Math.PI / 2;
  const inner = ring(platform, 1.37, .006, gray, 0, .014, 0);
  inner.rotation.x = -Math.PI / 2;
  for (let i = 0; i < 36; i += 1) {
    const bearing = i * Math.PI / 18;
    const tick = box(platform, .014, .007, i % 3 ? .035 : .065, i % 3 ? gray : teal,
      Math.sin(bearing) * 1.44, .018, Math.cos(bearing) * 1.44);
    tick.rotation.y = bearing;
  }
}

function octo(parent, color, ...point) {
  const item = group(parent, ...point);
  cyl(item, .133, .115, rubber, 0, 0, 0, 'z');
  item.userData.purge = cyl(item, .112, .025, color, 0, 0, .071, 'z');
  ring(item, .08, .007, rubber, 0, 0, .09);
  box(item, .145, .06, .105, rubber, 0, .11, -.02);
  cyl(item, .044, .075, metal, -.16, 0, 0, 'x');
  return item;
}
function inflatorHead(parent, ...point) {
  const item = group(parent, ...point);
  sphere(item, .102, .211, .085, rubber);
  cyl(item, .064, .13, rubber, 0, .18, 0);
  item.userData.supply = cyl(item, .048, .023, lime, 0, .014, .084, 'z');
  item.userData.exhaust = cyl(item, .049, .025, gray, 0, -.11, .081, 'z');
  cyl(item, .053, .054, aluminum, -.101, .058, 0, 'x');
  return item;
}

function kit(root, startAssembled) {
  stage(root);
  const tank = group(root, .28, -.11, -.41);
  cyl(tank, .376, 1.75, aluminum, 0, -.105, 0);
  sphere(tank, .376, .28, .376, aluminum, 0, .77, 0);
  sphere(tank, .376, .23, .376, aluminum, 0, -.96, 0);
  cyl(tank, .378, .134, rubber, 0, -1.064, 0);
  cyl(tank, .379, .1, teal, 0, .615, 0);
  textPlate(tank, 'DIVE / 01', '#163b42', .48, 0, .46, .378);
  textPlate(tank, 'AIR', '#233d40', .21, 0, .35, .378);
  cyl(tank, .11, .15, metal, 0, 1.04, 0);
  box(tank, .24, .14, .18, aluminum, 0, 1.15, 0);
  cyl(tank, .087, .062, metal, 0, 1.15, .104, 'z');
  const seal = ring(tank, .051, .011, rubber, 0, 1.15, .139);
  const knob = group(tank, .17, 1.15, 0);
  cyl(knob, .077, .12, rubber, 0, 0, 0, 'x');
  for (let i = 0; i < 10; i += 1) {
    const a = i * Math.PI / 5;
    const grip = box(knob, .115, .024, .015, gray, 0, Math.sin(a) * .074, Math.cos(a) * .074);
    grip.rotation.x = -a;
  }
  const jacket = group(root);
  const shell = [[-.68, -.68], [-.76, -.38], [-.57, .08], [-.44, .55], [-.24, .66], [-.15, .38],
    [.15, .38], [.24, .66], [.44, .55], [.57, .08], [.76, -.38], [.68, -.68], [.39, -.78], [-.39, -.78]];
  plate(jacket, shell, .14, .07, cloth, 0, 0, -.12);
  for (const side of [-1, 1]) {
    const strap = [[.24, .59], [.35, .59], [.45, -.03], [.37, -.42], [.23, -.39], [.25, -.05]]
      .map(([x, y]) => [x * side, y]);
    plate(jacket, strap, .061, .034, rubber, 0, 0, .175);
    plate(jacket, [[-.20, -.17], [-.19, .15], [.13, .19], [.20, .12], [.19, -.13], [.13, -.2]],
      .20, .045, rubber, .47 * side, -.40, .06);
    box(jacket, .30, .031, .028, teal, .48 * side, -.28, .303);
    box(jacket, .13, .049, .04, amber, .53 * side, -.45, .317);
  }
  box(jacket, .81, .071, .046, rubber, 0, -.14, .244);
  box(jacket, .18, .106, .068, aluminum, 0, -.14, .276);
  box(jacket, .041, .068, .012, rubber, 0, -.14, .312);
  box(jacket, .8, .09, .062, rubber, 0, -.49, .27);
  box(jacket, .20, .12, .079, rubber, 0, -.49, .32);
  box(jacket, .074, .052, .01, teal, 0, -.49, .365);
  const tankBand = cyl(tank, .39, .12, rubber, 0, -.02, 0);
  const bandLatch = group(tank, .36, -.02, .15);
  const latchHandle = group(bandLatch, .075, 0, 0);
  box(latchHandle, .18, .095, .048, aluminum, .053, 0, 0);
  box(latchHandle, .055, .06, .018, amber, .095, 0, .031);
  hose(jacket, [[-.37, .49, -.05], [-.68, .53, .04], [-.74, .31, .25], [-.68, .06, .42]], .053);
  const inflator = inflatorHead(jacket, -.68, -.03, .42);
  for (let i = 0; i < 7; i += 1) {
    const y = .09 + i * .037;
    const grip = ring(jacket, .054, .007, gray, -.71, y, .4 - (y - .08) * .61);
    grip.rotation.x = Math.PI / 2.8;
  }

  const reg = group(root);
  cyl(reg, .112, .183, metal, 0, 0, 0, 'z');
  cyl(reg, .086, .14, aluminum, 0, 0, .097, 'z');
  hose(reg, [[-.086, 0, .015], [-.144, .117, -.064], [0, .158, -.12], [.144, .117, -.064], [.086, 0, .015]], .029, aluminum);
  const dustCap = cyl(reg, .058, .032, rubber, 0, 0, -.115, 'z');
  const loose = group(reg);
  hose(loose, [[.08, -.01, .02], [.42, .035, .06], [.57, -.26, .16], [.57, -.57, .27]], .032);
  octo(loose, teal, .58, -.64, .28);
  const spareRest = v(-.08, -.85, .26);
  const spare = octo(loose, amber, ...spareRest);
  spare.scale.setScalar(.85);
  const spareOrigin = v(-.06, -.07, .07);
  const spareClip = v(.57, -.34, .47);
  const spareEnd = v(0, 0, 0);
  const updateSpare = flexibleHose(loose, .029, amber, (from, to) => [
    v(from.x - .29, from.y - .17, from.z + .11), v(to.x - .36, to.y + .20, to.z + .15)
  ]);
  const coupler = group(root);
  cyl(coupler, .048, .14, metal, 0, 0, 0, 'x');
  for (let i = 0; i < 4; i += 1) {
    const grip = ring(coupler, .047, .006, aluminum, -.024 + i * .018, 0, 0);
    grip.rotation.y = Math.PI / 2;
  }
  const feedStart = v(0, 0, 0);
  const feedEnd = v(0, 0, 0);
  const updateFeed = flexibleHose(root, .034, gray, (from, to) => {
    const span = Math.min(from.distanceTo(to), 1.6);
    return [v(from.x - .24 * span, from.y + .15 * span, from.z + .06 * span),
      v(to.x - .16 * span, to.y + .32 * span, to.z + .06 * span)];
  });
  const inlet = v(-.15, .058, 0);
  const source = v(-.08, 0, .07);
  const freeEnd = v(-.38, -.32, .47);
  const couplerRest = v(0, 0, 0);
  const gaugeRest = v(.23, -1.16, .26);
  const gauge = group(loose, ...gaugeRest);
  const gaugeOrigin = v(.04, -.055, -.05);
  const gaugeClip = v(-.49, -.49, .43);
  const gaugeEnd = v(0, 0, 0);
  const updateGauge = flexibleHose(loose, .029, rubber, (from, to) => [
    v(from.x + .24, from.y - .24, from.z + .05), v(to.x + .17, to.y + .27, to.z - .10)
  ]);
  cyl(gauge, .142, .083, rubber, 0, 0, 0, 'z');
  cyl(gauge, .118, .015, white, 0, 0, .048, 'z');
  textPlate(gauge, 'bar', '#24535b', .087, 0, -.06, .06);
  for (let i = 0; i < 9; i += 1) {
    const a = 2.25 - i * .56;
    const tick = box(gauge, .008, .018, .006, i < 2 ? coral : gray, Math.sin(a) * -.092, Math.cos(a) * .092, .059);
    tick.rotation.z = a;
  }
  const needle = group(gauge, 0, 0, .065);
  box(needle, .011, .091, .008, coral, 0, .037, 0);
  cyl(needle, .014, .009, rubber, 0, 0, 0, 'z');
  const clip = box(jacket, .077, .098, .048, amber, .57, -.26, .36);
  box(jacket, .077, .098, .048, aluminum, -.49, -.38, .34);
  const parked = v(0, 0, 0);

  function secure(part, mount, rest, stowed, k) {
    if (stowed) loose.worldToLocal(jacket.localToWorld(parked.copy(mount)));
    part.position.lerp(stowed ? parked : rest, k);
  }

  return {
    anchors: {
      inspect: [tank, v(0, 1.25, .18)], bcd: [jacket, v(-.04, .18, .34)], lock: [bandLatch, v(.14, .02, .08)],
      uncap: [dustCap, v(.04, -.01, .015)], first: [reg, v(.12, .22, .13)],
      connect: startAssembled ? [inflator, v(-.11, 0, .13)] : [coupler, v(.05, 0, .045)],
      stow: [clip, v(.18, .05, .1)], open: [knob, v(.11, .03, .07)],
      pressure: [gauge, v(.07, -.09, .13)], weights: [jacket, v(-.48, -.41, .45)], releases: [jacket, v(.02, -.14, .39)]
    },
    docks: {
      cylinder: [tank, v(0, .02, .39)],
      valve: [tank, v(0, 1.15, .145)],
      inflator: [inflator, inlet]
    },
    grabbable: { bcd: jacket, first: reg, connect: coupler },
    sync() {
      root.worldToLocal(reg.localToWorld(feedStart.copy(source)));
      feedEnd.copy(coupler.position);
      feedEnd.x -= .067;
      updateFeed(feedStart, feedEnd);
      spareEnd.copy(spare.position);
      spareEnd.x -= .17 * spare.scale.x;
      updateSpare(spareOrigin, spareEnd);
      gaugeEnd.copy(gauge.position);
      gaugeEnd.y += .13;
      updateGauge(gaugeOrigin, gaugeEnd);
    },
    update(done, k) {
      const bcd = startAssembled || done.has('bcd');
      const first = startAssembled || done.has('first');
      const stow = startAssembled || done.has('stow');
      const open = startAssembled || done.has('open');
      jacket.position.lerp(v(bcd ? .28 : -.84, bcd ? 0 : -.33, bcd ? 0 : .24), k);
      jacket.rotation.y = T.MathUtils.lerp(jacket.rotation.y, bcd ? -.10 : .35, k);
      jacket.scale.lerp(v(1, done.has('buoyancy') ? 1.06 : 1, done.has('buoyancy') ? 1.1 : 1), k);
      reg.position.lerp(v(first ? .28 : 1.11, first ? 1.04 : .11, first ? -.13 : .32), k);
      reg.rotation.z = T.MathUtils.lerp(reg.rotation.z, first ? 0 : -.19, k);
      loose.rotation.y = T.MathUtils.lerp(loose.rotation.y, stow ? .63 : -.12, k);
      secure(spare, spareClip, spareRest, stow, k);
      secure(gauge, gaugeClip, gaugeRest, stow, k);
      knob.rotation.x = T.MathUtils.lerp(knob.rotation.x, open ? 2.35 : 0, k);
      gauge.rotation.y = T.MathUtils.lerp(gauge.rotation.y, done.has('gauge-away') && !done.has('pressure') ? 2.82 : .08, k);
      needle.rotation.z = T.MathUtils.lerp(needle.rotation.z, open ? -.72 : 2.18, k);
      seal.material = done.has('inspect') ? lime : rubber;
      tankBand.visible = bcd;
      bandLatch.visible = bcd;
      latchHandle.rotation.y = T.MathUtils.lerp(latchHandle.rotation.y, startAssembled || done.has('lock') ? 0 : -.94, k);
      clip.material = stow ? teal : amber;
      dustCap.visible = !startAssembled && !done.has('uncap');
      const connected = startAssembled || done.has('connect');
      const host = connected ? inflator : loose;
      root.worldToLocal(host.localToWorld(couplerRest.copy(connected ? inlet : freeEnd)));
      coupler.position.lerp(couplerRest, k);
    }
  };
}

function diver(root, recovery) {
  const torso = group(root, 0, -.08, 0);
  sphere(torso, .64, .84, .30, cloth, 0, -.64, -.15);
  sphere(torso, .38, .46, .33, rubber, 0, .53, 0);
  sphere(torso, .308, .335, .281, faceSkin, 0, .49, .135);
  for (const side of [-1, 1]) {
    sphere(torso, .15, .63, .109, rubber, .36 * side, -.45, .058).rotation.z = side * -.25;
    box(torso, .087, .05, .035, teal, .36 * side, -.34, .17);
  }
  const mask = group(torso, 0, .592, .39);
  const rim = [[-.38, .11], [-.32, .22], [-.14, .235], [0, .205], [.14, .235], [.32, .22], [.38, .11],
    [.31, -.10], [.12, -.13], [0, -.096], [-.12, -.13], [-.31, -.1]];
  plate(mask, rim, .083, .052, teal, 0, 0, -.015);
  sphere(mask, .10, .104, .115, rubber, 0, -.075, .084);
  const water = group(mask, 0, -.063, 0);
  const fingertips = group(mask);
  for (const side of [-1, 1]) {
    sphere(fingertips, .037, .12, .034, rubber, side * .20, .271, .134).rotation.z = side * -.23;
  }
  for (const side of [-1, 1]) {
    const pane = [[-.133, -.074], [-.151, .099], [-.105, .162], [.111, .151], [.137, .072], [.095, -.075]];
    plate(mask, pane, .025, .026, lens, side * .185, .025, .095);
    sphere(mask, .057, .034, .025, white, side * .163, .09, .087);
    sphere(mask, .022, .023, .012, rubber, side * .160, .09, .108);
    box(water, .242, .081, .021, lens, side * .183, .04, .132);
  }
  const regulator = octo(torso, aluminum, 0, .245, .433);
  const hoseOrigin = v(-.35, .33, -.35);
  const hoseEnd = v(0, 0, 0);
  const updateHose = flexibleHose(torso, .04, rubber, (from, to) => [
    v(-.65, .25, -.13), v(to.x - .14, to.y + .09, to.z - .11)
  ]);
  const arm = group(torso, -.54, -.26, .025);
  const upper = cyl(arm, .118, .63, rubber, 0, -.28, 0);
  sphere(arm, .116, .119, .116, rubber, 0, -.592, 0);
  const lower = group(arm, 0, -.59, 0);
  cyl(lower, .095, .47, cloth, 0, -.195, 0);
  sphere(lower, .095, .123, .071, neopreneSkin, 0, -.445, 0);
  upper.rotation.z = -.035;
  const bubbles = group(torso, 0, .27, .59);
  const bubbleParts = Array.from({ length: 12 }, (_, i) => sphere(bubbles, .017 + i % 3 * .008, .021, .022, lens));
  stage(root, -1.36);

  return {
    anchors: recovery ? {
      bubbles: [torso, v(.20, .22, .59)], sweep: [arm, v(-.14, -.40, .12)],
      replace: [regulator, v(-.08, -.10, .12)], purge: [regulator, v(0, .01, .115)],
      'reg-breathe': [mask, v(.34, -.06, .17)]
    } : {
      'mask-breathe': [regulator, v(.16, -.03, .14)], 'mask-hold': [mask, v(.05, .27, .14)],
      'mask-exhale': [mask, v(-.13, -.15, .23)]
    },
    ...(recovery ? { docks: { mouth: [torso, v(0, .245, .52)], chest: [torso, v(.36, -.30, .25)] },
      grabbable: { replace: regulator } } : {}),
    animated: true,
    sync() {
      hoseEnd.copy(regulator.position);
      hoseEnd.x -= .17;
      updateHose(hoseOrigin, hoseEnd);
    },
    update(done, k, time, interaction) {
      const swept = done.has('sweep');
      const replaced = done.has('replace');
      const clear = done.has('mask-exhale');
      const held = done.has('mask-hold') && !clear;
      const exhaling = interaction.active === 'mask-exhale';
      const purging = interaction.active === 'purge';
      regulator.userData.purge.position.z = purging ? .057 : .071;
      const regPosition = recovery && !replaced ? v(swept ? -.80 : -.56, swept ? .06 : -.39, swept ? .41 : -.31) : v(0, .245, .433);
      regulator.position.lerp(regPosition, k);
      torso.rotation.z = T.MathUtils.lerp(torso.rotation.z, swept && !replaced ? -.16 : 0, k);
      arm.rotation.z = T.MathUtils.lerp(arm.rotation.z, swept && !replaced ? -.62 : .08, k);
      arm.rotation.x = T.MathUtils.lerp(arm.rotation.x, swept && !replaced ? -1.13 : 0, k);
      lower.rotation.x = T.MathUtils.lerp(lower.rotation.x, swept && !replaced ? -.70 : -.12, k);
      fingertips.visible = !recovery && held;
      mask.rotation.x = T.MathUtils.lerp(mask.rotation.x, exhaling ? -.15 : held ? -.06 : 0, k);
      const remaining = clear ? 0 : 1 - (interaction.pressure['mask-exhale'] || 0);
      water.scale.y = T.MathUtils.lerp(water.scale.y, remaining, k);
      water.visible = !recovery && water.scale.y > .015;
      bubbles.visible = recovery ? purging || (done.has('bubbles') && !replaced) : exhaling;
      bubbles.position.set(0, exhaling ? .43 : .24, .59);
      bubbleParts.forEach((bubble, i) => {
        const phase = (time * .00038 + i / bubbleParts.length) % 1;
        bubble.position.set(Math.sin(phase * 7 + i) * .17, phase * 1.09, Math.cos(i) * .11 + phase * .12);
      });
    }
  };
}

function airAmount(done, pressure) {
  if (done.has('vent')) return 0;
  return done.has('add-air') ? 1 - (pressure.vent || 0) : pressure['add-air'] || 0;
}

function inflator(root, inWater = false) {
  if (!inWater) stage(root);
  const bladder = group(root, -.61, -.21, -.30);
  const bladderOutline = [[-.48, -.65], [-.57, -.48], [-.51, .32], [-.3, .62], [.16, .68], [.43, .44], [.47, -.36], [.33, -.62]];
  plate(bladder, bladderOutline, .26, .085, cloth);
  plate(bladder, [[-.32, -.44], [-.29, .32], [-.15, .43], [.11, .46], [.26, .30], [.25, -.41], [.04, -.51]],
    .12, .052, teal, 0, 0, .29);
  textPlate(bladder, 'BCD', '#0b3b42', .43, -.012, -.043, .47);
  const head = inflatorHead(root, .61, -.44, .23);
  const airCellPort = v(-.34, .39, .03);
  const handEnd = v(0, 0, 0);
  const updateAirway = flexibleHose(root, .074, rubber, (from, to) => [
    v(from.x + .27, Math.max(.77, to.y + .09), .05),
    v(to.x - .12, Math.max(.57, to.y + .13), to.z - .06)
  ]);
  head.scale.setScalar(1.55);
  head.rotation.z = -.13;
  return {
    anchors: { 'add-air': [head, v(.055, .02, .12)], raise: [head, v(-.13, .18, .10)], vent: [head, v(.05, -.11, .13)] },
    docks: { above: [root, v(.52, .77, .39)], below: [root, v(.52, -.62, .41)] },
    grabbable: { raise: head },
    sync() {
      handEnd.set(0, .25, 0);
      root.worldToLocal(head.localToWorld(handEnd));
      updateAirway(airCellPort, handEnd);
    },
    update(done, k, _time, interaction) {
      const raised = done.has('raise');
      const air = airAmount(done, interaction.pressure);
      bladder.scale.lerp(v(1 + .16 * air, 1 + .16 * air, 1 + .58 * air), k);
      head.position.lerp(raised ? v(.61, .54, .23) : v(.61, -.44, .23), k);
      head.userData.supply.position.z = interaction.active === 'add-air' ? .070 : .084;
      head.userData.exhaust.position.z = interaction.active === 'vent' ? .067 : .081;
    }
  };
}

function fins(root, inWater = false) {
  if (!inWater) stage(root, -.95);
  const fin = group(root, 0, -.63, .04);
  const blade = [[-.27, -.55], [-.47, -.91], [-.53, -1.19], [-.41, -1.34], [-.10, -1.39], [.15, -1.38],
    [.43, -1.30], [.52, -1.13], [.44, -.86], [.25, -.53], [.23, -.29], [-.23, -.29]];
  plate(fin, blade, .055, .037, teal).rotation.x = -Math.PI / 2;
  for (const side of [-1, 1]) {
    hose(fin, [[side * .16, .054, .27], [side * .24, .058, .63], [side * .38, .067, 1.01], [side * .42, .062, 1.18]], .037, rubber);
    box(fin, .084, .13, .10, amber, side * .25, .076, -.12);
  }
  const pocket = [[-.24, -.18], [-.24, .40], [-.15, .53], [.13, .53], [.24, .43], [.24, -.18], [.16, -.18],
    [.16, .38], [.09, .43], [-.10, .43], [-.16, .38], [-.16, -.18]];
  plate(fin, pocket, .12, .039, rubber, 0, .01, 0).rotation.x = Math.PI / 2;
  sphere(fin, .235, .123, .23, rubber, 0, .096, .435);
  const strap = group(fin, 0, .08, -.15);
  const strapRest = v(0, .05, -.26);
  const strapGrip = group(strap, ...strapRest);
  const band = mesh(strap, new T.BufferGeometry(), lime);
  const lastGrip = v(Infinity, 0, 0);
  const boot = group(root);
  sphere(boot, .171, .125, .325, rubber, 0, 0, .11);
  sphere(boot, .168, .31, .157, gray, 0, .21, -.052);
  cyl(boot, .141, .055, rubber, 0, .453, -.052);
  box(boot, .075, .31, .028, teal, .068, .19, .081);
  return {
    anchors: {
      'fin-strap': [strap, v(.21, .08, -.12)], 'fin-foot': [boot, v(.04, .13, .30)],
      'fin-lock': [strapGrip, v(0, .035, 0)], 'fin-check': [boot, v(-.18, .29, -.04)]
    },
    docks: { pocket: [fin, v(0, .16, .18)], heel: [boot, v(0, .09, -.19)] },
    grabbable: { 'fin-foot': boot, 'fin-lock': strapGrip },
    sync() {
      const grip = strapGrip.position;
      if (lastGrip.distanceToSquared(grip) < .000001) return;
      lastGrip.copy(grip);
      const path = new T.CatmullRomCurve3([
        v(-.24, 0, 0), v((grip.x - .32) * .5, grip.y * .75, grip.z * .70), grip,
        v((grip.x + .32) * .5, grip.y * .75, grip.z * .70), v(.24, 0, 0)
      ]);
      band.geometry.dispose();
      band.geometry = new T.TubeGeometry(path, 20, .043, 8, false);
    },
    update(done, k) {
      strapGrip.position.lerp(strapRest, k);
      const inserted = done.has('fin-foot');
      boot.position.lerp(inserted ? v(0, -.48, -.07) : v(-.56, -.16, -.43), k);
      boot.rotation.x = T.MathUtils.lerp(boot.rotation.x, inserted ? 0 : -.24, k);
      strap.rotation.x = T.MathUtils.lerp(strap.rotation.x, done.has('fin-lock') ? .24 : done.has('fin-strap') ? -1.14 : -.31, k);
      strap.position.y = T.MathUtils.lerp(strap.position.y, done.has('fin-lock') ? .235 : .08, k);
    }
  };
}

export function makeModel(root, lesson) {
  switch (lesson.scene) {
    case 'gear': return kit(root, lesson.id === 'buddy');
    case 'mask': return diver(root, false);
    case 'recovery': return diver(root, true);
    case 'inflator': return inflator(root);
    case 'fins': return fins(root);
    default: throw new Error('Unknown practice model');
  }
}

const seaRock = mat(0x35666b, .95);
const reef = mat(0x498d82, .88);
const sandTint = new T.Color(0x326b72);

function waterBackdrop(root) {
  const water = group(root);
  const tide = { value: 0 };
  const floor = mesh(water, new T.PlaneGeometry(46, 46), new T.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { tide, tint: { value: sandTint } },
    vertexShader: `
      varying vec2 seabed;
      varying float depth;
      void main() {
        vec4 view = modelViewMatrix * vec4(position, 1.0);
        seabed = position.xy;
        depth = length(view.xyz);
        gl_Position = projectionMatrix * view;
      }`,
    fragmentShader: `
      varying vec2 seabed;
      varying float depth;
      uniform float tide;
      uniform vec3 tint;
      void main() {
        float haze = 1.0 - smoothstep(3.0, 18.0, depth);
        vec2 drift = seabed * vec2(2.7, 3.1);
        float weave = sin(drift.x + cos(drift.y + tide)) + sin(drift.y - tide * .7 + sin(drift.x * 1.3));
        float caustic = pow(clamp(1.0 - abs(weave), 0.0, 1.0), 5.0);
        float light = .78 + .21 * caustic * haze;
        gl_FragColor = vec4(tint * light, haze * .87);
        #include <colorspace_fragment>
      }`
  }), 0, -2.7, -2);
  floor.rotation.x = -Math.PI / 2;
  floor.renderOrder = -1;
  for (let i = 0; i < 16; i += 1) {
    const bearing = i * 2.4;
    const radius = 2.1 + i * .40;
    const x = Math.sin(bearing) * radius;
    const z = Math.cos(bearing) * radius;
    const r = .26 + (i % 5) * .18;
    const rock = mesh(water, new T.IcosahedronGeometry(r, 0), i % 2 ? seaRock : reef, x, -2.58, z);
    rock.rotation.y = i * .77;
    rock.scale.set(1.65, .79 + i % 3 * .35, 1.4);
    if (i % 3 !== 0) continue;
    for (let leaf = 0; leaf < 4; leaf += 1) {
      const side = (leaf - 1.5) * .21;
      hose(water, [[x, -2.3, z], [x + side * .3, -2.08, z + .06], [x + side, -1.75 + leaf * .034, z + .16]], .025, reef);
    }
  }
  for (const [x, z, size] of [[-2.2, -1.6, 1.16], [-1.6, -2.4, .98], [1.8, -2.3, 1.1], [2.3, -3.5, 1.3]]) {
    const bank = mesh(water, new T.IcosahedronGeometry(size, 1), reef, x, -2.34, z);
    bank.scale.set(.82, 1.52, 1.18);
    bank.rotation.y = x * .78;
  }
  const specks = new Float32Array(116 * 3);
  for (let i = 0; i < specks.length; i += 3) {
    const seed = i / 3 + 1;
    specks[i] = Math.sin(seed * 3.63) * 5.1;
    specks[i + 1] = -2.24 + (seed * 1.37 % 3.73);
    specks[i + 2] = Math.cos(seed * 5.24) * 5.8 - 1.2;
  }
  const motes = new T.BufferGeometry().setAttribute('position', new T.BufferAttribute(specks, 3));
  const particles = new T.Points(motes, new T.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { tide },
    vertexShader: `
      uniform float tide;
      varying float glow;
      void main() {
        vec3 p = position + vec3(sin(tide + position.z) * .14, cos(tide * .54 + position.x) * .16, 0.0);
        vec4 view = modelViewMatrix * vec4(p, 1.0);
        glow = (1.0 - smoothstep(1.0, 10.0, -view.z)) * .49;
        gl_PointSize = clamp(7.5 / max(1.0, -view.z), 1.4, 3.4);
        gl_Position = projectionMatrix * view;
      }`,
    fragmentShader: `
      varying float glow;
      void main() {
        float edge = 1.0 - smoothstep(.14, .50, distance(gl_PointCoord, vec2(.5)));
        gl_FragColor = vec4(.71,.96,.94,glow * edge);
      }`
  }));
  particles.renderOrder = 2;
  water.add(particles);
  const surface = mesh(water, new T.PlaneGeometry(40, 40, 1, 1), new T.ShaderMaterial({
    side: T.DoubleSide, transparent: true, depthWrite: false,
    uniforms: { tide },
    vertexShader: `
      varying vec2 plane;
      void main() {
        plane = position.xy;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: `
      varying vec2 plane;
      uniform float tide;
      void main() {
        vec2 q = plane * 1.5;
        float a = sin(q.x * 3.5 + sin(q.y * 2.1 + tide) * 1.4);
        float b = sin(q.y * 3.0 - cos(q.x * 2.3 - tide) * 1.4);
        float caustic = pow(clamp(1.0 - abs(a + b), 0.0, 1.0), 5.0);
        float distanceFade = 1.0 - smoothstep(2.0, 14.0, length(plane));
        gl_FragColor = vec4(mix(vec3(.04,.38,.48), vec3(.52,.94,.91), caustic), (.24 + .34 * caustic) * distanceFade);
      }`
  }), 0, 1.65, 0);
  surface.rotation.x = -Math.PI / 2;
  return time => { tide.value = time * .0007; };
}

function immersionRegulator(root) {
  const regulator = octo(root, teal, 1.56, -.37, 1.70);
  regulator.rotation.y = -.48;
  const torso = group(root, 0, -.82, 2.0);
  sphere(torso, .38, .39, .25, cloth);
  const arm = group(root);
  const palm = sphere(arm, .105, .061, .14, rubber);
  const cuff = cyl(arm, .081, .5, cloth, 0, -.14, .18);
  cuff.rotation.x = -.91;
  const hoseOrigin = v(.39, -.73, 2.27);
  const hoseEnd = v(0, 0, 0);
  const updateHose = flexibleHose(root, .033, rubber, (from, to) => [
    v(.66, -.62, 2.11), v(to.x * .82 + .15, to.y - .15, to.z + .24)
  ]);
  const motionAnchor = group(root, 1.60, -.33, 1.63);
  const bubbleAnchor = group(root, -.24, -.19, 1.15);
  const breathingAnchor = group(root, .16, -.30, 1.1);
  sphere(root, .14, .16, .10, cloth, -.38, -.49, 1.48);
  const bubbles = Array.from({ length: 11 }, () => sphere(root, .026, .028, .024, lens));
  let elapsed = 0;
  let swept = false;
  return {
    docks: { mouth: [root, v(.02, -.27, 1.56)], chest: [root, v(-.38, -.40, 1.41)] },
    grabbable: { replace: regulator },
    anchors: {
      bubbles: [bubbleAnchor, v(0, 0, 0)], sweep: [motionAnchor, v(0, 0, 0)],
      replace: [regulator, v(0, .08, .015)], purge: [regulator, v(0, .04, .10)],
      'reg-breathe': [breathingAnchor, v(0, 0, 0)]
    },
    sync() {
      arm.position.copy(regulator.position).add(v(.08, -.12, .16));
      hoseEnd.copy(regulator.position);
      hoseEnd.x -= .15;
      updateHose(hoseOrigin, hoseEnd);
    },
    update(done, k, time, interaction) {
      const hasSwept = done.has('sweep');
      const replaced = done.has('replace');
      if (hasSwept && !swept) elapsed = time;
      swept = hasSwept;
      const wave = hasSwept && !replaced && k < 1 ? Math.sin(Math.min((time - elapsed) / 540, 1) * Math.PI) : 0;
      const target = replaced ? v(.02, -.27, 1.53) : hasSwept ? v(.24 + wave * .76, -.36 - wave * .32, 1.07 + wave * .31) : v(1.56, -.37, 1.70);
      regulator.position.lerp(target, k);
      arm.visible = hasSwept && !replaced;
      palm.rotation.y = -wave;
      const purging = interaction.active === 'purge';
      regulator.userData.purge.position.z = purging ? .057 : .071;
      for (let i = 0; i < bubbles.length; i += 1) {
        const f = (i / bubbles.length + time * .0006) % 1;
        bubbles[i].visible = purging || (done.has('bubbles') && !replaced);
        bubbles[i].position.set(Math.sin(i * 1.6 + f * 8) * .12, -.24 + f * .96, (purging ? 1.48 : 1.27) - f * .29);
      }
    }
  };
}

export function makeDiveModel(root, lesson) {
  const updateWater = waterBackdrop(root);
  let model;
  if (lesson.scene === 'recovery') {
    model = immersionRegulator(root);
  } else if (lesson.scene === 'fins') {
    const equipment = group(root, 0, .70, -.66);
    equipment.rotation.y = Math.PI;
    model = fins(equipment, true);
  } else if (lesson.scene === 'inflator') {
    const equipment = group(root);
    const line = group(root, -1.43, -.16, -.18);
    cyl(line, .012, 2.78, aluminum, 0, 0, 0);
    for (let i = -2; i <= 2; i += 1) box(line, i === 0 ? .25 : .12, .014, .034, i === 0 ? lime : white, .056, i * .46, 0);
    const parts = inflator(equipment, true);
    model = {
      ...parts,
      update(done, k, time, interaction) {
        const air = airAmount(done, interaction.pressure);
        equipment.position.y = T.MathUtils.lerp(equipment.position.y, .59 * air, k < 1 ? k * .47 : 1);
        parts.update(done, k, time, interaction);
      }
    };
  } else {
    const bubbles = Array.from({ length: 15 }, () => sphere(root, .024, .026, .021, lens));
    model = {
      anchors: {},
      fixedTargets: { 'mask-breathe': [.51, .74], 'mask-hold': [.50, .21], 'mask-exhale': [.50, .61] },
      update(_done, _k, time, interaction) {
        for (let i = 0; i < bubbles.length; i += 1) {
          const f = (i / bubbles.length + time * .00059) % 1;
          bubbles[i].visible = interaction.active === 'mask-exhale';
          bubbles[i].position.set(Math.cos(f * 6 + i) * (.16 + .14 * f), -.25 + f * 1.26, .7 - f * 1.45);
        }
      }
    };
  }
  return {
    ...model,
    inWater: true,
    update(done, k, time, interaction) {
      updateWater(time);
      model.update(done, k, time, interaction);
    }
  };
}
