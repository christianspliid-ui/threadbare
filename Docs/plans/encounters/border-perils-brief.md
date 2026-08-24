# Batch brief — border-perils (6 encounters)

**Drafted:** Claude (attended session), 2026-08-24 · **Approved:** Christian, chat, 2026-08-24 (approval ratifies new-authoring-first ordering; retrofit is batch 2)

**Pilot-batch note:** this is the Encounter Factory's pilot batch (THR-1043 item 6). Ruling 8
named the 15-encounter retrofit as the pilot volume; this brief proposes **new authoring
first** — the full line (brief → draft → critics → gates → proof) is only proven by drafting,
which a retrofit skips, and the map-close requirements (combat, grants/costs, fate-branching)
are all new content. The camp-seven retrofit runs as batch 2 through the same gates.
Christian's approval of this brief ratifies that ordering.

## Why this batch

The corpus is 21 encounters of road and camp. Nowhere in it does anyone fight — no
nudge-native combat exists — and almost nowhere does the player enter a built or broken
place: no ruin, no stronghold, no battlefield opening in the shipped set. Three engine
layers ship with zero content users: the grants/costs card channels (THR-885), fate-branching
(`poleLean`/`branchOnStep`), and the quintessence choice-reach. The player today is only ever
mildly inconvenienced by the world. This batch gives the world teeth: encounters on
dangerous ground where the threat can hurt, cost, and follow you home.

## Family and setting envelope

- **Family:** `encounter.border.*`
- **Setting classes:** `wayside`, `ruin`, `battlefield`, `stronghold` — one opening each, per encounter
- **Excluded:** `urban`, `rural`, `sacred`, `arcane` — civic and devotional ground belongs to a
  later batch; keeping this one on dangerous ground keeps the tonal envelope coherent.

## Variance targets

| Axis | Target across the batch |
|---|---|
| Reach spread | All six lead-step reaches distinct; batch includes `iron` (combat), `veil` (one user in the corpus today), and ≥1 `quintessence`-reach step (zero users today); no reach more than twice across all steps |
| Decision shapes | ≥4 of 5 shapes (single test / consequence chain / fork / opt-in / sequel); ≥1 fork resolved by **fate-branching** (`poleLean`/`branchOnStep` — zero users today, this is its content debut); ≥1 sequel pair (seed + payoff both in-batch) |
| Tone | At most two resolve grim; a combat encounter is not automatically the grim one |
| Step counts | Two 1-step, three 2-step, one 3-step |

## Systems quota targets

Contract floor is 3 (`COMPOSITION_SYSTEMS_QUOTA_MIN`).

- **Reach for:** the **grants/costs card channels** (THR-885 — zero users; ≥2 encounters author
  cards with real cost channels and grants), faction standing (`reputation_with` — currently
  concentrated in two slice templates), `bond_change` / reified relationships, capability
  `growth` (one user: the exemplar), `quintessence_shift`.
- **Avoid defaulting to:** the uniform `trait` + `reputation_tally` + `condition_attachment` +
  `encounter_seed` + `hidden_mark` stack — company-drama applies it identically to all four of
  its templates, and it is the corpus's reflex. `hidden_mark` only where the fiction earns it.

## Anchors this batch intends to touch

| Anchor kind | Target across the batch |
|---|---|
| `faction` | ≥2 encounters leave a standing change with the faction that holds the ground |
| `relationship` (reified bond) | ≥1 encounter mints one |
| `location` / `sublocation` | ≥2 chips anchor the place itself — the ruin, the ford, the fort — not only people |
| `artifact` | ≥1 spawn or grant |

**Avoid defaulting to:** `individual` agents as the only anchor kind — the corpus's habit.

## Over-exposed cards

`cardPlayTally` telemetry has no data because **zero authored templates set `libraryCardId`**
(verified corpus-wide, 2026-08-24) — every authored card is a one-off invisible to the tally
and to the echo-card system. Proxy census from `// Type:` authoring comments (91 of 151
authored cards annotated, so counts are floors):

| Card type | Times authored | Instruction |
|---|---|---|
| `boost` | 80 (~88% of annotated) | **≤2 per hand**; per hand ≥3 distinct card types |
| `side_bet`, `long_game`, `signature`, `stumble`, `cache`, `veil`, `favor`, `compulsion` | 0 each | batch uses **≥3 of these eight**; ≥8 of the 21 types across the batch |
| all others | ≤2 each | free |

**Additionally:** every authored card that matches a library member **sets `libraryCardId`**,
so the tally, twilight harvest, and echo card finally receive data. A card genuinely outside
the library stays a one-off — but that is a choice, not the default.

## Out of scope

- War/army mechanics — a combat encounter is fiction with stakes and an `iron` test, not the
  battle simulator; hub-map territory.
- Nudge pricing / essence balance (standing rule: placeholder prices).
- The 15-encounter retrofit (batch 2) and urban/civic/devotional content (later batches).
- Any change to card library membership — the batch uses the 37 members that exist.
