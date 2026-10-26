> **title:** The board reads the place — THR-2071
> **linear_issue:** THR-2071
> **author:** Claude Code (design lane, run 2026-10-26g)
> **created:** 2026-10-26
> **three_pillars:** Engine done · Content N/A — no rows, templates or prose change · UI N/A — no player surface; debug visibility is the board trace

# The board reads the place — THR-2071

A town's boom or bust, a haunted or lawless place, a mortal's reputation and their faction now lean the choice the mortal actually makes, not only the scenes that reach their shortlist.

## Why this is load-bearing

The live decision is two steps. `scoreAndSelect` (`src/engine/encounterScoring.ts`) ranks every candidate by `finalScore` and passes the **top 5** to `scoreUnifiedBoard` (`src/engine/decisionBoard.ts:601`). The board then re-ranks those five on its own product (`valuePerTick × desireMultiplier × forecastFit × arrivalCommitment × appointmentDiscount × whisperPull × roleAffinityPull × meansMultiplier`, `decisionBoard.ts:689`) and never reads the scorer's additive terms. So a place's character decides which scenes are *offered*, and then plays no part in which one is *taken*.

The ticket says the board "never reads `finalScore`". That is half right, and the half matters: `finalScore` is the shortlist gate (`encounterScoring.ts:1643`, `scored.slice(0, 5)`). This plan does not touch the gate. It carries the scorer's context into the pick.

