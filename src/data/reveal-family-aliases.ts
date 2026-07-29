/**
 * Reveal-family aliases (THR-844).
 *
 * A hidden mark's `revealFamilies` names the encounters that can surface it. The engine
 * matched each entry against a drawn template by raw `templateId.startsWith(family)`, so a
 * family only ever worked if the author happened to write a real template-id prefix.
 *
 * They mostly did not. Measured against the shipped pool (672 templates), **67 of the 115
 * distinct family literals matched zero templates**, and 42 of 136 mark entries named *only*
 * dead families — placed, decayed, never revealable by construction. The dead names are
 * overwhelmingly thematic (`investigation`, `oracle`, `guild`, `duel`, `shrine`, `spy`),
 * which is the tell: authors were writing a *tag vocabulary*, not id prefixes. `investigation`
 * alone is the corpus's single most-used family — 65 uses, all inert.
 *
 * This table makes that intent real instead of renaming 100+ authored entries to prefixes
 * nobody would recognise. A family listed here resolves to the template-id prefixes that
 * *mean* it; a family not listed here falls back to being its own prefix, so every family
 * that already worked keeps matching exactly what it matched before (NFP #6, additive).
 *
 * **Adding a family is now a declared act that can be validated** — which is the point.
 * `revealFamilyLiveness.test.ts` fails if any authored family resolves to zero live
 * templates, so the class of bug this file exists to fix cannot silently return.
 *
 * Authoring rules:
 * - Every prefix must match ≥1 template in `UNIFIED_ACTION_TEMPLATES`. The guard test proves it.
 * - Prefer a handful of *specific* prefixes over one broad segment. `investigation` resolving
 *   to all 183 `encounter.` templates would make the mark reveal on anything, which is as
 *   useless as revealing on nothing.
 * - A trailing `.` matters: `hex.` is the divine hex verbs; `hex` would also catch nothing else,
 *   but the dot documents that a namespace is intended rather than a word.
 *
 * Faction id prefixes, for reference: `ac` Arcane Circle · `ag` Adventurers Guild ·
 * `bf` Builders Fellowship · `cg` Civic Guard · `hod` Holy Order of Dawn ·
 * `lk` Lorekeepers Covenant · `mc` Mercenary Company · `mct` Merchant Consortium ·
 * `rb` Rangers Brotherhood · `tg` Thieves Guild · `ts` Temple of Spheres · `uk` Underking Court.
 */

