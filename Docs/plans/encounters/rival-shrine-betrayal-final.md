# Encounter Pipeline: The Broker's Ledger

> Scale: medium | Slug: rival-shrine-betrayal | Pass: final
> Date: 2026-04-04 | Pipeline version: 1.0

---

## Status: READY WITH CAVEATS

### Caveats

The encounter's core narrative and branch structure are strong. Implementation requires two new reusable primitives (branch-aware step resolution + branch-aware aftermath builder) that are needed by all future branching encounters. Two additional primitives (intelligence attachment, hidden mark) can degrade to v1 approximations.

### Primitive Disposition Summary

| Primitive | Decision | Scope | Reusable? |
|-----------|----------|-------|-----------|
| **Branch-aware step resolution** | BUILD NOW | Medium | Yes — all future branching encounters |
| **Branch-aware aftermath builder** | BUILD NOW | Small-Medium | Yes — all future branching encounters |
| **NPC role "broker"** | BUILD NOW | Trivial | Yes — information-trader encounters |
| Structured intelligence attachment | BACKLOG | Large | Yes — espionage/scouting/investigation encounters |
| Delayed-reveal hidden mark | BACKLOG | Medium-Large | Yes — concealed actions, delayed consequences |
| Follow-on encounter seeding effect | BACKLOG | Medium | Yes — every encounter with follow-on hooks |

### BUILD NOW Development Specs

Full development specs with type definitions, file locations, connection points, reuse contracts, and test strategies are in `rival-shrine-betrayal-systems.md` sections MP-3, MP-4, and MP-6.

### BACKLOG Specs

Actionable backlog entries with v1 approximations, loss analysis, target architecture, file locations, and routing are in `rival-shrine-betrayal-systems.md` sections MP-1, MP-2, and MP-5.

### Implementation File Map

**Create:**
- `src/data/encounters/rival-shrine-betrayal.ts` — encounter template with branching steps and aftermath variants
- `src/data/encounters/__tests__/rival-shrine-betrayal.test.ts`

**Modify (for reusable primitives):**
- `src/types/unifiedAction.ts` — `ActionStepBranch`, `ActionStepOrBranch`, `BranchAwareAftermathConfig`, `AftermathVariant`
- `src/engine/unifiedActionLifecycle.ts` — `resolveStepDefinition()`, `advanceStep` branching
- `src/engine/unifiedActionResolution.ts` — branch-aware aftermath assembly
- `src/types/npc.ts` — add `'broker'` to `NpcRole`

**Modify (for encounter registration):**
- `src/data/unified-action-templates.ts` — register template
- `src/data/reward-attachment-catalog.ts` — intelligence attachment (v1 flavor-text artifact)

---

## Editorial Notes Summary

**Verdict:** PASS WITH REVISIONS (3 prose changes, no structural changes)

- **Accept path pivot:** Added friction to the espionage turn — "not the way a guest remembers a host's generosity, but the way a surveyor records a claim"
- **Refuse path simile:** Trimmed overextended fire metaphor — cut "and what remains is the settling of ash"
- **Refuse path aftermath:** Full section replacement — the original was flat summary prose; the rewrite conveys the invisible sacrifice as felt experience
- **Branch count confirmed at 2.** Third branch (counter-offer) correctly cut — would have been an escape hatch that collapsed the dilemma
- **All inspiration anchors confirmed load-bearing.** Dilemma Library materially changed the choice structure.

---

## Encounter Packet

The full encounter packet with all editorial revisions applied is in `rival-shrine-betrayal-revised.md`. Key design elements:

**Premise:** A faction broker (Tessaly) offers the location of a rival god's hidden shrine. The price: a trade secret (salt-curing technique) that protects a coastal settlement's (Brinewall's) economic sovereignty.

**Two branches:**
- **Accept:** Divine realpolitik. Sit in the Harken family's curing sheds, eat their plums, record their techniques. Gain the shrine location; spend an alliance. The cost of power is someone else's livelihood.
- **Refuse:** Divine integrity. Watch Tessaly close her ledger and walk away. The shrine stays hidden. A god refused to sell a settlement and they will never know it.

**Templates:** Doctrine Split (primary) + Reveal/Contain/Displace (secondary)

**Key design decisions:**
- Third branch tested and cut: a counter-offer collapsed the dilemma by offering an escape hatch
- Outcome ladders are branch-specific (5 tiers each, different consequences)
- Aftermath reaction choices are branch-specific (2 per path, seeding different future arcs)

---

## Systems Verdict Detail

See `rival-shrine-betrayal-systems.md` for:
- Full support bundle audit (9 objects, 5 clean, 2 partial, 2 need new primitives)
- 6 missing primitives analyzed with build/backlog decisions
- Runtime feasibility analysis (linear multi-step yes, branching multi-step needs MP-3)
- Aftermath supportability matrix for both branches
- Complete implementation file map
- Full development specs for BUILD NOW primitives (type definitions, function signatures, test strategies)
- Full backlog specs for BACKLOG primitives (architecture, integration points, routing)
