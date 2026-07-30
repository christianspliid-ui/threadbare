<!-- plan-doc-lint-exempt: grill-me synthesis artifact, not a plan doc -->

# Grill-Me Synthesis — Meet The First nudge conversion (THR-868)

**Date:** 2026-07-30 · **Mode:** conversational (3 rounds × 4 questions, 12 total) · **Participants:** Christian (verdicts), Claude Code design session (interrogation)

## 1. Scope under interrogation

The Meet The First encounter — the game's first teaching surface — still runs the rejected pre-nudge model. Its Testing beat asks the player to pick between two authored formative moments whose choice deterministically writes the First's values: choosing between authored futures, no test, no fate roll, no nudge. Christian's framing: "it allows the player to choose between two different worlds instead of the test and nudging that the new encounter system does," and because it is the first encounter, "it needs to be updated also." He also invited an experience-improvement pass.

## 2. Confirmed decisions (all Christian, chat, 2026-07-30)

| # | Question | Verdict |
|---|---|---|
| 1 | Fate variance on the First's soul | **Full variance.** You nudge toward mercy; fate can still land ruthlessness. No softening rider. The misfire is the lesson. |
| 2 | Which beats convert | **Testing only.** Sensing (whom to bond) is targeting; Spark (what to invest) is an investment — both legitimate god-decisions in the physics. |
| 3 | Economy | **Real essence, guaranteed affordable.** Real pool, real costs, tuned so the player can always afford 1–2 nudges per test. No fake tutorial currency. |
| 4 | Interface | **WS2 components, dressed up.** Same test panel / forecast words / hand / fate reveal as every future encounter, wrapped in the meeting's cinematic presentation. |
| 5 | Bond failure | **Bond always forms.** Failure bands write scars, flaws, darker values — never a dead end at minute one. |
| 6 | Quintessence stakes | **Light scarring.** Failure bands erode the newborn First's starting quintessence a little; magnitudes tuned low; can never start broken. |
| 7 | Bond beat | **Bond is the climax test.** The mortal senses the god reaching; fate rolls how they receive you (awe / bargain / defiance / dread); the roll colors the bond, never denies it. |
| 8 | Arc length | **2 formative tests + bond test** = 3 rolls total. Tight, teachable, ~5–8 min. |
| 9 | Dilemma library (167 templates) | **Convert in place.** Setups become test scenes; the two authored resolutions seed band-payoff prose. The library's *moments* survive; its choice mechanics die. |
| 10 | Teaching | **Diegetic god-voice only.** Names the forecast word once, frames the hand in-fiction; no UI callouts or tooltip rails. |
| 11 | Staging | **New workstream (WS6) under THR-772** in the Encounter Experience project. (Blockers WS0/THR-773 and WS2/THR-775 verified Done 2026-07-30 — no live blockers.) |
| 12 | Experience-improvement pass (free text) | Two mandates: **(a) visual-identity consistency** — the candidate must look the same person from Sensing to Bond ("you start by looking like a middle aged man and end looking like something else"); **(b) register rewrite** — the meeting prose is "too lyrical, and needs to be moved… to something more simple and descriptive of events, the people and the motivations," a game-wide problem this ticket fixes for the meeting surface. |

### Post-judge chat gate (same session, after intent-judge Revise)

| # | Question | Verdict |
|---|---|---|
| 13 | Fiction framing for fate-rolled formative moments | **Present-tense trials.** The "unset weave" framing (nudging inside a still-settling past) is **rejected** — the formative moments happen NOW, during the meeting. Library scenarios must be re-situated into the present; irreducibly-childhood scenarios are killed, not converted. |
| 14 | Bond reception vocabulary (5 bands) | **awe / devotion / bargain / doubt / defiance** — fated→awe, favorable→devotion, uncertain→bargain, perilous→doubt, doomed→defiance. |

## 3. Agent recommendations (⚡ items)

All six ⚡ leans were accepted as offered: full variance, Testing-only scope, real-but-guaranteed economy, WS2-dressed interface, bond-always-forms, 2+bond arc, convert-in-place, diegetic teaching, new-WS staging.

## 4. Parked-then-resolved questions

None parked; all 12 resolved on first ask.

## 5. Unresolved grey zones

None. The one post-grill judgment call (unset-weave framing) was surfaced to Christian in the same session and **rejected** — resolved as verdict 13 (present-tense trials). The reception vocabulary the plan initially drifted on was likewise resolved as verdict 14.

## 6. Open risks and assumptions

- **Library conversion volume.** 167 templates × 5-band prose + hands is multi-batch work. Assumption: per-template reversible rollout (data-presence branching, as WS5 does) is acceptable, with a coverage predicate gating the flag-day-free cutover. Batch A covers every selection slot; the remainder ships in Deferral-tracked batches.
- **Pole-flavored nudges are a meeting-local extension.** Regular encounters' nudges shift odds only; meeting nudges also carry the leaned pole. Kept out of `StepNudge` (no `src/types/unifiedAction.ts` edit) via a meeting-local extension type to avoid a 278-importer blast radius.
- **Assumption:** the existing five-band ladder + attended resolution path (WS0) can be called from the meeting UI outside the tick loop, as WS2's attended encounters already do.

## 7. Inputs for the design doc

Everything in §2, plus: the four beats' current implementation (`src/components/MeetTheFirst/*`, `src/engine/meetingEncounter.ts`), the nudge authoring spec (`.claude/skills/encounter-pipeline/reference/nudge-authoring-spec.md`), WS2 components (`src/components/Game/encounter-stage/*`), program rulings 1–10 (`Docs/plans/2026-07-26-nudge-model-encounter-system.md`), image doctrine (ruling 10) for the visual-identity fix.
