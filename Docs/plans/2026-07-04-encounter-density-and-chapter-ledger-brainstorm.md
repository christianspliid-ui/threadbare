# Brainstorm companion — Encounter density vision & Chapter Ledger (THR-603)

*Written alongside `2026-07-04-encounter-density-and-chapter-ledger.md`, same pass.*

## The dialogue that produced this

The user challenged the manual's "three to six encounters per session" line: a 200+ tick game should not have only three encounters; encounters flesh out the world and are the payoff of player action. Investigation found the line was a Vision *suspicion* (per-sitting, not per-run) hardened into manual doctrine — but the user's deeper point survived the correction: the doc's normative stance should be about density the player shapes, not a ration.

First proposal (Cowork): a doom-coupled density **ramp** (sparse early → dense at climax). User verdict: *don't take the ramp too literally* — the player largely chooses density by weaving threads and manipulating the world. The real ask: **help the player manage many encounters and the cognitive load** — all encounters, with all done/active steps, always fully readable and easily navigable. The ramp survives as a gentle lean; the ledger became the centerpiece.

## Alternatives considered and dismissed

1. **Raise `RESOLVED_ACTION_RETENTION_TICKS` to ∞** — rejected. `UnifiedAction` is heavyweight and iterated by per-tick systems (KPI counters already note the pruning); unbounded retention bloats every scan. Compact snapshot records decouple readability from engine retention.
2. **Reconstruct chapters from graph event nodes (THR-143)** — rejected for v1. Event nodes don't carry step prose; re-enriching on demand ≠ what the player originally read (enrichment is context-dependent). Kept as a bridge (`eventNodeId`) for future graph-side queries.
3. **Hard curation budget per doom phase** (encounters/N ticks quota) — rejected. Contradicts the settled no-suppression stance and the user's player-authored-density verdict; a quota would throttle player-provoked encounters. A bias multiplier on curator generosity leans without capping.
4. **Journey-beat redistribution (1/4/1/1/1 → back-loaded)** — deliberately left out. Beats for The First are Ascendant Beats — Divine Cadence territory; folding it in here would mutex the two projects. Logged as an observation in the handoff comment instead: current beat density *thins* in the final 30% of a run, which sits oddly next to the new density vision. That project should own the retune.
5. **New graph node type `ChapterNode`** — rejected. The archive is a UI-facing narrative record (chronicle/digest precedent), not a relational entity; relationships already live on event nodes. Creating a node type would also trip the "no new node types without full design" gate for no traversal benefit.

## Tensions surfaced

- **Cadence vs. curve.** Vision 01-core-loop explicitly rejects pacing curves ("Threadbearer is not a protagonist-led story"). Resolution: the ramp is *world-pressure* (doom), not protagonist arc; cadence language is retained but scoped to texture-between-emphases. The Vision edit makes this explicit rather than leaving the contradiction latent.
- **One-story-at-a-time vs. many concurrent encounters.** The Vision's "one complex story front-of-stage" discipline could be read against a ledger full of parallel chapters. Resolution: the discipline governs *framing* (what the camera does), not *bookkeeping* (what the player may consult). The ledger is a bookshelf, not a stage — it never interrupts; it waits to be opened.
- **Dashboard risk.** The Vision warns against Threadbearer collapsing into a dashboard. The ledger is deliberately a *reading* surface (prose-first, narrative lexicon, no numbers) rather than a status grid. Row metadata is minimal; the payload is the chapter prose.

## Vision premises invoked

- `Vision/01-core-loop.md` — encounter-as-chapter, scan-as-triage, cadence (edited by this plan, deliberately).
- `feedback_prose_first_ui` — ledger renders narrative lexicon, never raw numbers.
- `feedback_god_not_protagonist` — choiceHistory rendered as god-verbs ("you whispered"), not character choices.
- Rule 4 (every primitive clickable) — chapter participants link to profiles.
- 2026-05-07 no-visibility-gating direction — extended from candidates to records.

## Open threads deliberately NOT parked in the doc

Per `feedback_no_questions_in_docs`, resolved in chat or excluded from scope:
- Session stopping-point signaling — remains the rulebook's open question; untouched by this plan.
- Ramp tuning values — shipped as constants with a "ship at 1.0 if contested" executor note; tuning is a follow-up with KPI evidence, not a design question.
