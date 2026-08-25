# Encounter Pipeline: The Sign Over the Ruin
> Scale: medium (2 steps, 0 branches) | Slug: `the-sign-over-the-ruin` | Pass: **final**
> templateId: `encounter.border.the_sign_over_the_ruin` · Batch: border-perils (THR-1221), row **2 of 6**
> Date: 2026-08-24 | Pipeline version: 2.0
> Status: **READY FOR IMPLEMENTATION**

---

## Pipeline Summary

| Pass | Verdict | Notes |
|------|---------|-------|
| Draft | Complete | Puzzle–Investigation–Resolution, `veil→eye`, four-class envelope; declared its Investigation prize but never wrote it into prose. |
| Editorial | PASS WITH REVISIONS | Delivered the withheld prize into step 0's bands, fixed four seam echoes and four verbless-fragment/aphoristic-inversion violations, rebalanced the Veil-member swap across both hands, retired the one annotation clause, and corrected three factual claims (the `under_watch` reader claim, the `success_at_cost` no-chip rationale, and where the clue's words live) against the live code. |
| Systems | READY FOR IMPLEMENTATION | Every id, effect kind, gate constant and mechanism verified live against source. Two real defects found and fixed directly: the `critical_success` chip's `PATH` category on a write nothing reads (re-categorised to `SCAR`), and the `critical_failure` action band's chips being unbacked on the path where step 0 alone rolls `critical_failure` and step 1 never runs (fixed by adding step 0's own `failureMetadata`). Both open Pass-3 questions from the revised file's § 16 (`$target` binding, `stateNoun.entityId` resolution) confirmed working by tracing the actual code paths. One small, non-blocking primitive gap logged as BACKLOG; no new engine work required to ship. |

### Caveats / Blockers

None. See the systems audit (`the-sign-over-the-ruin-systems.md`) for the full verification trail;
every finding there was either a confirmation of something already correct, or a fix already applied
below.

### Editorial Notes Summary

The editorial pass (verdict PASS WITH REVISIONS) found the packet's single most serious defect: the
design block declared an Investigation-gate prize (a lead on what the sign was aimed at) that the
prose never actually delivered — the step-0 bands said the shape "resolved," not what was learned.
Fixed by writing the lead into step 0's `criticalSuccessAfterimage` and `successAfterimage` (both
base text, so it holds under any subset of the nudge hand). Four boundary-sentence echoes were found
by reading each seam by hand (the class no automated detector sees) and fixed; four verbless opening
fragments and three aphoristic inversions were rewritten under the spec's plainness rules; one line
borrowed verbatim from the golden exemplar was replaced; the initiation was rewritten off a reporter
register. A hand-balance defect was found and fixed within the row's own card-type budget: the draft
had hand B carrying three gated cards against hand A's zero (a god without either Veil attunement or
a Humble agent was dealt three cards in two spheres at the deciding step) — the two Veil members were
swapped between the hands, raising the floor to four in both. One annotation clause (B4's effect
line) was found exactly at the encounter's budget of one and rewritten to zero. Three factual claims
were checked against the code and corrected: the `under_watch` chip's stated "reader" (none exists),
the `success_at_cost` band's no-chip rationale (two writes *do* fire on that band; they are reserved
to the bands they are about), and § 9.5's claim about where the clue's descriptive words live (they
now live in step 0's bands, not where the draft said). Step numbering was normalised to 0-indexed
throughout, since Pass 3 and Pass 4 read only this file. Full detail:
[`the-sign-over-the-ruin-editorial.md`](the-sign-over-the-ruin-editorial.md).

### Systems Pass Summary

Every declared id — nine `libraryCardId`s, four condition/trait ids, eight `imageTag`s, four cast
roles, every effect kind and field name — was checked against live source rather than trusted from
the packet's claims, per the honesty standard. All verified live. The dealt-hand recount (post Veil
swap) was re-derived from the actual runtime gating code (`buildNudgeHand`) rather than re-checking
the packet's own arithmetic: only `requiredTrait`/`requiresGroup`/`requiresFavor` ever *hide* a card;
sphere and essence-attunement gates only *dim* it (stay visible). Hand A's dealt size is a constant
5 for every god (nothing in it can hide); hand B's is 5 or 6 depending on whether the agent holds
Humble. Both sit inside the 4–6 doctrine on every run, not merely for a "mid-game god."

One real defect was found and fixed: the `critical_success` chip (`sign.the_place_is_watched`)
declared `category: 'path'` on a write (`condition_attachment` → `trait.condition.location.under_watch`)
that no system in the corpus reads. The write is real (chip-backable, Law 56 rule 0 satisfied), but
`PATH` specifically claims a forward-looking mechanical consequence — "a route learned... an offer
that will come round again... a door a later system can open" (`unifiedAction.ts`'s own doc comment,
which names this exact failure shape as the Unsafe Bridge defect) — and nothing acts on this write.
Re-categorised to `SCAR` / `loss` / `loss`, matching the identical write's category in
`the-unclaimed-relic-revised.md`, arrived at independently in that packet. Applied directly below,
not left as an implementer's caveat. Both open Pass-3 verification items the revised file's § 16
flagged were resolved by tracing the actual code: `$target` binds to the location for this template
family by construction (`generateUnifiedCandidates` always sets `targetId: locationId` for a
`locationSubtypes`-gated candidate), and `stateNoun.entityId` sentinels resolve through a dedicated,
gate-checked mechanism (`resolveAnchorDeclaration` / `chipAnchorViolations`).

A second, more consequential defect was found independently, matching a pattern the orchestrator
relayed from encounter 6's own critic mid-pass: **a chip can be backed by a write on a step that
never runs, and the static contract gate cannot see it.** Verified against the engine's own
`advanceStep`: a step's own `critical_failure` outcome *always* ends the action immediately,
overriding `continue_weakened` — so step 0 rolling `critical_failure` skips step 1 entirely. The
action-level `critical_failure` band's two chips were authored against step 1's `failureMetadata`
only, which never fires on that path — a live Law 56 violation invisible to `chipBackingViolations`,
which checks effect *presence* in the template, not step *reachability* on the band claiming it.
Fixed by duplicating the two effects onto step 0's own `failureMetadata` (§ 4), with one documented,
accepted trade-off on a rare compound path (an unchipped write, the same already-sanctioned pattern
the packet's own `success` band uses for `under_watch`). Full detail, including the full band-by-band
reachability table and the Composition Contract walked block by block against the live gate
functions: [`the-sign-over-the-ruin-systems.md`](the-sign-over-the-ruin-systems.md).

### Implementation File Map

| File | Action |
|---|---|
| `src/data/encounters/the-sign-over-the-ruin.ts` | **CREATE** — new encounter file, single-export `UnifiedActionTemplate` pattern (`road-ambush.ts`, `flawed-steel.ts`) |
| `src/data/unified-action-templates.ts` | **EDIT** — import near line 193; register in `RAW_UNIFIED_ACTION_TEMPLATES` (~5590) and `LOCATION_BRANCHING_ENCOUNTER_TEMPLATES` (~5678) |
| `src/data/content-eval/plotHooks.ts` | **EDIT** — stamp `usedBy` on `hook.celestial_sign` at closeout |
| `public/concept-art/encounters/the-sign-over-the-ruin.jpg` (or pipeline equivalent) | **CREATE** (art pipeline) — the two offering-heaps plate per § 11, no figures, no sign depicted |

No changes required to any `src/types/`, `src/engine/`, `src/data/condition-trait-content.ts`,
`src/data/nudge-card-library.ts`, or `src/data/encounter-image-library.ts` file — every id and
mechanism this encounter needs already exists.

---

## Encounter Packet

**Binding design:** [`Docs/plans/encounters/border-perils-batch-design.md`](border-perils-batch-design.md) § *2 · The Sign Over the Ruin*.
**Approved brief:** [`Docs/plans/encounters/border-perils-brief.md`](border-perils-brief.md).
**Authoring contract:** `.claude/skills/encounter-pipeline/reference/nudge-authoring-spec.md`.
**Worked example copied for shape:** `src/data/__fixtures__/nudge-exemplar/swollen-ford-exemplar.ts`.

This packet is prose + data specification, carried forward from the revised file with three Pass-3
data corrections applied: § 9.3's `critical_success` chip category (`PATH` → `SCAR`), § 9.4's family
attribution for the same write, and § 4's addition of `failureMetadata` to step 0 (closing an
unbacked-chip path on the `critical_failure` band) — each called out where it lands, with the full
reasoning in `the-sign-over-the-ruin-systems.md`. **Prose is unchanged from the revised file.** No
TypeScript was written and nothing under `src/` was edited by this pass.

---

## 1. Mechanical design block (spec step 1 — written before the first sentence of prose)

**0. The crux, in one plain sentence, from the agent's point of view.**
*A sign is hanging over the ruin on the agent's road, and everyone standing under it has already decided what it means except them.*

**0b. The title states the crux.** *The Sign Over the Ruin* — a player who reads only the title knows the objective (`reveal`) and where it is: there is a sign, it is over the ruin, and it wants reading. The title is fixed by the batch design row, so it is not a draft's to change; recorded here that it carries the objective rather than the complication, which the catalog rule accepts.

**Step numbering in this packet is 0-indexed throughout** — `steps[0]` is the `veil` step, `steps[1]` the `eye` step — matching § 3, § 4, § 5 and § 9 and the array the implementation writes. (The draft mixed 1-indexed and 0-indexed references to the same fields; normalised, because Pass 3 and Pass 4 read only this file.)

**0c. Catalogs** (one entry each, from `Docs/canon/encounter-catalogs.md`):

| Axis | Pick |
|---|---|
| Shape | `Puzzle–Investigation–Resolution` |
| Setting | `wayside` · `ruin` · `battlefield` · `stronghold` (all four, one opening each) |
| Pressure | `faith` (undertone `rumour`) |
| Form | `omen` |
| Objective | `reveal` |
| Stakes | `intel` |
| System (primary) | `traits` — with `conditions` and `movement`, all mature tier |

**0d. Plot-hook draw** (recorded, per THR-1147; the hook is a starting point, not a contract):

```
plotHookRolled: hook.trade_war, hook.celestial_sign, hook.haunt_resolution
plotHookTaken:  hook.celestial_sign
```

Take, verbatim from the table: *"Something impossible happened in front of witnesses, and the interpretations are already hardening into factions."* Drift from the hook: minimal. What the design added is the **investigation gate** — the hook gives you factions arguing; the design says nobody has actually read the thing yet, which is what makes the Puzzle shape earn its place. `usedBy` gets stamped on `hook.celestial_sign` in `src/data/content-eval/plotHooks.ts` at closeout.

**Consequence draw** (recomputed from the template id by `check:encounter`, so this is a claim the gate audits):

```
consequenceDraw: ['condition', 'knowledge', 'movement']
consequenceSwap: (none — all three wire in context; see § 9.4)
```

**1. Whose problem is this?** The agent's. The road runs across this ground and the ground has stopped working: a camp that will not break, a gate that will not open, a field nobody is gleaning. The agent is standing in a stalled place with a stalled argument in it, and the argument is about a thing that is *still there* over the stone. They are the only person present who has not already picked a side, which is exactly what makes reading it their problem rather than a spectacle they walk past. Not a bystander scene.

**2. Which reach does each step test, and why is that the theme?**
- **Step 0 — `veil`.** Veil is Seer ↔ Manipulator: reading a thing that resists being read. The scene grew from that. It is *about* whether you can hold your eye on an omen long enough to see its actual shape, when everyone around you has already stopped looking and started deciding. Chosen before a word of prose. The test is holding the eye on a thing that will not be read, not perceiving accurately — that second one is Eye, and it is step 1's.
- **Step 1 — `eye`.** Eye is Witness ↔ Judge: saying truly what you saw. Carryover step. It is *about* what a true statement is worth in a room that has already voted.

**3. Why is the agent here?** All four motive routes are honest: `chance` (their road crosses this ground), `mission` (sent through, and the ground is shut), `choice` (they came to see the sign, like everyone else camped here), `divine` (a thread pulled them to it). The complication does not care which — a road that has stopped is a road that has stopped.

