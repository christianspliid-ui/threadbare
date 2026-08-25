# Encounter Pipeline: The Garrison's Price
> Scale: medium | Slug: the-garrisons-price | Pass: final
> Date: 2026-08-24 | Pipeline version: 3.0 (Encounter Factory)
> Status: **READY FOR IMPLEMENTATION**
> templateId: `encounter.border.the_garrisons_price` | Batch: border-perils (THR-1221), row 6

---

## Pipeline Summary

| Pass | Verdict | Notes |
|------|---------|-------|
| Draft | Complete | Full packet against the border-perils batch design's row 6 constraints (`gold`→`shadow`, Opt-in Complication, `debt`/`bargain`/`negotiate`/`passage`); carried one unresolved engine finding (`thread_*` binding) and one unfixed Law 56 defect (failure-side chips backed only on step 2, unreachable on the step-1 `fail_action` path). |
| Editorial | Fixed, 2 passes deep | Repaired the Law 56 backing hole by authoring step 1's own `failureMetadata` (identical effects to step 2's), folded the exhaustion chip (write kept, chip removed, words not moved), rewired `drive` via `plant_compulsion` on both steps, fixed 2 honest-antagonist breaches + 1 softened, fixed 3 vagueness hits, and — the widest single repair — found and fixed **14 seam echoes across 7 seam classes** by auditing every seam *inside* a single ending (afterimage→overview, `narrativeTemplates`→band, fragment↔fragment, chip↔chip), not only the narrow `opening→spine`/`spine→band` seams the draft checked. |
| Systems | READY FOR IMPLEMENTATION | Independently re-traced the Law 56 repair against `advanceStep`, `applyStepOutcomeEffects`'s call order, and `chipBackingViolations`'s blind spot — holds. Re-derived the consequence draw via `npm run draw:consequences` and validated the recorded swap against all 5 of `checkConsequenceDraw`'s own checks. Verified every id (agreement, condition, faction, trait, card, image, tooltip) against its defining source table. Found 2 documentation-accuracy corrections in the support-bundle rationale (a cited faction-roster reuse path that no engine code reads; `camp` mis-grouped as roster-dark when it shares `fort`'s roster) and 1 in the personalization rationale (`{cast:agent}` asserted but never authored) — none are shipped defects, none block implementation. |

### Caveats / Blockers

None.

### Editorial Notes Summary

Editorial's own headline: *"This is a strong packet with a real scene, an honest
antagonist, a well-cut hand, and an opt-in gate that is genuinely opt-in. It also carries
one defect that would have shipped the exact pathology this batch was convened to correct
— a chip claiming state the engine never wrote, on a reachable path, past a gate that
cannot see it."* The fix: step 1's `failBehavior: 'fail_action'` means a failed
negotiation ends the action before step 2 ever runs, so every failure-side write that
backs a chip had to be authored on **both** steps — the draft had it on step 2 only. That
repair, and thirteen further seam/vagueness/honesty fixes, are what the revised packet
below carries. Systems traced the repair against source rather than trusting the claim;
see the systems audit (`Docs/plans/encounters/the-garrisons-price-systems.md`) § 0 for the
full trace and its reachability table.

### Implementation File Map

**New file:**
- `src/data/encounters/the-garrisons-price.ts` — the template (linear, settings-envelope,
  support-bundle shape — follow `one-body-short.ts` / `the-unclaimed-relic.ts`, not
  `flawed-steel.ts`, which is the branching exemplar).

**Modified:**
- `src/data/unified-action-templates.ts`:
  - Import near line 193 (alongside the other `./encounters/*` imports).
  - Add to `RAW_UNIFIED_ACTION_TEMPLATES` (array starts line 5464; entries around 5590).
  - Add to `LOCATION_BRANCHING_ENCOUNTER_TEMPLATES` (array starts line 5660; entries
    around 5670-5690) — required despite the array's name, because membership there is
    "has `locationSubtypes`, belongs in the encounter cache," not "is a branch."
- `src/data/content-eval/plotHooks.ts` — stamp `usedBy` on `hook.impossible_bargain`.

**Not required:** no engine changes, no new types, no new `NpcRole`/sublocation type/effect
kind. Every primitive this template needs is already live.

Full detail, block-by-block Composition Contract verification, the reachability table, and
the two documentation-accuracy findings: `Docs/plans/encounters/the-garrisons-price-systems.md`.

---

## Encounter Packet

# Encounter Pipeline: The Garrison's Price
> Scale: medium | Slug: the-garrisons-price | Pass: revised
> Revisions applied: consequence swap `thread` → `drive` (binding, THR-1221) · failure-side
> aftermath rewired so every chip is backed on the step-1 `fail_action` path · exhaustion chip
> folded (write kept) · `drive` wired via `plant_compulsion` on both steps' `failureMetadata` ·
> 2 honest-antagonist breaches rewritten (+1 softened) · 3 vagueness detector hits fixed ·
> **14 seam echoes fixed across 7 seam classes**, incl. 9 inside a single ending that the
> narrow opening→spine audit cannot see · **field classes re-scanned against
> `nudgeAuditDetectors.ts` rather than the spec page** (`overview` is `scene`,
> `change.detail` is `outcome` — the spec is drifted) · Rewards quota moved off card grants,
> which `allAftermathEffects` does not walk · `concepts` confirmed non-empty on all five
> chips · step-2 `failureAfterimage` contradiction fixed · `critical_success`
> fragment opener fixed · `fallback.overview` shows honesty instead of asserting it · Favor
> effect line no longer claims a prior obligation · R1 no longer grants a debt on a success
> band · `gp.walk_it_off` no longer a possible no-op · `initiation` de-ruled · crux tightened ·
> outcome ladder's phantom `near_miss` band corrected
> Date: 2026-08-24 | Pipeline version: 3.0 (Encounter Factory)
> templateId: `encounter.border.the_garrisons_price` | Batch: border-perils (THR-1221), row 6

**Binding inputs (not renegotiated here):**
[border-perils-brief.md](border-perils-brief.md) ·
[border-perils-batch-design.md](border-perils-batch-design.md) § *6 · The Garrison's Price* ·
[nudge-authoring-spec.md](../../../.claude/skills/encounter-pipeline/reference/nudge-authoring-spec.md) ·
[swollen-ford-exemplar.ts](../../../src/data/__fixtures__/nudge-exemplar/swollen-ford-exemplar.ts)

---
## 0. Mechanical design block (spec step 1 — written before a word of prose)

**0. The crux, in one plain sentence.** A free company holds the only gate on the agent's
road, and every price in their book costs something they cannot get back.

**0b. The title states the crux.** *The Garrison's Price* — a player reading the title
alone knows there is a garrison and it wants paying.

**0c. Catalogs** (one entry each, from [encounter-catalogs.md](../../canon/encounter-catalogs.md)):

| Axis | Pick |
|---|---|
| Shape | **Opt-in Complication** (gate + Test & Consequence) |
| Setting | `wayside` · `ruin` · `battlefield` · `stronghold` (all four, one opening each) |
| Pressure | `debt` (undertone `duty`) |
| Form | `bargain` |
| Objective | `negotiate` |
| Stakes | `passage` — *the road opens / opens early*; surface: movement, location gates |
| System | `movement` + `traits` (both **mature** tier) |

**0d. Hook.**
```
plotHookRolled: hook.impossible_bargain, hook.prophetic_investigation, hook.scarcity_crisis
plotHookTaken:  hook.impossible_bargain
```
Hook text: *"Every option on the table costs something irreplaceable, and the terms being
offered are honest."* **The word that binds the draft is `honest`.** The company is not a
villain and is not written as one: their contract lapsed two seasons ago, the pay stopped,
and they have held the post anyway because the road is what they have left. The prices are
real because the need is real. `usedBy` gets stamped on `hook.impossible_bargain` in
`src/data/content-eval/plotHooks.ts` at closeout.

> **Editorial note carried forward (Pass 2).** The honesty is load-bearing, not flavour:
> remove it and there is nothing to negotiate with, the hand becomes intimidation and
> evasion, and the `gold` step evaporates. Two drafted lines let the company slip into
> villainy — one saying it *"stopped pretending it was a negotiation"*, one saying it
> *"found more work"*. Both are rewritten below. **Any future edit that gives this company
> a motive beyond its own arithmetic is a regression.**

**1. Whose problem is this?** The agent's, by construction. Their road runs through the
gate. The company and the quartermaster are where the solution lives, not the subject of
the scene. Protagonist, never bystander.

**2. Which reach does each step test, and why is that the theme?**
- Step 1 — **`gold`** (Patron ↔ Extractor). The step is *about* what a thing is worth and
  who sets the figure. Chosen first; the scene grew from it.
- Step 2 — **`shadow`** (Saboteur ↔ Deceiver). The step is *about* getting out from under
  a claim without it growing. Carryover from step 1's band.

**3. Why is the agent here?** All four motive routes are honest, because a gate is
whoever's road it interrupts:
- `chance` — the road they were already walking ends at a barrier.
- `mission` — they were sent through, and the far side is where the errand is.
- `choice` — their own business is past this post and the low track costs days.
- `divine` — the god steered them onto this road.

**4. Which mechanics and objects play?** Decided now, before prose:

| Mechanic / object | Where it plays | Fact classification (prose rule 7) |
|---|---|---|
| Cast: the quartermaster | `supportBundle` actor binding, `{cast:officer}` | state **write** (spawn) / **read** (reuse) |
| Faction: `mercenary_company` | `factionDefId` on the cast spec; `reputation_with` writes | state **write** |
| Condition `trait.condition.exhausted` | step 2 `failureMetadata`; lifted by a crit-fail reaction | state **write** |
| Agreement `agreement.debt.minor` | failure-band reaction `attachment_grant` | state **write** |
| Agreement `agreement.favour.earned` | fallback reaction R1 `attachment_grant` | state **write** |
| Favor edge (`owes_favor`) | step-1 Favor card grant; step-2 Favor card `requiresFavor` gate | **write** then **read** |
| Doom clock | step-1 and step-2 Bargain cards `costs.doomDelta` | state **write** |
| Detection pressure | Heavy Hand cards `costs.detectionDelta` | state **write** |
| Intelligence record | step-1 Side-bet card grant | state **write** |
| Planted compulsion | `plant_compulsion` on **both** steps' `failureMetadata` | state **write** |
| Trait `trait.core.core_hope.vice` | `traitVariants` (forecast + difficulty + factor line) | state **read** (gate) |
| Carryover | step 2 `carryoverFactorLines`, keyed on step 1's band | derived |

**No base-prose sentence asserts agent history the graph does not hold.** The agent has
never been here; the scene says so by never claiming otherwise. The only prior-relationship
fiction in the encounter sits on the step-2 Favor card, which is `requiresFavor`-gated and
therefore dealt only when a real `owes_favor` edge exists.

**5. What are the rewards, and where does the tension sit?**
- **Baseline reward is passage** — the road stays a road. This is a `passage`-stakes
  encounter, and penalty-avoidance is the reward shape: the failure penalty is the low
  track (days), a standing shave, a figure the mortal cannot put down, and — where they got
  as far as working — `exhausted`. All game-legible.
- **Critical success** adds standing with the company on a faction surface — the mark
  that gets you through their posts cheaper next time.
- **Toll on failure**: a standing shave with the company and with the quartermaster, a
  planted compulsion toward paying work, and (step-2 path only) `exhausted`.
- **Tension sits on step 2.** Step 1 is where the price is *named* — cheap to walk away
  from. Step 2 is where it is *paid*, and where a bad set of terms becomes a real cost.
- **Quintessence stakes: light.** Nobody dies. Nobody is unmade. The erosion class this
  encounter can cost is time, kit, and a bit of the mortal's own attention.

