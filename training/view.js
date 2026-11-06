import * as T from '../vendor/three.module.js';
import { makeModel, makeDiveModel } from './models.js';

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

export function createView(container, onProject, onAvailabilityChange) {
  const renderer = new T.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.6));
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.32;
  const canvas = renderer.domElement;
  canvas.setAttribute('aria-hidden', 'true');
  container.append(canvas);

  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(37, 1, .05, 40);
  const sky = new T.HemisphereLight(0xc2fff5, 0x2e5360, 2.5);
  const key = new T.DirectionalLight(0xe7f9f8, 3.05);
  const rim = new T.DirectionalLight(0x56dacc, 2.1);
  const fill = new T.DirectionalLight(0xffc58a, .8);
  key.position.set(4, 6, 5);
  rim.position.set(-4, 2.5, -4);
  fill.position.set(-4, 1, 3);
  scene.add(sky, key, rim, fill);

  const point = new T.Vector3();
  const anchorPoint = new T.Vector3();
  const gripPoint = new T.Vector3();
  const restPosition = new T.Vector3();
  let grip = null;
  const orbit = new T.Spherical(5.9, 1.28, .42);
  const look = new T.Vector3(0, -.06, 0);
  const fog = new T.FogExp2(0x5abfc0, .098);
  const direction = new T.Vector3();
  const detailOrbit = new T.Spherical(1, Math.PI / 2, 0);
  let detail;
  let alternateView = false;
  let firstPerson = false;
  let model;
  let root;
  let done = new Set();
  let interaction = { pressure: {}, active: '' };
  let frame = 0;
  let width = 1;
  let height = 1;
  let changed = 0;
  let last = 0;
  let visible = true;
  let activePointer;
  let contextLost = false;

  function queue() {
    if (!contextLost && visible && !frame && !document.hidden) frame = requestAnimationFrame(draw);
  }

  function projectAnchors(anchors) {
    const targets = {};
    for (const [id, [parent, position]] of Object.entries(anchors)) {
      if (!parent.visible) continue;
      point.copy(position);
      parent.localToWorld(point).project(camera);
      const x = (point.x * .5 + .5) * width;
      const y = (.5 - point.y * .5) * height;
      if (point.z < 1 && x > 21 && x < width - 21 && y > 24 && y < height - 58) targets[id] = { x, y };
    }
    return targets;
  }

  function movePart(part) {
    const [parent, local] = model.anchors[grip.id];
    parent.localToWorld(anchorPoint.copy(local));
    point.copy(anchorPoint).project(camera);
    gripPoint.set(grip.x / width * 2 - 1, 1 - grip.y / height * 2, point.z).unproject(camera);
    part.parent.worldToLocal(gripPoint);
    part.parent.worldToLocal(anchorPoint);
    part.position.add(gripPoint.sub(anchorPoint));
  }

  function draw(time) {
    frame = 0;
    if (contextLost || !model || document.hidden) return;
    const delta = last ? Math.min(time - last, 50) : 17;
    last = time;
    const settling = time - changed < 620;
    const k = reducedMotion.matches || !settling ? 1 : 1 - Math.exp(-delta / 79);
    model.update(done, k, reducedMotion.matches ? 240 : time, interaction);
    if (detail) {
      const [parent, position, distance] = detail;
      parent.localToWorld(anchorPoint.copy(position));
      const fit = Math.max(1, .87 / camera.aspect);
      direction.setFromSpherical(detailOrbit).transformDirection(parent.matrixWorld);
      camera.position.copy(anchorPoint).addScaledVector(direction, distance * fit);
      camera.lookAt(anchorPoint);
    } else if (firstPerson) {
      camera.position.copy(look);
      const exhaling = interaction.active === 'mask-exhale' && !reducedMotion.matches;
      const phi = orbit.phi - (exhaling ? .12 : 0);
      direction.set(Math.sin(orbit.theta) * Math.sin(phi), Math.cos(phi), -Math.cos(orbit.theta) * Math.sin(phi));
      camera.lookAt(direction.add(look));
    } else {
      camera.position.setFromSpherical(orbit).add(look);
      camera.lookAt(look);
    }
    camera.updateMatrixWorld();
    const docks = projectAnchors(model.docks || {});
    const part = grip && model.grabbable?.[grip.id];
    if (part) {
      restPosition.copy(part.position);
      movePart(part);
    }
    model.sync?.();
    renderer.render(scene, camera);
    const targets = projectAnchors(model.anchors);
    for (const [id, [x, y]] of Object.entries(model.fixedTargets || {})) {
      targets[id] = { x: x * width, y: y * height };
    }
    if (part) part.position.copy(restPosition);
    onProject(targets, docks);
    const bubbling = model.animated && (interaction.active || (done.has('bubbles') && !done.has('replace')));
    if (!reducedMotion.matches && (settling || bubbling || model.inWater)) queue();
  }

  function resizeView() {
    width = container.clientWidth;
    height = container.clientHeight;
    if (!width || !height || contextLost) return;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    queue();
  }

  const resize = new ResizeObserver(resizeView);
  resize.observe(container);
  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) queue();
  });
  observer.observe(container);
  document.addEventListener('visibilitychange', queue);
  reducedMotion.addEventListener('change', queue);
  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault();
    contextLost = true;
    cancelAnimationFrame(frame);
    frame = 0;
    last = 0;
    grip = null;
    if (activePointer && canvas.hasPointerCapture(activePointer[0])) canvas.releasePointerCapture(activePointer[0]);
    activePointer = null;
    canvas.hidden = true;
    onAvailabilityChange(false);
  });
  canvas.addEventListener('webglcontextrestored', () => {
    contextLost = false;
    canvas.hidden = false;
    resizeView();
    onAvailabilityChange(true);
  });

  function rotate(amount, tilt = 0) {
    if (detail) {
      detailOrbit.theta = T.MathUtils.clamp(detailOrbit.theta + amount, -.40, .40);
      detailOrbit.phi = T.MathUtils.clamp(detailOrbit.phi + tilt, 1.2, 1.94);
    } else {
      orbit.theta = firstPerson ? T.MathUtils.clamp(orbit.theta + amount, -1.42, 1.42) : orbit.theta + amount;
      orbit.phi = T.MathUtils.clamp(orbit.phi + tilt, .40, firstPerson ? 2.64 : 1.76);
    }
    queue();
  }

  canvas.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0) return;
    activePointer = [event.pointerId, event.clientX, event.clientY];
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener('pointermove', event => {
    if (activePointer?.[0] !== event.pointerId) return;
    rotate((activePointer[1] - event.clientX) * .010, (activePointer[2] - event.clientY) * .007);
    activePointer = [event.pointerId, event.clientX, event.clientY];
  });
  canvas.addEventListener('lostpointercapture', () => { activePointer = null; });

  function resetCamera(lesson) {
    if (firstPerson) {
      orbit.theta = 0;
      orbit.phi = lesson.scene === 'fins' ? 2.06 : lesson.scene === 'recovery' ? 1.90 : 1.64;
      if (lesson.scene === 'fins') look.set(0, 1.53, 1.92);
      else look.set(0, .17, 2.43);
    } else {
      orbit.theta = lesson?.scene === 'gear' ? .46 : .29;
      orbit.phi = lesson?.scene === 'fins' ? 1.04 : 1.29;
      orbit.radius = lesson?.scene === 'gear' ? 6.35 : 5.2;
      look.set(0, lesson?.scene === 'fins' ? -.37 : -.03, 0);
    }
    queue();
  }
  function focusDetail(action) {
    const next = model?.details?.[action];
    if (detail === next) return Boolean(detail);
    detail = next;
    interaction.detail = next ? action : undefined;
    detailOrbit.set(1, Math.PI / 2, 0);
    changed = performance.now();
    queue();
    return Boolean(detail);
  }

  let previous;
  let previousScenario;
  return {
    rotate,
    resetCamera() {
      detailOrbit.set(1, Math.PI / 2, 0);
      resetCamera(previous);
    },
    focusDetail,
    focusExample(action) {
      resetCamera(previous);
      if (focusDetail(action)) return;
      if (firstPerson && previous.scene === 'recovery' && ['sweep', 'reach', 'trace-hose'].includes(action)) orbit.theta = 1.32;
    },
    cameraPose: () => orbit.clone(),
    restoreCamera(pose) {
      focusDetail();
      if (pose) orbit.copy(pose);
      queue();
    },
    interact(pressure, active) {
      interaction = { pressure, active, detail: interaction.detail };
      changed = performance.now();
      queue();
    },
    grip(id, x, y) {
      if (!model?.grabbable?.[id]) return;
      grip = { id, x, y };
      queue();
    },
    releaseGrip() {
      if (!grip) return;
      movePart(model.grabbable[grip.id]);
      grip = null;
      changed = performance.now();
      queue();
    },
    show(lesson, finished, immersive, scenario) {
      if (previous !== lesson || immersive !== alternateView || previousScenario !== scenario) {
        grip = null;
        focusDetail();
        if (root) {
          scene.remove(root);
          root.traverse(object => {
            if (object.isInstancedMesh) object.dispose();
            object.geometry?.dispose();
            if (object.material?.map || object.material?.isShaderMaterial) {
              object.material.map?.dispose();
              object.material.dispose();
            }
          });
        }
        root = new T.Group();
        alternateView = immersive;
        firstPerson = immersive && lesson.scene !== 'inflator';
        scene.fog = immersive ? fog : null;
        model = immersive ? makeDiveModel(root, lesson, scenario) : makeModel(root, lesson, scenario);
        scene.add(root);
        previous = lesson;
        previousScenario = scenario;
        resetCamera(lesson);
        model.update(new Set(finished), 1, 0, interaction);
      }
      done = new Set(finished);
      changed = performance.now();
      queue();
    }
  };
}
