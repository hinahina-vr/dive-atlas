export function createPress({ begin, change, complete, interrupted }) {
  let active;
  let frame = 0;

  function sample(now) {
    const { action, base, start } = active;
    const progress = Math.min(1, base + Math.max(0, now - start) / action.pressTime);
    change(action, progress, true);
    active.node.style.setProperty('--press-progress', String(progress));
    active.progress = progress;
    return progress;
  }

  function draw(now) {
    frame = 0;
    if (active && sample(now) < 1) frame = requestAnimationFrame(draw);
  }

  function cancel() {
    if (!active) return;
    const { action, node, progress } = active;
    active = null;
    cancelAnimationFrame(frame);
    frame = 0;
    node.classList.remove('is-pressed');
    node.style.removeProperty('--press-progress');
    change(action, progress, false);
  }

  function bind(node, action) {
    node.classList.add('is-press-control');
    node.addEventListener('contextmenu', event => event.preventDefault());
    node.addEventListener('pointerdown', event => {
      if (!event.isPrimary || event.button !== 0 || active) return;
      const base = begin(action);
      if (base === null) return;
      active = { action, node, pointerId: event.pointerId, base, progress: base, start: performance.now() };
      node.setPointerCapture(event.pointerId);
      node.classList.add('is-pressed');
      change(action, base, true);
      frame = requestAnimationFrame(draw);
    });
    node.addEventListener('pointerup', event => {
      if (active?.pointerId !== event.pointerId || active.node !== node) return;
      const progress = sample(performance.now());
      cancel();
      if (progress >= 1) complete(action, false);
      else interrupted(action);
    });
    node.addEventListener('lostpointercapture', event => {
      if (active?.pointerId === event.pointerId && active.node === node) cancel();
    });
    node.addEventListener('click', event => {
      if (event.detail === 0 && begin(action) !== null) complete(action, true);
    });
  }

  document.addEventListener('visibilitychange', () => { if (document.hidden) cancel(); });

  return { bind, cancel };
}
