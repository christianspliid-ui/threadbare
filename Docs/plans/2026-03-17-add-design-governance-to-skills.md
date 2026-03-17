# Change Spec: Add Design Governance to CLAUDE.md and Skills

> For Claude Code to apply. Three files to edit. All changes are additive.

---

## Change 1: CLAUDE.md — Add "Design Governance" section

**Insert after the "Non-Functional Priorities" section (after line 60) and before "Load-Bearing Architectural Decisions":**

```markdown
## Design Governance

Every design proposal — whether a new system, a significant extension to an existing system, or a new content pipeline — **must be architecturally compliant before the user ever sees it.**

### The design workflow (internal, not user-facing)

1. **Draft** the system design
2. **Audit** the draft against all 7 NFPs, load-bearing decisions, and the rejected approaches list
3. **Revise** the design to integrate every remediation directly into the system descriptions — constants tables, trace schemas, fail-soft tables, PRNG callouts all go inline where the system is described, not in a separate appendix
4. **Summarize** the NFP compliance as a verdict table at the end (PASS / PASS with note per priority)
5. **Present** the finished, compliant design to the user

Steps 1–4 happen in a single pass. The user should never see a design that hasn't been through this cycle. If the audit reveals a fundamental conflict with an NFP (not just a missing constant, but a structural problem), flag it as a trade-off for the user to weigh in on — don't silently ship a non-compliant design.

### Required sections in every system description

Each system within a design document must include these inline (not as a separate audit section):

- **Constants table** — every tunable number named, with default and purpose (NFP #1)
- **Tracing** — what trace types the system emits, with TypeScript interface definitions (NFP #2)
- **Fail-soft** — table of failure cases and fallback behavior (NFP #4)
- **PRNG callouts** — where seeded randomness is needed, called out at the point of use (NFP #3)

### Required summary at end of design document

An NFP Compliance Summary table with one row per priority showing PASS / PASS with note. If any row shows a genuine trade-off (not just "needs tuning"), explain it so the user can make the call.

### When reviewing an existing design

If an older plan in `Docs/plans/` lacks inline NFP compliance, add it before building from it.
```

---

## Change 2: skills/engine-architecture/SKILL.md — Add "Design Assessment for Engine Work" section

**Append after the "Key Source Paths" section (after line 83):**

```markdown
## Design Assessment for Engine Work

Before implementing any new engine system or significant engine change, verify the design document includes an NFP audit. If no audit exists, write one before coding.

### Engine-specific NFP checklist

| NFP | What to verify for engine work |
|-----|-------------------------------|
| Tunability | Every threshold, rate, cost, bonus, and cap has a named constant at module top or in a shared constants file. No inline numbers. |
| Inspectability | New phase functions emit structured traces via `emitTrace()`. Composite calculations trace each component, not just the result. New trace categories are added to the debug panel. |
| Determinism | Every branching decision uses seeded PRNG. PRNG instances are scoped per context (no shared state). Verify: same seed + same tick = same output. |
| Fail-soft | Every function has explicit fallback for missing nodes, missing properties, removed edges. Pattern: `if (!x) return []` or `return defaultValue`. Never throw. Emit trace on fallback. |
| Narrative > mechanical | When a mechanic produces a weird narrative outcome, adjust the mechanic. Don't sacrifice story coherence for elegant math. |
| Additive | New properties/fields/functions, not renames or removals. Existing tests keep passing without modification. |
| Performance | Global-tick systems (anything that processes all entities) flagged for future profiling. Use spotlight tier system for per-entity fidelity. |

### Constants convention

Group all tuning constants at the top of the module file, exported and documented:

```typescript
/** How much prosperity changes per tick, clamped to this range */
export const PROSPERITY_DELTA_CLAMP = 10;
```

### Trace convention

Every new phase or resolver emits at least one trace type. Define the trace interface alongside the implementation:

```typescript
interface ProsperityTickTrace {
  type: 'prosperity_tick';
  locationId: string;
  baseIncome: number;
  tradeBonus: number;
  disruptionPenalty: number;
  netDelta: number;
  newProsperity: number;
  tierChanged: boolean;
}
```
```

---

## Change 3: skills/content-worldbuilding/SKILL.md — Add "Design Assessment for Content & Systems" section

**Append after the "Key Files" section (after line 84):**

```markdown
## Design Assessment for Content & Systems

New game systems, content pipelines, or world-model extensions must pass an architectural assessment before implementation. This applies to economy, faction behavior, encounter sets, resource pipelines, new Reach mechanics, and any system that agents interact with.

### Content-specific NFP checklist

| NFP | What to verify for content/system work |
|-----|---------------------------------------|
| Tunability | Spawn thresholds, tier boundaries, probability weights, cost tables — all named constants. If a designer might want to tweak it, it's a constant. |
| Inspectability | New systems that modify agent state (wealth, reputation, traits) must emit traces showing the cause. "Why did this agent become wealthy?" must be answerable from traces alone. |
| Determinism | World seeding additions (new faction types, resource assignment, guild generation) use the seeded PRNG. Content selection at runtime (encounter choice, sublocation spawn) uses PRNG. |
| Fail-soft | Missing content gracefully skips — no content package should be able to crash the tick loop. Missing resources → 0 income. Missing faction → skip guild check. |
| Narrative > mechanical | Systems exist to generate stories. If a system produces mechanically correct but narratively boring outcomes, redesign the system. Encounters should read as interesting, not optimal. |
| Additive | New node properties, new edge properties, new action templates, new encounter templates — all additive. Don't remove or rename existing content that other systems reference. |
| Graph compliance | All new state lives on graph nodes (properties) or edges (properties). No parallel data structures, no separate lookup tables. The graph is the single source of truth. |

### Design document template for new game systems

When proposing a new system, include these sections **per system** (NFP compliance is inline, not a separate appendix):

1. **What it is** — plain language, one paragraph
2. **Graph representation** — which nodes, edges, properties
3. **Constants** — every tunable number named with default and purpose (NFP #1)
4. **Tick behavior** — what happens each tick (if anything)
5. **Tracing** — TypeScript trace interfaces for all emitted traces (NFP #2)
6. **Fail-soft** — table of failure cases and fallback behavior (NFP #4)
7. **Actions** — what agents can do (CRUD mapping), with PRNG callouts where needed (NFP #3)
8. **Player visibility** — how the player experiences it (prose, encounters, location changes)

At the **end of the full design document**, include:

9. **NFP Compliance Summary** — one-row-per-priority verdict table (PASS / PASS with note)
10. **Implementation phases** — ordered by dependency, each phase delivers visible value

The design is not ready to present until the compliance summary shows all PASS. If a genuine trade-off exists, flag it explicitly for the user to decide.
```

---

## Summary

Three files, all additive insertions:

| File | What's added | Where |
|------|-------------|-------|
| `CLAUDE.md` | "Design Governance" section — mandates NFP audit for all designs | After NFP list, before Load-Bearing Decisions |
| `skills/engine-architecture/SKILL.md` | Engine-specific NFP checklist, constants/trace conventions | After Key Source Paths |
| `skills/content-worldbuilding/SKILL.md` | Content/systems NFP checklist, design document template | After Key Files |

Hand to Claude Code: *"Apply the three edits in `2026-03-17-add-design-governance-to-skills.md`. All additive — no existing content modified."*
