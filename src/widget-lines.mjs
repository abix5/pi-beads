/**
 * Pure rendering of the beads "in progress" widget.
 * Kept in plain JS (no TS) so it is directly runnable/testable by node.
 *
 * state: {
 *   entries: [{ id, repo?, title?, priority?, age?, closed? }, ...],
 *   closedCount?: number,          // closed this SESSION (header counter)
 *   readyCount?: number | null,    // null/undefined => segment omitted, never "0"
 * }
 * width: terminal columns
 * theme: { fg(color, text), strikethrough(text) } — pi's theme; omitted => plain text
 *
 * HARD RULE: every width computation runs on the PLAIN twin; colour is applied
 * only to fragments that have already been cut.
 */

// ponytail: minimal display-width table (no wcwidth dep — the extension has none).
// Wide: CJK + common emoji ranges. Zero: combining marks + variation selectors.
function charWidth(cp) {
  if (cp === 0x200d) return 0; // ZWJ
  if (
    (cp >= 0x0300 && cp <= 0x036f) ||
    (cp >= 0x1ab0 && cp <= 0x1aff) ||
    (cp >= 0x20d0 && cp <= 0x20ff) ||
    (cp >= 0xfe00 && cp <= 0xfe0f) ||
    (cp >= 0xfe20 && cp <= 0xfe2f)
  )
    return 0;
  if (
    (cp >= 0x1100 && cp <= 0x115f) ||
    (cp >= 0x2e80 && cp <= 0xa4cf) ||
    (cp >= 0xac00 && cp <= 0xd7a3) ||
    (cp >= 0xf900 && cp <= 0xfaff) ||
    (cp >= 0xfe30 && cp <= 0xfe6f) ||
    (cp >= 0xff00 && cp <= 0xff60) ||
    (cp >= 0xffe0 && cp <= 0xffe6) ||
    (cp >= 0x1f300 && cp <= 0x1f64f) ||
    (cp >= 0x1f900 && cp <= 0x1f9ff) ||
    (cp >= 0x20000 && cp <= 0x3fffd)
  )
    return 2;
  return 1;
}

export function displayWidth(s) {
  let w = 0;
  for (const ch of String(s)) w += charWidth(ch.codePointAt(0));
  return w;
}

/** Cut to at most `width` display columns, appending an ellipsis when cut. */
export function truncToWidth(s, width) {
  s = String(s);
  if (width <= 0) return "";
  if (displayWidth(s) <= width) return s;
  const budget = width - 1; // room for the ellipsis
  let out = "";
  let w = 0;
  for (const ch of s) {
    const cw = charWidth(ch.codePointAt(0));
    if (w + cw > budget) break;
    out += ch;
    w += cw;
  }
  return out + "\u2026";
}

/** `14m` / `3h` / `2d`; unknown or unparsable start => empty column. */
export function formatAge(startedAt, now = Date.now()) {
  const t = Date.parse(startedAt ?? "");
  if (!Number.isFinite(t)) return "";
  const min = Math.floor((now - t) / 60000);
  if (!Number.isFinite(min) || min < 0) return "";
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

const PLAIN = { fg: (_c, t) => t, strikethrough: (t) => t };

function themeOf(theme) {
  const fg =
    theme && typeof theme.fg === "function"
      ? (c, t) => theme.fg(c, t)
      : PLAIN.fg;
  const strike =
    theme && typeof theme.strikethrough === "function"
      ? (t) => theme.strikethrough(t)
      : PLAIN.strikethrough;
  return { fg, strike };
}

/**
 * Lay fragments out left to right inside `width` columns. Measuring and cutting
 * happen on `f.text` (plain); `f.paint` only ever sees an already-cut piece.
 * Returns both twins so the caller can keep doing honest arithmetic.
 */
function assemble(frags, width) {
  let used = 0;
  let plain = "";
  let out = "";
  for (const f of frags) {
    if (!f.text) continue;
    if (used >= width) break;
    const piece = truncToWidth(f.text, width - used);
    if (!piece) break;
    plain += piece;
    out += f.paint ? f.paint(piece) : piece;
    used += displayWidth(piece);
  }
  return { plain, text: out, width: used };
}

const MAX_ROWS = 6;

function prioColor(p) {
  if (p === 0) return "error";
  if (p === 1) return "warning";
  return "muted";
}

export function widgetLines(state, width, theme) {
  const { fg, strike } = themeOf(theme);
  const all = Array.isArray(state?.entries) ? state.entries : [];
  if (all.length === 0 || !(width > 0)) return [];

  // closed rows are the first thing pushed out by the row cap
  const active = all.filter((e) => !e.closed);
  const ordered = [...active, ...all.filter((e) => e.closed)];
  const shown = ordered.slice(0, MAX_ROWS);
  const hidden = ordered.length - shown.length;

  // ---- header ----
  const segs = [`${active.length} active`];
  if (state?.closedCount > 0) segs.push(`${state.closedCount} done`);
  if (Number.isFinite(state?.readyCount))
    segs.push(`${state.readyCount} ready`);
  const header = assemble(
    [
      { text: "\u29BF ", paint: (t) => fg("accent", t) },
      {
        text: "beads",
        paint: (t) => fg(active.length ? "accent" : "dim", t),
      },
      {
        text: ` \u00b7 ${segs.join(" \u00b7 ")}`,
        paint: (t) => fg("muted", t),
      },
    ],
    width,
  );

  // ---- rows ----
  const pad = (s, n) => s + " ".repeat(Math.max(0, n - displayWidth(s)));
  const idW = Math.max(...shown.map((e) => displayWidth(e.id ?? "")));
  const repoCell = (e) => (e.repo ? `[${e.repo}]` : "");
  const repoW = Math.max(...shown.map((e) => displayWidth(repoCell(e))));
  const ageW = Math.max(0, ...shown.map((e) => displayWidth(e.age ?? "")));
  const reserve = ageW > 0 && width - ageW - 1 > 10 ? ageW + 1 : 0;
  const bodyWidth = width - reserve;

  const rows = shown.map((e, i) => {
    const last = i === shown.length - 1 && hidden === 0;
    const prio = Number.isFinite(e.priority) ? `P${e.priority} ` : "";
    const body = assemble(
      [
        {
          text: last ? "\u2514\u2500 " : "\u251c\u2500 ",
          paint: (t) => fg("dim", t),
        },
        {
          text: e.closed ? "\u2713 " : "\u25d0 ",
          paint: (t) => fg(e.closed ? "success" : "warning", t),
        },
        { text: prio, paint: (t) => fg(prioColor(e.priority), t) },
        {
          text: `${pad(String(e.id ?? ""), idW)}  `,
          paint: (t) => fg("muted", t),
        },
        {
          text: repoW ? `${pad(repoCell(e), repoW)} ` : "",
          paint: (t) => fg("dim", t),
        },
        {
          text: String(e.title ?? ""),
          paint: (t) => (e.closed ? strike(fg("muted", t)) : fg("text", t)),
        },
      ],
      bodyWidth,
    );
    const age = String(e.age ?? "");
    if (!reserve || !age) return body.text.trimEnd() === "" ? "" : body.text;
    const gap = bodyWidth - body.width + 1 + (ageW - displayWidth(age));
    return body.text + " ".repeat(Math.max(1, gap)) + fg("dim", age);
  });

  const lines = [header.text, ...rows].filter((l) => l !== "");
  if (hidden > 0)
    lines.push(fg("dim", truncToWidth(`+${hidden} more`, width)));
  return lines;
}
