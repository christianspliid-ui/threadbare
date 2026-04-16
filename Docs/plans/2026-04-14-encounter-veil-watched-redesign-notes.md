# Encounter Veil — Watched Tier Redesign Notes

**Date:** 2026-04-14
**Status:** Notes only (not yet a design spec)
**Related Linear:** New issue TBD (depends on THR-8)
**Related design docs:**
- `2026-04-07-encounter-veil-design.md` (original approved veil spec)
- `2026-04-05-attention-tier-model-design.md` (three-tier model)
- `2026-04-13-attention-tier-ui-implementation-plan.md` (THR-8)

## Why this doc exists

User flagged the current Watched-tier popup as unreadable. The symptom: a full-screen black void with a tiny diamond, "WATCHED · PEEK" in the top-right, "hard threat" below it, the line "This encounter runs in the background" in the center, a barely-visible "Peer Through the Thread" button, and essence/Close in the bottom corners. Everything sits in the middle or at the edges. The vast acreage in between is dead space.

We are **not redesigning yet.** THR-8 (Attention Tier Model — Phase 6 UI) changes the premise of the Watched tier fundamentally, and it is Ready for Dev. Redesigning the veil before THR-8 lands would be redesigning something that is about to stop existing in its current form. These notes capture the critique so the thread is preserved and reassessment after THR-8 starts from a real position rather than memory.

## Critique of the current Watched popup

### Gameplay

**Trigger.** An agent enters an encounter at `courtPosition: 'watched'`. Per `VISIBILITY_BY_POSITION.watched.autoInterrupt = false`, the notification is queued but not forced. Yet the UI that appears is full-screen and modal. The gameplay promise ("runs in the background") and the UI promise ("this is a full-screen ritual demanding your attention") directly contradict each other. The player is told to ignore the thing by the very act of being shown it.

**Options.** Before peek: one action — Peer (1 essence). After peek: a 0–5 boost slider and Commit/Close. That is mechanically fine in the abstract, but:
- "Peer" reveals ~1–2 sentences of prose. That is not enough story to motivate a boost decision. The player is asked to spend essence to see what they just spent essence to reveal was worth seeing.
- "Boost" is a number between 0 and 5 with no feedback about what it does. Does 3 pips matter more than 1? Against what baseline? The pip slider is pure abstraction with no narrative hook.
- "Disregard" is labelled "Close" — the verb change hides the consequence (the encounter auto-resolves without you).

**Does it tell a story? Do I want to know more?** No. The prose layer is sliced thin by the `proseDepthForTier(watched) => 'peek'` rule (first paragraph, first two sentences, out). There is no cast, no history, no stakes, no location, no hint of what the agent might do or what it will cost the player if it goes wrong. There is nothing to lean into. A watched encounter that I actually cared about would need to show me the thread of a person — the agent's name, what they are doing, why it matters — not an abstract threat label.

### UI

**Does the UI help?** No. The critical information ("WATCHED · PEEK", "hard threat") is in the top-right corner at 0.5 and 0.25 opacity. The primary action is in the geometric center, styled to look inert (4% background, 12% border, 45% text opacity). The footer actions ("Close", essence count) are at 25–35% opacity in the bottom corners. Every element fights to disappear. The aesthetic design goal was "whisper chrome" — the outcome is chrome that whispers past the threshold of audibility.

**Does it use the space?** No. 1920×1080 of canvas, and the active content zone is maybe 540×280 in the middle. Everything else is pure `#0a0a0f`. No art (or art that is masked so aggressively with `radial-gradient(ellipse 85% 80% at 35% 40%)` that it is invisible at the opacity levels the Watched tier uses). No context panels. No ancillary information. No story. It is a full-screen component used as a 540px widget with a thousand pixels of matte border on each side.

**What are we leaving on the table?**
1. The agent. Whose thread is this? Where are they? What did they just do? None of this appears.
2. The location. Watched encounters happen on hexes with history. That history is invisible.
3. The stakes. What happens if this resolves badly? What if it resolves well? The player cannot form a preference because the model does not surface one.
4. Comparison. With multiple watched threads in play, the player has no way to know which matters more. Each appears as its own full-screen event, rivalrous for attention and identical in presentation.
5. The art. Every encounter has (or can have) an illustration. At Watched tier we render it at ~8% opacity under a mask so aggressive it is effectively removed. If the encounter is background, we should let the art *be* the backdrop at higher prominence, or remove art entirely — not render it as a rumour of itself.

## Why THR-8 changes the premise

