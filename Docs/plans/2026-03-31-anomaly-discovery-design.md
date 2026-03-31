# Anomaly Discovery System Design

> Date: 2026-03-31
> Scope: Anomaly discovery encounters, rare resources, reward traits, attachments, conditions
> Status: Approved — all grey areas resolved via interview

## Context

10 natural anomaly location types are seeded as hidden, discoverable via Eye/Veil exploration. When an agent discovers one, a themed encounter fires. On success the rare resource is seeded on the location. On critical success, the discovering agent also gets a unique personal reward.

## Design Decisions (from interview)

- **Resource always on success**, personal reward on crit only
- **Failure = stays hidden**, retry later (same or different agent)
- **First discoverer only** — once revealed, no more discovery encounters
- **Star Metal** replaces raw_iron (meteoric iron, force + spirit)
- **3-step encounters** for vault, cavern, treasury (extraction complication step 3). Rest are 2-step.
- **Eye + Veil agents seek shimmers** — agents with high Eye or Veil reach gravitate toward anomaly hexes
- **Mixed blessing conditions** — trade-offs, not pure negative
- **Each anomaly has 1 unique signature artifact** — iconic, collectible

## New Rare Resources (10 types)

Extend the 8 common resources. Rare resources are lower base quantity, most non-renewable, only at anomaly locations.

| ID | Name | Anomaly Source | Base Qty | Spheres | Renewable | Rate | Description |
|---|---|---|---|---|---|---|---|
| gemstones | Gemstones | gem_deposit | [10,40] | matter, light | No | 0 | Precious stones — high trade value, enchantment reagent |
| arcane_crystal | Arcane Crystal | crystal_cavern | [8,25] | energy, matter | No | 0 | Resonant crystals that amplify magical effects |
| golden_sap | Golden Sap | golden_grove | [15,35] | life, matter | Yes | 0.1 | Amber-like resin — alchemical base and luxury trade good |
| medicinal_herb | Medicinal Herbs | herb_garden | [20,50] | life | Yes | 0.4 | Wild healing plants — reduces recovery time |
| ancient_relic | Ancient Relics | ancient_vault | [5,15] | time, order | No | 0 | Preserved artifacts from a fallen civilization |
| sunken_gold | Sunken Gold | sunken_treasury | [10,30] | time, entropy | No | 0 | Coins and ingots from a drowned treasury |
| fossil_amber | Fossil Amber | fossil_bed | [8,20] | time, matter | No | 0 | Ancient remains with residual magical resonance |
| star_metal | Star Metal | iron_seep | [5,20] | force, spirit | No | 0 | Meteoric iron fallen from the sky — feared in weapons, fate-touched |
| pearls | Pearls | pearl_shoal | [10,30] | spirit, light | Yes | 0.15 | Natural pearls — luxury good, devotional offering |
| glowcap | Glowcap Spores | glowcap_hollow | [12,35] | mind, darkness | Yes | 0.3 | Bioluminescent fungi — mind-expanding alchemical reagent |

## Discovery Encounter Templates

Step 1 is always Eye reach (the discovery). Step 2 varies by theme. Vault, cavern, and treasury get a 3rd extraction complication step.

### gem_deposit — "The Gleaming Vein" (2-step)
- **Step 1** (Eye, difficulty 12): Survey the hillside, notice unusual mineral striations
- **Step 2** (Stone, difficulty 18): Excavate carefully to expose the deposit without collapse
- **Crit reward**: Uncut Ruby (Tier 2 relic)

### crystal_cavern — "The Singing Dark" (3-step)
- **Step 1** (Eye, difficulty 15): Detect the harmonic vibration beneath the surface
- **Step 2** (Veil, difficulty 22): Navigate the resonant cavern without shattering the crystals
- **Step 3** (Veil, difficulty 28): The cavern's resonance builds to a crescendo — survive the harmonic overload
- **Crit reward**: Resonance Shard (Tier 3 relic, 10% crystal_headache on use)

