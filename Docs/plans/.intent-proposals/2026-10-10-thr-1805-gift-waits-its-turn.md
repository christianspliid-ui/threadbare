# Action proposal — A gift waits its turn (THR-1805)

## intent_quote

> **Design question.** How should a gift that is ready arrive when the player is in the middle of doing something?
>
> **Recommended direction.** A ready gift never opens over a player-opened surface (cast hand, ledger, profile, Codex), and never within about 2 s of a player click. Instead it waits as a lit "A gift waits" banner or chip (the existing `!` affordance …). It opens when the player clicks it, or when the player is idle with nothing open. The "one player act apart" spacing stays. Only the delivery moment changes. Any timings are named constants.
>
> **Fixed when** a round-4 tester opens Observe, Cast, the Chapter Ledger or a mortal's profile and gets the surface they clicked, with no tester reporting a popup in its place.

(THR-1805 description, filed 2026-10-10 from cold playtest round 3. The design lane works it under Christian's 2026-09-25 delegation, THR-1611; process.md rule 4 covers consequences of a shipped design, here THR-1647.)

## scope (what this plan does)

Changes only the moment a ready opening spine gift (beats 1–4) mounts its modal. A new pure UI resolver holds the gift while any player-opened surface is open, or within `GIFT_QUIET_AFTER_INPUT_MS` (2000) of the last pointer/key input. While held, the gift shows as the existing `AscendantBeatOfferBanner` with "A gift waits" wording; clicking it opens the gift at once. When the hold clears, the gift opens itself. Adds a debug accessor, three constants, three strings, and a shared player-surface helper that `getDebugOpenModals` also uses.

## scope (what this plan does NOT do — explicit non-goals)

- Does not change gift readiness, order, spacing, the idle fallback or `BEAT_MAX_PENDING` (THR-1647 engine).
- Does not change Beat 0 ("Reach Down") — still opens at once (THR-1716).
- Does not change pool beats, premonitions, story beats, encounters or the registry's yielding set.
- Does not make a held gift pause the world.
- Uses the existing offer pill rather than the encounter `!` badge. The `!` badge is encounter-only (`encounterBadgeModel.ts`), and the ticket names "banner or chip".
- Does not address THR-1806 (aftermath after a chapter step) or THR-1808 (post-bond dashboard direction).

## impact_class

Reversible — UI-only delivery timing; no save-state, engine or content-schema change.

## evidence cited

- **Linear issue:** THR-1805 (builds on THR-1647, respects THR-1716)
- **Vision premises invoked:** deliberate god acts (UI Laws 46/48); player-paced onboarding (THR-1647)
- **UL terms touched:** Chapter Ledger (unchanged). "Gift" is player-facing wording already used by THR-1647 and the content file's comments; no new UL term.
- **Canon pages consulted:** `Docs/design-system/laws.md` (Laws 27, 35, 39, 40, 47, 49, 52), `Docs/ops/player-complaint-classes.md` (PC-4, PC-5), `Docs/ubiquitous-language/README.md`, `Docs/canon/rulebook-quick-reference.md`
- **Prior plan docs this builds on:** `Docs/plans/2026-10-04-thr-1716-arrival-first-beat.md`; THR-1647 implementation (constants at `src/data/ascendant-beat-content.ts:34-54`)
- **Rejected approaches considered and dismissed:** delaying the engine gate; registry-yielding beat modal; pill-only delivery; pausing while held (brainstorm companion table)

## load-bearing decisions touched

None. No graph, node, edge or cache change. "Engine caches are owned per session" — not touched.

## high-impact files touched (from Codesight)

`src/components/Game/GameView.tsx` is a large hub component, but it is not on the ≥100-importer list (it is imported by the view router, not widely). `src/data/ui-content.ts` is imported widely, but this plan adds keys only. No Blast Radius section is needed.

## kill criteria

- A round-4 tester still reports a gift or popup opening in place of the surface they clicked → the hold list is incomplete. Find the surface and add it to `GIFT_HOLD_SURFACES`.
- A round-4 tester reports the gifts never arrived, or waited over a minute with nothing open → the quiet window or the hold is mis-firing. Check `__DEBUG.getGiftDelivery()` and shorten or fix it.

## explicit user sign-off

Not required (Reversible). Decided under delegation; Christian's veto is invited in the lane report.

## author notes for the judge

- The ticket said "the existing `!` affordance", but measurement shows `!` is the encounter badge on thread rows. The beat pill (`AscendantBeatOfferBanner`) is the existing affordance for a waiting beat, so the plan uses it. This is a deliberate deviation in favour of reuse (Law 26), stated in non-goals.
- Wall-clock input timing affects only when a React modal mounts. Engine determinism is unaffected.
- The Done-when on THR-1805 is "implementation tickets filed into the Cold playtest · round 3 milestone and this ticket closed by the design pass". The lane will file one implementation ticket carrying this plan, then close THR-1805.
