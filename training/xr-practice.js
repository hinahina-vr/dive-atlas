import * as T from '../vendor/three.module.js';
import { makeDiveModel, makeModel } from './models.js';
import { balanceLabels, balanceStatus, inflatorAir } from './lessons.js';

const maskControls = [
  { id: 'mask-breathe', label: '口で呼吸する', x: 32, y: 173, w: 304, h: 85 },
  { id: 'mask-hold', label: '上の縁を押さえる', x: 360, y: 173, w: 304, h: 85 },
  { id: 'mask-exhale', label: '鼻から息を吐く', x: 688, y: 173, w: 304, h: 85 },
  { id: 'exit', label: 'VRを閉じる', x: 792, y: 25, w: 200, h: 65 }
];

const recoveryControls = [
  { id: 'bubbles', label: '細く息を吐く', x: 32, y: 173, w: 454, h: 85 },
  { id: 'reg-breathe', label: '慎重に吸う', x: 538, y: 173, w: 454, h: 85 },
  maskControls.at(-1)
];

const inflatorControls = [
  { id: 'balance', label: '高さを確認する', x: 32, y: 173, w: 960, h: 85 },
  maskControls.at(-1)
];

const nextBuddyControl = { id: 'next-buddy', label: 'バディチェックへ ›', x: 32, y: 173, w: 960, h: 85 };

const inspectionSlots = [
  { id: 'normal', label: '足についてくる', x: 32, y: 173, w: 454, h: 85 },
  { id: 'repair', label: 'すき間がある・調整する', x: 538, y: 173, w: 454, h: 85 }
];

function makeInspectionPreview(model, station) {
  const view = new T.Group();
  view.position.set(-.96, .84, -1.43);
  view.quaternion.setFromUnitVectors(new T.Vector3(0, 0, 1), view.position.clone().negate().normalize());
  view.visible = false;
  station.add(view);
  const backing = new T.Mesh(new T.PlaneGeometry(.78, .49), new T.MeshBasicMaterial({ color: 0xf1fffd }));
  backing.position.z = -.21;
  view.add(backing);
  const replicas = new T.Group();
  view.add(replicas);
  let displayed;
  return {
    show(id) {
      if (id === displayed) return;
      displayed = id;
      const detail = model.inspectionParts[id];
      replicas.clear();
      view.visible = Boolean(detail);
      if (!detail) return;
      replicas.scale.setScalar(detail.scale);
      for (const part of detail.parts) {
        if (!part.visible) continue;
        const copy = part.clone();
        copy.position.sub(detail.center);
        replicas.add(copy);
      }
    },
    dispose() {
      view.removeFromParent();
      replicas.clear();
      backing.geometry.dispose();
      backing.material.dispose();
    }
  };
}

