---
name: beads
description: Operating manual for working with beads (bd) tasks in a multi-repo umbrella workspace — how to read across repos, create in the owning repo, and update/close/link via the in-process beads_* tools (pi-beads-lean). Use whenever finding, creating, updating, closing, linking, or triaging beads issues/epics/tasks in this workspace.
---

# Beads — Operating Manual (multi-repo umbrella)

Tasks are tracked in **beads** (`bd`), exposed to you as compact in-process tools prefixed
`beads_` (from the **pi-beads-lean** extension). There is **no MCP** for beads — call the
tools directly: `beads_ready({…})`, `beads_create({…})`, etc.

## The model — read this first

Some workspaces use beads as a **multi-repo umbrella**:

- one umbrella/root holds an **aggregate** beads DB — the unified **READ** view;
- each repo keeps its **own** beads DB as the source of truth for writes and sync.

If the current workspace is in that mode, the `beads_*` tools already know how to:
- read from the aggregate view,
- route writes to the owning repo,
- refresh the aggregate after writes.

⚠️ **Never try to merge, move, renumber, or "reorganize tasks by files" across repos.** The
split is intentional. Mixing repos breaks per-project ownership and sync.

An issue's **id prefix tells you the owning project/repo**. Use `/beads-mode` to inspect the
live umbrella path, prefix routes, and current default-create repo for this session.

## The tools

### Read — always span ALL repos (from the aggregate by default)
| tool | use |
|---|---|
| `beads_ready({ limit?, repo?, label?, labelAny? })` | ready issues (open + unblocked). Optional `repo` narrows to one project; `label` / `labelAny` filter by labels |
| `beads_list({ status?, limit?, repo?, label?, labelAny? })` | list issues across every repo; `status` = `open,in_progress,blocked,deferred,closed`; optional project/label filters |
| `beads_show({ id })` | full details of one issue: status, **blocker ids** (`blocked_by:` + `BLOCKED` marker), and for epics **children + progress** (`children: done/total`) |
| `beads_deps({ ids, direction? })` | dependency view: ONE id → the blocker/dependent **tree**; SEVERAL ids → one compact line each. `direction` = `blockers` (default) or `dependents` |

Reads are already cross-repo — **do not** shell out to raw `bd list`, `bd dep tree`, `bd show | grep blocked_by`, or inspect `.beads/issues.jsonl` / umbrella JSON files directly for task state. `beads_show` already carries blocker ids and epic progress; `beads_deps` gives the tree and batch blocker triage. Use the id prefix to know which project a result belongs to.

### Write — routed to the OWNING repo, then the aggregate refreshes itself
| tool | use |
|---|---|
| `beads_create({ title, repo?, type?, priority?, description?, parent?, labels?, notes?, design? })` | create in the owning repo; `parent` must be in the same repo |
| `beads_update({ id, status?, priority?, title?, parent?, notes?, appendNotes?, addLabels?, removeLabels? })` | update one issue; auto-routed by id prefix |
| `beads_close({ ids, reason? })` | close one or many (ids space/comma separated) |
| `beads_dep({ issue, blocker })` | `blocker` must be done before `issue` |
| `beads_undep({ issue, blocker })` | remove a dependency |
| `beads_comment({ id, text })` | add a progress note / comment |

## Rules that matter

1. **Creating — pick the right project.**
   - Pass **`repo`** = repo folder name **or** id prefix (e.g. `repo:"crm-backend"` or
     `repo:"crmback"`).
   - If you omit `repo`, it defaults to the repo of the **session cwd**. From the **umbrella
     root** there is no default → `repo` is **required** (the tool will tell you the choices).
   - **Never create into the aggregate** (`prod-`). Tasks must live in a real repo.
   - Create **before** starting non-trivial work; pick `type` (`task|bug|feature|chore|epic|
     decision|spike|story`) and `priority` (0 highest … 4).

2. **Updating / closing — just pass the id.** Routing to the owning repo is automatic from the
   id prefix. `beads_close` accepts ids from **different repos** at once. Close issues when the
   work is done, before reporting completion.

3. **Dependencies are within ONE repo.** beads cannot link issues across repos. If work in repo
   A must precede work in repo B, write that ordering in the **description**, don't use
   `beads_dep`. Epics use parent/child within their own repo.

4. **Epics & hierarchy.** Epics are `type:"epic"`; children are created in the **same repo** and
   linked under the epic. Keep an epic and its tasks in one repo.

## Typical flows

**Triage / pick work**
```
beads_ready({ limit: 15, label: "onboarding" })
beads_list({ repo: "main-orchestrator", status: "open,in_progress" })
beads_show({ id: "crmback-8qpl" })
beads_deps({ ids: "argocd-97g apps-cwq orch-9ll cab-8rx" })
beads_update({ id: "crmback-8qpl.2", status: "in_progress" })
```

**Capture new work in the right project / epic**
```
beads_create({
  repo: "main-orchestrator",
  parent: "orch-9ll",
  title: "Add provisioning retry guard",
  type: "task",
  priority: 1,
  labels: "onboarding,epic::F",
  description: "Retry only failed external calls, not the whole flow",
  notes: "Keep retries idempotent"
})
```

**Link / unlink / annotate**
```
beads_dep({ issue: "orch-9ll", blocker: "orch-gct" })
beads_undep({ issue: "orch-9ll", blocker: "orch-gct" })
beads_comment({ id: "orch-9ll", text: "Blocked pending vault-writer contract review" })
beads_update({ id: "orch-9ll", appendNotes: "Need retry semantics agreed before coding" })
```

**Finish**
```
beads_close({ ids: "apps-xyz lguard-09d818c2", reason: "done" })
```

## Slash commands (operator, no context cost)
- `/beads` — compact board (in-progress + ready) across all repos
- `/beads-sync` — re-hydrate the aggregate from every repo now
- `/beads-mode` — show umbrella path, prefix routes, default-create repo
- `/beads-init` — `bd init` in the current folder (for a brand-new repo)

## Deeper / maintenance
Use `/beads-mode` for the live routing view. For repo-specific administration (sync, backups,
adding a repo, local conventions), consult the workspace's own documentation such as `BEADS.md`
if present. Use this skill for day-to-day task work via the `beads_*` tools.
