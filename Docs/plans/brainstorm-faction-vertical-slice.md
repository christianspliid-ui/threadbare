# Brainstorm: Faction System Vertical Slice

**Date:** 2026-03-27
**Context:** Design brainstorm for a prototype faction ("Adventuring Guild") that connects faction, encounter, character, and reputation systems end-to-end. Built as a generalizable pattern for procedurally generated factions.

---

## The Prototype: Adventuring Guild

- Generalist guild, broadly focused across all reaches (not specialized)
- Other factions will be more focused: merchant guild = gold, mercenary guild = iron + gold, etc.
- The Adventuring Guild is the test case; the system must generalize

## Discovery & Joining

- **Guild halls at specific towns/cities** — physical sublocation presence
- Agents must travel to a guild hall location to join
- Joining is an encounter (not automatic)
- Creates geographic gameplay: some towns have the guild, some don't
- Generalizes: every faction type gets placed at appropriate location types

## Guild Encounters (Quest Board)

- Members get access to faction-specific encounters — the guild's "quest board"
- Quests are thematic to the Adventuring Guild: searching ruins, killing monsters, exploring wilderness, mapping unknown areas
- Quests build faction reputation (not global reputation — faction-internal)
- Great default activity for otherwise idle agents — gives them something to do
- <AI>Quest board encounters could be location encounters with a `factionRequired` prerequisite, or a new encounter source (faction encounter cache) — design decision for the plan</AI>

## Reputation & Promotion

- Doing guild quests builds faction reputation over time
- **Reputation naturally decays** if not maintained — agents who stop doing guild work lose standing
  - This creates natural turnover without needing "kick from guild" mechanics
  - Agents who wander off gradually lose rank, opening slots for active members
- When reputation hits a threshold, agent becomes **eligible** for promotion
  - Threshold makes the promotion encounter visible — it's invisible until then
  - Threshold doesn't give the promotion; it's just eligibility
- **Promotion is an encounter** with real tension:
  - Success: promotion + reward (gold, access)
  - Failure: might still get promoted but with a complication
  - <AI>Complication on partial-success could be: owe someone a favor, made an enemy of another candidate, took on a dangerous obligation, revealed a weakness</AI>
  - Interesting outcomes either way — no dead-end failure

## Faction Hierarchy

Classic hierarchy with named ranks:
1. **Leader** — top of the guild (one per guild)
2. **Lieutenants** — senior officers
3. **Sergeants** — mid-rank, proven members
4. **Journeymen** — bulk of membership, entry-level

Each rank unlocks:
- Bonuses/rewards specific to that rank
- Access to new encounters only available at that rank level
- <AI>Higher ranks could unlock: mentoring encounters, guild politics, resource access, territorial assignments, faction-wide decision participation</AI>

## Reputation Decay & Expulsion

- Reputation is the single lever — everything else follows mechanically
- As reputation drops below a rank threshold, that rank's privileges are lost automatically
  - Encounters gated to that rank disappear from candidate list
  - Bonuses from that rank stop applying
  - No explicit "demotion encounter" — just automatic loss of access
- At zero reputation = effective expulsion
  - All faction encounters disappear
  - No dramatic expulsion event needed for the Adventuring Guild — you just stopped showing up
  - `member_of` edge doesn't need immediate deletion — functionally dead, can be cleaned up lazily
- **Expulsion consequences are faction-specific data, not hardcoded logic**
  - Adventuring Guild: mild — lose quest access, that's it
  - <AI>Other factions could define harsher consequences: criminal syndicate adds "hunted by former allies" encounter, religious order imposes social stigma affecting reputation walks through former members, military guild brands you deserter</AI>
  - Same mechanic, different entries in the faction definition's consequence table

## Behavior & Identity

- Guild membership does **not** change how agents score non-guild encounters
- "It's like a job — people don't live to work"
- Guild provides encounters and reputation; agents still pursue personal goals independently
- The natural reputation decay creates pressure to stay active without forcing it
- If incentives are good enough, agents stay active; if not, they drift away naturally

## Faction-Scoped Social Encounters

- Faction members get social encounters with other faction members
- These are unlocked by shared membership
- <AI>Examples: sparring/training, guild tavern socializing, mentorship, rivalry, faction politics, coordinated missions</AI>

## Faction Network

