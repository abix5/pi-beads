import assert from "node:assert/strict";
import { widgetLines, displayWidth } from "./widget-lines.mjs";

// empty -> nothing to draw
assert.deepEqual(widgetLines([], 80), []);

// long line is cut to width, with an ellipsis
const long = widgetLines([{ id: "crmback-1a2", repo: "crm-backend", title: "x".repeat(200) }], 40);
assert.equal(long.length, 1);
assert.equal(long[0].length, 40);
assert.ok(long[0].endsWith("\u2026"));

// more than six tasks -> tail line
const many = Array.from({ length: 9 }, (_, i) => ({ id: `p-${i}`, repo: "r", title: "t" }));
const out = widgetLines(many, 80);
assert.equal(out.length, 7);
assert.equal(out[6], "+3 \u0435\u0449\u0451");

// wide chars are cut by DISPLAY width, not by String.length
const cjk = widgetLines([{ id: "p-1", repo: "r", title: "\u6f22".repeat(60) }], 30);
assert.ok(displayWidth(cjk[0]) <= 30, `cjk width ${displayWidth(cjk[0])}`);
assert.ok(cjk[0].length < 30); // fewer code units than columns -> length-based cut would overflow
const emo = widgetLines([{ id: "p-1", repo: "r", title: "\u{1F600}".repeat(60) }], 30);
assert.ok(displayWidth(emo[0]) <= 30, `emoji width ${displayWidth(emo[0])}`);

// width <= 0 -> no garbage (no lone ellipsis)
assert.deepEqual(widgetLines([{ id: "p-1", repo: "r", title: "t" }], 0), []);
assert.deepEqual(widgetLines([{ id: "p-1", repo: "r", title: "t" }], -5), []);

// the "+N \u0435\u0449\u0451" tail respects the width too
const narrow = widgetLines(
  Array.from({ length: 99 }, (_, i) => ({ id: `p-${i}`, repo: "r", title: "t" })),
  4,
);
for (const l of narrow) assert.ok(displayWidth(l) <= 4, `line too wide: ${l}`);
assert.ok(displayWidth(narrow[narrow.length - 1]) <= 4);

console.log("widget-lines: ok");
