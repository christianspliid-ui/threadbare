# Package critique — The Broken Seal (Pass 3b)

> Slug: `the-broken-seal` | Pass: 3b (package) | Date: 2026-08-25
> Judged against: `the-broken-seal-final.md`, `anchor-catalog.generated.md`,
> `nudge-authoring-spec.md` § Consequences (0, 0b, 0c, 0d, 1–4), `deep-places-brief.md`
> Batch sibling: `the-drowned-archive-revised.md` (slot 2)

templateId: encounter.delve.the_broken_seal
packageVerdict: PACKAGE PASS
packageConnection: connected
packageLeaves: On the good endings the agent walks out holding a real object — a Veilscript Fragment, or on the rarest ending The Silent Testament as well — which sits in their possessions and can be looked at, carried and lost like any other item; on the bad endings the keepers bring the stair down and the place itself is marked closed, which shows up on that location's own sheet with a term in words and makes every route through it eight times more expensive for anyone in the world, agent or army, until it lifts; and on the worst ending the agent walks away wanting to know what was in the coffer, which is written as a real ambition that steers which encounters they are offered and what they do when idle for the rest of their life — measured on a live world, three-quarters of agents are carrying no ambition at all, so this encounter is one of the few things in the game that gives someone a reason of their own.

---

## Half A — every chip's referent

Nine chips across five bands. Every declaration was checked against
`classifyAnchorDeclaration` (`src/data/content-eval/chipAnchorDeclarations.ts`) and every
backing kind against `CHIP_BACKING_EFFECT_KINDS` (`compositionContract.ts:199`) — not
against the catalog's prose, per the standing warning that the two disagree.

| # | Chip | Band | Referent | In the catalog? | Declaration legal? | Prose names it? | Backed on this band? | Verdict |
|---|---|---|---|---|---|---|---|---|
| 1 | `seal.crit.prize` | `critical_success` | The Veilscript Fragment item | ✅ Attachment · possession 🔗 | ✅ `attachment_template` (`reward-attachment-catalog.ts:795`) | ✅ *"A Veilscript Fragment"* | ✅ step 1 `successMetadata` → `attachment_grant` | **anchored** |
| 2 | `seal.crit.testament` | `critical_success` | The Silent Testament item | ✅ Attachment · possession 🔗 | ✅ `attachment_template` (`:819`) | ✅ *"The Silent Testament"* | ✅ band reaction → `attachment_grant` | **anchored** |
| 3 | `seal.success.prize` | `success` | The Veilscript Fragment item | ✅ | ✅ | ✅ | ✅ step 1 `successMetadata` | **anchored** |
| 4 | `seal.cost.prize` | `success_at_cost` | The Veilscript Fragment item | ✅ | ✅ | ✅ | ✅ step 1 `successMetadata` | **anchored** |
| 5 | `seal.cost.wounded` | `success_at_cost` | The `wounded` condition template | ✅ Attachment · condition 🔗 | ✅ `attachment_template` (`condition-trait-content.ts:143`) | ✅ *"{actor} is wounded"* | ✅ band reaction → `condition_attachment` | **anchored** |
| 6 | `seal.fail.worn_out` | `failure` | The `exhausted` condition template | ✅ Attachment · condition 🔗 | ✅ (`:223`) | ✅ *"{actor} is exhausted"* | ✅ step 1 `failureMetadata` → `condition_attachment` | **anchored** |
| 7 | `seal.fail.driven_out` | `failure` | The acting agent's forced journey | ✅ Actor · individual 🔗 | ✅ `$actor` sentinel | ✅ `{actor}` + `{location}`, both enriched | ✅ step 1 `failureMetadata` → `agent_relocation` | **anchored** |
| 8 | `seal.crit_fail.shut` | `critical_failure` | The location the encounter is at | ✅ Node · location 🔗 | ✅ `$target` sentinel | ✅ `{target}` → the place's own name | ✅ band reaction → `condition_attachment` on `targetLocationId: '$target'` | **anchored** |
| 9 | `seal.crit_fail.the_wanting` | `critical_failure` | The `Uncover Ancient Secrets` ambition, reached through its carrier | ✅ Node · ambition 📍 (carrier route) | ✅ `$actor` sentinel; `concepts` declares no `entityId`, so it is not gate-checked | ✅ names the live `displayName` verbatim | ⚠️ band reaction → `assign_ambition`, **which conditionally no-ops** — see A3 | **anchored, two caveats** |

