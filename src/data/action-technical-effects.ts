/**
 * Action Technical Effects (THR-604) — authored `technicalEffect` backfill.
 *
 * A single, reviewable source of truth for the wiki-facing technical game-effect
 * statement of every ascendant-facing action template. Applied as a final
 * transform when `UNIFIED_ACTION_TEMPLATES` is assembled (see
 * `unified-action-templates.ts`), so the string lands on `template.technicalEffect`
 * and the action-catalog generator emits it verbatim.
 *
 * AUTHORING CONTRACT (mirrors the field doc on `UnifiedActionTemplate.technicalEffect`):
 *   • 1–3 sentences, technical game-mechanical register — name the state that
 *     changes (node property, edge, condition, resource, hex-tile field,
 *     visibility), the direction/nature of the change, and duration/persistence.
 *   • SOURCED FROM THE RESOLVING CODE, not paraphrased from the flavor `description`.
 *     Each entry was written by reading the template's step GraphOps, its
 *     `controlSpec`, or the engine bridge that implements its id.
 *   • MAGNITUDES STAY SYMBOLIC — name the constant or say "scales with X", never a
 *     literal number (constants are tunable, NFP #1).
 *   • For the genuine no-ops (empty step ops, no controlSpec, no engine bridge) the
 *     text states the *intended* effect; the catalog's `none` badge marks it
 *     unimplemented. Text + badge together are honest. (THR-605 tracks wiring them.)
 *   • NEVER AUTHOR AN ENTRY FOR A TEMPLATE THAT ALREADY CARRIES ITS OWN
 *     `technicalEffect` (THR-1075). The assembly transform prefers the template's
 *     field, so such an entry reaches no consumer — it is invisible, and being
 *     invisible it rots. That is not hypothetical: THR-605 wired six verbs and
 *     wrote correct strings onto the templates, and all six stale "NOT YET WIRED"
 *     entries survived here for months, telling the player the exact inverse of
 *     what the action did. When you wire a verb, either update its entry here or
 *     move the text onto the template — never both. `action-technical-effects-wiring.test.ts`
 *     pins both halves: no shadowed entry, and no unwired disclaimer on a wired verb.
 *
 * Keyed by template id. An id absent from this map renders "—" + `unauthored` in
 * the catalog — a visible gap, not a crash. An id whose template authors its own
 * `technicalEffect` belongs absent for exactly that reason.
 */

