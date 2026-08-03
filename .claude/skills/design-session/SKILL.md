---
name: design-session
description: Use when running a Claude Code session that designs or plans rather than implements — authoring a plan doc, running the design-governance checklist, moving a Linear issue toward Ready for Dev, or writing a handoff for the executor lane. The CC replacement for the Cowork design role. For efforts too big for one session, see the scale gate — suggest a wayfinder map (THR-900).
last_validated_against: 2026-08-03
---

# design-session

## Purpose

Run the **design/planning half** of Threadbare's workflow as a Claude Code session type. A design session
produces a compliant plan doc and hands it to the executor lane — it does **not** implement the feature.
This is the CC replacement for the retiring Cowork design role (Pure Claude Code Migration, THR-648–655).

Invoke via the Skill tool: `/design-session` (or when a request is "design X", "plan X", "write a spec for X").

## Two session types, one queue

| Session type | Skill | Does | Linear states it owns |
|---|---|---|---|
| **Design session** | `design-session` (this) | design, research, plan-doc authoring, handoff | Idea → Todo → In Design → Implementation Planning → Ready for Dev |
| **Executor session** | `pull-work` / `tb-opus-pickup` | implement, test, commit, merge | In Dev → Done (via merge keyword) |

**A design session never writes `src/`.** If a design session finds itself editing engine/content/UI code,
it has crossed into execution — stop, finish the plan doc, hand off, and let the executor pick it up. The
role boundary is a session-type discipline, not a runtime one (both are CC now).

## When to use / when NOT to use

**Use when:** the task is to *decide what to build and how* — a new feature, system, or content pipeline that
needs a plan doc before code; grooming an issue from Idea/Todo into Ready for Dev; writing a handoff.

**Do NOT use when:** the task is to *build* something already planned (use `pull-work`); a trivial one-file
fix with no design surface (just do it in an executor session); pure content authoring against an existing
pipeline (use the content/prose/encounter skills directly).

**Scale gate — too big for one session? Suggest a wayfinder map (THR-900).** If, during Step 0/1, the effort
turns out to be **more than one design session can hold and still foggy** — it would need several plan docs,
or the grill-me pass keeps surfacing open decisions faster than it closes them, or it spans multiple connected
game systems whose interactions are undecided — stop drafting and recommend charting a **wayfinder map**
(`wayfinder` skill): *"This looks bigger than one session — want me to chart it as a wayfinder map instead of
forcing one plan doc?"* Christian decides; **never auto-chart**. A cleared map later feeds one design-session
per plan doc, each citing the map's decisions as settled input.

**Resolving a wayfinder ticket is NOT a full design session.** When the session's task is one decision ticket
off a map, follow the `wayfinder` skill's work-the-map flow (claim → resolve → resolution comment → close →
update map) — no plan doc, no intent-judge, no handoff. The plan-doc machinery fires later, when the cleared
map hands off.

## The one thing that changed from Cowork

Cowork could not commit, so plan docs rode the `plan-pending-commit` label + hourly `flush-plan-docs` pipeline.
**A CC design session commits its own plan doc directly** via a `docs/plan-*` PR (CI-gated, merged immediately).

- **No `plan-pending-commit` label. No hourly flush. No auto-flush fallback.**
- The legacy label+flush path no longer exists — it was deleted 2026-07-21 (THR-654) along with the Cowork
  lane it served. Commit directly; there is nothing else to fall back to.

Everything else — design-governance checklist, canon Step 0, intent-judge, design-audit-pipeline, the
three-pillar rule, handoff coordination block, Linear state transitions — is unchanged.

## Two lifecycle stages: exploratory vs committed (THR-918)

A design artifact has two stages. **Promotion between them is a deliberate act, not a default.**

| | **Exploratory** | **Committed** |
|---|---|---|
| Lives in | Obsidian vault — `Brainstorms/YYYY-MM-DD-<topic>.md` | `Docs/plans/YYYY-MM-DD-<topic>.md` |
| Written via | filesystem, `OBSIDIAN_VAULT_PATH` | `docs/plan-*` PR (Step 4 below) |
| Ceremony | none — no git, no PR, no CI, no lint | full: CI-gated PR, `lint:plan-doc`, governance gates |
| Rewrite cost | free; rewrite it five times a day | a PR per revision |
| Governance | **does not apply** (see below) | applies in full — unchanged |
| Linear line | `**Draft:** \`Brainstorms/….md\`` | `**Plan doc:** \`Docs/plans/….md\`` |

**The promotion trigger is exactly one event: the issue is about to move toward Ready for Dev.** That is the
moment the artifact stops being thinking and becomes a contract an executor will act on. Nothing else promotes —
not length, not confidence, not how many sessions have touched it. A concept that is rewritten for a week and
never reaches an executor correctly never enters the repo at all.