**No chip verdicts `fold` and no chip verdicts `bind`.** Half A passes.

**No `reputation_tally` chip** (rule 0d) — none of any kind, and the encounter deliberately
touches neither reputation nor factions.

**Rule 0c holds on all nine.** Every `stateNoun.text` is a mechanic phrase — *a fragment
gained*, *a testament gained*, *Wounded*, *Exhausted*, *a journey set*, *a place closed*,
*a new ambition* — never a scene noun, and none carries a placeholder (that field is not
enriched). Every `detail` names its endpoints before its fiction. The weakest of the nine is
`seal.fail.driven_out`'s *"a journey set"*, which is a mechanic but a soft one; *"driven
off"* or *"a forced journey"* would read harder. Not a defect, an observation.

### A1 — the location chip binds, and I proved it rather than inheriting the claim

`seal.crit_fail.shut` is the brief's required location anchor and the single highest-stakes
chip in the package, because both its anchor **and** its write route through the same
`$target` sentinel. Two things had to be true and neither was provable from the packet:

1. `targetLocationId` is a registered scene-sentinel field expecting kind `location`
   (`encounterAftermath.ts:684`), and `nodeMatchesSceneField` binds it **only** when
   `action.targetId` resolves to a *place-tier* location — `isPlaceTierLocation`, which
   excludes sublocations. A sublocation target would silently leave the sentinel unbound and
   the condition would no-op down the invalid-target path.
2. `resolveAnchorDeclaration('$target')` returns `action.targetId` unconditionally, so if the
   action self-targeted, the chip would render an **agent** node with `visualKind: 'location'`.

Measured on the live engine (`npm run cli -- --seed 42 --map medium`, `tick 60`): of 33 live
encounter actions, **33 carried a `location` targetId and 33 of those were place-tier**, zero
sublocations. Samples: `Wraithwood/capital`, `Greycity/city`, `Ardenmor Keep/capital`. Both
halves bind.

> **One review-harness trap, recorded because it will otherwise be misdiagnosed as a dead
> chip.** Spawning through the CLI's `spawn encounter @hero` produced
> `targetId === actorId` (an ascendant node with no `located_at`), under which this chip
> renders as plain text and `pass_closed` writes nothing. That is the debug path resolving
> `@hero` to an ascendant, not a content fault — the browser `?spawn=` route goes through
> `prepareDebugEncounterSpawn`, which sets `targetId: locationId` from the agent's resolved
> location (`debugEncounterTools.ts:438`). If the director reviews this ending via `?spawn=`
> and the stamped avatar has no location, the location chip will look broken and will not be.

### A2 — the packet's §13 anchor table omits chip 9, and its brief-compliance ✓ is false as written

§13 tabulates **eight** chips and reports *"6 attachment · 1 location · 1 individual"*, then
§18 records *"≤1 `individual`-anchored chip ✓ exactly 1"*. `seal.crit_fail.the_wanting`
declares `stateNoun: { entityId: '$actor', visualKind: 'agent' }` — mechanically identical to
`seal.fail.driven_out` — so the true count is **6 attachment · 1 location · 2 individual**,
and the brief's ceiling of one per encounter is exceeded.

The chip data itself is fully and correctly specified in §12; only the accounting table is
wrong, so Pass 4 will implement the right thing either way. Two fixes, and I recommend the
second:

- **Correct §13 and §18** to two individual anchors, with the mitigation stated: the two
  never co-render, because they sit on different bands and only one band draws.
- **Better — drop `visualKind: 'agent'` from chip 9's `stateNoun`.** The sentence is about an
  *ambition*, not about the person; the catalog files `ambition` as 📍 named with no
  `visualKind` member, and `named` is fully lawful. Removing the member costs nothing, keeps
  the ambition legible, restores the brief's ✓ honestly, and stops a second agent portrait
  appearing on an ending that is not about the agent's face. The `entityId: '$actor'` stays —
  it is the carrier route, and the actor's sheet is exactly where the catalog says an ambition
  is seen.