Measured on `main` @ 5c02b28e (prototype [`proto/thr-2071-board-context`](https://github.com/christianspliid-ui/threadbare/tree/proto/thr-2071-board-context), `scripts/_scratch-board-terms.ts`, seeds 42/99/7 × 240 ticks, medium):

- The board's winner differs from `finalScore`'s top pick on **2,446 of 3,962** encounter verdicts (61.7 %).
- Context terms are not small. Median base (`valuePerTick × desire`) on the shortlist is **0.125**. `locationTraitBonus` is non-zero on 36.7 % of shortlisted candidates (median 0.080, about 0.9 × base); `reputationBonus` on 68.2 % (median 0.030, about 0.2 × base).
- On boards where some candidates carry an economic term and some do not, the winner carries it **30.8 %** of the time against a 27.8 % board share. A boom or a bust barely leans the pick. The same holds for traits (44.6 % won vs 50.5 % share), chain next-steps (20.8 % vs 24.7 %) and faction boosts (2.9 % vs 37.5 %).

This is why [famine and glut draws](https://linear.app/threadbare/issue/THR-2040) failed its census at both weights: its term lived in `baseScore` only. That ticket's re-plan rides on this one (§ Notes for the executor).

## Decisions this plan builds on

Decided by this lane under delegation (process.md rule 4), recorded on [THR-2071](https://linear.app/threadbare/issue/THR-2071). Veto in chat.

1. **One context pull, not one pull per term.** Every term the scorer adds into `baseScore` reaches the board through one capped multiplier. A term added to `baseScore` later (the larder) reaches the board with no new wiring. *Rejected:* a pull per term in the [THR-2067](https://linear.app/threadbare/issue/THR-2067) shape (seven constants and seven trace fields for one idea, Law 42); reading `finalScore` on the board (would import novelty, ceilings and the doom bias into the mortal's own pick, and change the currency undertakings are compared in).
2. **The pull keeps the scorer's proportion.** `contextPull = (base + W × C) / base`, clamped. A term worth a quarter of a scene's value in the scorer is worth a quarter on the board. *Rejected:* `1 + W × C` (the THR-2067 shape): an economic row of 0.03 would lean ×1.03, too faint to see, which is the THR-2040 failure again.
3. **Which terms steer the mortal.** Classified in the table below. The test: does the term describe *where the mortal stands or who the mortal is* (board), or *what the world chooses to offer* (shortlist only)? Terms that are shortlist-only today stay so; this plan changes no shortlist-only term's behaviour.

| Term (scorer step) | Decision | Why |
|---|---|---|
| `economicContextBonus` (20b), `locationTraitBonus` (20c), `resonance` (11), `globalResonance` (12) | **Board** | The place the mortal stands in |
| `reputationBonus` (18b), `factionScoringBoost` (10) | **Board** | Who the mortal is known as and sworn to |
| `chainBonus` (15), `intelBonus` (24) | **Board** | The mortal's own story and knowledge (Law 44: knowledge enriches the choice, never hides content) |
| `explorationBonus` (14), `familiarityPenalty` (13), novelty / share ceilings / curator (17b–17f), `rarityMultiplier` (19) | **Shortlist only** | Variety and pacing: what the world puts in front of the mortal. The board has its own variety penalty (`BOARD_VARIETY_PENALTY_WEIGHT`) |
| `identityBiasBonus` (22, doom and omen), `markRevealBonus` (23) | **Shortlist only** | The world arranging what comes up. Unchanged from today |
| `attractionBonus`, `convergenceBonus`, `hunchBonus`, `relocationBonus`, `appointmentBonus`, `brokenDriftBonus`, `ruinsBonus`, `anomalyBonus` | **Deferred** to [THR-2073](https://linear.app/threadbare/issue/THR-2073) | Zero on all three headless worlds, so nothing could size them; the god verbs need a census with the verb cast |
| `roleAffinityMultiplier`, `whisperPull`, `engagementFit`, appointment discount, arrival commitment | **Already on the board** | THR-2067, THR-1781, THR-1582, THR-1686, THR-1668 |

## Substrate inventory

| Existing subsystem (inventory name) | Status | This plan |
|---|---|---|
| `decision` — `decisionBoard.ts` | 🟢 ACTIVE | extends — one more factor in the encounter loop, the THR-2067 seam |
| Encounter scoring — `encounterScoring.ts` | 🟢 ACTIVE | extends — `ScoredCandidate` gains `factionScoringBoost` (the only listed term not already on it) |
| Economy context (THR-725), location traits (THR-790), reputation (THR-641) | 🟢 ACTIVE | unchanged — read through the fields they already write |

## Engine pillar

### Systems design

In `scoreUnifiedBoard`'s encounter loop (`decisionBoard.ts:672–717`), beside `roleAffinityPull`:

```ts
// THR-2071 — the scorer's context reaches the mortal's own pick.
export function boardContextSum(c: ScoredCandidate): number   // Σ of the eight Board terms; non-finite terms read 0
export function boardContextPull(base: number, contextSum: number): number {
  if (!(base > 0) || !Number.isFinite(contextSum) || BOARD_CONTEXT_WEIGHT === 0) return 1;
  const raw = (base + BOARD_CONTEXT_WEIGHT * contextSum) / base;
  return Math.min(BOARD_CONTEXT_PULL_MAX, Math.max(BOARD_CONTEXT_PULL_MIN, raw));
}
```

`base` is `candidate.valuePerTick * candidate.desireMultiplier`, the same product the board already uses. `score` gains `* contextPull`. The entry gains `contextPull` (only when ≠ 1) and `contextTerms` (only the non-zero Board terms, by name). Strategic entries are untouched.

`ScoredCandidate` gains `factionScoringBoost: number` (`encounterScoring.ts`, pushed beside `reputationBonus`). That is the only scorer change.

### Graph nodes / edges

None.

### Tick phases

Agent decision (`phaseAgentDecision.ts`, the board call at :1552). No new phase.

### Resolution logic

Unchanged. The pull moves *which* encounter a mortal takes, never its odds (Law 18) or the forecast window (Law 20). The window's `forecastFit` still multiplies first; a capped ×2 can lift a half-fit candidate, which is the same reach `roleAffinityPull` already has.

### PRNG callouts

None. The pull is a pure function of fields already computed.

### Measured effect (prototype, same seeds)

| | Weight 0 (today) | Weight 1, cap 2 |
|---|---|---|
| Undertaking share of non-idle verdicts | 6.27 % (265 / 4,227) | 6.67 % (272 / 4,075) |
| Economic term: winner carries it vs board share | 30.8 % vs 27.8 % | **39.2 %** vs 28.4 % |
| Location trait | 44.6 % vs 50.5 % | 49.0 % vs 47.6 % |
| Chain next step | 20.8 % vs 24.7 % | **33.1 %** vs 23.9 % |
| Winners at the cap | 0 | 481 of 3,803 (12.6 %) |

The weight-0 arm reproduced the first census exactly (4,228 verdicts, 265 undertakings), so same-seed runs are deterministic on this build. The prototype summed seven of the eight Board terms (`globalResonance` was left out); the executor's census measures all eight.

## Content pillar

Content: N/A — no affinity rows, trait rows, templates or prose change. Existing rows simply start to matter at the pick.

## UI pillar

UI: N/A — no player-facing surface reads board factors (`grep roleAffinityPull src/components src/hooks` returns nothing). Debug visibility is the `decision_board_comparison` trace's `boardTop`, which gains the two fields. Browser-verify exempt: engine and trace only.

## Interface impact

| Contract | Change |
|---|---|
| Encounter scoring → decision board (`ScoredCandidate`) | **extend** — one field (`factionScoringBoost`); the board reads eight fields it already receives |
| Economy → encounter scoring (THR-725) | **preserve** |

No new cross-system read or write: both modules sit in the agent-decision system.

## Wiring

Checked against `Docs/plans/wiring-checklist.md`.

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|--------|-------------------|-------------|-----------------|---------------|-----------------|
| `decisionBoard.ts` | agent decision | none | none | `decision_board_comparison.boardTop[].contextPull / contextTerms` | trace viewer |
| `encounterScoring.ts` | agent decision | none | none | none new | — |
| `scripts/board-context-census.ts` | — | — | — | reads the trace | `npm run census:board-context` |

## Constants table

In `src/data/agent-behavior-constants.ts`, beside `ROLE_AFFINITY_BOARD_WEIGHT`:

| Constant | Default | Purpose |
|----------|---------|---------|
| `BOARD_CONTEXT_WEIGHT` | `1` | Share of the scorer's context terms the board applies. `0` restores today's board exactly (kill switch) |
| `BOARD_CONTEXT_PULL_MAX` | `2` | Most a context can multiply a scene on the board; stops a tiny-value scene with one bonus from swamping the board |
| `BOARD_CONTEXT_PULL_MIN` | `0.5` | Least it can; a bust town's negative economic row never zeroes a scene |

## Tracing

```ts
// BoardEntry and decision_board_comparison.boardTop[] — encounter entries only
interface BoardEntryContext {
  contextPull?: number;                        // absent when exactly 1
  contextTerms?: Partial<Record<
    'economic' | 'locationTrait' | 'resonance' | 'globalResonance'
    | 'reputation' | 'faction' | 'chain' | 'intel', number>>;  // non-zero terms only
}
```

## Fail-soft table

| Failure case | Fallback |
|--------------|----------|
| `base` ≤ 0 or non-finite | pull 1 |
| A term missing or non-finite (fixture, pre-THR-2071 candidate) | that term reads 0 |
| Context sum non-finite | pull 1 |
| `BOARD_CONTEXT_WEIGHT = 0` | pull 1 everywhere; today's board |

## Kill criteria

- If the on/off census shows the economic term's winner share no higher than at weight 0, the context is not the binding constraint: ship nothing, set the ticket to Todo and record the census (the THR-2040 rule).
- If undertaking share of non-idle verdicts moves by more than 1 point, halve `BOARD_CONTEXT_PULL_MAX` once and re-run; if it still moves, ship nothing and record it.
- If an existing share-reading test or census turns red with the pull on (the THR-2067 role-lean board test, `npm run measure:role-lean`, the encounter-share gates in `npm run test:heavy`), re-baseline it only after confirming the move is the intended lean, and say so in the commit body. Otherwise halve the cap once, as above.

No touched file has 100 or more importers (`encounterScoring.ts` 33, `decisionBoard.ts` 10, `phaseAgentDecision.ts` 10, `agent-behavior-constants.ts` 83), so no Blast Radius section. Make `ScoredCandidate.factionScoringBoost` optional so test fixtures that build candidate literals need no edits.

## Three-pillar check

- [x] Engine pillar present
- [x] Content pillar N/A with rationale
- [x] UI pillar N/A with rationale
- [x] Wiring section connects them

## Vision audit

- [x] Does not contradict a Vision premise. It makes a shipped promise true: the world's state shapes what mortals do (Law 13), and a place that reads *haunted* now draws its mortals toward the uncanny (Law 45).
- [x] No Vision edit needed.

## Rulebook impact

- [x] This plan does not change a rule of play. Encounter odds, prerequisites and the window are untouched; only which offered scene a mortal takes moves.
- [x] No `Docs/canon/rulebook.md` edit is owed.

> Brainstorm companion: `Docs/plans/2026-10-26-thr-2071-board-reads-the-place-brainstorm.md`

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | Three named constants; weight 0 is the kill switch |
| 2. Inspectability | PASS | `contextPull` and the named non-zero terms on every board entry and its trace |
| 3. Determinism | PASS | No randomness; weight-0 census reproduced exactly |
| 4. Fail-soft | PASS | See table; every bad input reads as no lean |
| 5. Narrative over mechanical perfection | PASS | Places and reputations shape stories at the moment of choice |
| 6. Additive over destructive | PASS | One optional field, two optional entry fields, one factor |
| 7. Performance budget | PASS | Eight field reads and one division per shortlisted candidate (≤ 5 per decision) |

## Done when

- [ ] `scoreUnifiedBoard` multiplies each encounter entry by `boardContextPull`, and `boardTop` carries `contextPull` / `contextTerms` when non-trivial.
- [ ] A board test: in a booming town, `encounter.market_day_festival` ranks above an equal-value candidate with no economic row (the ticket's predicate); with `BOARD_CONTEXT_WEIGHT = 0` they tie.
- [ ] Unit tests for `boardContextPull`: cap, floor, base ≤ 0, non-finite sum, weight 0.
- [ ] `npm run census:board-context` (the prototype's `_scratch-board-ctx.ts`, all eight terms, seeds 42/99/7 × 240, pooled) shows, on vs off: the economic term's winner share rises above its board share by more than it does at weight 0; undertaking share moves by no more than 1 point.
- [ ] A comment in `decisionBoard.ts` names the shortlist-only terms and the eight terms deferred to THR-2073, each with its reason (the table above), so every live additive term is classified in code.
- [ ] `npm run gate` verdict pasted; engine files owe the 30-tick CLI smoke.
- [ ] Closing commit body includes the issue's close line on its own line.
- [ ] `Browser-verify exempt: engine and trace only, no player surface` in the commit body.

## Coordination block

**Suggested model:** sonnet — one pure function, one factor, one field, a census script lifted from the prototype; no open design.

**Parallel-safe with:** [THR-2069](https://linear.app/threadbare/issue/THR-2069) (salt: goods data), [THR-2072](https://linear.app/threadbare/issue/THR-2072) (bounty duel: duel and faction code), [THR-2051](https://linear.app/threadbare/issue/THR-2051) (tribute outcome table).

**Mutex with:** [THR-2068](https://linear.app/threadbare/issue/THR-2068) — its path lean edits the same encounter loop in `decisionBoard.ts` and `phaseAgentDecision.ts`. [THR-2073](https://linear.app/threadbare/issue/THR-2073) is blocked by this ticket.

**Files to touch:**
- Edit: `src/engine/decisionBoard.ts` (two exports, one factor, two entry fields, the shortlist-only comment)
- Edit: `src/engine/encounterScoring.ts` (`factionScoringBoost` on `ScoredCandidate`)
- Edit: `src/engine/phaseAgentDecision.ts` (carry the two fields into `boardTop`)
- Edit: `src/data/agent-behavior-constants.ts` (three constants)
- Create: `scripts/board-context-census.ts` + `census:board-context` in `package.json`
- Edit: `public/agents-reference.html` (one sentence), `Docs/canon/interface-map.md` + `scripts/interface-contracts.ts` only if the gate asks
- Tests: `src/engine/__tests__/decisionBoard*.test.ts`

## Notes for the executor

- Do **not** read `finalScore` on the board. It carries novelty, ceilings and the doom bias, which are the world's choices, not the mortal's.
- Do **not** touch the shortlist (`slice(0, 5)`); measuring pool presence is THR-2040's re-plan.
- [THR-2040](https://linear.app/threadbare/issue/THR-2040)'s branch `claude/thr-2040-larder-draws` holds a separate `larderBoardPull`. Once this ships, its larder term (in `baseScore`) reaches the board through the context pull, so that ticket's re-plan should drop the separate pull.
- The prototype commits were made with `--no-verify` on a branch that is never merged; do not cherry-pick them.

## Intent-judge verdict

**Allow** (Reversible), 2026-10-26, cold opus judge. One GAP (dimension 10: the kill criteria did not cover other share-reading gates), fixed by the third kill-criteria line. Also applied: the Done-when code comment now covers the THR-2073 terms, and decisions 1–3 are recorded on THR-2071 at handoff.

## Forked-audit verdicts

### NFP audit

PASS-with-notes. All seven NFPs pass. Notes: inspection rides the `decision_board_comparison` trace (no `__DEBUG` accessor); default weight 1 is a behaviour change, bounded by the kill switch and the kill criteria.

### Three-pillar audit

PASS-with-notes. Engine substantive; Content and UI N/A with rationale; wiring, substrate inventory and every required section present. Cosmetic note: substrate rows use ticket labels rather than the inventory's names ("Mortal Economy & Prosperity", "Reputation & Influence").

### Vision audit

PASS-with-notes. No contradictions; supports the north star (mortals choose from where they stand). Soft note on non-negotiable #7: the player sees the effect only through which scenes mortals take, and no surface says why. Accepted: explaining *why* a mortal chose is the decision-breakdown readout's job, which [THR-2061](https://linear.app/threadbare/issue/THR-2061) (readouts say what they show) owns.