**6. Does the mortal make a choice in this scene?** **Yes — one, and it is the opt-in
gate, decided by the mortal and never by the player.** See § 1 below, which writes it out
in full. It is *not* an `ActionStepBranch`: there is no authored second path to write,
because declining is the mortal declining to be in the encounter at all. No
`authoredChoices` anywhere in this template.

**7. Every promise pays off.** The opening promises a barrier, a book, and a price. Step 1
reads the price out of the book. Step 2 pays it. The aftermath says what the payment left
behind. Nothing is opened that the bands do not close — the quartermaster is a person with
a reason, not a mystery.

**8. Personalization + supporting content — the systems count.** Counted from the
*authored manifest*, not from prose:

| Connection | Authored where | Counts |
|---|---|---|
| `cast` | `supportBundle` actor spec `officer` | ✓ |
| `factions` | `factionDefId: 'mercenary_company'` on the cast spec | ✓ |
| `reputation` | `reputation_with` (faction and agent) in both steps' metadata and four reactions | ✓ |
| `conditions` | `condition_attachment` / `remove_condition` on `trait.condition.exhausted` | ✓ |
| `rewards` | `bond_change` in **step metadata** (`PERSISTENT_EFFECT_KINDS`), plus two `attachment_grant`s on reactions | ✓ |

**Five connections; the contract floor is three.** Removing `thread_strengthen` does not
touch the count — `bond_change` is in `PERSISTENT_EFFECT_KINDS` and is authored on both
steps' outcome metadata, which is a surface the validator walks. **The Rewards row
deliberately does not lean on `favor_creation` or `intelligence`**: those are *card grants*,
and `allAftermathEffects` walks reactions, `byOutcome` reactions and step metadata but
**not** card `grants`, so a quota resting on them would be resting on something the gate
cannot see. They are still real writes at runtime; they are just not load-bearing here.
Personalized address is live: the quartermaster reads the traveler's name out of the book
(`{cast:agent}` on the attributed line), never a generic address.

**Consequence draw (binding — `check:encounter` recomputes it from the template id):**

```ts
consequenceDraw: ['relationship', 'drive'],
consequenceSwap: {
  from: 'thread',
  to: 'drive',
  reason:
    'thread_* effects take literal ascendantId and mortalId, and neither field is '
  + 'registered in SCENE_SENTINEL_FIELDS, so no $actor/$target/$cast sentinel binds them; '
  + 'the ascendant node id is minted per run (asc.<archetypeId>), so no literal exists for '
  + 'an author to write. getOutgoingEdges finds nothing and the write no-ops with an '
  + 'edge_missing trace while check:encounter passes the family on kind-presence — a chip '
  + 'over a dead write, which is the Law 56 pathology. drive holds weight 4 in gold '
  + '(CONSEQUENCE_FAMILY_WEIGHTS), clearing the >=2 bar, and is the truer consequence for '
  + 'this crux: a price the agent cannot get out from under becomes work they cannot stop '
  + 'taking.',
},
```

**The hand as held, both families wired in context:**

- `relationship` → `bond_change` with `$cast:officer`, on **both** the success and failure
  sides. The quartermaster is the person who set the price and watched it paid or not paid;
  the tie is the encounter's own subject, not an addendum.
- `drive` → `plant_compulsion` on both steps' `failureMetadata`. **This is the crux read one
  level out.** The encounter is about a price you cannot get out from under — that is what
  the title says, what `debt` pressure means, and what step 2's purpose line tests. A mortal
  who could not meet an honest figure does not walk away three days poorer and forget it;
  the number stays with them and they start taking the work that pays. `encounterBias`
  toward `trade`, `acquire` and `hire` for 96 ticks, so the simulation bends their next
  several decisions toward earning — a consequence the player can watch happen on the map.

**Swap accounting.** One swap taken, recorded, with a mechanism-naming reason. No unrecorded
deviation. `drive` is drawn by no other encounter in the border-perils batch, so the trade
widens the batch's palette rather than doubling a cell.

**Reachability (THR-821).** Open-draw ambient content (`intrinsicTier: 'background'`), so
both steps sit under `NUDGE_OFF_REACH_MAX_DIFFICULTY` (0.45): **0.40** and **0.38**, both
rendering as `fair`. This is the open-draw branch of the reachability rule.

**Scene tag:** `border.gate.tollpost` (WS4 vocabulary; until the manifest exists the
fallback chain ends at EntityVisual).

**Tone:** not grim. Two people at a plank table, both of them right.

### Scale justification

Medium. Two beats, one named cast member, one faction surface touched, one condition, two
agreements — a road complication with teeth, not a saga. A third step would be a second
payment beat and would say the same thing twice; a single step would collapse *naming the
price* into *paying it*, which is precisely the seam the crux lives on. The reward weight
is passage plus a standing nudge, which is medium-scale by the batch's own stakes table.

---

## 1. THE OPT-IN GATE, written out

The shape catalog's `Opt-in Complication` row: *"The agent can decline: waiting/walking away
is a cheap, legible exit (a delay, a toll), and engaging opens one of the shapes above. The
engage/decline gate is itself agent-decided (personality)."*

**Who decides.** The mortal, through the ordinary encounter-selection pipeline — their own
scoring, their own values, their own read of what a day costs them. **The player never
decides whether to approach the gate.** The hand only leans the *terms* once the mortal is
already at the table. There is no card in either hand that argues for or against engaging,
and no `authoredChoices` layer anywhere in the template.

**No card lobbies the gate — checked card by card.** All eleven act on the table or on the
paying: the mortal's nerve while the figure is read, the officer's sense of obligation, the
doom clock, the shape of the terms, the company's arithmetic, what the traveler notices,
attention during the count, strength in the work, a debtor turning up, the body's last hour.
None argues *approach* or *walk away*. Neither hand contains an Undertow, a Compulsion or a
Kindled Ambition — the three types that could have leaned the gate — and the batch's
card-type budget for this row does not allocate them.

**The engage path.** The mortal walks up, the quartermaster opens the book, and the
encounter runs: step 1 (`gold`) settles what the price is, step 2 (`shadow`) settles what
paying it actually costs. Best case, the road opens early and the company's banner counts
them a payer. Worst case, they lose a day to the wall and carry an open line in a ledger.

**The decline path.** They do not stop. They take the low track east. The template is never
drawn for that agent on that pass, which is what "agent-decided" means mechanically —
declining is not a branch inside the encounter, it is the mortal not selecting the
encounter.

**What declining costs, concretely.** Three days east by the low track — a movement delay
and nothing else. Specifically, declining writes:

- **no condition** (nobody works the wall),
- **no standing change** with the company or the quartermaster (they never dealt),
- **no agreement, no favor, no mark, no compulsion**, and
- **no penalty of any kind on the agent.**

The delay is real and it is the *whole* cost. The prose states the alternative in plain
figures — "three days east" — in the `initiation`, so a player reading the scene can price
the exit before spending anything.

### The exit against the ladder — the arithmetic, not the assertion

Declining writes the **empty set**. Every engagement outcome writes a non-empty superset of
it. So the exit is strictly cheaper than the worst engagement by construction:

| Path | What the engine writes |
|---|---|
| **Decline** | nothing at all; cost is a movement delay |
| Fail step 1 → action `failure` | company standing −0.06, officer bond −0.15, a planted compulsion — **plus** the same low track |
| Fail step 1 → action `critical_failure` | the same writes; the fiction adds a full day held |
| Fail step 2 → action `failure` | all of the above **plus** `trait.condition.exhausted` |
| Fail step 2 → action `critical_failure` | the worst of all of it |

**The one honest asymmetry, and it is now a real write rather than a claim.** Failing the
*negotiation* is not the same as declining. A mortal who opens their mouth and haggles badly
loses a little standing with the company and with the quartermaster, because both watched
them try to shave the price, and the figure they could not meet stays with them afterwards.
That cost belongs to engaging, not to declining — it is the bounded risk the mortal accepted
by walking up to the table, and the exit stayed free right up to that moment. Below the
table, the exit is still there: step 1's `failBehavior` is `fail_action`, so a failed
negotiation *ends the encounter on the low track* — the same road declining takes, plus that
shave.

> **Why step 1 keeps `fail_action` (Pass 2 ruling).** Switching it to `continue_weakened`
> would make every failure path run step 2 and would close the aftermath's backing hole
> mechanically. It would also close the exit: a failed haggle would drag the mortal into
> paying anyway, and the exit would shut the moment they opened their mouth. The design is
> right; the aftermath wiring was wrong, and the aftermath is what changed. See § 17.

---

## 2. The scene-writer's checklist, answered in writing

Answers cover all four openings and the shared spine.

| # | Question | Answer |
|---|---|---|
| A1 | Where are we? | Four grounded places, one per class — a fort gatehouse, a broken keep the road runs through, a dug-in earthwork on old battle ground, a barrier pole on an open track. Each is sketchable before anyone speaks. |
| A2 | How does it feel? | Cold iron and wet rope under the hand; woodsmoke; the noise of a picket eating; failing afternoon light. At least two senses beyond sight in every opening. |
| A3 | Who is here? | Soldiers, named as a company, shown before they act. The quartermaster arrives in the spine, at the table, before any card or band refers to them. Nothing acts unannounced. |
| A4 | What must we know? | The road runs through here; the company holds it; nobody passes unpaid; the book is where the prices live. All stated before step 1 is asked for. |
| A5 | Complication last? | Yes. Each opening builds the place and the company; the spine lands the book on top of it. |
| B6 | Nothing unintroduced? | Barrier, book, plank table, quartermaster, picket and low track all appear in prose before any card, factor or band names them. The **low track** is named in the `initiation`, which every class reads. |
| B7 | Visible causes? | The lapsed contract explains the toll; the open ledger line explains why step 2 is work; the wall-work explains the exhaustion. |
| B8 | No contradictions? | **Yes, after one repair.** One road, one barrier, one book, one quartermaster. The openings own their scenery; the spine owns the table. The hour is left open in three openings and set as late afternoon in the battlefield one, which nothing later contradicts. The drafted step-2 `failureAfterimage` said *"The barrier lifted"* on a band where the failure narrative, the band overview and the ladder all say the barrier stayed down — rewritten below to match. |
| C9 | Would a real person? | Yes — travelers do not charge barriers, they talk to whoever keeps them. The low track exists and is priced, so stopping is a choice rather than a corner. |
| C10 | People as people? | The quartermaster reads the book rather than inventing a figure; the picket watches without interfering; the company is short of pay and says so once, flatly. At the worst band the quartermaster's answer to being argued with is to read the same line back in the same voice. |
| C11 | True costs? | Time, kit, a day's labour, a name given away, and a figure the mortal cannot put down afterwards. Carried in the bands, the afterimages, the condition and the compulsion, never waved at. |
| D12 | Stake in one sentence? | *Do they get through this gate today on terms they can actually pay, or do they lose three days east and a day on somebody's wall?* Good outcome: the barrier lifts, the line is struck through, the company counts them a payer. Bad outcome: the low track, a spent body, and a mark still open in a ledger they will pass again. |
| D13 | Cards grounded? | Every card acts on what the scene put on the table — the book, the figure, the picket watching, the debt. Delete the ledger from the prose and the whole hand is senseless here. |
| D14 | Mechanism, not mood? | Every `effectLine` states what the god does and why that moves the odds, plainly, no digits. |
| D15 | Openings cover the envelope? | `settings: ['stronghold','ruin','wayside','battlefield']`, four openings, enforced by `validateSettingEnvelope`. |

---

## 3. Pressure knot — what is already in motion

A free company took a contract to hold this post two seasons ago. The contract lapsed. The
pay stopped. Nobody came to relieve them and nobody sent word, so they stayed, because the
post is the one asset they still hold and a held road pays. They are not raiders — they
keep a book, they read the prices out of it, and they take the same from everybody. That is
what makes the price honest and what makes it heavy: the figures are not a shakedown, they
are the arithmetic of a company feeding itself off a road.

