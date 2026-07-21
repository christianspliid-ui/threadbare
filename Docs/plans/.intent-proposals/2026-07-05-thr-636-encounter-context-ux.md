# Action Proposal — THR-636 Encounter context UX

## intent_quote

> "we have a UX problem. when encounters happen they only show up as an info box in the right side of the screen. these boxes are filled with text, instead of info that character X has had an update on their encounter."

> "further when you click into the encounter modal, there is no contextual info about what character the encounter is about, what step we are on. no ability to navigate between already finished steps, to again understand the encounter context better. and no info about success and failures, and even a bit of info about what reaches where in play, and where on the map this encounter is happening. can you create a UI update that adresses this"

Follow-up scope decisions (Christian, same chat, via structured question): structured headline card for the rail; full past-step replay in the modal; location line + camera-focus link (no mini-map).

## scope (what this plan does)

Redesigns the two encounter delivery surfaces. Right rail: encounter toasts become structured cards (agent — encounter headline, step X of Y + outcome word, one-line tease, click-through). Modal (EncounterVeil): adds a context strip (clickable character, location + camera-focus link, reach chip), makes step dots outcome-colored and clickable, and adds read-only full replay of resolved steps (prose, outcome word, reach, god-action taken, complication). Engine support is additive-only: `StepProseRecord` captured at step resolution, plus optional context fields (`totalSteps`, `outcomeBand`, hex, `locationLabel`) on `EncounterNotification`. One authored outcome-band → word lexicon (single source).

## scope (what this plan does NOT do — explicit non-goals)

- No mini-map inside the modal (explicitly deselected by Christian).
- No changes to encounter resolution math, prerequisites, scoring, or any rule of play.
- No Chronicle/ChroniclePanel redesign; no general RightRail IA redesign (THR-178 territory).
- No Chapter Ledger implementation (THR-603 scope) — only field-shape alignment awareness.
- No re-choosing or state mutation from replay — read-only.
- No numeric probabilities/rolls on any new player-facing surface — band words only.
- No new graph node or edge types.

## impact_class

Reversible — additive engine fields + UI presentation changes behind existing components; toast layout change is revertible in one file.

## evidence cited

- **Linear issue:** THR-636 (project: Encounter Experience)
- **Vision premises invoked:** player-as-god (choices are divine interventions), prose-first UI, Rule 4 clickability, THR-603 density/cognitive-load direction
- **UL terms touched:** existing terms only (encounter, step, reach, outcome band, thread tier). New candidate term: "step replay" — plain descriptive use; no UL-proposal opened (not a system noun). Judge may disagree.
- **Canon pages consulted:** `Docs/canon/encounters.md` (incl. Rule 4, rejected approaches), CLAUDE.md load-bearing decisions, THR-609 plain-register decision (memory), THR-603 density canon (memory)
- **Prior plan docs this builds on:** `2026-05-04-encounter-experience-design-plan.md` (veil is its artifact), `2026-05-05-encounter-ui-implementation-phasing.md`
- **Rejected approaches considered and dismissed:** re-render-on-demand replay (past could silently change); stepper-bar redesign of dots (chrome vs. veil language); mini-map (cost, deselected by user)

## load-bearing decisions touched

- "Agent position is a three-tier model" — respected: notification hex resolved via standard upward resolution.
- "Relationships are graph edges, not property fields" — respected: `StepProseRecord` is node-internal data (scores/prose of one action), not a relationship.
- "World graph mutated in place / version counters" — not touched; no new memoization on graph identity.
- "Additive over destructive" — engine fields all optional-additive; toast body intentionally replaced (the defect itself), flagged in NFP table.

## high-impact files touched (from Codesight)

- `src/types/unifiedAction.ts` — 278 importers (additive optional field)
- `src/types/gameState.ts` — 345 importers (only if `EncounterProgress` lives there; verify before edit)
- Blast Radius section present in the plan doc.

## kill criteria

If playtest shows cards strip too much flavour from the rail (rail feels like a task list, not a story), re-add a second prose line behind a constant (`NOTIF_TEASER_LINES`) — one-file change. If `StepProseRecord` memory footprint shows up in profiling on large maps, lower `STEP_PROSE_HISTORY_MAX` (tunable) or capture afterimage-only. If Chapter Ledger lands an incompatible record schema first, this plan's record type is renamed/aligned before merge — coordination-block mutex covers it.

## explicit user sign-off

Not required (Reversible class). Direction nonetheless confirmed in chat 2026-07-05: structured card / full replay / focus link — all three chosen by Christian from explicit options.

## author notes for the judge

- The survey found the veil already renders step dots and a "N of M" label; the user perceived "no info about what step we are on" — the fix is legibility/prominence, not absence. The plan says this honestly (surfacing problem).
- Full replay was the user-chosen option *after* being told summary-only was cheaper.
- I did not open a UL-proposal for "afterimage"/"step replay"; both are used descriptively, not as new system nouns. If the judge reads THR-603's Chapter Record as making "replay" a system noun, Revise with a UL-proposal is a fair outcome.
- Sandbox note: git freshness could not be verified this session (mount corruption, known impediment class); plan is written against files read via direct file tools, which are current on disk.
