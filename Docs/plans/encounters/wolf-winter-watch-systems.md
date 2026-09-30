# Encounter Pipeline: Wolves at the Fold
> Scale: medium | Slug: wolf-winter-watch | Pass: systems
> Date: 2026-09-30 | Pipeline version: 2.0

Audited against `wolf-winter-watch-revised.md` (template id `encounter.town.wolf_winter_watch`). Every id below was grepped in `src/`.

**Verdict: READY FOR IMPLEMENTATION.** No blocker, no missing primitive, no fix to the revised packet. Two notes for the compile gate are in section 3.

## 1. Support Bundle Honesty

| Object | Claim | Checked | Finding |
|---|---|---|---|
| `reeve` | lazy-materialize, reuse `elder`, spawn `elder` "Hild Aysgarth", must-persist | `spawnNpcRole: 'elder'` is shipped (`default-support-bundles.ts:83`, `feud-mediation.ts:400`); `elder` is in the NPC role list (`src/types/npc.ts:101`) and the hamlet roster seeds it | Honest |
| `drover` | reuse `wanderer`, spawn `trader` "Col Brannock", must-persist | `wanderer` is in the hamlet roster and in `default-support-bundles.ts:69` (`reuseNpcRoles: ['wanderer','trader','hunter']`); `spawnNpcRole: 'trader'` is shipped (`counting-house-dispute.ts:397`); `trader` is in `src/types/npc.ts:68` | Honest. Cast roles are disjoint (`elder` vs `wanderer`), so the two keys cannot bind the same agent |
| Under Watch on `$here` | `apply_condition` with `targetLocationId` | see section 4.2 | Honest |
| village standing | `reputation_with` on `$here` | `encounterAftermath.ts:1460`, written by `applyReputationWithDelta` (`reputation.ts:233`) | Honest |
| drover's secret | `hidden_mark` | see section 4.3 | Honest |

At farmland and mining the roster does not seed, and both specs spawn. "Reeve" and "drover" read at all three rural sublocation classes (the revised packet already says so).

## 2. Missing Primitives

None. Checked: test shaping (cards and carryover lines, live), flip/reveal (`hidden_mark` + `revealFamilies`, live), task/progress carriers (not needed), prevention/interception/recovery (not needed; the encounter is three tests), authored choice bundles (not used; the packet is linear and does not lean on the rejected `authoredChoices`). No `encounter_seed`, no `appointment`, no `requiresHold`, no `ContentQuery` is used.

## 3. Runtime Feasibility

- **Beat count / branching:** three linear steps, no branches. Supported.
- **Outcome ladder:** six bands. `failBehavior` is `continue_weakened` on steps 0 and 1 and `fail_action` on step 2. A `critical_failure` at any step ends the action (`unifiedActionLifecycle.ts:205`); `computeFinalActionOutcome` degrades any step failure to `success_at_cost` (`:344`). The revised pages already reason from both facts, and I confirm their path analysis: crit and success need a clean step 0; `failure` is reachable only through step 2; `critical_failure` from any step.
- **Hands (structural, `checkComposedHand`, `nudgeHandChecklist.ts:127`):** step 0 is 2 specials + 3 = 5; step 1 is 1 + 3 = 4; step 2 is 2 + 3 = 5 (4 for a non-Hopeful mortal, because the trait card is requiredTrait-gated). All sit in `NUDGE_HAND_MIN 4 .. NUDGE_HAND_MAX 8` and under `DEAL_MAX_AUTHORED_SPECIALS 2`. Deal tags are all in the closed `DealContextTag` set: `insight`, `wild`, `might`, `peril`.
- **Four spheres and a common option per composed hand (item 7):** the authored specials contribute life, chaos (step 0), light (step 1), matter (step 2). The fill is dealt at runtime from the Repertoire, so the sphere spread and the ungated common option are guaranteed by the dealer, not by the package. Step 1 (one special, three dealt cards, four total) has the least slack: four distinct spheres needs every dealt card to land on a sphere other than light and other than each other. **Note for the compile gate:** if `check:encounter` or the live-proof run reports step 1 under four spheres, the repair is a second authored special on step 1 (a sphere other than light), not a change of deal tags. The deal declarations are the ones the editor approved (`insight, wild` / `might, peril` / `might, wild`). The common option is the dealer's ungated fill card and does not depend on any trait.
- **Band coverage from specials alone:** all six bands on every step, as the editor corrected it (Guard The Flames carries `near_miss`; Harden The Bar carries `success_at_cost`). Raise Morale is a Hopeful-only extra.
- **Cards:** `card.stumble.signature.chaos` and `card.trait_card.core` are shipped library ids (`the-drowned-archive.ts:122`, `the-broken-seal.ts:189`). No special names an over-exposed card.
- **Unreachable lines:** the `critical_failure` carryover rows on steps 1 and 2 cannot be read, because a critical_failure ends the action first. They are harmless (the `feud_mediation` precedent keeps them) and I leave them.

## 4. Aftermath Supportability

### 4.1 Reputation arithmetic (item 1)

Writes on `$here` (the village), by the `reputation_with` step effect: step 0 failure −0.02, step 1 failure −0.02, step 2 failure −0.06, step 2 success +0.06. Every delta is under `REPUTATION_WITH_MAX_DELTA_PER_OUTCOME` (0.15, `reputation.ts:66`), so none is clipped; default standing is 0.5 (`REPUTATION_WITH_DEFAULT`).

Success-side bands (crit, success, success_at_cost) all require step 2 to succeed, so +0.06 always lands. Worst case is steps 0 and 1 both failing (near miss or cost, not critical_failure): −0.02 −0.02 +0.06 = **+0.02**. A score floor at 0 can only absorb losses, so the net never falls below +0.02 from any start, and the BOND chip "thinks well of" is honest on every success path. At the score ceiling the gain is clipped, but the chip still reads true (the standing is already at its best).

