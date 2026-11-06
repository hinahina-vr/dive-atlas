import * as T from '../vendor/three.module.js';
import { makeDiveModel } from './models.js';

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

function makePanel(lesson, recovery) {
  const controls = recovery ? recoveryControls : maskControls;
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
  mesh.position.set(recovery ? -.41 : 0, recovery ? -.81 : -.33, -1.22);

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
  return {
    mesh,
    pick(hit) {
      const x = hit.uv.x * 1024, y = (1 - hit.uv.y) * 346;
      return controls.find(({ x: left, y: top, w, h }) => x >= left && x <= left + w && y >= top && y <= top + h)?.id;
    },
    draw(state, hovered, placing) {
      const water = Math.round(state.water * 100);
      const key = [state.index, state.guide, state.message, water, hovered, placing].join('|');
      if (key === previous) return;
      previous = key;
      context.clearRect(0, 0, 1024, 346);
      rect(0, 0, 1024, 346, '#f1fffd');
      const next = state.steps[state.index];
      text(lesson.title + '   ' + state.index + ' / ' + state.steps.length, 32, 58, 46, '#103b49', 700);
      text(state.message || (!next ? '練習完了' : '操作に照準を合わせてトリガーを押す'), 32, 129, 34, '#246270');
      controls.forEach(control => {
        const index = state.steps.findIndex(step => step.id === control.id);
        const done = index >= 0 && index < state.index;
        const guide = state.guide && index === state.index;
        const selected = hovered === control.id;
        const fill = done ? '#e5efed' : selected ? '#7be5d4' : guide ? '#a8eee0' : '#d5efec';
        rect(control.x, control.y, control.w, control.h, fill);
        text((done ? '✓ ' : '') + control.label, control.x + 18, control.y + control.h / 2, 32,
          done ? '#466b71' : '#133f49', control.w - 36);
      });
      if (recovery) {
        const note = placing ? '正面を向いて「口元」を選ぶ' : !next ? 'VRを閉じると復習結果に戻ります' :
          !state.guide ? '次の操作を思い出し、器材かボタンを選ぶ' :
          ['sweep', 'reach', 'trace-hose'].includes(next.id) ? '右肩側を見て、ホースの目印を探す' : next.label;
        text(note, 32, 303, 32, '#246270');
      } else {
        text('マスク内の水 ' + water + '%', 32, 303, 32, '#246270', 390);
        rect(436, 289, 556, 28, '#d6eeeb');
        if (water) rect(436, 289, 556 * water / 100, 28, '#31998a');
      }
      texture.needsUpdate = true;
    }
  };
}