### golden_grove — "Sap of Ages" (2-step)
- **Step 1** (Eye, difficulty 10): Notice the unusual golden shimmer in the bark
- **Step 2** (Heart, difficulty 15): Harvest the sap without harming the trees (they respond to intent)
- **Crit reward**: Amber Phial (Tier 2 provision, removes 1 wound on first use)

### herb_garden — "The Wild Apothecary" (2-step)
- **Step 1** (Eye, difficulty 8): Recognize the rare medicinal species among common plants
- **Step 2** (Eye, difficulty 12): Catalogue and harvest without damaging the root network
- **Crit reward**: Herb Bundle (Tier 1 provision, removes 1 wound on first use)

### ancient_vault — "The Sealed Chamber" (3-step)
- **Step 1** (Eye, difficulty 18): Decipher the ward-marks on the sealed entrance
- **Step 2** (Veil, difficulty 25): Bypass the ancient protections without triggering collapse
- **Step 3** (Stone, difficulty 30): The chamber's ceiling groans — extract the relics before the vault seals itself
- **Crit reward**: Sealed Codex (Tier 3 tome, grants vault_scholar trait on first use)

### sunken_treasury — "The Drowned Hoard" (3-step)
- **Step 1** (Eye, difficulty 14): Locate the submerged structure beneath murky water
- **Step 2** (Iron, difficulty 20): Dive and extract without disturbing whatever guards the treasure
- **Step 3** (Iron, difficulty 26): The current shifts — fight the undertow to surface with the hoard
- **Crit reward**: Corroded Crown (Tier 2 relic, gold +0.20, 15% vault_curse on use)

### fossil_bed — "Bones of the Old World" (2-step)
- **Step 1** (Eye, difficulty 12): Notice the unusual bone-white formations in the rock
- **Step 2** (Stone, difficulty 16): Extract fossils without breaking the magical lattice
- **Crit reward**: Fossilized Eye (Tier 2 relic, eye +0.10, veil +0.05)

### iron_seep — "The Fallen Star" (2-step)
- **Step 1** (Eye, difficulty 10): Follow the rust-colored water to a crater overgrown with moss
- **Step 2** (Stone, difficulty 18): Extract the dense, dark metal from the impact site
- **Crit reward**: Star Metal Shard (Tier 3 arms, iron +0.15, star +0.10 — fate-touched blade material)

### pearl_shoal — "The Moon's Tears" (2-step)
- **Step 1** (Eye, difficulty 12): Read the tidal patterns to find the pearl beds
- **Step 2** (Star, difficulty 18): Dive at the right moment when the waters recede
- **Crit reward**: Moonpearl Strand (Tier 2 vestment, spirit +0.15)

### glowcap_hollow — "The Dreaming Light" (2-step)
- **Step 1** (Eye, difficulty 14): Spot the faint bioluminescence in deep shadow
- **Step 2** (Veil, difficulty 20): Harvest spores without inhaling the psychoactive cloud
- **Crit reward**: Spore Lantern (Tier 2 tool, eye +0.10, 20% spore_visions on use)

## Bestowed Powers (permanent traits, crit-only)

| Trait ID | Name | Reach Bonus | Tags | Flavor |
|---|---|---|---|---|
| prospectors_eye | Prospector's Eye | eye: +0.15 | #gem, #wealth | Can spot mineral deposits others walk past |
| crystal_attunement | Crystal Attunement | veil: +0.15, eye: +0.10 | #crystal, #arcane | The cavern's resonance lingers |
| sap_blessed | Sap-Blessed | heart: +0.10 | #nature, #healing | The golden trees accepted them |
| herbalists_knowledge | Herbalist's Knowledge | eye: +0.10 | #healing, #herb | Deep understanding of wild medicine |
| vault_scholar | Vault Scholar | eye: +0.15, stone: +0.10 | #ancient, #relic | Knowledge from pre-collapse artifacts |
| tide_reader | Tide Reader | star: +0.15 | #pearl, #navigation | Reads water patterns with uncanny accuracy |
| spore_touched | Spore-Touched | veil: +0.10, eye: +0.10 | #fungus, #vision | Brief exposure opened perception |
| ironblood | Ironblood | iron: +0.10, star: +0.10 | #star_metal, #fate | The star metal's touch lingers in the blood |