**Start exploratory by default when the work is genuinely open** — brainstorming, concept churn, rapid
prototyping, "what if we". Start committed when you already know this is going to hand off this session (a
groomed ticket with a settled shape). When in doubt, start in the vault; promoting is cheap, un-committing is not.

**Why the vault:** it already exists for exactly this, carries none of the ceremony, and canon pages already
cite it as a source — `Docs/canon/cosmology.md` cites `Brainstorms/brainstorm-cosmological-symmetry.md` as its
canonical iteration record. Use the **existing** `Brainstorms/` folder; do not create a parallel `Drafts/`.
Use the dated `YYYY-MM-DD-<topic>.md` form (the folder holds an older undated `brainstorm-<topic>.md` set —
match the dated one, which lines up with `Docs/plans/`). Hand-curated frontmatter convention (`tags`, `status:
stub | draft | complete`, `created`, `updated`) is in `Docs/documentation-ownership.md`.

### What promotion actually does

Promotion is not a file move. The vault draft is the **source**; the committed pair is the **product**:

1. Write `Docs/plans/YYYY-MM-DD-<topic>.md` from the draft — the plan doc proper, all three pillars.
2. Write its **Brainstorm companion** (`…-brainstorm.md`) — the considered alternatives, tensions, and Vision
   premises the draft accumulated. This is where exploratory thinking becomes durable, and it is why the
   companion requirement in `Docs/canon/design-governance.md` is unaffected by this rule.
3. Run the governance gates (Step 1), then Step 3's intent-judge and design-audit, then commit (Step 4).
4. Leave the vault draft in place and set its frontmatter `status: complete`. It is the iteration record —
   canon pages cite drafts this way already. Do not delete it.

**The committed side does not get cheaper.** This rule removes ceremony from *thinking*, not rigor from
*handoff artifacts*. If a change makes committed plan docs easier to produce, it has drifted from the intent.

### The four questions this settles

1. **Where in the vault?** `Brainstorms/` — existing folder, existing convention, already cited by canon. Not a new `Drafts/`.
2. **Discoverability.** A vault draft is invisible to `Docs/plans/INDEX.md` and to `lint:plan-doc`, **and nothing
   breaks** — verified: `lint:plan-doc` only lints staged files under `Docs/plans/`, `rebuild-plans-index` globs
   that same directory, and `check:process` invokes `lint:plan-doc --staged`. None of the three requires a
   `Plan doc:` line to resolve. An exploratory issue therefore carries a **`Draft:`** line naming the vault path,
   and `Plan doc:` stays reserved for the committed doc — which keeps a promotion-time plan-doc-liveness gate
   (THR-921) valid, since `Plan doc:` never names a vault path.
3. **Does governance apply to exploratory drafts?** **No.** Confirmed against `Docs/canon/design-governance.md`
   rather than assumed: every gate there binds an artifact the executor acts on — intent-judge scores the plan
   doc, design-audit writes verdicts into the plan-doc tail, `lint:plan-doc` lints `Docs/plans/`, the three-pillar
   rule gates the handoff. None of them can even run against a vault draft. Governance attaches **at promotion**,
   in full, unchanged.
4. **Loss risk — stated explicitly so nobody is surprised.** The vault is **not** git-backed. An exploratory
   draft has no history, no diff, no recovery if overwritten or deleted. That is the accepted price of zero
   ceremony, and it is one more reason promotion is the durability boundary: if losing it would hurt, promote it.

## Workflow

### Step 0 — Session start

1. **Read the freshness signal** (`node --experimental-strip-types scripts/session-precheck.ts`). If the tree
   is behind/stale, surface it and resolve before designing (per CLAUDE.md Session Workflow).
