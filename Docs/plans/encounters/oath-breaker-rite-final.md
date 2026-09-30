# Encounter Pipeline: The Oath-Breaker's Rite
> Scale: short | Slug: oath-breaker-rite | Pass: final
> Date: 2026-09-30 | Pipeline version: 2.0 (Factory v3, batch expert-everyday-2, slot 6, THR-1679)
> Status: **READY WITH CAVEATS**

---

## Pipeline Summary

| Pass | Verdict | Notes |
|------|---------|-------|
| Draft | Complete | Opt-in oath reading at a town shrine: read the oath (veil 0.60), then an agent-decided fork on `tradition_novelty` (Archivist loosens the oath at 0.68, Heretic exposes the empty rite at 0.40). |
| Editorial | PASS WITH REVISIONS | Orchestrator ruling applied (Heretic arm 0.40 to 0.62, fork kept); "the job" referent fixed in both spines; Archivist success conflict (trigger 35) fixed; mechanism effect lines; Heretic carryover rows completed. |
| Systems | READY WITH CAVEATS | Every id and field verified live. Branch `fallback` added at 0.62; Heretic reputation re-set to +0.06 / −0.08; Patient factor line made step-neutral. One corpus-wide engine gap (step-0 critical failure renders the chosen arm's band), BACKLOG. |

### Caveats / Blockers

1. **Step-0 critical failure (engine, corpus-wide, BACKLOG).** A step-0 critical failure ends
   the action after the fork's pole is recorded, so the chosen arm's `critical_failure` band
   renders with chips whose writes never fired and a step-1 overview. The aftermath `fallback`
   is authored correctly for when the fix lands. Rare at 0.60 for an expert. Not a pre-task.
2. **Shape deviation, recorded.** The Heretic decline arm is priced at expert odds (0.62)
   under the batch ruling, against the catalog's "cheap, legible exit" reading of Opt-in
   Complication. It stays legible and cheaper in what it risks. The batch report should carry
   one line. Fallback label if read the other way: Personality Fork (same structure).
3. The branch `fallback` step is a copy of the Heretic arm at 0.62 and is unreachable on any
   live path today.
4. Spawn-only `priest` mints a walk-on hedge-priest beside the town's own (intended). Omit
   `reuseNpcRoles` on both cast entries.
5. `{location}` in the opening may name a Place (precedent-consistent).
6. Bind no `libraryCardId` on any special.

### Editorial Notes Summary

The orchestrator ruling was applied by raising the Heretic arm to 0.62 and keeping the fork,
with a spine that states why exposing the priest is hard (a frightened crowd that would rather
believe a priest). Both step-1 spines now establish the job they act on. The Archivist success
overview no longer contradicts the rival rite. The opening was trimmed to 78 words and one
two-fact sentence split. Step-0 critical-success afterimage names the oath. Heretic carryover
gains its `success_at_cost` and `near_miss` rows. Two effect lines were restated as mechanism,
three band fragments de-compressed, `purposeLine`s added.

Pass 3 merged fixes: (1) branch `fallback` step carries veil 0.62; (2) Heretic reputation
+0.06 / −0.08 (was +0.05 / −0.06, tuned for 0.40); (3) Patient factor line restated as
"Being Patient, they do not hurry the work." (template-level, shows on every step); (4) ladder
and ruling clarification that the Archivist `success_at_cost` band fires the full success half
(SHRINE and REP+ are backed on that band; its cost is narrated, with no write).

### Implementation File Map

Compiled set (not hand-edits): `Docs/plans/encounters/oath-breaker-rite.package.json` →
`npm run compile:encounter` produces the module, its structural test and both registrations.
Run `check:encounter` as well; the dry-run misses its gates (#1114).

Beyond the compiled set:
- `src/data/content-eval/plotHooks.ts` — stamp `usedBy` for `hook.haunted_relic` and
  `hook.blame_falls_on_outsiders` at closeout (brief).
- No engine, type or art file for this encounter.

---

## Encounter Packet

# Encounter Pipeline: The Oath-Breaker's Rite
> Scale: short | Slug: oath-breaker-rite | Pass: revised (systems-merged)
> Revisions applied: Heretic arm raised veil 0.40 → veil 0.62 (orchestrator ruling — every path expert) with a spine that states why exposing the priest is hard (a frightened crowd that would rather believe a priest); both step-1 spines now establish the job they act on ("the job" was never offered); Archivist success overview no longer contradicts the spine's rival rite; opening trimmed 79 → 78 and one two-fact sentence split; step-0 critical-success afterimage names what the oath was; Heretic carryover gains its success_at_cost and near_miss rows; two effect lines restated as mechanism; three band fragments de-compressed; purposeLines added to both arms; crit-success overview drops a line that re-told step 0.
> Systems merge: branch `fallback` step at veil 0.62; Heretic reputation +0.06 / −0.08; Patient factor line step-neutral.
> Date: 2026-09-30 | Pipeline version: 3.0 (Encounter Factory) | Batch: expert-everyday-2, slot 6 (THR-1679)
> Template: `encounter.town.oath_breaker_rite` (final)

## 0. Mechanical design block (designed before the prose)

```
Crux            A weaver who broke an oath is sure of a curse and asks {actor} whether it is
                real, while a frightened hedge-priest who has already taken the weaver's coin
                means to hold a rite that blames the strangers at the gate.
Title           The Oath-Breaker's Rite — names the person (an oath-breaker) and the objective
                (a rite). Glance test: a player knows someone broke an oath and a rite is due.
Id              encounter.town.oath_breaker_rite (binding; never encounter.slice.*)
Brief row       reach veil · steps veil 0.60 → veil 0.68 · shape opt-in complication ·
                settings urban · consequence hand condition + place (binding) ·
                rarityTier 2 · scale local · intrinsicTier shaping
Rolled dice     p3 mystery (is the curse real?) · opposition rival agent, motive fear (the
                hedge-priest: afraid of the shrine stone, more afraid of giving the coin back) ·
                disposition neutral (the priest does not want a fight, only the job) ·
                agentRole competitor (the job is already the priest's; {actor} offers the
                old rite in its place or refuses every rite) · scale personal (one weaver's
                oath; the town is the audience) · system target traits (Patient variant; the
                fork runs on Veil's own value axis)
Hook            plotHookRolled: hook.haunted_relic, hook.blame_falls_on_outsiders,
                hook.artifact_recovery
                plotHookTaken:  hook.blame_falls_on_outsiders, blended with hook.haunted_relic.
                The settlement has settled on who brought the trouble (the strangers camped
                outside the gate) on no evidence, and the priest's rite would say it aloud.
                The relic is the oath-stone in the town shrine: the oath still holds there, and
                the shrine lamp goes out whenever the weaver walks in (the haunt is justified,
                per the archetype's tonal note). artifact_recovery set aside: nothing is loose
                in the world to recover at personal scale.
The truth       Fixed, revealed only on step 0's success side. The weaver swore on the stone to
                repay a neighbour's loan by midsummer and did not. The OATH is real and still
                holds on the stone; that is why the lamp goes out. There is NO curse: the
                workshop fire was the weaver's own lamp, left burning. Both fork arms are true
                to this: the Archivist loosens the oath; the Heretic says keep it, and shows
                the priest's rite calls on no power.
Whose problem?  The agent's: they are sent for because they read oaths, and their name as a
                reader rides on the answer (P3 says so). The weaver's oath is scene-local
                (prose rule 7): minted in the scene, asserting no prior tie to {actor}.
                "A reader of oaths" is the sent-for role noun (the drowned-man precedent,
                "the best dream reader in the district"), not a claimed history.
Reach = theme?  Veil throughout — ritual and divination. Step 0 (0.60) reads the oath on the
                stone and what hangs on the weaver. The Archivist arm (0.68) performs the old
                release rite against the priest's rival rite. The Heretic arm (0.62) proves to
                a frightened square that the priest's rite calls on no power: a ritual expert
                unmasking an empty rite before a crowd that wants a culprit, still Veil.
Shape           Opt-in Complication. Step 0 (read the oath) is taken by every mortal. Then an
                agent-decided fork on `tradition_novelty` (Veil's bound pair; positive =
                tradition):
                  positive — Archivist: offers the old rite in place of the priest's and
                             loosens the oath (veil 0.68, the brief's step 2).
                  negative — Heretic: refuses every rite, tells the weaver to keep the oath,
                             and stands against the priest's rite in the square (veil 0.62).
                The step-0 specials carry opposite pole leans; the player never picks.
                Opt-in under the batch ruling (orchestrator, 2026-09-30: every step on every
                path sits in 0.55–0.70): the decline arm stays LEGIBLE (no rite, no release)
                and CHEAPER IN WHAT IT RISKS (no Cursed; a smaller reputation swing), but it
                is no longer cheaper in its odds. Refusing the job does not make the priest's
                rite go away, so the decline is priced as the expert test it is.
Carryover       Step 0 `continue_weakened`. Both arms carry `carryoverFactorLines` keyed on
                step 0's band (the critical_failure row omitted: a step-0 critical failure
                ends the action — the debt-arbitration finding).
Consequence hand (binding, THR-1145): `condition` + `place` — no swap.
  condition     Archivist failure half: `condition_attachment` `trait.condition.cursed` on
                `$actor` (template-default duration, 36 ticks). The oath the rite failed to
                loosen catches on the one who worked it. The batch's one personal condition
                on `$actor` (brief § Systems quota: slot 6 is named).
  place         Archivist success half: `condition_attachment`
                `trait.condition.location.tended_shrine` on `$here` (default 144 ticks): the
                stone answered the old rite, and the shrine is kept. Its reader is the Veil
                term in `LOCATION_CONDITION_STEP_MODIFIER`, so the next rite in that town
                takes more easily.
                Both arms' failure halves: `apply_condition`
                `trait.condition.location.under_watch` on `$here` (intensity 0.6, 48 ticks):
                the priest names the strangers at the gate, and the town watches newcomers.
                This is the rolled hook made into state.
Extras          `reputation_with` `targetLocationId: '$here'` on every half: Archivist +0.08 /
                −0.10; Heretic +0.06 / −0.08 (Pass 3: re-set for a 0.62 arm; was +0.05 /
                −0.06 for a 0.40 exit). Expert failure = reputation before money.
Cool failure?   Nobody is killed, jailed or branded. A failed release costs the town's trust,
                a spell of misfortune ({actor} Cursed for a while) and a watch on strangers.
                A failed refusal costs the town's trust and the watch.
Trait hooks     Gate: none (everyday by construction). Variant: Patient
                (`trait.personality.veil.virtue`) +0.04, factor line "Being Patient, they do
                not hurry the work." (Pass 3: template-level, so it shows on every step).
                Trait-only nudge: none (the specials cap is spent on
                the two pole-lean cards and the two release cards). Trait fragment: none.
Systems quota   cast + rewards (persistent conditions) + conditions + reputation — four.
Heavy Hand      none (brief: slot 4 is the batch's one).
Cast            `oathbreaker` — the weaver who broke the oath (spawn-only, `weaver`).
                `priest` — the frightened hedge-priest, the rival (spawn-only, `priest`).
Measurement     The fork step has no top-level difficulty, so `measure:roll-spread` reads
                step 0 only (0.60, window fit 0.74 — inside the expert band 0.65–0.85).
                Path means: Archivist 0.60 → 0.68 = 0.64 (window fit 0.78, the brief's row);
                Heretic 0.60 → 0.62 = 0.61 (window fit 0.75). Both expert.
Motivations     ['tradition_novelty'] — the fork's own axis, unpinned, so both Archivists and
                Heretics are drawn to the scene (THR-1525).
```

## 1. Inspiration Anchors

- **hook.blame_falls_on_outsiders** (vault: `Archetypes/Event Archetypes.md` — The Seasonal
  Plague). Contributed the priest's rite: a settlement that has already decided who brought its
  trouble, on no evidence. Read at personal scale — one weaver's run of bad luck, not a plague —
  and made into state: `under_watch` on the town when the priest wins the crowd. It is also
  what makes the Heretic arm hard: a frightened crowd that already has a culprit is slow to
  give one up.
- **hook.haunted_relic** (vault: `Archetypes/Adventure & Quest Archetypes.md` — The Haunted
  Relic Recovery). Contributed the oath-stone and its tonal note: *the haunt is often
  justified*. The lamp goes out because the oath really was broken and really is still owed.
  Nothing on the stone is evil.
- **Thematic Pillars — Memory vs Forgetting / Order vs Freedom.** The fork is Veil's own value
  pair: an Archivist honours the old rite; a Heretic says the rite is empty and the weaver
  should simply keep their word.
- **Anti-Patterns avoided:** consequence-free magic (a failed release lands on the one who
  worked it); the helpful passerby (the mortal is a competitor for the job, and their name is at
  stake); the dark-lord antagonist (the priest is frightened, not wicked, and the strangers are
  only a convenient answer).
- **Difference from *The Drowned Man's Will* (same family, same reach):** that one is a single
  divination before a magistrate, drawing a relic. This one is a two-step ritual contest with a
  fork, and its consequences are a curse on the reader and a condition on the town, not an
  item.
- **Dilemma library:** not consulted beyond the fork axis; the scene is not morally charged
  beyond the priest's scapegoating, which the hand acts on directly.

## 2. Scale Justification

Short: two beats (read the oath, then release it or refuse every rite). The matter is one
weaver's oath, settled in a night. The expert weight comes from the audience: a square full of
townsfolk choosing between an expert and a priest, and the strangers at the gate who pay if
the priest wins.

## 3. Pressure Knot

The weaver broke the oath last spring. The workshop has burned. The shrine lamp goes out
whenever the weaver walks in. The hedge-priest has taken the weaver's coin and set a rite for
midnight, and has been telling people the curse came in with the strangers camped outside the
gate. None of this waits for {actor}.

## 4. Intervention Fantasy

At the stone, the god works on the reader's mind: bring the old rite back to memory, or make
every rite sound hollow. In the release, the god can make the priest stumble through the rival
rite in the square, or stir the memory the shrine holds so the stone answers. The mortal still
chooses to take the job or refuse it, and fate still rolls whether the oath lets go or the
square turns.

## 5. Cast and World Objects

| Object | Kind | Notes |
|---|---|---|
| `{cast:oathbreaker}` — Tobin Marle (spawn name) | actor, spawn `weaver`, must-persist | The weaver who broke the oath. Spawn-only, so no existing townsperson is made an oath-breaker. Never gendered in prose: "the weaver". |
| `{cast:priest}` — Wendel Crane (spawn name) | actor, spawn `priest`, must-persist | The frightened hedge-priest, the rival. Spawn-only, so the town's own priest is never cast as a scapegoater. Target of the Stumble special (`opposes: 'priest'`). Never gendered: "the hedge-priest", "the priest". |
| the oath-stone | scene-local | "the stone in the town shrine". No node; no chip claims it. |
| the strangers at the gate | scene-local | Named only as a group. No node; the watch chip names the town, not them. |
| `$here` (the town) | location | Carries `tended_shrine` or `under_watch`; its standing moves on every half. |
| `trait.condition.location.tended_shrine` | location condition (live, 144 ticks) | Archivist success half. |
| `trait.condition.location.under_watch` | location condition (live, 84 default; 48 authored) | Both arms' failure halves. |
| `trait.condition.cursed` | personal condition (live, 36 ticks) | Archivist failure half, on `$actor`. |
| `trait.personality.veil.virtue` (Patient) | trait | Template variant +0.04. |

## 6. Beat Structure

1. **Read the oath** (veil 0.60, `continue_weakened`). {actor} reads the stone and the weaver:
   what the oath was, and whether anything else hangs on the weaver.
2. **Fork, decided by the mortal (`tradition_novelty`):**
   - Archivist (`positive`): **Loose the oath** (veil 0.68, `fail_action`) — {actor} offers the
     old release rite in place of the priest's and works it at the stone, while the priest
     holds a rival rite in the square.
   - Heretic (`negative`): **Expose the empty rite** (veil 0.62, `fail_action`) — {actor}
     refuses every rite, tells the weaver to keep the oath, and must prove to a frightened
     square that the priest's rite calls on no power.
   - Branch `fallback` (Pass 3, required field): a copy of the Heretic arm at veil 0.62.

## 7. Branching Profile

- Branch depth: light · Branch count: 2
- Where branching lives: step 1's scene prose, hand, carryover lines, metadata writes and
  aftermath variants.
- Convergence policy: none. Each arm ends the encounter.
- Shape: Opt-in Complication (catalog), personality fork on `tradition_novelty`; decline arm
  priced at expert under the batch ruling (design block § Shape).
- Secondary template: none.

## 8. Branching Map

Step 0 band → carryover line on either arm (how well the oath was read tilts the release and
the unmasking). Step 1 arm → Archivist: `tended_shrine` + town trust up, or Cursed + watch +
town trust down. Heretic: town trust up, or watch + town trust down.

## 9. Outcome Ladder

**Archivist arm (Loose the oath)**

| Band | Progress | Spent | New burden / opening |
|---|---|---|---|
| critical_success | Oath loosed before midnight in front of the town; the priest hands the coin back in public | nothing | A Tended Shrine on the town; town trust up |
| success | Oath loosed; the priest keeps the coin, and the rival rite ends to an empty square | nothing | A Tended Shrine; town trust up |
| success_at_cost | Oath loosed, but only after most of the crowd had gone home | the night; the audience (narrated; no write) | A Tended Shrine; town trust up (full success half fires) |
| failure | The oath stays on the stone and part of it catches on {actor}; the priest keeps the square | the town's trust | Cursed on {actor}; Under Watch on the town; town trust down |
| critical_failure | The rite fails in front of the whole crowd; the priest names {actor} among the strangers | the town's trust, loudly | Same writes, harder prose |

**Heretic arm (Expose the empty rite)**

| Band | Progress | Spent | New burden / opening |
|---|---|---|---|
| critical_success | The crowd goes home; the strangers are never named; the weaver knows there is no curse | nothing | town trust up |
| success | The priest ends the rite early; nobody names the strangers | nothing | town trust up |
| success_at_cost | The crowd goes home, but the weaver stays with the priest | the weaver | town trust up |
| failure | The priest names the strangers and the crowd believes it | the town's trust | Under Watch on the town; town trust down |
| critical_failure | The priest names {actor} among the strangers | the town's trust, loudly | Same writes |

Cool failure: no death, no jail, no brand. Standing before money, and the cost to someone this
good is said plainly in P3: a wrong answer costs their name in town.

## 10. Sample Opening (urban)

`openings.urban` (P1):

> {actor} arrives in {location} at dusk.

Step 0 `narrativeTemplate` (P2, P3):

> {cast:oathbreaker}, a weaver, broke an oath sworn on the stone in the town shrine. Since then the weaver's workshop has burned. The shrine lamp goes out whenever the weaver walks in.
>
> {cast:oathbreaker} is sure of a curse and asks {actor}, a reader of oaths, whether it is real. A frightened hedge-priest has already taken the weaver's coin for a rite at midnight. A wrong answer will cost {actor} their name in town.

Word count (tokens as words, "hedge-priest" one token): 6 + 31 + 41 = **78** (79 if the gate
splits the hyphen). One named person on stage (the weaver); the priest is a role noun until
step 1. Stake shape: mystery (is the curse real?), compounded once with contest (the priest
already holds the job).

### Step 0 — Read the oath (veil 0.60)

- `purposeLine`: `Read the oath`
- `failBehavior`: `continue_weakened`
- `criticalSuccessAfterimage`: They read the stone plainly. The oath was a promise to repay a neighbour's loan by midsummer, and it still holds; that is why the lamp goes out. No curse follows the weaver. The fire was the weaver's own lamp, left burning.
- `successAfterimage`: They found the oath still holding on the stone, and no curse on the weaver at all.
- `successAtCostAfterimage`: They found the oath still holding and no curse, after a reading so slow that the weaver nearly left.
- `failureAfterimage`: They felt the oath's weight at the stone, and could not tell it from a curse.
- `criticalFailureAfterimage`: They told the weaver the curse was real.

## 11. The Hand Per Step

### Step 0 — Read the oath · `deal: { count: 4, tags: ['lore', 'insight'] }` + 2 specials (composed 6)

| id | name | type | sphere | essence | Δ | lean | effectLine |
|---|---|---|---|---|---|---|---|
| `oath.remember_old_ways` | Remember The Old Ways | Whisper | time | 1 | 0.06 | `tradition_novelty` → positive | Bring the oath-rite back to their mind as it was first done. They lean toward performing it at the stone. |
| `oath.stir_doubt` | Stir Doubt | Compulsion | mind | 1 | 0.06 | `tradition_novelty` → negative | Make every rite they know sound hollow to them. They lean toward refusing every rite and telling the plain truth. |

bandProse:
- Remember The Old Ways — critical_success: "The oath-rite came back to them whole, and they read the stone by it." · success: "The oath-rite came back to them, and the stone answered it." · near_miss: "Half of the oath-rite came back to them, and the stone answered half." · failure: "The oath-rite came back to them wrong, and they read the stone by a wrong verse."
- Stir Doubt — success_at_cost: "They doubted the stone out loud, and the weaver heard it." · failure: "They doubted the stone, and then doubted what it showed them." · critical_failure: "They doubted every true sign at the stone and trusted the one false sign."

Coverage: all six `StepOutcome`s from the specials alone. Each special has a failure
fragment. Neither is big-delta. imageTags: `generic.memory`, `generic.focus`. No
`libraryCardId` bound (a library Whisper/Compulsion promises a reveal/compulsion these do not
deliver — the debt-arbitration caveat 6).

### Step 1, Archivist arm — Loose the oath (veil 0.68) · `deal: { count: 4, tags: ['lore', 'presence'] }` + 2 specials (composed 6)

- `purposeLine`: `Loose the oath`
- `failBehavior`: `fail_action`

`narrativeTemplate`:

> {actor} offers the weaver the old rite in place of the priest's. The old rite is spoken at the stone, before witnesses. {cast:priest}, the hedge-priest, keeps the coin and holds a rival rite in the square. There the priest tells the crowd that the strangers camped outside the gate brought the curse. {actor} must loose the oath before the crowd believes the priest.

Afterimages:
- critical_success: They loosed the oath in its first form, word for word.
- success: They loosed the oath at the stone.
- success_at_cost: They loosed the oath, but the rite ran until dawn.
- failure: The oath held against every verse they spoke.
- critical_failure: The oath held, and the shrine lamp went out in their hand.

`carryoverFactorLines` (keyed on step 0):

| step 0 band | text | polarity | Δ |
|---|---|---|---|
| critical_success | They know the oath holds and no curse does. | for | 0.06 |
| success | They know what holds the weaver. | for | 0.04 |
| success_at_cost | The weaver trusts their reading less. | against | −0.02 |
| near_miss | They know only part of the oath. | for | 0.02 |
| failure | They cannot tell the oath from a curse. | against | −0.03 |

| id | name | type | sphere | essence | Δ | effectLine |
|---|---|---|---|---|---|---|
| `oath.twist_the_words` | Twist The Words | Stumble (`opposes: 'priest'`) | chaos | 2 | 0.10 | Make the hedge-priest stumble through the rival rite in the square, so the crowd drifts back toward the shrine. |
| `oath.wake_the_stone` | Wake The Stone | Omen | time | 2 | 0.12 | Stir the memory the shrine holds, so the oath answers the old rite more readily. |

bandProse:
- Twist The Words — success: "{cast:priest} lost the rival rite twice in the square, and the crowd walked back to the shrine." · near_miss: "{cast:priest} lost the rival rite once, and only half the crowd walked back." · failure: "{cast:priest} lost a verse and found it again, and the crowd stayed in the square." · critical_failure: "{cast:priest} spoke the rival rite without one slip, and the crowd stayed to hear it all."
- Wake The Stone — critical_success: "The stone answered the first verse, and the lamp above it flared and held." · success: "The stone answered the rite as it had answered the swearing." · success_at_cost: "The stone answered one verse at a time, and slowly." · failure: "The stone answered only with the oath, still owed."

Coverage: all six from the specials alone. Both have a failure fragment; neither is big-delta.
imageTags: `generic.luck`, `generic.time-slow`. Composition {Stumble, Omen} differs from the
family's shipped {Stumble, Signature} (debt arbitration) and {Stumble, Bargain} (drowned man).

`successMetadata.effects`:
- `{ kind: 'condition_attachment', templateId: 'trait.condition.location.tended_shrine', targetLocationId: '$here' }`
- `{ kind: 'reputation_with', targetLocationId: '$here', delta: 0.08 }`

`failureMetadata.effects`:
- `{ kind: 'condition_attachment', templateId: 'trait.condition.cursed', targetAgentId: '$actor' }`
- `{ kind: 'apply_condition', conditionTraitId: 'trait.condition.location.under_watch', targetLocationId: '$here', intensity: 0.6, durationTicks: 48 }`
- `{ kind: 'reputation_with', targetLocationId: '$here', delta: -0.10 }`

### Step 1, Heretic arm — Expose the empty rite (veil 0.62) · `deal: { count: 4, tags: ['social', 'insight'] }`, no specials (composed 4)

- `purposeLine`: `Expose the empty rite`
- `failBehavior`: `fail_action`
- `difficulty`: 0.62 (was 0.40 in the draft; raised by the orchestrator ruling so the path bands as expert)

`narrativeTemplate`:

> {actor} refuses to hold any rite and tells the weaver to keep the oath instead. {cast:priest}, the hedge-priest, holds the midnight rite in the square anyway. The priest blames the strangers camped outside the gate. The crowd is afraid, and it would rather believe a priest than a doubter. {actor} must prove to the whole square that the priest's rite calls on no power.

(64 words. The fourth sentence is the honest reason the arm is an expert test: the crowd has
already chosen its culprit and its authority, and {actor} has to take both away in public.)

Afterimages:
- critical_success: They took the priest's rite apart in front of the square, step by step.
- success: They showed the crowd that the priest's rite called on no power at all.
- success_at_cost: They turned the crowd, and lost the weaver.
- failure: The crowd listened to the priest over them.
- critical_failure: The crowd turned on them as well as on the strangers.

`carryoverFactorLines` (keyed on step 0):

| step 0 band | text | polarity | Δ |
|---|---|---|---|
| critical_success | They know there is no curse to lift. | for | 0.05 |
| success | They know the weaver carries no curse. | for | 0.03 |
| success_at_cost | The weaver doubts their word. | against | −0.02 |
| near_miss | They are nearly sure there is no curse. | for | 0.01 |
| failure | They are not sure the curse is false. | against | −0.03 |

`successMetadata.effects`: `{ kind: 'reputation_with', targetLocationId: '$here', delta: 0.06 }`

`failureMetadata.effects`:
- `{ kind: 'apply_condition', conditionTraitId: 'trait.condition.location.under_watch', targetLocationId: '$here', intensity: 0.6, durationTicks: 48 }`
- `{ kind: 'reputation_with', targetLocationId: '$here', delta: -0.08 }`

### Branch `fallback` step (Pass 3; required field of `ActionStepBranch`)

A copy of the Heretic arm above, field for field: veil **0.62**, `purposeLine` `Expose the empty rite`, `failBehavior` `fail_action`, the same `narrativeTemplate`, afterimages, `carryoverFactorLines`, `deal: { count: 4, tags: ['social', 'insight'] }` with no specials, and the same `successMetadata` (+0.06) and `failureMetadata` (under_watch 0.6 / 48, −0.08). It carries the raised difficulty, not the draft's 0.40. Reachable only when no pole is on record.

### Template-level

- `traitVariants: [{ traitId: 'trait.personality.veil.virtue', forecastDelta: 0.04, factorLine: 'Being Patient, they do not hurry the work.' }]`
- `consequenceDraw: ['condition', 'place']` — no `consequenceSwap`.
- `actorAffinities: ['individual']`, `apCost: 1`, `crudType: 'update'`.

## 12. Branch-Dependent Later Paragraphs

- **Archivist (`positive`):** the step-1 Archivist `narrativeTemplate` above — the old rite
  offered in place of the priest's and spoken at the stone, against the priest's rival rite in
  the square.
- **Heretic (`negative`):** the step-1 Heretic `narrativeTemplate` above — no rite, the weaver
  told to keep the oath, and the priest's rite unmasked before a frightened square.

Each proves its branch in scene prose: one arm is a rite performed, the other a rite refused
and taken apart. The priest and the strangers are the same pressure on both.

## 13. Aftermath Paragraphs (overviews)

`aftermathConfig.branchOnStep: 0`.

**Archivist (`positive`)** — base overview: "{actor} held the old rite at the stone."
- critical_success: "The oath came off the stone before midnight, in front of half the town. {cast:priest} handed the weaver's coin back where everyone could see."
- success: "The oath came off the stone, and the shrine lamp stayed lit when {cast:oathbreaker} walked in. {cast:priest} kept the coin, and the rival rite ended to an empty square."
- success_at_cost: "Most of the crowd had gone home before the old rite ended. The oath is off the stone, and {cast:priest} kept the weaver's coin."
- failure: "The oath is still on the stone, and part of it caught on {actor}. {cast:priest} kept the crowd in the square and blamed the strangers at the gate."
- critical_failure: "The whole crowd saw the rite fail. {cast:priest} told the square that the strangers had brought the curse, and that {actor} was one of them."

**Heretic (`negative`)** — base overview: "{actor} refused to hold any rite."
- critical_success: "The crowd went home before the rite ended. The strangers at the gate were never named, and {cast:oathbreaker} knows now that there is no curse, only an oath still owed."
- success: "The crowd went home, and {cast:priest} ended the rite early. No one named the strangers at the gate."
- success_at_cost: "The crowd went home, but {cast:oathbreaker} stayed in the square with {cast:priest}, still sure of a curse."
- failure: "{cast:priest} named the strangers at the gate as the cause of the curse, and the crowd believed it."
- critical_failure: "{cast:priest} named the strangers at the gate, and named {actor} with them. The square believed every word."

**`fallback`** (reachable only by a step-0 critical failure once the BACKLOG engine fix lands;
see concerns) — base overview: "{actor} left before any rite began."
- success: "{actor} left the shrine with the reading done and no rite held."
- failure: "{actor} left the shrine unsure, and the rite went ahead without them."
- critical_failure: "{actor} told the weaver the curse was real and left before midnight. The priest's rite went ahead without them."

No chips on `fallback`: no write fires on the step-0 terminal path.

## 14. Aftermath Reaction Choices

No reaction choices — consequence is clean. Short, local scale; every write fires from step
metadata, and the player's decisions were the cards.

## 15. Aftermath Kit Summary (chips)

Chip definitions (category order on the page: scar · bond · boon · path):

| Chip | kind | category | direction | stateNoun | title | causeClause | detail | words |
|---|---|---|---|---|---|---|---|---|
| CURSED | trait | scar | loss | `{ text: 'Cursed', entityId: 'trait.condition.cursed', visualKind: 'attachment' }` | "A caught oath" | — | "Misfortune clings to {actor} for a while." | 7 |
| WATCH | trait | scar | loss | `{ text: 'Under Watch', entityId: 'trait.condition.location.under_watch', visualKind: 'attachment' }` | "A watch on strangers" | — | "The town watches every newcomer now, and quiet work there is harder." | 12 |
| REP− | reputation | scar | loss | `{ text: 'reputation with {target}', entityId: '$here', visualKind: 'location', tooltipId: 'ui.reputation_with' }` | "The Town's Trust" | — | "The town trusts {actor}'s word on oaths less." | 8 |
| SHRINE | trait | boon | gain | `{ text: 'A Tended Shrine', entityId: 'trait.condition.location.tended_shrine', visualKind: 'attachment' }` | "A kept shrine" | — | "Rites at the shrine in town take more easily now." | 10 |
| REP+ | reputation | boon | gain | same as REP− | "The Town's Trust" | — | "The town trusts {actor}'s word on oaths more." | 8 |

Per band (Law 56 — every chip backed on its band):

| Arm · band | Writes that fire | Chips |
|---|---|---|
| Archivist crit / success / at-cost | `tended_shrine` $here, rep $here +0.08 | SHRINE, REP+ |
| Archivist failure / crit-fail (via step 1) | `cursed` $actor, `under_watch` $here, rep $here −0.10 | CURSED, WATCH, REP− |
| Heretic crit / success / at-cost | rep $here +0.06 | REP+ |
| Heretic failure / crit-fail (via step 1) | `under_watch` $here, rep $here −0.08 | WATCH, REP− |
| Either arm, crit-fail via step 0 | none | today: that arm's crit-fail chips render hollow (engine caveat); after the fix: `fallback`, no chips |

No chip anchors `$cast:` for reputation (THR-1685 avoided by construction). No chip anchors
`$actor` as its referent: CURSED anchors the condition template. Chip sentences share no
four-word run with their overviews (checked by hand; the gate will confirm).

**What the world remembers:** the town's trust in {actor} as a reader of oaths; a shrine that is
kept (a real Veil bonus there for twelve days of game time) or a town that watches newcomers
(a real Shadow cost for four days); and, if the release failed, {actor} Cursed for a while.

## 16. Support Bundle Contract

| Support object | Delivery | Source | Persistence | Future references | Status |
|---|---|---|---|---|---|
| `oathbreaker` (the weaver) | lazy-materialize-on-trigger | spawn-only `weaver`, spawnName "Tobin Marle", supportRole `oath_breaker` (omit `reuseNpcRoles`) | must-persist | named in spines and overviews; a later run in that town can meet the weaver again | ready |
| `priest` (the hedge-priest) | lazy-materialize-on-trigger | spawn-only `priest`, spawnName "Wendel Crane", supportRole `hedge_priest` (omit `reuseNpcRoles`) | must-persist | the Stumble special's `opposes` target; named in spines, fragments, overviews | ready |
| A Tended Shrine | aftermath effect (step success half) | `trait.condition.location.tended_shrine` (live, `CONDITION_DURATIONS` row 144) | must-persist (timed) | location page; Veil step modifier | ready |
| Under Watch | aftermath effect (step failure halves) | `trait.condition.location.under_watch` (live) | must-persist (timed) | location page; Shadow step modifier | ready |
| Cursed | aftermath effect (Archivist failure half) | `trait.condition.cursed` (live, 36 ticks) | must-persist (timed) | bearer's sheet; star/gold modifiers | ready |
| town standing | aftermath effect | `reputation_with $here` | must-persist | reputation readers | ready |

`narrativeTemplates` (proposed): initiation "A weaver who broke an oath is sure of a curse, and a frightened hedge-priest has already taken the weaver's coin for a rite." · success "The priest lost the square, and the town trusts {actor}'s word on oaths more." · failure "The priest won the square, and the town trusts {actor}'s word on oaths less."

`description` (proposed): "An opt-in oath reading at a town shrine: read a broken oath on the shrine stone (Veil), then, by the mortal's own regard for old rites, loosen the oath by the old rite against a frightened hedge-priest's rival rite (Archivist, Veil) or refuse every rite and prove to the crowd in the square that the priest's rite is empty (Heretic, Veil). A true release tends the shrine; any failure lets the priest blame the strangers at the gate, and the town sets a watch."

## 17. Self-Audit

| Item | Verdict | Note |
|---|---|---|
| Brief row: reach, steps, shape, settings, rarity, scale, tier | PASS | veil 0.60 → veil 0.68 on the Archivist path (the brief's row); Heretic arm 0.62 so every path bands expert (orchestrator ruling 2026-09-30); shape opt-in, decline arm priced at expert (design block § Shape) |
| Opening skeleton, ≤80 words, real graph names | PASS | 78 by token-as-word count (79 if the hyphen splits) |
| Narrator mode, no interior sensation, facts stated | PASS | "the lamp goes out whenever the weaver walks in" is a stated event, not decor |
| One named person per beat | PASS | opening: the weaver; step 1 (both arms): the priest, the weaver as a role noun |
| Setting envelope + one opening per class | PASS | `urban` only |
| Cast bound, token keys declared, never gendered | PASS | "the weaver", "the hedge-priest" throughout; spawn-only both |
| Hand rules | PASS | 2 specials + deal 4 on step 0 and the Archivist arm; Heretic arm deal-only (the debt-arbitration Watcher precedent; composed sphere/common floors stand down on a `deal` step); one failure fragment minimum per special; no Δ ≥ 0.15; no rider special; no core Boost special; no over-exposed card bound |
| All six StepOutcomes covered by specials | PASS | both special-bearing steps |
| Effect lines repeat no name word; no digits; state mechanism | PASS | checked per card; Twist and Wake restated as "so …" mechanism |
| Card-name verbs in `IMPERATIVE_VERB_LEXICON` | PASS | remember, stir, twist, wake |
| Consequence hand wired (condition + place), no swap | PASS | cursed (condition); tended_shrine + under_watch with `targetLocationId: '$here'` (place) |
| Live condition ids only | PASS | all ids in `CONDITION_TRAIT_DEFINITIONS` (`src/data/condition-trait-content.ts`); the three with `CONDITION_DURATIONS` rows |
| Rewards persist | PASS | condition effects are persistent kinds |
| Systems quota | PASS | cast + rewards + conditions + reputation = 4 |
| byOutcome floor | PASS | five bands per arm; fallback three |
| Chip nouns = sheet words | PASS | Cursed, Under Watch, A Tended Shrine (condition names), `reputation with {target}` |
| Chip sentences ≤15 words, no four-word overview overlap | PASS | 7–12 words |
| Law 56 backing per band | PASS | kit table; step-0 terminal path is the known engine caveat |
| Prose rule 7 (no invented agent history) | PASS | the oath, the weaver, the priest and the strangers are scene-local; "a reader of oaths" is the sent-for role noun (drowned-man precedent) |
| Prose rule 7b (no unenacted future promise) | PASS | "A wrong answer will cost {actor} their name in town" is enacted by `reputation_with $here` on every failure half |
| Vagueness lexicon (outcome fields) | PASS | no `someone`/`nothing`/`thing`/`way` in afterimages, fragments or overviews (checked by hand; the draft's "someone to blame" is not carried) |
| Annotation budget (≤1) | PASS | zero `not … but` / `— not` clauses; "no curse, only an oath still owed" appears once (Heretic critical-success overview) and matches neither pattern |
| Trait hooks answered | PASS | gate none; variant Patient; trait-only nudge none; trait fragment none |
| No death, jail or brand | PASS | Cursed is a timed condition |
| No appointment, no place/time promise | PASS | "a rite at midnight" is tonight's scene, not a promise the mortal must keep |

### Experience Differentiator Gate

1 YES — P1 arrival with `{location}`, P2 events with costs paid (the oath broken, the workshop burned, the lamp), P3 one mystery compounded with contest, 78 words.
2 YES — every sentence states a fact the test or the stake needs.
3 YES — the weaver, the stone, the lamp, the priest, the coin and (in step 1) the rival rite, the crowd and the strangers are all introduced before any card or chip acts on them.
4 YES — "A weaver broke an oath and thinks it's a curse; a scared hedge-priest has the job; if {actor} gets it wrong they lose their name in town."
4b YES — seams read sentence against sentence; no repeated image or sentence shape across opening → spine → band.
5 YES — four spell-style faces, verb + noun, direct effect, no flavor quote.
6 YES — essence on every special; the priced channels are pips.
7 YES — every special carries at least one failure-band fragment.
8 YES — delete the priest and Twist The Words is senseless; delete the stone and Wake The Stone is; delete the fork and neither lean card means anything.
9 YES — the step-0 pair argue opposite poles; the Archivist pair split between the opposition (the priest's crowd) and the source (the stone).
9b YES — every nudge-bearing step carries a full composed hand; the fork is decided by the mortal, never the player.
10 YES — each band has its own overview.
11 YES — `{cast:priest}` hands the coin back or names {actor} among the strangers; `{cast:oathbreaker}` walks in under a lit lamp or stays with the priest.
11b YES — each band read as overview → chips → (no reactions); the chips name states the overview does not (the watch, the shrine's bonus, the curse's reach).
12 N/A — short scale; no reactions required.
13 N/A — no reactions.
14 YES — see below.

### Concept Art Direction

1. Emotions: a promise that is still owed; fear looking for someone else to blame; a flame that
   refuses one person.
2. Image: a small shrine niche at night, a squat dark stone with an old oath-mark worn into its
   face, a clay lamp on the ledge above it just gone out, one thread of smoke rising; beyond the
   niche's arch, blurred and far off, a ring of torchlight in a square. Residue, no people.
   Painterly, muted, threadbare fantasy.

## Concerns for Pass 3 — resolved in the systems audit

1. **Step-0 critical failure (engine, corpus-wide, BACKLOG from debt-arbitration).** A step-0
   critical failure ends the action after the fork's pole is recorded, so the chosen arm's
   `critical_failure` band renders with chips whose writes never fired (Archivist: CURSED,
   WATCH, REP−; Heretic: WATCH, REP−), under an overview that describes a step-1 event that
   never happened. The `fallback` aftermath is authored for when the fix lands. Same caveat
   debt-arbitration shipped with; rare at 0.60 for an expert. **Confirmed; carried as caveat 1.**
2. **Branch-level `fallback` step.** RESOLVED: authored as a copy of the Heretic arm at
   veil 0.62 (see § 11).
3. **`weaver` spawn role** is a valid `NpcRole`. RESOLVED: spawn-only, omit `reuseNpcRoles`
   (optional field; drowned-man precedent).
4. **Heretic reputation deltas.** RESOLVED: +0.06 / −0.08 adopted for the 0.62 arm.
