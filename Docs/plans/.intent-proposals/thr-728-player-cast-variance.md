# Action Proposal — THR-728 Player-cast outcome variance

## intent_quote

> "make sure to create a linear ticket for later design of the outcome variance." (2026-07-23)

> "check linear, anything we can get ready for dev from this plan?" (2026-07-24)

> Structured chat verdict, 2026-07-24, question "Should playing a god-card be able to land imperfectly?": **"Yes, with a safety floor (Recommended)"** — option text: "Casts roll on the same outcome ladder mortals use, but a paid cast can never outright fail — worst case is 'the miracle lands crooked' (success at a cost). Keeps essence spend meaningful, makes the receipt a tense reveal." The alternatives ("Yes, full ladder incl. failure", "No — keep guaranteed success") were presented and declined.

## scope (what this plan does)

Removes the player auto-success early-return in `resolveUncontestedStep` (behind a `PLAYER_CAST_VARIANCE_ENABLED` master switch): player casts of positive-difficulty templates roll through the shared capability-vs-difficulty resolution with shapers, then a player-specific floor upgrades any failure outcome to `success_at_cost` (success ops still run — `isStepSuccess('success_at_cost')` is true). Zero-difficulty templates (all `divine.*` soul-verbs, 54 of 136) keep guaranteed success via the existing difficulty-0 rule. Push/resist stay NPC-only. Adds a qualitative risk line (steady/uncertain/perilous) to the focused card, a `playerFloorApplied` trace field, five named constants, and the mandatory `Docs/canon/rulebook.md` §4 update in the same implementation PR.

## scope (what this plan does NOT do — explicit non-goals)

- No hard failure for player casts (`setback`/`catastrophe` bands unreachable) — that variant was explicitly declined.
- No essence refunds or compensation mechanics (the floor is the compensation; settled by the chosen option).
- No push/resist access for the ascendant.
- No changes to the Divine Receipt, `receipt-content.ts`, or band vocabulary (all six bands pre-authored; verified).
- No re-pricing of zero-difficulty templates; no new probability model; no new outcome vocabulary.
- No numeric odds shown to the player (prose risk words only).

## impact_class

Reversible — one-flag master revert restores auto-success verbatim; all other additions are optional fields/constants/one UI line.

## evidence cited

- **Linear issue:** THR-728 (claimed In Design 2026-07-24, verified). Parent context: THR-727 Done 2026-07-23 (receipt shipped with all-band frame lines).
- **Vision premises invoked:** north-star reveal loop; "mechanics surface through prose" non-negotiable; THR-609 plain-register rule for interactive text.
- **UL terms touched:** existing only — outcome ladder, outcome band, success-at-cost, difficulty, capability. No new coinage.
- **Canon pages consulted:** `Docs/canon/rulebook-quick-reference.md`; `Docs/canon/rulebook.md` §4 named as in-scope edit; `Docs/canon/interface-map.md` (touched subsystem UNAUDITED → audit-on-touch rows in plan).
- **Prior plan docs this builds on:** `Docs/plans/2026-07-23-thr-727-divine-receipt.md` (display surface); THR-571 outcome-ladder work (floor-upgrade mechanism reused); THR-503 (ascendant capability persistence).
- **Rejected approaches considered and dismissed:** five, with reasons, in the brainstorm companion (full ladder; status quo; bespoke ascendant curve; parallel "miracle quality" system; player push access).

## load-bearing decisions touched

- "Ascendants use the same prerequisite system as agents" — this plan is the *fulfilment* of that decision on the resolution side: same sigmoid, same shapers, same capability call; the only ascendant-specific elements are the floor and the push/resist exclusion, both stated.
- "No inventing node types" / "relationships are edges" — untouched (no graph changes).
- Rejected approach "fixed action count / capped slots" — untouched.

## high-impact files touched (from Codesight)

- `src/types/trace.ts` — not on the ≥100-importer list. `src/engine/unifiedActionResolution.ts`, `ActionDrawer.tsx`, new constants file — none on the high-impact list. **No ≥100-importer file is touched; no Blast Radius section required** (checked against the CLAUDE.md named list; `gameState.ts`/`unifiedAction.ts` are read but not edited).

## kill criteria

Wrong if playtests show strained outcomes read as noise or punishment (signal: players stop casting positive-difficulty cards; receipts acknowledged sub-second). First remedy is tuning — per-template difficulty numbers and `RISK_HINT_THRESHOLDS` — never structure. Full revert is `PLAYER_CAST_VARIANCE_ENABLED = false`, restoring auto-success without code changes. If the risk line confuses, it can be dropped independently of the engine change.

## explicit user sign-off

Not required (Reversible), but present: the structured verdict quoted above ("Yes, with a safety floor (Recommended)", 2026-07-24 chat) — this satisfies the human gate for the rules-of-play change per the user-review-interface protocol; record `human gate satisfied via chat review 2026-07-24` in the Linear handoff.

## author notes for the judge

- The substrate claims are grep-verified this session against `main` post-THR-727: the floor-upgrade transform exists (`FLOOR_UPGRADE_OUTCOME`, `unifiedActionResolution.ts` ~159/398–407), `isStepSuccess('success_at_cost')` is true (`types/unifiedAction.ts:1152`), all six `RECEIPT_FRAME_LINES` bands are authored (`src/data/receipt-content.ts:63`), and the 82/54 difficulty split comes from an esbuild-bundled probe over the live template array.
- The one acknowledged uncertainty is whether `computeCapability` reads the ascendant node cleanly; the plan names the fallback (THR-503 `domainAffinities` via `getAscendantDomainAffinities`) and instructs verify-the-noun rather than assuming.
- Rulebook impact is embraced, not deferred: the §4 edit is in the implementation ticket's Done-when.
