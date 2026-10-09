/**
 * UI Content Package — Tooltip strings for UI-system elements.
 *
 * CONTENT MANAGER: This is the file you edit to change tooltip text
 * for UI buttons, panels, and controls. Game-entity tooltips (spheres,
 * reaches, archetypes) are resolved from their respective content
 * packages — do NOT duplicate them here.
 */

import type { TooltipContent } from '../types/tooltip';
import type { CampbellianPhase } from '../types/influence';
import { buildReachTierTooltips } from './ascendant-reach-register';
import { REACH_COPY } from './ascendant-bar-content';
import { NUDGE_CARD_TYPES } from './nudge-card-library';

/**
 * THR-1716 — the first-run Play prompt's caption, shown in the time control's status
 * line until the clock runs for the first time. Second person: it is the god's own
 * control (Law 42).
 */
export const FIRST_RUN_PROMPT_CAPTION = 'Time is still. Press Play or Space to let the world move.';

/**
 * THR-1788 — the stage of a threaded mortal's story, as the journey vignette footer names it.
 * A word with its article, never the engine's beat index (Law 13): "Beat 1" read as a tutorial
 * step. Not "chapter" — in the glossary a Chapter is an encounter's readable record.
 */
export const JOURNEY_STAGE_LABELS: Record<CampbellianPhase, string> = {
  call: 'The Call',
  road_of_trials: 'The Road of Trials',
  crisis: 'The Crisis',
  ordeal: 'The Ordeal',
  return: 'The Return',
};

/** THR-1716 — the remembrance's undo while a chosen picture holds before the flow moves on. */
export const REMEMBRANCE_CHOOSE_AGAIN = 'Choose again';

