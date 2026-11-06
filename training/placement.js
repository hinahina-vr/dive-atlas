export function createPlacement({ viewport, markers, caption, menu, choices, onSelect, onAttempt, onGrip, onRelease }) {
  let selection;
  let pointer;
  let positions = {};
  const dockButtons = new Map();

  function nearest(point, radius) {
    let closest;
    for (const [id, dock] of Object.entries(positions)) {
      const distance = Math.hypot(dock.x - point.x, dock.y - point.y);
      if (distance < radius) {
        closest = id;
        radius = distance;
      }
    }
    return closest;
  }

  function project(docks) {
    positions = docks;
    const over = pointer?.point && nearest(pointer.point, pointer.radius);
    for (const [id, button] of dockButtons) {
      const point = docks[id];
      button.hidden = !point;
      if (!point) continue;
      button.style.left = point.x + 'px';
      button.style.top = point.y + 'px';
      button.classList.toggle('is-over', id === over);
    }
  }

  function clear(restoreFocus = false) {
    const old = selection;
    pointer = null;
    selection = null;
    onRelease();
    viewport.classList.remove('is-placing');
    caption.hidden = true;
    menu.hidden = true;
    choices.hidden = false;
    menu.replaceChildren();
    markers.replaceChildren();
    dockButtons.clear();
    if (restoreFocus && old?.keyboard) old.source.focus({ preventScroll: true });
  }

  function finish(id) {
    const { action, keyboard } = selection;
    clear(true);
    onAttempt(action.id, keyboard, id);
  }

  function targetButton(label, className, handler) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.className = className;
    button.addEventListener('click', handler);
    return button;
  }

  function select(action, { docks, guided, source, keyboard = false }) {
    selection = { action, source, keyboard };
    onSelect();
    caption.textContent = action.attachment.part + 'を持っています';
    caption.hidden = false;
    viewport.classList.add('is-placing');
    markers.replaceChildren();
    dockButtons.clear();
    const heading = document.createElement('p');
    heading.textContent = action.attachment.prompt || action.attachment.part + 'の取り付け先を選んでください。';
    menu.replaceChildren(heading);
    for (const [id, label] of Object.entries(docks)) {
      const isGuide = guided && action.attachment.dock === id;
      const marker = targetButton('', 'dock' + (isGuide ? ' is-guide' : ''), () => finish(id));
      marker.tabIndex = -1;
      marker.dataset.dock = id;
      marker.setAttribute('aria-label', label);
      const name = document.createElement('span');
      name.textContent = label;
      marker.append(name);
      dockButtons.set(id, marker);
      markers.append(marker);

      const alternative = targetButton(label, 'choice' + (isGuide ? ' is-guide' : ''), () => finish(id));
      alternative.dataset.dockChoice = id;
      menu.append(alternative);
    }
    menu.append(targetButton('キャンセル', 'quiet', () => clear(true)));
    menu.hidden = false;
    choices.hidden = true;
    project(positions);
    if (keyboard) menu.querySelector('button')?.focus();
  }

  function relativePoint(event) {
    const bounds = markers.getBoundingClientRect();
    return { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
  }

  function bind(marker, action, options) {
    marker.classList.add('is-grabbable');
    marker.addEventListener('pointerdown', event => {
      if (!event.isPrimary || event.button !== 0 || pointer) return;
      pointer = {
        id: event.pointerId,
        origin: relativePoint(event),
        radius: event.pointerType === 'touch' ? 29 : 24
      };
      marker.setPointerCapture(event.pointerId);
    });
    marker.addEventListener('pointermove', event => {
      if (pointer?.id !== event.pointerId) return;
      const point = relativePoint(event);
      if (!pointer.point && Math.hypot(point.x - pointer.origin.x, point.y - pointer.origin.y) < 8) return;
      if (!pointer.point) select(action, { ...options, source: marker });
      pointer.point = point;
      onGrip(action.anchor, point.x, point.y);
      project(positions);
    });
    marker.addEventListener('pointerup', event => {
      if (pointer?.id !== event.pointerId) return;
      const drag = pointer;
      pointer = null;
      if (!drag.point) {
        select(action, { ...options, source: marker });
        return;
      }
      const point = relativePoint(event);
      const id = nearest(point, drag.radius);
      if (id) finish(id);
      else clear();
    });
    marker.addEventListener('lostpointercapture', event => {
      if (pointer?.id === event.pointerId) clear();
    });
  }

  return {
    select, bind, project, clear,
    active: () => Boolean(selection),
    selectedAction: () => selection?.action
  };
}
