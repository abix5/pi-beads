import assert from "node:assert/strict";
import { widgetLines, displayWidth, formatAge } from "./widget-lines.mjs";

const P = (n) => ({
  id: `p-${n}`,
  repo: "r",
  title: "t",
  priority: 2,
});

// ---------- nothing to draw ----------
assert.deepEqual(widgetLines({ entries: [] }, 80), []);
assert.deepEqual(widgetLines(undefined, 80), []);
assert.deepEqual(widgetLines({ entries: [P(1)] }, 0), []);
assert.deepEqual(widgetLines({ entries: [P(1)] }, -5), []);

// ---------- header with counters ----------
const head = widgetLines(
  {
    entries: [
      { id: "crmback-1a2", repo: "crm-backend", title: "a", priority: 1 },
      { id: "front-7x9", repo: "crm-front", title: "b", priority: 2 },
      {
        id: "chub-3k1",
        repo: "content-hub",
        title: "c",
        priority: 0,
        closed: true,
      },
    ],
    closedCount: 1,
    readyCount: 12,
  },
  120,
)[0];
assert.equal(
  head,
  "\u29BF beads \u00b7 \u0432 \u0440\u0430\u0431\u043e\u0442\u0435 2 \u00b7 \u0437\u0430\u043a\u0440\u044b\u0442\u043e 1 \u00b7 \u0433\u043e\u0442\u043e\u0432\u044b 12",
  head,
);

// ready unknown -> the segment is gone (never "готовы 0")
const noReady = widgetLines(
  { entries: [P(1)], closedCount: 0, readyCount: null },
  120,
)[0];
assert.ok(!noReady.includes("\u0433\u043e\u0442\u043e\u0432\u044b"), noReady);
assert.ok(
  !noReady.includes("\u0437\u0430\u043a\u0440\u044b\u0442\u043e"),
  noReady,
);
assert.ok(
  widgetLines({ entries: [P(1)], readyCount: 0 }, 120)[0].includes(
    "\u0433\u043e\u0442\u043e\u0432\u044b 0",
  ),
);

// ---------- tree branches, glyphs, priority and age columns ----------
const tree = widgetLines(
  {
    entries: [
      {
        id: "crmback-1a2",
        repo: "crm-backend",
        title:
          "\u041f\u043e\u0447\u0438\u043d\u0438\u0442\u044c \u044d\u043a\u0441\u043f\u043e\u0440\u0442",
        priority: 1,
        age: "14\u043c",
      },
      {
        id: "front-7x9",
        repo: "crm-front",
        title: "\u0428\u0430\u043f\u043a\u0430",
        priority: 2,
        age: "3\u0447",
      },
      {
        id: "chub-3k1",
        repo: "content-hub",
        title: "\u0418\u043c\u043f\u043e\u0440\u0442",
        priority: 0,
        closed: true,
      },
    ],
    closedCount: 1,
    readyCount: 12,
  },
  100,
);
assert.equal(tree.length, 4); // header + 3 rows
assert.ok(
  tree[1].startsWith("\u251c\u2500 \u25d0 P1 crmback-1a2  [crm-backend] "),
  tree[1],
);
assert.ok(
  tree[2].startsWith("\u251c\u2500 \u25d0 P2 front-7x9    [crm-front]   "),
  tree[2],
);
assert.ok(
  tree[3].startsWith("\u2514\u2500 \u2713 P0 chub-3k1     [content-hub] "),
  tree[3],
);
// age is right-aligned in its own column, closed row has none
assert.ok(tree[1].endsWith("14\u043c"), tree[1]);
assert.ok(tree[2].endsWith(" 3\u0447"), tree[2]);
assert.ok(!/\d[\u043c\u0447\u0434]$/.test(tree[3]), tree[3]);
for (const l of tree) assert.ok(displayWidth(l) <= 100, `too wide: ${l}`);