export const UI_TOOLTIPS: Record<string, TooltipContent> = {
  // ─── Core HUD ──────────────────────────────────────────────────
  'ui.doom_bar': {
    label: 'Doom Clock',
    desc: 'Tracks the world\'s descent toward the Unmaking. Each stage escalates {{sphere.entropy}} effects.',
  },
  'ui.companions': {
    label: 'Companions',
    desc: 'Those who travel with them — companions grant their bonuses while they stay.',
  },
  'ui.essence_panel': {
    label: 'Divine Essence',
    desc: 'Your power reserve. Spent on {{ui.avatar_wheel}} interventions, replenished by {{ui.mandate_tracker}} completion.',
  },
  'ui.mandate_tracker': {
    label: 'Active Mandates',
    desc: 'Divine objectives — complete them to gain essence and slow the {{ui.doom_bar}}.',
  },

  // ─── Ascendant identity (THR-1118) ─────────────────────────────
  // The bar hovers the *instance* — your divine name, your generated archetype title —
  // and these explain the concept behind it. Both used to be inline copy in
  // `IdentityStrip.tsx`, which put them outside Law 18's length gate and Law 19's
  // chaining. Neither belongs in a game-entity package: a divine name is not an entity,
  // and an archetype title is procedurally picked flavour with no per-title meaning.
  'ui.ascendant_name': {
    label: 'Divine Name',
    desc: 'The name your ascension took. It carries the shape of what you were before you rose. Open the sheet for the whole of it.',
  },
  'ui.ascendant_archetype': {
    label: 'Archetype',
    desc: 'The title your ascension took, drawn from your primary sphere. It names the shape of how you meet the world.',
  },

  // ─── Avatar Actions ────────────────────────────────────────────
  'ui.avatar_move': {
    label: 'Move Avatar',
    desc: 'Relocate your divine presence to a visible hex on the map.',
  },
  'ui.avatar_wheel': {
    label: 'Agent Wheel',
    desc: 'Open the wheel of divine interventions for the selected agent.',
  },
  'ui.avatar_scry': {
    label: 'Investiture',
    desc: 'Open the Divine Court — assign agents to positions of power and bestow sacred titles.',
  },

  // ─── Simulation Controls ──────────────────────────────────────
  'ui.sim_play_pause': {
    label: 'Play / Pause',
    desc: 'Advance or pause the world simulation.',
  },
  // THR-1716: the Play control's tooltip while the first-run prompt shows.
  'ui.sim_first_run': {
    label: 'Let the world move',
    desc: 'The world waits while time is still. Play lets mortals live their days; it stops again for every moment that matters.',
  },
  'ui.sim_speed': {
    label: 'Tick Speed',
    desc: 'How fast the world turns — higher speed skips routine events.',
  },

  // ─── Panels ────────────────────────────────────────────────────
  'ui.rival_panel': {
    label: 'Rival Gods',
    desc: 'Other divine powers competing for influence over the world.',
  },
  'ui.retinue_panel': {
    label: 'Retinue',
    desc: 'Mortal agents under your divine influence, ranked by tier.',
  },
  'ui.debug_panel': {
    label: 'Debug Traces',
    desc: 'Engine decision traces — action selection, narrative generation, context harvest.',
  },

  // ─── Simulation Controls (extended) ─────────────────────────────
  'ui.sim_step': {
    label: 'Step',
    desc: 'Advance the world by one tick. Use when paused to move at your own pace.',
  },
  'ui.season_display': {
    label: 'Season',
    desc: 'The current season and year. Each season spans roughly ninety ticks.',
  },

  // ─── World Pulse ─────────────────────────────────────────────────
  'ui.world_pulse_tick': {
    label: 'World Tick',
    desc: 'The current simulation tick — one turn of the world engine.',
  },
  'ui.world_pulse_agents': {
    label: 'Active Agents',
    desc: 'Number of mortal agents currently alive and acting in the world.',
  },
  'ui.world_pulse_cultures': {
    label: 'Cultures',
    desc: 'Distinct cultural groups shaping behavior, values, and conflict across the world.',
  },
  'ui.world_pulse_mood': {
    label: 'World Mood',
    desc: 'A narrative read of the current world tone, drawn from the {{ui.doom_bar}} stage.',
  },

  // ─── Doom Stages ─────────────────────────────────────────────────
  'ui.doom_stage_whisper': {
    label: 'Whisper',
    desc: 'The first stage — unease spreads beneath the surface. The world has not yet noticed what stirs.',
  },
  'ui.doom_stage_stir': {
    label: 'Stir',
    desc: 'Patterns emerge. Strange events cluster. Those who watch closely begin to see the shape of it.',
  },
  'ui.doom_stage_surge': {
    label: 'Surge',
    desc: 'The doom accelerates. Crisis manifests in multiple regions. Containment is no longer trivial.',
  },
  'ui.doom_stage_breaking': {
    label: 'Breaking',
    desc: 'The world fractures under pressure. Each tick escalates entropy effects across all spheres.',
  },
  'ui.doom_stage_unmaking': {
    label: 'Unmaking',
    desc: 'The final stage. All sphere bonds collapse. Complete your {{ui.mandate_tracker}} or the world returns to void.',
  },

  // ─── Narrative Log ───────────────────────────────────────────────
  'ui.narrative_log': {
    label: 'Narrative Log',
    desc: 'A chronicle of world events — agent actions, interventions, doom escalations, and turning points.',
  },
  'ui.event_type_routine': {
    label: 'Routine Event',
    desc: 'Everyday agent activity — movement, encounters, small decisions. The texture of a living world.',
  },
  'ui.event_type_notable': {
    label: 'Notable Event',
    desc: 'A significant moment — a dilemma resolved, a doom stage crossed, a mandate progressed.',
  },
  'ui.event_type_intervention': {
    label: 'Intervention',
    desc: 'Your direct act upon the world. Each intervention costs {{ui.essence_panel}} and carries {{ui.detection_risk}}.',
  },

  // ─── Action System ───────────────────────────────────────────────
  'ui.essence_cost': {
    label: 'Essence Cost',
    desc: 'Divine essence required to perform this intervention. Drawn from your {{ui.essence_panel}}.',
  },
  'ui.detection_risk': {
    label: 'Detection Risk',
    desc: 'Chance that this intervention reveals your divine presence. Higher on overt or world-altering acts.',
  },
  'ui.action_range': {
    label: 'Action Range',
    desc: 'Delivery scope — local, regional, astral, or remote. Wider range costs more essence.',
  },
  'ui.action_locked': {
    label: 'Locked',
    desc: 'This intervention is unavailable. Requirements not met — check essence, reach, or agent conditions.',
  },
  'ui.action_glyph': {
    label: 'Action Glyph',
    desc: 'The sphere symbol identifying this intervention\'s domain. Matches {{sphere}} affinities.',
  },

  // ─── Intervention ────────────────────────────────────────────────
  'ui.intervention_delivery': {
    label: 'Delivery Mode',
    desc: 'How the intervention reaches its target — local touch, regional wave, astral projection, or remote reach.',
  },
  'ui.intervention_confirm': {
    label: 'Confirm',
    desc: 'Commit this act upon the world. Essence is spent and cannot be recovered.',
  },
  'ui.intervention_cancel': {
    label: 'Cancel',
    desc: 'Dismiss without acting. No essence is spent.',
  },

  // ─── Agenda ──────────────────────────────────────────────────────
  'ui.agenda_template': {
    label: 'Agenda',
    desc: 'A behavioral pattern for an agent — shapes how they prioritize actions and what drives them.',
  },
  'ui.agenda_select': {
    label: 'Set Agenda',
    desc: 'Assign this agenda to the agent. Their future decisions will lean toward its behavioral tag.',
  },

  // ─── Scry ────────────────────────────────────────────────────────
  'ui.scry_rank_herald': {
    label: 'Herald',
    desc: 'An outer court rank — this agent carries your influence into the world at a distance.',
  },
  'ui.scry_rank_steward': {
    label: 'Steward',
    desc: 'An inner court rank — this agent manages your interests with direct authority.',
  },
  'ui.scry_rank_champion': {
    label: 'Champion',
    desc: 'The apex court rank — this agent acts as your primary instrument of divine will.',
  },
  'ui.scry_position': {
    label: 'Court Position',
    desc: 'A slot in your divine court. Each position grants the assigned agent influence and a title.',
  },
  'ui.scry_assign': {
    label: 'Assign to Court',
    desc: 'Place this agent in the selected court position. Replaces any current occupant.',
  },

  // ─── Harvest ─────────────────────────────────────────────────────
  'ui.harvest_type': {
    label: 'Harvest Outcome',
    desc: 'How this cycle ended — triumphant, somber, or bittersweet. Shapes the echoes carried forward.',
  },
  'ui.harvest_echo': {
    label: 'Cosmic Echo',
    desc: 'A persistent blessing or scar carried into the next cycle, earned by how this world ended.',
  },
  'ui.harvest_cycle': {
    label: 'Cycle',
    desc: 'One complete arc of world-simulation — from first tick to harvest. Each cycle builds on echoes from the last.',
  },

  // ─── Mandate Stages ──────────────────────────────────────────────
  'ui.mandate_stage_seed': {
    label: 'Seed',
    desc: 'The opening stage — foundation conditions must be established before the mandate can grow.',
  },
  'ui.mandate_stage_growth': {
    label: 'Growth',
    desc: 'The middle stage — conditions develop and pressure builds toward the final test.',
  },
  'ui.mandate_stage_test': {
    label: 'Test',
    desc: 'The critical stage — the mandate is tried against mounting obstacles.',
  },
  'ui.mandate_stage_culmination': {
    label: 'Culmination',
    desc: 'The final stage. Completion grants essence and slows the {{ui.doom_bar}}.',
  },

  // ─── Hex / Map ───────────────────────────────────────────────────
  'ui.fog_unexplored': {
    label: 'Unexplored',
    desc: 'This hex has never been observed. Its contents are entirely unknown.',
  },
  'ui.fog_remembered': {
    label: 'Remembered',
    desc: 'This hex was once visible but is no longer in sight. Details may be out of date.',
  },
  'ui.fog_visible': {
    label: 'Visible',
    desc: 'This hex is within your divine sight or an agent\'s line of sight.',
  },
  'ui.sight_level_blind': {
    label: 'Blind',
    desc: 'No sight reaches this hex. All activity here is hidden.',
  },
  'ui.sight_level_dim': {
    label: 'Dim Sight',
    desc: 'Partial visibility — outlines are perceived but fine detail is obscured.',
  },
  'ui.sight_level_clear': {
    label: 'Clear Sight',
    desc: 'Full visibility — agents, encounters, and events in this hex are fully observed.',
  },

  // ─── Encounter ───────────────────────────────────────────────────
  'ui.encounter_step': {
    label: 'Encounter Step',
    desc: 'One stage in an ongoing encounter. Each step tests a reach and advances or ends the sequence.',
  },
  'ui.encounter_threat_low': {
    label: 'Low Threat',
    desc: 'The encounter poses little danger. Most agents will resolve it without difficulty.',
  },
  'ui.encounter_threat_medium': {
    label: 'Medium Threat',
    desc: 'The encounter requires capable agents. Failure carries meaningful consequences.',
  },
  'ui.encounter_threat_high': {
    label: 'High Threat',
    desc: 'A dangerous encounter. Only your strongest agents can reliably see it through.',
  },
  // THR-1730 — a minimised pause-tier step waits on its badge.
  'ui.encounter_waiting': {
    label: 'Waiting for you',
    desc: 'This moment waits for you. Open it to play your hand, or let fate decide.',
  },
  'ui.encounter_progress': {
    label: 'Encounter Progress',
    desc: 'Steps completed and outcomes so far — how deep into this encounter the agent has come.',
  },

  // ─── Misc ─────────────────────────────────────────────────────────
  'ui.avatar_center': {
    label: 'Center on Avatar',
    desc: 'Scroll the map to your current divine position.',
  },
  'ui.avatar_actions': {
    label: 'Divine Actions',
    desc: 'Open the wheel of interventions available from your current position.',
  },

  // ─── Nudge stage — test panel (THR-926) ───────────────────────────
  // What-and-why explanations for the encounter test panel. Plain register,
  // words only — these explain the surface's vocabulary, they never leak the
  // numbers behind it (ruling 6).
  'ui.nudge_motive': {
    label: 'Why They Are Here',
    desc: 'How this moment found the mortal. BY CHOICE — they sought it. A MISSION — duty sent them. CHANCE — the road delivered it. THE GOD\'S HAND — your influence led here. The sentence tells the story.',
  },
  'ui.nudge_objective': {
    label: 'The Objective',
    desc: 'What the mortal is trying to do in this step. When you hand the moment to fate, fate rolls against exactly this — every outcome, from disaster to triumph, is an ending of this one attempt.',
  },
  'ui.nudge_difficulty': {
    label: 'Difficulty',
    desc: 'How demanding the objective is: gentle, fair, steep, or severe. Difficulty belongs to the situation — your nudges improve the mortal\'s chances against it, they never shrink the mountain.',
  },
  'ui.nudge_factors': {
    label: 'The Balance',
    desc: 'The circumstances weighing on this attempt, each tagged: helps (green) or hinders (red) the attempt. Untagged is context without a pull. Factors come from who they are, their state, and the place.',
  },
  'ui.nudge_forecast': {
    label: 'Fate\'s Forecast',
    desc: 'How the attempt looks before the roll: doomed, perilous, uncertain, favorable, or fated. Nudge cards move the forecast — but it is never a promise. You nudge; fate rolls; the ending is fate\'s alone.',
  },
  'ui.nudge_essence': {
    label: 'Essence to Spend',
    desc: 'Your reserve of divine power, shared across the whole world — not a per-encounter allowance. Cards cost essence to play; the reserve refills with time. Deep spending here is thin spending elsewhere.',
  },
  'ui.nudge_hand': {
    label: 'The Nudge Hand',
    desc: 'The ways you can lean on this moment. Each card is one push — steadying a hand, bracing a beam — bought with essence. Play any or none: the cards tilt the forecast, then fate rolls the ending.',
  },
  'ui.nudge_glyphs': {
    label: 'Reading a Card',
    desc: 'A card marks three things. The framed gold token is its price in essence. The pip row under the effect is how far it moves the odds. Red triangles are a setback the card brings with it.',
  },

  // ─── Aftermath chips (THR-1004) ───────────────────────────────────
  // Every game concept an aftermath chip names has to be explainable where it
  // is named. These are the concepts the *derived* chips reach for; entities
  // (people, factions, items) carry their own tooltips instead.
  // ─── Faction network diagram (THR-1508) ────────────────────────
  // The six words a faction's network diagram prints under its nodes. Each was inline
  // SVG copy in `FactionSheet.tsx`'s `NetworkNode` — a concept word with no hover
  // (Law 17). They explain how a faction *holds* a thing, not what the thing is: a
  // hall is a Location the faction keeps, whatever kind of place it happens to be, so
  // the place's own kind (`location.*`) is a different concept and stays where it is.
  'ui.faction_core': {
    label: 'Faction Core',
    desc: 'The faction itself. Its members swear to it, its halls are kept in its name and the ground it holds answers to it — every thread in the diagram reaches back here.',
  },
  'ui.faction_leader': {
    label: 'Leader',
    desc: 'The one who speaks for the faction. Anointed by succession where the faction has settled one; otherwise the member with the strongest claim to it.',
  },
  'ui.faction_member': {
    label: 'Member',
    desc: 'A sworn member of the faction. Their {{ui.standing}} within it sets their rank, and rank sets what the faction asks of them and what it will offer.',
  },
  'ui.faction_hall': {
    label: 'Hall',
    desc: 'A seat the faction keeps — a guild hall, or a place of its own inside a settlement. Where its business is done and its members gather.',
  },
  'ui.faction_control': {
    label: 'Control',
    desc: 'A Location the faction holds sway over without keeping a seat there. Its writ runs in the streets; its rivals take note of the reach.',
  },
  'ui.faction_army': {
    label: 'Army',
    desc: 'A force the faction fields. It marches, lays siege and fights under the faction\'s banner, and it draws on the faction\'s supply to stay whole.',
  },

  'ui.standing': {
    label: 'Standing',
    desc: 'How the world reads a mortal — the sum of what they have been seen to do. Standing opens doors and closes them: it gates who will bargain, who will follow, and who remembers a grudge.',
  },
  // THR-1550 — the lair block names the beast that holds the den.
  'ui.lair_monster': {
    label: 'The Lair\'s Monster',
    desc: 'The beast that holds this den. Its look and its name are known to everyone nearby, like the lair itself. While it lives the lair stands; a mortal who fells it can clear the den.',
  },
  'ui.agreement': {
    label: 'An Agreement',
    desc: 'A claim standing between two parties — a debt, a favour, an oath, a bargain. Unlike a wound it sits on nobody alone: someone is always on the other end, and it holds until honoured, lapsed, or broken.',
  },
  // THR-1172 — the director, on the re-passed Grateful Kin ending: *"the game
  // concept (favor owed) is underlined so players can see what it is. but there
  // is no tooltipping and/or linking to … an explanation of the concept."* The
  // chip already anchored the debtor, so the click was right; what it could not
  // say was what the thing being owed *is*. `ui.agreement` names the family
  // (debt, favour, oath, bargain); this names the member, because that is the
  // word on the chip.
  'ui.favour_owed': {
    label: 'A Favour Owed',
    desc: 'A debt of goodwill running one way between two named people. It sits on the debtor until it is called in — once — and is then spent. Unpaid, it can still lapse or be broken.',
  },
  // THR-1175 — the sibling concept, and the reason the sentence above says
  // *people* twice. The director asked how a town could ever repay a favour;
  // it cannot, because every way a favour gets collected runs through one
  // person's regard for another. What a place can hold is a welcome. Same
  // gratitude, different mechanism, and the two now say so on hover.
  'ui.standing_welcome': {
    label: 'A Standing Welcome',
    desc: 'A place that opens for someone who earned it. It sits on the ground rather than on a person, holds for a season, and shows on the location itself.',
  },
  // THR-1206 — the noun that replaced `ui.standing_welcome` on the chip surface.
  // The director's ruling, verbatim: *"custom concepts are difficult for players to
  // learn and understand. if we do have reputation as our concept for 'the social
  // score that modifies interactions between a and b', then lets use that
  // everywhere."* One tooltip now covers standing with a town, a person, and a guild
  // you have not joined, because it is one score behind all three.
  'ui.reputation_with': {
    label: 'Reputation',
    desc: 'The social score between you and someone — a person, a faction, or a place. It shifts what they offer, what they let you near, and what they hear you out about. It fades if nothing keeps it alive.',
  },
  // THR-1155 — the concept behind the *held by* line on a place's surfaces and behind
  // the red border on the map. One tooltip for both, because they are one fact: the
  // `controls` edge the projection draws from is the same edge this line reads.
  // THR-1472 — the concept behind every `kind: 'hidden_mark'` write. Three slice
  // scars described the mark instead of naming it ("the face they showed the
  // column", "the face they showed him"), which reads only to a player still
  // holding the encounter. The tag now carries the UL term itself — `[[Hidden
  // Mark]]`, `Docs/ubiquitous-language/Encounters.md` — rather than minting a
  // player-facing synonym for a concept the glossary already names.
  'ui.hidden_mark': {
    label: 'A Hidden Mark',
    desc: 'Something a mortal did that someone else noticed and has not acted on. It sits unseen on them and can surface later — a grudge, a price, a knock at the door — in the hands of whoever holds it.',
  },
  // THR-1472 — the concept behind every `kind: 'intelligence'` write, and the
  // generic word four vertical-slice PATH chips reached past. Each had spelled its
  // own record out on the tag — "what they know of the caravan roads", "what they
  // know of his circuit" — which is the record's *label*, not a word the player can
  // read off a sheet. Same ruling as `ui.reputation_with` (THR-1206): one concept
  // everywhere, the particulars one hover away.
  'ui.knowledge': {
    label: 'Knowledge',
    desc: 'Something a mortal knows and did not before — a road and who runs it, a season, a rival\'s circuit. It opens options the ignorant never see, and it can be wrong: each record says how far to trust it.',
  },
  // THR-1480 — five concepts the retrofit corpus was describing instead of naming.
  // Each backs a chip whose band writes a real state the game had no player-facing
  // word for, so the fix is the word (the THR-1472 / THR-1171 route), not a better
  // phrase: a chip may not name a state nothing wrote, and it may not reach for the
  // scene when the state is real but unnamed.
  //
  // The thread is the game's own title concept, and three shrine chips were tagging
  // it `thread` anchored at `$actor` — the mortal is one end of it, not the thing.
  'ui.thread': {
    label: 'A Thread',
    desc: 'The live line between an ascendant and a mortal they have touched. It is how a god reaches anyone at all — and it shortens with use and frays with neglect.',
  },
  // `short.something_gave` tagged `quintessence` anchored at the mortal carrying it.
  'ui.quintessence': {
    label: 'Quintessence',
    desc: 'The measure of what a mortal has left to spend of themselves — the reserve that hard work, hard nights and hard choices draw down. Spent low, everything they attempt costs more than it should.',
  },
  // `gp.the_figure_follows` — the `plant_compulsion` write, previously spelled out
  // as the scene phrase 'a compulsion to earn'.
  'ui.compulsion': {
    label: 'A Compulsion',
    desc: 'A pull a mortal did not choose and cannot simply put down. For as long as it holds, it reorders what they take on first — the errand, the road and the rest all wait behind it.',
  },
  // `seal.crit_fail.the_wanting` — a `growth` write naming the ambition the mortal
  // now pursues. The ambition is the state; the mortal is who carries it.
  'ui.ambition': {
    label: 'An Ambition',
    desc: 'Something a mortal has decided to want. It picks their next moves for them long after the scene that set it, and it is the reason they turn up where nobody sent them.',
  },
  // `granary.neg.success.goods` — recovered possessions, previously 'their own
  // goods, back', which describes the moment rather than naming what they hold.
  'ui.goods': {
    label: 'Goods',
    desc: 'Portable worth in a mortal\'s hands — grain, cloth, tools. Goods are spent, traded, stolen and eaten; unlike a possession with a name, they are counted rather than kept.',
  },
  // THR-1448 — the hold line on the mortal sheet's Faction strand: *keeps Ashford for
  // the Realm of the Vael · grip firm*. The grip word bands the stance's degradation
  // (Law 13); the number stays on the trace and the debug tab.
  'ui.hold': {
    label: 'A Hold',
    desc: 'A town a mortal keeps by commitment rather than owns: worked, or it slips. Kept on a Realm\'s ground, it makes the keeper a subject of that court, and the town\'s business comes to their door.',
  },
  'ui.held_by': {
    label: 'Held By',
    desc: 'Whose writ runs here. A Realm holds the towns of its domain; a guild or an order can hold the town its hall stands in. Ground nobody holds is unclaimed, and the border on the map stops there.',
  },
  // THR-1660 — the pilgrim way, on the Location and Faction sheets alike.
  'ui.pilgrim_way': {
    label: 'A Pilgrim Way',
    desc: 'A road a congregation has made holy. Its pilgrims come to the town at its end, and the pilgrimage can happen there. A mortal who spreads the faith can consecrate one; none is ever unmade.',
  },
  'ui.aftermath_toll': {
    label: 'A Toll',
    desc: 'Something the ending took. A toll is a price already paid, not a threat — the scene resolved, and this is what it cost the mortal to get there.',
  },
  'ui.aftermath_seed': {
    label: 'A Seed',
    desc: 'Something this ending set in motion. A seed is a debt the world now owes the story: it will surface later as an encounter, not as a number on a sheet.',
  },

  // ─── Consequence categories (THR-1082) ────────────────────────────
  // The four words every ending is now read through. A player who learns these
  // once can read any aftermath in the game, which is why they are introduced
  // by the first-contact legend (Law 12) and explained here rather than in
  // copy written inline on the chip.
  'ui.consequence.scar': {
    label: 'Scar',
    desc: 'What the trial cost them, written on body or spirit — a wound, a debt, a confidence spent. Scars heal or they linger; either way the world remembers.',
  },
  'ui.consequence.bond': {
    label: 'Bond',
    desc: 'Who now stands with them, or against them. A name learned, a debt owed, a house that has taken their measure and decided.',
  },
  'ui.consequence.boon': {
    label: 'Boon',
    desc: 'What they earned, and why they earned it — a thing carried away, a hand grown surer, a door held open by someone who owes them.',
  },
  'ui.consequence.path': {
    label: 'Path',
    // Law 56 (THR-1141): the old copy licensed exactly the chips the law
    // forbids — "nothing is held yet" told the player a PATH chip need not
    // point at anything. A path is an opening the world now tracks: a road
    // learned, a door that will open again, a meeting already scheduled.
    desc: 'A way the world now holds open for them — a route they know, an offer that will come round again, a meeting already on its way.',
  },

  // ─── Threads panel (THR-1008) ─────────────────────────────────
  // Concepts the thread rows reach for. Registered here rather than written
  // inline on the row, so the copy has one home and can chain (Law 17).
  // THR-1715: the attention toggle and the Chapter Ledger's Daily-life filter.
  // `{name}` is filled with the mortal's name at the call site; the copy names
  // the mortal rather than guessing a pronoun. Second person is legal here: it
  // is the god's own control (Law 42).
  'ui.attention.asks': {
    label: 'Asks you',
    desc: "{name}'s important moments stop the world and wait for you.",
  },
  'ui.attention.lives_on': {
    label: 'Lives on',
    desc: "{name}'s moments resolve on their own; you can read them afterwards.",
  },
  // THR-1783: the toggle's tooltip appends this so the control says it is one.
  // Kept apart from the mode copy because the warm-start overlay reuses
  // `ui.attention.lives_on`, and the overlay is not clickable.
  'ui.attention.switch_hint': {
    label: 'Click to switch',
    desc: 'Click to switch to {other}.',
  },
  // ─── Warm start (THR-1744) ────────────────────────────────────
  // The `?warm=<ticks>` overlay. `{now}` / `{target}` are season words from the
  // one calendar conversion (Law 13 — never a tick count). The overlay's First
  // line reuses `ui.attention.lives_on` rather than a copy (Law 17).
  'ui.warm_start.title': {
    label: 'The world moves on',
    desc: 'The world is catching up on the seasons you were away.',
  },
  'ui.warm_start.wait': {
    label: 'Catching up',
    desc: 'Catching up on the seasons you were away. This takes a minute or two.',
  },
  'ui.warm_start.progress': {
    label: 'Catching up',
    desc: '{now} — catching up to {target}',
  },
  // THR-1787: held decisions wait for the player; the Lives-on line alone read as
  // "everything resolves itself" just before the game asked for a choice.
  'ui.warm_start.held': {
    label: 'Choices wait',
    desc: 'Anything that needs your choice has waited for you.',
  },
  'ui.attention.thread_too_thin': {
    label: 'Thread too thin',
    desc: 'The thread is too thin for this mortal to stop the world. Strengthen it first.',
  },
  'ui.ledger.daily_life': {
    label: 'Daily life',
    desc: 'Ordinary chores — mending, foraging, resting. They still happen and still matter, but they never ask for you and stay out of the chapter list.',
  },
  'ui.thread_priority_pip': {
    label: 'Needs Attention',
    desc: 'This thread has a beat waiting on you. The pip clears once you have looked at what it marks.',
  },
  'ui.aspect_badge': {
    label: 'Aspect',
    desc: 'A living aspect of the god — beyond the five tiers of {{ui.standing}}, permanent, and outlasting the body that holds it.',
  },
  'ui.sustain_runway': {
    label: 'Sustain',
    desc: 'What this hold costs you each turn against what it returns, and how long your reserves can carry it before the bond lapses.',
  },
  'ui.strategic_behavior': {
    label: 'Strategic Behavior',
    desc: 'The long game this thread is playing — the standing intent behind its move-to-move choices.',
  },

  // ─── Moments (THR-1299) ─────────────────────────────────────────
  'ui.moment_card': {
    label: 'Moment',
    desc: 'A turn in a followed mortal\'s long work — a costly step, trouble, a doubling-down, an abandonment or a finish. Following is what makes their moments interrupt you.',
  },
  'ui.moment_band': {
    label: 'How the checkpoint went',
    desc: 'The work rolls against a checkpoint on the same ladder an encounter uses. A clean success advances it, a costly one advances it and leaves a mark, and anything worse halts it.',
  },
  'ui.moment_checkpoints': {
    label: 'Where the work stands',
    desc: 'Each dot is a checkpoint the work must pass. Filled dots are steps already earned; the work finishes when they all are.',
  },
  'ui.moment_divine_hand': {
    label: 'Your hand in it',
    desc: 'Your Inspire or Sabotage landed on this checkpoint and moved its roll. One nudge, one roll — consumed on use.',
  },
  'ui.moment_set_in_motion': {
    label: 'Set in motion',
    desc: 'This outcome gave someone a new want. Follow the link to see the drive it became.',
  },
  'ui.moment_pause': {
    label: 'Time holds',
    desc: 'The simulation is paused while this moment is open, and resumes when you acknowledge it — unless you had paused it yourself.',
  },
  'ui.follow_toggle': {
    label: 'Follow',
    desc: 'A followed mortal\'s moments interrupt you. Your thread to a mortal follows them by itself; muting keeps the thread and stops the interruptions.',
  },
  'ui.moment_badge': {
    label: 'Their work turned',
    desc: 'Moments of this mortal\'s long work you have not yet read. Opening one clears nothing until you acknowledge it.',
  },
  'ui.arc_strip': {
    label: 'The arc so far',
    desc: 'What this mortal has finished, failed and been through, oldest first — read from what the world remembers, not from the day\'s digest.',
  },
  // The world's past (THR-1656). Filed under `ui.*` because `location.*` and `agent.*`
  // resolve world-model kinds and live nodes; these are static concepts.
  'ui.before_you_woke': {
    label: 'Before you woke',
    desc: 'What the world was before you woke: the empires that fell, the wars people still remember, and who founded the towns.',
  },
  'ui.past.founding': {
    label: 'Founding',
    desc: 'How long a place has stood and who founded it. Every town has a founding; the oldest towns were the seats of Realms.',
  },
  'ui.past.burned_town': {
    label: 'A burned town',
    desc: 'A town that burned in a war people still remember, and was never rebuilt. Which town it was is learned by finding it.',
  },
  'ui.past.elder_ruin_empire': {
    label: 'A dead empire',
    desc: 'A people who ruled here long before the living, and left ruins behind. Whose ruin a place is becomes clear once it is found.',
  },
  'ui.past.dead': {
    label: 'Died before you woke',
    desc: 'Someone who died before you woke. The living still remember them.',
  },
  'ui.calling': {
    label: 'The calling',
    desc: 'What the world calls this mortal for what they do — read from their strongest reaches, the ambition they pursue and their temperament. It changes only when their life does.',
  },
  // The intention line (THR-1433): one id per door the reading came through. The
  // surface passes the sentence naming the spy or the ring as `desc`; these are the
  // labels and the fallback sentences.
  'ui.intention.familiarity': {
    label: 'What they are set on',
    desc: 'You have watched this mortal long enough to know what they want.',
  },
  'ui.intention.mark': {
    label: 'What they are set on',
    desc: 'A mortal you follow holds a secret of theirs — and what a follower knows, you know.',
  },
  'ui.intention.network': {
    label: 'What they are set on',
    desc: 'A network you follow has people near them — their eyes are yours.',
  },
  // The undertaking verbs, as the ledger and the codex name them (THR-1434). One id
  // per verb variant; the sheet's deed word carries it.
  'ui.verb.create': { label: 'Create', desc: 'To make a thing the world did not have — a settlement founded, a company raised, a working learned.' },
  'ui.verb.change:raise': { label: 'Raise', desc: 'To better a thing one holds — richer, stronger, more.' },
  'ui.verb.change:lower': { label: 'Lower', desc: 'To diminish a thing another holds — still theirs, and the poorer for it. Needs a reason.' },
  'ui.verb.use': { label: 'Use', desc: 'To work a thing one holds for what it yields — a harvest, a favour called in, a spell cast at its price.' },
  'ui.verb.control:claim': { label: 'Claim', desc: 'To take up a thing nobody holds and make it one\'s own.' },
  'ui.verb.control:seize': { label: 'Seize', desc: 'To take a thing from the hands that hold it. Needs a reason.' },
  'ui.verb.destroy': { label: 'Destroy', desc: 'To end a thing — raze it, cure it, seal it, or, at the darkest, kill. Needs a reason.' },
  'ui.verb.observe': { label: 'Observe', desc: 'To watch a thing and come away knowing it — the way to it, who holds it, what it hides.' },
  'ui.doing_line': {
    label: 'What they are doing',
    desc: 'The work this mortal is in the middle of, and how it goes — the word after the dash is how far along it is, or the trouble it is in.',
  },
  'ui.undertaking_kind': {
    label: 'The kind of thing',
    desc: 'What in the world this undertaking acts on — a place, a company, a standing, a working. Every kind the world keeps has its verbs.',
  },

  // ─── Action card (THR-1002) ───────────────────────────────────────
  // Every word the action card prints on a chip or in its odds zone is a concept
  // the player is meeting for the first time on that card, so each carries its
  // explanation from here (Law 17 — by id, never inline copy on the face).
  //
  // Register: plain, second person, addressed to the god. These are read *while
  // deciding*, so they say what the word means for the choice in front of them
  // and nothing more (THR-609 — interactive text is always plain).

  // The verb chip: what kind of working this card is.
  'ui.card.verb.create': {
    label: 'Create',
    desc: 'This working brings something into the world that was not there — a bond, a mark, an arrangement. What it makes persists after the moment of making.',
  },
  'ui.card.verb.read': {
    label: 'Find',
    desc: 'This working turns your sight on something and learns it. Nothing in the world moves; what changes is what you know, and what you can act on next.',
  },
  'ui.card.verb.update': {
    label: 'Change',
    desc: 'This working takes something that already exists and bends it — a mortal\'s intent, a place\'s fortune, a faction\'s standing. The thing remains; what it is doing does not.',
  },
  'ui.card.verb.delete': {
    label: 'Destroy',
    desc: 'This working unmakes something. What it undoes does not come back on its own, and the world reorganises around the absence.',
  },
  'ui.card.verb.sustained': {
    label: 'Control',
    desc: 'This working is not an act but an arrangement: it holds something open and charges you for as long as it holds. Let the upkeep lapse and what it was holding closes.',
  },

  // The scale chip: how much of the world the working reaches.
  'ui.card.scale.personal': {
    label: 'Personal',
    desc: 'A working the size of one soul. Small reach, and correspondingly hard to get wrong — the world barely has to move to let it happen.',
  },
  'ui.card.scale.local': {
    label: 'Local',
    desc: 'A working the size of one place. It touches what stands on a single hex and the lives gathered there.',
  },
  'ui.card.scale.regional': {
    label: 'Regional',
    desc: 'A working the size of a region. It reaches past what you can see, and the world resists more the further you ask it to reach.',
  },
  'ui.card.scale.cosmic': {
    label: 'Cosmic',
    desc: 'A working the size of the world. The greatest reach a god has, and the least certain — nothing this large is ever simply granted.',
  },

  // The upkeep channel: what holding it open costs, per turn, in words.
  'ui.card.upkeep.light': {
    label: 'Light upkeep',
    desc: 'Holding this open costs little each turn. You can carry several such arrangements without feeling them.',
  },
  'ui.card.upkeep.steady': {
    label: 'Steady upkeep',
    desc: 'Holding this open costs a real share of your essence each turn. Worth it while it is doing something; a slow bleed once it is not.',
  },
  'ui.card.upkeep.heavy': {
    label: 'Heavy upkeep',
    desc: 'Holding this open costs dearly every turn. Few gods can carry two at once — deep spending here is thin spending everywhere else.',
  },

  // The forecast ladder, one word at a time — the dilemma header's pill
  // (THR-1713 D5). Round 2: no tester could say what "doomed" meant, because the
  // pill's tooltip listed all five words and explained none. Each entry now says
  // what *its* word means for the attempt, pre-roll and never a promise (UL
  // *Forecast tier*), then chains the ladder. Cast cards route to
  // `ui.forecast.cast.*` below, because a cast never fails outright.
  'ui.forecast.doomed': {
    label: 'Doomed',
    desc: 'As things stand, this attempt will almost surely fail. Your cards can lift it; fate still rolls. See {{ui.nudge_forecast}}.',
  },
  'ui.forecast.perilous': {
    label: 'Perilous',
    desc: 'As things stand, this attempt is more likely to fail than succeed. A card or two can turn it. See {{ui.nudge_forecast}}.',
  },
  'ui.forecast.uncertain': {
    label: 'Uncertain',
    desc: 'As things stand, this attempt could go either way. Your cards tip it; the roll settles it. See {{ui.nudge_forecast}}.',
  },
  'ui.forecast.favorable': {
    label: 'Favorable',
    desc: 'As things stand, this attempt will likely succeed. Likely is not certain — fate still rolls. See {{ui.nudge_forecast}}.',
  },
  'ui.forecast.fated': {
    label: 'Fated',
    desc: 'As things stand, this attempt all but cannot fail. Even so, fate rolls and the ending is its own. See {{ui.nudge_forecast}}.',
  },

  // ─── A readable spend (THR-1607, plan B4) ─────────────────────────────────
  //
  // Round-1 cold testers could not say what their essence was or what "doomed"
  // meant on a card. These are the words the first ten minutes put in front of
  // a new player, each explained where it sits.

  // The cast forecast. A player cast never fails outright (the THR-728 floor turns
  // a failing roll into success at a cost), so on a cast card the tier word says
  // *how cleanly* it lands — never *whether*. The `ui.forecast.*` entries above
  // still describe the shared ladder; the cast card routes here instead. One
  // tester avoided a card marked "doomed" for fear it would doom her mortal.
  'ui.forecast.cast.doomed': {
    label: 'Doomed',
    desc: 'It will land, but crooked. A cast never fails outright — your essence always buys something — yet the world is set against this one, and it will likely cost you.',
  },
  'ui.forecast.cast.perilous': {
    label: 'Perilous',
    desc: 'It will land, but likely with a cost attached. A cast never fails outright; this one is more likely to go crooked than clean.',
  },
  'ui.forecast.cast.uncertain': {
    label: 'Uncertain',
    desc: 'It will land — clean or crooked, the roll decides. A cast never fails outright; what is uncertain is the price.',
  },
  'ui.forecast.cast.favorable': {
    label: 'Favorable',
    desc: 'It will land, and likely cleanly. A cast never fails outright; this one leans toward costing you nothing more than its essence.',
  },
  'ui.forecast.cast.fated': {
    label: 'Fated',
    desc: 'It will land cleanly. Some divine workings ask nothing of the world — they simply happen.',
  },

  // The price on a card: the framed row of ✦ in the chip row.
  'ui.card.cost': {
    label: 'Essence cost',
    desc: 'Each ✦ is one measure of essence, drawn from the pool of the sphere beside it. Your pools are listed under Essence on your bar.',
  },

  // The odds row on a nudge card, one entry per pip tier (THR-1713 D4). The ★
  // a round-2 tester asked about ("Power? Cost?") is the *Fated* odds pip — it
  // was never a cost, and nothing said so. Words match `nudge-pip-vocabulary.ts`.
  'ui.card.odds.faint': {
    label: 'Faint pips',
    desc: 'How far this card moves the odds: a little. Dots fill as the push grows. This is what you gain — the price is the framed ✦ badge.',
  },
  'ui.card.odds.strong': {
    label: 'Strong pips',
    desc: 'How far this card moves the odds: a real push. Squares fill as it grows. This is what you gain — the price is the framed ✦ badge.',
  },
  'ui.card.odds.potent': {
    label: 'Potent pips',
    desc: 'How far this card moves the odds: a heavy push. Diamonds fill as it grows. This is what you gain — the price is the framed ✦ badge.',
  },
  'ui.card.odds.fated': {
    label: 'Fated pips',
    desc: 'How far this card moves the odds: as far as any card can. Stars fill as it grows. This is what you gain — the price is the framed ✦ badge.',
  },
  'ui.card.odds.penalty': {
    label: 'Penalty',
    desc: 'A setback that worsens the odds. Each ▼ is a step against the attempt — the cost of a card that gives with one hand and takes with the other.',
  },

  // The kind tag on a coloured factor line (THR-1713 D6, Law 31). The tag says
  // which way the line pushes *this attempt*, never whether the fact is good.
  'ui.nudge_factor.for': {
    label: 'Helps',
    desc: 'This works for the attempt succeeding. It says which way it pushes this one try — not whether it is good for you or for the world.',
  },
  'ui.nudge_factor.against': {
    label: 'Hinders',
    desc: 'This works against the attempt succeeding — not against you, and not a judgement of whether it is good. A hindrance can be welcome news.',
  },

  // The Reaches heading on the bar and the sheet (THR-1713 D7). Reaches ⟂ Spheres:
  // one tester read them as the same axis, so the heading says they are not.
  'ui.reaches': {
    label: 'Reaches',
    desc: 'What you do — eight Reaches, from Iron to Star, each named by how far your deeds have gone. Your Spheres are what fuels it; the two are separate.',
  },

  // The essence block on the ascendant bar.
  'ui.essence.row': {
    label: 'Essence',
    desc: 'The power you have to spend in this sphere. Casting a card of this sphere draws it down, and the pool refills slowly with time.',
  },
  'ui.essence.foundation_fold': {
    label: 'Elder powers',
    desc: 'Elder powers — you have not yet learned to draw on these. They are older than the spheres you chose, found rather than taken.',
  },

  // The god's quintessence, named beside its word on the identity strip. Distinct
  // from `ui.quintessence` above, which is a *mortal's* reserve of self.
  'ui.ascendant_quintessence': {
    label: 'Quintessence',
    desc: 'How whole you still are, from Absolute down to Fraying. Worn thin, your workings cost more than they should; restoration mends it.',
  },

  // Mandate and doom-clock terms. The opening keeps these surfaces hidden until
  // the bond (THR-1648), so a new player meets them later — explained when they do.
  'ui.counter_omens': {
    label: 'Counter-Omens',
    desc: 'Signs you have earned against the doom by meeting your mandate\'s omens. When the doom next escalates, they are spent to soften the blow.',
  },
  'ui.doom_debt': {
    label: 'Doom Debt',
    desc: 'What your missed omens have cost. The next time the doom escalates, it lands harder by this much — unless counter-omens pay it down.',
  },
  'ui.investiture': {
    label: 'Investiture',
    desc: 'Your divine court: the mortals you have raised to act in your name. Open it to see who serves you, and in what seat.',
  },
  'ui.covenant': {
    label: 'Covenants',
    desc: 'The lasting grips you hold on the world — a place, a faction, a working kept open. Each costs upkeep while you hold it; release one to stop paying.',
  },

  // Reach tier words — generated from the register so no word can dangle.
  ...buildReachTierTooltips((reach) => REACH_COPY[reach]?.label ?? reach),

  // Card keyword chips — derived from the library's type table so a new type
  // cannot ship without its hover (THR-1713 D4, Law 12).
  ...buildCardKeywordTooltips(),
};

/**
 * `ui.card.keyword.<typeId>` for every nudge-card type, from the library's own
 * `effectShape` + `decision` — never invented copy.
 */
function buildCardKeywordTooltips(): Record<string, TooltipContent> {
  const out: Record<string, TooltipContent> = {};
  for (const type of NUDGE_CARD_TYPES) {
    const shape = type.effectShape.replace(/\s\+\s/g, ' and ');
    const decision = /[.?!]$/.test(type.decision) ? type.decision : `${type.decision}.`;
    out[`ui.card.keyword.${type.id}`] = {
      label: type.keyword,
      desc: `${shape}. ${decision}`,
    };
  }
  return out;
}

/** Lookup a UI tooltip by ID. Returns null if not found. */
export function getUITooltip(id: string): TooltipContent | null {
  return UI_TOOLTIPS[id] ?? null;
}
