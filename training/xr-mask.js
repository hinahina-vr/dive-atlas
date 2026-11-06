import * as T from '../vendor/three.module.js';
import { makeDiveModel } from './models.js';

const controls = [
  { id: 'mask-breathe', label: '口で呼吸する', x: 32, y: 173, w: 304, h: 85 },
  { id: 'mask-hold', label: '上の縁を押さえる', x: 360, y: 173, w: 304, h: 85 },
  { id: 'mask-exhale', label: '鼻から息を吐く', x: 688, y: 173, w: 304, h: 85 },
  { id: 'exit', label: 'VRを閉じる', x: 792, y: 25, w: 200, h: 65 }
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

function makePanel() {
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
  mesh.position.set(0, -.33, -1.22);

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
    draw(state, hovered) {
      const water = Math.round(state.water * 100);
      const key = [state.index, state.guide, state.message, water, hovered].join('|');
      if (key === previous) return;
      previous = key;
      context.clearRect(0, 0, 1024, 346);
      rect(0, 0, 1024, 346, '#f1fffd');
      text('マスククリア   ' + state.index + ' / 3', 32, 58, 46, '#103b49', 700);
      text(state.message || (state.index === 3 ? '練習完了' : '操作に照準を合わせてトリガーを押す'), 32, 129, 34, '#246270');
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
      text('マスク内の水 ' + water + '%', 32, 303, 32, '#246270', 390);
      rect(436, 289, 556, 28, '#d6eeeb');
      if (water) rect(436, 289, 556 * water / 100, 28, '#31998a');
      texture.needsUpdate = true;
    }
  };
}

export function createMaskXR(renderer, session, { lesson, lights, readState, press, apply }) {
  const scene = new T.Scene();
  scene.background = new T.Color(0x79cec8);
  scene.fog = new T.FogExp2(0x79cec8, .10);
  scene.add(...lights);
  const root = new T.Group();
  const model = makeDiveModel(root, lesson);
  const completed = new Set();
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const rig = new T.Group();
  const camera = new T.PerspectiveCamera(45, 1, .05, 40);
  rig.position.set(0, .17, 2.43);
  const visor = new T.Group();
  const lens = makeVisor();
  const station = new T.Group();
  const { mesh, draw } = makePanel();
  visor.add(lens);
  station.add(mesh);
  rig.add(camera, visor, station);
  scene.add(root, rig);

  const ray = new T.Raycaster();
  const origin = new T.Vector3();
  const direction = new T.Vector3();
  const yaw = new T.Euler(0, 0, 0, 'YXZ');
  let placed = false;
  let holding;
  const aim = controller => {
    if (!controller.visible || !placed) return null;
    controller.getWorldPosition(origin);
    direction.set(0, 0, -1).transformDirection(controller.matrixWorld);
    ray.set(origin, direction);
    return ray.intersectObject(mesh)[0] || null;
  };
  function pick(hit) {
    if (!hit) return null;
    const x = hit.uv.x * 1024, y = (1 - hit.uv.y) * 346;
    return controls.find(({ x: left, y: top, w, h }) => x >= left && x <= left + w && y >= top && y <= top + h)?.id;
  }
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
    function start() {
      const state = readState();
      selected = pick(aim(controller));
      if (selected !== 'mask-exhale' || holding || !state) return;
      const step = state.steps.find(action => action.id === selected);
      if (state.steps.indexOf(step) >= state.index && press.startHold(step, controller)) holding = controller;
    }
    function select() {
      if (selected === 'exit') close();
      else if (selected === 'mask-exhale') {
        if (holding === controller) {
          holding = null;
          press.releaseHold(controller);
        }
      } else if (selected && !holding) apply(selected);
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
        placed = true;
      }
      rig.updateMatrixWorld(true);
      let hovered;
      for (const { controller, line } of pointers) {
        const hit = aim(controller);
        line.scale.z = hit?.distance || .84;
        hovered ??= pick(hit);
      }
      if (holding) press.tickHold(holding, time);
      const current = holding ? readState() : state;
      const motion = reduceMotion.matches ? 240 : time;
      lens.material.uniforms.water.value = current.water;
      lens.material.uniforms.time.value = motion * .0012;
      model.update(completed, 1, motion, { active: current.active });
      draw(current, hovered);
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
      lens.geometry.dispose();
      lens.material.dispose();
      mesh.geometry.dispose();
      mesh.material.map.dispose();
      mesh.material.dispose();
    }
  };
}
