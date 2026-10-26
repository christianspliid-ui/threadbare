> **title:** Take up a relic that lies unclaimed — the Claim × Item undertaking, so a past god's relic can find a new bearer — THR-2031
> **linear_issue:** THR-2031
> **author:** Claude Code (design lane, run 2026-10-26a, unattended)
> **created:** 2026-10-26
> **three_pillars:** Engine done · Content done (one cell's words and two ambitions) · UI done (no new surface; the relic's page, the mortal's sheet and the deed line already read the edge — § UI pillar)

# Take up a relic that lies unclaimed — THR-2031

*The Hollow Bell lay in the barrow for an age. A seeker went to fetch it, and now it hangs at her belt.*

## Why this is load-bearing

[The world remembers](2026-10-14-thr-1813-the-world-remembers.md) seeds a past god's **Relic** into the new world and promises, Decided 7, that it *"reads Foreign until a mortal takes it up"*. The Remembrance card says *"It lies unclaimed in this world until someone takes it up."* Nothing can take it up. [A seeded relic has no place in the graph](https://linear.app/threadbare/issue/THR-2030) gives it a place to lie (`lies_at`, decided by the lane 2026-10-25, veto day over 2026-10-26T02:23Z, no veto). This plan gives a mortal a way to pick it up.

**The path is already ruled.** The [Undertaking Grid](../canon/undertaking-grid.generated.md) carries **Claim × Item** as *wanted* (THR-1397, Christian in chat, 2026-09-03): *"Picking up an unowned item: the possesses edge, one line. Op needed: `claim_item`. … the reason a found relic on the ground is reachable at all."* (`scripts/undertaking-grid-dispositions.ts:450`). This plan builds that cell. It does not invent a path.

## Substrate inventory

Measured on main @ 45feeb2f.

- **No take-up exists.** `grep -rn -E "claim_item|takeUpArtifact|claimArtifact" src` → no hits. Encounters mint new artifacts (`spawn_artifact`, `encounterAftermath.ts:3143`). The one artifact transfer is `seize_item`, which moves an existing `possesses` edge (`undertaking-objects.ts:2384-2400`).
- **The Item object type has no `control:claim` verb.** It declares `create`, `control:seize`, `destroy` (`undertaking-objects.ts:2362-2410`). Cells are synthesised per declared verb (`src/data/undertaking-cells.ts`), so declaring the verb creates `cell.control_claim.item`.
- **The cells model is live:** `UNDERTAKING_MODEL = 'cells'` (`strategic-action-constants.ts:1147`).
- **An artifact has no map position for proximity.** `resolveTargetHex` reads `located_at` for actors and the node's own hex otherwise (`strategicActionCandidates.ts:599-614`). An artifact resolves to `null` and sorts last at `STRATEGIC_TARGET_UNRESOLVED_HEX_DISTANCE`.
- **Item cells complete today.** Headless CLI, seed 42, medium, 240 ticks: 20 living mortals hold *Uncover Secrets* and 13 *Chase the Wonder*; `cell.control_seize.item` completed 2 times and `cell.create.item` 2 times.
- **Readers already wait.** The relic's Inspector `who` row reads incoming `possesses` (`views/connections.ts:125`). Dominion reads an artifact through its bearer, and only an artifact with no bearer reads `unborne` (`dominion.ts:190-223`). `onItemAcquired` teaches from a carried tome (`spellGrant.ts:381`; `ItemAcquiredVia = 'reward' | 'minted' | 'seized'`).
- **Only the seeded relic will ever lie anywhere.** `spawn_artifact`'s place branch writes `contains`, and only one test uses it (`encounterAftermath.worldShaping.test.ts`). No content does.

## Decisions

Decided by the design lane under delegation (process.md rule 4). Each can be vetoed on its own.

1. **A relic is taken up by an undertaking, not a scene.** A mortal makes *"Take up a relic left lying"* their work. When it completes, the relic is theirs. *Rejected:* rebinding *The Unclaimed Relic* encounter. Its prose describes one cold black-iron object, and a rarity-1 open draw at one ruin would fight the cap (memory: positional starvation). *Rejected:* a draw toward the relic's place. That is a second door to the same act. *Veto:* "it should be a scene the god can watch".
2. **The work is done from wherever the mortal stands, as every undertaking is.** Founding a town and claiming a place are remote too. The work is the journey. Distance only orders the targets and is priced by `travelPenalty`. *Veto:* "a mortal must stand at the place to pick it up".
3. **Only a thing that lies somewhere can be taken up.** An item with no bearer and no `lies_at` is refused at proposal (`not_lying_at_a_place`). This rules out loose nodes with no place.
4. **Seekers and wanderers want it.** `ambition_uncover_secrets` and `ambition_chase_the_wonder` walk the cell. It is the treasure hunt's payoff that the grid note names (*observe a ruin → clue → map → delve → claim × Item*), and it belongs to those two.

## Engine pillar

### Systems design

1. **`claim_item` op on `ITEM.verbs['control:claim']`** (`src/data/undertaking-objects.ts`):
   - Item missing → `fail('claim_item','item_not_found')`. Actor missing → `actor_not_found`.
   - The item already has a `possesses` or `bonded_to` bearer (someone got there first) → `fail('claim_item','already_held')`. Nothing is written.
   - No outgoing `lies_at` → `fail('claim_item','not_lying_at_a_place')`.
   - Otherwise read `placeId` from the `lies_at` edge **before** removing it. Remove every outgoing `lies_at`. Write `possesses` actor → item `{ active: true, acquiredTick, via: 'claimed', takenFrom: placeId }`. Call `onItemAcquired(…, 'claimed', seed)`. Return `{ success: true, op: 'claim_item', createdId: itemId, proseObjectId: itemId }`, plus `completionLine: 'echo'` when the item carries `echoOrigin: true` (the THR-1937 outcome-line path, `strategicActionLifecycle.ts:1213`).
2. **Eligibility hook** `ITEM.eligibility['control:claim']`: `not_lying_at_a_place` when the item has no `lies_at`. The cell's ownership rule (`unowned`) already drops borne items.
3. **Proximity reads where it lies.** `resolveTargetHex` gains an `artifact` branch. A borne artifact resolves through its bearer (`possesses` / `bonded_to` in, then the actor branch's `getAgentLocationId`). An unborne one resolves through `placeOf(graph, id)`, which [THR-2030](https://linear.app/threadbare/issue/THR-2030) extends to `lies_at` (`dominion.ts:314` today reads only `located_at`). Then `resolveLocationToHex`. So `seize × Item` also stops sorting last.
4. **`ItemAcquiredVia`** gains `'claimed'` (`src/engine/spellGrant.ts:367`). A claimed tome teaches once, as a seized one does.
5. **`{place}` in the cell's prose names where the relic lies, never the relic.** Today `placeNameOf` (`src/engine/undertakingProse.ts:102`) falls back to `objectPlaceNodeId(handle)`, which for a node object is the object itself (`undertaking-objects.ts:3003`). Left alone, the line would read *"has set out for the Hollow Bell"*. So `placeNameOf` gains an artifact branch: while the work runs, read the `lies_at` target; after completion, read `takenFrom` on the claimant's `possesses` edge (the `lies_at` edge is gone by then). If neither resolves, the existing `SLOT_FALLBACK.place` (*"the place"*) fills the slot.

### Graph nodes / edges

No new node or edge type. The op removes `lies_at` (THR-2030) and writes `possesses` with two optional properties, `via` and `takenFrom`. Both are additive and are already the `seize_item` shape plus one field. The invariant stated in THR-2030's schema row holds: an artifact with a bearer has no `lies_at`.

### Tick phases · Resolution · PRNG

No phase change. The cell rides the strategic undertaking lifecycle: proposal in `strategicActionCandidates`, checkpoints and completion in `strategicActionLifecycle` → `undertakingResolver`. Bands are as for every claim cell: a good band completes the op, a failure band writes nothing. No new PRNG draw. The op is a pure graph write.

## Content pillar

- **Cell words** (`src/data/undertaking-verb-prose.ts`, Prose Doctrine v2, GM narration, no numerals):
  - `UNDERTAKING_CELL_DEEDS['cell.control_claim.item'] = 'Took up'` → *Took up the Hollow Bell*.
  - `UNDERTAKING_CELL_PHRASES['cell.control_claim.item'] = 'Take up a relic left lying'`.
  - `UNDERTAKING_CELL_PROSE['cell.control_claim.item']`, because the claim set's *"sets a mark on"* and *"answers to a new name"* are wrong for a thing carried away:
    - activity: *"{Actor} has set out for {place}, where {object} has lain since the last age."* · *"{Actor} is on the road to {place}. Nobody has carried {object} out of it yet."*
    - completion: *"{Actor} came out of {place} carrying {object}."* · *"{Object} no longer lies at {place}. {Actor} has it now."*
    - narration: *"{Actor} took {object} up from where it lay at {place}."*
  - `UNDERTAKING_CELL_OUTCOME_PROSE['cell.control_claim.item'] = { echo: ['{Actor} takes up {object}, left by a god of the last age, and carries it out of {place}.'] }`. A past god's relic finding a bearer is told as that, not as any found thing.
- **Ambitions** (`src/data/ambition-templates.ts`): add `'cell.control_claim.item'` to the `cells` of `ambition_uncover_secrets` and `ambition_chase_the_wonder`. Put it ahead of their `create.item` entry so the per-ambition cap cannot starve it.
- **Grid** (`scripts/undertaking-grid-dispositions.ts`): Item `control:claim` moves from `W(…)` to `{ op: 'claim_item', note: … }`, keeping its `reader` text. Regenerate `Docs/canon/undertaking-grid.generated.md` and the wiki page (`npm run generate-undertaking-grid`).

## UI pillar

No component changes. Every surface already reads the edge this writes:

### Player-facing text

- **Before:** the Hollow Bell's page has a `where` row naming the Long Barrow (fact *"here"*, after THR-2030 points it at `lies_at`), no `who` row, and its Dominion band word reads **Foreign**. No one can ever change that.
- **After:** the mortal's sheet shows the work under way: *"Maren Ashfold has set out for the Long Barrow, where the Hollow Bell has lain since the last age."* On completion the deed line reads *Took up the Hollow Bell*, and the completion line reads *"Maren Ashfold takes up the Hollow Bell, left by a god of the last age, and carries it out of the Long Barrow."*
- The relic's page: the `who` row shows *Maren Ashfold* with the existing fact *"holds it"* (`factHolder`, `src/data/view-content.ts:161`). No wording changes. The `where` row disappears, because the relic no longer lies anywhere. Where it is now is the holder's row.
- The Dominion band word is now Maren's own band word, one of the existing five (*Hostile, Foreign, Touched, Held, Sovereign*). For example *"Touched"* if she stands on Touched ground. The term is explained by the existing `ui.dominion` tooltip and each band word's `ui.dominion.<band>` tooltip (`src/data/dominion-ui-content.ts:142-148`). No new term.
- Laws engaged: 1 (one truth: the edge), 4 (no numerals), 17 and 21 (the words say what happened), 56 (each line is backed by the write).
- Complaint classes ([player-complaint-classes.md](../ops/player-complaint-classes.md)): **PC-4** (the game acts without saying so). The take-up is a mortal's choice the god did not make, so it is told: the echo completion line names the relic and the last age, on the same completion surface every undertaking uses. **PC-3**: every slot is a node name (`{object}` = *the Hollow Bell*), never an id. **PC-6**: the relic page, the sheet and the Dominion read all read the one `possesses` edge.
- **How the god notices.** Like every undertaking, the take-up is background work. It is not an attended scene (Decision 1). The god learns of it through the completion line and the relic's page. A scene that frames the moment is a later idea (brainstorm companion).

### Playtest signal

A warm-playtest tester who opens the Remembrance card's relic a few seasons in finds it either still lying or in a named mortal's hands. Before this plan it was always lying.

**Browser-verify tool:** Playwright DOM at 1920×1080. `?view=game&seeded&size=medium&account=sample`. Complete the claim through the undertaking review lever or the debug bridge, then open the Hollow Bell's Inspector page. One screenshot (a small visible change; no UI code).

## Wiring

Checked against `Docs/plans/wiring-checklist.md`: no new module, so no orchestrator phase, component or debug tab is added.

| Module | Phase | UI | GameState | Trace | Debug |
|---|---|---|---|---|---|
| `claim_item` (undertaking-objects) | strategic lifecycle, completion | deed line, sheet, Inspector `who` | graph: `lies_at` → `possesses` | `strategic_world_change` names the object; `undertaking_cell_unreachable` when nothing lies anywhere | Strategic tab; `possesses.via/takenFrom` in the graph |
| `resolveTargetHex` artifact branch | proposal | — | read only | — | — |
| ambitions + cell prose | proposal / completion | card phrase, ledger | — | — | — |

## Interface impact

| Contract | Status | Change |
|---|---|---|
| Strategic Projects & Control → Attachments, Items & Possessions (`possesses` writers) | extend | a third writer, `claim_item`, beside `seize_item` and `mint_masterwork` |
| Echoes (`lies_at`, THR-2030) → Strategic Projects | add | `claim_item` is the first remover of `lies_at`. Read site: `dominion.ts` `dominionObjectScores` (bearer read), `views/connections.ts` `who` |
| Undertaking grid registry | extend | claim × Item becomes live |

`Docs/canon/interface-map.md` and `scripts/interface-contracts.ts` gain the `lies_at` remover and the `possesses` writer in the build PR.

## Constants table

No new number. The cell inherits these:

| Constant | Default | Purpose here |
|---|---|---|
| `STRATEGIC_TARGET_SCAN_CAPS.object` | 8 | how many lying things a mortal weighs, nearest first |
| `ITEM_TIER_BY_CLASS['relics_talismans']` | (existing) | the work's tier, so how long it takes |
| `STRATEGIC_TRAVEL_PENALTY_WEIGHT` | (existing) | how much a far relic is discounted |

The switch is data: removing the cell from the two ambitions' `cells` turns the take-up off.

## Tracing

No new trace category. The fail reasons ride the op result into the existing undertaking traces:

```ts
type ClaimItemFail = 'item_not_found' | 'actor_not_found' | 'already_held' | 'not_lying_at_a_place';
// possesses edge, additive
interface ClaimedPossessionProps { active: true; acquiredTick: number; via: 'claimed'; takenFrom: string }
```

## Fail-soft table

| Case | Behaviour |
|---|---|
| Two mortals work the same relic and one finishes first | the second fails `already_held` at completion; nothing written |
| The relic's place is gone | if its `lies_at` edge went with the place, the op fails `not_lying_at_a_place` and writes nothing. If a dangling edge survives, proximity sorts it last, and `{place}` falls back to *"the place"*: *"Maren Ashfold came out of the place carrying the Hollow Bell."* |
| No relic in the world (no account) | the cell is refused `no_object_in_range:item`, traced once per world |
| `onItemAcquired` throws | caught inside it (existing); the take-up stands |

## Blast Radius

None of the touched files has ≥100 importers: `undertaking-objects.ts`, `strategicActionCandidates.ts`, `spellGrant.ts`, `undertakingProse.ts`, `ambition-templates.ts`, `undertaking-verb-prose.ts`, `undertaking-grid-dispositions.ts`. No `src/types/` file changes.

## Three-pillar check

- [x] Engine pillar present
- [x] Content pillar present (cell words, two ambitions, the grid)
- [x] UI pillar present (existing surfaces, one screenshot)
- [x] Wiring section connects them

## Game Design Laws

Conforms to 22 and 45 (the Remembrance card's promise now happens), 42 (one cell, not a relic special case), 56 (every line backed by the write). Breaks none.

## Vision audit

- [x] Does not contradict a Vision premise. Checked: `Vision/00-north-star.md` (a story the player can tell: the Hollow Bell found a bearer), `Vision/01-core-loop.md` (what the last age leaves comes back into play), `Vision/02-non-negotiables.md` (the relationship is the edge), `Vision/03-design-tensions.md` #2 (this leans systemic, and the echo line is the authored counter-pull), the taste profile (prose-first, no numerals).
- [x] No Vision edit needed.

## Rulebook impact

- [x] A rule of play changes: a relic left by the last age can be taken up.
- [x] Owed in the build PR. After *"The world remembers."* in `Docs/canon/rulebook.md`, and in the quick reference's echo line: *"A relic lies where the last age left it until a mortal takes it up. Seekers and wanderers make that their work, and from then on the relic leans with its bearer."* (`[IMPL — THR-2031]`).

> Brainstorm companion: `Docs/plans/2026-10-26-thr-2031-take-up-a-lying-relic-brainstorm.md`.

## NFP-compliance table

| NFP | Verdict | Note |
|---|---|---|
| 1. Tunability | PASS | no new number; the switch is the ambitions' `cells` lists |
| 2. Inspectability | PASS | `via` and `takenFrom` on the edge; fail reasons on the op result |
| 3. Determinism | PASS | no PRNG; edge order is id order |
| 4. Fail-soft | PASS | table above |
| 5. Narrative | PASS | the card's promise comes true |
| 6. Additive | PASS | one verb, one union member, two edge properties |
| 7. Performance | PASS | the enumeration already scans every Item for seize; one `placeOf` per artifact target |

## Done when

- [ ] `claimItem.test.ts`: after `seedEchoes` with a relic echo, running `ITEM.verbs['control:claim']` for a mortal leaves **no** `lies_at` on the relic and exactly one `possesses` from that mortal with `via === 'claimed'` and `takenFrom === hostId`. `dominionObjectScores(graph, relicId).readThrough === 'bearer'`.
- [ ] The same test: the op returns `completionLine: 'echo'` for the echo relic and none for an ordinary item, and the resolved completion text names the relic and contains no node id.
- [ ] The same test: a relic already borne fails `already_held` with the graph unchanged; an unborne item with no `lies_at` is refused at proposal `ineligible:not_lying_at_a_place`.
- [ ] `undertakingProse` test: for a claim on the seeded relic, `{place}` resolves to the host place's name during the work and after completion, never to the relic's own name.
- [ ] `strategicActionCandidates` test: a seeded relic's distance from an actor is the hex distance to its `lies_at` place, never `STRATEGIC_TARGET_UNRESOLVED_HEX_DISTANCE`.
- [ ] `check:undertaking-live -- cell.control_claim.item --seed 42 --seed 99 --account sample` → `proved` (the script gains `--account sample`, loading `sampleAccount()`).
- [ ] With no account (seed 42, 60 ticks), `cell.control_claim.item` is never started: it is refused `no_object_in_range:item`, and `undertaking_cell_unreachable` is traced for it once.
- [ ] Grid regenerated with claim × Item live; `generate-undertaking-grid` passes. Rulebook and quick-reference lines, interface map and contracts, wiki page. `npm run gate` green. The 1920×1080 Inspector screenshot.

## Kill criteria

- The relic is taken up in under a day on most seeds, so it never reads as lying anywhere. Then remove the cell from `ambition_chase_the_wonder` (keep the seekers) and re-measure. If it is still under a day, ship with the cell off both ambitions and file the pacing question.

## Coordination block

**Blocked by:** [A seeded relic has no place in the graph](https://linear.app/threadbare/issue/THR-2030). This plan removes the `lies_at` edge that ticket adds.

**Suggested model:** sonnet. One verb on a precedent path (`seize_item`), one branch in proximity, prose rows, one script flag.

**Parallel-safe with:** [famine and glut draws](https://linear.app/threadbare/issue/THR-2040), [a road's encounters](https://linear.app/threadbare/issue/THR-2046), [commission pay](https://linear.app/threadbare/issue/THR-2042), [the sequel place](https://linear.app/threadbare/issue/THR-1929), [the founding gates](https://linear.app/threadbare/issue/THR-2009). None of them touches the undertaking registry, the strategic candidates, the ambitions or the verb prose.

**Mutex with:** THR-2030 only, as its blocker.

**Files to touch:** `src/data/undertaking-objects.ts`, `src/engine/strategicActionCandidates.ts`, `src/engine/spellGrant.ts`, `src/engine/undertakingProse.ts`, `src/data/ambition-templates.ts`, `src/data/undertaking-verb-prose.ts`, `scripts/undertaking-grid-dispositions.ts`, `scripts/undertaking-live-proof.ts`, tests; generated grid, rulebook pair, interface map and contracts, wiki page.

## Notes for the executor

Do not rebind *The Unclaimed Relic* encounter, and do not change `spawn_artifact`. Do not motive-gate the claim. Claim is not seize, and a relic lying in a barrow has no owner to wrong. Do not let the claim move a legendary artifact (`artifact_legendary` is not an Item). Run `census:undertakings` once at closeout to show the cell is proposed and completes. The kill criterion reads its day of completion.

## Intent-judge verdicts

| Run | Verdict | Findings | Fixed by |
|---|---|---|---|
| 1 | Revise | dim 12 GAP: the holder row was quoted as *"Held by …"*, but the shipped fact is *"holds it"*; the Dominion read was described, not quoted; no rendered line for an empty `{place}` | Player-facing text quotes `factHolder` and the five band words with their tooltips. `{place}` is resolved through `lies_at` / `takenFrom`, with the fallback sample rendered. Echo completion line added. |
| 2 | **Allow** | all twelve dimensions PASS. Optional: quote the current `ui.dominion` tooltip line in the build PR's evidence | Noted for the executor |

## Forked-audit verdicts

### NFP audit
PASS-with-notes. All seven pass. Note on 1: the kill criterion's "under a day" is prose, not a named constant. It is a measurement threshold read once at closeout, not a game number. Note on 6: the op removes THR-2030's `lies_at`, which is the stated invariant, not a destructive change.

### Three-pillar audit
PASS-with-notes. Engine, Content and UI are present and substantive. The Wiring table connects them, and the substrate is extended, not rebuilt. Notes: the substrate inventory is a list rather than a table, and the player-facing text named no complaint class (now names PC-3, PC-4 and PC-6).

### Vision audit
PASS-with-notes. No contradiction. Notes: the take-up is background work with no attended beat. The plan now says how the god learns of it (the echo completion line and the relic's page). It leans systemic on design tension #2, and the kill criterion watches the pacing. The Vision audit list now cites 00, 03 and the taste profile.
