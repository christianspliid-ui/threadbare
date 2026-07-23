/**
 * subsystems-registry — the shared subsystem-name authority (THR-717).
 *
 * Extracted from `generate-systems-inventory.ts` so a second generator
 * (`generate-interface-map.ts`) can validate contract rows against the same
 * vocabulary instead of maintaining a divergent copy. Two registries naming the
 * same subsystems differently is exactly the drift this repo keeps paying for.
 *
 * **This module is deliberately NOT an entry point and imports nothing from
 * `src/engine/`.** `generate-systems-inventory.ts` boots a 120-tick headless
 * simulation in its `main()`, and esbuild `--bundle` rewrites `import.meta.url`,
 * which defeats the usual `import.meta.url === entry` guard — so importing that
 * file to reach `SUBSYSTEMS` would silently run the sim on every interface-map
 * build (the THR-686 failure class). Pure data, no side effects, safe to import
 * from anywhere.
 *
 * Additive only. Adding a row can never cause completeness drift: the mechanical
 * layers of the systems inventory (tick phases, engine modules) remain the
 * coverage guarantee, and an unclaimed wired phase still surfaces under
 * "Unclassified phases".
 */

/**
 * One player-meaningful subsystem — the substrate a designer might otherwise rebuild.
 *   - `aliases`: every noun a premise might use (incl. legacy names) — search keys.
 *   - `activityKeywords`: single lower-case tokens that appear in the runtime
 *     activity vocabulary when the subsystem is doing its job. The systems
 *     inventory badges ACTIVE iff any appears. Chosen from observed trace
 *     categories / event types.
 *   - `domains`: engine module-domain tokens that implement it.
 *   - `phaseMatch`: regex over phase names/tags to claim the tick phases.
 */
export interface Subsystem {
  name: string;
  aliases: string[];
  activityKeywords: string[];
  domains: string[];
  phaseMatch: RegExp;
  note: string;
}

