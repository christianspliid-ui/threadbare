# Brainstorm: Universal Sphere Affinity System

> Captured 2026-03-28 from Cowork design session. Rethinks M1 World-Soul from global abstract weights to entity-local sphere scores.

## The Core Idea

Sphere affinity is a **per-entity property**, not a global abstract number. Every entity in the world tracks its relationship to all 8 creation spheres as integer scores on the triangle number scale. The global World-Soul state is the **emergent aggregate** of all entity scores — you read the map, you don't write to a global variable.

## What Tracks Sphere Affinity

Everything that exists in the world:
- Hexes (the land itself)
- Agents (people)
- Artifacts
- Locations (settlements, ruins, landmarks)
- Factions
- Armies (future — M2)
- NPCs (future — TB-069)
- Monsters (future — M2.5)

- Cultures

All use the same data structure. All follow the same rules.

**Does NOT apply to:** conditions, basic attachments (horses, rations, mundane equipment). Only entities with identity and agency in the world track sphere affinity.

## The Triangle Number Scale

Each sphere score uses the 1+2+3+4+... scale — each level costs more than the last to reach:
- Level 0 → 1 = 1 point of investment
- Level 1 → 2 = 3 total
- Level 2 → 3 = 6 total
- Level 3 → 4 = 10 total
- Level 4 → 5 = 15 total
- Level 5 → 6 = 21 total

Higher levels are dramatically harder to reach and harder to erode. A deeply invested entity resists change.

## Homeostasis Model

The World-Soul seeks balance. Key principles:
- No opposition echo on actions — boosting Force does NOT directly penalize Energy
- Equilibrium drift pulls all entities back toward their natural state over time
- The harder you push, the harder the system pushes back (triangle scale resistance)
- Sustained pressure required to create permanent change
- If you stop pushing, the world slowly heals

"Interesting complex adaptive systems seek homeostasis. The cycle is about pushing as hard as you can."

## Permanent Score and Pressure Threshold

Each entity has a **permanent sphere score** that takes time under pressure to change.

- An entity's permanent score acts as a **buffer/threshold** against opposing sphere pressure
- If incoming opposing pressure in a tick ≤ permanent score → entity absorbs it, bounces back
- If incoming pressure exceeds permanent score → permanent score erodes by the excess
- Example: Life 5 hex hit by Entropy 6 in one tick → Life drops to 4
- Life 4 is now more vulnerable to the next assault

## Opposition Pairs Cancel

The 4 opposition pairs from cosmology.ts:
- Force ↔ Energy
- Life ↔ Entropy
- Mind ↔ Time
- Spirit ↔ Matter

Incoming pressures from opposed spheres cancel each other before comparing against permanent score.
- 4 Life pressure + 6 Entropy pressure in same tick → net 2 Entropy
- Net Entropy (2) compared against hex's Life permanent score (5) → absorbed, no damage

## Two Types of Sphere Actions

1. **One-time actions** (create/destroy verbs) — deliver a burst of sphere pressure in a single tick
2. **Sustained control effects** — expensive, feed sphere energy every tick. Like opening a gate to an entropic plane that vomits undead every round. Costs essence per tick but keeps constant pressure on the area.

## Siege Dynamics

- Can't flip a location's sphere alignment in one big action
- Must sustain pressure over time, grinding down the permanent score
- Defender has a window to intervene before permanent damage
- Once erosion starts it accelerates — score drops, threshold drops, more vulnerable

## Defense Has Value

- A Life 5 grove is safe as long as incoming entropy stays ≤ 5 per tick
- Player can station protective control effects to counterbalance incoming pressure
- Deeply attuned entities stabilize their surroundings

## Recovery Is Hard

- Once permanent score drops (Life 5 → Life 4), it doesn't heal back on its own
- Need constructive pressure to rebuild — sustained Life actions over time
- Homeostasis keeps it at the new level unless someone actively invests in restoration

<AI>Open question: does the equilibrium drift (homeostasis) pull toward the *current* permanent score or toward some deeper "natural" baseline? If a hex starts as Life 5 and gets eroded to Life 3, does it drift back toward 5 over a long time, or is 3 the new normal?</AI>

## Entities Shape Each Other