- Each faction has its own internal social network
- The Adventuring Guild uses a classic hierarchy network
- Existing reputation walk system should benefit from shared faction membership (it already gives a faction rank trust bonus)

## Dynamic Quest Generation (Quest Board Pipeline)

- Guild quests should not be static — they drive story and should shift over time
- Three stacked influence layers on a shared template pool:

### Layer 1 — Faction type (reach preferences)
- Faction's `reachPreferences` select the eligible template pool
- Adventuring Guild: broad spread across iron, eye, stone → exploration, monster-hunting, ruin-delving, escort
- Merchant guild: gold-heavy → trade routes, negotiations, caravan guard
- Same template pool, different weights per faction

### Layer 2 — Leader priorities
- The faction leader's capabilities, ambitions, and axiological profile shift scoring within the pool
- High-Eye leader → ruin-delving and mapping quests score higher on the board
- New combat-oriented leader → monster-hunting rises to the top
- Ruthless leader → "eliminate rival agents" quests appear; merciful leader suppresses them
- Leadership change visibly shifts what the faction does — narratively powerful

### Layer 3 — Divine patronage (future scope)
- God's strategic goals add another scoring modifier
- God focused on a region → quests sending agents to that region get boosted
- God aligned with a sphere → quests related to that sphere's domain get boosted
- The Grey Swords vision: the quest board reflects the patron god's priorities

### Key insight
- All three layers use the same mechanism: weighted scoring modifiers on a shared template pool
- No special plumbing per layer — just stacked multipliers
- For the vertical slice: implement Layer 1 (faction type). Layer 2 (leader) is a natural next step. Layer 3 (divine) is future scope.

## Generalization Requirements

- Everything built for the Adventuring Guild must be data-driven, not hardcoded
- Faction definition pattern: reach preferences, location types, encounter templates, hierarchy structure, rank thresholds
- A merchant guild = gold focus, placed at markets/trade hubs, trade quests
- A mercenary guild = iron + gold, placed at forts/borders, combat quests
- Factions will eventually be procedurally generated from these patterns
- Factions will eventually come from onboarding (not just seeded)

## Divine Patronage (Future Scope)

- The god should eventually be able to sponsor/patron factions
- Expensive action — influencing a whole group of people
- Mid-to-late game capability
- Inspiration: Grey Swords from Malazan's *Memories of Ice* — a mercenary company sworn to a god, with divine patronage shaping their purpose
- "Imagine having a whole mercenary guild dedicated to your god, and you can influence what they do"
- Not in vertical slice — flag for future design

---

## Implementation Status (from codebase audit)

### Already built & working:
- Faction awareness pipeline (rank-gated encounter visibility)
- Tier promotion → faction rank bumps (automatic on domain tier crossing)
- Reputation walk with faction rank trust bonus
- Social encounter generation (14 templates, bond-aware scoring)
- Trust mechanics (asymmetric build/decay)
- Social outcome processing (trust changes, agreement edges)

### Gaps the vertical slice must close:
1. **No guild hall sublocations** — factions have no physical presence at locations
2. **No "join faction" encounter** that creates `member_of` edges — "Recruit to Faction" template exists but creates agreement edges, not membership
3. **No faction-specific quest encounters** — no quest board, no faction-gated location encounters
4. **No promotion encounters** — tier promotion bumps rank silently, no encounter with narrative tension
5. **No faction rank tiers** — just a 0.0–1.0 float, no named ranks (journeyman/sergeant/lieutenant/leader)
6. **No rank-gated encounter access** — no encounters locked behind rank thresholds
7. **No faction reputation decay** — rank only goes up (via tier promotion), never decays
8. **No faction-scoped social encounters** — social encounters generated for any visible agent, not filtered by shared membership
9. **socialOutcome.ts doesn't create member_of edges** — GraphOp for faction membership creation is missing
10. **No faction UI** — completely invisible to player (flagged in visibility spec, not started)

---

## Open Questions

- How many guild halls should the Adventuring Guild have? (tied to map size — maybe 3–5 across the world?)
- What's the minimum agent capability to be eligible to join? (low bar — the guild takes most comers)
- How fast should reputation decay? (needs to be slow enough that occasional quests maintain standing)
- Should guild quests be generated from templates or hand-authored for the prototype?
- How does the quest board interact with the existing encounter cache? (new cache entries? filtered subset? separate source?)
- Rank thresholds: what reputation values map to journeyman → sergeant → lieutenant → leader?
