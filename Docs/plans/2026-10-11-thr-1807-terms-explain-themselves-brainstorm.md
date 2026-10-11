# Brainstorm companion — Terms explain themselves where the player meets them (THR-1807)

Companion to `Docs/plans/2026-10-11-thr-1807-terms-explain-themselves.md`. Authored by `tb-design-lane`, 2026-10-11.

## The premise under test

Rounds 1 and 2 each fixed the terms that round named. Round 3 still names 12–13 per tester. Either the fixes were wrong, or new terms keep arriving, or the fixes are not reached. The survey says mostly the third: the registry already has decent copy for Reaches tiers, Covenants, Investiture and Doom Debt, but a player inside a veil cannot hover the top bar at all, two top-bar terms bypass the registry, and four facts are only ever true *after* the player acts.

## Measurements (origin/main 1ed28336, 2026-10-11)

- `<Tooltip` in non-test `src/`: 175 occurrences in 79 files. `UI_TOOLTIPS` (`src/data/ui-content.ts:50`): about 183 entries.
- `GameViewTopBar.tsx:261-265`: `inert={encounterOpen}`, `aria-disabled={encounterOpen || undefined}`, opacity `TOPBAR_INERT_OPACITY` (0.4) on the right group. `encounterOpen` comes from `GameView.tsx:5393`.
- `src/components/WorldSoulIndicator.tsx:59`: `title={proseTemplate.replace(/\*\*/g, '')}`. `OmenIndicator.tsx:110`: ``title={`Active omen: ${omenState.primary.name}. Click for details.`}``. Both are raw `title`s, retired by Law 17.
- `AscendantBar.tsx:195-265`: Signatures has no `tooltipId` and renders the placeholder "Your paths of power are not yet settled."; Hooks has no `tooltipId` and renders "No marks, clues, or vows."; Covenants has `tooltipId="ui.covenant"` and renders "You hold nothing in a lasting grip."
- `src/data/ascendant-reach-register.ts:133-138`: the tier tooltip already says "The first of five rungs of your hold on {Reach}…". The words exist; nothing on the surface signals a rank without a hover.
- `src/engine/influence.ts:31,46`: `INITIAL_ESSENCE_PER_SPHERE = 50` for every sphere. `spherePoints.ts:135-147`: 0.04 floor share per sphere, the rest split by points. `essenceIncome.ts:96`: upkeep is billed to `alignment.primary`.
- `meetingEncounter.ts:784`: `return magnitude >= 0 ? leaned : opposite;`; `MEETING_POLE_SHIFT_BY_BAND` near_miss −0.15, failure −0.20, critical_failure −0.35 (`meeting-nudge-constants.ts:71-77`).
- `agentDetail.ts:1697-1709`: `const domainCount = knowledgeLevel === 'recognised' ? 1 : 3;` then `.slice(0, domainCount)`. `capabilityGrowth.ts:244,254` writes `lastReinforcedTick: 0`. No per-agent record of a tier crossing exists.
- `SimulationControls.tsx:84`: `heldBy ? \`paused · ${heldBy}\` : running ? 'held · runs on after' : 'held · stays paused'`. `heldBy` is set only for a veil (`GameView.tsx:5389-5391`). `resolveInterrupts` has 15 other keys (`GameView.tsx:4930-4948`).
- `SensingBeat.tsx`: no occurrence of `name` or `epithet` in the render; `NarrativeCandidate` carries both (`types/meetingEncounter.ts:225-262`).
- `PremonitionModal.tsx:110-114` `premonitionCostLabel` prints `{n} {Sphere} essence`; `REACH_TO_SPHERE.gold = 'life'` (`premonition-constants.ts:155`).
- Tooltip portal `zIndex: 70 + depth` (`Tooltip.tsx:471,476`). The veil sits at `zIndex: 50` (`EncounterVeil.tsx:703`).
- THR-1791 (the legend's "UNCERTAIN" pill) shipped 2026-10-10 (`Docs/status/2026-10-10-thr-1791.md`). It is not re-planned here.

## Alternatives weighed

1. **A glossary page / codex entry for every term.** Rejected as the primary route. A glossary is a second place to learn. The testers' notes show they do not leave the surface to look things up, and an in-game Codex already exists (`onOpenCodex`) without moving the count. The tooltip ladder (Law 20) already leads from hover to the deeper page where one exists.
2. **A first-run tutorial that walks through every panel.** Rejected for this ticket. It is a reveal-order question, and THR-1808 owns the post-bond reveal. A walkthrough also front-loads exactly the terms the ticket says should wait.
3. **"Seen once" first-use captions under each term** (visible text the first N times, then hover only). Considered seriously. It would reach players who never hover. It is deferred to the kill criterion: if round 4 shows testers never hover the top bar, this is the next step, and it belongs with THR-1808's staged reveal rather than as a second mechanism here.
4. **Keep the top bar inert under the veil but print "(closed while a chapter is open)".** Rejected. It adds visible chrome to every veil, while hover-with-reason costs nothing until asked.
5. **Change the rules so the pour moves starting pools** (making the pour "visible" by changing the game). Rejected. That changes what the pour means, which is a direction call the lane does not make (and THR-1749's design is settled). Saying what it already does is enough.
6. **Show names on the resting picker cluster.** Rejected. The sensing beat is a first look, and the beloved storybook pacing (3/3 named a bonding scene as the best moment) argues for keeping the cluster quiet. Name-on-focus answers "I picked a painting" without changing the first look.
7. **Replace the lowest domain row with the tier-crossed one.** Rejected. It would make the card's top-N wrong for a moment (PC-6 in the other direction). Appending one marked row keeps both facts true.
8. **Record the tier crossing inside `applyEncounterGrowth`.** Rejected. It has no `tick` parameter, and THR-1580 is re-fitting its readers right now. Writing at the two call sites keeps the change out of THR-1580's path.

## Tensions surfaced

- **Law 53 (HUD is a budget) vs Law 1 (every concept carries its tooltip).** Hiding empty sections serves Law 53, and the tooltip on each section serves Law 1 when it appears. No conflict once "empty" is the gate.
- **Honesty about Doom vs the player's fear of a timer.** The tooltip says it *is* a clock toward an ending, because it is. It also says the floor exists, because that is the part the fear is missing.
- **THR-1806 and this plan both write the TIME readout.** They are separated by state: THR-1806 speaks when the clock is not held, and this plan speaks when it is.

## Vision premises invoked

- *Forks are decided by the mortal, never by you* (rulebook quick reference § Your Resources). The miss line states this premise rather than bending it.
- *Game prose, not novel prose; microcopy explains mechanism* (Law 42; prose register doctrine). Every new line says what happens, not how it feels.