- A deeply Life-attuned agent walking through entropy-heavy land is under pressure — the environment pushes against their Life nature
- If pressure exceeds their score, their affinity erodes (corruption)
- Conversely, deeply attuned entities stabilize the area they're in — they're walking buffers
- Factions full of Force-aligned agents make their territory more Force-dominant by existing
- The world and its inhabitants shape each other

## Global World-Soul = Aggregate

The "global sphere balance" is computed by aggregating all entity scores across the map. No separate global register needed.

<AI>Implementation options for aggregation: (a) sum all hex scores (hexes are the primary geography), (b) weighted sum including agents/locations/factions (agents carry less weight than hexes), (c) compute on demand vs. cache and update incrementally. Option (b) with caching seems most practical.</AI>

## Allied Spheres

Force↔Matter, Energy↔Life, Mind↔Spirit, Time↔Entropy are ally pairs.

Open question: do allied sphere pressures reinforce each other for defense?
- e.g., hex with Force 3 and Matter 2 — does incoming Spirit (Matter's opposite) have to overcome both?

<AI>Three options: (a) each sphere defends only itself, (b) allied spheres contribute partial defense (e.g., 50% of ally score), (c) allied spheres fully stack. Option (b) adds strategic depth without making allied hexes impregnable.</AI>

## Building Up (Construction)

Open question: how does constructive building work?
- To push a hex's Life from 3 to 4, do you need to deliver enough Life pressure in a single tick to reach the next triangle threshold?
- Or is it cumulative — 1 point per tick slowly fills a progress bar?

<AI>Single-tick-threshold makes building dramatic but hard. Cumulative makes it a slow patient investment. Cumulative feels more consistent with the "sustained pressure" theme — same model for both construction and destruction.</AI>

## Multiple Spheres Per Entity

All entities track values for all 8 spheres. Most will have a few non-zero scores. Opposition pairs naturally cancel, so extreme opposition combos are rare but not impossible.

## Architectural Implications

- The existing `FundamentState` with global `sphereWeights` may need to become per-entity
- Or: per-entity sphere scores are a new data structure, and the global FundamentState is a derived/cached aggregate
- Foundation axes (chaos↔order, light↔darkness) — unclear if these become per-entity too or remain global-only

<AI>Foundation axes feel more "cosmic weather" than entity-local. Suggest keeping them as global-only derived from aggregate state, while the 8 creation sphere scores are per-entity.</AI>

## Magic = Sphere Fluency

Magic is not a separate system. A "mage" is just an agent with a trait that lets them manipulate a certain sphere in an area. Their power scales with three sphere scores, all using the same data structure:

1. **Caster's personal sphere score** — their depth of attunement
2. **Location's sphere score** — the land's ambient sphere energy
3. **Target's sphere score** — what they're working with or against

A Life 4 healer on Life 5 land healing a Life 2 agent is incredibly potent — personal affinity and environment both support the work. That same healer on Entropy 5 land is fighting the environment — the land's opposing force cancels much of their power.

Implications:
- Geography is strategically crucial for magic — mages want to operate on favorable terrain
- Before assaulting an Entropy stronghold, soften the land's Entropy with sustained Life control effects first, then send in the Life mages
- Widespread active Spirit mages reinforce Spirit in the hexes they operate from, making future Spirit magic stronger there — magic shapes the world, the world shapes magic
- No spell lists, no mana pools, no separate magic system — just spheres all the way down
- A "spell" is just applying sphere pressure through a personal trait/capability
- Power naturally scales — higher sphere scores unlock more dramatic effects
- The triangle number scale means elite mages (sphere 5+) are extremely rare and powerful

### Overchannel

A caster can channel MORE sphere energy than their personal score — drawing on the full power of the location — but the excess damages them. The overchannel amount (location power drawn minus personal score) is applied as sphere pressure against the caster's own permanent score, using the standard pressure/threshold rules.

Example: A Life 2 healer on Life 8 sacred ground channels the full 8. The 6 excess is pressure against their own Life 2 — absorbs 2, permanently erodes to Life 0, with 4 overflow (bleeds into wound traits or allied sphere erosion).

This creates extraordinary narrative moments:
- A desperate priest channeling the full force of a sacred grove to hold back an entropic onslaught, knowing it will burn out their connection to Life forever
- A young mage with deep Spirit but low personal power, sacrificing their attunement to seal a breach they have no business being powerful enough to close
- A faction's champion deliberately overchannel-destroying themselves to save a besieged hex

Trait design space:
- "Conduit" trait — raises overchannel threshold (can safely channel more than base score)
- "Glass Cannon" archetype — low personal scores but trait-enabled overchannel specialization
- "Martyr's Path" — agents who actively seek overchannel situations as transcendence

The overchannel decision is always the agent's (or player's via divine intervention). The game never forces it. This makes it a genuine sacrifice with narrative weight.

