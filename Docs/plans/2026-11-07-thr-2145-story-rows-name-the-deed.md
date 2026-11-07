> **title:** Story rows name the deed, not its key — THR-2145
> **linear_issue:** THR-2145
> **author:** Claude Code (tb-design-lane, run dl-20261107T0819Z)
> **created:** 2026-11-07
> **three_pillars:** Engine done · Content N/A — reuses the cells' existing card phrases and adds three fallback words, no new prose table · UI done (no component change; the sheet's Story list reads the fixed node)

# Story rows name the deed, not its key — THR-2145

*A mortal's sheet must never show the engine's own name for something that happened to them.*

## Why this is load-bearing

On a seeded medium world, about 200 ticks in, the First's sheet → Story group lists a row reading
`cell.destroy.power (afflicted)` (found while verifying THR-2139, screenshot
`Docs/evidence/thr-2139/thr-2139-sheet-story-1920.jpg`). That breaks UI Law 14 — *"No raw internal keys,
ever"* (`Docs/design-system/laws.md` line 49). The Story list is the sheet's record of a mortal's life,
so the raw key lands on the exact surface where the player reads what the world did to someone.

It is a bug, so it is agreed (ways-of-working D2). The orchestrator staged it 2026-11-07 07:31Z.

## Substrate inventory

| Existing subsystem | Status | This plan |
|---|---|---|
| Undertaking outcome event nodes (`src/engine/grievance/undertakingOutcomeNode.ts`, THR-1298) | 🟢 ACTIVE | **extends** — the minter writes a player name and `templateName` |
| Connections view, Story group (`src/engine/views/connections.ts` `refFor`) | 🟢 ACTIVE | unchanged — already reads `templateName ?? name` |
| Strategic template registry (`getStrategicTemplate`, `src/engine/strategicActionCandidates.ts:93`) | 🟢 ACTIVE | read only — `displayName` is the cell's card phrase |
| Unified action templates (`getUnifiedTemplateById`, `src/data/unified-action-templates.ts:6848`) | 🟢 ACTIVE | read only — names a fight's template |

### Measured — where the key comes from

