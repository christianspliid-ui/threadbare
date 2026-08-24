# Pass 3b — Package critique: The Sign Over the Ruin

> Batch: border-perils (THR-1221), row **2** · Pass: 3b (Package critic, THR-1154)
> Date: 2026-08-24 · Judged file: `Docs/plans/encounters/the-sign-over-the-ruin-final.md`

templateId: encounter.border.the_sign_over_the_ruin
packageVerdict: connected
packageLeaves: A Terrified condition the capability stack really reads and a journey the agent actually walks on the map — to the nearest settlement when the reading lands, three hexes off this ground when it does not — plus a cultural omen about the two readings that shifts what the world offers next, and an Under Watch mark on the ruin the player can read on its Location Profile that no system in the game acts on.

---

## Half A — anchoring

Five authored chips across five bands (`success_at_cost` authors none, deliberately).
Every referent checked against `anchor-catalog.generated.md`, against the live type
unions where the catalog is stale, and against the sentence that renders beside it.

| Chip | Referent | In the catalog? | Prose names it? | Backing step + reachable on this band? | Verdict |
|---|---|---|---|---|---|
| `critical_success` · `sign.the_place_is_watched` | The location node the encounter is standing at, now carrying Under Watch | Yes — `location` 📍 named in the generated table, **🔗 linked in the live build** (see the stale-catalog note below). `entityId: '$target'` is a legal sentinel (`classifyAnchorDeclaration`, `chipAnchorDeclarations.ts:91`). Concept `trait.condition.location.under_watch` is attachment · condition 🔗 linked | Yes — `detail` opens on `{target}`, and `resolveSceneTargetContext` (`proseEnrichment.ts:291-294`) returns the **location's own name** for a location-kind target, so the chip reads *"Emberfall Waystation carries Under Watch now"*. `stateNoun.text: 'a watched place'` carries no token, which is correct — that field renders raw | Step 1 `successMetadata` → `condition_attachment { targetLocationId: '$target' }`. Step 1 **always runs** on this band (`computeFinalActionOutcome` cannot produce `critical_success` without it). Fires ✅ | **anchored** |
| `success` · `sign.carried_onward` | The acting agent, with a live `relocationIntent` on their node | Yes — actor/`individual` 🔗 linked, `entityId: '$actor'`, `visualKind: 'agent'` | Yes — `{actor}` names the agent. The destination concept (*"the nearest settlement"*) is a bare text concept carrying **no `entityId`**, which is the honest form: `nearest_settlement` resolves from the agent's hex at apply time (`relocationIntent.ts:130-134`), so no settlement could be named at authoring time and none is claimed | Step 1 `successMetadata` → `agent_relocation`. Step 1 always runs on this band. Fires ✅ | **anchored** |
| `failure` · `sign.what_the_looking_cost` | `trait.condition.terrified` on the agent | Yes — attachment · condition 🔗 linked; `entityId` is the **template** node id, exactly the catalog's declaration form | Yes — `stateNoun.text: 'Terrified'` and the concept both carry the template id; the `detail` names what it does | Step 1 `failureMetadata`. The `failure` band is produced *by* step 1 resolving `failure` (its own `failBehavior: 'fail_action'`), so the write is on the step that made the band. Fires ✅ | **anchored** |
| `critical_failure` · `sign.what_the_looking_cost_worse` | `trait.condition.terrified` on the agent | as above | as above | Both paths now backed: path B by step 1's `failureMetadata`, path A (step 0 alone crits) by step 0's newly-added `failureMetadata`. Fires ✅ — **this is the Pass-3 repair, and it holds** | **anchored** |
| `critical_failure` · `sign.run_off_the_ground` | The acting agent, with an `away(3)` `relocationIntent` | Yes — actor/`individual` 🔗 linked | Yes — `{actor}` names the agent and `{target}` names the ground they are driven off, by its own name | Same two paths, same two `failureMetadata` blocks. Fires ✅ | **anchored** |

**Half A: PASS. Zero `fold`, zero `bind`.**

### The stale catalog, where it matters here

The task flagged `anchor-catalog.generated.md` as stale on `location`, and it matters to
this exact chip. The generated file says twice — rows 29 and 45 — that *"no `visualKind`
member exists"* for a location and that the chip therefore cannot carry a click. That is
no longer true, and the file contradicts itself: its own line 22 already lists `location`
among the `visualKind` members. Read against the code:

- `src/types/unifiedAction.ts:237` — `visualKind?: 'agent' | 'faction' | 'artifact' | 'companion' | 'attachment' | 'location'`.
- `EncounterVeil.openEntity` (`EncounterVeil.tsx:456-483`) routes `location` to `onSelectEntity`, and its own comment records why: *"THR-1172 — `location` joins on the same terms: `entityId` is the location node id and the host opens `LocationProfileModal`."*
- `EntityVisualKind` (`entity-visual-fallbacks.ts:21-32`) carries `location`, so the noun gets a tile rather than an unstyled fallback.

So this packet's `stateNoun: { text: 'a watched place', entityId: '$target', visualKind: 'location' }`
is not merely legal — it is a **linked** anchor that opens the place's own sheet. Trust
the code; regenerate the catalog (`npm run generate-anchor-catalog`).

**One batch-level inconsistency this exposes.** The sibling encounter has already shipped:
`src/data/encounters/the-unclaimed-relic.ts:434` writes the identical location anchor as
`stateNoun: { text: 'a place under watch', entityId: '$target' }` — **no `visualKind`** —
because its package pass read the stale catalog and concluded the weaker form *"is exactly
the catalog's declaration form"*. The result is that the batch's two location anchors, the
brief's headline target, render at two different tiers: this one clicks through to the
Location Profile, the relic's is inert text. One line fixes it (add `visualKind: 'location'`
to the relic's `stateNoun`), and it should be fixed in the same batch rather than left as a
precedent for the next author to copy.

### Where the trap could have caught this packet and did not

`sign.the_place_is_watched` anchors a place, and the ruling under review is that nothing in
`src/` reads `trait.condition.location.under_watch`. Both halves were re-verified
independently here, not inherited:

```
$ grep -rn "under_watch" src/ --include=*.ts --include=*.tsx
src/data/condition-trait-content.ts:323,368,414        ← definition, a comment, its duration
src/data/encounters/the-unclaimed-relic.ts:436,448     ← the sibling encounter WRITING it
src/engine/__tests__/locationConditions.test.ts:42,384 ← tests
```

No reader. `LOCATION_CONDITION_MOVEMENT_TAX` omits it by design (`condition-trait-content.ts:446`),
and nothing in `src/data/` gates on any `trait.condition.location.*` id. **The chip is still
not foldable** — the referent is a real location node carrying a real `has_trait` edge with a
term, which is precisely the case the trap exists to protect. The re-categorisation from
`PATH` to `SCAR` landed (§ 9.3 reads `category: 'scar', direction: 'loss', polarity: 'loss'`)
and is coherent with the prose: *"a watched place"*, *"people keep eyes on it, and quiet work
here is harder and likelier to be seen"* — a factual claim about state, no promise the game
will act. Had it stayed `PATH` it would have been a `fold`. It did not.

---

## Half B — what this encounter leaves behind

### The table the batch report reads