## Conditions (temporary mixed blessings)

| Trait ID | Name | Effect | Ticks | Tags | Flavor |
|---|---|---|---|---|---|
| crystal_headache | Crystal Headache | mind: -0.10 | 15 | #crystal, #pain | Lingering disorientation from resonance |
| golden_euphoria | Golden Euphoria | heart: +0.15, iron: -0.10 | 20 | #nature, #blessing | Blissful calm that impairs combat readiness |
| vault_curse | Vault Curse | star: -0.15 | 25 | #ancient, #cursed | The wards exact a toll on fate |
| brine_lungs | Brine Lungs | iron: -0.10 | 15 | #underwater, #wound | Salt water weakens the body |
| spore_visions | Spore Visions | eye: +0.20, heart: -0.15 | 20 | #fungus, #vision | Vivid visions but social withdrawal |
| fossil_whispers | Fossil Whispers | eye: +0.10, veil: +0.05 | 30 | #ancient, #time | Old bones murmur lost knowledge |

## Unique Signature Artifacts (1 per anomaly)

| Name | Tier | Subcat | Tags | Mechanical | On-Use | Flavor |
|---|---|---|---|---|---|---|
| Uncut Ruby | 2 | relics | #gem, #wealth | gold: +0.15 | — | A stone the size of a fist, still warm from the earth |
| Resonance Shard | 3 | relics | #crystal, #arcane | veil: +0.20, eye: +0.10 | 10% any_use: crystal_headache (15t) | A crystal that hums when magic is near |
| Amber Phial | 2 | provisions | #nature, #healing | heart: +0.10 | first_use: remove 1 wound | Golden sap in a sealed vessel — one dose |
| Herb Bundle | 1 | provisions | #herb, #healing | — | first_use: remove 1 wound | Carefully dried rare medicinal plants |
| Sealed Codex | 3 | tomes | #ancient, #relic | eye: +0.20, star: +0.10 | first_use: grant vault_scholar | Warded pages from before the fall |
| Corroded Crown | 2 | relics | #gold, #cursed | gold: +0.20 | 15% any_use: vault_curse (25t) | A barnacled circlet from the deep |
| Fossilized Eye | 2 | relics | #ancient, #bone | eye: +0.10, veil: +0.05 | — | A preserved eye — it watches back |
| Star Metal Shard | 3 | arms | #star_metal, #fate | iron: +0.15, star: +0.10 | — | Dense dark metal from a fallen star |
| Moonpearl Strand | 2 | vestments | #pearl, #devotion | spirit: +0.15 | — | Flawless pearls that calm the sea |
| Spore Lantern | 2 | tools | #fungus, #vision | eye: +0.10 | 20% any_use: spore_visions (20t) | Glowcap spores in glass — illuminates and hallucinates |

## Discovery Flow

```
Agent with high Eye/Veil explores hex with shimmer
  |
  v
Encounter fires (2 or 3 steps, Eye first → themed reach)
  |
  +-- Failure: anomaly stays hidden, retry later
  |
  +-- Success: rare resource seeded on location, anomaly revealed
  |            (shimmer → halo + icon via reveal flash)
  |
  +-- Critical Success: resource seeded + unique signature artifact
                        OR bestowed power OR mixed-blessing condition
                        (first discoverer only)
```

## Implementation Plan

1. Add 10 rare resource definitions + icons + prose to `resource-content.ts`
2. Create `src/data/encounter-anomaly-content.ts` with 10 encounter templates
3. Add trait definitions (8 bestowed + 6 conditions) to a new content file
4. Add 10 signature artifact definitions to a new content file
5. Wire discovery trigger: on encounter success, seed resource + reveal anomaly
6. Wire crit reward: on critical success, grant personal reward from anomaly's pool
7. Agent seeking: agents with Eye/Veil reach bias toward shimmer hexes in exploration decisions