2. **Claim the issue** if working an existing one: `save_issue(id, assignee:"me", state:"In Design")`, then
   `get_issue(id)` to verify the write stuck (impediment #48). New idea with no issue yet → create it under a
   project first (every issue belongs to a project; ask the user if none fits).
3. **Load always-on context:** `Docs/ubiquitous-language/README.md`, `Docs/canon/rulebook-quick-reference.md`.
4. **Canon Step 0 (authoring/content tasks):** load `Docs/canon/<domain>.md` **before any other reference
   material** — `encounters.md`, `cosmology.md`, `prose.md`, `hex-map.md`, `rulebook.md` as the task dictates.
   For design work, also load the `state-of-game-design` router and `game-design-direction` (player-facing).
5. **Pick the lifecycle stage** (see § Two lifecycle stages). Genuinely open work starts **exploratory** in the
   vault — skip Steps 1–4 entirely until it promotes, and put a `**Draft:** \`Brainstorms/….md\`` line on the
   issue. Work that will hand off this session starts **committed** and runs the full flow below.

### Step 1 — Design-governance checklist (single internal pass)

Follow the design-governance checklist in **`Docs/canon/design-governance.md`** (authoritative since THR-760;
CLAUDE.md § Design Governance is now a pointer) — do not re-derive it here; this is
the spine:

- **Step 0 grill-me** (if scope is large / multi-pillar / ambiguous) — `grill-me`, synthesis to the vault at
  `Brainstorms/YYYY-MM-DD-<topic>-grill-me.md`. Exploratory artifact, never promoted as its own committed
  file — see § Two lifecycle stages and `Docs/canon/design-governance.md` Step 0 (authoritative).
- **Step 0.5 Codesight pre-flight** (if the change touches `src/`) — blast radius + dependency chain. Any file
  with **≥100 importers** (see CLAUDE.md high-impact list) forces a **Blast Radius** section up front.
- **Step 0.7 Interface impact check** (any subsystem in `Docs/canon/interface-map.md`, audited **or** ⚪ UNAUDITED)
  — enumerate the cross-system contracts the plan touches and carry an `## Interface impact` table
  (preserve / extend / add / retire). UNAUDITED means audit-on-touch, never an exemption. A plan adding a
  cross-system write must name its production read site or cite a `Deferral` issue. `lint:plan-doc` nags.
- **Draft** the plan doc — all three pillars — plus its **Brainstorm companion** in the same pass.
- **Audit** against the 7 NFPs, load-bearing decisions, and rejected approaches; **Revise** inline.
- **Summarize** with an NFP-compliance table; **three-pillar check** (Engine / Content / UI / Wiring).
- **Vision audit** and **Rulebook impact** — if the plan changes a Vision premise or a rule of play, the edit
  is part of *this* ticket's scope, not a follow-up.

**Never present a non-compliant design.** Steps happen internally before the user or the executor sees the plan.

### Step 2 — Plan doc

Copy `Docs/plans/_template.md`; name it `Docs/plans/YYYY-MM-DD-<topic>.md`. Required inline sections (not an
appendix), per `Docs/canon/design-governance.md` § Per-system required sections:

| Section | Content |
|---|---|
| Engine pillar | systems, graph nodes/edges, tick phases, resolution, PRNG callouts |
| Content pillar | encounter templates, prose tables, attachment content, data tables |
| UI pillar | player-facing display, notifications, DebugPanel, HexMapV2 signifiers — **name the browser-verify tool** (Playwright DOM / Claude-in-Chrome WebGL) |
| Wiring | per module: orchestrator phase, UI component, GameState flow, traces, debug visibility, prose pipeline, player controls |
| Constants table | every tunable number named — default + purpose (NFP #1) |
| Tracing | trace types + TS interface definitions (NFP #2) |
| Fail-soft table | failure cases → fallback behavior (NFP #4) |
| Blast Radius | only when a ≥100-importer file is touched |

A pillar that is genuinely N/A must say so **with rationale** — silence reads as "forgotten", which the
executor rightly defers.

### Step 3 — Gates (before handoff)

1. **Intent-judge (Step 8.5).** Author an action proposal at `Docs/plans/.intent-proposals/<slug>.md`
   (template: `.claude/skills/intent-judge/proposal-template.md`), then spawn `intent-judge` as a Task
   subagent (`model:"fable"`). Verdict gates: Allow → proceed; Revise → fix + re-run; Block → rewrite;
   Escalate → surface the verbatim finding to the user. Record the verdict in the plan-doc tail.
2. **Design-audit-pipeline (Step 8.6).** Spawn the three forked auditors (NFP / three-pillar / Vision) in one
   message via `/design-audit <plan-doc-path>`. Write their ≤300-word verdicts into the plan-doc tail under
   `## Forked-audit verdicts`. Any FAIL/REVISE → surface to the user before transitioning state. (Skip with an
   explicit written rationale only when all three axes are N/A — e.g. a pure process change.)

### Step 4 — Commit the plan doc (direct PR — the key difference)

Commit the plan doc (and its brainstorm companion, and the intent-proposal) yourself. **Do not
apply `plan-pending-commit`. Do not wait for the flush task.**

**The grill-me synthesis is not in that list (THR-944).** It stays in the vault as an exploratory artifact;
its conclusions ride the plan doc's argument instead. **The intent-proposal is** — it is authored at Step 3
below, *after* the plan doc exists and as the input to a gate that runs on the committed artifact, so it is
committed-stage by construction, not by exception.

```bash
git checkout -b docs/plan-<basename>          # ID-free, e.g. docs/plan-2026-07-18-some-topic
git add Docs/plans/<file>.md Docs/plans/<file>-brainstorm.md   # exact paths, never '.'
git commit -m "docs(plan): <basename>"        # NO issue id in the subject (THR-510)
git push -u origin docs/plan-<basename>
gh pr create --title "docs(plan): <basename>" --body "<one-line: what this plan designs>"
```

**Scrub every closeable reference (THR-510).** The commit subject, branch name, PR title, and PR body MUST NOT
contain `Fixes`/`Closes`/`Resolves`, a bare `THR-XXX` token, or a `linear.app/.../issue/THR-XXX` URL —
committing a plan doc never resolves its issue, and any of those makes GitHub→Linear sweep the issue to Done.
The issue↔PR link lives only in the Linear handoff comment (Step 5). Wait for the required
`Test · Typecheck · Build` check to go green, then merge. A plan doc is docs-only — browser-verify exempt.

### Step 5 — Handoff (Linear)

Only after the plan doc is merged to `main`:

1. Verify the Implementation-Planning → Ready-for-Dev exit criteria (coordination protocol § Exit Criteria):
   every pillar has numbered action items or an explicit N/A.
2. Put the plan-doc path in the issue **description** too: `**Plan doc:** \`Docs/plans/YYYY-MM-DD-topic.md\``.
3. Move the issue: In Design → Implementation Planning → Ready for Dev. Verify each write stuck (`get_issue`).
4. Post the handoff comment (coordination protocol § handoff template). **Every section present**; the
   coordination block is mandatory:

```
## Handoff: [Issue title]

**Plan doc:** `Docs/plans/YYYY-MM-DD-topic.md`  (merged: <PR url or sha>)

### Engine action items
1. …
### Content action items
1. …  (or: N/A — [rationale])
### UI action items
1. …  (or: N/A — [rationale])
### Wiring action items
1. …
### Files changed by the design session
- …
### Grey zones / executor decisions needed
- …

### Claude Code coordination
**Suggested model:** sonnet | haiku | opus — one-line rationale (advisory; the automation runs Opus regardless).
**Parallel-safe with:** THR-XX, THR-YY (file-surface disjoint) — or "none".
**Mutex with:** free-text of the files/surfaces this issue will collide on.
```

**The state transition plus the handoff comment IS the handoff** — no out-of-band notification. The executor
(`tb-opus-pickup`) polls Ready for Dev hourly and pulls the top item.

## Hard rules

- **A design session never writes `src/`.** Design and plan only; hand off to the executor. (Session-type role
  boundary — coordination protocol § Role Boundaries.)
- **Promotion happens when the issue moves toward Ready for Dev — and only then** (THR-918). An exploratory
  draft never enters `Docs/plans/` on length or confidence alone, and a committed plan doc is never demoted to
  the vault to dodge a gate. Governance applies in full from the moment of promotion.
- **Commit plan docs directly via a `docs/plan-*` PR.** Never apply `plan-pending-commit`; never route a CC
  design session through the flush pipeline.
- **Never emit a closeable issue reference on the plan-doc PR** — no `Fixes/Closes/Resolves`, no bare
  `THR-XXX`, no linear-issue URL, in the commit / branch / PR title / PR body (THR-510). The link is the Linear
  handoff comment.
- **Never `save_issue(state:"Done")`.** Design sessions hand off to Ready for Dev; Done is merge-gated and
  belongs to the executor lane (Rule 3).
- **Verify every state/label write** with `get_issue` (Rule 7 / impediment #48).
- **No incomplete handoff.** Every pillar has action items or an explicit N/A rationale; the coordination block
  is present. An incomplete plan produces deferrals — the whole point of the gate is to prevent that.

## Common mistakes

| Mistake | Fix |
|---|---|
| Opened a `docs/plan-*` PR for a half-formed concept | Start it exploratory in `Brainstorms/`; promote when it heads for Ready for Dev (THR-918). |
| Put a vault path on the issue's `Plan doc:` line | Exploratory drafts use a `Draft:` line; `Plan doc:` names a committed doc on `main`. |
| Deleted the vault draft after promoting it | Leave it, set `status: complete` — it is the iteration record canon pages cite. |
| Started implementing the feature in the same session | Stop at the plan doc + handoff; the executor implements. |
| Applied `plan-pending-commit` out of habit | CC commits directly — no label, no flush. |
| Put `Fixes THR-XX` on the plan-doc PR | Scrub it — that closes the issue before any code exists (THR-510). |
| Moved the issue to Ready for Dev before the plan doc merged | Merge the `docs/plan-*` PR first; the executor needs the doc on `main`. |
| Handoff comment missing the coordination block | Add Suggested model / Parallel-safe with / Mutex with — it's mandatory. |
| Skipped intent-judge / design-audit "to save time" | They gate the handoff; a Block/FAIL surfaced late costs an executor cycle. |
