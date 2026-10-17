# Action proposal — The end of the age (THR-1381)

## intent_quote

> **Twilight authorship vs emergence → specify a lightweight split.** Verdict: define authored closing beats + a procedural echo-selection rule (which emergent threads get harvested into the finale).

— the THR-414 verdict, 2026-06-23, quoted verbatim in THR-1381 (filed 2026-09-02 by the THR-1378 rulebook review).

> Half of the split this ticket asks for is now decided elsewhere: **procedural echo selection** is specified by the THR-1813 plan doc (`Docs/plans/2026-10-14-thr-1813-the-world-remembers.md`, Decided 4 …). Do not re-specify it here. What remains on this ticket, per that plan's § Deferrals: (1) Twilight's **authored closing beats**, and (2) **writing Resonance memories** — `worldSoul.resonance` rides the account record, but `captureMemory` has no caller. The rulebook §8 citation should point at both documents once this is designed.

— backlog triage comment on THR-1381, 2026-10-14.

Ticket Done-when: "A plan doc in `Docs/plans/` per design governance, specifying both halves of the split, with the rulebook §8 entry and the Open Questions item updated to cite it."

## scope (what this plan does)

Specifies the end of a run in three build parts, one ticket. (1) The age-end check starts the Twilight when the Mandate completes, as well as on doom expiry (canon already says so; code does not). (2) A pure `twilight.ts` builds three authored closing beats from state — how the age ended (eight authored openings: seven doom kinds and the Mandate), the First's fate (Aspect / lived / died), and what the world will remember — shown on one new full-screen ceremony registered as one homed-surface entry, before the unchanged harvest screen. Time is stopped; the only control is *See what the age leaves*. (3) Up to three World-Soul memories are captured at the end of each age (the ending, the world's dominant sphere, the god's first harvested echo) and written by `concludeRun` into the account record, with older memories fading 0.15 per age. The two age-end popups become chronicle lines. The rulebook §8 tags and open question 6 are updated in this PR.

## scope (what this plan does NOT do — explicit non-goals)

- Does not re-specify echo selection (THR-1813 Decided 4).
- No playable Twilight: no last turn, no free essence, no success penalty (the dormant `TwilightState` functions stay dormant).
- Does not capture memories during play, and does not capture great conflict, betrayal or sacrifice memories (no run-level record exists to read).
- Does not show carried memories in the next world — filed as THR-1971 (Deferral) on THR-1844's step.
- Does not make memories shape world generation.
- Does not change the harvest screen's contents, the echo picks, the doom floor, or `endAge()`.
- No new node type, edge type, tick phase or `GameState` field; no new UL term.
- No concession ending.

## impact_class

Reversible — a code build behind a plan; the one behaviour change to an existing rule (the Mandate ending the age) aligns code with written canon and carries a veto line.

## evidence cited

- **Linear issue:** THR-1381 (Deferral filed: THR-1971)
- **Vision premises invoked:** `Vision/02-non-negotiables.md` (a story they can tell), `Vision/00-north-star.md` (witnessing), via Laws 13, 32, 39
- **UL terms touched:** Run (the run-end is "the end of an age" in prose), Echo, Memory Word, Account Record — no new term
- **Canon pages consulted:** `Docs/canon/rulebook.md` §8 (:399, :403), §11 (:615), Open Questions 6 (:645); `rulebook-quick-reference.md` § The Clocks and the Ending; `Docs/game-design/laws.md`; `Docs/canon/design-governance.md`; `Docs/design-system/extending.md` (homed-surface row)
- **Prior plan docs this builds on:** `2026-10-14-thr-1813-the-world-remembers.md` (echo selection, account record, harvest copy); `2026-10-14-thr-1877-encounter-stage.md` (homed surfaces); `2026-03-28-world-soul-connection-design.md` (memory significances); `2026-03-04-phase4a-world-soul-and-unmaking.md` (the original playable Twilight, superseded)
- **Rejected approaches considered and dismissed:** playable Twilight; per-event memory capture (`phaseWorldSoul`); beats as separate Stage beats; merging beats into the harvest screen (see brainstorm)

## load-bearing decisions touched

- **Engine caches are owned per session, never module-scope singletons** — `cycleEnd.ts:66` `let twilightCounter` violates it; the plan removes its production callers (E2).
- **Everything is a graph node/edge** — memories are not relationships between entities; they live in the existing `WorldSoulState.resonance` outside the graph, as the shipped type already does. No new node or edge type.
- **The world graph is mutated in place** — the plan writes nothing to the graph.

## high-impact files touched (from Codesight)

- `src/types/trace.ts` — 129 importers (five categories added to the union).
- `src/engine/orchestrator.ts` — 79 importers (below the 100 bar; listed in Blast Radius anyway).
- `src/types/gameState.ts` (754) is deliberately not touched.

## kill criteria

- If the next cold or warm playtest that reaches a run's end shows testers cannot say how the age ended or what became of their First, the beats are not landing — rewrite the lines, not the structure.
- If finishing the Mandate ending the age makes runs feel cut short (Christian's veto, or a playtest complaint that a run ended before they were ready), revert E3 alone; the beats still work for doom endings.
- If the ceremony ever blocks the harvest (a run that cannot reach *Wake in a new world*), the fail-soft fallback is wrong — that is a release-blocking bug.

## explicit user sign-off

Not required (Reversible). Decisions taken under the design lane's delegation (process.md rule 4, Christian 2026-09-25), each with veto words in the plan.

## author notes for the judge

- The one call with player-visible weight is Decided 1 (the Mandate ends the age). It is canon-decided, measured as a code/canon divergence, and carries a veto line.
- The "authored vs emergent" split is stated once in the plan's *Why* section: authored = the words of each beat; emergent = which ending, which First, which sphere and which echo the words name, read from state.
- I chose to store rendered memory summaries because the next world has no graph to resolve names against.
- The memory reader in this run is the ceremony's third beat; the reader in the next run is THR-1971, filed and blocked by THR-1844.