| What is left | The write | Does a system read it? | Would the player see it? |
|---|---|---|---|
| **A journey the agent walks** — `relocationIntent` on the agent node, `nearest_settlement` on the success side, `away(3)` on the failure side | step 1 `successMetadata` / `failureMetadata` → `agent_relocation`, `mode: 'travel'`, written by `setRelocationIntent` (`relocationIntent.ts:248-253`) | **Yes, two named systems.** `phaseAgentDecision` calls `resolveRelocationIntentForAgent` each decision pass, and `encounterScoring.computeRelocationIntentBonus` bends the agent's own scoring toward the destination. No teleport — the mortal walks it through the ordinary movement system | **Yes, and this is the most visible thing here.** The agent leaves the hex on the map, under their own movement trail, over several ticks |
| **`Terrified`** on the agent (iron −0.06 / shadow +0.04, duration edge) | step 1 `failureMetadata`, and now step 0's as well | **Yes.** `decayConditions` counts `ticksRemaining` down; `collectAttachmentEffects` → `resolveEffectModifiers` folds its reach modifiers into every later test the agent takes | **Yes** — the Attachments tab with a remaining term, reachable through `AttachmentDetailView`, and the chip clicks straight to it |
| **A cultural omen** about the two readings, global scope, `time`-aligned | A3's `grants` (`emit_omen`), and again from the *"Let the country carry it"* reaction | **Yes.** `phaseOmenAgenda` runs the omen's life (`omen_started` / `omen_beat` / `omen_expired`, chronicle significance), and `deriveOmenEncounterBias` — read by `phaseAgentDecision.ts:619-641` — shifts which encounter types the whole world draws next | **Yes** — omen lifecycle events are world-scale notifications (`notificationThreadingGate.ts:52`), and `deriveLocationActivities` picks up the omen's vocabulary in place prose |
| **`Under Watch`** on the ruin — a `has_trait` edge on the location node with `ticksRemaining` | step 1 `successMetadata` → `condition_attachment { targetLocationId: '$target' }`; fires on **every** success-side band, chipped only on `critical_success` | **No. Nothing reads it.** Both of the primitive's two potential readers miss it: the movement tax excludes it by design, and no shipped content gates on a location condition | **Yes** — `LocationProfileModal.tsx:91-111` renders active location conditions off the same edges, sorted by remaining term, so the player can open that place and read *Under Watch — 3 days*. And from this packet's chip they can click straight there |
| **A possession** off the stone | step 0 `successMetadata.rewardPool`, `possession: 1.0`, no `tagFilters` | **Yes** — a real attachment on the agent, walked by the possession-reading stack | **Yes** — the PRIZE chip, then the Attachments tab |
| **The pilgrim** — a `must-persist` NPC, spawned or reused | `supportBundle`, `lazy-materialize-on-trigger` | **Partly.** The body persists on the map and can be drawn as cast again — but **no bond edge is written**, so nothing relates them to the agent and cast resolution has nothing to pull them back *by* | **Yes** at the moment they appear (`{cast:witness}` in the worst ending, and the *"Steady the one who stayed"* reaction targets them by key), no later |
| **`Inspired`** on the pilgrim | *"Steady the one who stayed"* reaction → `condition_attachment` on `$cast:witness` | **Yes** — same condition stack as Terrified | **Yes** — on the pilgrim's own sheet, if the player ever goes back to it |
| **A `knows_clue_of` edge** to a ruin | step 0 `successMetadata` → `spawn_clue`, `precision: 'vague'`, `targetRuinId: '$nearest_ruin'` | **Technically yes, practically almost never for this player.** See below | **No.** Nothing outside the debug tab shows it |

### Does the `spawn_clue` actually deliver anything to the player?

No — and the honest answer is sharper than the packet's own. Three independent facts, each
read off the code:

1. **`$nearest_ruin` is not nearest.** `findAnyRuinId` (`clueLifecycle.ts:555-564`) filters
   every location node for a `ruinMagnitude` property and returns a **uniformly random**
   one — no distance term, no relation to the agent's hex, no relation to the broken stone
   in the prose. The sentinel's name is a claim its resolver does not honour. On a medium
   map that is a ruin on the other side of the world roughly as often as not.
2. **`vague` is below the precision anything acts on.** `delveVariant.ts:320-325` requires
   `precision === 'located'` on a non-consumed clue before an agent will delve. A `vague`
   clue can be *upgraded* (`perceiveRelay` narrows it) but only by a god who already knows
   it exists — and nothing tells the player it exists.
3. **It can be suppressed outright.** `spawnClueFromEvent` defaults the candidate pool to
   `[actorId]` and then runs `selectClueRecipient`, which hard-filters on
   `SAGA_CLUE_MIN_TIER: 'shaping'` for any ruin at or above the saga magnitude threshold.
   This is an open-draw `background`-tier encounter, so on a saga ruin the clue is dropped
   with a `ruins.clue_suppressed_no_eligible_recipient` trace and nothing lands.

There is exactly one live downstream: `questHooks.getEvidenceStrength` sums non-consumed
clue magnitudes, and at `CLUE_QUEST_THRESHOLD` (0.5) with a guild hall in radius the
Adventurer's Guild posts a contract with a toast naming the ruin and a direction. A single
clue can trip it, because the edge's `magnitude` is the **ruin's** magnitude, not a
precision-scaled one. So the best case is: several ticks later, a guild the player was not
watching posts a contract about a ruin the player has never seen, with nothing tying it back
to the sign. That is a real world event and an untraceable one.