This is a one-line correction, not a fold or a bind, which is why it does not sink Half A.

### A3 — chip 9 claims a write that fires for about four agents in five

`assign_ambition` routes through `assignAmbitionToActor` (`ambitionAssignment.ts:70`), which
refuses with `already_pursued`, or with `no_free_slot` when the actor already holds
`MAX_ACTIVE_AMBITIONS` (2) active `pursues` edges. There is no eviction. The chip's `detail`
— *"{actor} is pursuing Uncover Ancient Secrets now"* — claims it unconditionally.

Measured, same world, tick 160, 495 individual actors:

| Active ambitions | Actors | Share |
|---|---|---|
| 0 | 366 | 74% |
| 1 | 26 | 5% |
| 2 (full — the write refuses) | 103 | 21% |

So the claim is **true for ~79% of agents and false for ~21%**. That is a real Law-56 rule-0
exposure and it is the same *class* as The Unsafe Bridge — a chip the backing gate passes
because the effect kind is authored on the band, while the effect declines at runtime — but
it is a different *magnitude*: the Bridge's referent could never exist in any world, this one
lands four times in five. It does not warrant a fold; folding would delete the batch's only
ambition consequence and gut the `critical_failure` ending.

**Action:** record it in the batch report as a corpus-level finding, not a slot-1 defect —
every `assign_ambition` chip in the corpus carries it, and the durable fix is engine-side
(either evict the lowest-priority ambition, or let the gate see conditional kinds). Pass 4
should carry a one-line code comment at the effect so the next reader is not surprised.

The same conditionality rides the `critical_success` ambition and the step-1 card
`seal.kindle_a_wanting` — both correctly **unchipped**, so neither makes a false claim.

### A4 — the catalog/classifier disagreement, seconded

The packet's recorded deviation is correct and I verified it by direct code read: the catalog
tells an author to declare an `ambition` anchor as `entityId` = the ambition node id, and
`classifyAnchorDeclaration` rejects every literal id that is not a shipped attachment template
(*"minted per world and cannot be authored"*). An author writing faithfully from the catalog
ships a gate failure. Slot 2 files the same finding independently. **Two encounters in one
batch hit it; the catalog row is the surface that should move**, since the sentinel forms are
the ones the build resolves.

---

## Half B — what each ending leaves behind, and who picks it up

The question is not "does something persist" but "does a named system read it, and would the
player see it happen". Each ending traced to its consumer.

### `critical_success` — an item, and a wanting

- **`attachment_grant` → Veilscript Fragment (step 1) + The Silent Testament (reaction).**
  Both are shipped `REWARD_POSSESSIONS` templates. Read by the attachment system: they sit on
  the bearer's Attachments tab, open `AttachmentDetailView`, carry tier and loss conditions,
  and participate in `computeRawScore` item stat contributions. **Player sees it:** two chips
  that click straight through to the item sheets. **Connected.**
- **`assign_ambition` → Uncover Ancient Secrets**, deliberately unchipped. See below for its
  readers. **Connected, silently** — the overview carries it as fiction, which is correct.

### `success` — an item, and a way left open

- **`attachment_grant` → Veilscript Fragment.** As above.
- **`encounter_seed`, family `encounter.delve`, on `$actor`, +24 ticks, `inheritContext`.**
  This one needs stating precisely, because it is the encounter's only forward hook and it is
  **conditional in a way the packet does not say.** `matchFamilyTemplate`
  (`encounterSeeding.ts:56`) draws over registered templates whose id starts with
  `encounter.delve.` — note the trailing dot — filtered to templates whose `locationSubtypes`
  include the agent's subtype **at the moment the seed fires**. Today the family has
  **zero** members (`encounter.delve_into_depths` does not match the prefix). After this batch
  ships it has exactly two: this encounter and `the_drowned_archive`, which share the same
  envelope. So: if the agent is still standing at a ruin, tower, shrine or temple 24 ticks
  later, the seed draws one of the two delves — a coin flip between the archive and a return
  to this same scene. If they have moved off, it degrades to the family-only narrative
  fallback: a chronicle line, *"The consequences of … are stirring"*. **Real, but its payoff
  pool is the batch itself.** That is honest for the first content ever written into a starved
  family, and it is exactly why the brief chose this family — but the director should hear it
  as "the door it opens leads to the other encounter in this batch", not as an open-ended hook.