function recoveryTargets(lesson, model, scene) {
  const labels = {
    sweep: '腕ですくう', reach: 'ホースを探す', 'trace-hose': 'ホースをたどる',
    replace: '器材を持つ', purge: 'パージ', 'reg-exhale': '口から吐く', mouth: '口元', chest: '胸元'
  };
  const entries = [...lesson.actions.filter(action => labels[action.id]).map(action => action.id), 'mouth', 'chest'];
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
    const mesh = new T.Mesh(new T.PlaneGeometry(.31, .097), new T.MeshBasicMaterial({
      map: texture, transparent: true, depthTest: false, depthWrite: false, toneMapped: false
    }));
    mesh.renderOrder = 11;
    mesh.visible = false;
    scene.add(mesh);
    const dock = Boolean(model.docks[id]);
    const [parent, offset] = model.anchors[id] || model.docks[id];
    const point = offset.clone();
    point.y += dock ? .12 : .14;
    if (id === 'replace') point.x += .13;
    return { id, dock, parent, point, mesh, index: lesson.actions.findIndex(action => action.id === id) };
  });
  const forward = new T.Vector3();
  const delta = new T.Vector3();
  return {
    update(state, placing, eye, orientation) {
      forward.set(0, 0, -1).applyQuaternion(orientation);
      for (const { id, dock, parent, point, mesh, index } of targets) {
        mesh.visible = false;
        if (placing ? !dock : dock || index < state.index || !parent.visible) continue;
        if (id === 'trace-hose' && index > state.index) continue;
        parent.localToWorld(mesh.position.copy(point));
        if (delta.subVectors(mesh.position, eye).normalize().dot(forward) < .70) continue;
        mesh.quaternion.copy(orientation);
        mesh.updateMatrixWorld();
        mesh.visible = true;
      }
    },
    pick(ray) {
      let nearest;
      for (const { id, mesh } of targets) {
        if (!mesh.visible) continue;
        const hit = ray.intersectObject(mesh)[0];
        if (hit && (!nearest || hit.distance < nearest.distance)) nearest = { id, distance: hit.distance };
      }
      return nearest;
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

export function createPracticeXR(renderer, session, { lesson, lights, readState, press, apply }) {
  const scene = new T.Scene();
  scene.background = new T.Color(0x79cec8);
  scene.fog = new T.FogExp2(0x79cec8, .10);
  scene.add(...lights);
  const recovery = lesson.scene === 'recovery';
  const stage = new T.Group();
  const root = new T.Group();
  stage.add(root);
  const model = makeDiveModel(root, lesson);
  const targets = recovery ? recoveryTargets(lesson, model, scene) : null;
  const completed = new Set();
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const rig = new T.Group();
  const camera = new T.PerspectiveCamera(45, 1, .05, 40);
  rig.position.set(0, .17, 2.43);
  const visor = new T.Group();
  const lens = recovery ? null : makeVisor();
  const station = new T.Group();
  const panel = makePanel(lesson, recovery);
  const { mesh } = panel;
  if (lens) visor.add(lens);
  station.add(mesh);
  rig.add(camera, visor, station);
  scene.add(stage, rig);

  const ray = new T.Raycaster();
  const origin = new T.Vector3();
  const direction = new T.Vector3();
  const yaw = new T.Euler(0, 0, 0, 'YXZ');
  const eye = new T.Vector3();
  let placed = false;
  let placing = false;
  let holding;
  const aim = controller => {
    if (!controller.visible || !placed) return null;
    controller.getWorldPosition(origin);
    direction.set(0, 0, -1).transformDirection(controller.matrixWorld);
    ray.set(origin, direction);
    const hit = ray.intersectObject(mesh)[0];
    const id = hit && panel.pick(hit);
    const target = targets?.pick(ray);
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
      selected = aim(controller)?.id;
      const step = state?.steps.find(action => action.id === selected);
      timed = Boolean(step?.pressTime);
      if (step?.pressTime && !holding && state.steps.indexOf(step) >= state.index && press.startHold(step, controller)) {
        holding = controller;
      }
    }
    function select() {
      if (selected === 'exit') close();
      else if (timed) {
        if (holding === controller) {
          holding = null;
          press.releaseHold(controller);
        }
      } else if (selected && !holding) {
        const state = readState();
        if (!state) return;
        if (selected === 'replace' && state.steps[state.index]?.id === selected) placing = true;
        else if (placing && (selected === 'mouth' || selected === 'chest')) {
          placing = false;
          apply('replace', selected);
        } else apply(selected);
      }
    }
    function end() {
      selected = null;
      if (holding === controller) {
        holding = null;
        press.cancel();
      }
    }
    const events = { selectstart: start, select, selectend: end, disconnected: end };
    for (const [name, listener] of Object.entries(events)) controller.addEventListener(name, listener);
    return { controller, line, end, events };
  });

  function cancelInputs() {
    placing = false;
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
        if (recovery) {
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
      model.update(completed, 1, motion, { active: current.active, pressure: current.pressure });
      model.sync?.();
      targets?.update(current, placing, visor.getWorldPosition(eye), visor.quaternion);
      let hovered;
      for (const { controller, line } of pointers) {
        const hit = aim(controller);
        line.scale.z = hit?.distance || .84;
        hovered ??= hit?.id;
      }
      panel.draw(current, hovered, placing);
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