**4. Which mechanics and objects play?** Decided now, so the prose can point at them:

| Mechanic / object | Where it plays | Classification (prose rule 7) |
|---|---|---|
| Trait continuum — `trait.core.core_humility.virtue` (**Humble**) | `traitVariants` + the step-1 trait card | **state read** — the variant gate |
| Condition — `trait.condition.terrified` | step 1 `failureMetadata.effects`, narrated by the failure-side chips | **state write** |
| Location condition — `trait.condition.location.under_watch` | step 1 `successMetadata.effects` on `$target` | **state write** |
| Clue edge — `spawn_clue` | step 0 `successMetadata.effects` | **state write** (fail-soft; deliberately unchipped, § 9.5) |
| Relocation intent — `agent_relocation` | step 1 `successMetadata` / `failureMetadata` | **state write** |
| Reward pool draw | step 0 `successMetadata.rewardPool` | **state write** |
| Cast binding — the first witness | `supportBundle`, introduced in the spine | **state write** (spawned/reused NPC) |
| Detection channel | the two Veil cards' `costs.detectionDelta` | **state write** |
| Omen emission | the step-0 Omen card's `grants` | **state write** |

Everything the base prose says about the agent's connections is **scene-local**: the pilgrim, the crowd, the two readings, the stone. The prose asserts no relationship, debt, prior visit or standing the graph does not hold. The only history it may narrate is history *this encounter mints* — which is why the pilgrim's fragment appears at the `critical_failure` ending and nowhere earlier.

**5. What are the rewards, and where does the tension sit?**
Base reward is `intel`: a reading the agent can state, and a lead the sign points at (`spawn_clue`). **The lead is delivered in step 0's base afterimages** — the sign was not aimed at this ground — so the declared prize is something the player actually reads, not only something the engine writes; the draft declared it and never wrote it, which is the editorial pass's most serious finding. A clean step 0 also turns up an object off the stone (`rewardPool`, possession). The penalty is concrete and game-legible: **Terrified** (iron −0.06 / shadow +0.04 for its duration) and a forced departure from this hex. Tension sits on step 1 — the reading is the easy half; saying it to people who have already decided is the half that costs. Quintessence stakes: **moderate.** Open-draw ambient content, so a critical failure is a rout and a fear, never a scripted death.

**6. Does the mortal make a choice in this scene?** **None — this is a test.** Written down as the spec requires. The fork the fiction offers (which side to please) is deliberately *not* offered: the mortal is reading and reporting, and the encounter's grimness is precisely that a true reading has no side to be on. The batch's fate-branching debut is row 4 (`standing_the_line`), not this one; authoring a second fork here would duplicate it.