### `success_at_cost` — an item, and an injury

- **`condition_attachment` → `wounded`.** A live condition with a duration edge and a negative
  reach modifier, decayed by `decayConditions`, read by every reach computation and by the
  agent's own sheet. **Player sees it:** a `SCAR · Wounded` chip clicking to the condition
  sheet, and the condition on the agent's Attachments tab until it heals. **Connected.**

### `failure` — a body worn out, and a road taken

- **`condition_attachment` → `exhausted`.** As above.
- **`agent_relocation`, `{ kind: 'away', minHexDistance: 3 }, mode: 'travel'`.** This writes a
  relocation intent read by `resolveRelocationIntentForAgent` in `phaseAgentDecision` and by
  `computeRelocationIntentBonus` in `encounterScoring` — so the agent genuinely leaves and
  their next encounters are scored against the new ground. `mode: 'travel'` means the journey
  runs on the map rather than teleporting. **Player sees it:** the agent's dot moves, over
  several ticks, away from the ruin. `category: 'path'` is earned: a way opened and the
  simulation acts on it. **Connected** — and this is the batch's only `path` chip.
- `quintessence_shift`, unchipped. Correct: the engine surfaces incidental drift itself.

### `critical_failure` — a place shut, and a person who has to know

- **`condition_attachment` → `pass_closed` on the location.** The strongest write in the
  package, and the one I traced furthest. Two live readers, both verified:
  `LOCATION_CONDITION_MOVEMENT_TAX` maps it to `LOCATION_IMPASSABLE_MULTIPLIER` (×8) and
  `movementCost.ts:105` applies it, so every agent and army pathing through that place pays
  for it for `CONDITION_PASS_CLOSED_DURATION` (360 ticks — a month of game time at 12 ticks a
  day). And `LocationProfileModal` reads the same `has_trait` edges the aftermath writes and
  renders the condition with its **remaining term in words** on the place's own sheet. So the
  chip clicks through to a surface that shows the thing the chip claimed, counting down.
  **Connected, and the player can watch it lift.**
- **`assign_ambition` → Uncover Ancient Secrets.** Read by `agentPursuesReach`
  (`encounterScoring.ts:826`), which biases which encounters the agent is offered toward the
  ambition's reach affinities — `eye 0.8, veil 0.5, stone 0.4` — by `phaseAgentDecision` and
  `idleBehavior` for what they do with free time, by `ambitionTick` for milestone progress
  against three real conditions (one of which is *controlling a ruin*), and by
  `motiveReceipt` for foreshadowing. **Player sees it:** the ambition on `AgentDetailPanel`,
  and milestone toasts as it advances. Subject to A3's 21% refusal. **Connected.**

### The verdict on Half B

`connected`, and not marginally. Three of the five endings write state a named system reads
*and* a surface the player can open; the location closure is legible on two independent
surfaces at once (the place's sheet and the cost of walking there). The one genuinely thin
thread is the `success` seed, whose draw pool is the two encounters of this batch — thin by
supply, not by construction, and it thickens the moment a third delve ships.

This encounter is the opposite of solitary. The measurement that makes that concrete: **74%
of individual actors in a live world at tick 160 hold no ambition at all**, because
`ambitionTick`'s top-up is double-gated (`tick % 15` and `tick % 25`, so it fires only every
75 ticks) and mostly leaves agents empty. The `drive` family the brief called a near-zero-user
cell really is one, and this encounter is one of the few things in the game that puts a
wanting into a person who had none.

---

## Batch-spread judgement

