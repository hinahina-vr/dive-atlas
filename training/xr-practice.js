import * as T from '../vendor/three.module.js';
import { makeDiveModel } from './models.js';
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

const finInspection = [
  { id: 'normal', label: '足についてくる', x: 32, y: 173, w: 454, h: 85 },
  { id: 'repair', label: 'すき間がある・調整する', x: 538, y: 173, w: 454, h: 85 }
];

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
  const controls = fins ? [maskControls.at(-1)] : recovery ? recoveryControls : inflator ? inflatorControls : maskControls;
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
  if (fins) mesh.position.set(-.94, -.35, -1.45);
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
      const key = [state.index, state.guide, state.message, state.retry, amount, hovered, placing, inspecting].join('|');
      if (key === previous) return;
      previous = key;
      const next = state.steps[state.index];
      const compact = (inflator && next?.id !== 'balance') || (fins && !inspecting);
      context.clearRect(0, 0, 1024, 346);
      rect(0, 0, 1024, compact ? 246 : 346, '#f1fffd');
      text(lesson.title + '   ' + state.index + ' / ' + state.steps.length, 32, 58, 46, '#103b49', 700);
      const note = fins && inspecting ? 'かかとを動かすと、フィンはどうなった？' :
        fins && placing ? '照準を合わせて置く' :
        inflator && placing ? '排気口を置く高さを選ぶ' :
        (fins || inflator) && state.guide ? next?.label : '';
      text(note || state.message || (!next ? '練習完了' : '操作に照準を合わせてトリガーを押す'), 32, 129, 34, '#246270');
      visibleControls = inspecting ? [...finInspection, ...controls] : compact ? controls.slice(-1) : controls;
      visibleControls.forEach(control => {
        const index = state.steps.findIndex(step => step.id === control.id);
        const done = index >= 0 && index < state.index;
        const guide = state.guide && index === state.index;
        const selected = hovered === control.id;
        const fill = done ? '#e5efed' : selected ? '#7be5d4' : guide ? '#a8eee0' : '#d5efec';
        rect(control.x, control.y, control.w, control.h, fill);
        text((done ? '✓ ' : '') + control.label, control.x + 18, control.y + control.h / 2, 32,
          done ? '#466b71' : '#133f49', control.w - 36);
      });
      if (fins) {
        const hint = placing ? 'トリガーを離すか、置く場所を選ぶ' :
          state.retry ? state.message : inspecting ? '' :
          !next ? 'VRを閉じると復習結果に戻ります' :
          next.id === 'fin-wiggle' ? 'トリガーを押し続ける' : '足元にある目印を探す';
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

function spatialTargets(lesson, model, scene) {
  const inflator = lesson.scene === 'inflator';
  const fins = lesson.scene === 'fins';
  const labels = fins ? finLabels : inflator ? inflatorLabels : recoveryLabels;
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
    const mesh = new T.Mesh(new T.PlaneGeometry(fins ? .40 : .31, fins ? .125 : .097), new T.MeshBasicMaterial({
      map: texture, transparent: true, depthTest: false, depthWrite: false, toneMapped: false
    }));
    mesh.renderOrder = 11;
    mesh.visible = false;
    scene.add(mesh);
    const dock = Boolean(model.docks[id]);
    const [parent, offset] = model.anchors[id] || model.docks[id];
    const point = offset.clone();
    if (!inflator) point.y += dock ? .12 : .14;
    if (id === 'replace') point.x += .13;
    const trimming = id.startsWith('trim-');
    const phaseOnly = (fins && !dock) || trimming || id === 'trace-hose';
    const actionId = trimming ? 'balance' : id;
    const index = lesson.actions.findIndex(action => action.id === actionId);
    return { id, dock, parent, point, mesh, index, phaseOnly };
  });
  const forward = new T.Vector3();
  const delta = new T.Vector3();
  return {
    update(state, placing, eye, orientation, inspecting) {
      forward.set(0, 0, -1).applyQuaternion(orientation);
      for (const { id, dock, parent, point, mesh, index, phaseOnly } of targets) {
        mesh.visible = false;
        if (placing ? !dock : dock || index < state.index || !parent.visible) continue;
        if (id === inspecting || (phaseOnly && index !== state.index)) continue;
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
        mesh.geometry.dispose();
        mesh.material.map.dispose();
        mesh.material.dispose();
      }
    }
  };
}

export function createPracticeXR(renderer, session, { lesson, scenario, lights, readState, press, trim, apply }) {
  const scene = new T.Scene();
  scene.background = new T.Color(0x79cec8);
  scene.fog = new T.FogExp2(0x79cec8, .10);
  scene.add(...lights);
  const mask = lesson.scene === 'mask';
  const inflator = lesson.scene === 'inflator';
  const fins = lesson.scene === 'fins';
  const stage = new T.Group();
  const root = new T.Group();
  stage.add(root);
  const model = makeDiveModel(root, lesson, scenario);
  const targets = mask ? null : spatialTargets(lesson, model, scene);
  const completed = new Set();
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const rig = new T.Group();
  const camera = new T.PerspectiveCamera(45, 1, .05, 40);
  if (fins) rig.position.set(0, 1.53, 1.25);
  else rig.position.set(0, .17, 2.43);
  const visor = new T.Group();
  const lens = mask ? makeVisor() : null;
  const station = new T.Group();
  const panel = makePanel(lesson);
  const { mesh } = panel;
  if (lens) visor.add(lens);
  station.add(mesh);
  rig.add(camera, visor, station);
  scene.add(stage, rig);

  const raycaster = new T.Raycaster();
  const origin = new T.Vector3();
  const direction = new T.Vector3();
  const yaw = new T.Euler(0, 0, 0, 'YXZ');
  const eye = new T.Vector3();
  let placed = false;
  let placing;
  let holding;
  let inspecting;
  let carry;
  const carriedPosition = new T.Vector3();
  const restingPosition = new T.Vector3();
  let pulse;
  let previousTime;
  const aim = controller => {
    if (!controller.visible || !placed) return null;
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
      const part = fins && model.grabbable[selected];
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
        } else if (placing && model.docks[selected]) {
          place(selected);
        } else if (selected === 'trim-add' || selected === 'trim-vent') {
          const adding = selected === 'trim-add';
          if (trim(adding ? 1 : -1)) pulse = { action: adding ? 'add-air' : 'vent', until: performance.now() + 220 };
        } else apply(selected);
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
      if (!frame) return;
      const state = readState();
      if (!state) { close(); return; }
      if (session.visibilityState !== 'visible') return;
      if (!space) {
        space = renderer.xr.getReferenceSpace();
        space.addEventListener('reset', reset);
      }
      const pose = frame.getViewerPose(space);
      if (!pose) { cancelInputs(); return; }
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
      model.update(completed, blend, motion, { active, pressure: current.pressure });
      if (!fins) model.sync?.();
      targets?.update(current, placing, visor.getWorldPosition(eye), visor.quaternion, inspecting);
      moveCarriedPart();
      if (fins) model.sync();
      let hovered;
      for (const { controller, line } of pointers) {
        const hit = aim(controller);
        line.scale.z = hit?.distance || .84;
        hovered ??= hit?.id;
      }
      if (fins) targets.highlight(hovered);
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
      root.traverse(object => {
        if (object.isInstancedMesh) object.dispose();
        object.geometry?.dispose();
        if (object.material?.isShaderMaterial) object.material.dispose();
      });
      targets?.dispose();
      lens?.geometry.dispose();
      lens?.material.dispose();
      mesh.geometry.dispose();
      mesh.material.map.dispose();
      mesh.material.dispose();
    }
  };
}
