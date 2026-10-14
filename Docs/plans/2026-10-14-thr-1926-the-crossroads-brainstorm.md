# Brainstorm companion — The Crossroads (THR-1926)

Companion to [`2026-10-14-thr-1926-the-crossroads.md`](2026-10-14-thr-1926-the-crossroads.md). Attended design session, 2026-10-14, from Christian's chat ask. No grill-me pass was run: the ask was concrete (top three, both families, then a nudge), and the open questions were answerable from source and the laws, not from a person.

## Vision premises engaged

- **The god influences; it never commands** (Vision §1, Law 9). This premise decided the plan. The shipped God's Will is a command with a price tag (`COMPULSION_SCORE_BOOST = 5.0`, "guaranteeing it wins"). The ask says *nudge*, and the law says the same.
- **The pleasure is witnessing, not steering** (Vision `00-north-star.md`, Law 13). The reading is the bigger half of the feature. Seeing what a mortal weighs is witnessing; the lean is a small, priced, resistible touch on top.
- **The thread runs both ways** (Law 12). A lean with no reply from the mortal would be the god's hand going out and nothing coming back. The answer line keyed by bond reception is the reply.
- **The purse is small on purpose** (Law 36). Leans cost what God's Will cost, so the player cannot lean every choice.

## Alternatives considered

### §A — How the reading gets its three options

| Option | For | Against | Verdict |
|---|---|---|---|
| **Forward dry run** — on request, run candidate gathering + filter + scorer + board for the mortal "as if choosing now" | Shows the future choice, not the last one | Candidate gathering is ~400 lines inside `phaseAgentDecision` (cache sweep, social, faction quest, lifecycle, journey goal, appointment re-rank) and would need extracting. Scoring has five side effects (funnel counters, trace emission, `anchorHeldWhispers` mutating influences, arrival-goal consumption, the appointment memo). A mortal mid-chapter is "choosing now" from a place and state that will not hold when they come free, so the dry run is no fresher than a snapshot. The UI would also have to reach the per-session runtime caches | Rejected |
| **Legacy pool** — reuse `BalanceEvent.rankedEncounterPool`, what "What they are weighing" shows today | Already exists | Encounter-only; ordered by `finalScore`, not the board; written only while balance telemetry runs | Rejected — this is the gap |
| **Snapshot of the deciding board** at each full decision, minus what was just taken | It *is* the ranking that decides (Law 18); free on the tick path; saves with the graph; both families | Up to one chapter stale | **Chosen**; the staleness is named in the forecast tooltip |

### §B — What the nudge does

| Option | Verdict |
|---|---|
| Forced pick, as God's Will does today | Rejected — Law 9. Kept reachable behind `COMPULSION_PREMONITION_ENABLED` as the veto path |
| A pull scaled by how much essence the player pours in | Rejected for v1 — a slider is a numbers surface (UI Law 13) and lets a rich god buy a command back in small coins. One weight, one price per rank |
| **One fixed board multiplier, toward (×2) or away (×0.5)** | **Chosen**. It sits between Whisper's ×1.6 ("felt") and Compulsion's ×5 ("forced"). The pair makes the settledness words and the lean forecast one arithmetic in both directions (`0.5 × 2 = 1`, and away ×0.5 flips the leader exactly when the ratio passes 0.5). The first draft had away at ×0.4. The intent judge caught that a "set" mortal could then still be turned by leaning away, so the words would lie; the fix pins them together |
| Lean away from any road, not only the leader | Rejected — leaning away from a road the mortal would not take anyway buys nothing. UI Law 25: a control that cannot matter does not render |

### §C — Where it lives

| Option | Verdict |
|---|---|
| An ActionDrawer card (`divine.crossroads`) through `preparePlayerCast` | Rejected — the cast pipeline rolls a resolution, and a card targets one node. The lean targets one *option* among three on a page that already lists them. A card would also sell the reading, which a thread already gives for free |
| Keep the God's Will pop-up, on its timer | Rejected — the player asked for something they call up. Law 15 and PC-5 count against unasked pop-ups. Replaced by a torn badge on the thread row |
| A row on `ThreadDetailView` | Rejected — the Inspector (THR-1876, Ready for Dev) replaces that column, and THR-1912 deletes it. Building there is throwaway |
| **One Inspector row on a threaded person's page, plus a torn badge** | **Chosen**. UI Law 58: the UI grows by adding entries |

### §D — Refund when a lean lapses

Considered refunding a lean whose road vanished before the mortal chose. Rejected for three reasons. Rulebook §4 already says *"There are no refunds"*. A refund path needs the engine to write the React-held pool (THR-1783 moved spends to the caller precisely to avoid that). And the confirm sentence states the rule up front: "paid now, whatever Kael chooses".

### §E — Reading cost

Considered charging for the reading (Law 36: "every card costs something"). Rejected: the reading is not a card. A threaded mortal's options are already shown free today ("What they are weighing"), and rulebook §9 makes threads the god's intelligence. Charging for an honest version of a free list would read as a regression.

## Tensions

- **Freshness vs honesty.** A snapshot is honest about the past decision and approximate about the next one. The plan picks honesty and words the forecast "may" / "likely", with a tooltip saying the world can move. The `forecastAtPlacement` vs `outcome` trace keeps it measurable, and the kill criteria say what number fails it.
- **Satisfying control vs Law 9.** God's Will felt good ("she does what I chose"). The Crossroads trades that certainty for a mortal who can say no, and makes the no visible and characterful (the answer line). If playtests show players feel cheated by *resisted*, the lever is the multiplier, not a return to commands.
- **Two premonitions, one retired.** Whisper (a lean on a *kind* of encounter) stays. The two stack, which is intended: a whisper toward Iron and a Crossroads lean toward an Iron road multiply.

## Veto lines offered

- **Keep God's Will beside the Crossroads**: set `COMPULSION_PREMONITION_ENABLED = true`. Asked in chat 2026-10-14 ("Replace the forced God's Will pick with the lean?").
- **Make leans weaker or stronger**: `CROSSROADS_LEAN_TOWARD_MULT`, with the two ratios retuned in the same change (the test pins them together).
