# Placeholder Attachments on Seed Agents

**Date:** 2026-03-16
**Status:** Ready for implementation
**Scope:** Wire existing starter attachment nodes to seed agents so attachments are visible in the running game. No new content — just edges connecting existing nodes.
**Purpose:** Let us see how attachments look in the UI before building the detail card components.

---

## Context

`src/data/starter-attachments.ts` exports `STARTER_POSSESSIONS` (10 artifact nodes) and `STARTER_CONDITIONS` (4 trait nodes). These are fully authored with tiers, tags, modifiers, on-use triggers, and flavor text — but they're only used in tests. No agent in a running game currently has any attachments.

Seed agents are created dynamically in `src/engine/worldSeed.ts` with IDs like `ind_0`..`ind_N` (8-12 individuals) and `faction_0`..`faction_N` (2-3 factions).

---

## What To Do

### 1. Add attachment nodes to the graph during world seeding

In `worldSeed.ts` (or a new `seedAttachments.ts` called from `worldSeed.ts`):

- Import `STARTER_POSSESSIONS` and `STARTER_CONDITIONS` from `src/data/starter-attachments.ts`
- Add all starter possession and condition nodes to the graph (same as how other nodes are added)
- **Don't add them to every agent** — distribute them to make it look natural

### 2. Create edges connecting specific agents to specific attachments

Use deterministic assignment (seeded PRNG or fixed mapping) so it's reproducible. Suggested distribution:

**Agent `ind_0` — well-equipped warrior type:**
- `possesses` → `starter_iron_blade` (modifiers: `{ iron: 0.10 }`)
- `possesses` → `starter_traveler_cloak` (modifiers: `{ star: 0.05 }`)
- `has_trait` → `starter_bruised_ribs` (ticksRemaining: 12, totalTicks: 20)

**Agent `ind_1` — mounted scout:**
- `possesses` → `starter_ashenmane_horse` (modifiers: `{ iron: 0.10 }`, grants: `['cavalry_charge', 'rapid_retreat']`)
- `has_trait` → `starter_sun_touched` (ticksRemaining: 8, totalTicks: 15)

**Agent `ind_2` — scholar/mystic:**
- `possesses` → `starter_burned_codex` (modifiers: `{ eye: 0.10, veil: 0.05 }`)
- `possesses` → `starter_whispering_eye` (modifiers: `{ veil: 0.15, eye: 0.10 }`)
- `has_trait` → `starter_revelation` (ticksRemaining: 15, totalTicks: 20)

**Agent `ind_3` — plague-touched traveler:**
- `possesses` → `starter_road_worn_mule` (modifiers: `{ iron: 0.03 }`)
- `possesses` → `starter_copper_market_rations` (modifiers: `{ flesh: 0.05 }`)
- `has_trait` → `starter_plague_touched` (ticksRemaining: 25, totalTicks: 40)

**Agent `ind_4` — elite with a named weapon:**
- `bonded_to` → `starter_ashenmane_fang` (modifiers: `{ iron: 0.15 }`, grants: `['intimidate']`)

**Remaining agents (`ind_5`+):** No attachments. It's fine and expected for most agents to carry nothing.

### 3. Edge ID convention

Use the pattern: `seed.{agentId}.{edgeType}.{attachmentId}`

Examples:
- `seed.ind_0.possesses.starter_iron_blade`
- `seed.ind_2.has_trait.starter_revelation`
- `seed.ind_4.bonded_to.starter_ashenmane_fang`

### 4. Edge properties

**For `possesses` / `bonded_to` edges:**
```ts
{
  modifiers: { /* from starter data */ },
  grants: [ /* from starter data */ ],
  tags: [ /* from starter data */ ],
}
```

**For `has_trait` edges (conditions):**
```ts
{
  level: 1,
  acquiredTick: 0,
  ticksRemaining: /* varies per assignment — see distribution above */,
  source: 'World seed',
  modifiers: { /* from starter condition's domainContributions */ },
}
```

Copy the modifier values from the starter node definitions — they're already authored in `starter-attachments.ts`.

### 5. Guard against missing agents

Seed agent count is random (8-12 individuals). Guard assignments with existence checks:

```ts
if (graph.getNode('ind_0')) {
  // add attachments for ind_0
}
```

Or loop through available agents and assign from a pool.

---

## Tests

Add a test file `src/engine/__tests__/seedAttachments.test.ts`:

- Seed world → verify attachment nodes exist in graph
- Verify expected agents have `possesses`/`bonded_to`/`has_trait` edges to attachment nodes
- Verify edge properties include correct modifiers and ticksRemaining
- Verify agents without attachments have no attachment edges
- Verify `has_trait` edges for conditions include `ticksRemaining` and `acquiredTick`

---

## Files to modify

| File | Change |
|------|--------|
| `src/engine/worldSeed.ts` | Import and call attachment seeding (or extract to new file) |
| New: `src/engine/seedAttachments.ts` | Function that adds nodes + edges (optional — can inline in worldSeed) |
| New: `src/engine/__tests__/seedAttachments.test.ts` | Tests |

---

## What NOT to do

- Don't build UI components yet — this is just data wiring
- Don't modify `starter-attachments.ts` — the content is already correct
- Don't add attachments to every agent — sparse distribution looks more realistic
- Don't randomize which agent gets what (for now) — fixed mapping is easier to test and debug
