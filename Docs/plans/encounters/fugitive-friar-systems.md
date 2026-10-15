# Encounter Pipeline: The Fugitive Friar
> Scale: medium | Slug: fugitive-friar | Pass: systems
> Date: 2026-10-15 | Pipeline version: 2.0

Audited against `fugitive-friar-revised.md` (editorial: PASS WITH REVISIONS). Machine evidence: `node .cache/check-encounter-batch3.mjs --package Docs/plans/encounters/fugitive-friar.package.json` → `✓ encounter.town.fugitive_friar [systems: cast, rewards, reputation, factions]`, 0 warnings, OK.

## 1. Support Bundle Honesty

| Object | Claim | Verdict |
|---|---|---|
| `friar` | lazy-materialize, spawn `monk` "Wendel Ashby", must-persist | Realistic. No `reuseNpcRoles`, deliberately: a town's own monk or priest is not a fugitive. Prose always reads "Brother {cast:friar}". |
| `sergeant` | lazy-materialize, reuse `guard`, else spawn guard "Rolf Hagen" | Realistic. Prose carries no pronoun for the sergeant (editorial), so a reused guard of either sex reads true. |
| Prayer Scroll | `attachment_grant reward_tomes_scrolls_prayer_scroll` → `$actor` | Live catalog entry (`reward-attachment-catalog.ts`, tier 1, possession, `#star #scroll #divine`). |
| Thieves Guild | `membership_change join thieves_guild` → `$actor`, chronicle | `THIEVES_GUILD_DEFINITION` is registered in `faction-definitions.ts`; `locationTypes` town/city/capital, and the encounter is urban-only. `joinFaction` resolves the definition id to the seeded node (THR-1150). |

## 2. Missing Primitives

No missing primitives identified. Everything used is live: `ActionStepBranch.decidedBy` (courage_prudence), `poleLean` on the step-0 specials, `carryoverFactorLines`, `BranchAwareAftermathConfig` keyed on the fork pole, `attachment_grant`, `membership_change`, `bond_change`, `reputation_with`, `costs.detectionDelta`, `deal`.

## 3. Runtime Feasibility

- Two beats on every path; one agent-decided fork; fork step carries `fallback` = the hide arm (the decline arm), as cathedral-vault and hill-conduit do.
- Forecast sums: step 0 0.86 · gate 1.00 · hide 0.94 — every step ≤ 1.
- Purpose lines: the revised packet's "Take him through the gate" / "Hide him through the search" are 5 words, over `REACH_PURPOSE_MAX_WORDS` 4 (the gate failed them). The package ships **"Take him through"** and **"Outlast the search"**; the packet's section headings keep their descriptive names.
- Card rename: editorial's **Prolong The Hunt** opens on `prolong`, which is not in `IMPERATIVE_VERB_LEXICON`. The package ships **Stretch The Hunt** (`friar.stretch_the_hunt`), same sphere, cost, delta, effect line and fragments; the effect line does not repeat a name word.
- Heavy Hand: Bend The Bars, `libraryCardId card.heavy_hand.signature.force`, essence 0, `detectionDelta` 0.15 — one cost channel. The batch's only Heavy Hand.

## 4. Aftermath Supportability

- **Law 56, per chip.** Gate success sides: Prayer Scroll ← `attachment_grant`, membership ← `membership_change` (gate `successMetadata`, fires on success / near_miss). Hide success sides: Prayer Scroll ← `attachment_grant`, friar bond ← `bond_change $cast:friar +0.10/+0.08` (hide `successMetadata`). Failure: Lost Trust ← `reputation_with $here` (gate −0.07, hide −0.05). Critical failure: Lost Trust ← step 0 −0.03 when the action ends at step 0, the arm's write when it ends at the arm.
- **Later-tense promises (rule 7b).** Walked every sentence: the opening's "Anyone caught hiding him will lose the town's trust" is enacted by the failure-side `reputation_with $here` on every failure route. The draft's "named before the bishop's court" (no enacting effect) was removed in editorial. No seed, no place-and-time promise, no appointment needed.
- **Chip referents.** `reward_tomes_scrolls_prayer_scroll` (content ref, attachment), `$faction:thieves_guild` (faction), `$cast:friar` (agent), `$here` (location) — all resolve.

### Accepted limits

- **Gate `success_at_cost` carries no cost of the master's own** when step 0 succeeded cleanly and the arm rolled success_at_cost. On the step-0-failed route the −0.03 town write fires. A band-keyed step write does not exist (same limit guildhall-spy recorded); the cost stays in the afterimage (the open grating found on the next round), claimed by no chip.
- **A mortal already on the Thieves Guild's rolls** gets no new membership (`already_member`); the chip then over-claims for that one mortal. Same accepted limit as guildhall-spy's Consortium join.
- **Gate failure overview** says the watch knows whose stable he hid in; the engine writes only the town's regard. Scene fact about the watch, asserting no standing beyond the backed reputation loss.

## 5. Chip referents resolve

All four referent kinds are catalog members (see § 4). No chip points at fiction.

## 6. New Hooks Needed

None.

## 7. Implementation File Map

Beyond the compiled set (`compile:encounter` owns the module, test and registrations — orchestrator-run after all eight packages are green): none. `src/data/content-eval/plotHooks.ts` `usedBy` stamp for `hook.sacred_crime` is the orchestrator's closeout task. Concept art per § 18 of the packet, optional.

## 8. Verdict

**READY WITH CAVEATS** — caveats are the two package-level renames above (purpose lines, Stretch The Hunt), already applied in the package, and the accepted limits in § 4.

## 9. Primitive Disposition

No missing primitives identified.