**Verdict on the clue: the `knowledge` family is satisfied at the gate and delivers nothing
to the player.** The packet is right to leave it unchipped and right about *why* — a chip
would be the Bridge defect. What the packet does not say, and the batch report should, is
that the family is wired in name only. This is not this encounter's fault: `$nearest_ruin`
resolving to a random ruin is a corpus-level primitive gap, and any encounter drawing
`knowledge` and reaching for `spawn_clue` inherits it.

### Is the `intel` prize real, or flavour?

**Flavour — and I am overruling the editorial pass's repair on its own terms.** Editorial
found the genuine defect (the declared prize was never written into prose) and fixed it by
writing the lead into step 0's `criticalSuccessAfterimage` and `successAfterimage`:
*"It was not aimed at this ground, and they came down knowing where it was aimed."* That is
good prose and it does close the shape's promise **as reading**. But it closes it with a
sentence, and the pass's own § 9.5 concedes the mechanism honestly: the lead *"is a claim
about what the mortal understood, which is scene-local and true regardless."*

Scene-local means the game holds no such fact. There is no `knows_of` edge, no revealed
location, no encounter seed, no intel effect — the only knowledge write in the template is
the clue above, and it points at a ruin the sentence never names and the player never sees.
So the player finishes a two-step Investigation whose declared stakes are `intel` holding:
a possession off the reward pool, a condition or a road, and a sentence saying the mortal
knows something. Nothing they can act on.

That is the characteristic failure of `Puzzle–Investigation–Resolution` arriving one step
later than editorial caught it: writing the withheld prize into prose is exactly what turns
it into flavour, because prose is the surface that claims nothing. It is not a rule
violation — an afterimage is a prose surface and Law 56 does not reach it — and I am **not**
holding the encounter for it, because the fix is upstream (a `knowledge` primitive that can
point at something the player can reach) rather than in this draft. But the batch report
should not describe row 2 as delivering intel. The thing the player actually carries out of
a good run is the object off the stone and, on a bad one, the fear and the road.

### Does the relocation read as consequence, or as the encounter shoving the player around?

**Consequence, on both sides, and it is the encounter's best mechanical beat.** The test is
whether the fiction stages the move before the chip reports it, and it does, twice and in
opposite directions:

- On `success` the overview reads *"There is a road down from here and people willing to walk it beside them"*, and the chip's `causeClause` names the crowd that wanted it said again where more people could hear. The agent goes **to the nearest settlement** — somewhere to be, not just away.
- On `critical_failure` the overview has the pilgrim *"walk them off the ground, point them at a road, and not say which reading was right."* The chip's `causeClause` names who decided and why. The agent goes **away(3)**.

Same primitive, two causes, two directions, both narrated by a person on the ground rather
than by the engine. That is what keeps it off the "the game moved my guy" reading.

**One honest caveat.** `away(3)` resolves to some hex three or more out with nothing on it —
the chip's own `detail` says so (*"with no destination past being elsewhere"*). The departure
is earned; the arrival is nowhere. The success side does not have this problem because
`nearest_settlement` lands the agent somewhere the simulation already has business.

### What reading the sign costs

`Terrified` is the sharpest of the leavings because it is the one the player feels in the
next encounter rather than reads about in this one: iron −0.06 / shadow +0.04 for its
duration, folded into every later test through `resolveEffectModifiers`, decayed on a term
the sheet shows. It is also the one the aftermath offers to lift, which is where the package
has a defect — see the sanity check below.

### The `under_watch` mark, stated plainly

The mark is real, it is durable, the player can open the place's Location Profile and read
it with a remaining term, and **no system in the game will ever ask about it.** It is
correctly a `scar` and not a `path`, so the chip never promises otherwise. It is the honest
weak leg of this package and it should be presented to the director as *a thing you can see
about a place*, never as *a thing that will happen to that place*.

### Solitariness

Not solitary. It plants no `encounter_seed` and mints no bond, so it hands nothing **named**
forward — but it hands two live channels forward anyway: the agent's own state (a condition
the capability stack reads, a journey the movement system walks) and the world's draw bias
(a cultural omen `phaseAgentDecision` reads every tick). Both are read by named systems and
both are visible. `connected`, on the strength of those.

What it does *not* do is connect **outward**. Everything durable is on the agent. The two
writes aimed at the world — the mark on the ruin and the clue — are precisely the two
nothing acts on legibly, and the one person it puts on the map, the pilgrim, is left with no
relationship to the agent at all. That is the asymmetry worth naming: this is a well-wired
encounter that changes the protagonist and barely touches the ground it happened on.

