/**
 * Pure rendering of the "in progress" widget lines.
 * Kept in plain JS (no TS) so it is directly runnable/testable by node.
 *
 * entries: [{ id, repo?, title? }, ...]  width: terminal columns
 */
export function widgetLines(entries, width, max = 6) {
 const all = Array.isArray(entries) ? entries : [];
 if (all.length === 0) return [];
 const shown = all.slice(0, max);
 const idW = Math.max(...shown.map((e) => String(e.id).length));
 const repoCell = (e) => (e.repo ? `[${e.repo}]` : "");
 const repoW = Math.max(...shown.map((e) => repoCell(e).length));
 const lines = shown.map((e) => {
  const s =
   `\u25D0 ${String(e.id).padEnd(idW)}  ${repoCell(e).padEnd(repoW)} ${e.title ?? ""}`.trimEnd();
  return s.length > width ? s.slice(0, Math.max(0, width - 1)) + "\u2026" : s;
 });
 if (all.length > shown.length)
  lines.push(`+${all.length - shown.length} \u0435\u0449\u0451`);
 return lines;
}
