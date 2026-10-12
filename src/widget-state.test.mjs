import assert from "node:assert/strict";
import test from "node:test";
import { shouldUpdateWidget, widgetSnapshot } from "./widget-state.mjs";

test("widget snapshots only update when visible state changes", () => {
  const empty = widgetSnapshot(undefined);
  const shown = widgetSnapshot({
    entries: [{ id: "a-1", title: "Task", closed: false }],
    closedCount: 0,
    readyCount: 1,
  });
  const changed = widgetSnapshot({
    entries: [{ id: "a-1", title: "Task", closed: true }],
    closedCount: 1,
    readyCount: 0,
  });

  assert.equal(empty, "");
  assert.equal(shouldUpdateWidget(empty, empty), false);
  assert.equal(shouldUpdateWidget(empty, shown), true);
  assert.equal(shouldUpdateWidget(shown, shown), false);
  assert.equal(shouldUpdateWidget(shown, changed), true);
  assert.equal(shouldUpdateWidget(changed, empty), true);
});

test("an age that moved on alone does not count as a change", () => {
  const at = (age) =>
    widgetSnapshot({
      entries: [{ id: "a-1", title: "Task", age, closed: false }],
      closedCount: 0,
      readyCount: 1,
    });

  assert.equal(shouldUpdateWidget(at("1m"), at("2m")), false);
});
