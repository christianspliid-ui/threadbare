# THR-814 — why faction encounters never reach faction members: verdict

**Date:** 2026-07-27 · **Issue:** THR-814 · **Pillar:** Engine (+ Content data) · **Status:** two defects fixed, routing rule chosen, dominant blocker measured and re-scoped

Reproduce with:

```bash
npm run sweep:rank-reach -- --seed 42 --map medium --ticks 150 --every 50
```

## Verdict in one line

The ticket's three candidate routing rules are all void, for the same reason THR-810's
three levers were: **they adjust a stage the content never reaches.** Faction membership
is seeded almost entirely onto `ambient` NPCs, and the phase that draws faction content
iterates `spotlight` actors only — so **2 of 227 members can reach the draw path at all**.

## What the measurement found, in the order it collapsed

The ticket suspected scale-gating (`unifiedCandidates.ts:117` skipping `regional`) or the
encounter-cache path. Neither is the mechanism. Instrumenting the real
`initializeGameState` → `runTick` pipeline stage by stage, on seed 42 / map medium:

| stage | faction entries | note |
| :-- | ---: | :-- |
| `generateFactionQuestCandidates` output | 1,198 | generator works, and is live-wired at `phaseAgentDecision.ts:514` |
| after awareness | 857 | |
| after visibility | 857 | `faction:<nodeId>` matches on both sides — not a defect |
| after prerequisites | 817 | survivors: 620 standard, 141 senior, 56 elite |
| **after cap stage, in the real merged pipeline** | **0** | **of 1,263 — the first collapse** |

`FACTION_ENCOUNTER_META` resolves 183/183 ids through `getUnifiedTemplateById`, so the
THR-811 resolution gap does not reach here either.

### Defect 1 — positional starvation at the cap stage (fixed)

`phaseAgentDecision` merges as `[...nearbyEntries, ...dynamicEntries]`. On a medium map
`nearbyEntries` runs to **~4,650** entries; the per-agent faction entries are the ~7 at the
tail. `capWithDiversity` reserves a diversity floor and a branching quota, then fills its
40 slots by walking `entries` **from the head** — which never reaches the tail. The
per-agent generators were unreachable by construction, not outscored.

Fixed by `personallyOffered` on `EncounterCacheEntry` plus a `PERSONAL_OFFER_CAP_RESERVE`
(6) reserve phase, modelled exactly on the existing `BRANCHING_CAP_RESERVE`. Survival went
**0 → 60.6%**, and when a faction entry does reach the board it is competitive: it ranked
first on 40 of 56 boards that contained one.

### Defect 2 — merchant_consortium addressed a namespace that does not exist (fixed)

`merchant_consortium` declared `encounterAccess: ['mc_trade.quest.', …]` at all four rank
tiers while every one of its 15 templates is `mct.*`. `getAccessibleTemplates` filters by
`id.startsWith(prefix)`, so the guild matched **zero** templates at every tier and its 49
memberships drew no guild work at all. Nothing failed; the filter returned an empty list.

Fixed in `merchant-consortium-definition.ts`. Members-with-candidates went 178 → 227.

The filter pipeline's rank gate already carried this drift as a code comment justifying
why *it* keys on `minRank` instead of prefixes — the drift was known at the read site and
never repaired at the write site. Now pinned by test over **all** factions
(`factionRankGate.test.ts`), comparing namespace roots so a wrong root fails while the
separate unauthored-`leadership` gap stays quiet.

### Defect 3 — the dominant blocker: membership lives off the decision loop (measured, NOT fixed)

With both fixes in, the sweep still reports zero gain. The reason is upstream of
everything above:

```
Draw-path eligibility: 2 of 161 members are individual+spotlight,
  i.e. can reach phaseAgentDecision at all
  → 159 members are off the decision loop entirely (ambient/notable tier).
```

Actor census at tick 5: **357 `individual/ambient`**, 14 `individual/spotlight`. Faction
membership sits on **225 ambient / 2 spotlight**. `phaseAgentDecision` filters to
`actorType === 'individual' && spotlightTier === 'spotlight'`, and
`generateFactionQuestCandidates` is called from inside that loop.