export const ACTION_TECHNICAL_EFFECTS: Readonly<Record<string, string>> = {
  // ─── action.* — reach CRUD verbs (step GraphOps) ───────────────────────────
  'action.iron.raise-force':
    'On success, spawns a new militia `agent` node affiliated with the actor and adds a `commands` edge to the target location. On failure, the actor loses a small amount of reputation.',
  'action.iron.assess-threat':
    "A read action: on success, stamps `scouted` and a calculated `threatLevel` onto the target node. On failure, the actor's insight dips slightly.",
  'action.iron.fortify':
    "On success, raises the target location's `defense` and sets `fortified`. On failure, the location's defense is reduced instead.",
  'action.iron.conquer':
    'On success, removes the target node and adds a `controls` edge from the actor to the location. On failure, the actor loses morale.',
  'action.gold.establish-trade':
    "On success, adds a `trades_with` edge to the target and raises the actor's `wealth`. On failure, the actor's wealth dips slightly.",
  'action.gold.survey-resources':
    "A read action: on success, sets `resourcesKnown` on the target location. On failure, the actor's insight dips.",
  'action.gold.trade':
    "On success, raises the `volume` on the existing `trades_with` edge to the target. On failure, the actor's wealth dips.",
  'action.gold.disrupt-trade':
    "On success, removes the target's `trades_with` edge and reduces the target's `wealth`. On failure, the actor's reputation drops.",
  'action.gold.negotiate-agreement':
    "On success, creates a treaty `attachment` node binding actor and target and nudges the actor's `wealth` up. On failure, the actor's reputation dips.",
  'action.gold.tax-trade-route':
    "On success, stamps the actor as controller and a `taxRate` onto the `trades_with` edge and raises the actor's `wealth`. On failure, reputation dips.",
  'action.gold.break-agreement':
    "On success, removes the actor's `party_to` edge to the target, reduces the target's `wealth`, and costs the actor reputation. On failure, reputation still dips.",
  'action.gold.hire-mercenaries':
    "On success, mints a retainer `attachment` (an Iron-capable hired force, time-limited) bound to the actor and spends the actor's `wealth`. On failure, a smaller wealth loss.",
  'action.gold.commission-assassination':
    "On success, removes the target node and spends the actor's `wealth`. On failure, the actor loses reputation and some wealth.",
  'action.gold.buy-influence':
    "On success, raises `sentiment` on the actor's `relates_to` edge to the target and spends `wealth`. On failure, reputation and wealth both dip.",
  'action.gold.fund-construction':
    "On success, adds a market-district `location` (sublocation) under the target location and spends the actor's `wealth`. On failure, a smaller wealth loss.",
  'action.gold.establish-monopoly':
    "On success, stamps monopoly control and a negative `prosperityDelta` on the location, sours local `sentiment`, and spends heavy `wealth`. On failure, reputation and wealth dip.",
  'action.shadow.establish-network':
    'On success, spawns a hidden `agent` node allied to the actor and adds a `controls` edge to the location. On failure, the actor loses security.',
  'action.shadow.spy':
    "A read action: on success, flips the target's `secret` to revealed. On failure, the actor's security dips.",
  'action.shadow.recruit-agent':
    "On success, adds a secret `serves` edge from the target to the actor. On failure, the actor's reputation dips.",
  'action.shadow.assassinate':
    'On success, removes the target node. On failure, the actor loses security.',
  'action.veil.cast-spell':
    "On success, adds an `enchanted_by` edge (spell magic) to the target. On failure, the actor's mana dips.",
  'action.veil.detect-magic':
    "A read action: on success, sets `magicRevealed` on the target. On failure, the actor's insight dips.",
  'action.veil.modify-enchantment':
    "On success, raises the `strength` on the target's `enchanted_by` edge. On failure, the actor's mana dips.",
  'action.veil.dispel':
    "On success, removes the target's `enchanted_by` edge. On failure, the actor's mana dips.",
  'action.heart.forge-alliance':
    "On success, adds an `allied_with` edge to the target. On failure, the actor's reputation dips.",
  'action.heart.assess-loyalty':
    "A read action: on success, sets `loyaltyKnown` on the target. On failure, the actor's insight dips.",
  'action.heart.inspire':
    "On success, raises the target's `morale` and adds an `inspired_by` edge. On failure, the actor's own morale dips.",
  'action.heart.betray':
    "On success, removes the `allied_with` edge and drops the target's `morale`. On failure, the actor loses reputation.",
  'action.eye.research':
    "On success, adds a deep `investigates` edge to the target. On failure, the actor's insight dips.",
  'action.eye.investigate':
    "A read action: on success, sets `investigated` on the target. On failure, the actor's insight dips.",
  'action.eye.refine-knowledge':
    "On success, deepens the `depth` on the target's `investigates` edge. On failure, the actor's wisdom dips.",
  'action.eye.suppress-knowledge':
    "On success, removes the target's `investigates` edge. On failure, the actor's reputation dips.",
  'action.stone.build':
    "On success, adds a construction `location` node built by the actor. On failure, the actor's resources dip.",
  'action.stone.assess-structure':
    "A read action: on success, sets `assessed` on the target. On failure, the actor's insight dips.",
  'action.stone.repair':
    "On success, raises the target's `integrity`. On failure, the target's integrity is reduced instead.",
  'action.stone.demolish':
    "On success, removes the target node. On failure, the actor's resources dip.",
  'action.star.consecrate':
    "On success, adds a sacred `blessed_by` edge to the target. On failure, the actor's faith dips.",
  'action.star.divine':
    "A read action: on success, sets `divined` on the target. On failure, the actor's insight dips.",
  'action.star.deepen-faith':
    "On success, raises the target's `faith`. On failure, the actor's faith dips.",
  'action.star.desecrate':
    "On success, removes the target's `blessed_by` edge. On failure, the actor's faith dips.",
  'action.flesh.heal':
    "On success, raises the target's `health`. On failure, the actor's vitality dips.",
  'action.flesh.diagnose':
    "A read action: on success, sets `ailmentKnown` on the target. On failure, the actor's insight dips.",
  'action.flesh.cultivate':
    "On success, raises the target's `vitality`. On failure, the target's vitality is reduced instead.",
  'action.flesh.plague':
    "On success, sharply reduces the target's `health`. On failure, the actor takes a health backlash.",

  // ─── divine.* — cosmic influence verbs (apply_influence on an agent) ───────
  'divine.dream':
    "Applies a divine influence (interventionType `dream`, Mind sphere) to the target agent — a decaying `Influence` on their decision loop that biases behaviour and axiological drift until it lapses. Does not mutate the graph directly.",
  'divine.persuade':
    'Applies a divine influence (interventionType `persuade`, Spirit sphere) to the target agent, biasing their decision-making until the influence decays.',
  'divine.deceive':
    'Applies a divine influence (interventionType `deceive`, Mind sphere) to the target agent, biasing their decision-making until the influence decays.',
  'divine.intimidate':
    'Applies a divine influence (interventionType `intimidate`, Force sphere) to the target agent, biasing their decision-making until the influence decays.',
  'divine.inspire':
    'Applies a divine influence (interventionType `inspire_intervention`, Life sphere) to the target agent, biasing their decision-making until the influence decays.',
  'divine.coincidence':
    'Applies a divine influence (interventionType `coincidence`, Time sphere) to the target agent, biasing their decision-making until the influence decays.',
  'divine.omen':
    'Applies a divine influence (interventionType `omen`, Spirit sphere) to the target agent, biasing their decision-making until the influence decays.',
  'divine.afflict_bless':
    'Applies a divine influence (interventionType `afflict_bless`, Life sphere) to the target agent, biasing their decision-making until the influence decays.',
  'divine.rekindle_thread':
    "Fires the `quintessence_restore` graph-op on the target mortal (THR-773). Raises their `quintessence` to REKINDLE_RESTORE_TO_RATIO × `quintessenceMax`, deletes the `brokenSince` stamp so `isBrokenMortal` releases immediately rather than waiting a tick for the quintessence phase to reconcile, and writes `rekindledBy`/`rekindledAtTick` plus a `recent_event` naming the restoration. Unlike the influence verbs above it does not decay — the restore is permanent, and the mortal can be worn back down normally afterwards. Routes through the resolution-intercept path (not the graph executor) because the receipt needs full GameState. Fail-soft: a missing target, a non-actor target, or a mortal already at or above the restore ratio is a no-op.",

  // ─── divine.self.* — self-directed post-processors ────────────────────────
  'divine.self.stillness':
    "Post-processed after resolution: restores the ascendant's own essence pool for its primary sphere by STILLNESS_ESSENCE_REGEN, clamped to `maxEssence`. No world-graph change.",
  'divine.self.recede':
    "Stores a `nextActionDiscount` (RECEDE_DISCOUNT_FRACTION) on the ascendant node — the next divine action's essence cost is reduced by that fraction. Self-only.",
  'divine.self.focus':
    "Stores a `nextActionTierBoost` (FOCUS_TIER_BOOST) on the ascendant node — the next action is promoted by that many rarity/attention tiers. Self-only.",
  'divine.self.reveal':
    "Post-processed after resolution: manifests the ascendant's avatar openly at the avatar's hex, projecting a divine-presence effect from that location. No-op when the ascendant has no avatar.",

  // ─── divine.perceive.* / divine.relay.* — Ruins-layer bridges ─────────────
  'divine.perceive.cast_attention':
    'Engine bridge (perceiveRelay): on a hex carrying a ruin, seeds a `vague` `knows_clue_of` edge to that ruin on a bonded agent within the adjacency gate, chosen by Narrative Gravity. No-op without a ruin or an adjacent bonded agent.',
  'divine.perceive.refine_the_hush':
    'Engine bridge: upgrades an existing `vague` `knows_clue_of` edge (bonded agent → ruin on the hex) to `narrowed` precision; if none exists, seeds a fresh narrowed clue via Narrative Gravity.',
  'divine.perceive.listen_for_a_name':
    "Engine bridge: seeds a `narrowed` `knows_clue_of` edge on a bonded agent that also carries the ruin's `originCultureId` in its detail. No-op without a ruin or adjacent bonded agent.",
  'divine.perceive.read_the_threads':
    'Engine bridge: on a hex hosting a Place of Power, seeds a `vague` clue about it to any threaded agent (no adjacency gate). No-op when the hex has no Place of Power.',
  'divine.perceive.taste_the_wake':
    "Engine bridge (read): scans agents on the hex for unrevealed `divine_mark` `knows_secret_of` edges and surfaces them via trace — exposing rival gods' marks. No graph mutation; no-op without an adjacent bonded agent.",
  'divine.relay.compose_a_clue':
    'Engine bridge: creates a `narrowed` `knows_clue_of` edge (bonded agent → a ruin) directly, bypassing Narrative Gravity, and leaves a `divine_mark` `knows_secret_of` edge on the agent. No-op if the agent is not bonded or no ruin exists.',
  'divine.relay.whisper_the_direction':
    "Engine bridge: overrides the bonded agent's `movementState.destinationId` to the nearest ruin (by hex distance), clearing their movement queue. No-op if the agent is not bonded or no other ruin exists.",

  // ─── action.social.* / action.secrets.* / action.divine-edict ─────────────
  'action.social.tip_scales':
    "On success, raises the target's `socialLeverageShift` — biasing the target toward the caster's side in social-leverage contests.",
  'action.social.embolden':
    'On success, sets `counterResistanceActive` on the target, hardening them against an opponent counter-move in the social contest.',
  'action.secrets.reveal_secret':
    "On success, flips the actor's highest-magnitude unrevealed `knows_secret_of` edge about the target to `revealed` — publicising held leverage. No-op if the actor holds no unrevealed secret on the target.",
  'action.secrets.call_in_favor':
    "On success, redeems the target's best unredeemed, unbroken `owes_favor` edge directed at the actor (sets `redeemed`). No-op if no redeemable favor is owed.",
  'action.secrets.plant_secret':
    'On success, fabricates a `knows_secret_of` edge (actor → target, `planted`, unrevealed) of the given `secretType` and magnitude — false leverage that reads as real until investigated.',
  'action.divine-edict':
    "On success, raises the target's `conclaveLeverageShift` — tilting a conclave/court leverage contest toward the caster.",

  // ─── action.faction.* — faction governance verbs ──────────────────────────
  'action.faction.stir_dissent':
    "Faction verb (`stir_dissent`): raises the faction's `dissentLevel` by STIR_DISSENT_INCREMENT (clamped to 1). The dissent tick-phase decays and threshold-checks the level, and may seed a member encounter when the bar is crossed.",
  'action.faction.whisper_leader':
    "Faction verb (`whisper_leader`): sets a `divine_whisper_pending` condition and a preferred leadership pole on the faction's leader, nudging their next governance stance. Conflicts with another god's pending whisper are flagged for chronicle prose.",
  'action.faction.recover_doctrine':
    "Faction verb (`recover_doctrine`): consumes a doctrine clue, stamps `recoveredDoctrineId` + expiry on the faction, seeds a doctrine-surfaces encounter on the leader (or anointed champion), and temporarily realigns `reputationAlignment` when the clue carries a realignment.",
  'action.faction.surface_doubter':
    "Faction verb (`surface_doubter`): marks the faction's most axiologically misaligned member with the `surfaced_by_divine_attention` condition, plants a delayed doubter-chooses encounter, and nudges `dissentLevel` up by a small amount.",
  'action.faction.kindle_a_calling':
    "Faction verb (`kindle_a_calling`): biases the faction's latent ambition candidates, draws one via seeded PRNG, replaces the faction's `pursues` edge (unless army-locked), and plants the calling-named encounter on the leader.",
  'action.faction.schism':
    'On success, marks the target faction with a pending schism resolving after SCHISM_PENDING_DURATION_TICKS (snapshotting baseline cohesion); the schism tick-phase later resolves it into a split. Idempotent — re-casting resets the timer without stacking.',
  'action.faction.anoint_successor':
    "On success, adds a `will_succeed` edge (target → faction) stamped with `anointedTick`; the succession resolver sorts by most-recent tick, so re-anointment supersedes. Append-only — no prior edge removed.",

  // ─── action.anoint-champion / beat verbs (imbue/bestow/consecrate/anoint) ──
  'action.anoint-champion':
    "On success, writes a time-limited `championBlessing` onto the target (a duration plus a faction-reputation-gain multiplier and an encounter-score boost). Expires when its `ticksRemaining` runs out.",
  'action.imbue':
    "Beat verb: appends a sphere-flavored `AttachmentEffect` (drawn from the ascendant's primary sphere) to the target artifact's `effects` array. The effect is then read by the standard effect resolver into the holder's modifiers. No-op if the target is not an artifact or the ascendant has no sphere.",
  'action.bestow':
    "Beat verb: mints a 'Divine Gift' artifact bound to the threaded agent via a `possesses` edge, carrying a passive reach bonus (BESTOW_REACH_BONUS in the ascendant's primary reach) and a per-tick quintessence regen (BESTOW_QUINTESSENCE_REGEN). Gated on thread awareness ≥ BESTOW_MIN_AWARENESS; no-op otherwise.",
  'action.consecrate':
    "Sustained: on success spawns a `ControlEffect` that hallows the site, projecting a per-tick thread aura at a per-tick Spirit essence cost. Persists (ticked by phaseControlEffects) until essence lapses or it is deliberately broken.",
  'action.consecrate-relic':
    "Sustained: like Consecrate but mints an upkeep relic ('Hallowed Reliquary') that sustains the hallowing without ongoing essence — the consecration holds while the relic exists and ends if the relic is undone.",
  'action.anoint':
    "Beat verb: stamps a `chosen` status on the target faction node (recording the ascendant's primary-reach power from the chosen-power table). The per-tick `phaseChosenFactionPowers` then grants the faction's members a power-keyed reputation gain each tick.",

  // ─── artifact.* — attachment verbs ────────────────────────────────────────
  'artifact.enchant':
    "On success, advances the target artifact one attachment tier (Mundane→Storied→Mythic→Legendary) via the `advance_artifact_tier` step op, scaling its `stat_contribution` effects by TIER_MODIFIER_SCALE_FACTOR — clamped to ITEM_STAT_BAND_LEGENDARY — so the item really is mightier on the bearer's sheet. No-ops on an artifact already at Legendary.",
  'artifact.empower':
    "Enchant's martial counterpart, reached through Iron rather than Veil: the same `advance_artifact_tier` step op and the same authored tier costs, so a war-god can grow a blade without borrowing rune-craft.",
  // artifact.attune / artifact.nullify / artifact.curse: THR-605 wired all three,
  // and each template now authors its own code-sourced `technicalEffect`. Removed
  // here (THR-1075) rather than rewritten — see the no-shadowing rule above.

  // ─── loc.* / sub.* — location & sublocation property mutations ────────────
  'loc.ward':
    "On success, raises the target location's `magicalSaturation` by a named delta (LOC_… ward constant). One-shot property mutation.",
  'loc.place_of_power':
    "On success, raises the target location's `magicalSaturation` by a larger named delta, seeding it toward Place-of-Power status.",
  'loc.incite_unrest':
    "On success, raises the target location's `unrest` by a named delta, pushing it toward defection/sacking thresholds read elsewhere.",
  // loc.fortify: THR-605 wired it (`fortify_location`); the template authors its
  // own `technicalEffect`. Removed here (THR-1075) — see the no-shadowing rule.
  'loc.bless_harvest':
    "On success, raises the location's `prosperity` and `populationHealth` by named deltas (LOC_BLESS_HARVEST_*) for LOC_BLESS_HARVEST_DURATION_TICKS, and swells every staple resource's stock toward Glut (LOC_BLESS_HARVEST_STOCK_DELTA) — the coarse stock tier re-derives next tick.",
  'loc.blight':
    "On success, lowers the location's `prosperity` and `populationHealth` by named deltas (LOC_BLIGHT_*) and draws every staple resource's stock toward Famine (LOC_BLIGHT_STOCK_DELTA) — the inverse of Bless the Harvest; the coarse stock tier re-derives next tick.",
  'loc.reveal_vein':
    "On success, surfaces a terrain-appropriate non-staple resource deposit at the location (quantity LOC_REVEAL_VEIN_QUANTITY), or swells the poorest existing eligible deposit by LOC_REVEAL_VEIN_BOOST — the stock tier re-derives next tick.",
  'loc.guide_caravan':
    "On success, every trades_with route touching the location gains LOC_GUIDE_CARAVAN_VOLUME_DELTA volume (clamped at the route max), sheds its `threatened` mark, and counts as freshly traded (lastTraded = now) — protecting it from decay and banditry re-rolls.",
  'loc.sour_mine':
    "On success, drains every non-staple resource deposit at the location by LOC_SOUR_MINE_STOCK_DELTA (staples untouched) — the strategic/luxury inverse of Blight; the stock tier re-derives next tick.",
  'loc.open_markets':
    "On success, raises the location's `prosperity` and lowers its `unrest` by named deltas (LOC_OPEN_MARKETS_*).",
  'loc.sanctify_square':
    "On success, raises the location's `magicalSaturation` and `divinePresence` by named deltas — establishing a minor sacred site.",
  'loc.awaken_spirit':
    "On success, raises the location's `divinePresence` by a named delta (LOC_AWAKEN_SPIRIT_PRESENCE_DELTA).",
  'loc.sicken_wells':
    "On success, lowers the location's `populationHealth` and `magicalSaturation` and raises `unrest` by named deltas (LOC_SICKEN_WELLS_*) for LOC_SICKEN_WELLS_DURATION_TICKS.",
  'loc.curse_roads':
    "On success, raises the location's `unrest` by a named delta (LOC_CURSE_ROADS_UNREST_DELTA) for LOC_CURSE_ROADS_DURATION_TICKS.",
  'sub.sanctify':
    'INTENDED: consecrate a sublocation into a lasting point of divine presence that draws the faithful and repels hostiles. NOT YET WIRED — empty step ops, no engine bridge (only a sphere-alignment availability gate); deducts essence and narrates only (THR-605).',
  // sub.trap / sub.vision: THR-605 wired both (`plant_trap` via
  // unifiedActionResolution, `scry_sublocation` via graphOpExecutor); each
  // template authors its own `technicalEffect`. Removed here (THR-1075).
  'sub.sanctify_tavern':
    'INTENDED: bless a tavern to concentrate social energy — drawing agents from neighbouring hexes and amplifying the local social-encounter rate. NOT YET WIRED — empty step ops, no engine bridge; deducts essence and narrates only (THR-605).',

  // ─── hex.* — one-shot tile mutations & GraphOp bridges (hexActionBridge) ───
  'hex.bless_land':
    "Engine bridge: on success, raises the target hex-tile's `divineInfluence` by HEX_BLESS_INFLUENCE_DELTA (a `HexMutation` applied in phaseHexState). No effect on failure.",
  'hex.corrupt_land':
    "Engine bridge: on success, raises the hex-tile's `corruption` by HEX_CORRUPT_CORRUPTION_DELTA. No effect on failure.",
  'hex.survey':
    "Engine bridge (read): on success, reveals the `land` and `people` narrative layers of the hex (hexRevelation map) and uncovers any hidden sublocations on it. No tile mutation.",
  'hex.seed_life':
    "Engine bridge: on success, raises the hex-tile's `divineInfluence` by HEX_SEED_INFLUENCE_DELTA. No effect on failure.",
  'hex.raise_landmark':
    "Engine bridge: on success, raises the hex-tile's `divineInfluence` by HEX_RAISE_LANDMARK_INFLUENCE_DELTA. No effect on failure.",
  'hex.dowse_resources':
    'Engine bridge (read): on success, reveals the hex’s `land` narrative layer and uncovers hidden resource sublocations. No tile mutation.',
  'hex.shift_season':
    "Engine bridge: on success, raises the hex-tile's `divineInfluence` by HEX_SHIFT_SEASON_INFLUENCE_DELTA. No effect on failure.",
  'hex.scorch_earth':
    "Engine bridge: on success, raises the hex-tile's `corruption` by HEX_SCORCH_EARTH_CORRUPTION_DELTA. No effect on failure.",
  'hex.rend_earth':
    "Engine bridge: on success, raises the hex-tile's `corruption` by HEX_REND_EARTH_CORRUPTION_DELTA (the heaviest one-shot corruption delta). No effect on failure.",
  'hex.attune_leyline':
    "Engine bridge: on success, raises the hex-tile's `divineInfluence` by HEX_ATTUNE_LEYLINE_INFLUENCE_DELTA. No effect on failure.",
  'hex.forge_seer_token':
    "Engine bridge: on success, spawns a divination-focus `artifact` node ('Seer's Token') and binds it to the actor via a `possessed_by` edge.",
  'hex.read_currents':
    'Engine bridge (read): on success, reveals the hex’s `soul` narrative layer and uncovers hidden sites. No tile mutation.',
  'hex.shift_dominion':
    "Engine bridge: on success, on each location on the hex boosts the `resonance` sphere-influence by SHIFT_DOMINION_BOOST and reduces the dominant sphere by SHIFT_DOMINION_REDUCTION (via location `update_node` ops).",
  'hex.amplify_flow':
    "Engine bridge: on success, raises `magicalSaturation` on every location on the hex by AMPLIFY_FLOW_SATURATION_BOOST.",
  'hex.sever_flow':
    "Engine bridge: on success, raises the hex-tile's `corruption` by HEX_SEVER_FLOW_CORRUPTION_DELTA. No effect on failure.",
  'hex.dispel_wild':
    "Engine bridge: on success, raises the hex-tile's `divineInfluence` by HEX_DISPEL_WILD_INFLUENCE_DELTA. No effect on failure.",
  'hex.send_herald':
    "Engine bridge: on success, spawns a herald `agent` node at a location on the hex, places it there (`located_at`), and threads it to the actor (auto-resolve tier-1 thread).",
  'hex.forge_instrument':
    "Engine bridge: on success, spawns a ritual-focus `artifact` node ('Divine Instrument') bound to the actor via a `possessed_by` edge.",
  'hex.spark_encounter':
    "Engine bridge: on success, creates a `divine_spark` `event` node at the first location on the hex and links it with an `occurred_at` edge. No-op if the hex has no locations.",
  'hex.stir_people':
    "Engine bridge: on success, applies a `stir_people` Spirit influence (axiological drift toward novelty, away from ruthlessness) to every agent on the hex.",
  'hex.summon_congregation':
    "Engine bridge: on success, applies a short `summon_congregation` Spirit influence (SUMMON_CONGREGATION_STRENGTH) to every agent on the hex, tagging them `summoned`.",
  'hex.bestow_vision':
    "Engine bridge: on success, applies a strong `bestow_vision` Mind influence (BESTOW_VISION_STRENGTH, drift toward courage) to the first agent on the hex.",
  'hex.scatter':
    "Engine bridge: on success, raises the hex-tile's `corruption` by HEX_SCATTER_CORRUPTION_DELTA. No effect on failure.",
  'hex.smite':
    "Engine bridge: on success, raises the hex-tile's `corruption` by HEX_SMITE_CORRUPTION_DELTA. No effect on failure.",
  'hex.incite_exodus':
    "Engine bridge: on success, applies an `incite_exodus` Entropy influence (INCITE_EXODUS_STRENGTH, drift away from survival, toward ambition) to every agent on the hex.",
  'hex.mark_ground':
    "Engine bridge: on success, raises the hex-tile's `explorationAttraction` by MARK_GROUND_ATTRACTION_STRENGTH, drawing wandering agents toward it.",
  'hex.plant_dream':
    "Engine bridge: on success, applies a `plant_dream` Mind influence to the first agent on the hex and grants them a temporary `ruin_seeker` (‘Dream of Buried Places’) trait that expires after a set number of ticks.",
  'hex.read_stones':
    'Engine bridge (read): on success, reveals the hex’s `ruins` narrative layer (full detail) and uncovers hidden ruin sites. No tile mutation.',
  'hex.whisper_intuition':
    "Engine bridge: on success, writes a time-limited `divineHunch` (WHISPER_INTUITION_HUNCH_STRENGTH) onto the thread edge to the first agent on the hex, and reveals the hex’s `ruins` layer partially. No-op without a threaded agent.",
  'hex.consecrate_past':
    "Engine bridge: on success, raises the hex-tile's `divineInfluence` by HEX_CONSECRATE_PAST_INFLUENCE_DELTA. No effect on failure.",
  'hex.restore_fragment':
    "Engine bridge: on success, mints a permanent `sublocation-type.ruins` sublocation named “Restored Fragment” under a place-tier location on the hex — preferring a ruins location — attached by a `contains` edge from that parent. No-op on a hex holding no place-tier location.",
  'hex.rewrite_history':
    "Engine bridge: on success, updates the target location's `culturalLegacy` to `rewritten` and stamps the rewrite tick.",
  'hex.bury_past':
    "Engine bridge: on success, raises the hex-tile's `corruption` by HEX_BURY_PAST_CORRUPTION_DELTA. No effect on failure.",
  'hex.desecrate':
    "Engine bridge: on success, raises the hex-tile's `corruption` by HEX_DESECRATE_CORRUPTION_DELTA. No effect on failure.",

  // ─── hex.* — sustained control effects (controlSpec, phaseControlEffects) ──
  'hex.claim_dominion':
    'Sustained: spawns a `ControlEffect` that proclaims divine dominion, adding a small per-tick `divineInfluence` mutation at a per-tick Spirit cost. Persists until essence lapses or a rival usurps (Star ≥ t2) / destroys (Iron ≥ t1) it.',
  'hex.cultivate':
    'Sustained: `ControlEffect` adding a small per-tick `divineInfluence` mutation at a per-tick Life cost, accelerating prosperity growth on the hex’s locations. Persists until it lapses or is destroyed (Iron ≥ t1).',
  'hex.claim_resource':
    'Sustained: `ControlEffect` binding a discovered resource deposit — generates per-tick Matter income at a per-tick Matter cost. Persists until it lapses, is usurped (Gold ≥ t2), or destroyed (Stone ≥ t1).',
  'hex.anchor_sphere':
    "Sustained: `ControlEffect` locking the hex's dominant sphere in place (blocks rival Shift Dominion) at a per-tick Spirit cost, held only while the hex's `divineInfluence` stays above its sustain threshold. Usurp Veil ≥ t3 / destroy Veil ≥ t2.",
  'hex.tap_source':
    'Sustained: `ControlEffect` siphoning a sphere-aligned source — generates per-tick Spirit income at a smaller per-tick Spirit cost. Persists until it lapses, is usurped (Veil ≥ t2, Spirit-aligned), or destroyed (Iron ≥ t2).',
  'hex.attune_thread':
    "Sustained: `ControlEffect` on the threaded agent granting passive sphere-perception wherever they walk, at a per-tick Spirit cost. Persists until it lapses or is destroyed (Veil ≥ t2).",
  'hex.channel_current':
    'Sustained: `ControlEffect` redirecting sphere influence from adjacent hexes toward this one via a per-tick `divineInfluence` mutation, at a per-tick Spirit cost. Usurp Veil ≥ t3 / destroy Veil ≥ t2.',
  'hex.shepherd_flock':
    'Sustained: `ControlEffect` applying steady conversion pressure — agents on the hex drift toward worship of the ascendant’s sphere — at a per-tick Spirit cost. Usurp Heart ≥ t2 (Spirit-aligned) / destroy Shadow ≥ t2.',
  'hex.install_champion':
    "Sustained: `ControlEffect` elevating the chosen agent to faction leadership under divine mandate at a per-tick Spirit cost; neglect (lapse) risks betrayal or deposition. Usurp Shadow ≥ t3 / destroy Iron ≥ t2.",
  'hex.strengthen_thread':
    "Sustained: `ControlEffect` enhancing the threaded agent's capability in a flexible reach at a per-tick Spirit cost. Persists until it lapses or is destroyed (Veil ≥ t2).",
  'hex.impose_decree':
    'Sustained: `ControlEffect` imposing a behavioural constraint on all agents at the hex (high-independence agents resist) at a per-tick Spirit cost. Usurp Shadow ≥ t3 / destroy Heart ≥ t2.',
  'hex.bind_echoes':
    'Sustained: `ControlEffect` binding the hex’s ruins as an influence node (enables elder-magic tapping, resists rival interference) via a small per-tick `divineInfluence` mutation at a per-tick Spirit cost. Usurp Veil ≥ t2 / destroy Iron ≥ t2.',
  'hex.compel_exploration':
    "Sustained: `ControlEffect` compelling threaded agents toward the ruins at a per-tick Mind cost. Persists until it lapses or is destroyed (Heart ≥ t2).",
  'hex.seal_tomb':
    "Sustained: `ControlEffect` sealing the ruins so nobody (including the caster) may enter — a cheap denial play — at a per-tick Spirit cost. Persists until it lapses or is destroyed (Stone ≥ t2).",
  'hex.ward_against_deep':
    "Sustained: `ControlEffect` wrapping the exploring agent so ruin encounter danger is reduced for them, at a per-tick Spirit cost. Persists until it lapses or is destroyed (Veil ≥ t3).",

  // ─── action.initiative.* / action.mentorship.* — social property nudges ────
  'action.initiative.inspire':
    "On success, writes an `initiativeInspireBonus` onto the target — boosting their initiative in the relevant contest.",
  'action.initiative.sabotage':
    "On success, sets `initiativeSabotaged` on the target, undercutting their next initiative attempt.",
  'action.mentorship.inspire':
    "On success, writes a `mentorshipInspireBonus` onto the target mentee.",
  'action.mentorship.sever':
    "On success, flags `pendingMentorshipSever` on the target — queuing the mentorship bond to be cut.",

  // ─── threads — bind / manage ──────────────────────────────────────────────
  'bind_thread_location':
    'On success, adds a tier-1 `thread` edge (auto-resolve) from the ascendant to the target location, opening the divine connection at baseline strength.',
  'bind_thread_faction':
    'On success, adds a tier-1 `thread` edge (auto-resolve) from the ascendant to the target faction.',
  'bind_thread_army':
    'On success, adds a tier-1 `thread` edge (auto-resolve) from the ascendant to the target army.',
  'bind_thread_artifact':
    'On success, adds a tier-1 `thread` edge (auto-resolve) from the ascendant to the target artifact.',
  'bind_thread_agent':
    'On success, adds a tier-1 `thread` edge (auto-resolve) from the ascendant to the target agent.',
  'bind_thread_agent_strong':
    'On success, adds a `thread` edge at tier 2 (a stronger initial bond than the standard tier-1 bind) from the ascendant to the target agent.',
  'thread.dormant':
    "On success, sets the thread edge's `courtPosition` to `dormant` — parking the bond so it consumes no active court attention.",
  'thread.reactivate':
    "On success, sets the thread edge's `courtPosition` to `retinue` — pulling a dormant bond back into the active court.",

  // ─── revelation actions (revelationAction dispatch, aftermath) ────────────
  'observe_agent':
    "On success, dispatches the `observe` revelation action (revelationEmitter) — surfacing lightweight intelligence about the target agent. No direct graph mutation from the template; effect flows through resolveRevelationAction.",
  'scry_agent':
    'On success, dispatches the `scry` revelation action — a deeper read of the target agent than Observe. Effect flows through resolveRevelationAction.',
  'whisper_insight':
    'On success, dispatches the `whisper_insight` revelation action, delivering an insight to the target. Effect flows through resolveRevelationAction.',
  'dream_sending':
    'On success, dispatches the `dream_sending` revelation action, planting a dream-borne message on the target. Effect flows through resolveRevelationAction.',
};