**7. Every promise pays off.** The opening makes the player lean forward at *what is over the stone*. That is the Investigation gate's prize and it is answered **behind step 0's outcome bands** — the base afterimages at `critical_success` and `success` say what the reading turned up — never in the opening prose (the shape's rule). The second promise — the pilgrim who stands there and says nothing — is answered at the `critical_failure` ending, where they are the one person on the ground who does not turn. No third mystery is opened.

**8. Systems quota — connections beyond the core test.** Counted from the **authored manifest**, which is what `check:encounter` counts:

1. **cast** — `supportBundle` binds the first witness (spawned or reused NPC, portrait, cast strip, click, `must-persist`).
2. **rewards** — `successMetadata.rewardPool` on step 0 (possession draw, no `tagFilters`).
3. **conditions** — `condition_attachment` twice: `terrified` on the agent, `under_watch` on the location.

**Count: 3.** Clears the floor (`COMPOSITION_SYSTEMS_QUOTA_MIN`). Prose-only connections are counted as zero and are not claimed here.

**Reachability (THR-821).** Open-draw ambient (`intrinsicTier: 'background'`), so both steps sit at or under `NUDGE_OFF_REACH_MAX_DIFFICULTY` (0.45): **0.40** and **0.42**, both rendering `fair`. This is the open-draw branch of the reachability rule — the same branch The Swollen Ford demonstrates. A `severe` step on an open draw would be a decorative hand.

**Scene tag:** `ruin.sign.contested` (WS4 vocabulary; until the manifest carries it the fallback chain ends at EntityVisual). **`illustrationUrl`:** none declared.

---

## 2. The scene-writer's checklist — 14 questions + the envelope question, answered in writing

**A. Build the scene**

- **A1 · Where are we?** Four grounds, each with a broken structure on it, each sketchable before anything happens: a split tower over a ruin field; a burnt stone barn on a churned battlefield; a roofless waystation beside a wayside camp; a burnt suburb outside a shut fort gate. The spine calls the broken structure "the ruin" and "the broken stone", and **every opening now puts stone on its ground** — fallen blocks, a stone barn, a stone doorframe, stone doorways. That was the draft's one real class-honesty failure: the whole encounter says "the stone" nineteen times and two of the four openings had never established one, so at the wayside and the stronghold the agent was climbing a stone nobody put there.
- **A2 · How does it feel?** Two-plus senses beyond sight in every opening: wet ash and frost (ruin); crows and wet iron (battlefield); cold rain and smoke that will not lift (wayside); woodsmoke and the cold coming off the wall (stronghold). Each is now a subject-and-verb sentence rather than the verbless sensory fragment the draft used in all four — plainness move 1, and the construction THR-974 names as its counter-example.
- **A3 · Who is here?** Every opening accounts for its people before they act — the camped thirty, the stopped carters, the fifteen travelers, the garrison and the forty on the road. The **pilgrim** (the cast binding) is introduced in the setting-neutral spine, so they exist at all four classes before any later prose refers to them.
- **A4 · What must we know?** That the sign came down here in front of everyone, that everyone here saw it, that the ground has stopped working because of it, and that nobody has actually read it. All stated before the first step is asked for, and now split cleanly across the three surfaces: the **opening** owns the place and the people at odds, the **initiation** owns the arrival and the stopped ground, the **spine** owns the remnant, the two readings, the pilgrim and the fact that everyone who looked steadily looked away. The draft had the initiation and the spine both saying nobody had read it, in two voices, two beats apart. What the sign *is* is deliberately withheld — that is the Investigation gate's prize, and it is paid out in step 0's bands.
- **A5 · Does the complication come last?** Yes. Each opening builds the place, then lands the split on top of it; the spine lands the unread thing on top of the split.

**B. Internal logic**

- **B6 · Nothing referred to before it is introduced.** The stone, the remnant over it, the two readings, the crowd, the pilgrim, and the cost of looking all appear in the spine before any card, factor line or band names them. Each opening drives its own scenery (barn, waystation, parapet) so no spine sentence leans on scenery only one class has.
- **B7 · Every event has a visible cause.** The ground has stopped because the argument has stopped it. The readings hardened because the people who looked longest looked away first and got loud. The reading costs sight because the remnant does not move the way light moves.
- **B8 · No contradictions.** One ground, one broken structure, one remnant over it, one argument. The hour is set once, in the initiation ("at first light"), and the spine anchors the pilgrim on it; the openings no longer restate it. That fixes a seam echo as well as a redundancy — the ruin opening used to end on "arguing since first light" three sentences before the spine's "stood here since first light", and the stronghold opening's "since dawn" was the same clock in a synonym. The wayside's "cold rain since noon" sets the weather, not the arrival, and does not collide.

**C. Human realism**

- **C9 · Would a real person do this?** Yes: strangers pitch closer together when frightened, gleaners stop work to watch, a garrison shuts a gate and shouts over it, and a pilgrim who has walked to a sign stays with it. Nobody walks into anyone's camp uninvited.
- **C10 · Do people react like people?** The two groups on the battlefield stand apart and stop speaking. The wayside camp has not eaten. The fort shouts across a shut gate. Nobody in the crowd is waiting to be persuaded, and step 1's prose says so plainly.
- **C11 · Do actions carry their true cost?** Looking steadily costs sight and nerve (the glare in the `success_at_cost` afterimage, `terrified` on the failure side). Speaking costs the ground you were standing on (`agent_relocation`). The cards' prices are essence, detection, and being the person the trait names.

**D. The interactive layer**

- **D12 · Can the player restate the stake in one sentence?** *"Does the agent get a true reading of what is over the stone and get it heard — or do they come down with the wrong shape and get run off the ground for saying it?"* Good outcome, concretely: a reading they can state, a lead on what the sign was aimed at, an object off the stone, and enough of the crowd looking again to matter. Bad outcome, concretely: certainty in a shape that was not there, **Terrified**, and a road out of this hex with no plan past it.
- **D13 · Is every card grounded?** Delete the remnant over the stone and the crowd underneath it, and every card in both hands is senseless here. Hand A acts on the stone, the light on it, the body's endurance in front of it, and the god's own visibility while helping. Hand B acts on the crowd's faces, its memory, its search for a hand behind the reading, and the voice trying to carry over it.
- **D14 · Does every card state mechanism, not mood?** Every `effectLine` says what the god does and why that moves the odds, in plain words, no digits and no `%`. The pip row renders magnitude.
- **D15 · Does every declared class have an opening?** Yes — four declared, four written (§ 3). `validateSettingEnvelope` enforces it build-time.

---

## 3. Setting envelope — four openings + the setting-neutral spine

```
settings: ['stronghold', 'ruin', 'wayside', 'battlefield']
locationSubtypes: expandSettings(['stronghold', 'ruin', 'wayside', 'battlefield'])   // derived, never hand-written
```

`urban`, `rural`, `sacred`, `arcane` are excluded batch-wide. Four classes means **no THR-1044 family default applies**, so the template declares its own `supportBundle` (§ 8).

### `openings.ruin` (58 words)

> Half a tower still stands over the rest of it, split top to bottom, the stair inside open to the sky. Wet ash hangs on the air, and frost still sits on the fallen blocks. Thirty-odd people are camped in the lee of the wall. They have been arguing all morning about what they all watched happen here.

### `openings.battlefield` (59 words)

> The field is churned black and picked over. A stone barn on the ridge is burnt out, one gable standing. Crows have the run of it, and the air smells of wet iron. The carters and gleaners working the ground have stopped. They are standing in two groups on either side of the barn, not speaking to each other.

### `openings.wayside` (58 words)

> The camp sits against an old waystation, roofless, its stone doorframe still square. Cold rain has fallen since noon, and the smoke will not lift. Fifteen travelers have their fires going under the wall, pitched closer together than strangers usually pitch. Nobody has eaten. They have been at the same argument since it came down over the waystation.

### `openings.stronghold` (57 words)

> Outside the fort's gate the old suburb is a burnt shell, roofbeams down, stone doorways standing. Woodsmoke hangs over it, and the cold comes off the wall. The gate is shut. The garrison is up on the parapet and forty people are on the road below, and they have been shouting each other down ever since.

### The spine — `steps[0].narrativeTemplate` (66 words, setting-neutral)

> What crossed the sky over the ruin has not finished. A remnant of it hangs low over the broken stone, and it does not move the way light moves. Two readings have hardened already: a blessing, or a warning, each with people behind it. A pilgrim who has stood here since first light watches and says nothing. Everyone who tried to look steadily looked away first.

**No class scenery in the spine.** "The ruin" and "the broken stone" read as the split tower, the burnt barn, the roofless waystation and the burnt suburb without naming any of them — and after the opening rewrites, all four grounds have put stone under the agent's feet before the spine says "the broken stone".

### `narrativeTemplates.initiation` (scene class, 37 words)

> The sign came down over this ground at first light and it has not gone. Everyone standing here watched it arrive. Nobody has moved off this ground since, and nobody has done a day's work on it.

*Rewritten from the draft's version, which was the packet's one piece of reporter prose (four flat statements, the last of them passive and inverted — "has been read by nobody who stayed looking") and which restated the spine's closing line two beats before the spine got to it. The initiation now owns the arrival and the stopped ground; the spine owns the looking. The archaic clock reference ("by the ninth hour") went with it — the game has no ninth hour, and rule zero prefers the plain sentence.*

### `steps[1].narrativeTemplate` (40 words, setting-neutral)

> They come down off the stone with a reading. The ground turns to hear it, and nobody in it is waiting to be persuaded. Both sides already know which answer they want back, and both are counting who says what.

---

## 4. Steps and test-panel data

### Step 0 — `veil` · *Read the sign*

| Field | Value |
|---|---|
| `reach` | `veil` |
| `purposeLine` | **"Read the sign"** (3 words, ≤ `REACH_PURPOSE_MAX_WORDS`) |
| `difficulty` | `0.40` → renders **fair**; inside the open-draw ceiling (0.45) |
| `duration` | `{ min: 1, max: 2 }` |
| `failBehavior` | `continue_weakened` — a bad reading is still a reading, and step 1 has to carry it. **Except for `critical_failure`, which the engine always treats as an immediate `fail_action` regardless of this setting — see the Pass-3 note below.** |
| `factorLines` | **none authored** (the variance rule, THR-892) |
| `successMetadata` | `rewardPool: { categoryWeights: { possession: 1.0 } }` · `effects: [spawn_clue]` |
| `failureMetadata` | **added, Pass 3.** `effects: [condition_attachment → terrified on $actor, agent_relocation → away(3) on $actor]` — see the note immediately below |
| `nudges` | Hand A (§ 5.1) |

**Why no authored factor lines.** "The remnant does not move like light", "the glare is bad", "everyone here already has an opinion" are true on *every* run of this encounter, so they are priced into `difficulty: 0.40` and carried by the prose. What fills the panel is derived: the actor's `veil` capability, terrain and place modifiers, equipment, live conditions, divine attention. No `tagFilters` on the reward pool — a filter naming a tag no attachment template carries is a silently empty pool.

> **Systems-pass finding and fix: `critical_failure` at step 0 was unreachable-backed for the
> action-level `critical_failure` chips.** Verified against `advanceStep`
> (`src/engine/unifiedActionLifecycle.ts:167-194`): a step's own `critical_failure` outcome
> **always** triggers the hard `fail_action` branch — *"critical_failure always triggers fail_action
> regardless of template setting"* (the function's own doc comment) — so step 0's
> `failBehavior: 'continue_weakened'` does **not** save a `critical_failure` roll the way it saves a
> plain `failure`. When step 0 itself resolves `critical_failure`, the action ends immediately with
> `outcome: 'critical_failure'` and **step 1 never runs**. Before this fix, the action-level
> `critical_failure` band's two chips (§ 9.3: `sign.what_the_looking_cost_worse` — Terrified,
> `sign.run_off_the_ground` — the relocation) were backed **only** by step 1's `failureMetadata` —
> which on this reachable path never fires, because step 1 never starts. That is a live Law 56
> violation reachable at runtime, invisible to `chipBackingViolations` because that gate checks
> whether an effect is *declared somewhere in the template*, not whether the step carrying it is
> *reachable on the band in question* — the same defect class independently found by encounter 6's
> critic in this batch, applied here via a different mechanism (a hard-coded severity override
> rather than a plain `fail_action` first step).
>
> **Reachability, band by band** (both steps' outcomes are recorded in `stepOutcomes`; the action's
> own outcome is `computeFinalActionOutcome`'s result, or the immediate hard-failure override):
>
> | Action band | How reached | Step 1 runs? | Chip backing |
> |---|---|---|---|
> | `critical_success` | Both steps ran, clean, a crit landed somewhere (`computeFinalActionOutcome`) | Always | Step 1 `successMetadata` — fires ✅ |
> | `success` | Both steps ran, plain successes only | Always | Step 1 `successMetadata` — fires ✅ |
> | `success_at_cost` | Both steps ran; step 0 or step 1 incurred a cost/near-miss/non-critical failure that did not hard-fail | Always | No `changes` authored on this band (deliberate) — N/A |
> | `failure` | Step 1 itself resolves `failure` (its own `failBehavior: 'fail_action'` ends the action there) | Always (step 1 is what produced the outcome) | Step 1 `failureMetadata` — fires ✅. **When step 0 itself also resolved a plain `failure` on the way here** (the commonest route to this band, since `continue_weakened` carries a −0.06 carryover into a step already at 0.42), step 0's own `failureMetadata` fires too — see the doubling note below. |
> | `critical_failure`, path A | **Step 0 alone** resolves `critical_failure` — immediate hard-fail, bypassing `continue_weakened` | **No** | Step 1 `failureMetadata` never fires — **was unbacked; now backed by step 0's own `failureMetadata` (added above)** |
> | `critical_failure`, path B | Step 0 continues (any non-critical outcome), then step 1 itself resolves `critical_failure` | Yes | Step 1 `failureMetadata` — fires ✅ (and step 0's new `failureMetadata` also fires if step 0's own outcome was a plain `failure` — see the doubling note below; both firings back the same chips, so backing is not in question, only the state write underneath it) |
>
> **The fix.** Step 0's `failureMetadata` is added, above, duplicating step 1's two `critical_failure`-band
> effects. This closes path A completely — the chips are now backed on every path that reaches the
> `critical_failure` band. **One accepted, deliberate trade-off, not a new violation:** step 0's
> `failureMetadata` fires on *any* `isStepFailure` outcome, and the two-bucket
> (`successMetadata`/`failureMetadata`) schema has no way to gate an effect to *only* a step's own
> `critical_failure` and not its plain `failure` — no `EffectPredicate` member reads step-outcome
> severity (`src/types/effects.ts:30-56`). So on the compound path "step 0 fails plainly, step 1 also
> resolves `failure` or `critical_failure`" — which is not rare; it is the ordinary route to the
> template's own most likely bad ending — both steps' `failureMetadata` fire.
>
> **Measured behaviour of the repeat write, corrected at Pass 3b (package critic) from this section's
> original claim of "harmless… idempotent-ish":**
> - **`agent_relocation` is genuinely idempotent.** `setRelocationIntent`
>   (`relocationIntent.ts:248-253`) writes through `graph.updateNode`, replacing any intent already
>   there. Last write wins; a repeat firing changes nothing.
> - **`condition_attachment` is not idempotent in any sense.** The handler
>   (`encounterAftermath.ts:2345-2364`) adds a `has_trait` edge **unconditionally** — there is no
>   already-holds-it check anywhere in the case — and the edge id is keyed on the tick
>   (`has_trait_${target}_${templateId}_${tick}_${i}_s${s}`). Step 0 and step 1 resolve on different
>   ticks (step 0 carries `duration: { min: 1, max: 2 }`), so the two firings write **two distinct
>   edges**, not one edge twice.
>
> **Three consequences of the two edges, none of them cosmetic:** (1) `collectAttachmentEffects`
> (`effects/effectWalker.ts:66-93`) iterates every `has_trait` edge with no dedupe by node id, so
> Terrified's iron −0.06 / shadow +0.04 modifier is pushed twice and sums to −0.12 / +0.08; (2) the
> Attachments sheet shows two rows with two independent `ticksRemaining` countdowns; (3) the mercy
> reaction (`sign.take_the_fear_off_them`) declared `remove_condition` with no `removeAll`, and the
> handler removes only the **oldest** edge — so the click promising "let them put it down" left the
> mortal still Terrified on exactly this path.
>
> **The compensating change, applied:** `sign.take_the_fear_off_them` now sets `removeAll: true`, so
> the reaction actually delivers what it promises regardless of how many Terrified edges are present.
> This does not eliminate the double write — the double is **accepted**, as the only shape the
> two-bucket schema admits that still backs path A's chips — it only repairs the one player-facing
> symptom (a click that silently under-delivered). The reach-modifier stacking (iron/shadow doubling)
> and the two-row sheet are cosmetic-but-real remainders of the accepted trade, left as the narrative
> rough edge the paragraph below describes. The only clean route to a *single* write on this path is
> the step-outcome-severity `EffectPredicate` the effect schema does not have today — logged in the
> systems audit (`the-sign-over-the-ruin-systems.md` § "Missing Primitives, revised") as BACKLOG, not
> attempted here, since `removeAll: true` already closes the load-bearing player-facing defect (a
> reaction that silently did half of what it said) without it.
>
> On the narrower compound path "step 0 fails plainly, the action continues, step 1 later succeeds"
> (final outcome `success_at_cost`, which authors no `changes` by design), the Terrified condition and
> the away-relocation intent fire once each and **unchipped**. This is not a rule violation — an
> un-chipped write is an already-established, already-sanctioned pattern in this very packet (§ 9.3's
> `success` band deliberately leaves the `under_watch` write unchipped for an analogous reason) — but
> it is a narrative rough edge worth one line in the batch report: a mortal who stumbled on the
> reading and then still got it said may walk away quietly Terrified and drifting off-hex with no chip
> explaining why.

### Step 1 — `eye` · *Say what is there*

| Field | Value |
|---|---|
| `reach` | `eye` |
| `purposeLine` | **"Say what is there"** (4 words) |
| `difficulty` | `0.42` → renders **fair**; inside the open-draw ceiling |
| `duration` | `{ min: 1, max: 1 }` |
| `failBehavior` | `fail_action` |
| `carryoverFactorLines` | the six below — the one authored factor surface besides trait lines, variant by construction |
| `successMetadata` | `effects: [condition_attachment → under_watch on $target, agent_relocation → nearest_settlement]` |
| `failureMetadata` | `effects: [condition_attachment → terrified on $actor, agent_relocation → away(3)]` |
| `nudges` | Hand B (§ 5.2) |

**`carryoverFactorLines`** — keyed on the band step 0 rolled, so a different roll shows a different line or none. Each ≤12 words, each naming its cause in the sentence (canon rule 1), never in a label beside it:

| Prior band | `text` | `polarity` | `forecastDelta` |
|---|---|---|---|
| `critical_success` | "They read it edge to edge, and it shows when they speak." | `for` | `+0.05` |
| `success` | "They came down with a reading they can state plainly." | `for` | `+0.03` |
| `success_at_cost` | "The glare from the stone is still in their eyes." | `against` | `−0.02` |
| `near_miss` | "They half-read it on the stone, and they know it." | `against` | `−0.03` |
| `failure` | "They are speaking with no reading to stand on." | `against` | `−0.06` |
| `critical_failure` | "They are certain, and certain of the wrong shape." | `against` | `−0.08` |

**Forecast arithmetic** (recomputed after the Veil swap, § 5). Step 0: `0.40 + 0.35` (full hand) = `0.75`. Step 1: `0.42 + 0.39` (full hand) `+ 0.05` (best carryover) `+ 0.03` (trait variant) = `0.89`. Both inside `[0, 1]`, so no card in either hand buys nothing, and both hand totals sit far under `NUDGE_HAND_MAX_TOTAL_DELTA` (0.70).

---

## 5. The hands — cut from the 21-type library

**Every card matching a library member sets `libraryCardId`** (the brief's instruction: `cardPlayTally`, the twilight harvest and the echo card have had zero data because zero authored templates set it). Faces are **library-generic** — the `name` and `fiction` below are the authored library faces from `CARD_CONTENT` in `src/data/nudge-card-library.ts`, unchanged, because a card face that differs from its library member's face is not that card.

**Type budget (binding, from the batch design):** `whisper`, `omen`, **`veil`**, `boost` (≤2 per hand), `trait_card`, `mercy`. Six types.

**Two faces deal at both steps, and the editorial pass confirmed this is forced rather than lazy.** `SPHERE_SIGNATURES` signs exactly one type per sphere, so the spheres reachable inside this budget are exactly four — `light` (whisper), `time` (omen), `darkness` (veil), `energy` (boost). `HAND_SPHERE_COVERAGE_MIN` is 4, so both hands must carry one of each. Of the four, only `whisper` and `veil` have a **second sphere-carrying member** to spend (the attunement members, THR-1180); `omen`'s other member is the sphere-less `card.omen.hunger.wander` and `boost`'s others are the sphere-less `core` and `variation.patient`. **Two repeated faces is the minimum this budget admits.** The alternatives were enumerated and rejected: reaching outside the budget renegotiates the row (and spends card types the batch allocated to other encounters for anti-convergence); authoring a one-off card of a budget type at another sphere costs the brief's `libraryCardId` telemetry and breaks the library's sphere-voice rule; substituting the sphere-less second members drops coverage to three. **If the batch wants zero repeats, row 2's budget needs a fifth sphere-signing type — a batch-design change, not a draft's.**

What the repeat must *not* be is the same play twice, and it is not: the Omen carries its `emit_omen` grant at step 0 and deliberately does not at step 1; the Boost buys the eye at step 0 and the voice at step 1, with the same verb in both effect lines so the player reads one card doing its one thing in two places; and all four band fragments differ.

**Where the two-member types split across the hands, the deeper member sits in the hand that can afford to lose it.** Hand A deals `card.veil.attunement.darkness` (unlocks at 20 lifetime essence through darkness) and hand B deals `card.veil.signature.darkness` (starting); hand A deals `card.whisper.signature.light` (starting) and hand B deals `card.whisper.attunement.light` (unlocks at **60** — the library's second attunement mark, and its highest bar). The draft had it the other way and under-counted the result: hand A carried **no** gated card while hand B carried three, so a god without light attunement, darkness attunement, or a Humble agent was dealt **three** cards in two spheres at the encounter's deciding step — under the 4–6 dealt-size doctrine. As allocated here the ungated floor is **four in both hands**. Recorded for the systems pass: hand B's largest card is a late-run unlock by construction, which is a decision rather than a side effect, and the only way to move it is to give hand B `card.whisper.signature.light` — A2's face, taking the packet from two repeated faces to three.

### 5.1 Hand A — step 0, reading the sign (5 cards)

| # | Type | `libraryCardId` | `name` | Sphere | Essence | `forecastDelta` | Rider | `imageTag` |
|---|---|---|---|---|---|---|---|---|
| A1 | Boost | `card.boost.core` | A Little More | — (common, ungated) | 1 | +0.06 | — | `generic.focus` |
| A2 | Whisper | `card.whisper.signature.light` | Plain Sight | `light` | 2 | +0.08 | — | `generic.light` |
| A3 | Omen | `card.omen.signature.time` | This Has Happened | `time` | 1 | +0.05 | — | `generic.time-slow` |
| A4 | Veil | `card.veil.attunement.darkness` | Nothing To Find | `darkness` | 3 | +0.06 | — | `generic.dark` |
| A5 | Boost | `card.boost.signature.energy` | A Sudden Surge | `energy` | 2 | +0.10 | — | `generic.energy` |

Spheres: 4 ✓ · ungated sphere-less option: A1 ✓ · riders: **0** ✓ · boosts: 2 ✓ · distinct types: 4 ✓ · hand size 5 (4–8) ✓ · hand total `+0.35`. One gated card (A4, on darkness attunement at the first mark), so the **dealt** hand lands at 4–5.

**The two Boosts answer different questions**, which is the whole of the no-two-cards rule: A1 buys *attention that does not slip* while an argument runs behind them; A5 buys *endurance past the point a person stops looking*. One is about the eye, one is about the body, and the scene establishes both (the arguing behind them; the ones who tried to look steadily and looked away first).

---

**A1 · Boost — `card.boost.core` "A Little More"** · common pool, ungated · 1 essence · +0.06

- `fiction`: *"Most things fail by a margin."*
- `effectLine`: **"You steady their attention, so the eye stays on the stone instead of on the argument behind them. A small help."**
- `bandProse`:
  - `success`: "Held steady, they read the whole of it and not the loudest part of it."
  - `near_miss`: "They kept looking after everyone else stopped. The shape still slid out from under the reading."

**A2 · Whisper — `card.whisper.signature.light` "Plain Sight"** · `light` · 2 essence · +0.08 · `reveals: 'next_step_demand'`

- `fiction`: *"Nothing was hidden. It was only unlit."*
- `effectLine`: **"You put light under the remnant so its edges show, and you show them what the next test will ask for before they spend on this one. A real help."**
- `bandProse`:
  - `critical_success`: "Lit from underneath, the whole span of it read edge to edge."
  - `failure`: "The light landed on the stone and showed every crack in it. What sat above the stone stayed unlit."

*(The draft's failure fragment opened "The light came true and showed them the stone" — the golden exemplar's own line, verbatim in its first four words. The exemplar is the quality bar, not a phrase bank.)*

**A3 · Omen — `card.omen.signature.time` "This Has Happened"** · `time` · 1 essence · +0.05

- `fiction`: *"Nothing happens only once."*
- `effectLine`: **"You give them the sense they have stood under this before, so the strangeness stops arguing with their eyes. A faint help, and the days after bend toward what stood over this ground."**
- `grants`: `[{ kind: 'emit_omen', category: 'cultural', intensity: 0.35, scope: { kind: 'global' }, sphereAlignment: 'time', narrativeHook: 'A sign came down over the border ground and was read out loud, and the country has begun repeating both readings.' }]`
- `bandProse`:
  - `success_at_cost`: "It steadied their eyes, and left them sure they had lost an hour they could not account for."
  - `near_miss`: "It read as familiar from top to bottom. It was not."

**A4 · Veil — `card.veil.attunement.darkness` "Nothing To Find"** · `darkness` · 3 essence · +0.06 · `costs: { detectionDelta: -0.2 }` · unlocks at 20 lifetime essence through `darkness`

*The type's content debut — `veil` is one of the eight library types with zero authored users corpus-wide. Both members deal in this encounter, one per hand.*

- `fiction`: *"A practiced hand leaves less than a careful one."*
- `effectLine`: **"You work the dark in close with a practiced hand, so the reading comes easier and no rival god finds a trace of your work on it. A small help, at a steep price in essence."**
- `bandProse`:
  - `success`: "The reading came easier than it should have, and left no mark for anyone else to find."
  - `critical_failure`: "No rival will ever trace the hand in this. There is little left to trace it to."

**A5 · Boost — `card.boost.signature.energy` "A Sudden Surge"** · `energy` · 2 essence · +0.10

- `fiction`: *"Bodies hold more than they admit."*
- `effectLine`: **"You put a body's reserve behind them, so they keep looking past the point where a person stops. A real help."**
- `bandProse`:
  - `critical_success`: "They outlasted it. The shape gave up first and showed them its whole edge."
  - `failure`: "They looked long past their limit, and the shape stayed as blurred as when they started."

**Hand A band coverage:** `critical_success` (A2, A5) · `success` (A1, A4) · `success_at_cost` (A3) · `near_miss` (A1, A3) · `failure` (A2, A5) · `critical_failure` (A4). **All six `StepOutcome`s covered.** Every card carries at least one failure-texture fragment (`near_miss` / `failure` / `critical_failure`). No card reaches `NUDGE_BIG_DELTA` (0.15), so no card owes both failure bands.

### 5.2 Hand B — step 1, saying it (6 cards)

| # | Type | `libraryCardId` | `name` | Sphere | Essence | `forecastDelta` | Rider | `imageTag` |
|---|---|---|---|---|---|---|---|---|
| B1 | Mercy | `card.mercy.core` | Not The Worst | — (common, ungated) | 1 | +0.02 | `no_crit_fail` | `generic.mercy` |
| B2 | Whisper | `card.whisper.attunement.light` | The Whole Shape | `light` | 2 | +0.09 | — | `generic.crowd` |
| B3 | Omen | `card.omen.signature.time` | This Has Happened | `time` | 1 | +0.05 | — | `generic.time-slow` |
| B4 | Veil | `card.veil.signature.darkness` | No One Saw | `darkness` | 2 | +0.05 | — | `generic.dark` |
| B5 | Boost | `card.boost.signature.energy` | A Sudden Surge | `energy` | 2 | +0.10 | — | `generic.energy` |
| B6 | Trait card | `card.trait_card.core` | Who They Are | — | **0** | +0.08 | — | `generic.oath` |

Spheres: 4 ✓ · ungated sphere-less option: B1 ✓ · riders: **1** ✓ · boosts: 1 ✓ · distinct types: 6 ✓ · hand size 6 (4–8) ✓ · hand total `+0.39`. Two cards are gated (B6 on the trait, B2 on light attunement at the second mark), so the **dealt** hand lands at 4–6, which is the dealt-size doctrine.

---

**B1 · Mercy — `card.mercy.core` "Not The Worst"** · common pool, ungated · 1 essence · +0.02 · **rider `no_crit_fail`**

*The hand's **one** rider, and the justification the checklist demands: this scene's disaster band is the one where a true reading gets its speaker named as the cause. Mercy is the only card that answers "how far down can this go", and a second rider would answer that same question twice.*

- `fiction`: *"Failing is survivable. Some failures are not."*
- `effectLine`: **"You take the floor out from under the disaster: it can still go badly, and it cannot go all the way down."**
- `bandProse`:
  - `near_miss`: "They stopped one sentence short of the one the crowd was waiting for. That sentence was the dangerous one."
  - `failure`: "It went badly and went no further. The ground stayed a crowd."

*(`no_crit_fail` remaps `critical_failure` → `failure`, so `failure` and `near_miss` are the failure bands reachable while this card is active. Both carry a fragment.)*

**B2 · Whisper — `card.whisper.attunement.light` "The Whole Shape"** · `light` · 2 essence · +0.09 · unlocks at 60 lifetime essence through `light`

*No `reveals` on this card, deliberately: `NudgeRevealKind` has one member, `next_step_demand`, and this is the final step. A card printing a reveal it cannot deliver would be a promise the surface breaks. The light-sphere help here is the reading of the **room**, which is what its effect line says.*

- `fiction`: *"Long looking shows what one glance cannot."*
- `effectLine`: **"You show them the room's real temper before they open their mouth: which faces are settled, and which are still open. A real help."**
- `bandProse`:
  - `critical_success`: "They spoke to the three faces still open, and the rest of the ground followed those three."
  - `failure`: "They read the room right and said it anyway. Being right about the room changed none of it."

**B3 · Omen — `card.omen.signature.time` "This Has Happened"** · `time` · 1 essence · +0.05 · *no grant on this instance*

*The step-0 instance carries the `emit_omen` grant. This one does not, because a grant fires once per committed card and emitting the same cultural omen twice in one encounter would double a world change the fiction only made once.*

- `fiction`: *"Nothing happens only once."*
- `effectLine`: **"You give the ground the sense it has heard this said before, so a new answer lands on them as an old one. A faint help."**
- `bandProse`:
  - `success`: "It landed as if it had been agreed a long time ago."
  - `near_miss`: "The ground half-remembered agreeing, and stopped there."

**B4 · Veil — `card.veil.signature.darkness` "No One Saw"** · `darkness` · 2 essence · +0.05 · `costs: { detectionDelta: -0.12 }` · starting member, ungated

- `fiction`: *"The kindest help leaves no fingerprints."*
- `effectLine`: **"You draw the dark in close while the words land, so the ground's own readers find no god in them. A small help, and your hand goes unseen."**

*(The draft's line here read "You leave less behind than a careful hand would…", which matches `NOT_X_BUT_Y_PATTERNS[3]` — `/\bless\s+[a-z]+\s+than\s+[a-z]+/i` — and was the encounter's **one** annotation clause, exactly at `ANNOTATION_MAX_PER_ENCOUNTER` while the self-audit claimed zero. The count is now genuinely zero. The card's library quote does **not** match the pattern: it needs a word between `less` and `than`.)*
- `bandProse`:
  - `success_at_cost`: "No one found a divine hand in what was said. They found one in the person who said it."
  - `critical_failure`: "There was no fingerprint on it. The ground did not need one to name a culprit."

**B5 · Boost — `card.boost.signature.energy` "A Sudden Surge"** · `energy` · 2 essence · +0.10

- `fiction`: *"Bodies hold more than they admit."*
- `effectLine`: **"You put a body's reserve behind the voice, so it carries over the shouting instead of folding under it. A real help."**
- `bandProse`:
  - `success`: "The voice came out over the top of both sides and held there long enough."
  - `critical_failure`: "The voice carried. It carried far enough for the back of the crowd to hear the part that damned them."

**B6 · Trait card — `card.trait_card.core` "Who They Are"** · `requiredTrait: 'trait.core.core_humility.virtue'` · **0 essence** · +0.08

*Cost 0 because the price was paid by being this person. Hidden — never dimmed — for an agent who does not hold the trait; unlocked into the hand by the template's `traitVariant` via `addNudgeIds`. The card reads **only** the trait it is gated on: coming down off the stone with a reading is scene-local fact, being Humble is the state read. No invented history.*

- `fiction`: *"Character is the one resource nobody spends."*
- `effectLine`: **"No essence. Being Humble, they put it out as one reading, and a ground that expected a verdict hears an offer instead."**
- `bandProse`:
  - `critical_success`: "They gave it as their reading, and the ground took it out of their hands and argued it fairly."
  - `failure`: "They offered it as one answer among several. The ground was past the point of taking offers."

**Hand B band coverage:** `critical_success` (B2, B6) · `success` (B3, B5) · `success_at_cost` (B4) · `near_miss` (B1, B3) · `failure` (B1, B2, B6) · `critical_failure` (B4, B5). **All six `StepOutcome`s covered.** Every card carries at least one failure-texture fragment. No card reaches `NUDGE_BIG_DELTA`.

---

## 6. Band base prose — the afterimages

**Base text is what happens when the god did nothing.** Every nudge-specific payoff lives in the fragments above, never here, so each band reads correctly with any subset of the hand active. `ActionStep` carries five afterimage fields — there is no near-miss afterimage, and near-miss is paid off through fragments.

**The Investigation gate pays out here, and this is the editorial pass's most serious repair.** The design block declares the base reward as *intel — a reading the agent can state, and a lead the sign points at*, and the draft's prose never delivered the second half: the step-0 bands said the shape "resolved", which is a shape resolving, not a thing learned, and § 9.5 claimed the words lived in surfaces that did not contain them. The player's experience of the gate's prize was therefore "you read it successfully", with nothing behind the success — the specific way `Puzzle–Investigation–Resolution` fails. The two success-side afterimages now carry the lead. It costs nothing: it is a claim about what the mortal understood, so it is scene-local and true whether or not `findAnyRuinId` found a ruin to point at (§ 9.5), it is base text so it holds with any subset of the hand active, and `successMetadata` — which mints the clue — fires on `isStepSuccess`, so the write and the words land on the same rolls.

### Step 0 — reading the sign

| Field | Text |
|---|---|
| `criticalSuccessAfterimage` | "The shape over the stone resolved, edge to edge, and held still long enough to be read whole. It was not aimed at this ground, and they came down knowing where it was aimed." |
| `successAfterimage` | "They read it steadily and came down with an answer they could stand behind, and with the plain fact that the sign was not meant for this ground." |
| `successAtCostAfterimage` | "They got the reading, and paid an hour of blurred sight to the glare for it." |
| `failureAfterimage` | "The stone gave them glare and after-images, and no reading they trusted." |
| `criticalFailureAfterimage` | "They looked until their eyes ran, and came down certain of a shape that was not up there." |

### Step 1 — saying it

| Field | Text |
|---|---|
| `criticalSuccessAfterimage` | "They said it so squarely that both sides set their answers down and looked again." |
| `successAfterimage` | "They said it plainly, and enough of the ground heard it to matter." |
| `successAtCostAfterimage` | "The reading landed. So did a name for the one who gave it, and the name was not kind." |
| `failureAfterimage` | "They said it, and both sides heard confirmation of the answer they walked in with." |
| `criticalFailureAfterimage` | "They said it, and the ground decided the reading was the reason all of this had gone wrong." |

### `narrativeTemplates`

- `success`: "The reading is out, and it is the true one. What the ground does with a true reading is a separate question, and it has already started answering it."
- `failure`: "The reading did not hold. Both sides leave with the answer they walked in with, and the ground keeps the argument."

---

## 7. Trait hooks — all four questions answered explicitly

1. **Gate?** **No.** A sign hangs over the ground for whoever is standing on it. No `requiredTraits` / `blockedByTraits`.
2. **Variant?** **Yes** — one, below.
3. **Trait-only nudge?** **Yes** — B6, unlocked via `addNudgeIds`.
4. **Trait fragment?** **No.** The card's own band fragments carry it; a second trait-keyed fragment on the base band would say the same thing twice.

```
traitVariants: [{
  traitId:        'trait.core.core_humility.virtue',   // "Humble"
  forecastDelta:  0.03,
  difficultyDelta: -0.02,
  factorLine:     'Being Humble, they offer the reading instead of ruling on it.',
  addNudgeIds:    ['sign.a_reading_offered'],
}]
```

**Liveness.** `trait.core.core_humility.virtue` is the virtue pole of the `core_humility` continuum, built from the canonical Core registry (`src/types/coreRegistry.ts` → `src/data/core-trait-content.ts`), granted by the `core_personality` phase. It is a seeded definition, so `validateTraitRefs()` does not report it dead. The full node id is used, which is the form least likely to rot (a ref matches ANY-of node id / short id / display name / tag, THR-786).

**Why this trait and not `core_integrity.virtue`.** Integrity ("True") is what makes a mortal *report accurately*, which step 0 already tests and the difficulty already prices. Humility is what decides whether a true report **lands** in a room that has voted, which is step 1's actual test. It also differentiates from the golden exemplar, which hooks integrity. The factor line is variant by construction — it renders only for the holder — and names its cause in the sentence, never in a label beside it. **No new continuum was minted:** the pre-authorized minting route (Christian, 2026-08-12) was not needed here, because the live 5-entry core registry already carries the best-fitting trait.

---

## 8. Cast — named-inline with mandatory binding

```
supportBundle: [{
  kind:          'actor',
  key:           'witness',
  delivery:      'lazy-materialize-on-trigger',
  persistence:   'must-persist',
  reuseNpcRoles: ['pilgrim', 'wanderer', 'hermit'],
  supportRole:   'first_witness',
  spawnNpcRole:  'pilgrim',
  spawnName:     'Neven Arbeck',
}]
```

**Class-honesty across all four declared classes.** Checked against `LOCATION_ROLE_ROSTERS` (`src/types/npc.ts`) before declaring. Within this envelope only `wilderness` (a `wayside` subtype) seeds NPCs at all — `ruins*`, `unexplored_poi` and `battleground` have no roster, and `castle` seeds a garrison establishment (`noble`, `marshal`, `guard_captain`, `steward`) that is placeless on a wayside or a battlefield. So the three reuse roles are the ones `wilderness` actually seeds (`pilgrim`, `wanderer`, `hermit`), reuse fires at wayside, and the other three classes spawn. A **pilgrim who walked to a sign** reads correctly at every one of the four: at the ruin they came for the tower, on the battlefield they came for the barn, at the wayside they were camped when it happened, at the fort they are among the forty on the road below.

**Role-voiced inline is the default.** The spine writes "a pilgrim who has stood here since first light" — no token, because no sentence there earns the generated name.

**The token lands where the name earns something.** `{cast:witness}` appears exactly once, in the `critical_failure` ending, at the moment the pilgrim becomes the one person on the ground who does not turn. That is ruling 6's "reveal" case, and it is where a nameless noun would cost the player the beat.

**`spawnName` is a real name, not a role phrase** — a declared key always resolves (THR-696), so `Neven Arbeck` is what the token renders whenever no live NPC was reused. **The prose never genders the pilgrim**: reuse binds whoever is standing there, so every sentence about them is written around pronouns.

---

## 9. Aftermath — authored, banded, persistent

### 9.1 Config shape

```
aftermathConfig: {
  branchOnStep: 0,
  variants: {},            // choice-less, so the bands hang off `fallback`
  fallback: { overview, changes: [], reactionPrompt, reactions, byOutcome },
}
```

**`fallback.changes` is deliberately empty.** The fallback renders on every band a `byOutcome` entry does not override, and a chip is only legal on a band where its backing effect actually fired. An un-banded chip here would be claiming state on bands that never wrote it — exactly the Law 56 breach the Unsafe Bridge shipped. Every chip in this encounter lives on the band whose effects produce it. Scene texture goes in the `overview`, which is a prose surface and claims nothing.

**`fallback.overview`:**

> The ground has its answer now, or it has its argument. Everyone who was standing here will tell it later as if they had known all along.

**`fallback.reactionPrompt`:** "What do you carry out of this?"

### 9.2 Reaction choices — three stances on consequence

Each is a different philosophical position about what a god does after a true thing has been said, and each carries a real write.

| id | label | intent | effects |
|---|---|---|---|
| `sign.steady_the_one_who_stayed` | "Steady the one who stayed" | "The pilgrim did not look away and did not pick a side. Give that a fire to burn on." | `condition_attachment { templateId: 'trait.condition.inspired', targetAgentId: '$cast:witness' }` |
| `sign.take_the_fear_off_them` | "Take the fear off them" | "They stood in front of it longer than a person should. Let them put it down." | `remove_condition { conditionTraitId: 'trait.condition.terrified' }` |
| `sign.let_the_country_carry_it` | "Let the country carry it" | "Neither reading needs you now. Let the roads argue it out." | `emit_omen { category: 'cultural', intensity: 0.4, scope: { kind: 'global' }, sphereAlignment: 'time', narrativeHook: 'Two readings of the sign over the border ground are travelling faster than the people who made them.' }` |

*The mercy reaction no-ops on bands where `terrified` never fired, which is the same shape the golden exemplar's rest reaction has and is the honest one: the click is offered on every band and does what it says wherever there is a fear to lift.*

### 9.3 `byOutcome` bands — five authored (floor is three)

Keyed on **`UnifiedActionOutcome`** — the action's resolved band, not the six-value per-step `StepOutcome` the fragments use. Floor cover: one success-side (`success`), one failure-side (`failure`), one extreme — and both extremes are written, plus `success_at_cost`.

---

#### `critical_success`

> **overview:** "The reading came out whole and the ground took it whole. Both sides went quiet in the same breath, which does not happen often on ground like this. Two of the loudest walked up to the stone afterwards and looked at it properly for the first time. People will be keeping eyes on this place from now on."

**changes:**

```
{
  id: 'sign.the_place_is_watched',
  kind: 'shell_state',
  title: 'Eyes On This Ground',
  category: 'scar',
  direction: 'loss',
  polarity: 'loss',
  causeClause: 'The reading was said out loud and taken, in front of everyone camped here',
  detail: '{target} carries Under Watch now — people keep eyes on it, and quiet work here is harder and likelier to be seen.',
  stateNoun: { text: 'a watched place', entityId: '$target', visualKind: 'location' },
  concepts: [
    { text: 'Under Watch', entityId: 'trait.condition.location.under_watch', visualKind: 'attachment' },
  ],
}
```

**Backing write:** step 1 `successMetadata.effects` → `condition_attachment { templateId: 'trait.condition.location.under_watch', targetLocationId: '$target' }`. **This is the brief's location/sublocation anchor** (#1 of 2 across the batch) — the referent is the location node the encounter is standing at, resolved by the `$target` sentinel exactly as `SCENE_SENTINEL_FIELDS` maps it, and the sentence names that particular place. The corpus habit of anchoring only `individual` agents is what this row exists to correct.

> **Systems-pass resolution (supersedes the editorial pass's flag above).** Both open questions the
> editorial pass raised here are now resolved. **`$target` binding:** confirmed live —
> `generateUnifiedCandidates` (`src/engine/unifiedCandidates.ts:169-175`) sets `targetId: locationId`
> unconditionally for every candidate generated against a `locationSubtypes`-gated template, which
> this family is; the comment there reads *"Create candidate — target is always the location."*
> `nodeMatchesSceneField`'s `location` kind check (`isPlaceTierLocation`) then passes because every
> one of the envelope's eleven expanded subtypes is a top-level worldgen location subtype, never a
> sublocation. This write fires as intended; it is not a Law 56 breach in the field. **Category:**
> it is one, but a different one than declared — see below.

*Rule 0c check: the `stateNoun` names the mechanic (`a watched place`), the `detail` names the endpoints (which place, and what Under Watch does to it), and the fiction comes last. `stateNoun.text` carries no placeholder — the surface renders it raw into the `CATEGORY · NOUN` tag, and a `{target}` there would ship as literal braces.*

> **Systems-pass correction: `PATH` → `SCAR`.** The write is real and chip-backable
> (`condition_attachment` is in `CHIP_BACKING_EFFECT_KINDS`), so Law 56 rule 0 is satisfied — but
> `PATH` specifically requires more than a real write: `EncounterAftermathCategory`'s own doc comment
> (`src/types/unifiedAction.ts:242-264`) defines it as *"a route learned ... an offer that will come
> round again ... or a door a later system can open — never the sentence alone,"* and names this
> packet's exact shape (a real write, no consumer) as the Unsafe Bridge failure the category exists
> to prevent. **Independently verified: nothing reads `trait.condition.location.under_watch`
> anywhere in the corpus** — `LOCATION_CONDITION_MOVEMENT_TAX` excludes it by design (comment: *"its
> reader is the gate"*), and a corpus-wide grep for `requiredTargetTraits` gating on any
> `trait.condition.location.*` id returns nothing; the one candidate precedent
> (`trait.condition.location.standing_welcome`) was retired by THR-1206 with zero writers. So `PATH`
> overclaims a forward-looking consequence nothing delivers. `SCAR`/`BOON`/`BOND` make a narrower,
> true claim instead — a factual statement about state, which this is: the place *is* watched now,
> whether or not anything downstream reads that yet. Re-categorised to `category: 'scar'`,
> `direction: 'loss'`, `polarity: 'loss'` (applied above) — matching the identical write's category
> in `the-unclaimed-relic-revised.md` (`relic.success.watched_ground`), arrived at independently in
> that packet and adopted here rather than inventing a separate resolution for the same write. No
> prose changed: `stateNoun.text: 'a watched place'` and the `detail`/`causeClause` sentences read
> exactly as correctly under `SCAR` as they were mis-typed under `PATH`. Full reasoning:
> `the-sign-over-the-ruin-systems.md` § 1.

---

#### `success`

> **overview:** "The reading is out and it stuck to enough of them to matter. What is left over the stone will be argued about for another week, and the argument will be a better one now. There is a road down from here and people willing to walk it beside them."

**changes:**

```
{
  id: 'sign.carried_onward',
  kind: 'future_hook',
  title: 'Carried Off This Ground',
  category: 'path',
  direction: 'opens',
  polarity: 'gain',
  causeClause: 'The reading landed, and half the camp wanted it said again where more people could hear it',
  detail: '{actor} is set on the road to the nearest settlement, to say it where it will travel further.',
  stateNoun: { text: 'a journey set', entityId: '$actor', visualKind: 'agent' },
  concepts: [{ text: 'the nearest settlement' }],
}
```

**Backing write:** step 1 `successMetadata.effects` → `agent_relocation { targetAgentId: '$actor', destination: { kind: 'nearest_settlement' }, mode: 'travel' }`. This is the **`movement`** family from the draw, wired in context: the crowd carries the reading, and the reader with it. `mode: 'travel'` writes a `relocationIntent`, so the mortal walks there through the ordinary movement system and the journey stays watchable on the map — no teleport, no second movement path.

*The `under_watch` write also fires on this band (same `successMetadata`), and is deliberately left unchipped here: at a plain success the beat the ending is about is the road out, and a chip that appears on every success-side band stops being reserved.*

---

#### `success_at_cost`

> **overview:** "They got it said. From the second sentence on, the question stopped being what was over the stone. It became who this was, standing up there claiming to know. Both readings are still standing. So is a third, about them."

**changes:** *(none authored — deliberate, and the reason is narrower than "nothing happened here". **Two writes do fire on this band:** step 1's `successMetadata` runs on `isStepSuccess`, which is true for every success-side step outcome including `success_at_cost` — and note a doubles roll can upgrade a `critical_failure` into `success_at_cost` (`src/engine/unifiedActionResolution.ts`), still success-side, still firing it — so Under Watch lands on the place and the relocation intent lands on the agent. Both are already chipped on the bands where they are the point, `critical_success` and `success`, and repeating them here spends the reserve for no new information; this packet reserves each write to the band it is about, which is why the same `Terrified` chip appears at `failure` and `critical_failure` with different cause clauses and nowhere else. What **this** band is about is attention and reputation among people who scatter tomorrow, and no effect writes that. The words therefore go in the `overview`, where they claim nothing. Folding rather than dressing fiction in a pointer is the rule, and a `reputation_tally` chip here would be a released defect under Law 13 visibility parity: per-Reach tallies render only in the debug designer tab and `check:encounter` fails on the kind. The draft's stated reason — "there is no write behind either" — was true of the reputation fiction and false of the band; corrected, because the next author copying this packet reads this sentence as doctrine.)*

---

#### `failure`

> **overview:** "The reading did not hold together on the stone and it did not hold together in front of the crowd. Both sides got to keep what they came with. The pilgrim did not move. The stone put a fear into them that will need walking off."

**changes:**

```
{
  id: 'sign.what_the_looking_cost',
  kind: 'trait',
  title: 'What The Looking Cost',
  category: 'scar',
  direction: 'loss',
  polarity: 'loss',
  causeClause: 'They stood in front of the remnant longer than anyone else on the ground and came down with no reading',
  detail: '{actor} carries Terrified — a fear from the stone that takes the steadiness out of standing their ground.',
  stateNoun: { text: 'Terrified', entityId: 'trait.condition.terrified', visualKind: 'attachment' },
  concepts: [{ text: 'Terrified', entityId: 'trait.condition.terrified', visualKind: 'attachment' }],
}
```

**Backing write:** step 1 `failureMetadata.effects` → `condition_attachment { templateId: 'trait.condition.terrified', targetAgentId: '$actor' }`. This is the **`condition`** family from the draw — *what reading it costs*. The condition carries `iron −0.06 / shadow +0.04` and a duration edge, so it is real, timed, sheet-visible, and reachable through `AttachmentDetailView`.

*Note `failureMetadata` fires on the `isStepSuccess` split, which counts `near_miss` as a success — a near miss therefore does not mint this, which is correct: they got the sentence out.*

---

#### `critical_failure`

> **overview:** "They came down certain, and the shape they were certain of was not the one over the stone. The ground heard the difference before they had finished. By dusk both sides had agreed on one point, and the point was them. The pilgrim — {cast:witness} — walks them off the ground, points them at a road, and does not say which reading was right."

*(Two edits from the draft, both class-honesty: the cleft "It is the pilgrim … who walks them out" is now subject-first, and "past the last fire" is gone — fires are established only at the wayside, and the battlefield's carters and the stronghold's road under a shut gate have none.)*

**changes:**

```
{
  id: 'sign.what_the_looking_cost_worse',
  kind: 'trait',
  title: 'What The Looking Cost',
  category: 'scar',
  direction: 'loss',
  polarity: 'loss',
  causeClause: 'They stared it down, got the shape wrong, and heard the whole ground turn while they were still talking',
  detail: '{actor} carries Terrified — a fear from the stone that takes the steadiness out of standing their ground.',
  stateNoun: { text: 'Terrified', entityId: 'trait.condition.terrified', visualKind: 'attachment' },
  concepts: [{ text: 'Terrified', entityId: 'trait.condition.terrified', visualKind: 'attachment' }],
},
{
  id: 'sign.run_off_the_ground',
  kind: 'future_hook',
  title: 'A Road Out',
  category: 'path',
  direction: 'opens',
  polarity: 'loss',
  causeClause: 'Both sides settled on the same answer about who was to blame, and it was the one who read it',
  detail: '{actor} is set on the road away from {target}, with no destination past being elsewhere.',
  stateNoun: { text: 'a journey set', entityId: '$actor', visualKind: 'agent' },
  concepts: [{ text: 'the road away' }],
}
```

**Backing writes:** step 1 `failureMetadata.effects` → `condition_attachment { terrified → '$actor' }` **and** `agent_relocation { targetAgentId: '$actor', destination: { kind: 'away', minHexDistance: 3 }, mode: 'travel' }`.

*Grim, and earned rather than announced: a critical failure here is being run off ground you were right to stand on, with a fear you did not have this morning and a road you did not choose. It is a battering and an exile from one hex — never a scripted death, per this encounter's stakes.*

*Category note on `A Road Out`: `path` with `direction: 'opens'` and `polarity: 'loss'`. A relocation intent is a way the simulation genuinely acts on — the movement scoring reads it and the mortal walks it — so it is a PATH by the type's own definition even though nobody wanted this one. The polarity carries the fact that it is a loss; the direction carries the mechanic.*

### 9.4 The consequence draw, wired in context

| Family | Effect kind | Where it fires | Why *this scene* produces it |
|---|---|---|---|
| `condition` | `condition_attachment` → `trait.condition.terrified` (agent) | step 1 `failureMetadata.effects` | Looking steadily at a thing that does not move like light is the whole of step 0, and the price of losing that contest is what it did to them. |
| `place` (undrawn, incidental) | `condition_attachment` → `trait.condition.location.under_watch` (**location**, `targetLocationId: '$target'`) | step 1 `successMetadata.effects` | A reading said out loud and taken is exactly what turns ignored ground into ground people keep eyes on. |
| `knowledge` | `spawn_clue { source: 'encounter_outcome', precision: 'vague', targetRuinId: '$nearest_ruin' }` | step 0 `successMetadata.effects` | Reading the remnant truly tells them what it was *aimed at*, and it was not this ground. |
| `movement` | `agent_relocation` — `nearest_settlement` on success, `away(3)` on failure | step 1 `successMetadata` / `failureMetadata` | The crowd either carries the reader onward to say it where it travels further, or settles on them as the cause and walks them off the hex. |

> **Systems-pass correction.** The revised file listed the `under_watch` write as a *"second
> carrier"* satisfying the drawn `condition` family. `familiesWiredByEffects`
> (`src/data/content-eval/consequenceDraw.ts:307-329`) special-cases exactly this shape: *"A
> condition on a place is a `place` consequence, not a `condition` one"* — a `condition_attachment`
> carrying a non-empty `targetLocationId` is excluded from `condition` and counted toward `place`
> instead. So this write actually wires the **undrawn** `place` family, not `condition`. This is
> harmless — `checkConsequenceDraw` only requires every *drawn* family to be wired, and wiring an
> extra one is not a violation — and the drawn `condition` family is satisfied on its own by the
> `terrified` write above. The recorded `consequenceDraw` and the "no swap taken" conclusion below
> are both still correct; only the stated reason for counting this row toward `condition` was wrong.
> Corrected here rather than left for the next author to re-derive. Full detail:
> `the-sign-over-the-ruin-systems.md` § 1.

**No swap taken.** All three drawn families found a reason inside the scene, so the one recorded-swap valve stays unused.

### 9.5 Why the clue is wired but not chipped

`spawn_clue` resolves `'$nearest_ruin'` through `findAnyRuinId`, which picks a random ruin node anywhere in the graph and **returns null when the world holds none** (`src/engine/ruins/clueLifecycle.ts`). So the write is real when it lands and silently absent when it does not, and the ruin it names is not necessarily the broken structure in the prose. A chip claiming "they know the way to X now" would therefore be the Unsafe Bridge defect in a new place: a pointer dressed over fiction the world may not hold.

**The editorial pass verified this against the code rather than the claim, and ratified it.** `findAnyRuinId` (`src/engine/ruins/clueLifecycle.ts:555`) filters every location node for a `ruinMagnitude` property and returns a uniformly random one, or `null`. Against Law 56 clause 0b the referent therefore fails on both halves of the test: it is not resolvable in the live world the player is in, and the sentence could not name *that particular object* even if it were. That is failure shape 1 in the rule's own table — the referent is effectively scene fiction — and the prescribed fix is **fold**: the words survive, the chip goes. The rule's other option (bind the spawn to settings that carry the feature and anchor the real node) is unavailable here, because the envelope is fixed at four classes by the batch design and the clue's ruin is not the local one regardless. This is the Unsafe Bridge defect recognised one step before it shipped.

The family is still **wired**, which is what the gate asks. What the endings say about it — *the sign was not aimed at this ground* — is a claim about what the mortal understood, which is scene-local and true regardless. **The words live in step 0's `criticalSuccessAfterimage` and `successAfterimage`** (§ 6), which are base text and land on any success-side roll of that step, the same rolls `successMetadata` mints the clue on. No chip claims the edge. *(The draft asserted the words lived in a band `overview` and in the critical-success afterimage; neither contained them. Fixed in § 6 — that was the pass's most serious finding, not a wording slip.)*

---

## 10. Images

### Card art — `imageTag` per card, every tag resolving to a live library row

Every tag below is a row in `ENCOUNTER_IMAGE_LIBRARY` (`src/data/encounter-image-library.ts` → `NUDGE_CONCEPT_ART` and `SITUATIONAL_NUDGE_ART`). The gate resolves rather than trusts, because a dead tag falls back to the category generic *silently* at render.

| Card | `imageTag` | Library row | Genericity test — reads correctly in ≥3 unrelated encounters? |
|---|---|---|---|
| A1 A Little More | `generic.focus` | mind / focus — *a hand holding a needle still, the tremor going out of it* | Yes. Any step where attention not slipping is the variable: a forgery, a night watch, a surgeon's cut. |
| A2 Plain Sight | `generic.light` | light / illumination — *a guttering lamp waking in a black passage* | Yes. Any step turning on seeing what is there: a cellar search, a night ford, a ledger audit. |
| A3 / B3 This Has Happened | `generic.time-slow` | time / time — *a water drop hanging, not yet fallen* | Yes. Any step where recognition or recurrence helps: a duel's opening, a returning plague, a repeated route. |
| A4 Nothing To Find | `generic.dark` | darkness / concealment — *dark closing over an abandoned satchel like water* | Yes. Any step where the help must go unseen: a theft, a bribe, a smuggled letter. |
| A5 / B5 A Sudden Surge | `generic.energy` | energy / energy — *a charge gathering at a weathervane's spike* | Yes. Any step where the body has to produce more than it has: a climb, a last shield-push, a birth. |
| B1 Not The Worst | `generic.mercy` | situational / appeal — *a clay bowl of water, folded linen, a torn loaf on a wet stone step* | Yes. Any step where the question is how far down it can go: a trial, a famine plea, a wound dressed badly. |
| B2 The Whole Shape | `generic.crowd` | situational / witness — *a ring of hooded backs at the edge of a lamplit yard, the lit ground between them empty* | Yes. Any step whose pressure is other people knowing: a council, a testimony, a reading of the record. |
| B4 No One Saw | `generic.dark` | darkness / concealment | Same row as A4 by design — the library has no per-member card art yet (`CARD_CONTENT` omits `imageTag` throughout, deliberately), so both Veil members resolve to the type's concealment plate. Documented rather than silently inherited. |
| B6 Who They Are | `generic.oath` | order / oath — *clasped forearms, a tightening knot, a plain wax seal* | Yes. Any step where the mortal's own character is the resource: a kept promise, a refused bribe, a stood post. The golden exemplar's trait card uses the same row. |

**No figure with a face appears in any of these plates**, which is what keeps a nudge card from ever contradicting the agent it is shown beside.

### Scene art — `sceneTag: 'ruin.sign.contested'`

Encounter-specific; card art is not. Until the manifest carries the tag the fallback chain ends at EntityVisual.

---

## 11. Concept art direction — the two-question method

**Question 1 — what emotions does this story convey?** The cold of a wonder that stopped being a wonder and became a position. The loneliness of being the only person on the ground who has not decided. The specific ugliness of people organising themselves into two answers about a thing none of them has looked at properly.

**Question 2 — what image evokes those emotions while staying inside this world?**

> **Residue, not the event.** A stretch of broken stone at grey first light, seen low and close. Two small heaps of offerings have been set down on it by two different hands and two different understandings — one arranged in a careful ring of pebbles and cut twine, the other a scatter of coins, bread and a hank of hair, tipped rather than placed. A hand's width of bare, trampled stone runs between the two heaps where feet have gone back and forth and never crossed. Both are cold. Frost on the ring, none on the scatter.

**Doctrine compliance:** no people, no faces, no second human likeness — the portrait chosen at Sensing stays the only likeness across the flow. The sign itself is **not depicted**: painting the remnant would hand the player the answer the Investigation gate exists to withhold, and it would also make the plate an illustration of prose that already exists. No baked-in caption text, no UI elements, no depiction of the interaction. The split is shown by two piles and a worn line, which is aftermath rather than action, and absence rather than presence.

**What the art says that the prose has not:** that people were already *worshipping* both readings before either was read, and that the ground between them has been walked bare.

---

## 12. Support bundle contract

| Support object | Delivery | Source | Persistence | Future references | Status |
|---|---|---|---|---|---|
| `witness` — the first witness (pilgrim) | `lazy-materialize-on-trigger` | reuse `pilgrim`/`wanderer`/`hermit` at wayside; spawn `pilgrim` elsewhere | `must-persist` | `{cast:witness}` in the `critical_failure` overview; `$cast:witness` target of the "Steady the one who stayed" reaction | ✅ declared |
| `trait.core.core_humility.virtue` | pre-seeded (core registry) | `src/data/core-trait-content.ts` | n/a — definition node | `traitVariants`, B6's `requiredTrait` | ✅ live |
| `trait.condition.terrified` | lazy — granted by step 1 `failureMetadata` | `src/data/condition-trait-content.ts` | must-persist (duration edge) | failure-side chips; the mercy reaction lifts it | ✅ live |
| `trait.condition.inspired` | lazy — granted by the "Steady the one who stayed" reaction | `src/data/condition-trait-content.ts` | must-persist (duration edge) | — | ✅ live |
| `trait.condition.location.under_watch` | lazy — granted by step 1 `successMetadata` on `$target` | `src/data/condition-trait-content.ts` | must-persist | `critical_success` chip. **No reader today** — excluded from `LOCATION_CONDITION_MOVEMENT_TAX` by design, and no shipped template gates on it (§ 9.3) | ✅ live definition, ⚠️ no consumer |
| Reward-pool draw (possession) | lazy — step 0 `successMetadata.rewardPool` | attachment library, seeded draw | must-persist | renders as the PRIZE chip, composing with the authored ending | ✅ no `tagFilters` (verified-tag rule) |
| Cultural omen | lazy — A3's `grants`, and the third reaction | omen system, `emit_omen` | scene-to-world | future draw bias | ✅ live |
| Clue edge | lazy — step 0 `successMetadata.effects` | `spawn_clue` → `findAnyRuinId` | must-persist when it lands | deliberately unchipped (§ 9.5) | ⚠️ fail-soft by design |

---

## 13. Seam checks — done by hand, since no detector sees this class

**The draft's version of this section checked only the openings' closing images, and so found nothing. Reading each boundary sentence against sentence — which is the check — found four echoes.** All four are fixed above; they are recorded here rather than quietly repaired, because the class is invisible to its own author and the record is what makes the next draft cheaper.

**Opening → spine, ruin. ECHO, fixed.** The opening ended on *"arguing since first light"*; the spine's fourth sentence is *"A pilgrim who has stood here since first light"*. The same three-word phrase across the boundary. The opening now reads *"arguing all morning"*, and the spine keeps sole title to first light.

**Opening → spine, wayside. ECHO, fixed.** The opening ended on *"since the light over the waystation went out"*, two sentences before the spine's *"it does not move the way light moves"* — the same noun in two unrelated senses, and a reader could fairly ask whether the thing went out or is still hanging there. Now: *"since it came down over the waystation."*

**Opening → spine, stronghold. ECHO, fixed.** *"shouting the same two answers at each other"* immediately before *"Two readings have hardened already"* — the same count-image delivered twice, and the second delivery is the one that matters. Now: *"shouting each other down ever since"*, which also picks up the shut gate in the sentence above it and retires the `dawn` / `first light` near-synonym.

**Opening → spine, battlefield. Clean.** *"not speaking to each other"* → *"What crossed the sky over the ruin has not finished."* No shared image or shape.

**Initiation → spine. ECHO, fixed.** *"What is actually over the stone has been read by nobody who stayed looking"* and *"Everyone who tried to look steadily looked away first"* are the same fact in two voices, on two surfaces the player reads in one breath. The initiation now owns the arrival and the stopped ground; the spine owns the looking.

**Spine → step-1 prose. Clean.** The spine ends on "Everyone who tried to look steadily looked away first." Step 1 opens on "They come down off the stone with a reading." Different subject, different verb shape, no echo of "look".

**Spine → step-0 bands.** The spine's images are *the remnant*, *the two readings*, *the pilgrim*, *looking away*. The step-0 afterimages use *edge to edge*, *stand behind*, *glare*, *after-images*, *eyes ran* — the glare and after-images are new, not repeats, and the "looked away" image is deliberately not reused.

**Step-1 prose → step-1 bands.** Prose ends on "both are counting who says what." Bands open on "said it so squarely" / "said it plainly" / "The reading landed" / "They said it, and…" — the repeated "said it" is intentional band-to-band parallelism at the same rung, not a seam echo across a boundary, and each band's second clause diverges immediately.

**Bands → overviews.** Each ending surface says only what it alone can say. The `success_at_cost` afterimage keeps the unkind name; the `success_at_cost` overview keeps the third reading, about them. The `critical_failure` afterimage keeps "the reading was the reason"; the overview keeps the pilgrim walking them out. The same fact three times in three voices would be an echo, not an ending.

**House-mannerism check.** The exemplar's critique caught "The X held. The Y did not." as a house tic. It appears **zero** times here; the one place it nearly landed (A1's `near_miss`) was rewritten to "They kept looking after everyone else stopped. The shape still slid out from under the reading."

**Cross-template borrowing.** One found and fixed: A2's failure fragment opened *"The light came true and showed them the stone"* — the golden exemplar's own line, verbatim in its first four words. The echo check is normally scoped inside one encounter; a distinctive opener lifted intact from the file everyone reads before authoring is the same defect one level up, and worth sweeping for.

---

## 14. Self-audit against the spec

| Rule | Verdict | Note |
|---|---|---|
| Design block written before prose, terse, crux in one sentence | **PASS** | § 1. |
| One entry per catalog, system pick at the mature tier | **PASS** | `traits` primary, `conditions` + `movement` alongside; nothing from the deferred tier is load-bearing. |
| Hook roll recorded (`plotHookRolled` + `plotHookTaken`) | **PASS** | § 1.0d. |
| `consequenceDraw` recorded and every family wired in context | **PASS** | § 9.4. Zero swaps. |
| Shape obeyed — information behind the Investigation gate | **PASS as revised** | Openings, initiation and spine say only that nobody has read it. What it *is* — and that it was not aimed at this ground — lives in step 0's bands, where the draft had put nothing at all (§ 6). Held behind the gate *and* handed over. |
| 1–3 steps, each with reach + numeric difficulty + `narrativeTemplate` | **PASS** | Two. |
| ≥1 nudge-bearing step; 4–8 cards per hand | **PASS** | Both steps; 5 and 6. |
| ≥4 distinct spheres per hand | **PASS** | `light` `time` `darkness` `energy` in both. |
| ≥1 ungated common (sphere-less) option per hand | **PASS** | A1, B1. |
| ≤1 rider per hand, justified in a comment | **PASS** | Hand A: none. Hand B: `no_crit_fail`, justified at B1. |
| ≤2 boosts per hand, ≥3 distinct types per hand | **PASS** | 2 boosts in A, 1 in B; 4 and 6 types. |
| Every card matching a library member sets `libraryCardId` | **PASS** | All eleven card instances. |
| Batch-required zero-use type used | **PASS** | **`veil`** — its content debut, twice, with a real detection channel each time. |
| Card faces library-generic, zero scene-bespoke prose | **PASS** | `name` and `fiction` are the authored library faces verbatim; the scene lives in the fragments. |
| `effectLine` states mechanism, no digits, no `%` | **PASS** | Checked line by line. |
| Every card ≥1 failure-band fragment | **PASS** | § 5.1, § 5.2. |
| Big-delta card covers both failure bands | **N/A** | No card reaches `NUDGE_BIG_DELTA` (0.15); max is +0.10. |
| All six `StepOutcome`s covered per hand | **PASS** | Coverage tables in § 5.1 and § 5.2. |
| Base band text reads with any subset of the hand active | **PASS** | § 6 contains no nudge-specific payoff. |
| No static `factorLines` | **PASS** | None authored. Only `carryoverFactorLines` (variant by construction) and the trait line. |
| Trait hooks — all four questions answered, live refs only | **PASS** | § 7. |
| Setting envelope declared, one opening per class, spine class-neutral | **PASS** | § 3, four classes, four openings. |
| Cast — ≥1 binding, class-honest at every declared class, never gendered | **PASS** | § 8. |
| Rewards — something persists | **PASS** | `rewardPool` draw + three persistent condition grants + a relocation intent. |
| Aftermath — `aftermathConfig`, `byOutcome` floor of 3, `overview` per variant, `concepts` per change | **PASS** | Five bands; every change declares `concepts`. |
| Law 56 — every chip backed by a write that fires on that band | **PASS** | § 9.3, each chip names its backing effect. `fallback.changes` is empty by design. |
| Law 56 clause 2 — referent is a real graph object, named in the sentence | **PASS** | `$target` (location), `$actor` (agent), the condition template (attachment). The clue is wired and unchipped (§ 9.5). |
| Law 13 parity — no `reputation_tally` chip | **PASS** | None authored; the `success_at_cost` reputation fiction stays in the `overview`. |
| Systems quota ≥3 from the authored manifest | **PASS** | cast + rewards + conditions = 3. |
| Images — every `imageTag` resolves to a library row | **PASS** | § 10, all nine checked against the live tables. |
| Genericity test documented per tag | **PASS** | § 10. |
| No `authoredChoices` | **PASS** | None. The player plays nudges; the mortal reads and reports. |
| Vagueness lexicon — evasive terms at zero everywhere | **PASS** | No `something` / `somehow` / `seems to` / `appears to` / `a kind of` / nominalised placeholders anywhere in the packet's authored prose. |
| Vagueness lexicon — natural indefinites at zero in **outcome** prose | **PASS** | Afterimages, fragments, band bases, overviews and `narrativeTemplates.success`/`.failure` swept for `someone` / `somewhere` / `thing(s)` / `way(s)` / `nothing` / `anything` / `whatever`. Scene-class fields (openings, spine, `initiation`, card `fiction`) use `nothing` and `way` as ordinary English, which is correct in that class. |
| ≤1 annotation clause across the encounter | **PASS as revised** | **Zero.** The draft claimed zero and carried **one**: B4's effect line read "You leave *less behind than a* careful hand would", matching `NOT_X_BUT_Y_PATTERNS[3]`. It sat exactly at `ANNOTATION_MAX_PER_ENCOUNTER`, so the gate would have gone green while the packet advertised headroom it did not have — which is how the next edit breaks a passing gate. Line rewritten; no `not … but`, no `less X than Y`, no em-dash-then-negation anywhere. |
| Divine outcome-authorship at zero | **PASS** | No decision verb takes a result clause. The god steadies, shows, floods, draws the dark in, takes the floor out — never decides how it lands. |
| Three plainness moves | **PASS as revised** | The draft failed move 1 in all four openings — a verbless sensory fragment apiece, the exact construction THR-974 names as its counter-example — and failed move 3 four times (two aphoristic inversions in fragments, one in a band fragment, one cleft in an overview). All eight rewritten. Move 2 held throughout except one abstract subject ("The recognition steadied their eyes"), also fixed. Move 4 (density) held: one named person on stage, once. |
| Setting-class honesty of the *neutral* surfaces | **PASS as revised** | The encounter says "the stone" nineteen times and two of four openings never established one; the `failure` overview named a wall the battlefield has not got, and the `critical_failure` overview named fires two classes have not got. Fixed in § 3 and § 9.3. |
| Step numbering consistent across the packet | **PASS as revised** | The draft mixed 0- and 1-indexed references to the same fields (§ 1.4 said "step 1 `successMetadata`" for the Veil step while § 9.4 said "step 0" for the same write). Normalised to 0-indexed. Pass 3 and Pass 4 read only this file. |
| Dealt-hand size under the runtime filters | **PASS as revised** | The draft counted two gated cards in hand B and there were three, including `card.whisper.attunement.light` at the 60-essence mark; a god without either attunement and without a Humble agent was dealt three cards in two spheres at the deciding step. The Veil members were swapped between the hands (§ 5); the ungated floor is now four in both. |
| Density — one named person on stage | **PASS** | The pilgrim, once, and only where the name earns it. No third party mentioning a fourth. |
| Foreshadow, never announce | **PASS** | No "pass and X / fail and Y" framing. The stakes sit in the furniture — the ground that has stopped working, the people who looked away first. |
| Prose rule 7 — no invented agent history | **PASS** | Classification table at § 1.4. Every fact is scene-local, a named state read, or a named state write. |
| Agent is protagonist, not bystander | **PASS** | § 1.1 — their road is what has stopped. |

---

## 15. Experience Differentiator Gate — 14 answers

**Scene & Prose**

1. **Opening places the player inside a moment already in motion?** **YES.** Every opening lands on people who have already been arguing for hours about a thing that has already happened, and one of them is a fort that has shut its gate.
2. **Prose has its own voice — cadence, rhythm, sentence variety?** **YES.** Short declaratives against longer accumulating ones; the openings each end on a long sentence that lands the split, the spine breaks into four beats, the bands are two sentences each.
3. **Scene prose names the elements that later become player choices?** **YES.** The remnant over the stone (A2, A4, A5), the argument behind them (A1), the crowd's faces and its memory (B2, B3), its search for a hand behind the reading (B4), the voice trying to carry (B5), the pilgrim (the cast, the reaction). Delete any of them from the prose and the matching card is senseless here.
4. **Would a reader feel something from the prose alone?** **YES.** The cold of the wayside camp that has not eaten, the two groups on either side of the barn who have stopped speaking, and the fact that everyone who tried to look at it steadily looked away first.
4b. **No seam echoes?** **YES, as revised.** Four found by reading boundary sentence against boundary sentence, four fixed, all recorded in § 13 rather than quietly repaired. Every opening→spine seam, the initiation→spine seam and the spine→band seams are named individually there.

**Choices & Intervention (the nudge hand)**

5. **Every card states mechanism in `effectLine`, generic 2–4 word title, one flavor quote, zero scene-bespoke prose on the face?** **YES.** Titles and quotes are the library's own authored faces; effect lines say what the god does and why the odds move.
6. **Every card's price real and legible?** **YES.** Essence on eight, essence plus a detection channel on the two Veils, and cost 0 on the trait card because the price was paid by being Humble. No zero-essence non-trait card. No digit and no `%` in any of the eleven effect lines.
7. **Every card pays off in failure?** **YES.** Eleven cards, eleven or more failure-texture fragments. No card reaches big-delta, so none owes both bands.
8. **Is the hand grounded?** **YES.** Delete the remnant and the crowd from the prose and every card in both hands stops making sense on this ground.
9. **Do the cards answer different questions?** **YES.** Hand A: attention, light, recognition, invisibility, endurance. Hand B: the disaster floor, the room's temper, the room's memory, leaving no trace, carrying the voice, and being the person they are. The two Boosts are the only near-pair, and they buy the eye and the body respectively.
9b. **Does every nudge-bearing step carry a full authored hand, and does no step ask the player to pick a branch or an ending?** **YES.** Both steps carry full hands. There are no `authoredChoices` and no fork; the player nudges, the mortal reads and speaks, fate rolls.

**Aftermath & Consequence**

10. **Does the aftermath have its own prose — a reflective landing before mechanics?** **YES.** Five band overviews plus the fallback, each saying only what it alone can say.
11. **Are consequence outcomes actor-centered with names and faces?** **YES.** The chips name the acting agent, the place by name, and the condition by name; the worst ending names the pilgrim who walks them out.
12. **Does the aftermath offer reaction choices?** **YES.** Three (§ 9.2), each carrying a real write.
13. **Do the reactions represent different philosophical stances?** **YES.** Attend to the one who stayed / attend to the mortal you spent / let the country carry it. Not three sizes of the same effect.

**Presentation**

14. **Concept art uses the two-question method — residue and absence, not illustration?** **YES.** Two cold heaps of offerings and a strip of stone walked bare between them. No people, no sign, no depiction of the confrontation.

---

## 16. Carried forward — what the editorial pass settled, and what Pass 3 must check

### Settled by Pass 2, do not re-litigate

1. **The `veil` → `eye` reach honesty.** Checked and upheld. Step 0 is holding the eye on a thing that will not be read while everyone else has stopped looking; step 1 is saying truly, to a room that has voted. That is Veil then Eye, not Eye twice.
2. **The four-class envelope.** Upheld, after a real repair: "the ruin" reads as a broken structure at all four classes, but **"the stone" did not** — two openings never put one on the ground, and two overviews named a wall and fires that two classes have not got. Fixed in § 3 and § 9.3.
3. **`success_at_cost` carrying no chip.** Upheld, with the rationale corrected: two writes do fire on that band, and they are reserved to the bands they are about. The `reputation_tally` alternative stays a released defect under Law 13.
4. **The two repeated card faces.** Verified forced: `SPHERE_SIGNATURES` signs one type per sphere, only `whisper` and `veil` have a second sphere-carrying member, so two repeats is the minimum this budget admits (§ 5). It does not read as impoverished, because the two instances are two different plays — but the fix, if the batch wants one, is upstream in row 2's type budget.
5. **Grim, earned.** Upheld. The grimness is plain and concrete throughout — no archaism, no elevated diction, no mood-noun in a subject slot. The failure bands read as plot, and the pilgrim refusing to say which reading was right is the encounter's best beat.

### Resolved by Pass 3 — every systems question the editorial pass could not close

1. **`$target` binding on `targetLocationId` — CONFIRMED WORKING.** `generateUnifiedCandidates`
   (`src/engine/unifiedCandidates.ts:169-175`) sets `targetId: locationId` unconditionally for every
   candidate built against a `locationSubtypes`-gated template ("target is always the location"),
   and every one of the envelope's eleven expanded subtypes is a place-tier location, never a
   sublocation. The `critical_success` chip's backing write fires as intended.
2. **Sentinels inside `stateNoun.entityId` — CONFIRMED RESOLVED.** A dedicated mechanism —
   `resolveAnchorDeclaration` (`src/data/content-eval/chipAnchorDeclarations.ts:155-172`) — resolves
   `$target`/`$actor` in exactly this field, gate-checked at authoring time by
   `chipAnchorViolations`. Not the same code path as `detail`/`causeClause` (`enrichProse`'s curly-
   brace tokens), by design — two different mechanisms for two different jobs, both live.
3. **`trait.condition.location.under_watch` has no consumer — CONFIRMED, and acted on.** This is
   what drove the `PATH` → `SCAR` recategorisation of the `critical_success` chip (§ 9.3). Still a
   portfolio-level note, not a blocker for this encounter: `the-sign-over-the-ruin-systems.md` § 15.
4. **`card.whisper.attunement.light` unlocks at 60 lifetime essence through light** — confirmed
   against `nudge-card-library.ts:508-512`. Intended, recorded as a decision, no change needed.
5. **Action-band mapping for a two-step action — CONFIRMED, `success_at_cost` is safe.**
   `computeFinalActionOutcome` (`src/engine/unifiedActionLifecycle.ts:290-317`) is the **only**
   producer of a `success_at_cost` action outcome, and it only runs once the final step has been
   reached without an intermediate hard-fail — so `success_at_cost` is reachable **exclusively**
   through paths where both steps ran and step 1's `successMetadata` fired (`isStepSuccess` counts
   `near_miss`/`success_at_cost` as success). § 9.3's reasoning holds exactly as written.
6. **A sixth question, found by this pass rather than carried into it: `critical_failure` was
   reachable through a path where step 1 never runs.** The engine's hard-coded rule — a step's own
   `critical_failure` always ends the action immediately, overriding `continue_weakened` — means step
   0 rolling `critical_failure` bypasses step 1 entirely, and the action-level `critical_failure`
   band's two chips were backed only by step 1's `failureMetadata`. Fixed by duplicating those two
   effects onto step 0's own `failureMetadata` (§ 4). Full reachability table and the one accepted
   trade-off: `the-sign-over-the-ruin-systems.md` § 1a.