So the guild economy is not mis-tuned or mis-scored. It is switched off for 99% of its
participants, and **no change to scoring, rewards, or gates can reach them** — which is
why all three of the ticket's candidates, and all three of THR-810's levers before them,
were void.

This is now reported by the sweep on every run, so it cannot be rediscovered a third time.

## The routing rule, and the rejected alternatives

**Chosen: guild work for ambient members must resolve faction-side, in the phase that
already runs for factions (`phaseFactionActions`), not by putting ambient agents through
the per-agent decision pipeline.**

The attention-tier model's whole premise is that ambient actors are not simulated
individually. Content that reaches them must therefore be resolved at the tier that *is*
simulated — the faction node. `phaseFactionActions` already runs for all 49 faction nodes
and already owns `commission_quest`; extending it to settle member guild work is
extending an existing system rather than green-fielding a parallel one, which is what the
systems-inventory rule asks for.

Implementation is **not** in this PR — see "What is not shipped" below.

| Rejected alternative | Why |
| :-- | :-- |
| **1. Membership affinity in scoring** (the ticket's first candidate) | Void. Scoring runs only for agents that reach `phaseAgentDecision`; 225 of 227 members never do. Re-weighting a board they are never shown changes nothing. Measured, not argued: faction entries already win rank 0 on 40 of 56 boards where they appear. |
| **2. A guild-quest offer path** (the ticket's second candidate) | Already exists and is already wired — `generateFactionQuestCandidates` is called at `phaseAgentDecision.ts:514` and returns 1,620 entries per tick. Writing a second one would have duplicated a working generator while leaving the actual blocker untouched. The ticket's instinct to check for a live caller first was correct. |
| **3. Widen the cache path so regional faction templates register against member locations** (the ticket's third candidate) | Treats the symptom on the wrong axis. Cache-path faction templates *do* reach agents today — that is exactly where the 3–6 observed draws come from, and all of them are by non-members. Widening it would raise non-member draws, which is the opposite of the goal. |
| **4. Promote faction members to `spotlight`** | Rejected on NFP #7. It would take the decision pipeline from 17 to ~240 agents per tick — a ~14× increase in the phase already identified as the large-map stall (THR-162/165, THR-581). Buying guild reputation with the tick budget is not a trade this defect justifies. |
| **5. Seed membership onto spotlight agents instead** | Rejected. It would cut 227 memberships to at most 17 and hollow out faction politics, succession, and the faction network — all of which read member counts. The world's social fabric is correctly broad; the defect is that breadth has no agency path, not that it is wrong. |

## What shipped

- `EncounterCacheEntry.personallyOffered` + `PERSONAL_OFFER_CAP_RESERVE` + cap-stage
  Phase 1c (`encounterFilterPipeline.ts`), with the faction quest/lifecycle generators
  opting in. Three tests pin the reserve, its ceiling, and its no-op on entries that
  do not opt in.
- `merchant-consortium-definition.ts` namespace repair, pinned across all factions by two
  new tests in `factionRankGate.test.ts`.
- `rank-reach-sweep.ts` now reports draw-path eligibility beside the distribution, so the
  denominator is visible on every run.
- This verdict.

## What is not shipped, deliberately

The chosen routing rule itself. Resolving ambient members' guild work faction-side is a
three-pillar feature — a new resolution path in `phaseFactionActions` (Engine), prose for
work the player never watches happen (Content), and a decision about whether any of it
surfaces in the faction UI (UI) — with its own tuning surface for cadence and reward. It
is filed as **THR-815** with this measurement attached.

**Consequence for this ticket's acceptance:** Done-when 1–3 are **not met** and cannot be
met without THR-815. Done-when 4 (routing rule recorded with rejected alternatives) is met
by this doc. `npm run sweep:rank-reach` still exits 1, which remains the correct reading —
it is now failing on one blocker instead of three, and reports which.

## Two findings noted in passing, not actioned

- **All 12 guilds declare a `<root>.leadership.` rank tier with zero authored templates.**
  Uniform across every guild, so it reads as an unauthored content tier rather than drift.
  The namespace test is deliberately scoped not to fire on it.
- **`agentValidation.ts:113` also excludes ambient individuals** (`if (isIndividual &&
  spotlightTier !== 'spotlight') return result`). Same tier assumption in a second place;
  worth auditing together with THR-815 rather than separately.
