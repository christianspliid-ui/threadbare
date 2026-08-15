# Retrofit batch 1 — brief (THR-1130, the pilot volume)

> **lint_plan_doc:** exempt — a factory batch brief is an encounter-pipeline artifact
> (Stage 0), not a dated design plan doc. It has no Engine pillar, constants table,
> tracing or fail-soft table to declare, and never will; the design decisions it runs
> under were ruled on 2026-08-08 and live in the plan doc it links.

**Status:** drafted by the agent, **awaiting Christian's chat approval** (ruling 2 — a batch does not run until its brief is approved).
**Ticket:** [THR-1130](https://linear.app/threadbare/issue/THR-1130/encounter-factory-pilot-volume-retrofit-the-15-nudge-era-encounters-to) · **Plan:** [2026-08-08-encounter-factory-workflow.md](../2026-08-08-encounter-factory-workflow.md) §2 Stage 0
**Gate:** `npm run check:encounter -- <templateId>` · **Report:** `npm run encounter:batch-report -- <ids…> --brief Docs/plans/encounters/2026-08-15-retrofit-batch-1-brief.md`

Ruling 8 asks for all 15 nudge-era encounters retrofitted to the full Composition
Contract. This brief covers **batch 1 of 3** and records the corpus sweep that set its
membership, because the sweep changed what the batches should contain.

## The measured state (whole-corpus sweep, 2026-08-15)

`npm run check:encounter -- --all --json`, 191 templates checked, 0 hard failures (every
failing template is on the `RETROFIT_PENDING` ratchet, which is the designed state). Of
those, **14 carry a nudge-bearing step**; the 15th and 16th of the retrofit set are the
two sequels, which carry none by design.

| Template | Reach | Systems (quota 3) | Bands (floor 3) | Blocks missing |
|---|---|---|---|---|
| `slice.unsafe_bridge` | — | 4 `cast,rewards,conditions,reputation` | 4 | aftermath¹, images² |
| `slice.snow_on_the_pass` | — | 4 | 4 | aftermath¹, images² |
| `slice.riders_behind_caravan` | — | 4 | 4 | aftermath¹, images² |
| `slice.bargain_at_crossroads` | — | 4 `…seeds…` | 3 | aftermath¹, images² |
| `slice.swindler_found` | — | 4 | 4 | aftermath¹, images² |
| `slice.swindled_family` | — | 4 | **2 — under floor** | aftermath¹ **+ a 3rd band**, images² |
| `slice.full_moon_collection` *(sequel)* | — | **2 — under quota** | 3 | aftermath¹, hand³, systems |
| `slice.grateful_kin` *(sequel)* | — | 3 | 3 | aftermath¹, hand³ |
| `sharpen_blades` | iron | **0** | **0** | setting, cast, rewards, aftermath, systems, images² |
| `ward_the_camp` | veil | **0** | **0** | setting, cast, rewards, aftermath, systems, images² |
| `offer_small_prayer` | star | 1 `rewards` | **0** | setting, cast, aftermath, systems, images² |
| `rest_and_reflect` | heart | 1 | **0** | setting, cast, aftermath, systems, images² |
| `tend_to_wounds` | eye | 1 | **0** | setting, cast, aftermath, systems, images² |
| `scout_the_perimeter` | eye | 1 | **0** | setting, cast, aftermath, systems, images² |
| `shrine_offering` | star | 1 | **0** | setting, cast, aftermath, systems, images² |

¹ `aftermath` here is *only* the per-change `concepts` declaration — see finding 1.
² `images` is *only* unresolved `generic.*` card tags — see finding 2.
³ `hand` on a sequel is "no nudge-bearing step", which is the shape, not a defect — see finding 3.

## Three findings that reshape the retrofit

### 1. The `aftermath` block fails 14/14 on one contested rule, not on authoring debt

On six of the eight slice encounters, the **only** aftermath violation is
`change '<id>' declares no concepts (Law 2)`. That rule is already known to be in
dispute: `compositionContract.ts:484-497` carries a `TODO(THR-1053)` recording that the
contract and `EncounterAftermathChange.concepts`' own doc comment (THR-1004) say opposite
things, and noting that this single rule "is a large share of why the ratchet holds all
191 templates."

[THR-1053](https://linear.app/threadbare/issue/THR-1053/the-composition-contract-requires-concepts-on-every-aftermath-change)
names the fact that settles it — *"verify the linker's actual coverage of `detail`"* — and
that fact is now verified. In `buildAftermathConsequences.ts:498`:

```ts
const sentence = applyConceptDecorations(link(id, enrich(body)), change.concepts);
```

`link` (the narrative linker) runs on every change's `detail` **unconditionally**, before
and independent of `concepts`; `applyConceptDecorations` returns the paragraph unchanged
when `concepts` is absent (`:421`), and the module doc states both paths are "fail-open"
(`:80-82`). The adjacent comment is explicit: *"`concepts` merely decorates the sentence"*
(`:499-500`).

**So the type's THR-1004 comment is right and the contract rule is over-broad**: Law 2
reachability on `detail` is already delivered by the linker, and `concepts` adds a tooltip
decoration plus an icon-tile fallback. This is THR-1053's Done-when option (b).

**Consequence for this ticket: batch 1 authors no `concepts`.** Retrofitting it across 15
encounters before THR-1053 rules risks being wholly discarded work. THR-1053 is a
one-line design call now that its factual half is settled; the verdict is recorded on that
ticket.

### 2. The `images` block fails 14/14 on 27 missing library rows — one fix, not fifteen

Every nudge-era card names a `generic.*` imageTag, which is exactly what the THR-883
format lock requires (a card face is library-generic). The `generic.*` namespace exists
and is correct — `encounter-image-library.ts:627-652` ships 16 rows (`generic.focus`,
`generic.light`, `generic.dark`, `generic.luck`, `generic.oath`, …). The corpus names **27
further concepts nobody added rows for**, producing 56 card violations across all 14:

```
balm bond chaos coin ember force gambit insight knit listening mercy mind muster
order recall remembrance road scroll settling spark stakes stillness stonework
thicket time tracks water
```

Each `NUDGE_CONCEPT_ART` row is `[id, sphere, concept]` mapping to a generated plate at
`/concept-art/nudge/<name>.jpg`, so closing this is an **art-generation task**, not a data
edit. It is corpus-wide and belongs in front of the batches, not inside them — done
per-encounter it would be repeated 14 times and buried under prose review.

**This is the one decision the brief cannot make** — see § Decision required.

### 3. The two sequels have no nudge hand, and the contract has no shape for that

`full_moon_collection` and `grateful_kin` are consequence encounters: they carry
aftermath, cast and rewards but no test step, so the hand block reports "no nudge-bearing
step — nothing to check". Ruling 3 is explicit that this is not a waiver case —
*"a shape that cannot carry a block is a future encounter type with its own contract"*.
So the sequels need a **sequel contract** (hand-exempt by shape, aftermath-heavy), which
is a design artifact that does not exist yet.

**Consequence: the sequels are not in any batch.** They are contract-complete on every
block their shape can carry once finding 1 resolves. Filed as a follow-up rather than
forced through a contract written for test encounters.

### Note: the 2026-08-08 audit's "zero cast, zero rewardPool" is now stale

That audit found the slice authoring "zero cast bindings, zero `{cast:*}`, zero
reward-pool draws". Measured today the slice eight carry **cast and rewards on all eight**,
plus conditions/seeds/reputation — 3–4 systems each, at or above quota. THR-1044/1046/1047
closed that gap between 08-09 and 08-14. The retrofit is materially smaller than the plan
text implies, and the plan's §"The problem, from the audit" paragraph should be read as
history rather than current state.

## Batch 1 — the camp six

The camp seven are the actual pilot volume: 0–1 systems, no setting envelope, no cast
binding, no aftermath config, no outcome bands. Six of the seven run as batch 1 (ruling 1).

| # | Template | Reach | Decision shape | Tone target |
|---|---|---|---|---|
| 1 | `encounter.sharpen_blades` | iron | single test | craft, materials, patience |
| 2 | `encounter.ward_the_camp` | veil | single test | threshold, unseen pressure |
| 3 | `encounter.offer_small_prayer` | star | single test | devotional, small and sincere |
| 4 | `encounter.rest_and_reflect` | heart | single test | interior, companionable |
| 5 | `encounter.tend_to_wounds` | eye | single test | care, close attention |
| 6 | `encounter.scout_the_perimeter` | eye | single test | watchfulness, threat read |

**Why this six.** Reach coverage across the seven is iron ×1, veil ×1, star ×2, heart ×1,
eye ×2, so any six carries one duplicate. The `eye` pair is the duplicate worth keeping
together — `tend_to_wounds` (care) and `scout_the_perimeter` (threat) are the same reach at
opposite tones, which is exactly the side-by-side variance ruling 1 asks the batch report
to make visible. Holding `shrine_offering` (star, devotional) to batch 2 avoids pairing it
with `offer_small_prayer`, which would have been the batch's one weak contrast.

**Per-encounter targets** — every one of the six must leave the line with:

- **Setting envelope** — `settings` from the 8-class vocabulary + one opening per declared
  class, replacing the current `locationTypes: [...ALL_LOCATION_SUBTYPES]`. These are camp
  encounters: expect `wilderness` / `road` / `settlement-edge` classes, not all eight.
- **Cast** — ≥1 named scene actor as a real support binding, written role-voiced inline
  per ruling 6, with `{cast:*}` tokens only where the generated name earns something.
  These templates are `encounter.*`, which now has family default bundles (THR-1044).
- **Rewards** — something persistent: a `rewardPool` draw or an aftermath effect. The
  current `reputationDelta: 0.03`-class nudge does not clear THR-973's bar.
- **Aftermath** — an `aftermathConfig` with **≥3 `byOutcome` bands** (ruling 7 floor:
  success / failure / one extreme). All six currently author zero.
- **Systems quota** — ≥3 connections. Cast + rewards + aftermath seeds reaches it.
- **Register** — all six already pass the detectors with zero failures; keep it there.

**Not in scope for batch 1:** `concepts` (finding 1), `generic.*` image plates
(finding 2, corpus-wide), the sequels (finding 3).

## Batch 2 (sketch, not yet briefed)

`shrine_offering` (star) + the slice residue: `swindled_family`'s third outcome band, and
`full_moon_collection`'s third system connection. Small; may fold into batch 1's review if
batch 1 lands clean.

## Decision required before batch 1 runs

**The 27 missing `generic.*` card plates: generate, or remap?**

- **Generate 27 new plates** — every card keeps the concept its author chose; cost is 27
  art generations against the settled nudge-plate doctrine (object/effect-centred, no
  faces). Clears the `images` block on all 14 permanently.
- **Remap onto the existing 16** — no art cost, but ~27 cards lose their specific concept
  to a near neighbour (`generic.mind`→`focus`, `generic.time`→`time-slow`,
  `generic.spark`→`energy`, `generic.stonework`→`matter`). Several have no honest
  neighbour at all — `coin`, `road`, `water`, `tracks`, `listening` — so this is partly a
  remap and partly a smaller generation run regardless.

**Agent recommendation: generate, but not all 27 at once** — generate the ~12 with no
honest neighbour, remap the ~15 that have one, and re-run the gate. That clears the block
for a fraction of the art cost without flattening the card faces that carry real distinct
concepts. Approve, veto, or pick the other arm.

## Sampling

Per ruling 1 and Stage 5: on completion the batch report renders all six side by side, and
**2 of the 6** go to Christian in chat for verdict. Recommended sample —
`ward_the_camp` (thinnest start, veil) and `tend_to_wounds` (eye, care tone) — the widest
gap in the batch, so the sample tests the floor and the tone range at once.
