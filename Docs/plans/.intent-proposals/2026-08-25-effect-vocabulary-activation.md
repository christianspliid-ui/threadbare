# Action Proposal — Effect Vocabulary Activation (THR-1239)

## intent_quote

> "please extend to all the primitives first. what does HITL stand for?"

(Christian, chat, 2026-08-25 — ruling on the scoping question raised after the activation ledger found only ~21 of the effect primitives live. Context of the ruling: the session had just reported that the dead executor family could be unlocked and asked whether generation should scope to the live subset.)

Supporting rulings from the same session, verbatim:

> "we make a general game system where spells are functional objects in the game system that expand any type of agents capabilities - first, agent, monster, faction. we could call it 'powers' or 'effects' to make it more generic, and have #spells be a variant for certain spellcaster agents.."

> "1" (selecting: run the design session for the activation plan doc next, from the offered options)

## scope (what this plan does)

Makes every member of the `AttachmentEffect` union genuinely execute on the live tick/resolution path, or consolidates it into the live mechanism that already expresses the same capability, across six sequenced executor tickets (THR-1239 → THR-1244): exhaustiveness guard + three event raises + consumable/one-shot fixes (stage 1), overlay/rule-override persistence (2), rule-key consumers (3), Group-E consolidation + reveal/suppress/tag-immunity wiring (4), aura wiring (5), condition-based damaged/healed proxy (6). It decides the embedded semantics the ledger flagged (event audience, charge spend, stacking, overlay ownership, tag namespace, choice_set classification, damage proxy).

## scope (what this plan does NOT do — explicit non-goals)

- Does not build the spell/powers system itself — no `activateSpell` caller, no `'cast'` decision family, no caster predicate. That is the map's next plan doc.
- Does not build either generator (spells THR-1232, items THR-1236 — both deliberately blocked behind this program).
- Does not add the unraised event vocabulary (`rest`, territory events, `dawn_cycle`, `attacked`/`cursed`/`blessed`/`ally_damaged`) — no source semantics exist; stays declared-and-documented.
- Does not widen effect bearers beyond agents + ascendants (faction/monster bearer semantics are map fog).
- Does not invent a per-agent damage/HP model — the damaged/healed proxy is condition-based by decision.
- Does not touch UI surfaces.

## impact_class

Reversible. Engine wiring behind existing fail-soft conventions; stage 4 deletes three zero-reference types and migrates 22 content refs, bounded by a compile-time `never` guard and the full test suite. No data loss surface; no external systems.

## evidence cited

- **Linear issue:** THR-1239 (stage 1; program THR-1239–THR-1244; map THR-1226)
- **Vision premises invoked:** systemically-alive content over hardcoded fiction; fail-soft dread world (doom/notice pricing)
- **UL terms touched:** "effect" (substrate sense preserved and disambiguated); "Power" family rides the separate UL-proposal THR-1238; tag-namespace UL entry rides stage 4
- **Canon pages consulted:** `Docs/canon/systems-inventory.md` (spell listed dormant), `Docs/canon/rulebook-quick-reference.md`; rulebook impact declared in-doc
- **Prior plan docs this builds on:** `Docs/plans/2026-03-31-generic-effect-system-design.md` (the substrate being activated), `Docs/plans/2026-07-05-autonomous-notables.md` (THR-614 activation precedent)
- **Rejected approaches considered and dismissed:** scoping generation to the 21 live primitives (overruled by the director's verbatim ruling); "add getReactiveTrigger rows" (factually wrong — corrected by the ledger); preserving every spelling as its own executor (consolidation chosen, decide-and-invite-veto standing); overlays on graph nodes (transient rule-state, GameState chosen); per-step entered_hex; real HP damage model. All recorded in the brainstorm companion.

## load-bearing decisions touched

- "Everything is a graph node/edge" — respected with a deliberate, argued exception: overlays/overrides are transient tick-scoped rule-state on GameState, mirroring the existing `pendingHexMutations` pattern; no relationships are encoded as property fields.
- "No inventing node types without verification" / "New node types require full design" — satisfied by adding zero node/edge types.
- "The world graph is mutated in place — version counters" — overlay apply/expire calls `touchWorld()`, movement-affecting overlays `touchStructure()`.
- "Engine caches per session" — no module-scope state added.

## high-impact files touched (from Codesight)

- `src/types/gameState.ts` — 345 importers (stage 2, additive fields only). Blast Radius section present in the plan doc.

## kill criteria

If stage 1's exit criterion (deterministic reactive fire on hex arrival, seed 42 medium, visible in traces) cannot be met without touching the encounter pipeline's hot path, the event-raise placement is wrong — stop, re-open placement as a map decision ticket rather than forcing it. If stage 4's migration turns up a dynamic (string-keyed) consumer of a retired type that fail-soft masks, halt the retirement half and keep the type until the consumer is mapped. If tick-time regresses measurably (>10% on the 30-tick medium smoke) after stage 2, the overlay drain is misplaced — profile before proceeding to stage 3.

## explicit user sign-off

Not required (Reversible). The program itself is the director's verbatim instruction ("please extend to all the primitives first"); the capability-vs-spelling reading was offered decide-and-invite-veto in chat on 2026-08-25 and not vetoed through several subsequent exchanges, and is restated prominently in the plan doc and on the map for continued veto opportunity.

## author notes for the judge

The one genuinely judgment-laden move is stage 4's consolidation: the director said "all the primitives," and this plan reads that as "all the capabilities" — retiring three zero-reference spellings and migrating six content-bearing ones onto live mechanisms. The reading was surfaced to the director explicitly (with the escalation from the ledger: "does extend-to-all mean every capability live with duplicate spellings consolidated, or every spelling preserved?") and proceeded on the recommended reading without objection across an active conversation. If you score this a GAP, the correct remedy is a one-question confirmation to the director, not a rewrite. Second uncertainty: `OVERLAY_DEFAULT_DURATION_TICKS`, aura constants, and the stacking cap are first-guess numbers; the map explicitly holds the balance envelope as fog pending the generator prototype — the constants exist to be tuned, per NFP #1.