export const REVEAL_FAMILY_ALIASES: Readonly<Record<string, readonly string[]>> = {
  // ─── The big one: someone looks into it ─────────────────────────
  /** 65 uses — by far the most common family in the corpus, and it matched nothing.
   * The surface where a past act gets asked about, dug up, or overheard. */
  investigation: [
    'social.investigate_reputation',
    'social.spy_on',
    'action.eye.investigate',
    'cg.quest.investigate_disturbance',
    'encounter.investigate_anomaly',
    'encounter.listen_for_rumors',
    'encounter.local_gossip',
    'encounter.prisoner_interrogation',
    'lk.quest.interview_elder',
    'tavern.overheard_rumor',
    'uk.social.whisper_network',
    'tg.social.rumor_trade',
  ],
  /** The wronged community of `encounters/rival-shrine-betrayal.ts` looking into the leak.
   * A place name, so it can never be a prefix — it means "investigation, by these people". */
  brinewall: [
    'social.investigate_reputation',
    'encounter.listen_for_rumors',
    'encounter.local_gossip',
    'mct.quest.settle_dispute',
    'tavern.overheard_rumor',
  ],
  /** Deliberate watching rather than asking around. */
  spy: ['action.shadow.spy', 'social.spy_on', 'npc_eavesdrop', 'uk.social.whisper_network'],

  // ─── Factions, by their thematic names ──────────────────────────
  holy_order: ['hod.'],
  holy_order_dawn: ['hod.'],
  civic_guard: ['cg.'],
  arcane: ['ac.', 'encounter.arcane_'],
  arcane_circle: ['ac.'],
  lorekeepers_covenant: ['lk.'],
  temple_of_spheres: ['ts.'],
  merchant_consortium: ['mct.'],
  mercenary: ['mc.', 'encounter.sway_mercenary', 'action.gold.hire-mercenaries'],
  underking_court: ['uk.'],
  /** Noble court, not the criminal one — but the Underking's court is where court business
   * actually gets transacted in play, so both surfaces can surface it. */
  court: ['uk.', 'encounter.court_noble', 'encounter.council_mediation', 'encounter.diplomats_maze'],
  guild: ['encounter.guild_', 'ag.', 'bf.', 'tg.', 'mct.'],
  /** Faction politics turning inward. */
  faction_internal_pressure: ['faction.encounter.', 'action.faction.'],

  // ─── Spheres used as families ───────────────────────────────────
  // These are sphere names, not id prefixes. Each resolves to the templates that carry that
  // sphere's characteristic activity.
  iron: ['action.iron.', 'invest.iron.', 'reputation.iron.'],
  mind: ['action.eye.', 'lk.', 'encounter.knowledge_test'],
  spirit: ['encounter.spirit_walk', 'encounter.bind_spirit', 'encounter.restless_spirits', 'encounter.commune_with_stars'],
  force: ['action.iron.', 'encounter.warband_training', 'encounter.trial_by_combat'],
  time: ['hex.rewrite_history', 'hex.bury_past', 'encounter.decipher_ancient_inscriptions', 'encounter.read_the_stars'],
  entropy: ['hex.corrupt_land', 'loc.blight', 'encounter.plague_outbreak', 'encounter.arcane_cataclysm'],
  heart: ['action.heart.', 'reputation.heart.', 'encounter.rally_faithful'],
  quintessence: ['encounter.festival_of_spheres', 'ts.senior.sphere_communion', 'ts.elite.sphere_convergence'],
  martial: ['action.iron.', 'mc.', 'encounter.warband_training', 'encounter.trial_by_combat'],
  military: ['mc.', 'army.', 'action.iron.raise-force', 'encounter.warband_training'],

  // ─── Compound sphere.theme families ─────────────────────────────
  'iron.alliance': ['action.heart.forge-alliance', 'social.forge_alliance', 'fa.alliance_ceremony'],
  'shadow.intrigue': ['action.shadow.', 'encounter.political_intrigue', 'reputation.shadow.'],
  'shadow.betrayal': ['action.heart.betray', 'action.shadow.', 'reputation.shadow.'],
  'shadow.loyalty': ['fa.loyalty_test', 'action.heart.assess-loyalty', 'uk.'],
  'shadow.retribution': ['action.shadow.assassinate', 'eye.reckoning.', 'uk.senior.eliminate_rival'],
  'gold.betrayal': ['action.gold.break-agreement', 'action.heart.betray', 'broker.quest.rival_shrine_betrayal'],
  'gold.customs': ['action.gold.tax-trade-route', 'encounter.toll_bridge', 'encounter_toll_dispute', 'mct.'],
  'veil.knowledge': ['action.veil.', 'action.eye.refine-knowledge', 'encounter.forbidden_tome'],
  'veil.inquisition': ['hod.senior.inquisition', 'action.veil.', 'ac.'],
  'iron.inquest': ['cg.quest.investigate_disturbance', 'hod.senior.inquisition', 'encounter.prisoner_interrogation'],
  'eye.revelation': ['action.eye.', 'reputation.eye.', 'encounter.mystical_vision_quest'],
  'eye.prophecy': ['lk.senior.decipher_prophecy', 'reputation.eye.', 'action.star.divine'],
  'star.miracle': ['action.star.', 'reputation.star.', 'star.turning.', 'encounter.starborn_vigil'],
  'stone.legacy': ['action.stone.', 'reputation.stone.', 'stone.permanence.', 'encounter.raise_monument'],
  'stone.dispossessed': ['reputation.stone.the_jury_of_the_ruined', 'encounter.aid_refugees', 'army.aftermath.refugees'],
  'heart.devotion': ['ts.', 'hod.social.dawn_prayer', 'encounter.rally_faithful', 'encounter.offer_small_prayer'],
  'power.rivalry': ['reputation.power.', 'ag.social.rivalry', 'fa.rivalry_'],

  // ─── Roles and places ───────────────────────────────────────────
  oracle: ['reputation.eye.the_oracle_consulted', 'reputation.eye.the_blinded_oracle', 'encounter.commune_with_stars', 'encounter.read_the_stars'],
  seer: ['hex.forge_seer_token', 'action.star.divine', 'encounter.read_the_stars', 'encounter.mystical_vision_quest'],
  scholar: ['lk.', 'encounter.scholar_aid', 'encounter.knowledge_test', 'ac.social.library_browse'],
  merchant: ['mct.', 'encounter.merchant_caravan', 'encounter.merchants_gambit', 'tavern.merchants_pitch', 'reputation.gold.the_merchants_favor'],
  pilgrim: ['reputation.star.the_star_pilgrim', 'reputation.heart.pilgrims_offering', 'encounter.pilgrimage_trial', 'hod.quest.escort_pilgrims'],
  magistrate: ['reputation.stone.the_jury_of_the_ruined', 'reputation.stone.the_stones_judgement', 'hod.quest.deliver_judgment', 'encounter.trial_by_combat'],
  courthouse: ['reputation.stone.the_jury_of_the_ruined', 'reputation.stone.the_stones_judgement', 'encounter.trial_by_combat', 'cg.'],
  archive: ['lk.senior.excavate_archive', 'lk.quest.catalogue_ruins', 'encounter.library_expansion', 'encounter.catalogue_the_tower'],
  shrine: ['encounter.shrine_offering', 'encounter.sacred_offering', 'hod.quest.purify_shrine', 'ts.quest.tend_shrine', 'healer.quest.wandering_healer_shrine_access'],
  settlement: ['encounter.frontier_settlement', 'encounter.rally_the_locals', 'loc.'],
  grange: ['encounter.harvest_bounty', 'encounter.forage_provisions', 'loc.bless_harvest', 'gold.famine.merchant_granaries'],
  river: ['encounter.broken_span', 'encounter.toll_bridge', 'encounter.mend_fishing_nets', 'encounter.harbor_construction'],
  road: ['borderland.', 'liminal.quest.road_ambush', 'encounter_route_ambush', 'encounter.toll_bridge'],

  // ─── Events and themes ──────────────────────────────────────────
  conflict: ['encounter.honor_duel', 'encounter.trial_by_combat', 'encounter.arena_combat', 'social.challenge_duel'],
  duel: ['encounter.honor_duel', 'encounter.arcane_duel', 'social.challenge_duel', 'reputation.power.the_renowned_duel', 'enc.courtyard_duel'],
  shadow: ['action.shadow.', 'reputation.shadow.', 'encounter.shadow_'],
  intrigue: ['encounter.political_intrigue', 'uk.', 'tg.'],
  mutiny: ['army.threshold.mutiny', 'army.threshold.desertion'],
  desertion: ['army.threshold.desertion', 'borderland.desperate_deserter'],
  confession: ['tavern.confession_over_drinks', 'ts.social.evening_prayer', 'hod.social.dawn_prayer'],
  trade: ['mct.', 'action.gold.trade', 'encounter.market_haggle', 'encounter.caravan_deal', 'encounter.foreign_trader'],
  social_obligation: ['social.', 'encounter.tribute_exchange', 'encounter.debt_collection'],
  forbidden_knowledge: ['encounter.forbidden_tome', 'lk.elite.forbidden_library', 'action.eye.suppress-knowledge'],
  water_rights: ['encounter.dig_a_well', 'encounter.labor_dispute', 'encounter.negotiate_dispute', 'loc.sicken_wells'],
};

/**
 * Resolve an authored reveal-family name to the template-id prefixes it matches.
 *
 * Unaliased families resolve to themselves, preserving the original raw-prefix behaviour for
 * every family that already worked (`social`, `tavern`, `borderland`, `hex.`, `faction`, the
 * `xx.quest` / `xx.elite` faction-rank families, and so on).
 */
export function resolveRevealFamily(family: string): readonly string[] {
  return REVEAL_FAMILY_ALIASES[family] ?? [family];
}
