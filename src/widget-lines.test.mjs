import assert from "node:assert/strict";
import { widgetLines } from "./widget-lines.mjs";

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

console.log("widget-lines: ok");
