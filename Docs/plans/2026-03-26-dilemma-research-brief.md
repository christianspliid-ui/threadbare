# Dilemma Content Research Brief (TB-038)

**Date:** 2026-03-26
**Purpose:** Research and author the dilemma content library for the Meet The First encounter (TB-035 System 2)
**Priority:** High — this is the game's most important emotional moment. Quality here directly determines whether players form a bond with their First agent.

---

## What This Content Is For

During the Meet The First encounter, the player's god creates a crucible of defining experiences for a mortal. The player picks 4 dilemmas (one from each category below) that shape who this person becomes. The character is partly discovered (random axiological profile, archetype) and partly co-authored (player chooses which experiences to inflict).

The dilemmas are the heart of the encounter. They need to be stories that resonate — the kind of human moments that recur across mythology, folklore, and fiction because they capture something true about how people are shaped by what happens to them.

---

## System Integration: How Dilemmas Work Mechanically

Each dilemma is a self-contained story vignette with a player choice. The choice produces mechanical effects:

### Dilemma Template Structure

```typescript
interface DilemmaTemplate {
  id: string;
  category: 'axiological' | 'reach' | 'domain' | 'general';

  // What this dilemma is keyed to (for selection filtering)
  axiologicalPair?: ValuePair;     // For axiological category
  reachDomain?: ReachDomain;       // For reach category
  sphere?: Sphere;                 // For domain category
  // General category: no key — selected from full pool

  // Prose
  setupProse: string;              // Scene-setting (highest prose budget in the game)
  choices: DilemmaChoice[];        // 2-3 options the player picks from

  // Selection metadata
  tags: string[];                  // For Founding Gates (Return outcome eligibility)
  incompatibleWith?: string[];     // Dilemma IDs that conflict (avoid repetitive themes)
}

interface DilemmaChoice {
  id: string;
  label: string;                   // Short player-facing label
  prose: string;                   // What happens when chosen

  // Mechanical effects
  axiologicalShifts?: Partial<Record<ValuePair, number>>;  // e.g., { mercy_cruelty: -0.3 }
  reachShifts?: Partial<Record<ReachDomain, number>>;      // e.g., { iron: +0.2 }
  sphereShifts?: Partial<Record<Sphere, number>>;
  traitsGranted?: string[];        // Narrative traits earned through the story
  graphActions?: GraphAction[];    // Allies, equipment, factions, mounts added to graph

  // Founding Gate tags (determine which Return outcomes become possible)
  gateTags: string[];              // e.g., ['ruthless_origin', 'vengeance_seed', 'loss_of_innocence']
}

interface GraphAction {
  type: 'create_bond' | 'create_item' | 'join_faction' | 'grant_title' | 'create_mount';
  template: string;                // Content template ID for the thing being created
  edgeType: string;                // How it connects to the agent
  properties: Record<string, any>; // Starting properties
  prose: string;                   // How it's narratively introduced
}
```

### Selection During Encounter

The encounter picks one dilemma from each category:

1. **Axiological dilemma** — filtered to the axiological pair most associated with the player's chosen primary reach (via REACH_VALUE_PAIR mapping). Alternatively, the system may pick the pair where the candidate's current value is *most in tension* with the chosen reach (e.g., a merciful person being groomed for war → mercy_cruelty dilemma).

2. **Reach dilemma** — filtered to the primary reach chosen in Step 1.

3. **Domain dilemma** — filtered to the sphere chosen in Step 1.

4. **General dilemma** — selected from the full pool, possibly weighted by what the first three dilemmas *didn't* cover (e.g., if no dilemma granted an ally, prefer one that does).

### Prose Budget

This is the highest prose budget in the game. The meeting encounter is the emotional on-ramp — the defining moment. Each dilemma's setup prose and choice prose should be rich enough to create genuine emotional investment. Target: longer than any other vignette in the game. The defining moment (axiological dilemma especially) and the seeking threads (Step 1 intent prose) get extra budget.

### Prose Resolver Integration

Dilemma prose feeds into the dynamic enrichment system. Placeholders like `{agent.name}`, `{agent.appearance.hair}`, `{location.name}`, `{agent.axiological.dominant_trait}` are resolved at display time. The flavor tags chosen in Step 1 (appearance, manner) are available in all dilemma prose.

