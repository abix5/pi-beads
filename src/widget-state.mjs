// What the widget shows, without the ages: those are recomputed at every
// render, so a clock tick alone must not register the widget again.
export function widgetSnapshot(state) {
  if (state === undefined) return "";
  return JSON.stringify({
    ...state,
    entries: state.entries.map(({ age, ...entry }) => entry),
  });
}

export function shouldUpdateWidget(previous, next) {
  return previous !== next;
}
