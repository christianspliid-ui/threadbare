> **title:** `Meet The First — nudge-model conversion (WS6) — THR-868`
> **linear_issue:** THR-868
> **author:** `Claude Code`
> **created:** 2026-07-30
> **three_pillars:** Engine `done` · Content `done` · UI `done`

# Meet The First — nudge-model conversion (WS6) — THR-868

*The game's first encounter teaches the rejected model; until it teaches nudge-fate-payoff, every player's first lesson contradicts the game.*

## Why this is load-bearing

Meet The First is the first interactive surface every player touches, and it currently teaches the exact interaction the nudge program rejected: the Testing beat presents two authored formative moments and lets the player *pick which one is true*, deterministically writing the First's values. That is "choosing between authored futures" (rejected 2026-07-26, THR-772) in its purest form — no test, no forecast, no fate. With WS0 (THR-773), WS1 (THR-774), and WS2 (THR-775) all shipped, every encounter *after* the meeting speaks the nudge language while the meeting itself speaks the dead one. This ticket converts the meeting to the nudge model, makes the bond the climax test, rewrites the meeting prose off the lyrical register, and fixes the candidate visual-identity drift. All design verdicts are Christian's (grill 2026-07-30, 12/12 resolved — `Docs/plans/2026-07-30-meet-the-first-nudge-conversion-grill-me.md`).

## The redesigned flow (reference)

Five beats. Sensing and Spark survive as god-decisions (targeting and investment — physics, not dramaturgy). The dilemma beat becomes two **formative tests**; the bond becomes the **climax test**. 3 fate rolls total.

