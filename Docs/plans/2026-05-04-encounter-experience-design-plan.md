# Encounter Experience — Long-Form Design Plan (2026-05-04)

**Status:** Canonical design plan for the encounter experience overhaul. Engine / Content / UI pillars, NFP-compliant. Implementation contract for the executor.

**Linear issue:** THR-300 (Encounter Experience design exploration). On approval of this plan, the issue moves to *Implementation Planning* for breakout into executable child tickets.

**Audience:** Claude Code / Codex executors picking up child tickets; the user as design-direction owner; future audit of why these decisions were made.

**Inputs (read these first if you're new):**
- Grill-me synthesis: `2026-05-04-encounter-experience-grill-me.md`
- Player-journey analysis: `2026-05-04-encounter-experience-player-journey.md`
- Encounter build toolkit: `2026-05-04-encounter-build-toolkit.md`
- Vision + canonical audit: `2026-05-04-encounter-toolkit-vision-audit.md`
- Visual reference: `2026-05-04-encounter-experience-v7.html`
- Cosmological pattern (canonical): `Brainstorms/brainstorm-cosmological-symmetry.md`
- Vision: `Vision/00-north-star.md`, `01-core-loop.md`, `02-non-negotiables.md`, `03-design-tensions.md`, `Vision/taste-profile.md`

---

## 1. Premise

The encounter is the chapter in Threadbearer's reading. Everything in the player's session — the scan of their portfolio, the hours of soft simmer, the eventual choice to spend essence — exists to set up moments where one threaded mortal's situation crystallises and the player decides what kind of god to be toward it.

This plan ships an encounter surface that **scales from short resource-building beats to multi-step story arcs**, surfaces the full primitive vocabulary of the world graph, makes failure a complication, and turns every choice into a small structural moral act through the cosmological pattern's archetype axes.

**Four load-bearing rules** (the rest of the plan keeps citing them):

- **Rule 1 — Path over adjective.** Every player choice in the encounter UI must change the path, not the adjective. If three options collapse to "same outcome, different prose," cut to one and let the engine pick the prose from scene context.
- **Rule 2 — The moral axis is structural.** Every reach has an archetype-pair axis (Iron→Protector/Conqueror, Heart→Sworn/Renegade, etc., per the cosmological pattern). Each encounter choice tilts the agent toward one pole. Aggregate drift is the moral cost of being a god, surfaced structurally. A scene's primary reach drives the tilt; when an encounter exposes two distinct reaches whose axes both matter, the author can specify a dual-axis tilt and the engine accumulates drift on both.
- **Rule 3 — Verbs are encounter prose; the mechanical layer is independent metadata.** When an encounter author writes a choice card, they author *two independent layers, side by side*. **Layer 1 — what the player reads:** the verb (*"Stir her resolve" / "Speak when not asked" / "Open the lantern"*), the agent reaction, the tilts-toward note. Pure prose, encounter-specific, soft-power flavored — influence, nudging, manipulation, never full control. Author has free creative latitude. **Layer 2 — what the engine reads:** `reach`, `cost`, `moral_axis_pole`, `consumes_item?`. Structural metadata for probability tilt, drift, essence cost. **The two layers are independent.** *"Stir her resolve"* is not derived from `iron` — it's just the right verb for this scene. The same Iron-rooted choice in a different scene could have a completely different verb (*"Hold the line," "Refuse to bend," "Don't look away"*). What we are NOT doing: making verbs anchor to a fixed vocabulary derived from the reach (*"every Iron choice uses Stir/Steel/Harden"*). That would turn the verb into a label and kill the craft. The verb is craft; the metadata is plumbing; they sit on the same card but they're not the same thing.
- **Rule 4 — Every primitive is clickable; every node has a detail page.** The encounter UI shows shorthand for primitives that fit the screen. The player learns the world by clicking through: every cast tile, item, clue, place caption, callback note, faction chip, Ascendant card, dotted-underline term opens a detail overlay (modal-on-modal stacking allowed). Hover for a taster; click for the page. Players hover/click less as they internalise the world; the depth stays available for new players, complex situations, and generated content. **This is a project-wide commitment, not just an encounter feature** — every node type has a detail page. **Implementation builds on existing primitives**, doesn't rebuild from scratch: `src/components/shared/Modal.tsx`, `shared/Tooltip.tsx`, `shared/TooltipChain` (chaining already supported), `src/components/ProseKeyword.tsx` (IPK-style underlining), `src/components/ruins/EmergenceDilemmaModal.tsx` (worked example of a modal-based interaction surface). The encounter UI extends these so they support modal-on-modal stacking and a uniform `DetailPage` component pattern usable across the game. Other patterns continue to coexist where appropriate (e.g., the chevron-expand lists in the Ascendant left bar on the hex map use a different affordance suited to long lists, not concept exploration). The rule applies to *concept exploration*; not all UI must be modals.

---

## 2. The seven open questions, resolved

The toolkit left seven open questions for this plan. Resolving them up front so the rest of the document can reference them as decisions.

### 2.1 Encounter templates as graph nodes — **YES**

Promote `encounter_template` to a first-class graph node type. New edges:
- `gates_to: encounter_template → encounter_template` — completing this encounter unlocks that one
- `spawns_from: encounter_template → location_or_actor` — this encounter is sourced from a place / agent / faction state
- `enables: encounter_template → encounter_template` — completion is a soft prerequisite for another encounter being eligible

**Rationale.** The simulation produces encounter situations emergently (faction conflict reaches threshold, vow comes due, ambition crosses milestone). Today these candidates are scored from static template arrays. Promoting templates to graph nodes lets arc-chaining happen via graph traversal rather than scoring tables — emergent narrative meets authored chapters.

**Cost.** New node type + 3 new edge types. Migration is additive: existing templates get a graph-node companion at boot; the array-scored selection path stays valid as a fallback.

### 2.2 Relationship state as primitive — **YES, additively**

Add a reified `relationship` node, symmetric between two actors, carrying:
- `participants: [actor_id, actor_id]`
- `arc: improving | stable | fraying | severed`
- `tension_axis: name` (e.g. *"loyalty under strain"*)
- `tension_drift: -1.0..+1.0` (signed; positive toward repair, negative toward severance)
- `history: [event_id, ...]` (events that shaped this relationship)
- `last_invoked_tick: number`

The cast tile's *"to her: ..."* line reads from this node when it exists; falls back to the existing `relates_to` edge when it doesn't. **Backward compatible.** Encounter authors can author relationships explicitly or let them emerge from accumulated `relates_to` edges.

### 2.3 Divine marks as distinct primitives — **NO, retracted**

Original proposal was to introduce a `divine_mark` node type for blessings/curses/marks-of-passage. Retracted on user review: the rationale didn't justify a new graph schema. Blessings and curses are already covered by the **attachment** system; what they need is an optional `source_god_id` field on the existing attachment shape, plus a UI rendering rule that gives divinely-sourced attachments a distinct visual treatment (e.g. glowing portrait rim) when the field is set.

**Decision.** No new node type. Extend the existing `Attachment` shape with `source_god_id?: ActorId`. UI renders divine-source attachments with cosmic-tinted edges. Cost: one additive field, no schema migration, no new traversal logic.

### 2.4 Item consumption in choices — **YES, optional per-choice**

Lean schema gains an optional `consumes_item: item_id` field. When present:
- The item shows on the choice card in a small "spends:" indicator
- Player sees the cost inline before committing
- At resolution, the `possesses` edge from actor to item is removed (or the item's `quantity` decremented)
- The item is gone from the agent's inventory next beat

**Use case.** Worked example 5.4 (Ritual): Eira places the Captain's token at the threshold. The choice *spends* the token. This is mechanically powerful (a real material cost) and narratively load-bearing (the player is making the agent give up something specific).

### 2.5 Cast scaling beyond 4 — **EDITORIAL DISCIPLINE, NOT MECHANISM**

**Decision.** Cast tiles are reserved for actors who *can be acted on or whose disposition shapes the moment*. Background patrons, ambient figures, and crowd noise live in the place painting and the prose — not as cast tiles. There is no "+ N background figures" collapse mechanism; if 8 patrons fill the tavern, they're texture, not roster.

A scene with > 4 primary cast members triggers editorial review: is the cast really focused, or has it bloated? Hard cap: 6 cast tiles (per `CAST_TILES_PRIMARY_HARD_CAP`). Above that, the scene needs to be split or some cast moved to prose.

**Rationale.** *"If we don't put this in the encounter, what would the player lose?"* For a background patron with no name, no disposition, no act they could take: nothing. The place painting carries the room's density. Showing them as a cast tile is noise. The earlier "tiered priority" mechanism was over-engineering.

### 2.6 The Ascendant hand — **FLEXIBLE FILTER SURFACE**

The Ascendant card system itself is unfinished and likely to evolve. The encounter UI's right-rail "hand" must therefore be a **flexible filter surface**, not a hard-coded view of one specific Ascendant system shape.

**Decision.** The hand connects to whatever the Ascendant system becomes. Filter rules can be:
- **Encounter-specific** — the encounter author lists eligible templates explicitly (`ascendant_hand_filter.eligible[]`)
- **System-derived** — the engine computes scene-relevance from the Ascendant's deck against the present primitives (cast types, place type, sphere alignment, bond tier, faction presence, current essence)
- **Hybrid** — the author can pin some, the engine fills the rest

Implementation contract: the encounter UI consumes a `getAscendantHand(encounterContext)` interface; the *implementation* of that interface lives with whatever Ascendant system is canonical at the time. As the Ascendant system evolves, the encounter UI keeps working without changes.

**Place-gated cards specifically:** when a hand card is dimmed for place-gating reasons (e.g., `loc.consecrate` requires sphere alignment), the prereq line reads explicitly: *"available at sphere-aligned places"*. The card's icon and name remain visible but desaturated. Player learns place-gating by repeated viewing — the dimmed card is its own teacher. Per Rule 4, clicking the dimmed card opens its detail page where the full prereqs are explained.

### 2.7 Off-stage representation — **ONLY WHEN STAKES-CREATING**

**Decision.** Off-stage actors and forces appear in the encounter UI *only when they create the stakes that make this beat matter*. If we wouldn't lose context by omitting them, we omit them.

When an off-stage thing IS stakes-creating, the author picks one of two representations:
- **Faction chip** — the off-stage thing is a collective influence pressing on the scene. *"Civic Guard, off-stage"* in the court intrigue when their authority shapes the room. Renders in the scene-state factions panel.
- **Cast tile with off-stage badge** — the off-stage thing is a specific actor or group whose state creates the stakes. *"The small folk, dying"* in the ritual: their off-stage suffering is why we're here tonight. Renders as a cast tile with reduced opacity and an "off-stage" badge.

Rule of thumb: *if the off-stage thing has a name and a disposition, it's a cast tile. If it's a generic influence with a colour and a presence, it's a chip.*

**Sanity check the author must apply:** *"If I omit this from the encounter, what does the player lose?"* If the answer is *"nothing — the prose carries it"*, omit. If the answer is *"the player won't understand why this beat matters"*, include.

### 2.8 Place-specific encounters — first-class authoring affordance

A place can host *only* certain encounters when specific other primitives are present. Examples:
- A ritual at the dolmen only fires when the dolmen is sphere-aligned to Spirit AND it's midnight AND a wraith is present
- A court intrigue at the Marble Hall only fires when a faction conclave is in session AND the protagonist is threaded to a faction representative
- A smuggler scene only fires at port locations where the Salt-runner faction has active presence

The encounter-template-graph-node decision (2.1) supports this via `spawns_from` edges that reference *combinations* of primitives, not just place types. The encounter authoring contract (§4.1) lets authors specify required co-present primitives.

**This makes places into authoring affordances**, not just rendering surfaces. A worked place (a sphere-aligned dolmen, a war camp, a rival's keep) becomes a *pool of latent encounters* keyed to the surrounding state of the world. The simulation produces situations; the place gates which encounter chapters are eligible to frame them.

---

## 3. Engine pillar

### 3.1 Encounter pipeline updates

**Migration status (audit 2026-05-04):** all encounter content in the codebase is functionally migrated to `UnifiedActionTemplate`. There are no encounters in the legacy format. **However, architectural cleanup lags:** the deprecated `EncounterTemplate` type definition still exists in `src/types/encounter.ts` (lines 184–287) with a stale comment claiming "115 templates await migration"; the CMS registry imports encounter content from 8+ separate sources (`encounter-content.ts`, `social-encounter-content.ts`, `faction-encounter-content.ts`, etc.) and surfaces them under separate "Encounters" sub-categories despite all being unified under the hood; canonical doc `Systems/Encounter System.md` claims the type "was removed" — it wasn't.

**Phase 0 cleanup work is a SEPARATE TICKET** (THR-302, see below) that runs first. Encounter UI work waits for the cleanup to land because we expect to learn things from it that change the encounter UI's assumptions. Items in scope for Phase 0:
- Delete the deprecated `EncounterTemplate` interface from `src/types/encounter.ts`.
- Refactor `src/components/CMS/registry.ts` to filter `UNIFIED_ACTION_TEMPLATES` by metadata tags (e.g. `narrativeLayer: 'encounter'`, `category: 'social' | 'tavern' | ...`) rather than importing 8+ separate sources.
- Update `Systems/Encounter System.md` to accurately reflect: *"All encounter templates are functionally migrated to UnifiedActionTemplate. The deprecated EncounterTemplate type was removed in <merge-commit>."*
- Surface any architectural surprises that the cleanup turns up; those feed back into this plan before encounter UI implementation begins.

**Pipeline shape kept**, with these additions:

1. **Encounter selection** — `generateEncounterCandidates()` reads `encounter_template` graph nodes (when present) via `gates_to`/`spawns_from` traversal. The array-scored path remains as fallback during the additive migration of the new node type.
2. **Beat structure** — `ActionStep` gains optional `forecast_factors[]` that the engine surfaces in the new outcome forecast band (see §3.3).
3. **Encounter choice resolution** — encounter choices on a beat are typed by the cosmological pattern (reach + sphere is automatic; moral_axis_pole is required). Resolution applies a probability tilt + a moral drift accumulator (see §3.6). Verbs are author prose, not anchored to mechanics (Rule 3).
4. **Aftermath** — existing `aftermathConfig.reactions[]` is preserved. Each reaction effect kind drives a corresponding registration animation in the protagonist panel (see §5.5). New optional reaction kind: `archetype_drift_register` (for surfacing cumulative drift crossing a threshold).

### 3.2 Choice resolution

An encounter choice is a typed primitive with this shape (TypeScript):

```typescript
interface EncounterChoice {
  reach: ReachId;                          // 1 of 8 — Iron, Gold, Shadow, Veil, Heart, Eye, Stone, Star
  cost: 'small_breath' | 'fuller_breath' | 'deep_draught';  // narrative tier
  god_verb: string;                         // encounter-author-written, e.g. "Stir her resolve."
  agent_reaction: string;                   // what arises in her, encounter-author-written
  tilts_toward: string;                     // mechanical outcome shape, encounter-author-written
  moral_axis_pole: ArchetypePole;           // canonical per cosmological pattern (e.g. 'conqueror')
  fail_forward: string;                     // encounter-author-written; default "a new thread opens"
  consumes_item?: ItemId;                   // optional item consumption (decision 2.4)
  probability_tilt: number;                 // engine-computed: how much the choice shifts the d100
  drift_magnitude: number;                  // engine-computed: how much the moral axis drifts on commit
}
```

When the player commits a choice:
1. Probability tilt is added to the beat's resolution roll.
2. If `consumes_item` is set, the corresponding `possesses` edge is queued for removal.
3. `drift_magnitude` is added to the agent's archetype-drift accumulator on the moral axis paired with the choice's reach (see §3.6).
4. Essence is spent from the Ascendant.
5. The d100 rolls against the (tilted) sigmoid. Outcome lands in one of five bands (critical fail / fail / fail-forward / success / critical success).
6. Prose for the outcome is selected from the choice's outcome variants OR the engine's prose-lookup table (the 240 consequence templates, see §3.5).

**Probability tilt calibration** — initial constants (see §7):
- `small_breath` → `+0.05` to base probability
- `fuller_breath` → `+0.10`
- `deep_draught` → `+0.20`

**Drift magnitude calibration** — initial constants:
- `small_breath` → `+0.04` toward the moral axis pole
- `fuller_breath` → `+0.07`
- `deep_draught` → `+0.12`

These map roughly to the canonical Fate Forecast's Nudge/Amplify/Force tiers but with the moral-axis layer added. Cost integers in essence: 1, 2, 3 respectively.

### 3.3 Outcome forecast band engine

The new outcome forecast band (rendered above the prose in v7) is computed at beat-entry time:

1. Engine computes the base probability from `actor.reach[beat.reach] + modifiers - beat.difficulty`.
2. Maps probability to one of five qualitative tiers:
   - `< 0.20` → "Doomed"
   - `0.20–0.40` → "Perilous"
   - `0.40–0.60` → "Uncertain"
   - `0.60–0.80` → "Favorable"
   - `≥ 0.80` → "Fated"
3. Selects 1–3 narrative factors from the beat's available factor pool (sphere alignment, trait synergies, place conditions, recent omens). Factors are written by the encounter author in `forecast_factors[]`.
4. Renders the band as: *"the threads stand uncertain · iron-rooted, but Halren is watching."* Hover expands to all available factors.

**This subsumes the legacy `Systems/Fate Forecast.md` surface.** No separate Forecast modal. The qualitative read is always visible above the prose; the legacy Nudge/Amplify/Force/Block verb vocabulary is dissolved (Block → Watch-only; the rest → choice cost tiers).

### 3.4 Hand filter

The Ascendant hand is a scene-relevance filter on the existing UnifiedActionTemplate pool. Filter cascade:

1. **Target match** — template's `targetCategories` includes a present primitive (cast actor, place, sublocation, attached item).
2. **Cost availability** — Ascendant has enough essence after current commitments.
3. **Sphere prereq** — template's required sphere is in the player's accessible spheres (gated by Ascendant attunement).
4. **Bond tier** — template's `minTier` is met by the player's bond to the targeted agent.
5. **Place gating** — for place-targeted templates, the location supports the move (e.g., `loc.consecrate` requires sphere alignment).

Output:
- **Playable** — bright card, click commits.
- **Dimmed** — visible with prereq tooltip showing what's missing (decision 2.6).
- **Hidden** — fails target match or has no scene relevance.

### 3.5 Aftermath effect kinds (canonical 8 + 1 new)

The existing `aftermathConfig.reactions[]` system supports 8 effect kinds. The plan keeps all 8 and adds 1 new:

| Effect kind | What it does | UI signature |
|---|---|---|
| `reputation_tally` | Tally point with a faction (small) | Faction chip pulses |
| `reputation_score` | Score change with a faction (medium) | Faction chip pulses + magnitude indicator |
| `encounter_seed` | Seeds a future encounter (`spawns_from` edge) | Subtle "↗ a thread opens" line |
| `hidden_mark` | Internal flag for future encounter scoring | No UI surface (internal only) |
| `intelligence` | Knowledge artifact added to actor | Card slides into items rail |
| `condition_attachment` | Condition attached to actor | Condition chip on actor; visible in scene state |
| `recent_event` | Event node added to actor's history | Card slides into "moments that could echo" |
| `spawn_artifact` | Item attached to actor | Card slides into items rail |
| `faction_*` | Faction-level effects (status, alliances) | Faction chip update |
| **`archetype_drift_register`** *(new)* | Surfaces accumulated drift crossing a threshold | "Eira has tilted toward Conqueror across her last 14 choices" line in scene state |

The new `archetype_drift_register` effect kind doesn't add new graph state — it's purely a UI surface trigger when the engine detects a threshold crossing on the cumulative drift accumulator.

### 3.6 Cumulative archetype drift tracking

Each agent has a per-axis drift accumulator (TypeScript):

```typescript
interface ArchetypeDrift {
  axis_id: AxisId;                // one of 8 (paired with each reach) + meta-axis
  position: number;                // -1.0 (one pole) to +1.0 (other pole)
  history: DriftEntry[];           // each choice that touched this axis
  last_threshold_crossed?: ThresholdCrossing;
}

interface DriftEntry {
  tick: number;
  encounter_id: string;
  beat_index: number;
  magnitude: number;               // signed
  source: 'choice' | 'aftermath_effect' | 'event';
}
```

Drift accumulates additively from each choice. Thresholds trigger UI events:
- Crossing `±0.30` → soft drift indicator appears in scene state
- Crossing `±0.60` → identification banner fires in protagonist panel
- Crossing `±0.85` → archetype-pole "becoming" event registers as recent_event with prose

Drift slowly decays (`-0.001 per tick`) toward zero when no choice reinforces it — the agent reverts toward their natural axiological pole over time.

### 3.7 Detection escalation

Per-region accumulated divine-intervention pressure:

```typescript
interface RegionDetectionState {
  region_id: RegionId;
  pressure: number;                // accumulates with each intervention
  decay_rate: number;              // resets slowly
  last_threshold_crossed?: ThresholdCrossing;
}
```

Pressure increments per intervention by `cost_tier × sphere_visibility_multiplier`. Threshold crossings surface as scene-state threads:
- `≥ 0.50` → "*rivals are starting to notice*"
- `≥ 0.80` → "*a rival god turns its head*"
- `≥ 1.00` → triggers a scripted rival-detection encounter

This subsumes the legacy Fate Forecast detection escalation; no per-card detection labels.

### 3.8 Encounter templates as graph nodes

Per decision 2.1, new node type:

```typescript
interface EncounterTemplateNode {
  id: NodeId;
  template_id: TemplateId;          // reference to UnifiedActionTemplate
  category: 'guild' | 'social' | 'tavern' | ...;
  rarity_tier: 1 | 2 | 3 | 4;
  intrinsic_tier: 'background' | 'shaping' | 'story_beat';
  edges: {
    gates_to: NodeId[];             // unlocks these
    spawns_from: NodeId[];          // sourced from location/actor/faction
    enables: NodeId[];              // soft prereq for these
  };
}
```

`generateEncounterCandidates()` now traverses these edges in addition to scoring static templates. Backward-compatible: templates without graph nodes still selectable via the array path.

### 3.9 Relationship nodes

Per decision 2.2, additive node type. Cast tile's "to her: ..." reads from `relationship` when present; falls back to `relates_to` edge sentiment when absent. Authoring pattern:

```typescript
interface RelationshipNode {
  id: NodeId;
  participants: [ActorId, ActorId];
  arc: 'improving' | 'stable' | 'fraying' | 'severed';
  tension_axis: string;             // human-readable, e.g. "loyalty under strain"
  tension_drift: number;            // -1.0 to +1.0
  history: EventId[];
  last_invoked_tick: number;
}
```

### 3.10 Divine marks

Per decision 2.3, new node type:

```typescript
interface DivineMarkNode {
  id: NodeId;
  subtype: 'blessing' | 'curse' | 'mark_of_passage';
  source_god_id: ActorId;
  target_id: NodeId;                // actor or location
  magnitude: number;                // 0.0 to 1.0
  decay_schedule: DecayConfig;
  applied_tick: number;
}
```

Surfaces in scene state when active on protagonist or place. Glowing portrait rim for marked actors; marked place gets a sub-line in place conditions.

### 3.11 Item consumption in choices

Per decision 2.4. At choice resolution time:

1. If `consumes_item` is set, queue removal of the `possesses` edge from actor → item.
2. Apply at the same tick as the resolution (atomic with the choice commit).
3. UI animates the item out of the items rail with a small dissolve effect.

### 3.12 Graph mutation discipline

Per CLAUDE.md load-bearing decision: *the world graph is mutated in place — never depend on graph object identity for change detection.* All new node types and edge types follow this. The new effects (drift accumulator, detection escalation, divine mark, relationship updates) bump `worldVersion` on mutation; structural changes also bump `structuralCacheVersion`.

---

## 4. Content pillar

### 4.1 Encounter authoring contract (final form)

```yaml
encounter:
  id: string
  protagonist: actor_id
  category: 'guild' | 'social' | 'tavern' | 'borderland' | 'monster' | 'anomaly' | 'army' | 'branching'
  rarity_tier: 1..4
  intrinsic_tier: 'background' | 'shaping' | 'story_beat'

  place:
    location: location_id
    sublocation: sublocation_id?
    ambient_state: { time_of_day, weather, special }
    painting: image_ref | generated_prompt

  cast:
    - actor: actor_id
      role_in_scene: string
      attention_priority: 'primary' | 'background' | 'offstage'
      representation: 'cast_tile' | 'faction_chip'  # offstage only
      disposition_per_beat: { 1: string, 2: string, ... }
      tags: [scene_tag]

  scene_state:
    threads_in_play:
      - { name: string, weight: 'taut' | 'thin' | 'fraying', sphere_color: SphereId }
    factions_here: [faction_id]
    place_conditions: [trait_id]
    conditions_on_protagonist: [condition_id]

  protagonist_view:
    capability_axes: [reach_id, reach_id, reach_id]   # 3 of 8
    items_relevant: [attachment_id]
    vows_active_per_beat: { 1: [vow_id], 2: [vow_id] }
    callback_candidates: [event_id]
    state_descriptor: string

  beats:
    - title: string
      invokes: event_id?
      forecast_factors: [string, string, string]      # 1-3 author-written factors for the forecast band
      prose: string
      prose_tooltips:
        "phrase": condition_or_secret_or_event_ref
      encounter_choices:
        - reach: reach_id
          cost: 'small_breath' | 'fuller_breath' | 'deep_draught'
          god_verb: string
          agent_reaction: string
          tilts_toward: string
          moral_axis_pole: archetype_pole_id          # one of the 16 poles per cosmological pattern
          fail_forward: string
          consumes_item: item_id?

  aftermath:
    receipt: short_narrative_summary
    changes:
      - { kind: 'intelligence', payload: knowledge_id }
      - { kind: 'faction_tilt', payload: { faction_id, delta } }
      - { kind: 'archetype_drift_register', payload: { axis_id, threshold } }
      ...
    choice (for big encounters):
      prompt: string
      options: [{ label, consequences }]

  ascendant_hand_filter:
    eligible: [template_id]
    rare_pulse: [template_id]

  graph_node:                                          # if encounter is a graph-node
    spawns_from: [node_id]
    gates_to: [encounter_template_id]
    enables: [encounter_template_id]
```

### 4.2 Encounter choice cosmological pattern v1 (enumerated)

Per Rule 2 and `Brainstorms/brainstorm-cosmological-symmetry.md`, every reach has its sphere pair and archetype-pole pair:

| Reach | Sphere | Tension | Pole A | Pole B |
|---|---|---|---|---|
| Iron | Force | Mercy ↔ Ruthlessness | Protector | Conqueror |
| Gold | Life | Asceticism ↔ Extravagance | Mender | Magnate |
| Shadow | Entropy | Honesty ↔ Cunning | Confessor | Puppeteer |
| Veil | Mind | Tradition ↔ Novelty | Archivist | Heretic |
| Heart | Spirit | Loyalty ↔ Ambition | Sworn | Renegade |
| Eye | Energy | Revelation ↔ Discretion | Seeker | Sentinel |
| Stone | Matter | Preservation ↔ Transformation | Guardian | Shaper |
| Star | Time | Sacrifice ↔ Survival | Martyr | Survivor |
| Quintessence (meta) | — | Courage ↔ Prudence | Vanguard | Watcher |

Quintessence is not a reach — it's the meta-property covering boldness of expression and the cosmological phase-transition threshold (per `Brainstorms/brainstorm-cosmological-symmetry.md`). It carries the meta archetype pair Vanguard ↔ Watcher and is available as a moral axis on choices that don't fit any single reach (e.g. the Watch-only opt-out tilts the agent toward Watcher).

The encounter author specifies the moral_axis_pole on each choice. The engine validates against the reach (must match one of the two poles paired with that reach, OR the Quintessence-axis poles when the choice is reachless).

### 4.3 Prose authoring discipline

Per `Systems/Narrative Engine.md` three-tier model:

- **Routine prose** for typical beats (resolution prose, default choice reactions, default aftermath receipts) — template-stitched from authored fragments.
- **Notable prose** for tier-2 beats (criticals, callbacks, identification beats) — enhanced templates with multiple variants and conditional clauses.
- **Chronicle prose** for tier-3 beats (doom escalations, mandate milestones) — LLM-generated literary quality from structured prompt.

**Voice:** 3rd person past for world events; 2nd person for direct player addresses ("*you sharpen her sight*"); dramatic present for Chronicle.

**Quality bar:** the Meeting-encounter prose. New encounter content fails editorial review if it falls below that bar. (Per taste-profile §"Meeting-encounter prose is the quality bar".)

**No flowery drift.** Per the v6→v7 iteration's "less flowery, more action" feedback. Erikson coding: short punchy sentences, dialogue, dust and iron, italic reserved for one or two strikes per beat.

### 4.4 Tooltip authoring (resolves to graph entities)

Every dotted-underlined term in the prose **must resolve to a graph entity.** Authoring pattern:

```yaml
prose_tooltips:
  "running": condition_id_about_to_bolt          # condition node
  "three places back": secret_id_halren_signal   # secret node
  "the small folk's silence": vow_id_to_small_folk
```

The renderer reads the referenced entity and composes the tooltip text from the entity's data + a tiny prose template per entity type. Authors do not write tooltip text directly. This is the engine reading the world, not the author writing parallel prose.

**Anti-pattern:** authoring a tooltip without a graph reference. Linter rejects this at content build time.

### 4.5 240 consequence templates as engine prose-lookup

Per AgendaPicker dissolution (see audit §10.3): the existing `agenda-consequence-templates.ts` (240 templates organised by intervention type × agenda category × variant) becomes the engine's prose-lookup table for Ascendant hand cards. When the player clicks `Send a sign`, the engine:

1. Looks up the omen consequence templates.
2. Picks the variant whose category matches scene context (cast disposition, place sphere, beat).
3. Resolves IPK placeholders against scene primitives.
4. Renders.

No player-facing AgendaPicker UI. Authors continue to write consequence templates; the engine selects.

### 4.6 Cast scaling guidance (decision 5)

Encounter authors mark each cast member with `attention_priority`:
- **Primary** (max 4 per beat, soft cap): named characters whose disposition shapes the beat
- **Background**: presences who matter but whose individual states don't drive choice (e.g., the queue at the gate; the four scribes at court)
- **Offstage**: not in the room but pressured into the scene (faction influences, distant agents)

A scene with > 4 primary cast forces editorial review: is this really a primary scene with a tight focus, or has the cast bloated?

### 4.7 Place-of-power moves (decision 6)

When authoring a place that is sphere-aligned (e.g. the dolmen → Spirit), the encounter author can include place-gated Ascendant moves in `ascendant_hand_filter.eligible`. The engine surfaces them; the dimmed teaching pattern (decision 2.6) handles when the player can't yet play them. Author guidance:

- A scene at a sphere-aligned place should expose at least one place-gated move (teaches the existence of the affordance).
- A scene at a mundane place should not expose place-gated moves at all (avoids dimmed-card noise when no learning is possible).

### 4.8 Off-stage cast representation (decision 7)

Author rule of thumb (from §2.7):
- *If the off-stage thing has a name and a disposition,* it's a `cast_tile` with `attention_priority: offstage`.
- *If it's a generic influence with a colour and a presence,* it's a `faction_chip` (no cast tile; renders in factions panel).

Examples:
- "Civic Guard, off-stage" → faction_chip
- "The small folk, dying" → cast_tile (offstage badge)
- "The rival god whose mark may be on this place" → cast_tile (offstage badge, sphere-tinted)
- "The royal scribe taking minutes" → cast_tile (background) — visible but collapsed by default

### 4.9 Worked example content (the four scenes as v1 reference)

The four worked examples in the toolkit (§5.1 Eira at the Gate, §5.2 The Tavern's Last Cup, §5.3 A Whisper at Court, §5.4 The Ritual of the Threshold) become **v1 reference content**. They serve as:
- Exemplar encounters for content team
- Test scenes for the renderer
- Quality bar examples for editorial pass

Each must be authored to the contract in §4.1 with full prose, tooltipped terms wired to graph entities, and aftermath effect kinds enumerated.

### 4.10 Predecessor reference: the Gate Duty proto-encounter

The Gate Duty encounter (`cg.quest.gate_duty`) and its derived design docs are the prior generation's most advanced thinking about encounter authoring craft. They remain valuable as **predecessor reference** for content authors looking at concrete examples of "pressure knot" encounter structure, conditional-block prose, and effect-chain aftermaths.

Reference docs:
- `Docs/plans/2026-04-03-encounter-packet-cg-gate-duty.md` — worked-example encounter packet with support matrix, intervention fantasy, bundle contract
- `Docs/plans/2026-04-03-clearance-gate-proto-primitive-pattern.md` — reusable state-machine shell for inspection drama (pending → flagged → exposed → compromised → cleared); a separate engine concern this plan does not absorb
- `Docs/plans/encounter-building-checklist.md` — the "pressure knot" design heuristic with Gate Duty as exemplar

**What this plan does NOT carry forward as separate concerns:** support-object persistence contracts (the graph-native architecture in Vision Non-Negotiable #4 + the §3.5 aftermath effect kinds already handle persistence), reuse-first binding (implicit in graph-native), aftermath effect chains (§3.5 + §4.1's `changes[]` array already supports this), reward pool tagging (unverified against existing reward system; revisit during implementation), omen prose variants (speculative authoring burden against an unsettled omen system), and the clearance-gate proto-primitive itself (separate engine concern, no UI coupling needed).

**What carried forward into this plan, in their right place:** Narrative Engine prose-tier discipline (§4.3 — Routine / Notable / Chronicle), the existing `successAfterimage` / `failureAfterimage` per step as the branching-memory mechanism (§4.1 authoring contract), failure-as-forward-pressure (§15.8). Each integrated where it belongs, not enumerated as carry-forwards.

---

## 5. UI pillar

### 5.1 v7 layout canonical

The v7 wireframe (`2026-05-04-encounter-experience-v7.html`) is the canonical encounter screen layout. Promotion to canonical happens at the end of the implementation phase (new `Systems/Encounter UI.md` doc).

Key layout primitives:
- **Eira Hero Panel** — left rail, 440px, full body height. Portrait + identity + capability + items + recent moments.
- **Active Card** — center, 800px wide, full body height. Place painting → forecast band → callback note → prose → choices.
- **Right Rail** — 540px. Cast (top) → Hand (middle) → Scene state (bottom).
- **Bottom Bar** — slim 100px. Quintessence + scene pacing + watch-only.

### 5.2 Outcome forecast band component

New component `OutcomeForecastBand`:
- One-line qualitative read: *"the threads stand uncertain"*
- Inline 1–2 narrative factors: *"iron-rooted, but Halren is watching"*
- Hover expands to full factor list
- Renders above the prose, below the callback note
- Computed by engine per beat (§3.3)
- No numbers. Ever. Per taste-profile.

### 5.3 Encounter choice card

Updated component `EncounterChoiceCard`:
- SPHERE label · cost (top)
- God-verb (display, large italic)
- Agent reaction (body)
- Tilts-toward (mechanical hint)
- **Moral-axis tilt line** (new): `↬ tilts toward CONQUEROR` style
- Fail-forward note: `↗ on fail — a new thread opens`
- Optional consumes-item indicator (decision 2.4)

### 5.4 Ascendant hand

Updated `AscendantHand` component on right rail:
- Three visible cards by default + "+ N more" disclosure
- Click commits directly (no inner picker)
- Three states per card: playable / dimmed / hidden (per §3.4)
- Dimmed cards show prereq line explicitly
- Rare cards pulse subtly (per cosmological pattern)
- "+1 NEW" badge floats on header when player has unlocked a new card

### 5.5 Aftermath registration animations

Each canonical aftermath effect kind has a registration animation:

| Effect | Animation |
|---|---|
| `intelligence` | Card slides into items rail with gold glow + "+ NEW" badge |
| `condition_attachment` | Condition chip materialises on actor portrait |
| `reputation_tally` / `reputation_score` | Faction chip pulses + small magnitude indicator |
| `spawn_artifact` | Card slides into items rail (similar to intelligence) |
| `recent_event` | Card slides into "moments that could echo" panel |
| `encounter_seed` | Subtle "↗ a thread opens" line, no card |
| `hidden_mark` | (no UI surface — internal) |
| `faction_*` | Faction chip update + brief tooltip |
| `archetype_drift_register` | Drift threshold callout in scene state |

Animation timing: 600ms fade-in + glow, 400ms settle. Audio cue (a soft thrum) on materialisation.

### 5.6 Scene state cumulative drift indicator

In the scene-state panel, when the protagonist's drift on any axis crosses ±0.30:

```
RECENT TILT
Eira has tilted toward Conqueror across her last 14 choices.
```

Subtle, italic, one line. Becomes more emphatic at ±0.60 and ±0.85. The player can dismiss it (it returns next time it crosses a fresh threshold).

### 5.7 Detection thread

Per §3.7. When regional detection pressure exceeds 0.50, a new thread appears in the threads-in-play panel:

```
─── rivals are starting to notice
```

At 0.80:
```
═══ a rival god turns its head
```

Thicker, darker, more present. The player feels the world pressing back.

### 5.8 World view → encounter handoff

Per the player journey analysis:
- Threaded agent's hex pulses with thread-color flare
- Retinue panel tile gets priority indicator (small "needs attention" pip)
- Notification card slides in (on probation; review during alpha)
- ❌ No camera drift
- Click commits to entering the encounter screen
- World freezes (turn-based confirmation)

Encounter screen entry transition: 400ms fade-up with ambient sound shift (world distant lute → scene queue murmur).

---

## 6. Wiring

Per `Docs/plans/wiring-checklist.md`. Module → integration points:

| Module | Orchestrator phase | UI component | GameState flow | Traces | Debug visibility | Prose pipeline |
|---|---|---|---|---|---|---|
| Encounter selection v2 | `phaseEncounterCandidates` | (none — internal) | reads/writes `gameState.activeEncounters` | `encounter_selection_v2` | DebugPanel encounter inspector | n/a |
| Choice resolution | `phaseChoiceResolution` (new) | `EncounterChoiceCard` (commit handler) | writes `gameState.activeEncounters[i].lastResolvedBeat` + `agent.archetypeDrift` | `choice_resolved` | DebugPanel choice inspector + drift visualiser | enrichProse on `agent_reaction` + outcome variants |
| Outcome forecast | `phaseEncounterProgressionV2` | `OutcomeForecastBand` | derived from beat resolution call | `forecast_computed` | DebugPanel forecast factors | enrichProse on factor strings |
| Ascendant hand filter | `phaseAscendantHandFilter` (new) | `AscendantHand` | reads `gameState.ascendant.deck` | `hand_filtered` | DebugPanel hand state | n/a |
| Aftermath effects | `phaseAftermathExecution` (existing) | various registration animations | writes through GraphOps | `aftermath_effect` (existing) | DebugPanel aftermath | enrichProse on receipt + change descriptions |
| Drift tracking | `phaseDriftDecay` (new) | drift indicator in scene state | mutates `agent.archetypeDrift` | `drift_threshold_crossed` | DebugPanel drift visualiser | n/a |
| Detection escalation | `phaseDetectionPressure` (new) | thread in scene state | mutates `gameState.regionDetection` | `detection_threshold_crossed` | DebugPanel detection state | n/a |
| Item consumption | (within `phaseChoiceResolution`) | items rail dissolve animation | removes `possesses` edge | `item_consumed_by_choice` | DebugPanel actor inspector | n/a |
| Encounter handoff | (UI side; no orchestrator phase) | retinue panel + hex pulse | `gameState.spotlightedAgent` set | `spotlight_changed` | DebugPanel spotlight tracker | n/a |

**`Docs/plans/wiring-checklist.md` updates required:**
- Add `phaseChoiceResolution` to orchestrator phases list
- Add `phaseAscendantHandFilter` to orchestrator phases
- Add `phaseDriftDecay` to orchestrator phases
- Add `phaseDetectionPressure` to orchestrator phases
- Add `archetype_drift_register` to aftermath effect kinds
- Add new GameState fields: `agent.archetypeDrift`, `regionDetection`, `spotlightedAgent`
- Add new trace categories: `choice_resolved`, `forecast_computed`, `hand_filtered`, `drift_threshold_crossed`, `detection_threshold_crossed`, `item_consumed_by_choice`, `spotlight_changed`

---

## 7. Constants table (NFP #1 — Tunability)

Every tunable number named, with default and purpose.

| Constant | Default | Purpose |
|---|---|---|
| `CHOICE_PROBABILITY_TILT_SMALL` | 0.05 | Probability shift for `small_breath` choice |
| `CHOICE_PROBABILITY_TILT_FULLER` | 0.10 | Probability shift for `fuller_breath` choice |
| `CHOICE_PROBABILITY_TILT_DEEP` | 0.20 | Probability shift for `deep_draught` choice |
| `CHOICE_DRIFT_MAGNITUDE_SMALL` | 0.04 | Moral-axis drift per `small_breath` choice |
| `CHOICE_DRIFT_MAGNITUDE_FULLER` | 0.07 | Moral-axis drift per `fuller_breath` choice |
| `CHOICE_DRIFT_MAGNITUDE_DEEP` | 0.12 | Moral-axis drift per `deep_draught` choice |
| `CHOICE_ESSENCE_COST_SMALL` | 1 | Essence cost for `small_breath` |
| `CHOICE_ESSENCE_COST_FULLER` | 2 | Essence cost for `fuller_breath` |
| `CHOICE_ESSENCE_COST_DEEP` | 3 | Essence cost for `deep_draught` |
| `DRIFT_THRESHOLD_SOFT` | 0.30 | Drift level that triggers scene-state indicator |
| `DRIFT_THRESHOLD_BANNER` | 0.60 | Drift level that triggers identification banner |
| `DRIFT_THRESHOLD_BECOMING` | 0.85 | Drift level that registers a "becoming" event |
| `DRIFT_DECAY_RATE_PER_TICK` | 0.001 | Slow reversion toward baseline when no choice reinforces |
| `DETECTION_THRESHOLD_NOTICE` | 0.50 | "rivals are starting to notice" |
| `DETECTION_THRESHOLD_TURN` | 0.80 | "a rival god turns its head" |
| `DETECTION_THRESHOLD_ENCOUNTER` | 1.00 | Triggers scripted rival-detection encounter |
| `DETECTION_DECAY_RATE_PER_TICK` | 0.005 | Slow pressure decay |
| `FORECAST_TIER_DOOMED_MAX` | 0.20 | Probability boundary for "Doomed" tier |
| `FORECAST_TIER_PERILOUS_MAX` | 0.40 | "Perilous" tier upper bound |
| `FORECAST_TIER_UNCERTAIN_MAX` | 0.60 | "Uncertain" tier upper bound |
| `FORECAST_TIER_FAVORABLE_MAX` | 0.80 | "Favorable" tier upper bound |
| `FORECAST_FACTORS_VISIBLE_DEFAULT` | 1 | How many factors show without hover |
| `FORECAST_FACTORS_VISIBLE_HOVER_MAX` | 4 | Cap on hover-expanded factor list |
| `CAST_TILES_PRIMARY_SOFT_CAP` | 4 | Cast tiles shown as primary; over → editorial review |
| `CAST_TILES_BACKGROUND_COLLAPSE_THRESHOLD` | 5 | Background tiles collapse to "+ N" expander |
| `HAND_VISIBLE_CARDS_DEFAULT` | 3 | Cards visible without "+ N more" expansion |
| `CHOICE_OPTIONS_PER_BEAT_DEFAULT` | 3 | Default choice cards per beat |
| `CHOICE_OPTIONS_PER_BEAT_MAX` | 6 | Hard cap (anything over → editorial review) |
| `BEAT_COUNT_DEFAULT` | 4 | Typical encounter length |
| `BEAT_COUNT_MAX` | 8 | Hard cap |
| `AFTERMATH_ANIMATION_FADE_IN_MS` | 600 | Registration card fade-in |
| `AFTERMATH_ANIMATION_SETTLE_MS` | 400 | Settle after fade-in |
| `ENCOUNTER_HANDOFF_TRANSITION_MS` | 400 | World view → encounter screen |

All constants live in `src/data/encounter-experience-constants.ts`.

---

## 8. Tracing (NFP #2 — Inspectability)

New trace types to be added. TypeScript interfaces:

```typescript
interface ChoiceResolvedTrace {
  category: 'choice_resolved';
  tick: number;
  encounterId: string;
  beatIndex: number;
  agentId: string;
  reach: ReachId;
  cost: 'small_breath' | 'fuller_breath' | 'deep_draught';
  probabilityTilt: number;
  driftMagnitude: number;
  moralAxisPole: ArchetypePole;
  consumesItem?: ItemId;
  outcomeBand: 'critical_fail' | 'fail' | 'fail_forward' | 'success' | 'critical_success';
  rolledD100: number;
  effectiveProbability: number;
}

interface ForecastComputedTrace {
  category: 'forecast_computed';
  tick: number;
  encounterId: string;
  beatIndex: number;
  baseProbability: number;
  modifiers: { source: string; delta: number }[];
  finalTier: 'doomed' | 'perilous' | 'uncertain' | 'favorable' | 'fated';
  factors: string[];
}

interface HandFilteredTrace {
  category: 'hand_filtered';
  tick: number;
  encounterId: string;
  totalDeckSize: number;
  playableCount: number;
  dimmedCount: number;
  hiddenCount: number;
  rarePulses: TemplateId[];
}

interface DriftThresholdCrossedTrace {
  category: 'drift_threshold_crossed';
  tick: number;
  agentId: string;
  axisId: AxisId;
  fromPosition: number;
  toPosition: number;
  thresholdCrossed: 'soft' | 'banner' | 'becoming';
  pole: ArchetypePole;
}

interface DetectionThresholdCrossedTrace {
  category: 'detection_threshold_crossed';
  tick: number;
  regionId: RegionId;
  fromPressure: number;
  toPressure: number;
  thresholdCrossed: 'notice' | 'turn' | 'encounter';
}

interface ItemConsumedByChoiceTrace {
  category: 'item_consumed_by_choice';
  tick: number;
  encounterId: string;
  beatIndex: number;
  agentId: string;
  itemId: ItemId;
}

interface SpotlightChangedTrace {
  category: 'spotlight_changed';
  tick: number;
  fromAgentId?: string;
  toAgentId: string;
  trigger: 'world_handoff' | 'manual_select' | 'beat_advancement';
}
```

All traces accessible via the existing `Debug Trace System`. New `TRACE_CATEGORIES` entries added per the wiring checklist.

---

## 9. Fail-soft table (NFP #4 — Fail-soft)

Failure modes and graceful fallbacks. The tick loop must never crash.

| Failure | Fallback |
|---|---|
| Lean references missing reach | Engine logs warning, treats as Iron (most common reach), proceeds |
| Lean references missing moral_axis_pole | Engine logs warning, drift not applied, proceeds |
| Tooltip references missing graph entity | Render the literal phrase without tooltip styling; no crash |
| Forecast factor list empty | Render the qualitative tier alone, omit factors line |
| Outcome band selection out of range | Clamp to nearest valid band |
| Aftermath effect kind unknown | Engine logs warning, skips that effect, proceeds with others |
| Cast tile portrait missing | Render gradient silhouette with sphere-tinted halo |
| Place painting missing | Render solid sphere-tinted rectangle with caption only |
| Encounter authored without choices | Auto-generate three Watcher-pole choices with default reach + cost |
| Encounter authored without aftermath | Default to single-line `recent_event` aftermath |
| Drift accumulator overflow | Clamp to ±1.0 |
| Detection pressure overflow | Clamp to 1.0; prevent re-firing of scripted encounter |
| Cast member with `actor_id` not in graph | Engine logs warning, omits cast tile, proceeds |
| Encounter graph node has dangling `gates_to` | Treat as no gating (open) |
| Item to consume not in actor's possessions | Engine logs warning, choice proceeds without consumption |
| Relationship node references missing actor | Falls back to `relates_to` edge sentiment |

---

## 10. Canonical doc updates (in scope of this ticket)

Per Vision Non-Negotiable #5 (the Vision edit is part of this ticket's scope, not a follow-up):

1. **`Systems/Domain Word Scales.md`** — update to 8 reaches + Quintessence (per `Brainstorms/brainstorm-cosmological-symmetry.md`). Remove Flesh row. Add Quintessence section as meta-property.

2. **`Systems/Fate Forecast.md`** — supersede. Mark with header *"⚠ Superseded 2026-05-04 by encounter UI outcome forecast band — see `Systems/Encounter UI.md`"*. Forwarding link.

3. **`Systems/Action Narrative System.md`** — clarify that the AgendaPicker UI surface is removed. The 240 consequence templates persist as engine prose-lookup (per §4.5). Update implementation table to reflect this.

4. **`Vision/taste-profile.md`** — soften §"Three intervention verbs" strong opinion. Replace text with: *"Verbs are encounter-specific, anchored in the cosmological pattern of reach + sphere + moral axis. The hypothesis that there are three fixed verbs (nudge / whisper / vision) was retired 2026-05-04 — encounter authors write per-scene god-verbs underpinned by the 8 reaches."*

5. **New `Systems/Encounter UI.md`** — the canonical reference for the v7 surface. Promotion happens at end of implementation. Includes:
   - Slot mapping (from this plan §5)
   - The path-vs-adjective rule
   - The moral-axis tilt structure
   - Component inventory (EncounterChoiceCard, AscendantHand, OutcomeForecastBand, etc.)
   - Animation spec for aftermath registration
   - The handoff transition

6. **`Systems/Encounter System.md`** — augment with reference to new node type `encounter_template`, new edge types, new beat field `forecast_factors`.

7. **`Systems/Intervention Effects.md`** — augment with new effect kind `archetype_drift_register`.

8. **Obsidian Index.md** — add new pages, update existing entries, add this plan to Vault Log.

---

## 11. Migration strategy — deferred

The implementation phasing originally drafted here was speculative. Per user direction, we are **not ready to commit to phasing yet** — more exploration is needed on what the executor work actually looks like, what dependencies exist, what's CC vs Codex fit, and how Phase 0 cleanup (§3.1) sequences with new feature work.

**Approach.** After this plan is approved at design level, we run a separate exploration ticket that produces an implementation phasing plan. That plan covers:
- Phase 0 (architecture cleanup): deprecated type removal, CMS registry refactor, doc accuracy fixes
- Engine + UI scaffold sequencing
- Reference content authoring (the four worked examples)
- Existing 100+ encounter content audit (default `moral_axis_pole` inference + human review)
- New primitive types rollout (encounter_template, relationship)
- Canonical doc updates
- Vault audit and surface retirement

Each phase becomes child Linear issues at that point. Phasing exits this plan; child issues exit the implementation phasing exploration.

**What we DO commit to here:**
- The decisions (§2)
- The engine/content/UI architecture (§3-§5)
- The wiring contract (§6)
- The constants, traces, fail-soft (§7-§9)
- The canonical doc updates that ride along (§10)

**What we DON'T commit to here:**
- Order of implementation
- Time estimates
- CC vs Codex assignment
- Phase boundaries

---

## 12. Test strategy

Per `testing-patterns` skill. Cross-boundary tests are required for:

### Engine unit tests
- Choice resolution: probability tilt math; drift accumulator math; outcome band selection.
- Forecast band computation.
- Hand filter cascade (target match, cost, sphere, bond, place gating).
- Aftermath effect kind execution.
- Drift decay over ticks.
- Detection pressure accumulation and decay.
- Item consumption atomicity.

### Engine integration tests
- Full encounter run-through: select → progress beats → aftermath → state changes registered.
- Drift threshold crossing fires `archetype_drift_register` effect.
- Detection threshold crossing fires scripted rival-detection encounter.
- Item-consuming choice removes the item.
- Encounter graph node `gates_to` correctly unlocks downstream encounters.

### UI snapshot tests
- v7 layout at 1920×1080 viewport.
- Cast scaling: 0, 1, 4, 6 cast members.
- Hand: 0, 3, 7+ playable cards; dimmed cards render correctly.
- Drift indicator at each threshold tier.
- Detection thread at each pressure tier.
- Aftermath registration animations fire on each effect kind.

### Content lint tests
- Tooltip terms must reference graph entities.
- `moral_axis_pole` must be valid for the choice's reach.
- `consumes_item` must reference an item in the actor's possessions at scene start.
- Forecast factor strings must not include numbers.
- Prose must pass the meeting-encounter quality bar (heuristic: no flowery euphemism flag count above threshold).

### Playtest checks
- A new player opens an encounter cold and identifies the three primary affordances within 30 seconds (choice cards, hand, watch-only).
- Tooltip discoverability: 5+ players hover the dotted-underline within 60 seconds.
- The "your hand on her" feeling when a choice is committed: report as 4+/5 on subjective scale.

---

## 13. Phasing / rollout — deferred

See §11. Phasing exits this plan; child Linear issues are produced from a separate implementation phasing exploration after design-level approval.

---

## 14. Definition of Done

Per CLAUDE.md Definition of Done:

- [ ] All §3 (Engine) modules implemented, tested, integrated.
- [ ] All §5 (UI) components built, snapshot-tested at 1920×1080.
- [ ] All §4 (Content) authoring contract enforced via lint.
- [ ] §6 wiring: every module hits its orchestrator phase, UI component, GameState flow, traces, debug visibility, prose pipeline. `Docs/plans/wiring-checklist.md` updated.
- [ ] §7 constants live in `src/data/encounter-experience-constants.ts`.
- [ ] §8 traces wired and visible in DebugPanel.
- [ ] §9 fail-soft cases all have unit tests.
- [ ] §10 canonical doc updates merged.
- [ ] §11 migration phases complete; old encounters render correctly.
- [ ] §12 tests green; CI passing on `main`.
- [ ] §13 phases all in `Done` state in Linear.
- [ ] `Docs/changelog.md` updated.
- [ ] `Docs/project-status.md` updated with the encounter experience deliverable.
- [ ] Linear THR-300 closes via `Fixes THR-300` in merge commit.

---

## 15. Risks and watchpoints

1. **Drift balance.** The cumulative drift mechanic is novel. If thresholds are too low, the "becoming" events fire too often and lose weight. Too high, the moral cost is invisible. Mitigation: ship tunable constants (§7); playtest-tune.

2. **Tooltip and detail-page reading rhythm.** The intended pattern (Rule 4): player reads the prose, stops at dotted-underline terms, hovers for a taster, clicks for the detail page. Over time the player relies on this less as they internalize the concepts; for new players, complex situations, and generated content the depth stays available. The risk is the affordance not being legible at first encounter — players don't notice the dotted underlines or don't realise they can click. Mitigation: discoverable on the first encounter via a single targeted tooltip-and-click moment; modal-on-modal stacking is canonical so players who do click are not punished by losing context.

3. **The "lurker" player.** Some players will never click Ascendant cards because they don't trust they understand them. **Decision: defer the mitigation.** This game is for players who want to explore details. We don't try to coach the lurker in v1. Revisit if it shows up in playtest.

4. **Cast scaling.** The scene grows past comfortable cast tile count. **Mitigation per Rule 4: open detail/expansion modals on top rather than expanding the in-rail surface.** Humans read one UI at a time; modals deliver more content without crowding the primary frame. The cast tile rail stays at its natural size; clicking a cast member opens a detail modal. Editorial discipline (§2.5) keeps primary cast counts low.

5. **Migration content drift.** Existing 100+ encounters get default-inferred `moral_axis_pole`. Defaults won't always match author intent. Mitigation: editorial pass when migration phasing is planned (deferred — see §11).

6. **The Kokomoro voice.** Used elsewhere in the game; voice quality already validated. Use here as the encounter prose TTS surface. No special acceptance gate.

7. **Encounter format architecture cleanup.** Per §3.1, the migration to `UnifiedActionTemplate` is functionally complete but architectural cleanup lags (deprecated type still defined, CMS surfaces 8+ separate categories, stale doc claims). **Phase 0 cleanup work** is part of this plan's scope. Without it the architecture confusion compounds.

8. **Failure-as-complication discipline at content time.** Every encounter author must write a *better* failure than success. This is a content-authoring discipline that the editorial pass enforces. If most authors give up and write generic "she couldn't" failures, the principle dies. Mitigation: failure prose included in editorial rubric with the gate-encounter exemplar as quality bar.

9. **Click-through depth without lost context.** Players clicking from cast tile → faction detail → faction member detail → that member's previous encounter could lose track of where they were. Mitigation: modal stack always shows breadcrumb + "back" affordance; modal close always returns to the prior level cleanly; the underlying encounter state never advances while modals are open (turn-based confirmation).

---

## 16. NFP compliance summary

| Priority | Status | Note |
|---|---|---|
| 1. Tunability | ✅ PASS | Full constants table §7, all values named |
| 2. Inspectability | ✅ PASS | Trace types §8 with TS interfaces; DebugPanel inspectors specified |
| 3. Determinism | ✅ PASS | Same seed + same choice → same probability tilt + drift; PRNG callouts in resolution path |
| 4. Fail-soft | ✅ PASS | Failure modes table §9; tick loop never crashes |
| 5. Narrative over mechanical perfection | ✅ PASS | Drift mechanic is mechanically uneven (8 reaches × 2 poles, asymmetric) but narratively rich; we accept the unevenness |
| 6. Additive over destructive | ✅ PASS | All new node types are additive; existing edges remain valid; old encounter format renders via compatibility adapter |
| 7. Performance budget | ✅ PASS with note | Drift tracking adds per-agent state. Estimated ~24 bytes per agent per axis × 9 axes × N agents. At 1000 agents this is ~216KB — comfortably within budget. Detection pressure is per-region, smaller. Forecast computation is once per beat, negligible. |

---

## 17. Verdict status

Resolutions from the previous round:

- **(1) The seven decisions in §2.** Substantially revised:
  - 2.1 (encounter templates as graph nodes): kept
  - 2.2 (relationship state): kept
  - 2.3 (divine marks distinct primitive): **retracted** — fold into existing attachment with `source_god_id`
  - 2.4 (item consumption): kept
  - 2.5 (cast scaling tiered): **simplified** to editorial discipline, no collapse mechanism
  - 2.6 (place-of-power moves): kept, recontextualised as part of a flexible Ascendant filter surface
  - 2.7 (off-stage representation two patterns): **simplified** — two patterns retained but only when stakes-creating
  - 2.8 (place-specific encounters as authoring affordance): **new** — places become first-class authoring opportunities

- **(2) Moral axis as structural cost.** Confirmed. With the addition: scenes with two foregrounded reaches can specify dual-axis tilts, and the engine accumulates drift on both. Most scenes are single-axis; some are dual.

- **(3) Migration phasing.** Pulled. §11 and §13 deferred to a separate implementation phasing exploration after design approval.

**Three new things I want your verdict on:**

1. **Rule 4 (every primitive clickable, every node has a detail page) as a project-wide commitment.** This is the biggest structural addition this round — it expands beyond the encounter UI into a game-wide architectural rule. If you accept it, the encounter UI work will surface a modal-stack architecture and a Detail Page component pattern that other surfaces will inherit. If you want to scope it just to encounters, say so.

2. **Rule 3 reframe (verbs are encounter prose, not anchored to mechanics).** I rewrote it. The verb is independent of the reach + sphere + moral-axis-pole metadata. Encounter authors get full prose latitude; the engine reads the metadata for resolution. Confirm this matches your intent.

3. **Phase 0 architecture cleanup as in-scope.** §3.1 now treats the deprecated `EncounterTemplate` type, the CMS registry refactor, and the doc accuracy fix as Phase 0 work that rides along with this plan. If you'd rather split that into a separate ticket entirely, say so. My recommendation: keep it in scope — it's small enough that splitting adds coordination cost without proportional benefit.

Once these land, the plan is design-approved and we move to the implementation phasing exploration.