function makeVisor() {
  const lens = new T.Mesh(new T.PlaneGeometry(.96, .58), new T.ShaderMaterial({
    transparent: true, depthTest: false, depthWrite: false, toneMapped: false,
    uniforms: { water: { value: 0 }, time: { value: 0 } },
    vertexShader: `
      varying vec2 uvAtLens;
      void main() {
        uvAtLens = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: `
      varying vec2 uvAtLens;
      uniform float water;
      uniform float time;
      void main() {
        vec2 p = abs((uvAtLens - .5) * vec2(.96, .58)) - vec2(.35, .17);
        float edge = length(max(p, 0.0)) + min(max(p.x, p.y), 0.0);
        float inner = 1.0 - smoothstep(.072, .075, edge);
        float frame = (1.0 - smoothstep(.103, .106, edge)) - inner;
        float level = mix(-.02, 1.02, water) + sin(uvAtLens.x * 17.0 + time) * .006;
        float fill = inner * (1.0 - smoothstep(level - .012, level, uvAtLens.y)) * step(.001, water);
        float wave = fill * smoothstep(level - .027, level - .012, uvAtLens.y);
        vec3 glass = mix(vec3(.02, .18, .23), vec3(.50, .95, .83), wave);
        gl_FragColor = vec4(mix(glass, vec3(.015, .085, .11), frame), frame * .98 + fill * .66);
        #include <colorspace_fragment>
      }`
  }));
  lens.position.z = -.64;
  lens.renderOrder = 8;
  return lens;
}

function makePanel(lesson) {
  const recovery = lesson.scene === 'recovery';
  const inflator = lesson.scene === 'inflator';
  const fins = lesson.scene === 'fins';
  const gear = lesson.scene === 'gear';
  const controls = fins || gear ? [maskControls.at(-1)] : recovery ? recoveryControls : inflator ? inflatorControls : maskControls;
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 346;
  const context = canvas.getContext('2d');
  const texture = new T.CanvasTexture(canvas);
  texture.colorSpace = T.SRGBColorSpace;
  const mesh = new T.Mesh(new T.PlaneGeometry(.99, .3345), new T.MeshBasicMaterial({
    map: texture, transparent: true, depthTest: false, depthWrite: false, toneMapped: false
  }));
  mesh.renderOrder = 9;
  if (gear) mesh.position.set(-.96, .35, -1.43);
  else if (fins) mesh.position.set(-.94, -.35, -1.45);
  else mesh.position.set(recovery ? -.41 : inflator ? -.52 : 0, recovery ? -.81 : inflator ? -.94 : -.33, inflator ? -1.28 : -1.22);

  function rect(x, y, w, h, color) {
    context.fillStyle = color;
    context.beginPath();
    context.roundRect(x, y, w, h, 17);
    context.fill();
  }
  function text(value, x, y, size, color, width = 960) {
    context.fillStyle = color;
    context.font = '700 ' + size + 'px sans-serif';
    context.textBaseline = 'middle';
    context.fillText(value, x, y, width);
  }
  let previous = '';
  let visibleControls = controls;
  return {
    mesh,
    pick(hit) {
      const x = hit.uv.x * 1024, y = (1 - hit.uv.y) * 346;
      return visibleControls.find(({ x: left, y: top, w, h }) => x >= left && x <= left + w && y >= top && y <= top + h)?.id;
    },
    draw(state, hovered, placing, done, inspecting) {
      const air = inflator ? inflatorAir(done.has('add-air'), done.has('vent'), state.pressure) : 0;
      const amount = Math.round((inflator ? air : state.water) * 100);
      const key = [state.index, state.guide, state.message, state.retry, state.reviewCount, amount, hovered, placing, inspecting].join('|');
      if (key === previous) return;
      previous = key;
      const next = state.steps[state.index];
      const inspection = inspecting && next?.inspection;
      const canAdvance = lesson.id === 'gear' && !next;
      const compact = (inflator && next?.id !== 'balance') || ((fins || gear) && !inspection && !canAdvance);
      context.clearRect(0, 0, 1024, 346);
      rect(0, 0, 1024, compact ? 246 : 346, '#f1fffd');
      text(lesson.title + '   ' + state.index + ' / ' + state.steps.length, 32, 58, 46, '#103b49', 700);
      const note = fins && inspection ? 'かかとを動かすと、フィンはどうなった？' :
        inspection ? inspection.prompt :
        canAdvance ? '機材セット完了' :
        (fins || gear) && placing ? '照準を合わせて置く' :
        inflator && placing ? '排気口を置く高さを選ぶ' :
        (fins || gear || inflator) && state.guide ? next?.label : '';
      text(note || state.message || (!next ? '練習完了' : '操作に照準を合わせてトリガーを押す'), 32, 129, 34, '#246270');
      const options = canAdvance ? [nextBuddyControl] :
        inspection ? inspectionSlots.map(slot => fins ? slot : { ...slot, label: inspection[slot.id] }) : [];
      visibleControls = compact ? controls.slice(-1) : [...options, ...controls];
      visibleControls.forEach(control => {
        const index = state.steps.findIndex(step => step.id === control.id);
        const done = index >= 0 && index < state.index;
        const guide = control.id === 'next-buddy' || (state.guide && index === state.index);
        const selected = hovered === control.id;
        const fill = done ? '#e5efed' : selected ? '#7be5d4' : guide ? '#a8eee0' : '#d5efec';
        rect(control.x, control.y, control.w, control.h, fill);
        text((done ? '✓ ' : '') + control.label, control.x + 18, control.y + control.h / 2, 32,
          done ? '#466b71' : '#133f49', control.w - 36);
      });
      if (fins || gear) {
        const hint = placing ? 'トリガーを離すか、置く場所を選ぶ' :
          state.retry ? state.message : inspection ? inspection.note || '' :
          !next ? (state.reviewCount === null ? 'VRを閉じると復習結果に戻ります' :
            state.reviewCount ? '見直す手順は' + state.reviewCount + 'つ · 通常画面で確認' : '見直す手順なし') :
          next.pressTime ? 'トリガーを押し続ける' : fins ? '足元にある目印を探す' : '器材の目印を選ぶ';
        text(hint, 32, compact ? 197 : 300, 32, '#246270');
      } else if (recovery) {
        const note = placing ? '正面を向いて「口元」を選ぶ' : !next ? 'VRを閉じると復習結果に戻ります' :
          !state.guide ? '次の操作を思い出し、器材かボタンを選ぶ' :
          ['sweep', 'reach', 'trace-hose'].includes(next.id) ? '右肩側を見て、ホースの目印を探す' : next.label;
        text(note, 32, 303, 32, '#246270');
      } else {
        const label = inflator
          ? (done.has('vent') ? balanceLabels[balanceStatus(air)] : 'BCDのふくらみ')
          : 'マスク内の水 ' + amount + '%';
        const meterY = compact ? 192 : 289;
        text(label, 32, meterY + 14, 32, '#246270', 390);
        rect(436, meterY, 556, 28, '#d6eeeb');
        if (amount) rect(436, meterY, 556 * amount / 100, 28, '#31998a');
      }
      texture.needsUpdate = true;
    }
  };
}

const recoveryLabels = {
  sweep: '腕ですくう', reach: 'ホースを探す', 'trace-hose': 'ホースをたどる',
  replace: '器材を持つ', purge: 'パージ', 'reg-exhale': '口から吐く', mouth: '口元', chest: '胸元'
};
const inflatorLabels = {
  'add-air': '給気', raise: '器材を持つ', vent: '排気', 'trim-add': '少し給気', 'trim-vent': '少し排気',
  above: 'BCDより上', below: 'BCDより下'
};

const finLabels = {
  'fin-strap': 'ストラップ', 'fin-foot': 'ブーツ', 'fin-lock': 'ストラップ',
  'fin-wiggle': 'かかとを動かす', 'fin-check': 'フィットを見る', pocket: 'ポケット', heel: 'かかと'
};

const gearLabels = {
  inspect: '検査期限', 'inspect-ring': 'Oリング', bcd: 'BCD', lock: 'バンド', uncap: 'ダストキャップ',
  first: 'ファーストステージ', connect: '低圧ホース', stow: 'ホース類', 'gauge-away': '残圧計', open: 'バルブ', pressure: '文字盤',
  buoyancy: '給気', 'buddy-vent': '排気', weights: 'ウエイト', releases: 'バックル',
  'buddy-valve': 'バルブ', air: '呼吸と残圧', alternate: '予備の呼吸器', final: 'マスク・フィン',
  cylinder: 'シリンダーの胴', valve: 'バルブ接合面', inflator: 'インフレーター口'
};

function spatialTargets(lesson, model, scene) {
  const inflator = lesson.scene === 'inflator';
  const fins = lesson.scene === 'fins';
  const gear = lesson.scene === 'gear';
  const labels = gear ? gearLabels : fins ? finLabels : inflator ? inflatorLabels : recoveryLabels;
  const entries = lesson.actions.map(action => action.id).filter(id => labels[id]);
  if (inflator) entries.push('trim-add', 'trim-vent');
  entries.push(...Object.keys(model.docks));
  const targets = entries.map(id => {
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 100;
    const context = canvas.getContext('2d');
    context.beginPath();
    context.roundRect(2, 2, 316, 96, 25);
    context.fillStyle = '#0e3542';
    context.fill();
    context.strokeStyle = '#bbf4e9';
    context.lineWidth = 4;
    context.stroke();
    context.fillStyle = '#ffcf84';
    context.beginPath();
    context.arc(45, 50, 14, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = '#e8fff9';
    context.font = '700 39px sans-serif';
    context.textBaseline = 'middle';
    context.fillText(labels[id], 78, 51, 226);
    const texture = new T.CanvasTexture(canvas);
    texture.colorSpace = T.SRGBColorSpace;
    const mesh = new T.Mesh(new T.PlaneGeometry(fins || gear ? .40 : .31, fins || gear ? .125 : .097), new T.MeshBasicMaterial({
      map: texture, transparent: true, depthTest: false, depthWrite: false, toneMapped: false
    }));
    mesh.renderOrder = 11;
    mesh.visible = false;
    scene.add(mesh);
    const dock = Boolean(model.docks[id]);
    const action = lesson.actions.find(step => step.id === id);
    const anchor = action?.anchor || id;
    const [parent, offset] = model.anchors[anchor] || model.docks[id];
    const point = offset.clone();
    if (!inflator) point.y += dock ? .12 : .14;
    if (id === 'replace') point.x += .13;
    if (id === 'buddy-vent') point.z += .17;
    const trimming = id.startsWith('trim-');
    const phaseOnly = (fins && !dock) || trimming || id === 'trace-hose';
    const actionId = trimming ? 'balance' : id;
    const index = lesson.actions.findIndex(action => action.id === actionId);
    const sharedAnchor = gear ? lesson.actions.findIndex((step, i) => i < index && step.anchor === anchor) : -1;
    return { id, dock, parent, point, mesh, index, phaseOnly, sharedAnchor };
  });
  const forward = new T.Vector3();
  const delta = new T.Vector3();
  return {
    update(state, placing, eye, orientation, inspecting) {
      forward.set(0, 0, -1).applyQuaternion(orientation);
      for (const { id, dock, parent, point, mesh, index, phaseOnly, sharedAnchor } of targets) {
        mesh.visible = false;
        if (placing ? !dock : dock || index < state.index || !parent.visible) continue;
        if (id === inspecting || (phaseOnly && index !== state.index)) continue;
        if (gear && placing === 'bcd' && id === 'inflator') continue;
        if (gear && !dock && (inspecting || sharedAnchor >= state.index ||
          index > state.index + (state.guide ? 0 : 2))) continue;
        parent.localToWorld(mesh.position.copy(point));
        if (delta.subVectors(mesh.position, eye).normalize().dot(forward) < .70) continue;
        mesh.quaternion.copy(orientation);
        mesh.updateMatrixWorld();
        mesh.visible = true;
      }
    },
    pick(ray) {
      let nearest;
      for (const { id, dock, mesh } of targets) {
        if (!mesh.visible) continue;
        const hit = ray.intersectObject(mesh)[0];
        if (hit && (!nearest || hit.distance < nearest.distance)) nearest = { id, dock, distance: hit.distance };
      }
      return nearest;
    },
    highlight(hovered) {
      for (const { id, mesh } of targets) {
        if (mesh.visible) mesh.material.color.setHex(id === hovered ? 0x9bf2df : 0xffffff);
      }
    },
    dispose() {
      for (const { mesh } of targets) {
        mesh.removeFromParent();
        mesh.geometry.dispose();
        mesh.material.map.dispose();
        mesh.material.dispose();
      }
    }
  };
}

export function createPracticeXR(renderer, session, { lesson, scenario, lights, readState, advanceToBuddy, press, trim, apply }) {
  const scene = new T.Scene();
  const gear = lesson.scene === 'gear';
  const atmosphere = gear ? 0xd6ede6 : 0x79cec8;
  scene.background = new T.Color(atmosphere);
  scene.fog = new T.FogExp2(atmosphere, gear ? .085 : .10);
  scene.add(...lights);
  const mask = lesson.scene === 'mask';
  const inflator = lesson.scene === 'inflator';
  const fins = lesson.scene === 'fins';
  const stage = new T.Group();
  const root = new T.Group();
  const equipment = new T.Group();
  stage.add(root);
  root.add(equipment);
  const floor = gear ? new T.Mesh(new T.PlaneGeometry(30, 30), new T.MeshStandardMaterial({ color: 0xa7c8bf, roughness: .90 })) : null;
  if (floor) {
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1.397;
    root.add(floor);
    root.scale.setScalar(.70);
  }
  const completed = new Set();
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const rig = new T.Group();
  const camera = new T.PerspectiveCamera(45, 1, .05, 40);
  if (gear) rig.position.set(0, .18, 2.05);
  else if (fins) rig.position.set(0, 1.53, 1.25);
  else rig.position.set(0, .17, 2.43);
  const visor = new T.Group();
  const lens = mask ? makeVisor() : null;
  const station = new T.Group();
  if (lens) visor.add(lens);
  rig.add(camera, visor, station);
  scene.add(stage, rig);

  function mount(nextLesson, nextScenario) {
    const model = gear ? makeModel(equipment, nextLesson, nextScenario) : makeDiveModel(equipment, nextLesson, nextScenario);
    const targets = mask ? null : spatialTargets(nextLesson, model, scene);
    const panel = makePanel(nextLesson);
    const preview = gear ? makeInspectionPreview(model, station) : null;
    station.add(panel.mesh);
    return { model, targets, panel, preview };
  }
  let presentation = mount(lesson, scenario);

  function unmount() {
    if (presentation) {
      const { targets, panel, preview } = presentation;
      presentation = null;
      targets?.dispose();
      preview?.dispose();
      const { mesh } = panel;
      mesh.removeFromParent();
      mesh.geometry.dispose();
      mesh.material.map.dispose();
      mesh.material.dispose();
    }
    equipment.traverse(object => {
      if (object.isInstancedMesh) object.dispose();
      object.geometry?.dispose();
      const material = object.material;
      if (material?.map?.isCanvasTexture) material.map.dispose();
      if (material?.isShaderMaterial || material?.map?.isCanvasTexture) material.dispose();
    });
    equipment.clear();
  }

  const raycaster = new T.Raycaster();
  const origin = new T.Vector3();
  const direction = new T.Vector3();
  const yaw = new T.Euler(0, 0, 0, 'YXZ');
  const eye = new T.Vector3();
  let placed = false;
  let placing;
  let continueRequested = false;
  let holding;
  let inspecting;
  let carry;
  const carriedPosition = new T.Vector3();
  const restingPosition = new T.Vector3();
  let pulse;
  let previousTime;
  const aim = controller => {
    if (!controller.visible || !placed || !presentation) return null;
    const { panel, targets } = presentation;
    const { mesh } = panel;
    controller.getWorldPosition(origin);
    direction.set(0, 0, -1).transformDirection(controller.matrixWorld);
    raycaster.set(origin, direction);
    const hit = raycaster.intersectObject(mesh)[0];
    const id = hit && panel.pick(hit);
    const target = targets?.pick(raycaster);
    if (target && (!id || target.distance < hit.distance)) return target;
    return id ? { id, distance: hit.distance } : null;
  };
  let ending = false;
  function close() {
    if (ending) return;
    ending = true;
    session.end().catch(() => { ending = false; });
  }
  const pointers = [0, 1].map(index => {
    const controller = renderer.xr.getController(index);
    const geometry = new T.BufferGeometry().setFromPoints([new T.Vector3(), new T.Vector3(0, 0, -1)]);
    const line = new T.Line(geometry, new T.LineBasicMaterial({ color: 0xc7fff3, transparent: true, depthTest: false }));
    line.renderOrder = 10;
    controller.add(line);
    rig.add(controller);
    let selected;
    let timed;
    function start() {
      const state = readState();
      const hit = aim(controller);
      selected = hit?.id;
      const step = state?.steps.find(action => action.id === selected);
      const part = (fins || gear) && presentation?.model.grabbable[selected];
      if (part && !carry && !holding && step && step === state.steps[state.index]) {
        placing = selected;
        const offset = part.getWorldPosition(new T.Vector3()).sub(raycaster.ray.at(hit.distance, carriedPosition));
        carry = { controller, part, distance: hit.distance, offset };
      }
      timed = Boolean(step?.pressTime);
      if (step?.pressTime && !holding && state.steps.indexOf(step) >= state.index && press.startHold(step, controller)) {
        holding = controller;
      }
    }
    function select() {
      if (selected === 'exit') close();
      else if (selected === 'next-buddy') continueRequested = true;
      else if (carry?.controller === controller) {
        const target = aim(controller);
        carry = null;
        if (target?.dock) place(target.id);
      } else if (timed) {
        if (holding === controller) {
          holding = null;
          press.releaseHold(controller);
        }
      } else if (selected && !holding && !carry) {
        const state = readState();
        if (!state) return;
        const expected = state.steps[state.index];
        if (inspecting && (selected === 'normal' || selected === 'repair')) {
          apply(inspecting, selected);
          if (readState()?.index !== state.index) inspecting = null;
        } else if (expected?.inspection && expected.id === selected) {
          inspecting = selected;
        } else if (expected?.attachment && expected.id === selected) {
          placing = selected;
        } else if (placing && presentation?.model.docks[selected]) {
          place(selected);
        } else if (selected === 'trim-add' || selected === 'trim-vent') {
          const adding = selected === 'trim-add';
          if (trim(adding ? 1 : -1)) pulse = { action: adding ? 'add-air' : 'vent', until: performance.now() + 220 };
        } else {
          const action = gear && state.steps.find(step => step.id === selected);
          apply(selected, action?.attachment?.dock || (action?.inspection ? 'normal' : undefined));
        }
      }
    }
    function end() {
      selected = null;
      if (carry?.controller === controller) {
        carry = null;
        placing = null;
      }
      if (holding === controller) {
        holding = null;
        press.cancel();
      }
    }
    const events = { selectstart: start, select, selectend: end, disconnected: end };
    for (const [name, listener] of Object.entries(events)) controller.addEventListener(name, listener);
    return { controller, line, end, events };
  });

  function place(dock) {
    const action = placing;
    placing = null;
    apply(action, dock);
  }
  function moveCarriedPart() {
    if (!carry?.controller.visible) return;
    const { controller, part, distance, offset } = carry;
    const target = aim(controller);
    raycaster.ray.at(target?.dock ? target.distance : distance, carriedPosition).add(offset);
    part.getWorldPosition(restingPosition);
    carriedPosition.sub(restingPosition).clampLength(0, 1.1).add(restingPosition);
    part.position.copy(part.parent.worldToLocal(carriedPosition));
  }
  function cancelInputs() {
    continueRequested = false;
    placing = null;
    pulse = null;
    previousTime = undefined;
    pointers.forEach(pointer => pointer.end());
  }
  session.addEventListener('visibilitychange', cancelInputs);
  function reset() { placed = false; cancelInputs(); }
  let space;

  return {
    render(time, frame) {
      if (!frame || ending) return;
      let state = readState();
      if (!state) { close(); return; }
      if (session.visibilityState !== 'visible') return;
      if (!space) {
        space = renderer.xr.getReferenceSpace();
        space.addEventListener('reset', reset);
      }
      const pose = frame.getViewerPose(space);
      if (!pose) { cancelInputs(); return; }
      if (continueRequested) {
        continueRequested = false;
        try {
          const next = advanceToBuddy();
          if (next) {
            cancelInputs();
            inspecting = null;
            unmount();
            presentation = mount(next.lesson, next.scenario);
            state = readState();
          }
        } catch {
          close();
          return;
        }
      }
      if (!presentation || !state) { close(); return; }
      const { model, targets, panel, preview } = presentation;
      visor.position.copy(pose.transform.position);
      visor.quaternion.copy(pose.transform.orientation);
      if (!placed) {
        station.position.copy(visor.position);
        yaw.setFromQuaternion(visor.quaternion);
        station.rotation.y = yaw.y;
        if (targets) {
          stage.position.copy(visor.position).add(rig.position);
          stage.rotation.y = yaw.y;
          root.position.copy(rig.position).negate();
        }
        placed = true;
      }
      rig.updateMatrixWorld(true);
      if (holding) press.tickHold(holding, time);
      const current = holding ? readState() : state;
      const motion = reduceMotion.matches ? 240 : time;
      if (lens) {
        lens.material.uniforms.water.value = current.water;
        lens.material.uniforms.time.value = motion * .0012;
      }
      completed.clear();
      for (let index = 0; index < current.index; index += 1) completed.add(current.steps[index].id);
      const blending = inflator && previousTime !== undefined && !reduceMotion.matches;
      const blend = blending ? 1 - Math.exp(-Math.min(time - previousTime, 100) / 75) : 1;
      previousTime = time;
      const active = current.active || (pulse?.until > time ? pulse.action : '');
      model.update(completed, blend, motion, { active, pressure: current.pressure, detail: gear ? inspecting : undefined });
      if (!fins && !gear) model.sync?.();
      targets?.update(current, placing, visor.getWorldPosition(eye), visor.quaternion, inspecting);
      moveCarriedPart();
      if (fins || gear) model.sync();
      preview?.show(inspecting);
      let hovered;
      for (const { controller, line } of pointers) {
        const hit = aim(controller);
        line.scale.z = hit?.distance || .84;
        hovered ??= hit?.id;
      }
      if (fins || gear) targets.highlight(hovered);
      panel.draw(current, hovered, placing, completed, inspecting);
      renderer.render(scene, camera);
    },
    dispose() {
      cancelInputs();
      session.removeEventListener('visibilitychange', cancelInputs);
      space?.removeEventListener('reset', reset);
      for (const { controller, line, events } of pointers) {
        for (const [name, listener] of Object.entries(events)) controller.removeEventListener(name, listener);
        controller.remove(line);
        rig.remove(controller);
        line.geometry.dispose();
        line.material.dispose();
      }
      unmount();
      floor?.geometry.dispose();
      floor?.material.dispose();
      lens?.geometry.dispose();
      lens?.material.dispose();
    }
  };
}