There are twelve `type: 'event'` minters in `src/engine/` (grep `type: 'event'`, tests excluded). Eleven
name their node in words (`Battle at <place>`, `Prayer at <town>`, `Bounty on <name>`, the encounter
minter's `${template.name} (${stepLabel})` with `templateName` set). **One** builds the name from a raw id
and sets no `templateName`:

```
src/engine/grievance/undertakingOutcomeNode.ts:231:      name: `${project.templateId} (${harmClass})`,
```

It has three callers, so three kinds of `templateId` reach it:

| Caller | `templateId` reaching the minter | Example |
|---|---|---|
| `strategicActionLifecycle.ts:1004`, `:1156` (an undertaking's harm) | a cell or authored strategic template id | `cell.destroy.power`, `strategic_the_plot` |
| `fights/fightEnding.ts:277` (a fight death) | the fight action's unified template id | `fight.lair.confront` |
| `battleAftermath.ts:838` (a commander slain) | the literal `'battle'` | `battle` |

Probe (vite-node, home tree, `getStrategicTemplate(id)?.displayName`):

```
cell.destroy.power => Destroy a power
cell.destroy.location => Destroy a location
cell.control_seize.faction => Usurp a leader
battle => undefined
```

`getUnifiedTemplateById('fight.lair.confront')?.name` → `"The Beast in Its Den"`. So a player phrase
exists for every undertaking, the fight template has a `name`, and `battle` has none.

### Measured — who reads the name

`properties.templateName` is already read by `connections.ts` (Story rows), `detailPageResolvers.ts`,
`subjectPage.ts` and `hexRegion.ts`. Nothing parses the `name` string of an undertaking outcome node: the
grievance mint, the omen agenda and the motive receipt key on the `evt_und_` id prefix
(`isUndertakingOutcomeEventId`) and on `templateId` / `harmClass` / `verb` properties. One test fixture
spells a name (`momentCardModel.test.ts:161`, `'raid (severed)'`) and asserts nothing about it. The game
has no save files (grep `saveGame|loadGame|serializeWorld` → none), so no old nodes outlive a session.

## Decision

**Fix it at the minter.** `createUndertakingOutcomeNode` resolves a player name once and writes it as both
`name` and a new `templateName` property. Every reader that prefers `templateName` (four, above) is fixed
by the same write, which is why the minter beats a `refFor` fallback. Rejected: a key-shape guard in
`refFor` — it would fix the Story row only, leave the record page and hex region on the raw key, and
hide the next minter that makes the same mistake. The test below catches that minter instead.

The name a row reads is the **card phrase of the work** — the same words the player saw when the work
was offered ("Destroy a power", "Usurp a leader"), matching how encounter rows already read their
template's name ("Copy the Scriptures"). The harm class stays in properties; it is not shown.

## Engine pillar

### Systems design

In `src/engine/grievance/undertakingOutcomeNode.ts`, add one pure function and use it in the minter:

```ts
/** The player-facing name of an outcome's work (Law 14). Never returns an id. */
export function outcomeDeedName(templateId: string, sourceKind?: 'fight' | 'battle'): string
```

Lookup order, first hit wins:

1. `getStrategicTemplate(templateId)?.displayName` — every cell and authored undertaking.
2. `getUnifiedTemplateById(templateId)?.name` — a fight's template.
3. `OUTCOME_DEED_FALLBACK_NAMES[sourceKind ?? 'undertaking']` — the constant below; it covers `battle`
   and any id neither registry knows. Hitting this step for an `undertaking` source emits a
   `console.warn` once per `templateId` (Law 14: *"warns once, never as the key"*). The "once" is a
   module-level `Set<string>` of warned ids that gates **logging only** — it holds no world data and no
   reader consults it, so it is not an engine cache under the per-session-cache rule (the
   `[UndertakingOutcomeNode]` warns already in this file are module-level the same way). Steps 1 and 2
   log nothing; the step that produced a name is visible by comparing `templateName` to the registries.

The `graph.addNode` call becomes `name: deedName` and gains `templateName: deedName` in `properties`.
Nothing else in the node changes: id, `templateId`, `harmClass`, `verb`, edges all stay as they are.

### Graph nodes / edges

No new node type or edge. One additive property on existing `event` nodes with
`eventType: 'undertaking_outcome'`: `templateName: string`.

### Tick phases / resolution / PRNG

Unchanged. The minter runs where it runs now (undertaking terminal, fight ending, battle aftermath). No
random calls.

## Content pillar

Content: N/A — the names come from the cells' existing `displayName` (`UNDERTAKING_CELL_PHRASES` and the
generic `<Verb> <a kind>`) and from fight templates' existing `name`. The only new words are the three
fallback names in the constants table, which are labels, not prose.

## UI pillar

No component changes. The fix is upstream of `refFor`, so the sheet's Story group, the event's record
page and the hex region's history all read the new name with no edit.

*Screenshot tool:* Playwright (DOM surface) or the Claude in-app browser — the sheet is DOM, not WebGL.

**UI Laws engaged:** Law 14 (no raw keys — the fix itself), Law 13 (no new number appears), Law 1/17/21/33/37
unaffected (no layout, chip or interaction change).

### Player-facing text

| Surface | Exact text the player reads | Complaint class touched | How the player understands it |
|---|---|---|---|
| Sheet → Story row (undertaking harm) | "Destroy a power" (was `cell.destroy.power (afflicted)`) | PC-3 | the name of the work that touched this mortal, in the same words its card uses wherever it is offered |
| Sheet → Story row (cell seized) | "Usurp a leader" | PC-3 | as above |
| Sheet → Story row (fight death) | "The Beast in Its Den" (`fight.lair.confront`'s name, probed) | PC-3 | the fight's own title |
| Sheet → Story row (commander slain) | "A commander slain in battle" | PC-3 | plain words; the battle also has its own "Battle at <place>" row |
| Any of the above, when no registry knows the id | "A deed undone" / "A death in a fight" | PC-3 | the fallback is words, never the key (PC-3's "what renders when a slot is empty") |

**The full rendered row.** A Story row is the name alone: the Story recipe sets no `fact`
(`connections.ts` lines 80/96/116/131 have no `fact` key, and `factFor` returns `''` without one), so the
row on Kael's sheet reads exactly **"Destroy a power"**, a link to the event's record page, in the list
newest first.

**Done to him, or done by him?** The row does not say, and no Story row says it today. Encounter rows
where the mortal was the `target` read the template name the same way. The old `(afflicted)` was a leaked
harm-class key, not a role marker anyone designed. This plan brings the row level with its neighbours and
does not add a role word to one row kind, because a word on one kind would make every unmarked row read
as "by him". Marking the role is a whole-list change across both minters' `participated_in.role`. It is
split off as its own ticket (see Notes for the executor) and not built here.

### Playtest signal

A tester who opens a mortal's sheet after a power was sealed or a holding razed reads the Story list
without quoting any dotted or underscored word back.

### Event notifications

None — no toast, beat or chronicle line is added or changed.

### Visual presence (HexMapV2)

None — no map layer changes; the hex region's history list (DOM) reads the new name via `templateName`.

### Debug inspection

None new. `window.__DEBUG` already exposes nodes; the property shows in any node dump.

## Wiring

> See checklist: Docs/plans/wiring-checklist.md

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|---|---|---|---|---|---|
| `undertakingOutcomeNode.ts` (`outcomeDeedName`) | unchanged (caller's phase) | sheet Story group, record page, hex region via `templateName` | `graph` event node `properties.templateName` | none new | node dump |

## Interface impact

| Contract | Disposition | Note |
|---|---|---|
| Undertaking outcome node → grievance mint, omen agenda, motive receipt (read id prefix, `templateId`, `harmClass`, `verb`, `participated_in` edges) | preserve | none of these fields or edges change |
| Event node `templateName` → Story rows / record page / hex region (`connections.ts`, `detailPageResolvers.ts`, `subjectPage.ts`, `hexRegion.ts`) | extend | outcome nodes now carry the property these readers already prefer |

No cross-system write is added, so `Docs/canon/interface-map.md` and `scripts/interface-contracts.ts`
need no edit unless the executor finds the outcome node's property list spelled there (then add
`templateName` to its row).

## Constants table

| Constant | Default | Purpose |
|---|---|---|
| `OUTCOME_DEED_FALLBACK_NAMES.undertaking` | `'A deed undone'` | name when an undertaking's template is unknown (should never show; warns) |
| `OUTCOME_DEED_FALLBACK_NAMES.fight` | `'A death in a fight'` | name when a fight's template is unknown |
| `OUTCOME_DEED_FALLBACK_NAMES.battle` | `'A commander slain in battle'` | the battle caller's name (it passes `'battle'`, which no registry holds) |

Placed in `src/data/grievance-constants.ts` beside the module's other constants.

## Tracing

N/A — no new trace. The node is already the inspectable record (NFP #2); the warn names the unknown id.

## Fail-soft table

| Failure case | Fallback |
|---|---|
| `templateId` in neither registry | the source kind's fallback name; one `console.warn` per id |
| a registry lookup throws | caught; fallback name; the node is still written |
| `displayName` empty string | treated as missing; next step |

## Done when

- [ ] `outcomeDeedName` exists and `createUndertakingOutcomeNode` writes its result as `name` and `properties.templateName`.
- [ ] Unit test (new, `src/engine/grievance/__tests__/outcomeDeedName.test.ts`): for every id in the strategic registry plus every cell, plus `fight.lair.confront` and `'battle'`, the name is non-empty and does not match `/[a-z]+\.[a-z_.]+/` or `/[a-z]+_[a-z_]+/`.
- [ ] Generated-world test (new, same folder or `src/engine/__tests__/thr2145-story-rows-no-keys.test.ts`): `initializeGameState` on a medium preset, force a `cell.destroy.power` completion with `startUndertakingForReview` (the pattern in `undertakingPortent.live.test.ts`), run ticks until the outcome node exists, then `buildConnections` for every agent with a Story group and assert no row `name` matches `/[a-z]+\.[a-z_.]+/`. It must fail on today's main.
- [ ] `npm run gate` green (code track: `npm test`, `check:typecheck`, `vite build`, freshness gates); 30-tick CLI smoke (engine file).
- [ ] One 1920×1080 screenshot of a sheet's Story group showing a fixed undertaking row (small visible fix, ≤400 UI lines). If no seed shows one in reach, the generated-world test is the evidence and the commit says so.
- [ ] Closing commit and PR body carry the line-anchored closer for this ticket.

## Kill criteria

- The generated-world test cannot be made to fail on today's main (the outcome node never reaches a Story group in a test world) → fall back to the graph-fixture form that `thr2139-aftermath-sheet-agree.test.ts` uses, and say so in the commit.
- Importing the strategic registry into the minter closes an import cycle → resolve the name at the three callers and pass it in; keep `outcomeDeedName` as the shared pure function.
- A tester still quotes a dotted key from a Story row after merge → another minter exists; the sweep should have caught it, so widen the sweep.

## Coordination block

**Suggested model:** sonnet — one engine file, one constant, two tests; the shape is fully specified.

**Parallel-safe with:** THR-2188 (lean / cap / forecast — touches the draw and forecast code, not the outcome minter).

**Mutex with:** any ticket editing `src/engine/grievance/undertakingOutcomeNode.ts` or `src/data/grievance-constants.ts`; none is open today.

**Files to touch:**
- Edit: `src/engine/grievance/undertakingOutcomeNode.ts` (add `outcomeDeedName`; use it at the `addNode` call)
- Edit: `src/data/grievance-constants.ts` (add `OUTCOME_DEED_FALLBACK_NAMES`)
- Create: `src/engine/grievance/__tests__/outcomeDeedName.test.ts`
- Create: the generated-world Story test named above

## Notes for the executor

- `src/engine/` is touched, so the `review-gate` skill runs before auto-merge.
- Do not change `refFor`. Do not change the node id or `templateId`: the grievance mint, the omen agenda and the motive receipt read them.
- Watch the import direction: `undertakingOutcomeNode.ts` importing `strategicActionCandidates.ts` may close a cycle (it already pulls `factionNetwork`). See Kill criteria.
- Out of scope, filed separately by the design lane as THR-2191: Story rows saying whether the mortal did the deed or had it done to them (whole list, both minters).
- `momentCardModel.test.ts:161` spells an old-style name in a fixture; it asserts nothing about it, so leave it.

## Three-pillar check

- [x] Engine pillar present
- [x] Content pillar N/A with rationale
- [x] UI pillar present (no component change, surfaces named)
- [x] Wiring section connects them

## Vision audit

- [x] This plan does not contradict any Vision premise — it makes an existing record legible.
- [x] No Vision edit is needed.

## Rulebook impact

- [x] This plan does not change a rule of play.
- [x] No `Docs/canon/rulebook.md` edit is needed.

> Brainstorm companion: `Docs/plans/2026-11-07-thr-2145-story-rows-name-the-deed-brainstorm.md`

## NFP-compliance table

| NFP | Verdict | Note |
|---|---|---|
| 1. Tunability | PASS | the three fallback names are named constants |
| 2. Inspectability | PASS | the name lives on the node; unknown ids warn by name |
| 3. Determinism | PASS | pure lookups, no random calls |
| 4. Fail-soft | PASS | see table; the node is always written |
| 5. Narrative over mechanics | PASS | the row reads as the deed the player saw offered |
| 6. Additive | PASS | one new property; `name` changes text only, no reader parses it |
| 7. Performance | N/A | two map lookups per harm outcome |

## Intent-judge verdict

Pass 1: **Revise** (dimension 10 kill criteria only in the proposal; dimension 12 complaint class marked "none" instead of PC-3, full rendered row and done-to/done-by reading unstated). Fixed: Kill criteria section added, PC-3 marked, rendered row and role reading stated, role marking split off as THR-2191.
Pass 2 (cold re-run): **Allow** — Reversible; 0 GAPs, 0 VIOLATIONs.

## Forked-audit verdicts

### NFP audit

NFP AUDIT: PASS-with-notes. Tunability, Fail-soft, Narrative, Additive PASS. Inspectability PASS-with-note (registry hits leave no record of which step named the node). Determinism PASS-with-note (the warn-once set's home was unstated — now stated: module-level, logging only). Performance PASS-with-note (minting path only, negligible).

### Three-pillar audit

PILLAR AUDIT: PASS-with-notes. Engine present-and-substantive; Content N/A with rationale; UI present-and-substantive. Wiring connects the module to three UI surfaces via `templateName`; substrate inventory extends `grievance/undertakingOutcomeNode.ts` (listed in systems-inventory). Note: Event notifications and Visual presence lacked "none" headings — now added.

### Vision audit

VISION AUDIT: PASS. No contradictions. Story rows read as deeds, not engine keys, which makes a mortal's history readable; the core loop is untouched; the harm class stays hidden so the row stays narrative. Soft note: fallback labels are generic, acceptable as warn-only paths.
