/**
 * Prints REAL widget lines for the README screenshots (plain node, no bun).
 *   node scripts/widget-shots.mjs <shot>   one shot, ANSI-coloured, for vhs
 *   node scripts/widget-shots.mjs --list   all shot names
 *
 * Every line comes out of src/widget-lines.mjs driven exactly like the
 * extension drives it in src/index.ts: widgetLines(state, width - 1, theme)
 * with one leading space. Nothing is hand-drawn, so `make shots` keeps the
 * pictures in README.md from drifting away from the code.
 */

import { widgetLines, formatAge } from "../src/widget-lines.mjs";

// ANSI stand-ins for the theme roles pi's default theme resolves.
const SGR = {
  accent: "\x1b[36m",
  warning: "\x1b[33m",
  error: "\x1b[31m",
  muted: "\x1b[37m",
  dim: "\x1b[90m",
  success: "\x1b[32m",
  text: "\x1b[97m",
};
const theme = {
  fg: (c, s) => `${SGR[c] ?? ""}${s}\x1b[39m`,
  strikethrough: (s) => `\x1b[9m${s}\x1b[29m`,
};

const MIN = 60000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;
/** Age column, produced by the shipped formatter — never a typed literal. */
const ago = (ms) => formatAge(new Date(Date.now() - ms).toISOString());

const render = (state, width) =>
  widgetLines(state, width - 1, theme).map((l) => ` ${l}`);

const shots = {
  /** A typical umbrella session: three in progress, one just closed. */
  widget: () =>
    render(
      {
        entries: [
          {
            id: "crmback-1a2",
            repo: "crm-backend",
            title: "Fix invoice PDF export",
            priority: 0,
            age: ago(14 * MIN),
          },
          {
            id: "crmfront-9c4",
            repo: "crm-frontend",
            title: "Booking form: validate phone number",
            priority: 1,
            age: ago(3 * HOUR),
          },
          {
            id: "cicd-4f7",
            repo: "cicd",
            title: "Harden runner privileges",
            priority: 2,
            age: ago(2 * DAY),
          },
          {
            id: "crmback-7b1",
            repo: "crm-backend",
            title: "Rebuild the invoice index migration",
            priority: 2,
            closed: true,
            age: ago(5 * HOUR),
          },
        ],
        closedCount: 2,
        readyCount: 11,
      },
      80,
    ),

  /** Every state and colour the widget can draw, in one frame. */
  "widget-legend": () =>
    render(
      {
        entries: [
          {
            id: "crmback-1a2",
            repo: "crm-backend",
            title: "P0 red: payment webhook is not idempotent",
            priority: 0,
            age: ago(9 * MIN),
          },
          {
            id: "crmfront-9c4",
            repo: "crm-frontend",
            title: "P1 yellow: booking form validation",
            priority: 1,
            age: ago(4 * HOUR),
          },
          {
            id: "cicd-4f7",
            repo: "cicd",
            title: "P2 muted: cache the build layer",
            priority: 2,
            age: ago(2 * DAY),
          },
          {
            id: "crmback-7b1",
            repo: "crm-backend",
            title: "closed: struck through, one turn left to live",
            priority: 2,
            closed: true,
            age: ago(5 * HOUR),
          },
        ],
        closedCount: 3,
        readyCount: 11,
      },
      80,
    ),

  /** A narrow pane: titles are cut and the row cap collapses the tail. */
  "widget-narrow": () =>
    render(
      {
        entries: [
          {
            id: "crmback-1a2",
            title: "Fix invoice PDF export",
            priority: 0,
            age: ago(14 * MIN),
          },
          {
            id: "crmback-2d8",
            title: "Retry failed payment webhooks",
            priority: 1,
            age: ago(52 * MIN),
          },
          {
            id: "crmback-3e5",
            title: "Rate-limit the public search endpoint",
            priority: 1,
            age: ago(3 * HOUR),
          },
          {
            id: "crmback-4f7",
            title: "Harden runner privileges",
            priority: 2,
            age: ago(6 * HOUR),
          },
          {
            id: "crmback-5a9",
            title: "Drop the legacy report table",
            priority: 2,
            age: ago(2 * DAY),
          },
          {
            id: "crmback-6b3",
            title: "Document the export contract",
            priority: 2,
            age: ago(3 * DAY),
          },
          {
            id: "crmback-7b1",
            title: "Rebuild the invoice index migration",
            priority: 2,
            closed: true,
            age: ago(5 * HOUR),
          },
        ],
        closedCount: 1,
        readyCount: 11,
      },
      52,
    ),
};

const name = process.argv[2] ?? "";
if (name === "--list") {
  console.log(Object.keys(shots).join("\n"));
  process.exit(0);
}
const shot = shots[name];
if (!shot) {
  console.error(`unknown shot "${name}"; try --list`);
  process.exit(1);
}
console.log(shot().join("\n"));
