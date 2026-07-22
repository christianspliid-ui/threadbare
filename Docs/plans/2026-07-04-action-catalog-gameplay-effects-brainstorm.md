# Brainstorm companion — action catalog gameplay effects (2026-07-04)

Working notes for `2026-07-04-action-catalog-gameplay-effects.md`. Records alternatives considered and why they lost. Sources: user ask (chat, 2026-07-04), code verification same session.

## Trigger

User, reviewing `action-catalog.html`: "we do not really have an 'Effect' described in gameplay terms only in prose. is this because the effects are not really implemented for all?" — answer turned out to be *both*: no emission path for effects, plus six genuinely unimplemented actions.

User clarification mid-design: "descriptions and technical game effects are not the same. i want a technical game effect description for our game wiki (currently under construction)." → field renamed `technicalEffect`, register set to technical (names state changed + direction + persistence, symbolic magnitudes), consuming surface fixed to wiki pages, in-game Codex moved to explicit non-goal.

## Alternatives considered

1. **Derive effect text automatically from GraphOps + engine bridges.** Rejected: effects live in three structurally different places (template step ops, id-keyed engine bridges, control/aftermath configs); auto-summarizing GraphOps yields robotic text ("adds edge X") and cannot see inside bridge functions at all. Fragile and half-blind. Kept only the cheap derivable part: a boolean-ish `effectSource` classification.
2. **Backfill/rewrite `description` to meet its original docstring** ("qualitative game-mechanical, no numbers"). Verified all 116 main-file templates already have authored descriptions — they drifted to flavor prose. Rewriting them changes ActionCard UX for every action and destroys good flavor writing; the card wants flavor, the catalog wants consequence. Two fields, two readers. Rejected wholesale rewrite; additive field wins (NFP #6).
3. **Effect text only in the catalog HTML (hand-maintained).** Rejected outright — THR-519 exists precisely because hand-maintained catalog snapshots go stale.
4. **Fix the six no-ops inside this ticket.** Rejected: each needs real effect design (graph ops, possibly edges — load-bearing rule: relationships are edges, and edge additions need design-before-code). Bundling design-heavy engine work into a metadata/content ticket violates finish-before-you-start sizing. Split to a sibling issue.

## Tensions surfaced

- **Honest text vs. unimplemented mechanics:** authored `gameplayEffect` on a no-op action would be a lie. Resolved by pairing authored text with the derived `none` badge — text states intent, badge states reality.
- **Precedence in `effectSource`** is presentational, not semantic — a template can have both step ops and aftermath. Stated explicitly in the plan so nobody later "fixes" it into a taxonomy.

## Vision premises invoked

None directly; supports the standing "prose plainer/readable" direction (player-facing text communicates mechanics in plain language) and NFP #2 inspectability.