1. **Sensing** *(kept)* — pick 1 of 3 candidate mortals. Register-rewritten vignettes; the candidate's portrait chosen here becomes the **single visual anchor** for the rest of the flow and the in-game agent.
2. **Formative test 1** *(converted)* — the primary-reach value-pair moment. Full nudge surface: motive line (`divine` — THE GOD'S HAND), purpose line, difficulty word, 2–4 factor lines, a hand of 4–8 nudges, fate reveal, band prose.
3. **Formative test 2** *(converted)* — drawn from the wider pool (reach-specific/general), same surface.
4. **Spark** *(kept)* — pick 1 of 3 spark visions (investment). Register pass only.
5. **Bond test** *(new climax)* — the mortal senses the god reaching for them. Last hand (sphere-flavored). Fate rolls the **reception band**: awe / devotion / bargain / doubt / defiance (Christian, chat, 2026-07-30). The bond **always forms**; the band colors it and the naming closes the flow.

**Fiction framing (Christian's verdict, chat 2026-07-30):** the formative tests are **present-tense trials** — defining moments happening *now*, during the meeting, as the god's attention rests on the mortal. Christian rejected the alternative "unset weave" framing (nudging inside a still-settling past). Consequence for conversion: the dilemma library's past-tense childhood scenarios must be **re-situated into the present** (the mortal is an adult, at their location, in the moment the god watches). A scenario that cannot be honestly re-situated is **killed, not converted** — Batch A runs keep/rewrite/kill, WS3-style, over its membership.

**Soul-write mechanics (the core mapping):** a nudge shifts odds, never picks the ending — so direction cannot come from a choice. Instead, meeting nudges carry an optional **pole lean** (which pole of the test's value pair they pull toward: e.g. "His father's voice comes back to him" leans mercy; "The cold of the morning settles into him" leans ruthlessness). The played hand's net lean sets which pole a *success* writes; **fate sets how cleanly the moment resolves**. Success bands write the leaned pole; failure bands write the opposite pole (the moment breaks the other way) plus a scar seed and light quintessence erosion; the middle band writes a tempered, smaller shift. A god who plays no pole-leaning nudges gets pure fate (coin-lean from the seeded PRNG). This makes "you nudged toward mercy, fate landed ruthlessness" (verdict 1) a real outcome, and never forces a player to *seek failure* to get the pole they want — they lean the other way instead.

## Substrate inventory

Per `Docs/canon/systems-inventory.md` — this plan **extends existing subsystems; nothing is green-fielded**:

| Subsystem | Modules | This plan's relationship |
|---|---|---|
| `meeting` | `src/engine/meetingEncounter.ts` (inventory line: `\`meeting\` (1)`) | **extended** — new pure resolve/apply functions beside the existing candidate/dilemma/creation functions |
| Five-band outcome ladder | shared sigmoid→d100 resolution (WS0) | **reused as-is** — no parallel resolver |
| Nudge hand machinery | `src/engine/encounters/nudges.ts`, `useNudgeHand`, `nudgeCommit`, `handFilter` | **reused as-is** via structural `MeetingStepNudge` |
| Essence pools | `EssencePool` (`src/types/influence.ts`) | **extended** — new spend site, existing spend/trace path |
| Quintessence | `src/types/quintessence.ts` thresholds/lexicon | **reused** — scarring writes starting value through existing constants |
| Trace buffer | `src/engine/traceBuffer.ts`, `TraceEntry` union (`src/types/trace.ts`) | **extended** — two new trace types registered in the union |

## Engine pillar

### Systems design

No new engine module. `src/engine/meetingEncounter.ts` gains pure functions; the meeting UI calls the **same attended resolution path WS2 encounters use** (sigmoid→d100 five-band ladder, `src/engine/encounters/nudges.ts` hand resolution, essence spend via the existing pool). The meeting runs pre-tick-loop UI-side, as today; resolution functions are pure and seeded.

New pure functions (all in `meetingEncounter.ts`):
- `resolveFormativeTest(test, playedNudges, seed) → FormativeOutcome` — computes net pole lean from played nudges, calls the shared five-band resolution with the test's difficulty + nudge modifiers, maps band → soul write via `MEETING_POLE_SHIFT_BY_BAND`.
- `resolveBondTest(bondTest, playedNudges, seed) → BondOutcome` — same resolution; maps band → reception id via `BOND_RECEPTION_BY_BAND`.
- `applyMeetingOutcomes(result, outcomes)` — folds soul writes, trait seeds, gate tags, and quintessence scarring into `MeetingEncounterResult` (extends `buildNarrativeResult`).

Types: `MeetingStepNudge extends StepNudge { poleLean?: 'a' | 'b' }` and `FormativeTest` / `BondTest` live in `src/types/meetingEncounter.ts`. **Deliberately not** on `StepNudge` in `src/types/unifiedAction.ts` (278 importers) — structural compatibility lets the WS2 hand machinery consume them unchanged; no high-impact file is edited.

### Graph nodes / edges

No new node or edge types. The existing `thread` edge gains one optional property `bondReception: string` (reception id from the bond test) written by `createAgentFromMeeting`. Starting quintessence on the agent node reflects accumulated scarring (existing property, adjusted at creation).

### Tick phases

N/A — the meeting runs before/outside the tick loop, as today. `resetMeetingCounter()` wiring unchanged.

### Resolution logic

Shared five-band ladder — no parallel resolver. Difficulty per test authored 0–1, rendered only as the four difficulty words. Nudge modifiers feed the same modifier path attended encounters use. Band → soul-write mapping is a pure table lookup (`MEETING_POLE_SHIFT_BY_BAND`); band → reception likewise (`BOND_RECEPTION_BY_BAND`). Riders follow WS0 semantics (deterministic, zero PRNG draws); per the authoring spec, riders in the meeting hand are rare and comment-justified.

### PRNG callouts

- `createSeededRng(seed, 'meeting_test_0' | 'meeting_test_1' | 'meeting_bond')` — one stream per roll; no `Math.random()`.
- Coin-lean when net pole lean is zero: one draw from the same test stream.
- Existing candidate/vision generation streams unchanged.

## Content pillar

### Encounter templates

**Formative test conversion of the dilemma library** (`src/data/meeting-dilemma-library.ts`, 167 templates). Additive fields on `EnrichedDilemmaTemplate` (data-presence branching selects the new path — per-template reversible, no flag day, mirrors WS5):
- `purposeLine` (≤4 words), `difficulty` (0–1), `factorLines` (2–4, both polarities, source named in the sentence — canon rule 1),
- `nudges: MeetingStepNudge[]` (4–8; ≥1 common sphere-less option; sphere coverage per hand ≥4; pole-leaning cards for **both** poles; every `fiction` line passes the concreteness rubric; `effectLine` words-only),
- `bandProse` — 5 slots: clean-A, clean-B (seeded from the two existing authored resolutions' *material*, rewritten present-tense + register), tempered, broken-into-A, broken-into-B.

**Present-tense re-situation (Christian's verdict, 2026-07-30):** conversion rewrites each scenario as a trial happening *now* — adult mortal, current location, the god watching. Past-tense childhood framing dies with the choice mechanics. A template whose scenario cannot be honestly re-situated (irreducibly a childhood memory) is **killed**, not converted — Batch A's conversion pass is keep/rewrite/kill.

**Batch strategy (predicates, not counts).** Batch A membership predicate: *every template that `selectDilemmas` can place in slot 1 (axiological, `targetValuePair ∈ REACH_VALUE_PAIR[reach]` for any of the 8 reaches) plus enough reach-specific/general conversions that every slot-2 draw has ≥ `MEETING_POOL_MIN_CONVERTED` converted candidates for every reach pair.* Selection prefers converted templates; the legacy dilemma path remains as fail-soft only. Remaining library batches ship as `Deferral`-labeled children of THR-868 (same project), filed by the executor — never predicted here.

**Bond test** (new, one universal template in a new `src/data/meeting-bond-test.ts`): setup register-compliant, hand of 6–8 sphere-flavored nudges (coverage ≥4 spheres, ≥1 common), 5 reception bands (fated→awe, favorable→devotion, uncertain→bargain, perilous→doubt, doomed→defiance — a defiant First still bonds, and defies you) each with prose + a reception trait seed. Per-hunger god-voice line variants (9 hungers) frame the reach.

### Prose tables

**Register rewrite (Christian's mandate, grill verdict 12b):** all meeting prose — sensing vignettes (`candidate-vignettes.ts`), test setups, god-voice lines (`meeting-narrative-prose.ts`), transitions, band prose — moves to the nudge-spec register: simple, descriptive of **events, people, and motivations**; concreteness rubric; no lyrical abstraction ("Something inside {agent.name} settles into place like a stone dropped into still water" is the register being retired). The verbatim/lyricism detector from the WS1 spec applies; `scoreProseEntry` runs as advisory evidence.

**Diegetic teaching (verdict 10):** the god-voice teaches in-fiction only — it names the forecast word once in test 1 and frames the hand once ("what you can reach into the moment"); no UI callouts, no tooltips.

### Attachment content

Trait seeds already flow through the existing `traitSeeds` path; failure-band scar seeds reuse existing trait vocabulary where it fits (grep granted-vs-required values before minting new ones — memory `trait_grant_unconsumed`). New reception trait seeds (5) are named in the bond test file.

### Data tables

`src/data/meeting-nudge-constants.ts` (new) carries the constants table below. **Visual-identity fix (verdict 12a):** audit `meeting-art-library.ts` scene assets — any scene depicting a distinct person is retagged/replaced per image doctrine (ruling 10: scenes omit or silhouette the agent); the candidate's `imageAssetPath` from Sensing is the **only** human likeness shown across all beats and is written to `portraitAssetPath` at creation (already wired). WS4 manifest tags are declared per converted template's doc comment.

## UI pillar

*Screenshot tool: Playwright (DOM surfaces) — the meeting flow contains no WebGL.*

### Player-facing display

- `TestingBeat.tsx` is replaced by `FormativeTestBeat.tsx`: the meeting's cinematic wrapper (dark stage, scene art, **persistent candidate portrait**) hosting the WS2 encounter surface — test panel (purpose line, difficulty word, factor lines, motive line), nudge hand (`useNudgeHand`), commit (`nudgeCommit`), fate reveal, band prose. Reuse the `NudgePhaseShell` composition or its subcomponents; do not fork their logic.
- `BondBeat.tsx` gains the bond test phase (same surface, sphere-flavored hand) before the naming close.
- `SensingBeat`/`SparkBeat`: register pass + portrait-consistency only; interaction unchanged.
- Unavailable nudges hidden, never dimmed (ruling 4); no digits anywhere on the surface (ruling 1).

### Event notifications

None new — the meeting completes into the existing bond flow. The chronicle/backstory record gains the two formative outcomes + reception via `meetingChoiceRecord` (extended with `formativeOutcomes` and `bondReception`).

### Debug inspection (DebugPanel)

- Designer view (WS2's existing `designerView.ts` / `NudgeDesignerTab`) must work inside meeting tests — numbers behind the words visible there only.
- `window.__DEBUG.getMeetingState()` (new, dev-only): current beat, rolled bands, net pole leans, essence spent — the state assertion for browser-verify.

### Visual presence (HexMapV2)

N/A — no map surface in the meeting flow.

## Wiring

> See checklist: Docs/plans/wiring-checklist.md

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|--------|-------------------|-------------|-----------------|---------------|-----------------|
| `meetingEncounter.resolveFormativeTest` | N/A (UI-driven, pre-tick) | `FormativeTestBeat` | `meetingChoiceRecord.formativeOutcomes` | `meeting.test_resolved` | `__DEBUG.getMeetingState()` |
| `meetingEncounter.resolveBondTest` | N/A | `BondBeat` | thread edge `bondReception` | `meeting.bond_resolved` | same |
| `applyMeetingOutcomes` | N/A | — | agent `axiologicalProfile`, starting quintessence | (folded into above) | agent inspector |
| essence spend | N/A | hand UI (WS2) | `EssencePool` | existing spend trace | essence readout |

## Constants table

| Constant | Default | Purpose |
|----------|---------|---------|
| `MEETING_FORMATIVE_TEST_COUNT` | `2` | Formative tests per meeting (verdict 8) |
| `MEETING_POLE_SHIFT_BY_BAND` | fated `0.40` / favorable `0.30` / uncertain `0.15` / perilous `−0.20` / doomed `−0.35` | Signed shift toward the leaned pole per band (negative = opposite pole writes) |
| `MEETING_TEMPERED_BAND` | `uncertain` | Band that writes the tempered (reduced) shift |
| `MEETING_SCAR_EROSION_PERILOUS` | `4` | Starting-quintessence erosion on a perilous band |
| `MEETING_SCAR_EROSION_DOOMED` | `8` | Starting-quintessence erosion on a doomed band |
| `MEETING_QUINTESSENCE_FLOOR` | `weakened` lower bound + 1 | A First can never start broken or critical (verdict 6) |
| `MEETING_MIN_AFFORDABLE_NUDGES` | `2` | Affordability guarantee per test (verdict 3) |
| `MEETING_NUDGE_COST_CAP` | `startingPool / (3 × MEETING_MIN_AFFORDABLE_NUDGES)` | Max authored cost of any meeting nudge — enforces the guarantee across 3 tests |
| `MEETING_POOL_MIN_CONVERTED` | `3` | Min converted templates per selection slot before the converted path is preferred |
| `BOND_RECEPTION_BY_BAND` | fated→`awe`, favorable→`devotion`, uncertain→`bargain`, perilous→`doubt`, doomed→`defiance` | Reception id per band (Christian, 2026-07-30) |
| `MEETING_NEUTRAL_LEAN_COIN` | `0.5` | Pure-fate pole coin when net lean is zero |

Authoring guardrails (hand size 4–8, sphere coverage ≥4, factor lines 2–4) inherit from `nudgeAuthoringConstants.ts` — not duplicated.

## Tracing

```ts
// MeetingTestResolvedTrace — emitted when a formative test's fate roll resolves
interface MeetingTestResolvedTrace {
  type: 'meeting.test_resolved';
  testIndex: number;            // 0 | 1
  templateId: string;           // converted dilemma template id
  valuePair: ValuePair;
  netLean: 'a' | 'b' | 'none';  // pole lean of the played hand
  playedNudgeIds: string[];
  band: OutcomeBand;            // five-band ladder result
  writtenPole: 'a' | 'b';
  shift: number;                // signed shift applied
  quintessenceErosion: number;  // 0 on success bands
  essenceSpent: number;
}

// MeetingBondResolvedTrace — emitted when the bond test resolves
interface MeetingBondResolvedTrace {
  type: 'meeting.bond_resolved';
  band: OutcomeBand;
  receptionId: string;          // awe | devotion | bargain | doubt | defiance
  playedNudgeIds: string[];
  startingQuintessence: number; // after scarring, post-floor
}
```

## Fail-soft table

| Failure case | Fallback |
|--------------|----------|
| No converted template for a selection slot | Legacy dilemma path renders (data-presence branching) — never a blank beat |
| Hand filters to empty for this god | Impossible by authoring rule (≥1 common option); invariant test enforces; renderer additionally shows the common option unconditionally |
| Essence pool missing/insufficient despite cost cap | Nudge plays free with a `console.warn` + trace flag `essenceShortfall: true` — the meeting never blocks |
| Scarring would drop below floor | Clamp at `MEETING_QUINTESSENCE_FLOOR`; trace records pre-clamp value |
| Candidate portrait asset missing | EntityVisual gradient+glyph fallback, **same fallback rendered in every beat** (consistency holds even in fallback) |
| Bond test template malformed | Reception defaults to `bargain` (neutral), bond still forms, error trace emitted |
| `getMeetingState` called outside meeting | Returns `null`, never throws |

## Interface impact

| Contract | Action | Note |
|---|---|---|
| Nudge hand resolution (`nudges.ts`, `useNudgeHand`, `nudgeCommit`) | **preserve** | Meeting consumes as-is via structural `MeetingStepNudge` |
| Five-band outcome ladder | **preserve** | Same resolver, no parallel path |
| Essence pool spend | **extend** | New spend site (meeting tests); read site = existing essence readout |
| Band → soul write (`MEETING_POLE_SHIFT_BY_BAND`) | **add** | Production read site: `applyMeetingOutcomes` → `createAgentFromMeeting` |
| Thread edge `bondReception` | **add** | Written at bond; read site: agent detail / backstory surfaces (executor names the first reader; if none lands in this PR, file a `Deferral`) |
| Legacy dilemma choice path | **preserve (fail-soft only)** | Retired per-template as batches convert; never retired wholesale in this ticket |

## Blast Radius

No ≥100-importer file is edited — stated affirmatively because the plan *names* one to firewall it:

| File | Importer count | Cascade-risk note |
|------|---------------|-------------------|
| `src/types/unifiedAction.ts` | 278 importers | **NOT touched.** `MeetingStepNudge` extends `StepNudge` structurally in `src/types/meetingEncounter.ts`; the WS2 hand machinery consumes it unchanged. Any executor edit to this file is out of plan scope. |

## Three-pillar check

- [x] Engine pillar present
- [x] Content pillar present
- [x] UI pillar present
- [x] Wiring section connects them

## Vision audit

- [x] This plan does not contradict any Vision premise — it strengthens the core one: the first thing the game teaches becomes "the god acts in physics; fate decides." The formative tests are present-tense trials (Christian's verdict 13); no new fiction premise is introduced.
- [x] The one Vision-adjacent edit it forces (vault `taste-profile.md` quality-bar entry, which names the retired lyrical meeting prose) is part of this ticket's scope — see Notes for the executor.

## Rulebook impact

- [x] **This plan changes a rule of play** — the first-encounter structure and bond formation are rules of play.
- [ ] `Docs/canon/rulebook.md` (+ quick-reference if the meeting is mentioned) update lands in the implementation PR, not as a follow-up. `Docs/canon/encounters.md` gains a line noting the meeting is nudge-native. New UL terms (**Formative Test**, **Bond Reception**) go through a `UL-proposal` issue filed by the executor. ("Unset weave" was rejected by Christian 2026-07-30 — do not introduce the term.)

## Kill criteria

- If playtest shows the pole-lean mechanism reads as "picking the ending with extra steps" (players perceive the lean as choosing the outcome, not acting in physics), the mapping is wrong — fallback: strip pole leans and let fate alone pick the pole (the no-lean pure-variance path already exists), keeping the test surface intact.
- If the meeting's onboarding time exceeds ~10 minutes at median reading pace, cut `MEETING_FORMATIVE_TEST_COUNT` from 2 to 1 — it is a constant, not a rewrite.
- If Batch A cannot reach its coverage predicate within budget, the converted path stays preference-gated (legacy fail-soft carries the gap) and the remainder ships as Deferrals — the ticket does not block on full coverage.

> Brainstorm companion: `Docs/plans/2026-07-30-thr-868-meet-the-first-nudge-conversion-brainstorm.md`

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | Every magic number in the constants table; authoring guardrails inherited, not duplicated |
| 2. Inspectability | PASS | Two new trace types; designer view works in meeting tests; `getMeetingState` debug surface |
| 3. Determinism | PASS | Seeded streams per roll; riders zero-draw (WS0 semantics); no `Math.random()` |
| 4. Fail-soft | PASS | Table above; legacy path retained as structural fallback |
| 5. Narrative over mechanical | PASS | Full fate variance chosen *for* story (misfire is the lesson); failure writes character, never walls |
| 6. Additive over destructive | PASS with note | All schema additive; the only destructive step (legacy choice-path retirement) is per-template and staged behind batch conversion |
| 7. Performance budget | PASS | UI-driven, pre-tick; no tick-loop additions |

## Done when

- [ ] A seeded new-game run reaches the bond with: 2 formative tests + bond test each showing motive line, purpose line, difficulty word, 2–4 factor lines, a hand (hidden-not-dimmed filtering), fate reveal, band prose with nudge fragments — evidenced by Playwright screenshots at 1920×1080 per beat
- [ ] `window.__DEBUG.getMeetingState()` assertion + created agent's `axiologicalProfile` / thread `bondReception` / starting quintessence match the rolled bands (console output pasted)
- [ ] Unit tests: `MEETING_POLE_SHIFT_BY_BAND` mapping (all 5 bands × both leans × none), scarring floor clamp, affordability invariant (`MEETING_NUDGE_COST_CAP` respected by every authored meeting nudge — a content invariant over the *converted* population, pinned non-empty per memory `vacuous_probe`)
- [ ] Batch A conversion complete per its membership predicate; converted templates pass the WS1 lint (hand size, sphere coverage, factor polarity, no digits, concreteness)
- [ ] Register rewrite across all meeting prose surfaces; `scoreProseEntry` advisory output attached
- [ ] Visual identity: one portrait across all beats (screenshot series shows the same candidate); `meeting-art-library` audit done
- [ ] Rulebook + encounters canon updated in the same PR; UL-proposal issue filed; vault `taste-profile.md` quality-bar entry updated (see executor notes)
- [ ] `npm test` and `npx vite build` pass; types via `npm run check:typecheck` (ratchet — never `tsc --noEmit`)
- [ ] Closing commit body includes the auto-close keyword line for THR-868 (per THR-738: alone on its own line, commit body AND PR body)

## Coordination block

**Suggested model:** `opus` — multi-pillar conversion with heavy content authoring and register judgment (advisory; CC runs Opus regardless)

**Parallel-safe with:** THR-838 batch children (THR-848/855/856/858–864) — they edit `unified-action-templates` / encounter data; this ticket's one shared surface is `src/types/trace.ts` (TraceEntry union registration), which content batches do not touch. If a batch child unexpectedly registers trace types, that pair becomes mutex on `src/types/trace.ts`.

**Mutex with:** THR-866 (apotheosis REWRITE) only if it lands schema edits in `src/types/unifiedAction.ts` (both would then touch nudge schema surfaces); otherwise none — no shared files

**Files to touch:**
- Create: `src/data/meeting-bond-test.ts`, `src/data/meeting-nudge-constants.ts`, `src/components/MeetTheFirst/FormativeTestBeat.tsx`
- Edit: `src/engine/meetingEncounter.ts` (resolve/apply functions), `src/types/meetingEncounter.ts` (types, additive), `src/types/trace.ts` (register `meeting.test_resolved` / `meeting.bond_resolved` in the `TraceEntry` union — beware Omit-collapse on unions, verify with `tsc -b` not editor squiggles), `src/data/meeting-dilemma-library.ts` (Batch A fields), `src/data/candidate-vignettes.ts` + `src/data/meeting-narrative-prose.ts` (register), `src/data/meeting-art-library.ts` (audit/retag), `src/components/MeetTheFirst/{MeetTheFirstFlow,BondBeat,SensingBeat,SparkBeat}.tsx`, `src/debug-bridge.ts` + `src/debug-bridge.d.ts` (`getMeetingState`), `Docs/canon/rulebook.md`, `Docs/canon/encounters.md`
- Delete: `src/components/MeetTheFirst/TestingBeat.tsx` (after `FormativeTestBeat` lands; its tests move/retire with it)

## Notes for the executor

- **Do not edit `src/types/unifiedAction.ts`.** `MeetingStepNudge` extends `StepNudge` structurally in `meetingEncounter` types — that is the blast-radius firewall (278 importers). If you find yourself needing a `StepNudge` field, stop and check whether the meeting-local extension carries it instead.
- **Do not fork WS2 components.** If `NudgePhaseShell` needs a presentation prop (cinematic wrapper mode), add the prop; a copied shell is the failure mode.
- **Both chat gates already resolved (Christian, 2026-07-30, this session):** framing = present-tense trials (unset weave rejected — never introduce the term); reception set = awe/devotion/bargain/doubt/defiance. No further sign-off needed on either.
- The dilemma library file header says auto-generated — it no longer is (the generator is gone); treat it as source, update the header comment in the Batch A PR.
- `?view=game&seeded` bypasses the meeting; manual verification must run bare `?view=game` (this is the one sanctioned case per CLAUDE.md dev-URL guidance).
- Scar trait seeds: grep existing trait vocabulary before minting (memory `trait_grant_unconsumed` — enumerate granted-vs-required values).
- Later library batches: file as `Deferral` children with their own membership predicates; never reference their future ids from this doc.
- **Taste-profile update is in scope (Vision audit finding):** the vault's `TheFantasyWorldSimulator/Vision/taste-profile.md` names the meeting-encounter prose as the game's prose quality bar — this ticket retires that register. Update the entry (filesystem via `OBSIDIAN_VAULT_PATH`) to point the quality bar at the nudge-spec register / newly-written nudge-native encounters, with the standard vault audit trail (dated inline note, `Docs/changelog.md` row, `log.md` append). Christian authorized the register direction (grill verdict 12b).

## Intent-judge verdict

**First pass (2026-07-30): Revise** — 4 required actions: (1) add Substrate inventory section (dim 11 VIOLATION, declarative fix); (2) copy kill criteria into the plan doc (dim 10 GAP); (3) add `src/types/trace.ts` to files-to-touch + re-verify parallel-safe claim (dim 3 GAP); (4) reception vocabulary drifted from grill verdict 7 (dim 6 GAP) — routed to chat gate. All four applied same-session; items 3's framing gate and 4's vocabulary were resolved by Christian directly (grill synthesis verdicts 13–14: present-tense trials, awe/devotion/bargain/doubt/defiance). Re-verify pass recorded below.

## Forked-audit verdicts

*Generated by design-audit-pipeline — 2026-07-30*

### NFP audit

| NFP | Verdict | Evidence |
|-----|---------|----------|
| 1. Tunability | PASS | Full constants table (10 named constants: `MEETING_POLE_SHIFT_BY_BAND`, `MEETING_NUDGE_COST_CAP`, etc.); authoring guardrails explicitly inherited from `nudgeAuthoringConstants.ts`, not duplicated |
| 2. Inspectability | PASS | Two new trace types (`MeetingTestResolvedTrace`/`MeetingBondResolvedTrace`) with full interfaces registered in `TraceEntry`; `__DEBUG.getMeetingState()`; wiring table maps every module to phase/UI/state/trace/debug per checklist convention |
| 3. Determinism | PASS | Named seeded streams per roll (`meeting_test_0/1`, `meeting_bond`); "no `Math.random()`" stated; riders explicitly zero-draw per WS0 semantics; coin-lean draw also seeded |
| 4. Fail-soft | PASS | 7-row fail-soft table covers missing template, empty hand (invariant-enforced), essence shortfall, scarring floor clamp, missing portrait, malformed bond template, debug call outside meeting — none throw |
| 5. Narrative over mechanical | PASS | Explicit design rationale: fate variance chosen *for* story ("misfire is the lesson"); failure writes character not walls; no mechanic/story tension surfaced |
| 6. Additive over destructive | PASS-with-note | Schema changes additive throughout; but `TestingBeat.tsx` is deleted outright and legacy dilemma choice-path retirement is destructive per-template — doc itself flags this and stages it behind batch conversion rather than a flag day |
| 7. Performance budget | PASS | Explicitly UI-driven, pre-tick-loop; "no tick-loop additions" stated; no new orchestrator phase |

NFP AUDIT: PASS-with-notes (see rows above)

### Three-pillar audit

| Pillar | Verdict | Finding |
|--------|---------|---------|
| Engine | present-and-substantive | New pure functions, types, graph-edge property, PRNG streams, resolution logic all specified concretely |
| Content | present-and-substantive | Template field additions, batch predicate, bond-test file, prose register rules, data tables all specified |
| UI | present-and-substantive | Component replacement/addition, debug bridge extension, event/notification handling, fail-soft on missing portrait all specified |

Missing-required-sections list: No missing required sections. Blast Radius section correctly omitted with rationale (deliberately avoids editing `unifiedAction.ts`, 278 importers). Wiring section present in checklist table format, connects all three pillars. Substrate-existence check: `## Substrate inventory` present; `meeting` (1) confirmed in `systems-inventory.md` line 299; nudge-hand machinery matches the wiring-checklist WS0 entry verbatim; no green-field duplication detected.

PILLAR AUDIT: PASS

### Vision audit

Premises touched: `00-north-star.md` → "intervention shifted the odds, not the outcome" — confirmed (pole lean sets direction, fate sets band). `01-core-loop.md` → not referenced (pre-loop onboarding; borrows resolution machinery only). `02-non-negotiables.md` → god-not-protagonist confirmed/extended (explicit rejection of authored futures); prose-never-numbers confirmed; graph node/edge confirmed (`bondReception` as edge property). `03-design-tensions.md` → Tension 3 confirmed. `taste-profile.md` → god-never-protagonist and prose-first confirmed; **"meeting-encounter prose is the quality bar" extended/contradicted**.

Contradiction: `taste-profile.md` L106–115 names the (soon-retired) lyrical meeting prose as the reference quality bar; the plan retires that register with Christian's authorization (grill verdict 12b). Not unauthorized drift, but the taste-profile page reads stale the moment this ships. *(Resolved: taste-profile update added to this ticket's scope — see Notes for the executor.)*

Qualitative checks: north star — near-literal implementation of the target intervention feel; core loop — N/A; non-negotiables — inside; tensions — leans authorial but counterbalanced by fate variance, healthy; taste profile — respects all strong opinions except the entry this ticket knowingly retires.

VISION AUDIT: PASS-with-notes