| Axis | Slot 1 (The Broken Seal) | Slot 2 (The Drowned Archive) | Verdict |
|---|---|---|---|
| Anchor kinds | 6 attachment · 1 location · **2 individual** (corrected) | 6 location · 3 attachment · 1 individual | ✅ Genuinely complementary — the two lead on different kinds and neither leads on `individual` |
| Consequence categories | `boon` ×4 · `scar` ×3 · `path` ×1 (+ 1 `boon` on chip 9) | `boon` ×5 · `scar` ×4 · `bond` ×1 | ✅ All four categories covered across the batch, neither padding |
| Consequence families | `drive` + `movement` | `relationship` + `knowledge` | ✅ Four distinct families, no overlap |
| `location` chip w/ `visualKind` | ✅ 1 | ✅ 6 | ✅ Brief's ≥1-per-encounter met |
| `individual` ceiling (≤1) | ❌ **2** — see A2 | ✅ 1 | ⚠️ One-line fix in A2 |
| `faction` anchor (warned off) | ✅ none | ✅ none | ✅ |
| `ambition` anchor | Carrier route only — the catalog's declared form is gate-rejected (A4) | — | ⚠️ Brief's row is unsatisfiable as written; catalog should move |
| `artifact` anchor (≥1 across batch) | Three item grants, all `attachment · possession` | attachment grant | ⚠️ Met only under the reading that a possession grant counts. **No `spawn_artifact` fires anywhere in the batch and no chip declares `visualKind: 'artifact'`** — worth stating plainly rather than ticking |

**Not the same kind twice.** The pair anchors to a real spread: slot 1's consequences are
things you carry and a road you are put on, slot 2's are things known about a place and a
person who trusts you. The brief's explicit warnings — `individual` as the only anchor kind,
and `faction` — are both honoured.

---

## Fix list (none blocking; all one-line)

1. **§13 / §18** — correct the anchor totals to `6 attachment · 1 location · 2 individual`.
   Preferred fix: remove `visualKind: 'agent'` from `seal.crit_fail.the_wanting`'s `stateNoun`
   so the chip renders as a `named` ambition rather than a second agent tile, restoring the
   brief's ≤1 ceiling honestly. `entityId: '$actor'` stays. (A2)
2. **Pass 4 code comment** at the two `assign_ambition` effects, recording that
   `assignAmbitionToActor` refuses on a full slot and that the chip's claim is therefore
   conditional. (A3)

## Findings for the batch report

1. **`assign_ambition` chips are conditionally false, corpus-wide** — the write declines on
   `no_free_slot` / `already_pursued` with no eviction, measured at 21% of actors in a mature
   world, while `CHIP_BACKING_EFFECT_KINDS` passes the chip regardless. Same class as the
   Unsafe Bridge, a fifth of the magnitude. Engine-side fix, not a content fix.
2. **The anchor catalog's `ambition` row cannot be obeyed** — it prescribes a declaration
   `classifyAnchorDeclaration` rejects. Both slots hit it independently. The catalog row is the
   surface that should move.
3. **`encounter.delve.` has zero members today** and exactly two after this batch, both sharing
   one envelope — so slot 1's family seed draws only from the batch itself. Not a defect;
   a supply fact the seed's value depends on.
4. **The `?spawn=` / CLI review route can make a correct `$target` location chip look dead** when
   the stamped avatar has no resolved location. Worth a line in the review instructions so a
   harness artifact is not filed as a content defect.
5. **The batch ships no `artifact`-kind anchor and no `spawn_artifact`** — the brief's row is met
   only by reading "grant" to include possession attachments.

---

The Broken Seal holds together as one thing rather than as prose with chips bolted on. The
words and the writes are about the same objects: the coffer the prose introduces is the item
the chip hands you, the stair the keepers defend is the place the chip closes, and the thing
they would not let the agent see is the thing the ambition makes them chase. Every ending
leaves something a named system reads and a surface the player can open — most sharply the
collapsed stair, which shows on the location's own sheet with a countdown and makes the ground
eight times more expensive to cross for a month. Two small corrections are owed: the anchor
table in §13 misses one chip and so claims a brief-compliance tick it has not earned, and the
ambition chip states a change that the engine declines to write for about one agent in five
because they are already carrying two ambitions. Neither is a fold, neither needs a redraft,
and both are a line of text each.

PACKAGE PASS
