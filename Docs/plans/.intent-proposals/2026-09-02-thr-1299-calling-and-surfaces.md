# Action Proposal — The calling & the surfaces (THR-1299)

## intent_quote

> "ready for dev is almost empty. lets promote some design" (Christian, chat, 2026-09-02 — the session directive under which this design session runs)

Ticket-level intent (orchestrator-filed design-session ticket, quoting the map carve-up verbatim):

> "**The calling & the surfaces** (UI + Engine) — calling derivation (ambition-weighted, telemetry-verified change rate), the follow affordance on arc panel + encounter UI, moment cards with the Inspire/Sabotage action slot and scapegoat provenance chips, interrupt collation, works/holdings on the character sheet, ambition NAME+flavor, chronicle chain rendering, census small-items (bridge subtype, named-calendar build-or-drop, per-agent chronicle surface). **Binds the UI Laws.**"

Settled decision inputs quoted inline in the plan doc: THR-1279 verdicts 1–7 + the 2026-08-26 amendment (player-conferred follow, interrupt classes, foundings-badge), THR-1281 §7b (derived calling: reach pair × ambition × personality, hysteresis, change = chronicle moment, open-ended naming table), THR-1282 §6 (provenance chips, chain-as-a-line), review record §2.1/§3 rows + Appendix C C1/S5/M1/M3/M4.

## scope (what this plan does)

Surfaces the already-shipped undertaking moment stream to the player: follow/mute state with a single-writer module and affordances on the arc panel (JourneyTab) and encounter UI; a moment queue consumed by a MomentCard interrupt (encounter chrome, Inspire/Sabotage action slot, Law-56 chips, divine-provenance chip) and a fourth-family badge; three emission defects fixed (completion gate, dead `started` branch, chronicle significance); the derived calling (new engine module + content naming table + atomic presentation swap off BehaviorFamily); JourneyTab rebuilt as the arc panel (undertaking card, AMBITION name+flavor, arc-so-far strip); Freehold label correction; `bridge` subtype; debug accessors + missing declarations. Closes the 🔴 LEAKED `undertaking-checkpoint-events` contract and folds THR-1293.

## scope (what this plan does NOT do — explicit non-goals)

- No nudge cards on moment cards beyond hosting the two existing divine verbs (nudge-card moments are future work; foundings badge until then, per ruling).
- No mechanical retirement of `BehaviorFamily` enum/template fields — presentation layer only; the enum's retirement is docs 4/6 template-conversion ground.
- No named-calendar system — dropped for v1 with a veto invitation (relative-time prose instead).
- No ascendant-bar freehold row — dropped for v1 (Law 53), veto invited.
- No toast tier for moments — ruling 2.1 is interrupt/badge only.
- No new graph node or edge types; no changes to court-position/thread semantics.
- No god-directed grievance surfaces (out of scope per THR-1282 §6's recorded charter).
- Does not implement doc 4 (THR-1298) — it renders doc 4's provenance when that lands; sequencing preference recorded.

## impact_class

Reversible — docs-only session output (a plan doc); the planned implementation is additive engine/UI work behind optional fields, with one atomic presentation swap explicitly sliced and fallback-mapped.

## evidence cited

- **Linear issue:** THR-1299 (+ THR-1293 folded; THR-1279/1281/1282 as settled inputs)
- **Vision premises invoked:** north star (follow an agent's story), god-not-protagonist, prose-never-numbers
- **UL terms touched:** *Undertaking*, *Work*, *Freehold* (existing — the Freehold arbitration THR-1314 is enforced on the sheet label); NEW: *Calling*, *Moment*, *Follow* → UL-proposal filed at handoff
- **Canon pages consulted:** `Docs/canon/process.md`, `Docs/canon/rulebook-quick-reference.md`, `Docs/canon/systems-inventory.md`, `Docs/canon/encounters.md`, `Docs/canon/interface-map.md`, `Docs/design-system/laws.md`
- **Prior plan docs this builds on:** `2026-08-26-thr-1292-undertaking-substrate.md` (presentation resolver, followedAgentIds), `2026-08-27-thr-1297-action-library-works-holdings-naming.md` (holdings, naming, Law-56 declaration seam), `2026-08-27-thr-1296-the-binder.md` (complication names the loss), `2026-09-01-thr-1298-reactive-loop.md` (mortal provenance)
- **Rejected approaches considered and dismissed:** toast tier for moments; follow-on-thread-edge; per-tick calling recompute; digest-buffer arc; calendar build — all in the brainstorm companion with reasons

## load-bearing decisions touched

- "Relationships are edges, not property fields" — respected and argued: the calling is node-internal derived data (no traversal consumer), follow/mute are GameState arrays precisely to avoid overloading the `thread` edge.
- "No inventing node types" — none invented.
- "Graph mutated in place / version counters" — no new UI selectors keyed on graph identity; new surfaces read via `agentDetail.ts` read-models and GameState arrays.
- Viewport contract — all new surfaces are Modal/panel work inside the existing registry; Playwright named as the verify tool.

## high-impact files touched (from Codesight)

`src/types/gameState.ts`, `src/types/trace.ts`, `src/types/strategicAction.ts` (each ≥100 importers; all additive optional) — Blast Radius section present in the plan doc. `GameView.tsx` edit is the registry's own prescribed two-line pattern.

## kill criteria

If 300-tick/2-seed telemetry cannot tune the calling into the narratable band (no agent >3 changes/100 ticks AND ≥1 change in a population with completed undertakings), the calling ships as a static derived title with the change event disabled behind its significance constant, recorded in the closeout — not silently, and not by shipping a flickering title.

## explicit user sign-off

Not required — Reversible class. Two deliberate drops (calendar, bar row) and one population tightening inherited from doc 4's pattern ride the handoff as veto invitations.

## author notes for the judge

- The heaviest uncertainty is the calling naming table's quality (M3's "clunkers" risk is about work names, but the same lexicon risk applies to titles); the table is content, iterable post-ship, and the fallback title keeps it fail-soft.
- The interrupt arm is unreachable in CLI worlds (no thread edges) — the Done-when gates on a constructed browser proof with debug follow levers, mirroring THR-1293's own measurement. An organic-trace Done-when here would be vacuous.
- Sequencing: mutex with THR-1298's executor on five shared files; preference to land after it. If the judge reads the arc-strip provenance line as depending on doc 4, that is correct — it renders when doc 4 lands, and renders nothing (fail-soft) before.
- The "26 objects / 13 gaps" census the ticket cites lives in THR-1279's resolution comment, not the audit file — the three *new* findings (bridge, calendar, arc strip) are each dispositioned in the plan.