---

## Sanity check on the Pass-3 duplication trade

The systems pass fixed a genuine Law 56 breach — on path A (step 0 alone rolls
`critical_failure`, the engine hard-fails, step 1 never runs) the `critical_failure` band's
two chips were backed by a `failureMetadata` that never fired. That diagnosis is correct and
the repair direction is the only one the two-bucket schema admits. **But the trade is
materially worse than § 4 records, and one of its two claims is false.**

§ 4 says the repeat firing is *"harmless: `condition_attachment`/`agent_relocation` are
idempotent-ish under a repeat write."* Checked:

- **`agent_relocation` is idempotent.** `setRelocationIntent` (`relocationIntent.ts:248-253`)
  writes through `graph.updateNode`, *"replacing any intent already there."* Last write
  wins. The claim holds for this half.
- **`condition_attachment` is not, in any sense.** The handler
  (`encounterAftermath.ts:2345-2364`) adds a `has_trait` edge **unconditionally** — there is
  no already-holds-it check anywhere in the case — and the edge id is
  `has_trait_${target}_${templateId}_${tick}_${i}_s${s}`. The two firings are on **different
  ticks**, because `applyStepOutcomeEffects` is called at each step's own resolution
  (`unifiedActionResolution.ts:1860`) and step 0 has `duration: { min: 1, max: 2 }`. Different
  tick, different edge id, **two edges**.

Three consequences, none of them recorded:

1. **The reach modifier doubles.** `collectAttachmentEffects` (`effects/effectWalker.ts:66-93`)
   iterates every `has_trait` edge and pushes the target node's effects per edge, with **no
   dedupe by node id**. Two Terrified edges push Terrified's effects twice, so
   `resolveEffectModifiers` sums iron −0.12 / shadow +0.08 instead of −0.06 / +0.04. Neither
   `EFFECT_PER_ITEM_CAP` nor `EFFECT_MODIFIER_CAP` binds at these magnitudes.
2. **The sheet shows it twice.** Two edges, two rows, two independent `ticksRemaining`
   countdowns in `decayConditions`.
3. **The mercy reaction half-fails, visibly.** `sign.take_the_fear_off_them` declares
   `remove_condition { conditionTraitId: 'trait.condition.terrified' }` with no `removeAll`,
   and the handler (`encounterAftermath.ts:2157-2172`) then removes exactly one edge — the
   **oldest**. The player clicks *"Take the fear off them"* on the promise *"Let them put it
   down"*, the god pays the click, and the mortal is still Terrified.

**And the paths are not rare.** § 4's table treats the double as a curiosity on "path B", but
step 0's `failureMetadata` fires on *any* `isStepFailure` outcome, so it doubles on **every
run where step 0 fails and step 1 fails** — which is the plain `failure` band, the most
likely failure band in the template, since `continue_weakened` carries a −0.06 carryover
against a step already at 0.42. Before the fix, Terrified was applied exactly once on that
path. The repair introduced the double on the encounter's commonest bad ending in order to
close a rarer one.

**Does the stacking read as intended or as a bug?** As a bug. A compounding fear for failing
both halves is a defensible *design* — but it is nowhere declared, it is not what the
`failure` chip's sentence describes, the magnitude is invisible to the player, and the
encounter's own mercy reaction is written against the single-edge assumption. An undeclared
stack that breaks the aftermath click offered on the same band is an accident, not a
decision. NFP #1 and #2 both point the same way: if it stacks, say so and tune it; if it
does not, do not ship it stacking.

**Not a reason to redraft.** The prose is untouched by any of this and the fix list below is
three edits.

---

## Fix list — applicable without re-reading the packet

1. **`Docs/plans/encounters/the-sign-over-the-ruin-final.md` § 9.2**, reaction
   `sign.take_the_fear_off_them`: change the effect to
   `remove_condition { conditionTraitId: 'trait.condition.terrified', removeAll: true }`.
   Reason: Terrified can be on the agent twice, and the un-flagged form removes only the
   oldest edge (`encounterAftermath.ts:2162-2167`), so the reaction's stated intent does not
   happen on the band it most often appears on.
