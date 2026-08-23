/**
 * Pure rendering of the "in progress" widget lines.
 * Kept in plain JS (no TS) so it is directly runnable/testable by node.
 *
 * entries: [{ id, repo?, title? }, ...]  width: terminal columns
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

export function widgetLines(entries, width, max = 6) {
  const all = Array.isArray(entries) ? entries : [];
  if (all.length === 0) return [];
  const shown = all.slice(0, max);
  const idW = Math.max(...shown.map((e) => displayWidth(e.id)));
  const repoCell = (e) => (e.repo ? `[${e.repo}]` : "");
  const repoW = Math.max(...shown.map((e) => displayWidth(repoCell(e))));
  const pad = (s, n) => s + " ".repeat(Math.max(0, n - displayWidth(s)));
  const lines = shown.map((e) => {
    const s =
      `\u25D0 ${pad(String(e.id), idW)}  ${pad(repoCell(e), repoW)} ${e.title ?? ""}`.trimEnd();
    return truncToWidth(s, width);
  });
  if (all.length > shown.length)
    lines.push(
      truncToWidth(`+${all.length - shown.length} \u0435\u0449\u0451`, width),
    );
  return lines.filter((l) => l !== "");
}
