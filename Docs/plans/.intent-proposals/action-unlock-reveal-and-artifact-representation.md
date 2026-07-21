# Intent Proposal — Action Unlock Reveal + Artifact Representation Pattern

## User's verbatim ask (2026-07-05, chat)

> "in regards to the onboarding of actions to the player in the beginning of the game, we are not showing the relevant card of the action received, neither any information about what the card does (effects). please update the modal to do that. ALSO please update this as a core UX pattern. always show enough relevant information and art that represents the core game artifact. If you are uncertain about what qualifies as a game artifact, lets do a sweep of the game system wiki and the game UI to define those. examples of core game artifacts: Agent, Faction, Action, Location, etc."

## Clarifications obtained in chat (same session)

- Card presentation: full focused ActionCard face inline in the modal (user picked over compact+detail).
- Effects: single plain-prose effects line (user picked over prose+chips).

## Proposed action

Plan doc `Docs/plans/2026-07-05-action-unlock-reveal-and-artifact-representation.md`:

1. AscendantBeatModal renders real focused ActionCards (art + description + cost) for every granted action, replacing the plain-text "You will learn:" strip; same for selection beats.
2. New `actionEffectsProse()` (authored overrides + composed fallback) adds a plain-prose effects line to the focused ActionCard face — appears in both the unlock modal and the Action Drawer.
3. Codifies the "Artifact Representation Pattern" (canonical visual + identity + player-relevant info for any surface whose subject is a core game artifact) and includes the artifact registry produced by the requested sweep (graph.ts + UL + Codex + IA surfaces). CC creates `Docs/design-system/artifact-representation.md`.
4. Relates to THR-637 (Entity Visual Header — image-only pattern, In Design) — generalized, not duplicated.

## Scope boundaries

- No engine/tick changes; presentation + content only.
- THR-637's four-surface retrofit remains its own issue; not absorbed here.
- Art batches remain THR-638.