## 4. Intervention fantasy

The god is at the table without being at the table. A traveler is being quoted a price
they cannot really afford, by people who cannot really lower it, and the god's whole
repertoire here is **weight on a scale**: steady the nerve, set an obligation in the
quartermaster's mind, lean on the company's own ledger, take the price out of the world's
clock instead of the traveler's pack. The fantasy is not rescue. It is being the reason a
figure came out one line cheaper — and then, on the second step, the reason getting clear
of it did not cost a day.

## 5. Cast and world objects

| Object | Kind | Id / spec | Persistence |
|---|---|---|---|
| The quartermaster | cast actor | `supportBundle` key `officer`, `factionDefId: 'mercenary_company'` | must-persist |
| The free company | faction | `mercenary_company` (`FACTION_DEFINITIONS`) | world-owned |
| The open line in the book | agreement | `agreement.debt.minor` (`AGREEMENT_REWARD_TEMPLATES`) | granted by a failure-band reaction |
| A courtesy left standing | agreement | `agreement.favour.earned` (`AGREEMENT_REWARD_TEMPLATES`) | granted by fallback reaction R1 |
| A day on the wall | condition | `trait.condition.exhausted` (`CONDITION_TRAIT_DEFINITIONS`) | granted on step-2 failure |
| Standing with the company | reputation surface | `reputation_with` → `targetFactionId` | edge |
| Standing with the quartermaster | reputation surface | `reputation_with` → `$cast:officer` | edge |
| The figure they cannot put down | planted compulsion | `plant_compulsion`, `encounterBias` toward paying work | 96 ticks |
| What the company is short of | intelligence | `intelligence`, category `military_position` | record |
| A turn owed | favor edge | `favor_creation`, debtor `$cast:officer` | edge |

## 6. Beat structure

- **Beat 1 — `gold`, "Hear the terms"** (difficulty 0.40 → `fair`, `failBehavior: 'fail_action'`).
  The book is open and a figure gets named. Six cards.
- **Beat 2 — `shadow`, "Get out from under"** (difficulty 0.38 → `fair`,
  `failBehavior: 'fail_action'`, carryover from beat 1). The figure gets paid, in public,
  without the ledger growing a second line. Five cards.

## 7. Branching profile

- Branch depth: **linear**
- Branch count: **0**
- Linear — no branching. The one decision in this encounter is the engage/decline gate,
  which is resolved *outside* the template by the mortal's own selection (§ 1). No
  `ActionStepBranch`, no `decidedBy`, no `poleLean`, no `authoredChoices`.

## 8. Branching map

N/A — linear encounter.

---

## 9. Setting envelope and the four openings

```ts
settings: ['stronghold', 'ruin', 'wayside', 'battlefield'],
locationSubtypes: expandSettings(['stronghold', 'ruin', 'wayside', 'battlefield']),
```

Excluded batch-wide: `urban`, `rural`, `sacred`, `arcane`.

**stronghold** (≈59 words)
> The road ends at a gatehouse, and the gatehouse is shut. A company banner hangs over the
> arch where somebody else's arms used to be, wet through and left up anyway. Two soldiers
> stand the wicket with the bored patience of people who do this all day. Neither of them
> reaches for the bolt.

**ruin** (≈57 words)
> The road runs straight through what is left of a keep and the company has made a gate of
> the gap. Fallen stone is stacked shoulder-high on both sides of the opening, and a beam
> has been dropped across it on two forked posts. Somebody is cooking behind the wall.
> The smoke comes out through the roofless top.

**wayside** (≈57 words)
> A pole lies across the track on two crutches, and a rope runs from it to a tent peg so it
> can be lifted from a seat. Six tents stand back from the road in a line, and a picket line
> of horses behind them. Nobody is hurrying. Nobody here has had to stand up all day.

**battlefield** (≈59 words)
> The old earthworks still run across the valley, and the road crosses them at the one cut
> anybody ever kept clear. The company has dug into the bank on both sides of the cut and
> filled the gap with what the fighting left — cart beds, a broken door, a wagon wheel
> laid flat. The afternoon light is going yellow and low.

**Setting-neutral spine** — this is step 1's `narrativeTemplate`, and it may not name a
gatehouse, a wall, a tent or an earthwork:

> The road stops at a barrier the company put across it. Their quartermaster keeps a ledger
> on a plank table and reads the prices out of it — a day of work, a piece of kit, a name,
> an errand carried on. Nobody goes past unpaid. The price has to be settled before the
> barrier lifts.

**Opening → spine seam check (rewritten after Pass 2 found two).** Two of the four drafted
openings handed the spine an image it was about to use:

- **stronghold** closed on *"a plank table has been set across the passage"*, and the spine's
  second sentence is *"keeps a ledger on a plank table"*. The closer now ends on the two
  soldiers not reaching for the bolt — an action withheld, which hands to *"The road stops
  at a barrier"* without pre-spending the table.
- **wayside** closed on *"The barrier is enough, and everybody here knows it"*, and the
  spine opens *"The road stops at a barrier"*. It now closes on *"Nobody here has had to
  stand up all day"*, which says the same thing about the post's authority with a concrete
  image instead of an abstract noun (plainness move 2) and leaves *barrier* to the spine.

No opening uses the words *ledger*, *quartermaster*, *price* or *plank table*, so the spine
introduces all four. No two openings share a sentence shape: the stronghold one closes on a
withheld action, the ruin one on smoke, the wayside one on a flat statement, the battlefield
one on light.

### `narrativeTemplates`

```ts
initiation:
  'There is no other road through these hills but this one, and a company is sitting on it. '
  + 'The low track goes around, three days east.',
success:
  'The line went into the ledger and came back out again struck through. The barrier lifted '
  + 'and the road on the far side is theirs to walk.',
failure:
  'The barrier stayed down. It is three days east by the low track now, on a body that has '
  + 'already spent the afternoon.',
```

`initiation` is the only surface that states the alternative in figures, and it states it
before the player has spent anything — that is what makes the exit legible rather than
discoverable, which the shape catalog requires.

**Two Pass-2 edits here, and the second is a seam the draft's audit could not have caught.**
The drafted *"Pay one and the road stays a road"* framed the gate as pass/fail rules text
(REVISE trigger 25) and is gone. More seriously, the drafted `initiation` also carried *"a
company holds the only gate… their book has a price in it for every traveler… the barrier
goes up"* — the book, the price, the company-on-the-gate and the barrier, **all four of
which the spine names again in the sentence that renders immediately after it**. The two
surfaces now divide the work: the `initiation` owns the road's exclusivity and the exit's
price, the spine owns the book, the table, the quartermaster and the barrier. Neither
repeats a noun of the other's.

---

## 10. Per-step test panel data

### Step 1 — `gold`

| Field | Value |
|---|---|
| `reach` | `gold` |
| `purposeLine` | **"Settle the price"** (3 words, ≤4) |
| `difficulty` | `0.40` → renders `fair` |
| `duration` | `{ min: 1, max: 2 }` |
| `failBehavior` | `'fail_action'` — a failed negotiation *is* the exit (§ 1) |
| `factorLines` | **none authored** (the variance rule, THR-892) |
| `carryoverFactorLines` | none — first step |

**Why no static factor lines.** "The company is short of pay", "the book sets the figure"
and "the picket is watching" read identically on every run, so they are priced into
`difficulty: 0.40` and carried by the prose. The panel's variance lines — the actor's `gold`
capability, the trait-variant line below, any equipment or condition modifiers — are derived
by `computeResolutionModifiers`, not authored here.

### Step 2 — `shadow`

| Field | Value |
|---|---|
| `reach` | `shadow` |
| `purposeLine` | **"Get out from under"** (4 words) |
| `difficulty` | `0.38` → renders `fair` |
| `duration` | `{ min: 1, max: 2 }` |
| `failBehavior` | `'fail_action'` |
| `factorLines` | none authored |

**`carryoverFactorLines`** — the surviving authored factor surface, variant by construction,
keyed on the band step 1 rolled:

```ts
carryoverFactorLines: {
  critical_success: { text: 'They owe the cheapest line in the book.',        polarity: 'for',     forecastDelta:  0.05 },
  success:          { text: 'The figure they agreed is one they can carry.',  polarity: 'for',     forecastDelta:  0.03 },
  success_at_cost:  { text: 'They agreed to more than the book asked for.',   polarity: 'against', forecastDelta: -0.03 },
  near_miss:        { text: 'The ledger says more than they remember saying.',polarity: 'against', forecastDelta: -0.05 },
},
```

`failure` and `critical_failure` are deliberately absent: step 1's `fail_action` ends the
encounter there, so step 2 is unreachable from those bands and a line for them would be
authored prose nothing can render. Every line names its own source inside the sentence
(canon rule 1) — no label beside it. Each is ≤12 words.

---

## 11. Trait hooks (all four answered)

1. **Gate?** — **No.** A barrier stops everyone the same. `requiredTraits` and
   `blockedByTraits` stay unset.
2. **Variant?** — **Yes.** `trait.core.core_hope.vice` (the "Reads each good turn as the
   bait before the trap" pole of Core hope — a seeded definition, live under
   `validateTraitRefs()`). A traveler who assumes every offer hides a hook haggles harder
   and reads the book's fine print, which is exactly the `gold` step's action.
   ```ts
   traitVariants: [{
     traitId: 'trait.core.core_hope.vice',
     forecastDelta: 0.04,
     difficultyDelta: -0.02,
     factorLine: 'Reading the offer for its trap, they ask what the line means.',
   }],
   ```
3. **Trait-only nudge?** — **No, and this is a batch-budget decision, not an omission.**
   The batch's card-type allocation assigns `trait_card` to encounters 2 and 5; #6's budget
   is `bargain / favor / side_bet / boost (≤2) / gambit / heavy_hand`. Adding a trait card
   here would spend a type this encounter was not allocated and weaken the batch's
   anti-convergence spread. `addNudgeIds` is therefore absent from the variant.
4. **Trait fragment?** — **No.** The variant's `factorLine` carries the trait, and a
   band fragment would say the same thing a second time.

---

## 12. The hand per step

**Card faces are library-generic.** Every card matching a library member sets
`libraryCardId` and takes its `name` and `fiction` **verbatim from `CARD_CONTENT`** in
`src/data/nudge-card-library.ts` — that is what makes it the same card rather than a
lookalike, and it is what finally gives `cardPlayTally`, the twilight harvest and the echo
card real data (the brief's standing instruction: zero authored templates set
`libraryCardId` today). Nine card instances across the two hands, drawing on six distinct
library ids; all six verified character-for-character against source in Pass 2.

**`effectLine` is authored per instance, by design.** `NudgeCardContent` carries only
`title`, `quote` and an optional `imageTag` — there is no `effectLine` in the library, and
the spec's interim rule is explicit that *"authored hand instances name their targets
directly"* (the exemplar does this on every card). Naming this scene's table, book and tally
in an effect line is therefore the schema's design, not scene-bespoke prose on a face.

**Two cards are deliberately outside the library** and carry no `libraryCardId`:

- **The Side-bet on step 1** is **forced, not chosen.** `side_bet` is one of the 21 types
  and has **zero members** in `NUDGE_CARD_LIBRARY`: it is absent from `UNIVERSAL_CORE_TYPES`
  (`boost`/`insurance`/`mercy`/`trait_card`), signs no sphere in `SPHERE_SIGNATURES`, is not
  a hunger unique, and is not among `VARIATION_MEMBERS`. There is no id to name. Recorded in
  a code comment on the card in exactly those terms, so a future reader does not "fix" it.
