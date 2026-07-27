# Action proposal — Nudge encounter experience (WS1 builder pipeline + WS2 interface)

**Plan doc:** `Docs/plans/2026-07-27-nudge-encounter-experience-ws1-ws2.md`
**Issues:** THR-774 (WS1) · THR-775 (WS2), both under THR-772
**Impact class:** External (player-facing interface + the authoring pipeline for all future encounter content; mockups v1–v3 and the program carry the user's approvals)

## Originating intent (verbatim anchors, Christian)

- 2026-07-27: "the new encounter experience is still first priority" / "please do the design work on that first."
- Program rulings (2026-07-26, recorded in THR-772 + program plan): odds in words only; stacking allowed; per-encounter authored hands ("the options are part of the encounter design… quite a few options per encounter"); unavailable options hidden entirely; every game object clickable to a modal; agent portrait visible; motive line ("the player remembers why the agent has ended up in this encounter"); trait variants; fate images per band; image doctrine (agent-generic art).
- Mockup approvals: v1→v3 iterations each explicitly directed and accepted ("this is much better, lets keep iterating", v3 notes incorporated).

## What the plan proposes

WS1: rebuild the two encounter-authoring skills around the merged WS0 schema (authoring checklist: vignette → test data → 4–8-card hand w/ sphere coverage → six-band prose w/ rider composition → trait hooks → aftermath objects → image tags → scorer evidence), with a golden exemplar fixture. WS2: replace the authored-choices stage content with the nudge flow inside the existing encounter-stage architecture (motive strip, test panel, hand, fate reveal, aftermath modals, DebugPanel designer view), legacy screens preserved per-template until WS5 converts.

## What it deliberately does NOT do

No engine changes (WS0 consumed as merged; gaps become deferrals); no content migration (WS5); no image generation (WS4 — fallback chain until then); no new GameState fields, stage mounts, or modal hosts (kill criteria).

## Risks the judge should weigh

Whether one shared plan doc serving two tickets keeps each handoff independently buildable; whether the legacy-coexistence migration honors the rulings (hidden-not-dimmed etc.) during the transition; whether WS1's trait-hook rule (resolvable refs only, pre-THR-800) is a faithful reading or an over-restriction.