export const SUBSYSTEMS: readonly Subsystem[] = [
  {
    name: 'War, Armies & Battles',
    aliases: ['war', 'warfare', 'army', 'armies', 'battle', 'siege', 'warband', 'conflict', 'invasion', 'cohesion', 'campaign'],
    activityKeywords: ['battle', 'siege', 'army'],
    domains: ['army', 'battle'],
    phaseMatch: /\b(army|battle|siege|war)\b/i,
    note: 'Built March 2026 as "Phase 12: Conflict & Destruction" / TB-073; activated + reconciled by THR-614. **Do not design a green-field war system** — extend or tune this one.',
  },
  {
    name: 'Factions & Succession',
    aliases: ['faction', 'guild', 'order', 'succession', 'rank', 'schism'],
    activityKeywords: ['faction', 'schism'],
    domains: ['faction', 'chosenfactionpowers', 'schism'],
    phaseMatch: /\b(faction|schism|succession)\b/i,
    note: 'Faction actions, ambitions, reputation, rank changes, succession, schism resolution.',
  },
  {
    name: 'Rival Gods & Schemes',
    aliases: ['rival', 'rivals', 'scheme', 'pantheon', 'antagonist'],
    activityKeywords: ['rival'],
    domains: ['rival'],
    phaseMatch: /\brival\b/i,
    note: 'Generated rivals from the World-Soul (NOT a fixed pantheon). 4-phase schemes = THR-66; economic family = THR-620.',
  },
  {
    name: 'Doom Clock & Journey',
    aliases: ['doom', 'journey', 'apocalypse', 'end-times', 'clock'],
    activityKeywords: ['doom'],
    domains: ['doom', 'journey'],
    phaseMatch: /\b(doom|journey)\b/i,
    note: 'The run\'s master clock; journey beats fire at thresholds.',
  },
  {
    name: 'Mandate',
    aliases: ['mandate', 'divine mandate', 'objective'],
    activityKeywords: ['mandate'],
    domains: ['mandate'],
    phaseMatch: /\bmandate\b/i,
    note: 'The god\'s standing objective and its checkpoints.',
  },
  {
    name: 'Essence & Divine Economy',
    aliases: ['essence', 'divine economy', 'income', 'wellspring', 'essence source'],
    activityKeywords: ['essence', 'divine'],
    domains: ['essence', 'essencesource', 'control'],
    phaseMatch: /\b(essence|control effects|divine)\b/i,
    note: 'Essence pool + sources (THR-611). Typed sources yield own-sphere income.',
  },
  {
    name: 'Encounters & Dilemmas',
    aliases: ['encounter', 'dilemma', 'aftermath', 'chapter', 'reaction'],
    activityKeywords: ['encounter', 'dilemma', 'aftermath', 'reaction'],
    domains: ['encounter', 'encounters', 'dilemma'],
    phaseMatch: /\b(encounter|dilemma|aftermath)\b/i,
    note: 'The core narrative engine — scoring, eligibility, resolution, aftermath reactions, chapter archive.',
  },
  {
    name: 'Culture',
    aliases: ['culture', 'cultural', 'mores', 'tradition', 'phonetics'],
    activityKeywords: ['culture', 'phonetic'],
    domains: ['culture', 'cultural'],
    phaseMatch: /\bcultur/i,
    note: 'Culture generation, gravity, tension, mores, phonetic naming.',
  },
  {
    name: 'Personality & Emergent Traits',
    aliases: ['personality', 'trait', 'traits', 'becoming', 'axiological', 'temperament'],
    activityKeywords: ['personality', 'trait', 'core_personality'],
    domains: ['personality', 'core'],
    phaseMatch: /\b(personality|trait)\b/i,
    note: 'Layered: worldgen baseline → core → emergent traits (THR-527/542/561).',
  },
  {
    name: 'Mortal Economy & Prosperity',
    aliases: ['economy', 'trade', 'resource', 'resources', 'prosperity', 'gold', 'market', 'settlement', 'cargo'],
    activityKeywords: ['prosperity', 'economic', 'resource', 'settlement'],
    domains: ['resource', 'settlement', 'economic', 'trade', 'gold', 'prosperity'],
    phaseMatch: /\b(prosperity|settlement|economic|resource|trade|gold)\b/i,
    note: 'Resource web, stock tiers, prosperity pulse, settlement tiers, trade routes. M3: Dynamic Economy.',
  },
  {
    name: 'Ambitions & Initiatives',
    aliases: ['ambition', 'initiative', 'goal', 'mentorship', 'apprentice'],
    activityKeywords: ['ambition', 'initiative', 'mentorship'],
    domains: ['ambition', 'initiative', 'mentorship'],
    phaseMatch: /\b(ambition|initiative|mentorship)\b/i,
    note: 'Agent-level drives and multi-tick initiatives; mentorship couples train-apprentice to mentors edges.',
  },
  {
    name: 'Attachments, Items & Possessions',
    aliases: ['attachment', 'attachments', 'item', 'items', 'possession', 'possessions', 'artifact', 'equipment', 'blessing', 'retainer', 'agreement'],
    // Measured against the standard 120-tick seed-42 run, not guessed: the activity
    // vocabulary contains `artifact` and `slot` but no `attachment`/`possession`/`reward`
    // token. Guessing the obvious nouns badged this subsystem DORMANT while possesses
    // edges were demonstrably growing 7→82 — the false-DORMANT error this generator's
    // header calls the dangerous one, because it hides live substrate from designers.
    activityKeywords: ['artifact', 'slot'],
    domains: ['attachment', 'seed'],
    phaseMatch: /\b(attachment|possession|slot cap)\b/i,
    note: 'Items, conditions, blessings, agreements, retainers on `possesses` edges. Effects flow via `effects[]` → `collectTestShapers` (2026-03-31 generic effect system). Contract liveness audited 2026-07-23 (THR-717) — five leaked contracts, see `Docs/canon/interface-map.md`.',
  },
  {
    name: 'Ruins, Clues & Delves',
    aliases: ['ruins', 'delve', 'dungeon', 'clue', 'lair', 'anomaly', 'quest'],
    activityKeywords: ['ruins', 'clue', 'delve', 'lair'],
    domains: ['ruins', 'delve', 'lair', 'anomaly'],
    phaseMatch: /\b(ruin|delve|clue|lair)\b/i,
    note: 'Ruin density seeding, clue discovery/decay, delve admission→progression→emergence, lair escalation.',
  },
  {
    name: 'Stealth, Detection & Hidden Marks',
    aliases: ['stealth', 'detection', 'hidden', 'mark', 'disbelief', 'faith', 'signature'],
    activityKeywords: ['hidden', 'mark', 'detection'],
    domains: ['stealth', 'detection', 'hidden'],
    phaseMatch: /\b(stealth|detection|hidden mark)\b/i,
    note: 'Two audiences watch the god: mortals (disbelief→faith) and rivals (signature scans). Hidden-mark decay.',
  },
  {
    name: 'Attention, Chronicle & Narrative',
    aliases: ['attention', 'chronicle', 'digest', 'narrative', 'story', 'feed'],
    activityKeywords: ['attention', 'chronicle', 'narrative'],
    domains: ['attention', 'chronicle', 'narrative'],
    phaseMatch: /\b(attention|chronicle|narrative)\b/i,
    note: 'The attention pool (can\'t watch everything), the digest, and the run\'s chronicle/narrative feed.',
  },
  {
    name: 'Omens & Atmospheric Pressure',
    aliases: ['omen', 'pressure', 'atmosphere', 'portent', 'foreshadowing'],
    activityKeywords: ['omen', 'foreshadow'],
    domains: ['omen', 'foreshadowing', 'emittedomen'],
    phaseMatch: /\b(omen|pressure|foreshadow)\b/i,
    note: 'Atmospheric pressure tracks and emitted omens (THR-19); motive-receipt foreshadowing (THR-631).',
  },
  {
    name: 'Strategic Projects & Control',
    aliases: ['strategic', 'project', 'control', 'contestation', 'territory'],
    activityKeywords: ['strategic', 'contestation', 'control'],
    domains: ['strategic', 'contestation', 'control'],
    phaseMatch: /\b(strategic|control|contestation)\b/i,
    note: 'Multi-tick strategic projects, control degradation, contestation resolution.',
  },
  {
    name: 'Ascendant Beats & Progression',
    aliases: ['beat', 'spine', 'director', 'ascendant progression', 'milestone'],
    activityKeywords: ['ascendant', 'beat'],
    domains: ['ascendantbeat', 'ascendant'],
    phaseMatch: /\b(beat|ascendant progression)\b/i,
    note: 'Ascendant beat director offers beats at doom/tier thresholds (THR-613). Deepening vs milestone beats.',
  },
  {
    name: 'Movement & Colocation',
    aliases: ['movement', 'travel', 'pathfinding', 'colocation', 'sublocation'],
    activityKeywords: ['movement', 'reroute', 'colocation'],
    domains: ['avatarmove', 'movement'],
    phaseMatch: /\b(movement|colocation|sublocation dissolution)\b/i,
    note: 'Goal-directed agent movement, same-hex colocation detection, sublocation dissolution.',
  },
  {
    name: 'Reputation & Influence',
    aliases: ['reputation', 'influence', 'renown', 'standing'],
    activityKeywords: ['reputation', 'influence'],
    domains: ['reputation', 'influence'],
    phaseMatch: /\b(reputation|influence)\b/i,
    note: 'Reach-polarity reputation traits and divine influence decay + tier promotion.',
  },
  {
    name: 'Secrets & Favors',
    aliases: ['secret', 'secrets', 'favor', 'blackmail', 'leverage'],
    activityKeywords: ['secret', 'favor', 'leverage'],
    domains: ['secrets', 'favor'],
    phaseMatch: /\b(secret|favor)\b/i,
    note: 'Secret/favor economy. If shown DORMANT, it produced no distinctly-named output this run — verify before assuming unused.',
  },
  {
    name: 'Effects & Conditions',
    aliases: ['effect', 'condition', 'buff', 'debuff', 'status', 'possession', 'slot'],
    activityKeywords: ['effect', 'condition'],
    domains: ['effect', 'effects', 'condition', 'conditiondecay', 'conditionoverflow'],
    phaseMatch: /\b(effect|condition|slot cap)\b/i,
    note: 'Per-agent effect bookkeeping (duration/cooldown/decay/stacking), effect shells, condition decay + overflow, slot caps.',
  },
  {
    name: 'Agent Lifecycle',
    aliases: ['lifecycle', 'birth', 'death', 'migration', 'graduation', 'apotheosis', 'npc'],
    activityKeywords: ['birth', 'graduated', 'lifecycle'],
    domains: ['agentlifecycle', 'agent', 'apotheosis', 'anointsuccessor'],
    phaseMatch: /\b(lifecycle|graduation|apotheosis)\b/i,
    note: 'Agent death, birth, migration; NPC graduation to individuals; apotheosis capstone seeding on tier-4 mortals.',
  },
  {
    name: 'Intelligence, Knowledge & Familiarity',
    aliases: ['intelligence', 'knowledge', 'familiarity', 'interaction', 'revelation', 'facet'],
    activityKeywords: ['interaction', 'intelligence', 'familiarity'],
    domains: ['intelligence', 'interaction', 'familiarity', 'knowledge'],
    phaseMatch: /\b(intelligence|interaction depth|familiarity)\b/i,
    note: 'Knowledge-facet accumulation from encounters/observations, interaction depth, intelligence reliability decay.',
  },
  {
    name: 'Spheres & Quintessence',
    aliases: ['sphere', 'quintessence', 'foundation', 'creation', 'saturation', 'world-soul'],
    activityKeywords: ['sphere', 'quintessence', 'saturation'],
    domains: ['sphere', 'quintessence', 'saturation', 'cosmology'],
    phaseMatch: /\b(sphere|quintessence|saturation|world-soul)\b/i,
    note: 'Sphere pressure resolution, quintessence tick, global World-Soul aggregation, magical saturation.',
  },
];

/**
 * Canonical subsystem names, for cross-registry validation. `interface-contracts.ts`
 * checks every contract's `producerSystem`/`consumerSystem` against this set so a
 * typo or a divergent name surfaces as a registry error instead of a silently
 * unmatched row.
 */
export const SUBSYSTEM_NAMES: ReadonlySet<string> = new Set(SUBSYSTEMS.map((s) => s.name));