// ---------- truncation by DISPLAY width ----------
for (const filler of ["\u6f22", "\u{1F600}"]) {
  const cut = widgetLines(
    {
      entries: [
        {
          id: "p-1",
          repo: "r",
          title: filler.repeat(60),
          priority: 2,
          age: "9\u0447",
        },
      ],
    },
    40,
  );
  for (const l of cut)
    assert.ok(displayWidth(l) <= 40, `width ${displayWidth(l)}: ${l}`);
  assert.ok(cut[1].includes("\u2026"), cut[1]); // the title really was cut
}
// CJK: a length-based cut would have overflowed (fewer code units than columns)
assert.ok(
  widgetLines(
    {
      entries: [
        { id: "p-1", repo: "r", title: "\u6f22".repeat(60), priority: 2 },
      ],
    },
    40,
  )[1].length < 40,
);

// ---------- row cap: closed rows are pushed out first ----------
const many = {
  entries: [
    ...Array.from({ length: 5 }, (_, i) => ({
      id: `a-${i}`,
      repo: "r",
      title: "t",
      priority: 2,
    })),
    { id: "c-1", repo: "r", title: "closed one", priority: 2, closed: true },
    { id: "c-2", repo: "r", title: "closed two", priority: 2, closed: true },
    { id: "c-3", repo: "r", title: "closed three", priority: 2, closed: true },
  ],
  closedCount: 3,
};
const capped = widgetLines(many, 80);
assert.equal(capped.length, 8); // header + 6 rows + tail
assert.equal(capped[7], "+2 \u0435\u0449\u0451");
assert.ok(capped[6].includes("c-1")); // one closed survived, two evicted
assert.ok(!capped.join("\n").includes("c-2"));
// with a tail, no row uses the closing branch
assert.ok(!capped.slice(1, 7).some((l) => l.startsWith("\u2514")));
// the tail respects the width too
for (const l of widgetLines(many, 6))
  assert.ok(displayWidth(l) <= 6, `too wide: ${l}`);

// ---------- formatAge ----------
const now = Date.parse("2026-08-23T12:00:00Z");
assert.equal(formatAge("2026-08-23T11:46:00Z", now), "14\u043c");
assert.equal(formatAge("2026-08-23T09:00:00Z", now), "3\u0447");
assert.equal(formatAge("2026-08-21T12:00:00Z", now), "2\u0434");
assert.equal(formatAge(undefined, now), "");
assert.equal(formatAge("not a date", now), "");

// ---------- THE hard rule: colour never changes the visible width ----------
const ANSI = /\u001b\[[0-9;]*m/g;
const hasAnsi = (s) => /\u001b\[[0-9;]*m/.test(s); // separate, non-global: .test on /g is stateful
const theme = {
  fg: (_color, text) => `\u001b[38;5;42m${text}\u001b[39m`,
  strikethrough: (text) => `\u001b[9m${text}\u001b[29m`,
};
const state = {
  entries: [
    {
      id: "crmback-1a2",
      repo: "crm-backend",
      title: "\u{1F600}\u6f22".repeat(30),
      priority: 1,
      age: "14\u043c",
    },
    {
      id: "front-7x9",
      repo: "crm-front",
      title: "b",
      priority: 2,
      age: "3\u0447",
    },
    {
      id: "chub-3k1",
      repo: "content-hub",
      title: "c",
      priority: 0,
      closed: true,
    },
    ...Array.from({ length: 6 }, (_, i) => ({
      id: `x-${i}`,
      repo: "rr",
      title: "y",
      priority: 3,
    })),
  ],
  closedCount: 2,
  readyCount: 12,
};
for (const width of [10, 24, 37, 40, 80, 120]) {
  const plain = widgetLines(state, width);
  const painted = widgetLines(state, width, theme);
  assert.equal(painted.length, plain.length, `line count differs at ${width}`);
  for (let i = 0; i < plain.length; i++) {
    const stripped = painted[i].replace(ANSI, "");
    assert.equal(
      stripped,
      plain[i],
      `painted twin differs at width ${width}, line ${i}`,
    );
    assert.equal(
      displayWidth(stripped),
      displayWidth(plain[i]),
      `visible width differs at width ${width}, line ${i}`,
    );
    assert.ok(
      displayWidth(plain[i]) <= width,
      `line ${i} too wide at ${width}: ${plain[i]}`,
    );
  }
  assert.ok(painted.some(hasAnsi), `nothing painted at width ${width}`);
}

console.log("widget-lines: ok");