- **The Favor *call* on step 2.** Both existing Favor members are mint-side: `card.favor.
  signature.order` (*"The Ledger Opens"* — *"Order is only debt everyone agreed to honor"*)
  and `card.favor.hunger.bind` (*"A Debt Written"* — *"Every civilization runs on who owes
  whom"*). Neither face is about **collecting** a debt on the day you need it. Dealing one
  of them here would be the same face doing the opposite verb, which is worse than a one-off
  because it would poison the library's own play data.

### Step 1 hand — six cards, six types

| # | Type | `libraryCardId` | Sphere | Essence | Δ | Rider | Cost channel | Grant |
|---|---|---|---|---|---|---|---|---|
| 1 | Boost | `card.boost.core` | — (common) | 1 | 0.06 | — | — | — |
| 2 | Favor | `card.favor.signature.order` | order | 2 | 0.10 | — | — | `favor_creation` |
| 3 | Bargain | `card.bargain.signature.entropy` | entropy | **0** | 0.12 | — | `doomDelta 0.05` | — |
| 4 | Gambit | `card.gambit.signature.chaos` | chaos | 1 | 0.03 | `all_or_nothing` | — | — |
| 5 | Heavy hand | `card.heavy_hand.signature.force` | force | 2 | **0.16** | — | `detectionDelta 0.15` | — |
| 6 | Side-bet | *(one-off — the library type has no members)* | — (common) | 2 | 0.07 | — | — | `intelligence` |

**Guardrails.** 6 cards (4–8 ✓) · 4 distinct spheres — order, entropy, chaos, force (≥4 ✓)
· 2 ungated common options (≥1 ✓) · **1 rider** (≤1 ✓) · 1 Boost (≤2 ✓) · 6 distinct types
(≥3 ✓) · hand total Δ **0.54** (≤0.70 ✓) · difficulty + hand = 0.40 + 0.54 = **0.94**,
inside [0,1] ✓. With the trait variant at its worst (`+0.04` forecast, `−0.02` difficulty)
the sum is 0.38 + 0.58 = **0.96**, still inside ✓.

**No two cards answer the same question:** *can they hold their nerve at the table* (1),
*does the quartermaster owe anybody* (2), *can the price be paid out of the world instead of
the pack* (3), *does the middle drop out of this* (4), *can the company's own arithmetic be
leaned on* (5), *is there value here beyond today's figure* (6).

---

**1 · `card.boost.core` — "A Little More"** · common · 1 essence · Δ 0.06 ·
`imageTag: 'generic.focus'`

- `fiction`: *"Most things fail by a margin."*
- `effectLine`: **"You hold their nerve steady while the figure is read out, so they do not take the first number to end the silence. A small help."**
- `bandProse`:
  - `success`: "They let the silence sit after the figure, and the figure came down."
  - `failure`: "Steady to the end, and the book still did not move."

**2 · `card.favor.signature.order` — "The Ledger Opens"** · order · 2 essence · Δ 0.10 ·
`imageTag: 'generic.oath'`

- `fiction`: *"Order is only debt everyone agreed to honor."*
- `effectLine`: **"You set an obligation in front of the one holding the book, and they deal like a person who owes a turn. A real help — and a turn is owed back afterwards."**
- `grants`:
  ```ts
  [{ kind: 'favor_creation', magnitudeRange: [0.15, 0.3],
     context: 'Dealt fairly at the gate when the book said otherwise',
     debtorAgentId: '$cast:officer' }]
  ```
  *(`favor_creation` mints `owes_favor` with debtor = the named party, creditor = the actor.
  `debtorAgentId` is a registered scene sentinel (THR-1175), so `$cast:officer` binds.
  Playing this card on step 1 can therefore open the step-2 Favor card's `requiresFavor`
  gate — grants fire after the step resolves, before the next step deals.)*
- `bandProse`:
  - `success_at_cost`: "The quartermaster dealt like a debtor and priced like one too — high, and honest about it."
  - `failure`: "An obligation went across the table and came back unrecognised."

> *Pass-2 edit: the drafted line read "You put **an old** obligation in front of…", which
> asserts a prior obligation the graph does not hold — on the card whose whole job is to
> mint one. Prose rule 7 in miniature. "Set" replaces "put an old".*

**3 · `card.bargain.signature.entropy` — "Pay It Elsewhere"** · entropy · **0 essence** ·
Δ 0.12 · `costs: { doomDelta: 0.05 }` · `imageTag: 'generic.decay'`

- `fiction`: *"Nothing is free. Some prices are only slower."*
- `effectLine`: **"No essence changes hands: the world's doom clock runs a shade faster instead. A strong help."**
- `bandProse`:
  - `success`: "Nobody at the table could say why it came out light. The clock ran on."
  - `critical_failure`: "The clock took the price, and the traveler was still standing where they started."

*(Zero essence is legal here because a named channel carries the price — spec § hand-building.
This is the exemplar's own pricing shape at `ford.pay_it_later`, unchanged.)*

**4 · `card.gambit.signature.chaos` — "No Middle Ground"** · chaos · 1 essence · Δ 0.03 ·
`rider: 'all_or_nothing'` · `imageTag: 'generic.luck'`

- `fiction`: *"Chaos has no use for the adequate."*
- `effectLine`: **"The middling terms wash out: they walk away with the best line in the book or with none of it. The middle drops away."**
- `bandProse`:
  - `critical_success`: "No middle figure was ever put on the table. What was left was the one at the bottom."
  - `failure`: "No middling figure survived to be agreed to."
  - `critical_failure`: "There was one price left on the table by the end, and it was the worst one."

**The hand's one rider, justified.** Chaos's signature reshapes the ladder instead of
climbing it, and it is priced cheap because the widened downside *is* the price. A second
rider would answer the same question — what shape does the outcome take — twice. Its
fragments sit on the three bands `all_or_nothing` leaves reachable.

**5 · `card.heavy_hand.signature.force` — "Full Weight"** · force · 2 essence · Δ **0.16** ·
`costs: { detectionDelta: 0.15 }` · `imageTag: 'generic.strength'`

- `fiction`: *"Subtlety is a choice. This is not it."*
- `effectLine`: **"You press on the whole table at once and the company's own arithmetic comes out in the traveler's favour. Rival gods can hardly miss the hand that did it."**
- `bandProse`:
  - `critical_success`: "The figures stopped agreeing with the company and started agreeing with the traveler."
  - `failure`: "The weight went on. The company added it up again and got the same figure."
  - `critical_failure`: "The pressure was plain enough that the picket stopped eating to watch, and the quartermaster closed the book."

*Big delta (≥ `NUDGE_BIG_DELTA` 0.15) ⇒ both `failure` and `critical_failure` fragments, per spec § 4.*

**6 · Side-bet — "Worth Keeping"** · one-off, no `libraryCardId` · common · 2 essence ·
Δ 0.07 · `imageTag: 'generic.matter'`

- `fiction`: *"Every table tells you more than it means to."*
- `effectLine`: **"A modest help now, and win or lose the traveler leaves knowing what this company is short of. The knowledge keeps."**
- `grants`:
  ```ts
  [{ kind: 'intelligence', category: 'military_position',
     label: 'What the gate company is short of',
     detail: 'The post is held on a lapsed contract. They are short of pay, salt and boots, '
           + 'and their book prices all three above coin.',
     reliability: 0.8 }]
  ```
- `bandProse`:
  - `near_miss`: "The figure was never agreed, and the shortages behind it were counted anyway."
  - `failure`: "No figure was agreed. What they read off the table while it failed keeps."

*Type note (goes in a code comment): `side_bet` has **no member** in `NUDGE_CARD_LIBRARY` —
absent from `UNIVERSAL_CORE_TYPES`, from every row of `SPHERE_SIGNATURES`, from
`HUNGER_UNIQUE_CARDS` and from `VARIATION_MEMBERS`. There is no id to set, so the one-off is
forced rather than preferred. It is one of the eight zero-use types the batch was cut to
exercise. Do not "repair" this by pointing it at another type's member.*

### Step 2 hand — five cards, four types

| # | Type | `libraryCardId` | Sphere | Essence | Δ | Rider | Cost channel | Gate |
|---|---|---|---|---|---|---|---|---|
| 1 | Boost | `card.boost.core` | — (common) | 1 | 0.08 | — | — | — |
| 2 | Heavy hand | `card.heavy_hand.signature.force` | force | 2 | **0.15** | — | `detectionDelta 0.15` | — |
| 3 | Bargain | `card.bargain.signature.entropy` | entropy | **0** | 0.12 | — | `doomDelta 0.06` | — |
| 4 | Favor (call) | *(one-off — no library member is call-side)* | order | 1 | 0.10 | — | — | `requiresFavor` |
| 5 | Boost | `card.boost.signature.energy` | energy | 2 | 0.08 | — | — | — |

**Guardrails.** 5 cards (4–8 ✓) · 4 distinct spheres — force, entropy, order, energy (≥4 ✓)
· 1 ungated common option (≥1 ✓) · **0 riders** (≤1 ✓) · 2 Boosts (≤2 ✓, and they buy
different certainties: attention vs body) · 4 distinct types (≥3 ✓) · hand total Δ **0.53**
(≤0.70 ✓) · difficulty + hand = 0.38 + 0.53 = **0.91**, inside [0,1] ✓.

**Repeats across the two hands are deliberate and re-angled.** Boost, Heavy hand and
Bargain each deal in both hands with a different job — nerve at a table versus attention
during a payment, arithmetic versus manpower, a cheaper figure versus a shorter day. The
`libraryCardId` is the same because it is the same card; the `id`, the `effectLine`'s
subject and every fragment are the step's own.

---

**1 · `card.boost.core` — "A Little More"** · common · 1 essence · Δ 0.08 ·
`imageTag: 'generic.focus'`

- `fiction`: *"Most things fail by a margin."*
- `effectLine`: **"You keep their attention on the count while it is made, so nothing is added to the tally behind them. A real help."**
- `bandProse`:
  - `success`: "They watched every mark go down, and the count ended where it should have."
  - `near_miss`: "They caught the extra line going in. Catching it did not stop it."

**2 · `card.heavy_hand.signature.force` — "Full Weight"** · force · 2 essence · Δ **0.15** ·
`costs: { detectionDelta: 0.15 }` · `imageTag: 'generic.strength'`

- `fiction`: *"Subtlety is a choice. This is not it."*
- `effectLine`: **"You put strength into the work itself and the day's labour goes in a third of the day. Rival gods can hardly miss the hand that did it."**
- `bandProse`:
  - `critical_success`: "The work went down so fast that the picket came round the wall to watch it."
  - `failure`: "The strength went in and the tally kept taking it, mark after mark."
  - `critical_failure`: "They worked like three people in front of a company that counts, and the book had already decided what a day was."

*Big delta ⇒ both failure bands covered.*

**3 · `card.bargain.signature.entropy` — "Pay It Elsewhere"** · entropy · **0 essence** ·
Δ 0.12 · `costs: { doomDelta: 0.06 }` · `imageTag: 'generic.decay'`

- `fiction`: *"Nothing is free. Some prices are only slower."*
- `effectLine`: **"No essence changes hands: the world's doom clock runs a shade faster instead. A strong help."**
- `bandProse`:
  - `success_at_cost`: "The overage went out to the world. The world will be a while paying it off."
  - `failure`: "The debt went out to the world, and the ledger in front of them stayed open."

**4 · Favor (call) — "A Turn Called In"** · one-off, no `libraryCardId` · order · 1 essence ·
Δ 0.10 · `requiresFavor: true` · `imageTag: 'generic.oath'`

- `fiction`: *"A debt is only useful on the day you name it."*
- `effectLine`: **"Only when the traveler is owed: you bring the debt to mind at the gate, and the one who owes it turns up to stand the work. A real help."**
- `bandProse`:
  - `success`: "Two pairs of hands finished a tally written for one, and the ledger closed on time."
  - `critical_failure`: "The debt was called and answered, and the book has a line for every pair of hands that comes through the gate."

*Type note (code comment): the **call** variant of the Favor has no library member — the two
that exist (`card.favor.signature.order`, `card.favor.hunger.bind`) are both mint-side, by
their authored faces as well as their mechanics. This face stays a one-off and exercises
`requiresFavor`, the runtime gate with no content users. Priced at 1 essence rather than 0
deliberately: the card does **not** redeem the favor edge, so pricing it on an obligation
channel would claim a write nothing performs.*

**5 · `card.boost.signature.energy` — "A Sudden Surge"** · energy · 2 essence · Δ 0.08 ·
`imageTag: 'generic.energy'`

- `fiction`: *"Bodies hold more than they admit."*
- `effectLine`: **"When the work outlasts them, the body finds the last hour of it. A real help."**
- `bandProse`:
  - `success`: "The last hour came out of a reserve they had not budgeted for."
  - `failure`: "There was one more hour in them. The tally asked for three."

### Band coverage — all six `StepOutcome`s, both steps

| Band | Step 1 covered by | Step 2 covered by |
|---|---|---|
| `critical_success` | Gambit, Heavy hand | Heavy hand |
| `success` | Boost, Bargain | Boost, Favor(call), Boost(energy) |
| `success_at_cost` | Favor | Bargain |
| `near_miss` | Side-bet | Boost |
| `failure` | Boost, Favor, Gambit, Heavy hand, Side-bet | Heavy hand, Bargain, Boost(energy) |
| `critical_failure` | Bargain, Gambit, Heavy hand | Heavy hand, Favor(call) |

**Every card carries at least one failure-texture fragment** (`near_miss` counts as failure
texture for authoring). **Every big-delta card covers both failure bands.** No fragment
appears in base band text — the afterimages below are what happens when the god did nothing.

---

## 13. Band base prose — the afterimages

`ActionStep` carries five afterimage fields, not six: there is no near-miss afterimage, and
near-miss is paid off through fragments alone.

### Step 1 (`gold`)

| Field | Text |
|---|---|
| `successAfterimage` | "They settled on a figure and watched it go into the ledger in front of them." |
| `failureAfterimage` | "The quartermaster closed the book and put a hand flat on the cover." |
| `successAtCostAfterimage` | "The figure went into the ledger heavier than the book's own line for it." |
| `criticalSuccessAfterimage` | "The quartermaster read them the smallest price on the page and wrote it down." |
| `criticalFailureAfterimage` | "The haggling ran long, and the quartermaster read the same line back a third time, in the same voice." |

> *Pass-2 edit on `failureAfterimage`.* The drafted line was *"The book closed. The barrier
> stayed down."* — whose second sentence is **verbatim** the opening sentence of
> `narrativeTemplates.failure`, which renders in the same ending. See the widened seam audit
> below.
>
> *Pass-2 edit on `criticalFailureAfterimage`.* The drafted line — *"the company stopped
> pretending it was a negotiation"* — made the book theatre and the whole scene a front,
> which is the exact opposite of the hook's binding word and lands at the band a player is
> most likely to read as the encounter's real opinion of the company. The replacement is
> more final and less kind: the company's answer to being argued with is to read you the
> page again, in the same voice. There is nothing to argue with.

### Step 2 (`shadow`)

| Field | Text |
|---|---|
| `successAfterimage` | "They counted it out in front of the picket, and the quartermaster called it settled." |
| `failureAfterimage` | "The tally ran past what they had left in them, and the quartermaster stopped counting." |
| `successAtCostAfterimage` | "The ledger closed, and a second line went in beside the first before it did." |
| `criticalSuccessAfterimage` | "They paid, the quartermaster struck the line through, and the company let them go early." |
| `criticalFailureAfterimage` | "The company kept them a full day, and the day went into the book as well." |

> *Pass-2 edit on `failureAfterimage`.* The drafted line read *"The barrier lifted. The mark
> in the ledger did not close."* — which says they got through, on the one band where the
> failure narrative (*"The barrier stayed down"*), the band overview and the outcome ladder
> all say they did not. The afterimage was the outlier. The replacement also clears the
> "barrier stayed down / barrier did not move" restatement against `narrativeTemplates.failure`.

### The widened seam audit — every surface that lands inside one ending

**The narrow audit is not enough, and this encounter is the proof.** Checking
`opening→spine` and `spine→band` — which is what the draft did — found two echoes. Checking
the seams *inside a single ending*, where the afterimage, the `narrativeTemplates` line, the
band `overview` and up to five card fragments land on the player in sequence seconds apart,
found **nine more**, including three verbatim repeats. REVISE trigger 22's wording says
"across a paragraph boundary"; these are not paragraph boundaries and they are the same
defect, read louder — the surfaces are closer together than paragraphs are.

Enumerated: 2 steps × 6 `StepOutcome`s for the base/fragment seams, 5 `byOutcome` bands for
the afterimage/narrative/overview seams, and 5 chips across 5 bands for the chip↔chip seams.

| Seam class | Checked | Found | Where |
|---|---|---|---|
| opening → spine | 4 | 2 | § 9 |
| `initiation` → spine | 1 | **1** | § 9 — four shared nouns in adjacent surfaces |
| afterimage → band `overview` | 5 bands × 2 steps | **5** | below |
| `narrativeTemplates.*` → afterimage / `overview` | success + failure lines × 5 bands | **3** | below |
| base band text → card fragment | 12 (2 steps × 6 bands) | **4** | § 12 |
| card fragment ↔ card fragment (co-active on one band) | 12 | **2** | § 12 |
| chip ↔ chip within one band | 5 bands | **2** | § 17 |
| step → step | 1 | 0 | below |

**afterimage → `overview`, all five bands.** Every drafted overview restated the afterimage
that renders directly above it — *"They paid… the quartermaster struck the line"* against
*"They paid before the light went… The quartermaster struck the line out"*; *"The ledger
closed"* against *"The line closed"*; *"the day went into the book"* against *"wrote the day
down"*. All five overviews are rewritten at § 17 so that each says what its **chips** are
about rather than saying the afterimage again.

**`narrativeTemplates` → the band surfaces.** Three verbatim repeats:
`narrativeTemplates.failure` opens *"The barrier stayed down."* and the drafted `failure`
overview opened with the same five words, while step 1's drafted `failureAfterimage` closed
with them — the same sentence three times in one ending. *"Three days east by the low
track"* likewise sat in the narrative line and both failure overviews.
`narrativeTemplates.success` (*"The barrier lifted and the road on the far side is theirs to
walk"*) restated step 2's drafted `successAfterimage` (*"walked through the barrier with the
road ahead of them"*). All fixed on the afterimage and overview sides; the two
`narrativeTemplates` lines are the encounter-card text and are left alone.

**base band text → fragment, and fragment ↔ fragment.** Four and two, fixed at § 12. The
fragment↔fragment pair is the class most easily missed, because it only surfaces when you
ask *which of these can be active at the same time*: on step 1's `failure` band, Boost
(*"the book still did not move"*), Heavy Hand (*"the price came out unchanged"*) and Side-bet
(*"The table went nowhere"*) were three cards saying nothing moved, and all three can be
played on one run.

**Step → step: clean.** Step 1's afterimages end on the book (a figure written, a hand on
the cover, a line read back). Step 2's spine opens on the paying. No restatement.

**Step 2's spine** (`narrativeTemplate`):

> Saying the price was quick. Paying it is not. The company wants the full measure counted
> in front of everyone, and a ledger with a mark still open on it is a ledger that grows.
> Getting clear of it before the company finds a second line to add is the work now.

---

## 14. Outcome ladder

`byOutcome` keys on `UnifiedActionOutcome`, which is `success · failure · contested_won ·
contested_lost · critical_success · critical_failure · success_at_cost`. **There is no
action-level `near_miss`** — it is a per-step `StepOutcome` that counts as a step success
(`isStepSuccess`), so a step-2 near miss aggregates into `success` at the action level. The
`near_miss` row the draft carried here was a domain error; the card fragments and the
carryover line that use `near_miss` are correct and untouched.

| Band | Progress made | What was spent | New burden or opening |
|---|---|---|---|
| `critical_success` | Through the gate early, on the smallest price in the book. | An afternoon. | The company's banner counts them a payer — standing that carries at their other posts. |
| `success` | Through the gate on terms they could pay. | The price the book named. | The quartermaster knows their face and thinks well of it. |
| `success_at_cost` | Through the gate. | The price, and one more line beside it. | The company's standing is earned and the traveler is lighter than they should be. |
| `failure` | Not through. Three days east by the low track. | An afternoon at the table, and a day of the company's work if they got as far as paying. | A shaved standing with the company and with its quartermaster, and a figure they cannot put down. |
| `critical_failure` | Not through, and a full extra day held. | Two days, and a body if they worked. | The same standing loss and the same figure following them; where the day was worked, an exhaustion as well. |

**The ladder against the exit.** Declining writes nothing at all — no condition, no standing
move, no agreement, no compulsion — and costs a movement delay. Every band above writes a
non-empty superset of that. The exit is therefore strictly cheaper than the worst engagement
by construction, which is the arithmetic that makes this an opt-in rather than a toll.

---

## 15. Sample opening paragraph (the `wayside` class, full prose)

> A pole lies across the track on two crutches, and a rope runs from it to a tent peg so it
> can be lifted from a seat. Six tents stand back from the road in a line, and a picket line
> of horses behind them. Nobody is hurrying. Nobody here has had to stand up all day.
>
> The road stops at a barrier the company put across it. Their quartermaster keeps a ledger
> on a plank table and reads the prices out of it — a day of work, a piece of kit, a name,
> an errand carried on. Nobody goes past unpaid. The price has to be settled before the
> barrier lifts.

## 16. Linear continuation (the later paragraph)

> Saying the price was quick. Paying it is not. The company wants the full measure counted
> in front of everyone, and a ledger with a mark still open on it is a ledger that grows.
> Getting clear of it before the company finds a second line to add is the work now.

---

## 17. Aftermath

```ts
aftermathConfig: {
  branchOnStep: 0,
  variants: {},
  fallback: { overview: …, changes: [], reactions: [R1, R2], byOutcome: { … } },
}
```

Choice-less, so the bands hang off `fallback` — which is why `byOutcome` lives *on* the
variant. `fallback.changes` is deliberately **empty**: every chip this encounter authors is
backed by a write that fires on a specific band, so every chip lives on its band. Five
bands authored against a floor of three (`critical_success`, `success`, `success_at_cost`,
`failure`, `critical_failure`) — one success-side, one failure-side, and both extremes.

### The rule this section is built on (Pass 2)

> **Every authored chip is backed by a *step-metadata* effect, never by a reaction.**
>
> Stricter than Law 56 asks, and adopted for a reason. A reaction-backed chip is a coin-flip
> claim: the band renders the chip, the player then picks the *other* reaction, and the
> write never fires. The draft backed `gp.the_thread_pulled` that way; it is gone with the
> consequence swap and nothing replaces the pattern.
>
> **And the corollary the draft missed.** Step 1 declares `failBehavior: 'fail_action'`, and
> `unifiedActionLifecycle.advanceStep` resolves the **action** as `failure` (or
> `critical_failure`, which always short-circuits regardless of the setting) the moment step
> 1 fails. **Step 2 never runs on that path**, so a failure-side write authored only on step
> 2 is unreachable while `byOutcome.failure` renders its chips anyway. `check:encounter`
> cannot see this — `chipBackingViolations` asks whether the band has a backing effect
> *declared*, not whether that effect's step is reachable. So every failure-side write that
> backs a chip is authored on **both** steps, and any write that can only honestly happen on
> the step-2 path carries **no chip at all**.

**`fallback.overview`** (the aftermath paragraph — reflective landing, claims no state):

> The book is the company's whole argument. Every traveler this week was read the same page,
> and the road on the far side is still the road.

*(The drafted version said the book *"is not a dishonest one"*, which asserts the honesty
instead of showing it and is the annotation habit in a place the regex cannot see. Showing
it costs the same words.)*

> **Field-class correction — the spec page is drifted and the code is the contract.**
> The draft called this an *outcome*-class field, following the spec's table. It is not.
> `collectClassedTemplateProse` (`src/data/content-eval/nudgeAuditDetectors.ts`) pushes
> `body.overview` as **`scene`** and `change.detail` as **`outcome`**, and a doc comment at
> that site — *"Why `overview` is `scene` and `detail` is `outcome`"* — records the
> measurement behind it: `change.detail` is the **only** statement of its consequence, so an
> indefinite there is the writer withholding what the player has no other source for; an
> `overview` sits directly above the typed chips, so the player does have another source.
> Reading `overview` as outcome flagged 165 fields on indefinites across 295 templates
> against 57 genuinely evasive ones.
>
> **This inverts which two surfaces an author must scan hardest**, so the draft's clean
> claim was evidence about the wrong pair. Both were re-scanned against the code's classes in
> Pass 2. The chip `detail`s are clean of natural indefinites; the overviews would have been
> allowed them and do not use any. Full field-class map: `initiation` and each step's
> `narrativeTemplate` are `scene`; `narrativeTemplates.success`/`.failure` and all five
> afterimages and every `bandProse` fragment are `outcome`; `name`, `effectLine`,
> `purposeLine`, factor lines, `change.title` and every `reaction.label` are `interactive`;
> a card's `fiction` is `scene`. `causeClause` and `stateNoun.text` are not swept at all —
> they are still written to the same bar here, because a gate that does not look is not a
> licence.

### The effects, and where they fire

**Step 1 `failureMetadata.effects`** — fires on `!isStepSuccess`, so on both step-1 `failure`
and step-1 `critical_failure`, which are exactly the two paths `fail_action` ends the action
on. **This is the write § 1's "one honest asymmetry" describes; in the draft it was prose
only.** No condition here: on this path the mortal never worked the wall.

```ts
[
  { kind: 'reputation_with', targetFactionId: 'mercenary_company', delta: -0.06 },
  { kind: 'bond_change', withAgentId: '$cast:officer', sentimentDelta: -0.15 },
  { kind: 'plant_compulsion', targetAgentId: '$actor',
    encounterBias: { trade: 0.6, acquire: 0.5, hire: 0.4 },
    durationTicks: 96,
    narrativeHook: 'The figure the gate quoted keeps coming back to them, and they start taking the work that pays.' },
]
```

**Step 2 `successMetadata.effects`** (fires on `isStepSuccess`, which includes `near_miss`):

```ts
[
  { kind: 'reputation_with', targetFactionId: 'mercenary_company', delta: 0.10 },
  { kind: 'bond_change', withAgentId: '$cast:officer', sentimentDelta: 0.20, trustDelta: 0.15 },
]
```

**Step 2 `failureMetadata.effects`** — the same three as step 1, plus the condition the
player watched them earn:

```ts
[
  { kind: 'condition_attachment', templateId: 'trait.condition.exhausted', targetAgentId: '$actor' },
  { kind: 'reputation_with', targetFactionId: 'mercenary_company', delta: -0.06 },
  { kind: 'bond_change', withAgentId: '$cast:officer', sentimentDelta: -0.15 },
  { kind: 'plant_compulsion', targetAgentId: '$actor',
    encounterBias: { trade: 0.6, acquire: 0.5, hire: 0.4 },
    durationTicks: 96,
    narrativeHook: 'The figure the gate quoted keeps coming back to them, and they start taking the work that pays.' },
]
```

**On the folded exhaustion chip.** `trait.condition.exhausted` is a real write and it stays.
It carries **no chip**, because `failure` and `critical_failure` are both reachable without
step 2 ever running, and a chip saying *"the day's labour left an exhaustion"* on a run where
the mortal never left the table is precisely the defect this packet exists not to ship. Per
THR-1082 an unchipped real write is demoted to the engine's own icon-and-delta cluster
automatically — that is the sanctioned surface, not a loss. Its *words* were not moved into
the overview either: the fold rule's caveat is to move words only if they were true, and on
the step-1 path they are not, so both failure overviews are written to be true whichever
step broke.

**On `plant_compulsion` in step metadata.** Legal and identical to the reaction path: step
`successMetadata.effects` / `failureMetadata.effects` are dispatched through the *same*
`applyEncounterAftermathReaction`, wrapped in a synthetic reaction (THR-783,
`unifiedActionResolution.ts`) — *"no effect kind can be live on one path and dead on the
other."* `encounterBias` is keyed on the closed `EncounterType` union; `trade`, `acquire`
and `hire` are all members, so a typo cannot ship as a silent no-op.

**And it is where the gate can see it.** `allAftermathEffects` in `compositionContract.ts`
walks reaction effects, `byOutcome` reaction effects, and both steps' `successMetadata` /
`failureMetadata` — and **does not walk card `grants` at all**. So a consequence family
wired only through a card grant does not satisfy the draw, whatever the fiction says. Two
consequences for this packet, both deliberate: the swapped-in `drive` family is wired in
step metadata rather than on a card, so it counts; and the Systems block's `rewards` row
rests on `bond_change` (step metadata, `PERSISTENT_EFFECT_KINDS`), **not** on the Side-bet's
`intelligence` or the Favor's `favor_creation`, which are card grants and are invisible to
that walk. Those two remain real world writes that fire at runtime — they are simply not
what the quota is standing on.

`reputation_with` is the correct leg here rather than `faction_reputation_gain`: the
traveler is **not** a member of the company, and `applyFactionReputationGain` no-ops with
`not_a_member` for a non-member. `targetFactionId` is authored as the **definition** id, which
`bindFactionDefinitionIds` rewrites to the live node id before dispatch. Both deltas are well
inside `REPUTATION_WITH_MAX_DELTA_PER_OUTCOME` (0.15).

**The maturity gate is respected.** Factions are a deferred-tier system, so the faction
standing here is a real write and **not** load-bearing structure: an agent with no faction
history plays the identical encounter, because `reputation_with` mints the edge from
nothing and no card, gate, factor line or band reads a prior standing. If the world happened
to seed no chapter of `mercenary_company`, the effect no-ops with a trace and the encounter
still resolves — passage, the quartermaster, the condition and the compulsion are all
untouched.

### Aftermath reaction choices (two stances, on `fallback`)

These render on the three success-side bands, which declare no `reactions` of their own.

**R1 · "Leave them owing each other"**
```ts
{ id: 'gp.keep_the_line', label: 'Leave them owing each other', effects: [
    { kind: 'attachment_grant', templateId: 'agreement.favour.earned',
      targetAgentId: '$actor', counterpartyId: '$cast:officer', durationOverride: 72 },
]}
```
The stance: *a courtesy is a relationship, and a relationship is worth more than a closed
account.* The god leaves something standing between two named people, so the road has a
reason to bring them together again.

> *Pass-2 edit.* The drafted R1 granted `agreement.debt.minor` — a **debt** — on a reaction
> pair that renders at `critical_success`, the band where the line was struck through and
> nothing is owed. `agreement.favour.earned` (live in `AGREEMENT_REWARD_TEMPLATES`, tier 1,
> 72 ticks) is honest on every success band and keeps the stance intact.
> `agreement.debt.minor` stays where the fiction wants it: the failure-band override, which
> is a real open line in a real book.

**R2 · "Let the road hear it"**
```ts
{ id: 'gp.let_the_road_hear', label: 'Let the road hear it', effects: [
    { kind: 'reputation_with', targetFactionId: 'mercenary_company', delta: 0.10 },
    { kind: 'reputation_with', targetAgentId: '$cast:officer', delta: 0.06 },
]}
```
The stance: *settle it publicly and be free of it.* The god spends the moment on standing
rather than on a tie — cheaper later, and colder.

**Band overrides where the fallback pair would be dishonest.** `applyAftermathOutcomeBand`
replaces `reactions` wholesale, which is exactly what is wanted here — "let the road hear
it" is a lie on a band where nothing was paid.

`byOutcome.failure.reactions`:
```ts
[
  { id: 'gp.let_the_mark_stand', label: 'Let the mark stand', effects: [
      { kind: 'attachment_grant', templateId: 'agreement.debt.minor',
        targetAgentId: '$actor', counterpartyId: '$cast:officer', durationOverride: 96 } ]},
  { id: 'gp.shave_it_on_the_road', label: 'Let the road price the company', effects: [
      { kind: 'reputation_with', targetFactionId: 'mercenary_company', delta: -0.08 },
      { kind: 'reputation_with', targetAgentId: '$cast:officer', delta: 0.05 } ]},
]
```

`byOutcome.critical_failure.reactions`:
```ts
[
  { id: 'gp.let_the_day_stand', label: 'Let the whole day stand', effects: [
      { kind: 'attachment_grant', templateId: 'agreement.debt.minor',
        targetAgentId: '$actor', counterpartyId: '$cast:officer', durationOverride: 144 } ]},
  { id: 'gp.walk_it_off', label: 'Let them walk it off', effects: [
      // `remove_condition` no-ops with a trace on the step-1 critical-failure path, where
      // no exhaustion was ever applied. That is why the bond move rides alongside it: this
      // reaction must never be a pure no-op, or it is a dead option on a reachable path.
      { kind: 'remove_condition', conditionTraitId: 'trait.condition.exhausted',
        targetAgentId: '$actor' },
      { kind: 'bond_change', withAgentId: '$cast:officer', sentimentDelta: 0.10 } ]},
]
```

**The stance axis is the same on all three pairs, read at three depths.** Leave a tie live
between two people, against settle it in public and be free of it. Downward on the failure
bands it becomes: carry the mark, or spend the company's name to be rid of it. At the worst
band it becomes: let the whole day stand on the account, or take the day back out of the
body and let the one who kept them think better of it.

### Band overviews and chips

Every chip below points at a **step-metadata** effect that fires on that band (Law 56 rule
0), names a referent in the anchor catalog (rule 0b), and leads with the mechanic and the
endpoints before any fiction (rule 0c). No chip's `kind` is `reputation_tally` (rule 0d).

**`concepts` is required non-empty on *every* change, not on some** — `compositionContract.ts`
adds one violation per change with an empty list, so a template declaring it on one chip of
five fails the Aftermath block four times. All five chips here declare a non-empty
`concepts`, and each entry carries an `entityId` or a `tooltipId` (a concepts list where no
entry carries either is its own separate violation). Every concept `text` is a literal
substring of its chip's `detail`.

**Chip ↔ chip within a band was audited too** (§ 13's widened seam table). Two hits: on
`critical_success` both details used the same em-dash-appositive construction back to back,
and on the two failure bands two adjacent `causeClause`s both opened *"Argued the…"*. Both
rewritten below.

**`critical_success`**
> overview: "Two soldiers stood aside for them while the light was still good. The company
> keeps a list of people it does not have to argue with, and there is a name on it now."

```ts
changes: [
  { id: 'gp.company_standing', kind: 'faction_reputation',
    category: 'boon', direction: 'gain',
    stateNoun: { text: 'standing with the company',
                 entityId: '$faction:mercenary_company', visualKind: 'faction' },
    title: 'Counted a payer',
    causeClause: 'Paid the line in full where the whole picket could count it',
    detail: 'The company’s book has them down as a payer now — standing that carries at their other posts.',
    polarity: 'gain',
    concepts: [{ text: 'standing', tooltipId: 'ui.standing' }] },

  { id: 'gp.quartermaster_bond', kind: 'reputation',
    category: 'bond', direction: 'gain',
    stateNoun: { text: 'trust with the quartermaster',
                 entityId: '$cast:officer', visualKind: 'agent' },
    title: 'The book-keeper’s own word',
    causeClause: 'Dealt straight over a book that did not have to be shown',
    detail: '{cast:officer} trusts them further than the company does. That read is the quartermaster’s own, and it did not come out of the ledger.',
    polarity: 'gain',
    concepts: [{ text: 'trusts', tooltipId: 'ui.standing' }] },
]
```
*Backed by:* step-2 `successMetadata` `reputation_with` (faction) and `bond_change` (officer).
Step 2 can only be reached by a step-1 success, so every success-side band ran it.

*Pass-2 edits on the overview, two passes deep. The drafted first sentence was a fragment
(*"The smallest price on the page, and the barrier up before the light went."*), breaking
plainness move 1, and it repeated the step-1 `criticalSuccessAfterimage` word for word. The
first rewrite fixed the fragment and then restated step **2**'s afterimage instead —
*"They paid… the quartermaster struck the line"* against *"They paid before the light
went… The quartermaster struck the line out."* The overview now says what its **chips** are
about — the standing, and the list a company keeps — and shares no verb or object with
either afterimage.*

**`success`**
> overview: "Nobody made a speech about it. The next traveler in the line moved up a place,
> and the afternoon went on."

```ts
changes: [ gp.quartermaster_bond ]   // same chip, same backing write
```

**`success_at_cost`**
> overview: "They are through, and the pack is lighter than the book's own figure said it
> needed to be. The company took what the page said and no more than that."

```ts
changes: [ gp.company_standing ]   // the standing move fires; the overage is prose, not a chip
```
*Note: nothing writes "they overpaid", so there is no SCAR chip for it. The overage lives in
the overview, which is prose and claims no state.*

**`failure`**
> overview: "They will pass this post again — everybody on this road does. The company's
> book will still have the line, and the figure will still be the figure."

```ts
changes: [
  { id: 'gp.company_standing_lost', kind: 'faction_reputation',
    category: 'scar', direction: 'loss',
    stateNoun: { text: 'standing with the company',
                 entityId: '$faction:mercenary_company', visualKind: 'faction' },
    title: 'Down in their book',
    causeClause: 'Argued the figure and left without paying it',
    detail: 'The company has them down as a haggler — standing that will cost them at the next post.',
    polarity: 'loss',
    concepts: [{ text: 'standing', tooltipId: 'ui.standing' }] },

  { id: 'gp.quartermaster_cooled', kind: 'reputation',
    category: 'bond', direction: 'loss',
    stateNoun: { text: 'trust with the quartermaster',
                 entityId: '$cast:officer', visualKind: 'agent' },
    title: 'Cooler across the table',
    causeClause: 'Haggled with the one who has to keep the book straight',
    detail: '{cast:officer} thinks less of them than before. The quartermaster kept the book straight and got argued with for it.',
    polarity: 'loss',
    concepts: [{ text: 'thinks less of them', tooltipId: 'ui.standing' }] },

  { id: 'gp.the_figure_follows', kind: 'shell_state',
    category: 'scar', direction: 'loss',
    stateNoun: { text: 'a compulsion to earn',
                 entityId: '$actor', visualKind: 'agent' },
    title: 'The figure follows them',
    causeClause: 'Was quoted an honest price they could not meet',
    detail: '{actor} cannot put the number down. For a while now they will take paying work ahead of the road, the errand or the rest.',
    polarity: 'loss',
    concepts: [{ text: 'take paying work', entityId: '$actor', visualKind: 'agent' }] },
]
```
*Backed by:* `reputation_with`, `bond_change` and `plant_compulsion` — all three authored on
**both** steps' `failureMetadata`, so all three fire whichever step broke.

*On `kind: 'shell_state'` for the compulsion.* It is the right wire kind — a planted urge is
not growth, a trait, an item or a reputation surface — and Law 56 bans it only over **empty**
`effects` ("a `shell_state` chip over empty `effects` is a defect"). Here it names a live
write. The anchor is the actor, which is where `plant_compulsion` writes and which the
sentence names.

**`critical_failure`**
> overview: "They came off the post at dusk. The company was sorry about it, as people are
> sorry about arithmetic."

```ts
changes: [
  gp.company_standing_lost,
  gp.quartermaster_cooled,
  gp.the_figure_follows,
]
```
*Backed by:* the same three writes.

> **Why `critical_failure` and `failure` carry the same chip set, deliberately.** They are
> backed by the same writes, and nothing distinguishes which step broke: `byOutcome` keys on
> the action's band, and the depth of the failure is not in it. Claiming a different chip set
> at `critical_failure` would claim a different write — the exact defect this pass removed.
> The two bands differ where they honestly can: in the `overview`, which is the reflective
> landing and is prose, and in the reaction pair, which is the player's own move. Two bands
> with identical truthful chips beat two bands with a decorative difference.

### Aftermath kit summary — what the world remembers

- **A named person** who took payment and formed an opinion (`bond_change`, both directions).
- **A banner's standing** with the traveler, up or down (`reputation_with` → faction).
- **A figure they cannot put down** (`plant_compulsion`, on every failure path) — the swapped-in
  `drive` family, and the crux read one level out.
- **A body that spent a day** (`trait.condition.exhausted`, on the step-2 failure path;
  a real write, deliberately unchipped).
- **An open account between two people** (`agreement.debt.minor`, if a failure-band reaction
  is picked) or **a courtesy left standing** (`agreement.favour.earned`, if R1 is).
- **A turn owed by the quartermaster** (`favor_creation`, if the step-1 Favor card was played).
- **A record of what a company on this road is short of** (`intelligence`, if the Side-bet
  was played).

---

## 18. Cast — the support bundle

```ts
supportBundle: [
  {
    kind: 'actor',
    key: 'officer',
    delivery: 'lazy-materialize-on-trigger',
    persistence: 'must-persist',
    reuseNpcRoles: ['quartermaster', 'commander', 'guard_captain'],
    supportRole: 'gate_quartermaster',
    spawnNpcRole: 'quartermaster',
    spawnName: 'Soren Vail',
    factionDefId: 'mercenary_company',
  },
],
```

**Why an explicit bundle.** The envelope declares four classes, so no THR-1044 family
default applies (those reach single-class envelopes only) and this template must declare
its own.

**Class-honesty across all four classes.** `quartermaster` is the person who names a price —
`{ primary: 'gold', secondary: 'stone' }` in the role reach map, which is exactly step 1's
reach. It is seeded at `military_outpost` (0.9) and by the `military_order` faction roster
(0.7); `guard_captain` is seeded at `castle` (1.0), covering the `stronghold` class's
reuse path. The `ruin`, `battlefield` and `camp`/`oasis` subtypes carry **no location
roster at all**, so reuse simply does not fire there and the spec materialises — which is
why `spawnNpcRole` had to be a role that reads at every class. A company's quartermaster
reads at a fort, in a broken keep, on an earthwork and at a tent line equally; a `steward`
or a `noble` would have been stronghold-honest and placeless everywhere else, the failure
the exemplar's "miller's boy" is the named counter-example of.

**`spawnName` is a real name, not a role phrase** — a declared key always resolves, so this
string is what `{cast:officer}` renders whenever no live NPC was reused.

**The prose never genders the quartermaster.** Reuse binds whoever is standing there, so
every sentence uses the role noun or is restructured around it. Verified in Pass 2 by
grepping the full packet for `he|she|his|her|hers|him|himself|herself` on word boundaries:
zero hits in prose.

**`must-persist` is load-bearing here, not a default.** Two `attachment_grant` agreements
name `$cast:officer` as `counterpartyId`, and an agreement whose counterparty is collected at
scene end writes nothing and traces why. The `favor_creation` debtor is the same person.

**Where the token earns its place.** Role-voiced inline is the default — the spine writes
"their quartermaster", with no token, because no sentence there earns the generated name.
`{cast:officer}` lands in the two bond chips (the reveal — the person becomes clickable at
the moment their opinion matters) and on the attributed line at the table. `{cast:agent}`
carries the personalized address so the engine, not the prose, supplies the traveler's name.

---

## 19. Images

**Card `imageTag`s — every one resolves to a live `ENCOUNTER_IMAGE_LIBRARY` row** (verified
by grep in Pass 2, not taken from this table):

| Card | `imageTag` | Genericity test — three unrelated encounters it also reads in |
|---|---|---|
| Boost (both steps) | `generic.focus` | a lock being picked, a first shot held, a name being recalled under pressure |
| Favor (mint), Favor (call) | `generic.oath` | a guild vouching, a marriage promise, a truce kept |
| Bargain (both steps) | `generic.decay` | a rope fraying, a seal corroding, a lie aging badly |
| Gambit | `generic.luck` | a wager, a leap, a single throw at a locked door |
| Heavy hand (both steps) | `generic.strength` | a beam held up, a door forced, a current pushed against |
| Side-bet | `generic.matter` | a stone read for its grain, a coin weighed, a tool tested before use |
| Boost (energy) | `generic.energy` | a last sprint, a forge brought to heat, a storm building |

All seven are library rows with `genericity` already asserting the three-unrelated-encounter
bar. None names an entity or shows agent-identifying detail. **No card here needs
`fictionBySetting`** — no flavor quote names class scenery, which post-pivot is the normal case.

*(Note for the systems pass: `NudgeCardContent` leaves `imageTag` unset for every library
member on purpose — the image library has no card rows yet, so faces fall back to their
type's generic art. The per-instance tags above are the exemplar's convention and they
resolve; they are not a claim about library data.)*

**`illustrationUrl`:** not declared. Scene art is `border.gate.tollpost` in the WS4
vocabulary; until the manifest exists the fallback chain ends at EntityVisual.

## 20. Concept art direction

**Question 1 — what emotions does this story convey?** The dignity of people who have run
out of options and are still keeping their books straight. The particular tiredness of being
charged fairly. The weight of a small figure written down where you cannot argue with it.

**Question 2 — what image evokes those, inside this world, without illustrating the scene?**

> **A plank table with nobody at it.** An open ledger, weighted flat at one corner by a
> stone. The page is ruled in a careful hand and half the lines are struck through. Beside
> the book: a tin cup, a stub of chalk, and a single boot — good, worn, plainly somebody's
> only pair, set down where the payer left it. Behind and out of focus, the bottom of a
> lifted barrier and open road beyond, going white in the light.

Residue, not events: the transaction is over, the people are gone, and what is left is a
neat page and a boot that used to be worn. No faces, no soldiers, no argument. **No people
at all** — their absence is the point, since the story is about the price rather than the
fight over it. The boot does the work the prose deliberately never says out loud: that the
prices are honest and they are still paid out of your own body.

---

## 21. Support bundle contract

| Support object | Delivery | Source | Persistence | Future references | Status |
|---|---|---|---|---|---|
| `officer` (quartermaster) | lazy-materialize-on-trigger | `LOCATION_ROLE_ROSTERS` reuse, else spawn as `quartermaster` in `mercenary_company` | **must-persist** | `bond_change`, `reputation_with`, `favor_creation` debtor, two `attachment_grant` counterparties, `{cast:officer}` chips | ✅ authored |
| `mercenary_company` | world-owned | `FACTION_DEFINITIONS` (`mercenary-company-definition.ts:35`) | world | `reputation_with` targets, `$faction:` chip anchor | ✅ exists |
| `agreement.debt.minor` | granted on pick | `AGREEMENT_REWARD_TEMPLATES` (`agreement-reward-catalog.ts:37`) | must-persist (96–144 ticks) | failure-band overrides | ✅ exists |
| `agreement.favour.earned` | granted on pick | `AGREEMENT_REWARD_TEMPLATES` | must-persist (72 ticks) | fallback R1 | ✅ exists |
| `trait.condition.exhausted` | granted on step-2 failure | `CONDITION_TRAIT_DEFINITIONS` (`condition-trait-content.ts:223`) | duration edge | crit-fail lift reaction | ✅ exists |
| `plant_compulsion` | step-metadata effect, both steps | `unifiedAction.ts:770`; `encounterBias` on the closed `EncounterType` union | 96 ticks | `gp.the_figure_follows` chip | ✅ live |
| `favor_creation` edge | card grant | secrets & favors; `debtorAgentId` is a registered scene sentinel (THR-1175) | must-persist | step-2 `requiresFavor` gate | ✅ exists |
| `intelligence` record | card grant | intelligence system, category `military_position` | must-persist | future `intel_referenced_prose` | ✅ exists |
| Scene art `border.gate.tollpost` | pending | image plan | scene-only | — | ⏳ plan slot |

### Findings to file (neither blocks this encounter)

**F1 — `thread_*` effects cannot bind their endpoints, and no shipped content wires them.**
*Resolved for this encounter by the recorded consequence swap; filed as an engine finding.*

`thread_strengthen`/`thread_weaken`/`thread_break`/`thread_branch` take literal `ascendantId`
and `mortalId`. Neither field is registered in `SCENE_SENTINEL_FIELDS`
(`src/engine/encounterAftermath.ts`), so `bindAftermathSceneTargets` cannot resolve `$actor`,
`$target` or `$cast:` on them — and the ascendant node id is `asc.<archetypeId>`, minted per
run, so there is no literal an author could ever write. `getOutgoingEdges` then finds no
thread edge and the effect no-ops with a `thread_mutation_skipped` / `edge_missing` trace.
Verified corpus-wide: **zero shipped templates use any `thread_*` effect**; the only example
is `src/data/encounters/examples/example.thread_bond_tested.ts`, which is `@ts-ignore`'d,
registered nowhere, and writes `ascendantId: 'self', mortalId: 'actor'` — strings nothing
resolves. `check:encounter` passes the family on kind-presence while the write is dead at
runtime, which is the Law 56 pathology exactly.

- **Impact:** the `thread` consequence family is **unwirable by any encounter today**. It was
  in this encounter's binding draw and is in encounter 5's (`one_body_short`).
- **Ask:** register `mortalId: 'agent'` in `SCENE_SENTINEL_FIELDS` and add an `$ascendant`
  sentinel bound to `GameState.ascendantId` for `ascendantId`. Small, additive, and the only
  route by which the `thread` family can ever satisfy Law 56.
- **This encounter does not wait for it.** The swap in § 0 trades `thread` for `drive`, which
  is live end to end. Nothing in this packet authors a `thread_*` effect, so F1 is a report,
  not a dependency.

**F2 — advisory.** `side_bet` and the *call* variant of `favor` have no `NUDGE_CARD_LIBRARY`
members. Both are authored here as one-offs, which is legal and recorded. If the Repertoire
should carry them, that is a library change with a reviewer, out of this batch's scope by
the brief's own "out of scope" line.

---

## 22. Self-audit against the Composition Contract

| Block | Verdict | Note |
|---|---|---|
| **Steps** | ✅ PASS | 2 plain steps, each with reach, numeric difficulty, `narrativeTemplate`. |
| **Hand** | ✅ PASS | Both steps nudge-bearing; 6 and 5 cards; guardrails tabulated in § 12. |
| **Setting** | ✅ PASS | 4 classes declared, 4 openings, `locationSubtypes` derived by `expandSettings`. |
| **Cast** | ✅ PASS | Explicit bundle, class-honest at all four; every `{cast:*}` token names a declared key; `must-persist` required by two agreement counterparties. |
| **Rewards** | ✅ PASS | `bond_change` and `favor_creation` are both `PERSISTENT_EFFECT_KINDS`; `attachment_grant` and `condition_attachment` add more. |
| **Aftermath** | ✅ PASS | `aftermathConfig` present; 5 `byOutcome` bands against a floor of 3; every variant carries `overview`; **all five** changes declare a non-empty `concepts`, each with an `entityId` or `tooltipId` — the rule fires once per bare change, so partial compliance fails once per chip. |
| **Systems** | ✅ PASS | 5 connections (cast, factions, reputation, conditions, rewards) against a floor of 3. |
| **Images** | ✅ PASS | All 7 `imageTag`s verified against live library rows; no `illustrationUrl`. |
| **Register** | ✅ PASS | Baseline throughout; no peak surface declared. Card names/effect/factor lines interactive-plain. |
| **Vagueness** | ✅ PASS | Re-scanned against the **code's** field classes, not the spec page's — see § 17's field-class correction. Three outcome-class hits in the draft (`way` ×2, `somewhere` ×1) fixed at § 12; one more (`Nothing was agreed` in a step-1 fragment) avoided in the rewrite. `things` / `nothing` remain only in a card's `fiction` (scene) and one `effectLine` (interactive), where natural indefinites are not enforced. Every `change.detail` re-read as **outcome** class and every band `overview` re-read as **scene**: clean either way. Confirm with `check:encounter`. |
| **Field classes** | ✅ CORRECTED | The spec page's table and `nudgeAuditDetectors.ts` disagree on two fields, and **the code is the contract**: `overview` is `scene`, `change.detail` is `outcome`. The draft's self-scan used the spec's classes and therefore checked the wrong two surfaces. Worth a UL/spec-drift note; the code carries the measurement. |
| **Annotation clauses** | ✅ PASS | Zero matches for all five `NOT_X_BUT_Y_PATTERNS` across every player-facing field; budget is 1. |
| **Divine outcome-authorship** | ✅ PASS | No decision verb takes a world clause. Every `effectLine` says what the god *does* — steadies, sets, presses, keeps, brings to mind. |
| **Digits in `effectLine`** | ✅ PASS | Zero digits, zero `%`. Magnitude is rendered by the pip row. |
| **No `authoredChoices`** | ✅ PASS | Absent. The one decision is the mortal's opt-in gate, outside the template. |
| **No static `factorLines`** | ✅ PASS | Zero authored; the two derived surfaces used are `TraitVariant.factorLine` and `carryoverFactorLines`. |
| **Law 56 (chips)** | ✅ PASS | Five chips, each backed by a **step-metadata** effect that fires on its band, on **every path that can render it** — including the step-1 `fail_action` path, which the draft did not cover. No chip is backed by a reaction. The exhaustion write is deliberately unchipped. |
| **Consequence draw** | ✅ PASS | `['relationship','drive']` recorded with one `consequenceSwap` (`thread` → `drive`), reason names the binding mechanism; `drive` holds weight 4 in `gold` (bar is ≥2). Both families wired in context. |
| **Plot hook** | ✅ PASS | Both `plotHookRolled` and `plotHookTaken` recorded; `usedBy` stamp is a closeout action. |
| **Card budget** | ✅ PASS | `bargain`, `favor`, `side_bet`, `boost` (2 max per hand), `gambit`, `heavy_hand`; no type outside the batch row. |
| **`libraryCardId`** | ✅ PASS | Set on all 9 library-matching instances (6 distinct ids, all verified verbatim); 2 recorded one-offs with reasons, one of them forced. |
| **Forecast arithmetic** | ✅ PASS | 0.94 and 0.91; 0.96 worst-case with the trait variant. All inside [0,1]. |
| **Maturity gate** | ✅ PASS | Primary system is `movement` + `traits` (mature). Factions are flavor-plus-a-real-write, verified non-load-bearing. |
| **Seam echoes** | ✅ PASS | **Fourteen** found and fixed, across seven seam classes — see § 13's widened audit. The narrow `opening→spine` / `spine→band` check the draft ran found two of them; the nine inside a single ending (afterimage→overview, `narrativeTemplates`→band, fragment↔fragment, chip↔chip) needed the wider enumeration, and three of those were verbatim repeats. |
| **Tone** | ✅ PASS | Not grim. Nobody dies, nobody is unmade, and both parties are right. |
| **Honest antagonist** | ✅ PASS | Two breaches fixed and one softened; the company's answer to being argued with is now to read the page again rather than to drop a mask. |

---

## 23. Experience Differentiator Gate — 14 answers

**Scene & prose**

1. **Opening places the player inside a moment already in motion?** **YES.** The barrier is
   already down, the tents are already up, the picket is already eating, the banner has
   already been left up in the rain. Nothing is explained; a place is shown with a company
   sitting in it.
2. **Prose has its own voice — cadence, rhythm, sentence variety?** **YES.** Sentence
   lengths run short-long-short across each opening; the four closers are a withheld action,
   smoke, a flat statement and light. No two openings share a shape.
3. **Scene prose names the elements that later become choices?** **YES.** The barrier, the
   plank table, the ledger, the quartermaster, the picket and the low track are all in the
   opening or the spine, before any card, factor or band refers to them. Delete the ledger
   and nine of eleven cards are senseless.
4. **Would a reader feel something from the prose alone?** **YES.** The lapsed contract is
   never stated as backstory — it arrives as a banner left up in the rain over somebody
   else's arms, and as a book kept carefully by people nobody is paying.
   **4b. No seam echoes?** **YES**, after fourteen repairs across seven seam classes — see
   § 9 and § 13's widened audit. Read sentence against sentence: every opening→spine seam,
   the `initiation`→spine seam, both spine→band seams, the step→step seam, and — the half
   the narrow audit skips — every seam *inside* a single ending: afterimage→`overview`,
   `narrativeTemplates`→band surface, base band text→card fragment, fragment↔fragment for
   fragments that can be active together, and chip↔chip within a band.
5. **Every card states mechanism in `effectLine`, 2–4 word generic title, one flavor quote,
   zero scene-bespoke prose on the face?** **YES.** Nine instances are the library's own
   `name` and `fiction`, verbatim; two one-offs are written to the same bar. No face names a
   gate, a book, or a company. Effect lines name their targets directly, which the spec and
   the exemplar both sanction in the interim — there is no `effectLine` in the library.
6. **Every card's price real and legible?** **YES.** Two Bargains at zero essence priced on
   the doom clock (the exemplar's own pricing shape); two Heavy Hands priced on detection;
   one Favor gated on being owed and priced in essence *because it does not redeem the edge*;
   the rest priced in essence. The `effectLine` says where the price lands in every case.
7. **Every card pays off in failure?** **YES** — every card carries at least one
   failure-texture fragment, and both big-delta cards (Δ 0.16, Δ 0.15) cover `failure` and
   `critical_failure`.
8. **Hand grounded — deleting the target from the prose makes the card senseless?** **YES.**
   Every card acts on the book, the figure, the counting, the picket watching, or a debt.
9. **Cards answer different questions?** **YES** — the six questions are enumerated in § 12,
   and the two Boosts in step 2 buy attention and body respectively.
   **9b. Every nudge-bearing step carries a full authored hand, and no step asks the player
   to pick a branch or an ending?** **YES.** Six and five cards; no `authoredChoices`, no
   `poleLean`, no branch anywhere. And no card in either hand argues for or against
   engaging — the gate stays the mortal's.

**Aftermath & consequence**

10. **Aftermath has its own prose — a reflective landing before the mechanics?** **YES.**
    The `fallback.overview` lands the whole encounter, and every one of the five bands has
    an `overview` of its own that says only what that band can say.
11. **Consequence outcomes actor-centered, with names and faces?** **YES.** The chips name
    the quartermaster (`{cast:officer}`, clickable), the company (`$faction:`), and the
    traveler themselves (`{actor}`). No anonymous stat delta is authored.
12. **Medium+ scale: reaction choices where the player picks which thread to carry?**
    **YES.** Two on the fallback, two more on `failure`, two more on `critical_failure` —
    and none of the six can resolve to a pure no-op.
13. **Do the reaction choices represent different philosophical stances?** **YES.** R1
    leaves a courtesy standing because a tie is worth more than a closed account; R2 settles
    it publicly and is free of it — warm and unresolved against clean and cold. The two
    failure pairs are the same axis read downward.

**Presentation**

14. **Concept art uses the two-question method — residue, not illustration?** **YES.** An
    empty table, a half-struck page, and one good boot nobody is wearing. No people, no
    argument, no gate in focus.

**All fourteen YES.** Nothing in this packet waits on an engine change: the one blocker the
draft carried (F1, `thread_*` binding) is discharged by the recorded consequence swap, and
`drive` is live end to end today.
