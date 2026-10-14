# Action Proposal — The Crossroads (THR-1926)

## intent_quote

> please explore the following idea: a generic god action that allows the player to see the top 3 things that a threaded agent is considering doing (encounters and undertakings). and then allowing the player to nudge the choice in a certain direction.

(Christian, chat, 2026-10-14. After the exploration reply, he was asked "Replace the forced God's Will pick with the lean?" and did not answer it. He then started this design session with "Do this task here: 'Plan doc: The Crossroads (read + lean)'". The session brief included "replaces the forced God's Will compulsion … Respect any veto Christian gave in this conversation on retiring the forced pick". No veto was given.)

## scope (what this plan does)

Extends the live decision board and the agent decision phase. For every threaded mortal, a snapshot of the deciding board's next three roads is stored at each full decision. The roads cover both encounters and undertakings, exclude what was just taken, and drop secret cells. The player can read that snapshot on the mortal's Inspector page and pay essence to place one held lean, toward a road or away from the leader. The lean is folded into the board as one multiplier at the next full decision. It resolves as followed, resisted or lapsed, with a toast and a line from the mortal keyed by their bond reception. The forced God's Will pick is switched off behind a flag. A torn badge on the thread row replaces its timer pop-up. Slice A (engine and content) ships first. Slice B (the Inspector row and the badge) is blocked by the Inspector landing in the game.

## scope (what this plan does NOT do — explicit non-goals)

- It does not force any choice. No lean can guarantee a road.
- It does not let the player pick how an encounter or undertaking turns out. The roll is untouched.
- It does not preview by re-running the decision. The reading is the last real board, not a dry run.
- It does not charge for the reading. Only the lean costs essence.
- It does not refund a lean that lapses or is resisted.
- It does not delete the Compulsion code. The flag switches it off, and the veto path is one constant.
- It does not change the Whisper premonition.
- It does not light option places on the map. That is THR-1878 territory.
- It does not change devotion or any stat from the mortal's answer. The answer is words only.
- It does not build on `ThreadDetailView`, which the Inspector retires.
- It does not cover non-threaded mortals.

## impact_class

Reversible — two flags (`CROSSROADS_ENABLED`, `COMPULSION_PREMONITION_ENABLED`) restore today's behaviour in full. It is player-facing: a shipped power (God's Will) stops being offered by default.

## evidence cited

- **Linear issue:** THR-1926
- **Vision premises invoked:** Vision §1 "the god influences, never commands" (via `Docs/game-design/laws.md` Law 9); `00-north-star.md` "witnessing, not steering" (Law 13); the two-way thread (Law 12); the small purse (Law 36)
- **UL terms touched:** thread, encounter, undertaking, nudge (`Docs/ubiquitous-language/Encounters.md`, `Agents.md`). "Crossroads" and "lean" are surface words for a god power, not domain nouns. If the executor finds they collide with the appointment "crossroads" prose, a UL-proposal is the route; none is filed now
- **Canon pages consulted:** `Docs/canon/rulebook.md` (§4, §7, §9), `Docs/canon/rulebook-quick-reference.md`, `Docs/canon/design-governance.md`, `Docs/canon/interface-map.md`, `Docs/canon/systems-inventory.md`, `Docs/game-design/laws.md`, `Docs/design-system/laws.md`, `Docs/ops/player-complaint-classes.md`
- **Prior plan docs this builds on:** `Docs/plans/2026-04-04-divine-premonition-design.md` (Whisper and Compulsion); `Docs/plans/2026-09-02-thr-1349-decision-board-cutover.md` (the one board); THR-1781 (held steers); THR-1433 (intention reading); `Docs/plans/2026-10-14-thr-1876-the-inspector.md` (where the UI lands)
- **Rejected approaches considered and dismissed:** a forward dry-run preview (side effects, extraction cost, no fresher than a snapshot); the legacy `rankedEncounterPool` (encounter-only, wrong order, telemetry-gated); an ActionDrawer card (a cast rolls and targets a node, not an option); keeping the pop-up (Law 15, PC-5); building on `ThreadDetailView` (being deleted); a refund on lapse (rulebook "no refunds"; engine would write React-held pool)

## load-bearing decisions touched

- **The world graph is mutated in place — never key change detection on graph identity.** The two new node properties are written with `touchWorld()`.
- **Engine caches are owned per session.** The snapshot is graph data, not a cache, so no module-scope state.
- **Everything is a graph node/edge** and **no inventing node types.** No new node or edge type; two properties on the actor node, the `motiveReceipt` / `compulsionTargetTemplateId` precedent.
- **Relationships between entities are graph edges, not property fields.** The lean names an option (a template and a place or target), not a relationship between two entities. It is decision-carried state like `compulsionTargetTemplateId`, so a property is right.
- No decision is changed.

## high-impact files touched (from Codesight)

None at ≥100 importers. Counted by grep of import specifiers: `decisionBoard` 8, `phaseAgentDecision` 9, `premonitionSteer` 3, `premonition-constants` 12, `ThreadsPanel` 7, `GameView` 7, `dominion` 23. No Blast Radius section.

## kill criteria

- Over a 600-tick census on two seeds, the lean forecast is not honest if either: fewer than 60% of `likely` leans end `followed`, or more than 40% of `not_enough` leans end `followed`. Then retune the margin and ratios before slice B ships.
- If threaded mortals read `torn` on more than half their decisions, the badge is noise. Raise `CROSSROADS_TORN_RATIO`.
- If playtesters report feeling cheated by `resisted`, the lever is the multiplier, never a return to a forced pick.

## explicit user sign-off

Not required (Reversible). The retirement of God's Will was asked as a yes/no in chat on 2026-10-14 and left unanswered. The plan builds the recommended answer, and the veto is one constant.

## author notes for the judge

- The biggest judgement call is **snapshot vs dry run**. The ask says "considering doing", which reads as forward-looking. A snapshot of the last decision minus what was just taken *is* what the mortal will weigh next, up to one chapter of staleness, and it is the only option that keeps Law 18 exact. The UI words hedge ("may", plus a tooltip that the world can change), and the trace measures calibration.
- **Generic god action.** The user said "generic". The plan makes it work for any threaded mortal and both decision families, using no per-template authoring. It is not an ActionDrawer card, and that is deliberate (Brainstorm §C). If the judge reads "god action" as "must be a card", that is the point to flag.
- The slice split exists because the Inspector (THR-1876 carve-up, THR-1909 / THR-1911) replaces the surface this would otherwise land on. Slice A ships engine value plus the debug bridge first; God's Will is only switched off when slice B ships the replacement surface. The flag is added at `true` in slice A and flipped to `false` in slice B, the change that ships the replacement row. No build is left with neither surface.
