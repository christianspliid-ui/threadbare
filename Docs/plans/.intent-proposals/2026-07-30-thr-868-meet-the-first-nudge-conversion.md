# Action Proposal — Meet The First nudge conversion (THR-868)

## intent_quote

> given our large scale redesign of the encounter system and approach has almost landed, i would like you to take a look at the initial encounter for "the first agent" since it in my opinion struggles with the same issues that the old encounter system struggled with., it allows the player to choose between two different worlds instead of the test and nudging that the new encounter system does. since this is the first encounter that will teach the player about the game, it needs to be updated also. please stage that update as part of the encounter experience project. if you feel there is an opportunity to grill me, to also run a pass of improving the experience, feel free.

Grill free-text verdict (improvement pass, same session, 2026-07-30):

> there are issues with keeping the art and images of firsts consistent from start to finish of the experience. you start by looking like a middle aged man and ends looking like something else. that needs to be fixed. as with all the old encounters, the prose is to lyrical, and needs to be moved in the new direction to something more simple and descriptive of  events, the people  and the motivations. this is a problem across most of the game except hopefully the newly written encounters.

## scope (what this plan does)

Converts the Meet The First encounter's Testing beat from pick-an-authored-future dilemmas to nudge-native formative tests (2), adds a bond-as-climax test (reception band), maps fate bands to soul writes via a pole-lean mechanism, keeps Sensing and Spark as god-decisions, reuses WS2 interface components inside the meeting's cinematic presentation, converts the dilemma library in place (Batch A predicate, per-template reversible), rewrites all meeting prose off the lyrical register, and fixes candidate visual-identity drift (one portrait anchor, scene art per image doctrine). Staged as WS6 under THR-772 in the Encounter Experience project. 12/12 grill questions resolved by Christian 2026-07-30.

## scope (what this plan does NOT do — explicit non-goals)

- No conversion of Sensing or Spark mechanics (Christian: "Testing only"; Spark-as-nudge noted as future iteration in the brainstorm).
- No game-wide prose register sweep — the register mandate is applied to meeting surfaces only; the game-wide problem Christian named stays with the WS5 batches and future tickets.
- No full 167-template conversion in one PR — Batch A per predicate; remainder via executor-filed Deferral children.
- No edit to `src/types/unifiedAction.ts` / `StepNudge` (blast-radius firewall; meeting-local extension type instead).
- No bond-failure path, no Meet-The-First-recurrence redesign.
- No new image generation beyond retag/replace audit of meeting scene art (WS4 owns library generation).

## impact_class

Reversible — additive schema, data-presence branching, legacy path retained as fail-soft; the one destructive step (TestingBeat deletion) is a straight component replacement recoverable from git.

## evidence cited

- **Linear issue:** THR-868 (parent THR-772, project Encounter Experience)
- **Vision premises invoked:** player-as-god, "the god acts in the physics of the scene, never in the dramaturgy of the story" (program plan, canon encounters page)
- **UL terms touched:** Nudge, Fate Forecast, Broken, band fragment, rider (existing); NEW terms needing a UL-proposal: Formative Test, Bond Reception, Unset Weave (if framing survives Christian's nod)
- **Canon pages consulted:** `Docs/canon/encounters.md` (2026-07-27 revision incl. nudge spec + rejected approaches), rulebook impact acknowledged
- **Prior plan docs this builds on:** `2026-07-26-nudge-model-encounter-system.md` (THR-772 program, rulings 1–10), WS0/WS1/WS2 plan docs, nudge authoring spec (`.claude/skills/encounter-pipeline/reference/nudge-authoring-spec.md`)
- **Rejected approaches considered and dismissed:** choosing between authored futures (the thing being removed); success-writes-virtue band mapping (perverse incentive); bond-can-fail; tutorial currency; StepNudge extension; fresh-authored library — all in the brainstorm companion

## load-bearing decisions touched

- **Relationships are edges, not property fields:** `bondReception` is internal data of the existing thread edge (a property on an edge, not a relationship encoded as a property) — respects the decision.
- **No inventing node types:** none invented.
- **Ascendants use the same prerequisite system:** untouched; the meeting spends the real essence pool (no special currency), which *aligns* with this decision's spirit.
- **Graph mutated in place / touch API:** agent creation already flows through `createAgentFromMeeting`; no new UI selectors keyed on graph identity.

## high-impact files touched (from Codesight)

None. The plan explicitly firewalls `src/types/unifiedAction.ts` (278 importers) via `MeetingStepNudge` structural extension in `src/types/meetingEncounter.ts`. No other ≥100-importer file is in the files-to-touch list. Blast Radius section therefore omitted from the plan doc per template rule.

## kill criteria

- If playtest shows the pole-lean mechanism reads as "picking the ending with extra steps" (players perceive the lean as a choice of outcome, not a physics act), the mapping is wrong — fall back is to strip pole leans and let fate alone pick the pole (pure-variance mode already exists as the no-lean path), keeping the test surface.
- If the meeting's onboarding time exceeds ~10 minutes at median reading pace, cut formative tests from 2 to 1 (`MEETING_FORMATIVE_TEST_COUNT` is a constant).
- If Batch A conversion cannot reach its coverage predicate within the ticket's budget, the converted path stays preference-gated (legacy fail-soft carries the gap) and the remainder ships as Deferrals — the ticket does not block on full coverage.

## explicit user sign-off

Not required (Reversible). All 12 design verdicts are Christian's own answers recorded in the grill synthesis, same date.

## author notes for the judge

- The **unset-weave fiction framing** is the author's addition (needed to make fate-rolled *formative* moments coherent without time travel). It is flagged in the plan's executor notes as requiring Christian's one-question chat nod before the term ships in prose. The mechanics carry no dependency on the term.
- The **pole-lean band mapping** is the author's mechanical answer to a question the grill settled only directionally ("full fate variance" + "never pick an ending"). Christian approved variance and rejected endings; he did not see the shift-magnitude table. Magnitudes are constants and explicitly tunable.
- Suggested-model and batch structure mirror WS5 precedent deliberately.
