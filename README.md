# pi-beads-lean

Context-efficient bridge between [pi](https://pi.dev) and the [beads](https://github.com/steveyegge/beads) (`bd`) task tracker.

Built for **bd 1.0.3**. Lives as a local pi extension (not published).

## Why

Other beads plugins inject the **full** `bd prime` (~1065 tok) into **every** turn so the
agent never forgets the workflow. That is the opposite of saving context: a 20-turn
session pays ~21k tokens just for beads.

`pi-beads-lean` flips it:

| Lever | This extension |
|---|---|
| Prime | `bd prime --mcp` (lean, ~141 tok) injected **once per segment**, re-injected after compaction |
| Reads | `beads_ready/list/show` shell out to `bd --json` and return **digests** (~16-208 tok vs 148-569 raw) |
| Writes | pass straight through `bd` (already cheap: 3-19 tok) |

## The agent interaction

The agent talks to beads through **in-process tools** (listed below) — plain `bd` calls
under the hood, no MCP transport. beads' MCP server is deliberately not used: per beads'
own docs it adds ~10-50k tokens of tool schemas and only exists for shell-less clients
(Claude Desktop, Amp). In pi you have a shell, so the CLI path is the light one.

## Tools (LLM)

- `beads_ready` — ready (open, unblocked) issues, compact
- `beads_list` — list, optional `status` filter, compact
- `beads_show` — essential fields of one issue
- `beads_create` — create issue, returns id (use before non-trivial work)
- `beads_update` — set status / priority / title
- `beads_close` — close one or more ids
- `beads_dep` — add a dependency (blocker blocks issue)

## Commands (human, no LLM-context cost)

- `/beads` — compact board (in-progress + ready)
- `/beads-init` — `bd init` in the current project
- `/beads-mode` — show current mode + context economics

## Status bar

`beads: CLI lean ✓` · `beads: not init (/beads-init)`

## Install

Registered in `~/.pi/agent/settings.json`:

```json
{ "extensions": ["/Users/dmitriynenashev/Projects/pi-beads-lean"] }
```

Requires `bd` on PATH and a `.beads/` in the project (`/beads-init` or `bd init`).
Restart pi after enabling.