The approved attention-tier design already resolves most of the above. Reading `2026-04-13-attention-tier-ui-implementation-plan.md` against the current behaviour:

- **Slice 5 (Ambient Activity Icons).** Watched (= background tier) encounters should render as small reach-coloured icons near the agent on HexMapV2 — 6–8px, opacity 0.4, gentle pulse. They should never open a modal on their own.
- **Slice 2 (Digest Buffer).** Watched-tier resolutions accumulate silently into a per-agent digest. The player reads them in aggregate, not one-by-one, and not interruptively.
- **Slice 7 (Read the Threads).** The digest is surfaced through an active divine action — a deliberate, paid reading gesture. That is where peek/boost-style agency lives for background threads, not in an ever-present popup.
- **Slice 4 (Thread Tugs).** A Watched encounter that *matters enough to be noticed* gets promoted to Shaping and produces a thread vibration the player can attend. Attending is the moment the UI escalates — not the mere existence of the encounter.
- **Slice 10 (Story Beat Modal).** Full-screen ritual presentation is reserved for the Strong tier. That is when the veil should feel like a held breath.

In other words: in the post-THR-8 world, **the current full-screen Watched popup should not exist.** The peek and boost affordances migrate into the ambient + digest + Read-the-Threads triangle. The EncounterVeil component keeps its two *other* rendering paths (Light and Strong) and loses the Watched path entirely — or the Watched path shrinks into an optional inline inspector panel invoked from the hex map.

## Non-negotiables to carry forward

Even once THR-8 lands, a few principles from the current veil are worth defending:

1. **Prose-first, numbers hidden.** Memory file `feedback_prose_first_ui.md` — all mechanics through narrative. Boost pips without narrative framing ("press more firmly against the thread" / "let the current run") is still a bug in any successor UI.
2. **The Threadbare aesthetic wins on the Strong tier.** Art dissolves into void, whisper chrome, Georgia italic. Not the Watched tier. The aesthetic earns its place when the encounter is climactic, not ambient.
3. **Three-pillar integration.** Every successor slice needs Engine (attention pool, digest), Content (prose resolver output good enough to justify Read-the-Threads as an interesting moment), and UI (ambient icons + digest panel + inspector). No engine-only deliverables.
4. **Viewport contract.** If we keep any inline inspector panel, it obeys `h-screen flex flex-col overflow-hidden`. No new full-screen modal for background content.

## Open questions to revisit after THR-8

Flag these before scoping the new issue:

1. **Does Watched still need a modal at all?** If the ambient icon + digest + Read-the-Threads triangle carries the full Watched UX, there may be nothing to redesign in the veil beyond deleting the Watched branch. Confirm after playing with the THR-8 build.
2. **Where does "Peek" live post-THR-8?** Candidates: (a) hover tooltip on the ambient icon, (b) small inline panel when the icon is clicked, (c) a row inside the Read-the-Threads panel with a "peer deeper" action, (d) gone — replaced entirely by digest entries on resolution. My lean is (b) + (c); the modal is retired.
3. **Where does "Boost" live post-THR-8?** The boost mechanic modifies odds on a background encounter. It may belong as a divine action targeting a thread rather than a UI inside a popup. Worth a separate look at the action system.
4. **What happens to the "commit without peeking" path?** Currently not possible — you must peek before boost is available. After THR-8 the agent may have a general "I am nudging this thread toward success" divine action that works without the peek gate. Likely cleaner.
5. **Do Light and Strong tiers need their own critique pass?** They share the same codebase (EncounterVeil.tsx, ~1050 lines). User deferred this — revisit only after Watched is resolved.
6. **Art prominence by tier.** Current rule: `ART_OPACITY.watched ≈ low, Light ≈ medium, Strong ≈ high`. After THR-8 the Watched rule is moot. Reconsider Light/Strong opacity once tiers are visually distinct.

## What happens next

1. Claude Code finishes THR-8 (Slices 1–10, or the minimum sequence 1 → 2 → 3 → 4 → 7 → 8).
2. User plays the build. Reassess whether the Watched popup still exists as a problem, or whether it has been deleted by the THR-8 work.
3. New Linear issue opens at that point with a scoped redesign spec — either "retire the Watched branch of EncounterVeil" or "redesign the residual inline inspector for Watched threads", depending on what THR-8 actually lands.
4. Light/Strong tiers get a separate critique pass when the user chooses.

No implementation action required from this doc. It exists to preserve the critique and bind the decision chain to the attention-tier work that is already in flight.

## Inline notes

- 2026-04-14: Created by Cowork after user critique. Reassessment gated on THR-8 landing.
