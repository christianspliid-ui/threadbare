# THR-400 — Faction Action Expansion Brainstorm

**Date:** 2026-05-11
**Companion to:** `Docs/plans/2026-05-11-thr-400-faction-action-expansion-reframe.md`
**Status:** Working notes that preserve the design dialogue behind the four-verb plan. Not a contract; the plan doc is the contract.

## What the audit forced us to confront

The original eight-verb design (in the THR-400 body) drifted in three directions at once:

1. **From organization to commissioning.** The parent audit (THR-390) descoped this issue *to organize what already exists*. The first draft drifted into commissioning new substrate (Schism's faction-split, hidden-corruption schema, succession edges, internal-pressure resolver) as if those were implementation steps rather than entire epics. The reframe drops to four verbs that ride substrate that already exists today, and files the four deferrals as their own design tickets.

2. **From mortals to dashboards.** Factions are the highest-remove target in the catalog. Without an explicit mortal-loop bridge per verb, faction expansion becomes dashboard expansion — more buttons that move integers in the world model, with nothing for the player to grieve. The reframe makes the mortal-loop bridge a per-verb requirement, not a system-level afterthought.

3. **From prose to mechanics.** Engine mutations were spec'd; what the player reads was not. Non-Negotiable #3 (all mechanics surface through prose) collapses the moment a verb's only output is `dissentScore +0.25`. The reframe forces an IPK chronicle band and an encounter scene per verb.

## What stayed from the original

- **Four shapes (fracture / redirect / expose / elevate)** — this framing survives the reframe. The audit said the framing was good; the audit said the *eight* was too many. We kept three of the four shapes (fracture / redirect / expose) and used the fourth shape (elevate, via Recover Doctrine) without inventing succession edges.
- **Family-resemblance pairings** — Stir Dissent ↔ Incite Unrest (faction-scale vs. location-scale), Whisper Leader ↔ Persuade (role-scoped vs. free-target). These survived because they were doing real work: teaching the player that *target type* is itself a strategic axis.
- **Conditional-reveal discipline** — "only fires if real state exists, never fabricates." Surface a Doubter keeps this; Reveal Corruption (deferred) keeps it but adds the suspicion mechanic the audit said was structurally required.

## What we dropped or deferred and why

| Verb | Status | Why |
|------|--------|-----|
| Schism | Deferred (own ticket) | Faction-split is a subsystem. Today `splinter` exists in `FactionActionType` but the runtime path to mint a new `FactionDefinition` and partition members is unverified. Don't smuggle a subsystem in as an "implementation step." |
| Reveal Corruption | Deferred (own ticket) | Requires hidden-state schema AND the suspicion mechanic. The audit named this Tension #4 — legibility vs. mystery is a Vision-level UX decision, not a UX afterthought. Spec the suspicion mechanic first, then design the verb. |
| Anoint Successor | Deferred (own ticket) | Requires succession edges and resolution logic on leader exit. Companion to Anoint Champion but on a different time axis — it's its own design pass. |
| Sanction Mission | Renamed Kindle a Calling, deferred | Violated Non-Negotiable #1. The god does not name missions; the god amplifies what is already there. The renamed verb requires an internal-pressure resolver that does not exist today. |
| Unmask Heretic | Reframed as Surface a Doubter | The "heretic" framing required a hidden flag. Reading existing axiological misalignment gives the same narrative payload without inventing schema. The act of *surfacing* (not unmasking) is the divine move. |
| Stir Dissent | Kept | Maps to a single property on the faction node; rides naturally on the conclave system; the threshold-fires-encounter pattern is exactly the wiring-guide Capability 2 shape. |
| Whisper to Leader | Kept | Existing leader resolution + existing persuasion influence model. The verb is mechanically equivalent to `divine.persuade` scoped through the leader role. |
| Recover Doctrine | Kept | Rides ruin discovery (shipped). The verb is the player's reward for prior exploration play; the encounter is where the recovered teaching gets adjudicated by a real mortal. |

## Tensions we sat with

### Tension 1 — Should "hidden but legible" verbs grey out or disappear?

The audit was firm: greying leaks the existence of hidden state. A greyed Surface a Doubter tells the attentive player "there is a doubter, but I can't see them yet" — which is half a step from a number on screen, and breaks mystery.

**Resolution:** Hidden verbs are *absent* from the drawer until their precondition becomes real. The player learns by play that certain verbs appear under certain conditions, not by reading a tooltip explaining the prerequisite.

This is the same pattern the Ruins system uses: a `delve` verb appears at a hex only when a ruin clue has surfaced there. Players learn the rule by playing; the dimmed-with-explanation model is the wrong shape.

### Tension 2 — Where does the encounter live, in template or in content?

The 2026-05-04 encounter direction says per-scene god-verbs. The verbs in this plan are global `UnifiedActionTemplate` entries. The audit asked: is the catalog surface itself retiring?

**Resolution:** Both layers are valid for faction-scale work. The global template is the **strategic-layer trigger** — the action card in the drawer that the player picks. The encounter that *fires* from that trigger is per-scene god-verb territory, authored in encounter content with full per-scene prose freedom. The bridge is the encounter seed: the global template plants the encounter; the encounter delivers the per-scene god-verb experience.

This resolution is consistent with how `action.anoint-champion` works today (a global template that, in effect, plants a series of encounter framings around the anointed mortal). We are following an existing pattern, not inventing one.

### Tension 3 — Should Whisper to the Leader fire an encounter, or modify the leader's next decision silently?

Silent modification is easier and more "god-like" — the player whispered, the leader will decide later, no scene fires immediately. But silent modification means the player has no scene to read; they spend essence and the world ticks on without a beat that registers as narrative.

**Resolution:** The whisper modifies the leader's next decision (mechanical effect) **and** optionally seeds a "leader at a crossroads" encounter on a short delay (scene surface). The seed is soft (auto-withers if the leader has already used their condition for another encounter). The player gets both — the mechanical tilt and a chance to read what their whisper turned into.

If the encounter pool gets noisy, the seed can be made opt-in via the choice card UI. For now, default-seed.

### Tension 4 — Four verbs is light. Will the player feel like factions are still under-served?

Maybe. But the alternative — eight verbs, four of which carry hidden subsystem builds — produces an issue that takes weeks to ship and probably ships with subsystem bugs. Four verbs that all work, all surface through prose, all bridge to a mortal, all ship next sprint, is the better trade.

The four deferrals (Schism, Reveal Corruption, Anoint Successor, Kindle a Calling) are filed as their own tickets. The audit's "ceiling, not floor" reading of 6–8 is the right frame: we shipped four, and the path to eight is *additional issues*, not the same issue.

## Vision premises invoked

The reframe is anchored in these Vision premises (no edits required):

- **Non-Negotiable #1** — Player is a god, not a protagonist. The god amplifies what is already there; the god does not author. (Forced the Sanction Mission → Kindle a Calling rename + deferral.)
- **Non-Negotiable #3** — All mechanics surface through prose. (Forced the IPK chronicle band + encounter scene per verb.)
- **North Star** — One mortal the player came to care about, in a crisis. (Forced the per-verb mortal-loop bridge.)
- **Tension #4** — Legibility vs. mystery. (Forced the hidden-until-precondition-met model for Surface a Doubter and Recover Doctrine, deferred Reveal Corruption pending suspicion mechanic design.)
- **Taste profile — Encounter-specific intervention verbs (2026-05-04).** (Forced the explicit bridge between strategic-layer triggers and per-scene god-verb encounters.)

## What we considered and rejected

- **Greying-out hidden verbs with tooltip prereq explanation.** Rejected per Tension 1; absence is the right shape.
- **Folding Surface a Doubter into Stir Dissent as a sub-mode of the same verb.** Rejected because the player's intent is different — Stir Dissent presses on the institution; Surface a Doubter elevates a person. Different shapes, different prose, different encounters.
- **Making Recover Doctrine consume essence per use rather than gating it behind a clue.** Rejected because then the verb is "spend essence to discover a doctrine," which the player has no way to differentiate from generic lore-creation. Gating it behind a real clue node makes the verb feel earned — the player remembers the ruin run that surfaced the doctrine, and the verb is the cash-in.
- **Authoring 8 trace types instead of 4 (one per verb plus one per outcome).** Rejected as over-engineering; one trace per verb with the resolution outcome in fields is enough for inspectability.
- **Letting `dissentLevel` be exposed in the faction detail panel as a number.** Rejected per Non-Negotiable #3. The ambient indicator (visual intensity) replaces the number for the player; the number stays available in DebugPanel for developers.
- **A global "faction restlessness" property that aggregates dissent + low reputation + ambition urgency.** Considered as a single signal but rejected for now — composing it later from individual properties is cheaper than baking it in and finding it doesn't fit. Additive principle (NFP #6) wins; the aggregate can be computed when needed.

## Open questions that the implementer will need to answer

(Not blockers — they're calls the executor should make at execution time with light judgment latitude.)

1. **Where do the four encounter content files live?** A new `src/data/faction-internal-pressure-encounter-content.ts`, or appended to an existing faction-encounter content module if one is canonical at execution time. Either is defensible.
2. **Does the leader-crossroads seed delay 4 ticks or 6?** Hard to know without playtesting; pick one and tune. The constant is named.
3. **Should the dissent ambient indicator under the faction icon use color (shadow vs. tinted shadow) or only intensity?** UI judgment call. Either is consistent with the existing palette.
4. **Should the surfaced-doubter condition decay over time, or only resolve on the seeded encounter firing?** Probably decay-on-encounter-firing for now; if the encounter withers (target moved, occupied, etc.), the condition decays naturally on `withered_seed` traces. Verify the existing wiring covers this.

## What the design dialogue looked like

The reframe pass took these steps in order:

1. Read the audit doc (`Docs/audits/2026-05-11-thr-400-vision-audit.md`) cover-to-cover.
2. Read the 2026-05-04 encounter-experience plan §10.4 to settle the catalog-surface question.
3. Codesight pre-flight: grep'd `src/types/faction.ts`, `src/engine/factionNetwork.ts`, `src/types/effects.ts`, and `src/data/unified-action-templates.ts` for what already existed in the substrate.
4. Read `action.divine-edict` and `action.anoint-champion` as the existing-pattern reference.
5. Mapped each of the original eight verbs to "exists today / would build a subsystem."
6. Dropped the four that would build subsystems; filed deferrals.
7. For each remaining verb, wrote the mortal-loop bridge paragraph *first* (per audit requirement), then the engine spec, then the prose discipline.
8. Built the constants table from the in-line numbers in the per-verb specs.
9. Wrote the NFP compliance summary and verified each row against the design.

The whole pass took one Cowork session. The deferred verbs are tracked; nothing was dropped without a successor.

---

*Working notes filed by Cowork, 2026-05-11. The contract lives in the reframe plan doc; this companion preserves the dialogue.*