### Magic Formula (Revised)

Effective sphere power = `caster_score + location_contribution - location_opposition`

- **Location contribution** = location's matching sphere score (NO cap — caster can draw the full amount)
- **Location opposition** = location's opposing sphere score (actively weakens the caster)
- **Overchannel cost** = max(0, location_contribution_used - caster_score) applied as self-pressure
- **Target interaction** = target's matching sphere score acts as defense threshold (standard pressure model)

So: effective power delivered = effective_power - target_defense. Positive remainder = successful sphere action.

Geography is crucial: operate on favorable terrain, soften enemy terrain before sending mages in, and protect your ley lines.

### Reaches × Spheres

Magic through spheres is the "how" (energy source), Reaches are the "what" (domain of application). A Force mage in the Iron Reach uses Force to fight. A Force mage in the Gold Reach uses Force to intimidate merchants, break open vaults. The Reach determines the application, the sphere determines the power.

Open questions:
- Can casters draw from allied spheres? (Force mage on Matter-rich land)
- Exact overchannel overflow rules — does excess beyond zero erode allied spheres, or manifest as wound/corruption traits?
- Do some agents have traits that prevent overchannel (self-preservation instinct)?

## IPK / Prose-First Communication

All of this is communicated through prose, not numbers. The player sees:
- "The deep currents of **Life** run strong through Thornvale's roots" (Life 5)
- "Something dark gnaws at the edges" (incoming Entropy exceeding threshold)
- "The land's strength falters with each passing season" (permanent score eroding)

Sphere keywords are IPK-styled (bold, underlined, sphere-colored, tooltippable).
Full spec: `Docs/ui-patterns.md § 19. Interactive Prose Keywords (IPK)`

## Resolved Design Questions

- **Allied sphere defense:** Partial contribution — allied sphere scores contribute 50% (rounded down) to defense against their ally's opposite. Force 4 + Matter 2 facing Energy has effective defense 4 + 1 = 5.
- **Construction model:** Cumulative progress toward next triangle threshold. To push Life from 3→4 costs 4 pressure delivered over however many ticks. Same patience model as destruction. You can see building coming and try to disrupt it.
- **Foundation axes:** Global-only, derived from aggregate. Cosmic weather — felt everywhere, controlled nowhere directly. Keeps per-entity system focused on 8 creation spheres.
- **Presence vs permanent influence:** Agent presence creates temporary local buffer (walking shield). Permanent change requires intentional sphere actions (one-time or sustained). Prevents spiraling from agent movement, but deploying a strong Life agent gives immediate temporary protection.
- **Starting state:** Hexes from terrain type during worldgen (forests→Life, mountains→Matter, volcanic→Force/Entropy). Agents from archetype + sphere alignment. Locations inherit hex + type bias (temple of Force starts with Force). Factions derive from constituent agents.
- **Magic overchannel:** No cap on channeling location power. Excess beyond personal score damages the caster permanently (standard pressure rules). Creates sacrifice narrative moments. Traits like "Conduit" can raise safe channeling threshold.

## Remaining Open Questions

- Overchannel overflow: does excess beyond zero erode allied spheres or manifest as wound/corruption traits?
- Can casters draw from allied spheres? (Force mage on Matter-rich land)
- Do some agents have self-preservation traits that prevent overchannel?
- How does per-entity sphere affinity interact with existing `sphereWeights` on `FundamentState`? Replace, wrap, or derive?
- Equilibrium drift target: does it pull toward current permanent score or a deeper "natural" baseline?