Loss-side bands: `failure` always has step 2's −0.06. `critical_failure` has −0.02 (ended at step 0), −0.02 (step 1, plus step 0's if it also failed) or −0.06 (step 2), so every path into the band writes a loss and the SCAR chip is backed. Confirmed.

The effect resolves `$here` through the same sentinel as `feud-mediation` and `well-sinking` (the precedents the editor cites); the effect requires a counterparty and `$here` supplies one, so the `no_counterparty` refusal at `encounterAftermath.ts:1483` does not fire.

### 4.2 Under Watch on `$here` (item 2)

- `trait.condition.location.under_watch` exists (`condition-trait-content.ts:488`, name "Under Watch").
- **Duration row:** `CONDITION_DURATIONS` maps it to `CONDITION_UNDER_WATCH_DURATION = 84` (`:717`, `:132`). It expires, so the place is not scarred forever.
- **Reader:** `LOCATION_CONDITION_STEP_MODIFIER` gives it a Shadow term of `LOCATION_WATCHED_SHADOW_PENALTY = −0.06` (`:816`, `:209`), so the chip's sentence "quiet work in {location} is harder now" is derived from a term that really moves a roll. That is the THR-1483 honesty bar.
- **Write shape:** `apply_condition` with `targetLocationId: '$here'` is the shipped shape (`ledger-by-lamplight.ts:205`).
- **Chip categorisation:** BOON / `gain` is lawful. `category: 'boon'` with `direction: 'gain'` on a location condition is shipped (`masons-commission.ts:345`, festival). The three Under Watch precedents are SCAR/loss because the watch works against the mortal's quiet work there; here it is the mortal's own watch, and its one reader penalises the next drover's quiet staking. No rule ties the category to the condition's raw sign, and the editor ruled it deliberately. **Not flipped.**

### 4.3 Hidden mark (item 3)

`hidden_mark` { `concealed_action`, `targetAgentId: '$cast:drover'`, `revealFamilies: ['investigation']` } is the shipped `feud-mediation.ts:143-151` shape. `investigation` is a live family: it is named on revealFamilies across the arcane circle, army, borderland, builders, civic-guard and other content (`grep` over `src/data`), and the mark is placed by `encounterAftermath.ts:1858`. The family matches every encounter whose template carries it, so a reveal is reachable in play. It is not chipped, by design.

### 4.4 `favor_creation` (item 4)

The shape is `{ kind: 'favor_creation', magnitudeRange: [0.2, 0.35], context: "...", debtorAgentId: '$cast:drover' }`. `debtorAgentId` is required by the authoring gate (`unifiedAction.ts:1115`) and accepts a cast sentinel. The debtor is a person (the drover, must-persist), so the graph layer will not refuse the edge. The effect sits on the success-side reaction only and is on a reaction, so it is player-picked and cannot make a chip dishonest. Magnitude range is inside the usual band.

### 4.5 Later-tense promises (rule 7b) and placed promises

Walked every sentence that says something will happen. "{location} will think less of {actor}" (P3) is enacted on every failure path by the `reputation_with` writes in section 4.1. "{cast:drover} … offers to buy the flock" is a present-tense fact, paid off by the reeve's refusal or agreement in the overviews. No sentence promises a place and a time, so no `appointment` is needed, and there is no `encounter_seed`. "Every village in the valley hears whose command it was" is overview prose that claims no state (the editor noted it).

## 5. Chip Referents (THR-1490/1491)

| Chip | Referent | Resolves |
|---|---|---|
| `reputation with {location}` (BOND / SCAR) | `$here`, the village the encounter sits at | World object, exists |
| Under Watch (BOON) | `trait.condition.location.under_watch` | Catalog entry, exists |

No chip points at `{cast:*}` or at prose. The hidden mark is unchipped. The four reaction effects (`reputation_with`, `bond_change` ×3, `favor_creation`) target `$here`, `$cast:drover` and `$cast:reeve`, all must-persist or `$here`.

## 6. Traits (item 6)

`trait.core.core_hope.virtue` (Hopeful) and `trait.core.core_hope.vice` (Bitter) are built by `core-trait-content.ts` and used by shipped encounters (`company-drama.ts:1762`, `the-broken-seal.ts:61`); both poles appear in `ambition-templates.ts`. They satisfy `validateTraitRefs`. The Hopeful variant's `addNudgeIds: ['wolf.raise_morale']` names a card declared on the same step, and the card carries `requiredTrait: 'trait.core.core_hope.virtue'`.

## 7. New Hooks Needed

None. No new role, sublocation type, state field, tag, or catalog entry. All ids above are existing.

## 8. Implementation File Map

Beyond the compiled set (the package at `Docs/plans/encounters/wolf-winter-watch.package.json` compiles into the module, its structural test and both registrations):

| File | Action | Why |
|---|---|---|
| none in `src/` | none | No engine or type change. |
| `Docs/plans/encounters/wolf-winter-watch.package.json` | author from the final packet | Compiler input. |
| concept art for the stake and the barred gate (section 18) | optional, art pipeline | Presentation only. |

## 9. Verdict

**READY FOR IMPLEMENTATION.**

## 10. Primitive Disposition

No missing primitives identified.

## Fixes merged into the final packet

None. The revised packet was audited as written, and the final file carries it verbatim. One observation left for the implementer, not a fix: step 1 has the thinnest sphere margin (section 3), so if the compile or live-proof gate reports under four spheres there, add a second authored special rather than retune the deal.
