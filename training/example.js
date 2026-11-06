export function createExample({ render, frame }) {
  let state = null;
  let request = 0;
  let last = null;

  function duration(step) {
    return Math.max(3400, 1850 + (step.pressTime || 600), 1400 + step.detail.length * 52);
  }

  function current() {
    if (!state) return null;
    const step = state.lesson.actions[state.index];
    const time = duration(step);
    const motion = step.pressTime || 650;
    return {
      ...state, step, time,
      motion: state.complete ? 1 : Math.max(0, Math.min(1, (state.elapsed - 850) / motion))
    };
  }

  function stopFrames() {
    cancelAnimationFrame(request);
    request = 0;
    last = null;
  }

  function queue() {
    if (state && !state.paused && !state.complete && !request) request = requestAnimationFrame(tick);
  }

  function tick(now) {
    request = 0;
    if (!state || state.paused || state.complete) return;
    if (last !== null) state.elapsed += Math.min(now - last, 160);
    last = now;
    if (state.elapsed >= duration(state.lesson.actions[state.index])) {
      move(1);
      return;
    }
    frame(current());
    queue();
  }

  function move(delta) {
    if (!state) return;
    stopFrames();
    if (delta > 0 && state.index === state.end) {
      state.complete = true;
    } else {
      if (state.complete && delta < 0) state.complete = false;
      else state.index = Math.max(state.first, Math.min(state.end, state.index + delta));
      state.elapsed = 0;
    }
    render();
    queue();
  }

  return {
    current,
    start(lesson, singleStep) {
      stopFrames();
      const first = singleStep === undefined ? 0 : singleStep;
      state = { lesson, first, index: first, end: singleStep ?? lesson.actions.length - 1, paused: false, complete: false, elapsed: 0 };
      render();
      queue();
    },
    stop() {
      stopFrames();
      state = null;
    },
    move,
    toggle() {
      if (!state) return;
      if (state.complete) {
        state.index = state.first;
        state.elapsed = 0;
        state.complete = false;
        state.paused = false;
      } else {
        state.paused = !state.paused;
      }
      stopFrames();
      render();
      queue();
    },
    pause() {
      if (state && !state.paused && !state.complete) {
        state.paused = true;
        stopFrames();
        render();
      }
    }
  };
}