2. **§ 4, the block-quoted trade-off note**: strike *"`condition_attachment`/`agent_relocation`
   are idempotent-ish under a repeat write"* and replace with the measured behaviour —
   `agent_relocation` **is** idempotent (`setRelocationIntent` replaces); `condition_attachment`
   is **not** (unconditional `has_trait` add, edge id keyed on tick, no dedupe in
   `effectWalker`), so a step-0 `failure` followed by a step-1 `failure` or `critical_failure`
   applies Terrified **twice**: doubled reach modifier, two sheet rows, two decay timers.
   The reachability table's `critical_failure, path B` row needs the same correction, and the
   `failure` row needs the note added — it currently reads as a clean single write. This
   sentence is doctrine for the next author copying the packet, which is the packet's own
   stated standard for § 9.3.
3. **§ 4, record the decision**: state explicitly that the double application is **accepted**
   (it is the only shape the two-bucket schema admits that also backs path A) and that
   `removeAll: true` is the compensating change. If instead the batch wants a single
   application, the only clean route is the step-outcome-severity `EffectPredicate` already
   logged as BACKLOG in the systems audit — note that, do not attempt it in content.

Non-blocking, batch-level, for the report rather than this file:

4. `src/data/encounters/the-unclaimed-relic.ts:434` — add `visualKind: 'location'` to
   `relic.success.watched_ground`'s `stateNoun`, so the batch's two location anchors render
   at the same tier. THR-1172 shipped the union member and the `EncounterVeil` route; the
   generated anchor catalog has not caught up and is what led that packet to the weaker form.
5. Regenerate `anchor-catalog.generated.md` (`npm run generate-anchor-catalog`) — its
   `location` row and bullet still say no `visualKind` member exists, contradicting both its
   own line 22 and `unifiedAction.ts:237`.

---

## Strongest and weakest connection

- **Strongest: the relocation.** A real `relocationIntent` on the agent node, read by
  `phaseAgentDecision` and `encounterScoring`, walked out over several ticks through the
  ordinary movement system — the single most player-visible consequence the game has. It
  fires in both directions from causes the prose stages first: the crowd carries the reader
  onward to a settlement, or the pilgrim walks them off the ground and points them at a road.
  Nothing else in this packet is both this legible and this certain to be noticed.
- **Weakest: the `spawn_clue`.** Not the `under_watch` mark, which at least the player can
  open and read. The clue is a write on a uniformly-random ruin the encounter never names,
  at a precision below anything the knower can act on, invisible on every non-debug surface,
  and droppable outright on a saga-magnitude target because this is a background-tier draw.
  It satisfies the `knowledge` family at the gate and hands the player nothing. The packet
  correctly refuses to chip it; the batch report should say plainly that the family is wired
  in name only.

## One line for the batch report

> `$nearest_ruin` does not mean nearest. `findAnyRuinId` (`clueLifecycle.ts:555`) picks a
> uniformly random ruin anywhere in the graph, and `spawn_clue`'s `vague` precision sits
> below the `located` bar `delveVariant` requires — so an encounter that draws `knowledge`
> and wires it through `spawn_clue` passes the consequence-draw gate while leaving the player
> nothing. Two of this batch's six draw `knowledge`. Worth one ticket to give the sentinel a
> distance term and the clue a player-facing surface, at which point the family stops being
> satisfiable by a write nobody can follow.

---

## Why `PACKAGE FIX` and not `PACKAGE PASS`

The verdict table keys `PACKAGE FIX` to Half A finding a `fold` or a `bind`, and Half A found
neither — every chip is anchored and the Half-B verdict is `connected`, which by the letter
of the table is a pass. I am calling FIX anyway, and recording why so the orchestrator can
overrule it cheaply if it disagrees.

The defect is a package defect of exactly the kind this stage exists to catch: on the
`failure` band the encounter writes Terrified twice, reports it once, and offers a click
promising to lift it that lifts half of it. Prose, chip and state disagree about the same
fact, and every earlier stage was individually satisfied — editorial judged the sentence,
systems judged the ids, and the Law 56 backing gate checks effect *presence*, not effect
*count*. Nobody downstream of me is looking at the composed thing.

FIX costs no critic loop and the list above is three edits to one markdown file plus two
non-blocking batch notes. Nothing in the prose changes. If the batch would rather ship and
file the `removeAll` change as a follow-up, this reads as PASS with items 1–3 carried into
implementation — but item 1 should not reach a player either way.

PACKAGE FIX
