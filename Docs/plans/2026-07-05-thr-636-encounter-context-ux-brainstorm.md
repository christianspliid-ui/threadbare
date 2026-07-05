# Brainstorm companion — THR-636 Encounter context UX

Companion to `2026-07-05-thr-636-encounter-context-ux.md`. Written in the same pass.

## The ask (verbatim, Christian, 2026-07-05 chat)

> "when encounters happen they only show up as an info box in the right side of the screen. these boxes are filled with text, instead of info that character X has had an update on their encounter. further when you click into the encounter modal, there is no contextual info about what character the encounter is about, what step we are on. no ability to navigate between already finished steps, to again understand the encounter context better. and no info about success and failures, and even a bit of info about what reaches where in play, and where on the map this encounter is happening."

## Alternatives considered

**Notification shape** — three options offered to Christian: structured card (chosen), headline + short prose, one-line ticker. Ticker rejected for losing all narrative flavour in a prose-first game; headline+prose rejected as still tall/wall-of-text-adjacent. The card keeps one teaser sentence as the flavour hook.

**Past-step view** — full replay (chosen) vs. summary-only. Summary-only was cheaper (afterimages already exist) but Christian picked full replay: the encounter should read "like flipping back pages in a chapter" — consistent with long-prose-is-a-feature and the TTS/reader audience.

**Replay source** — two designs weighed internally:
1. *Re-render on demand* from template + choiceHistory (no storage). Rejected as primary: `enrichProse` placeholders resolve against live world state, so a later re-render can silently rewrite the past the player saw. Also couples replay correctness to enrichment determinism across ticks.
2. *Capture at resolution* (chosen): freeze the rendered prose into a `StepProseRecord` when the step resolves. Costs memory (capped) but guarantees fidelity. Re-render is kept as the fail-soft fallback.

**Map context** — location line + camera-focus link (chosen) vs. inline mini-map vs. both. Mini-map deferred: a new render surface with real cost, while the actual map is one click away. Not a rejected-forever — a Chapter Ledger / detail-page mini-map could revisit this.

**Dots → stepper redesign** — considered replacing dots with a labeled stepper bar. Dropped: the veil's restrained visual language is intentional; we enlarge hit areas and add outcome color + click, we don't add chrome.

## Tensions surfaced

- **Prose-first vs. "info about success and failures":** resolved with the outcome-band word lexicon — legibility through *words* (held/faltered/broke), never rolls or percentages. Numbers stay in the existing readout + DebugPanel. (Memory: feedback_prose_first_ui; THR-609 plain interactive text.)
- **Rail legibility vs. narrative flavour:** the card's one-line tease is the compromise; full prose moves entirely into the modal where it belongs.
- **Overlap with Chapter Ledger (THR-603):** the Ledger archives *completed* chapters; this plan navigates *active* encounters. Shared substrate acknowledged — `StepProseRecord` is deliberately shaped to feed a future Chapter Record; mutex noted in the coordination block instead of parking an open question.
- **Additive-over-destructive vs. fixing the toast:** the toast body layout is intentionally replaced for encounter notifications — the prose dump *is* the defect, so preservation would be preserving the bug. Flagged as PASS-with-note in NFP table.

## Vision premises invoked

- Player-as-god framing: replay shows the god-action taken (whisper/steady/withdraw), never "what the character chose".
- Rule 4 (every primitive clickable): character chip and location link extend clickability into the veil header.
- THR-603 density vision: encounter volume is player-authored, so rail cognitive load grows with play — structured cards are the load-management move.

## Source notes

- Survey evidence: `useEncounterNotifications.ts:62` (prose-as-message), `EncounterVeil.tsx:1189` (passive 6px dots), `encounter-stage/types.ts` (`locationLabel` built but unrendered), `buildUnifiedEncounterStageModel.ts:281–322` (afterimage/complication reconstruction path).
- All three scope decisions confirmed by Christian in chat 2026-07-05 (structured card / full replay / focus link). No open questions parked.