---

## Content Categories & Research Direction

### Category 1: Axiological Dilemmas (~50 templates)

**5 stories per axiological value pair.** There are 10 pairs (mapped to reaches):

| Value Pair | Reach | Research Direction |
|---|---|---|
| Mercy vs. Cruelty | Iron | What makes someone lose (or find) compassion? |
| Justice vs. Tyranny | Crown | When does the desire for order become oppression? |
| Generosity vs. Greed | Gold | What transforms someone's relationship with abundance? |
| Honesty vs. Deception | Shadow | When does someone learn to lie — or stop lying? |
| Courage vs. Cowardice | Bone | What breaks fear? What creates it? |
| Faith vs. Doubt | Veil | What destroys belief? What restores it? |
| Loyalty vs. Betrayal | Hearth | What makes someone abandon their people? |
| Wisdom vs. Folly | Lore | When does knowledge become dangerous? |
| Patience vs. Wrath | Craft | What pushes someone past their breaking point? |
| Hope vs. Despair | Wild | What kills hope? What resurrects it? |

**Key design constraint:** The character is a *victim* in these stories. Something happens TO them. The story is about what the experience does to their soul, not about their capabilities. A mercy→cruelty story isn't "they learned to fight" — it's "they watched their village burn and something inside them went cold."

**Research needed:** Survey origin-story archetypes across mythology (Greek tragedy, Norse sagas, Hindu epics), fairy tales (Grimm, Arabian Nights), modern fantasy (Tolkien, Le Guin, Martin, Sanderson), and psychology (what kinds of formative experiences actually reshape personality). What *specific scenarios* recur because they capture truth?

### Category 2: Reach-Specific Dilemmas (~45 templates)

**5 stories per reach domain (9 reaches).** These develop the character's capability in their primary domain through formative experience.

**Research needed:** What kinds of origin stories create warriors (Iron), leaders (Crown), merchants (Gold), spies (Shadow), survivors (Bone), priests (Veil), community builders (Hearth), scholars (Lore), artisans (Craft), rangers (Wild)? What's the difference between a generic "training montage" and a genuinely compelling origin of capability?

### Category 3: Domain-Specific Dilemmas (~35 templates)

**5 stories per sphere (7 spheres).** These align the character with cosmic forces — the sphere chosen in Step 1.

**Research needed:** What kinds of experiences connect someone to fundamental cosmic forces? Not "they studied magic" but "something happened that bound their fate to [force]." Think: divine encounters, cosmic accidents, witnessing something beyond mortal ken.

### Category 4: General/Graph Dilemmas (larger pool, 40+ templates)

**Not keyed to any system axis.** These add graph elements: allies, mounts, equipment, faction membership, titles. Adventure-story moments that give the character connections and possessions.

**Research needed:** Survey the "gifts and companions" trope across hero's journey literature. The named sword, the loyal horse, the unlikely ally, the faction that takes you in. What makes these moments feel earned rather than arbitrary? What makes a player care about a horse with a name?

---

## Quality Standards

Every dilemma must:

1. **Feel like a real story** — not a game mechanic dressed in prose. If you stripped the choice, would this still be a compelling paragraph of fiction?
2. **Present a genuine tension** — not a "correct" answer and a "wrong" answer. Both choices should be defensible. The player should feel the weight.
3. **Reveal something about the god** — the choice tells you what kind of deity you're playing. Not through explicit labeling ("evil choice" / "good choice") but through the consequences.
4. **Change the character visibly** — the prose after the choice should make clear that this person is *different now*. Their priorities shifted. Their worldview changed. Something broke or healed.
5. **Be replayable** — a player who encounters this dilemma on a second playthrough should find it just as compelling, even knowing the mechanical effects.

---

## Deliverable

A complete dilemma content library with:
- All ~170+ templates authored to quality standards above
- Each template fully specified (setup prose, 2-3 choices, mechanical effects per choice, gate tags, graph actions)
- Organized by category with clear selection metadata
- Tested against the prose resolver (placeholders work, enrichment integrates)
- Reviewed for variety (no two dilemmas in the same category tell the same story shape)
