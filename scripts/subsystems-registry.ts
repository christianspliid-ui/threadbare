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
    domains: ['essence', 'essencesource', 'control', 'player'],
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
    domains: ['personality', 'core', 'trait', 'traits'],
    phaseMatch: /\b(personality|trait)\b/i,
    note: 'Layered: worldgen baseline → core → emergent traits (THR-527/542/561).',
  },
  {
    name: 'Mortal Economy & Prosperity',
    aliases: ['economy', 'trade', 'resource', 'resources', 'prosperity', 'gold', 'market', 'settlement', 'cargo', 'holding', 'freehold', 'wealth', 'tithe', 'toll'],
    activityKeywords: ['prosperity', 'economic', 'resource', 'settlement', 'holding'],
    // 'yield' joins since THR-1439: `yieldOps.ts` is the active half of holding —
    // the harvest of a held Location and the raising of a lane's volume — which is this
    // subsystem's business for the same reason holding income is.
    domains: ['resource', 'settlement', 'economic', 'trade', 'gold', 'prosperity', 'holding', 'yield'],
    // `holding income` joins the match since THR-1428: what a mortal holds pays them,
    // which is this subsystem's business even though the *producing* cells belong to
    // Ambitions & Undertakings.
    phaseMatch: /\b(prosperity|settlement|economic|resource|trade|gold|holding income)\b/i,
    note: 'Resource web, stock tiers, prosperity pulse, settlement tiers, trade routes, holding income (a seized route\'s toll, a freehold\'s keep, a controlled Location\'s tithe). M3: Dynamic Economy.',
  },
  {
    name: 'Ambitions & Undertakings',
    // 'initiative' stays an alias: the pipeline is retired (THR-1292 §3) but saved worlds
    // and historical traces still carry the word, and the matcher reads those.
    aliases: ['ambition', 'undertaking', 'initiative', 'goal', 'mentorship', 'apprentice'],
    activityKeywords: ['ambition', 'undertaking', 'mentorship'],
    domains: ['ambition', 'undertaking', 'mentorship'],
    phaseMatch: /\b(ambition|undertaking|initiative|mentorship)\b/i,
    note: 'Agent-level drives and the multi-tick undertakings that serve them; mentorship rides the undertaking checkpoint pass (THR-1292 §3 retired the separate initiative pipeline).',
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
    domains: ['attachment', 'seed', 'holdings', 'companions', 'reward'],
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
    name: 'Diagnostics & Incident Capture',
    aliases: ['diagnostics', 'incident', 'snapshot', 'health', 'crash', 'flight recorder'],
    activityKeywords: ['incident_bundle', 'tick_health', 'tick_crash'],
    domains: ['diagnostics', 'incident'],
    phaseMatch: /\b(health validation|tick health)\b/i,
    note: 'THR-1134. The tick-end health validator and crash log, the incident flight recorder on `SimulationRuntime`, and the bundle assembler behind Settings → Trouble → Save a snapshot. **Expect a DORMANT badge on a healthy headless run, and read it as good news:** two of its three activity signals (`tick_health`, `tick_crash`) only fire when something has gone wrong, and the third (`incident_bundle`) only when a person presses the button — neither happens in the inventory\'s 120-tick sweep. The collector itself runs every tick in every session, production included.',
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
    name: 'Companies & Group Travel',
    // `companion` is deliberately NOT an alias (THR-1407): `companions.ts` mints the Companion
    // kind under Attachments — its module header is explicit that a companion is *not* an actor —
    // so the alias here was a false search hit pointing designers at the wrong subsystem.
    aliases: ['company', 'companies', 'group', 'party', 'band', 'fellowship', 'cohesion'],
    activityKeywords: ['group_phase', 'group_formed', 'group_dissolved'],
    domains: ['groups'],
    phaseMatch: /\bgroups?\b/i,
    note: 'Small named companies of unique agents (THR-74): formation from colocated compatible agents, shared movement with dissent, event-driven cohesion, dissolution that persists as history. Distinct from War & Armies — armies are faction-scale with an abstract headcount, companies are <=10 named individuals who keep their own decision loops.',
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
    domains: ['reputation', 'influence', 'grievance'],
    phaseMatch: /\b(reputation|influence)\b/i,
    note: 'Reach-polarity reputation traits and divine influence decay + tier promotion.',
  },
  {
    name: 'Secrets & Favors',
    aliases: ['secret', 'secrets', 'favor', 'blackmail', 'leverage'],
    activityKeywords: ['secret', 'favor', 'leverage'],
    // 'leverage' joins since THR-1439: `leverageOps.ts` is where a mark is stolen and
    // a favour is minted, spent and forgiven — the two economies this row already owns.
    domains: ['secrets', 'favor', 'secret', 'leverage'],
    phaseMatch: /\b(secret|favor)\b/i,
    note: 'Secret/favor economy. If shown DORMANT, it produced no distinctly-named output this run — verify before assuming unused.',
  },
  {
    name: 'Effects & Conditions',
    aliases: ['effect', 'condition', 'buff', 'debuff', 'status', 'possession', 'slot'],
    activityKeywords: ['effect', 'condition'],
    domains: ['effect', 'effects', 'condition', 'conditiondecay', 'conditionoverflow', 'spell'],
    phaseMatch: /\b(effect|condition|slot cap)\b/i,
    note: 'Per-agent effect bookkeeping (duration/cooldown/decay/stacking), effect shells, condition decay + overflow, slot caps.',
  },
  {
    name: 'Agent Lifecycle',
    aliases: ['lifecycle', 'birth', 'death', 'migration', 'graduation', 'apotheosis', 'npc'],
    activityKeywords: ['birth', 'graduated', 'lifecycle'],
    domains: ['agentlifecycle', 'agent', 'apotheosis', 'anointsuccessor', 'npc', 'binding'],
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
    domains: ['sphere', 'quintessence', 'saturation', 'cosmology', 'domain', 'capability', 'reach'],
    phaseMatch: /\b(sphere|quintessence|saturation|world-soul)\b/i,
    note: 'Sphere pressure resolution, quintessence tick, global World-Soul aggregation, magical saturation.',
  },
  {
    name: 'World Generation, Terrain & Places',
    aliases: ['worldgen', 'world generation', 'terrain', 'biome', 'elevation', 'climate', 'hydrology',
              'hex map', 'tile', 'coastline', 'river', 'lake', 'settlement genome', 'sublocation',
              'place', 'region', 'area'],
    // Measured against the standard 120-tick seed-42 medium run (THR-1407), not guessed.
    // The obvious nouns are all ABSENT from the activity vocabulary — `terrain`, `worldgen`
    // and `genome` never appear as a trace category or event type, because this subsystem
    // does most of its work in `initializeGameState` rather than in a tick phase. Badging
    // it on those three would have reproduced the false-DORMANT error this file's
    // Attachments row records at :136-140. `hex`, `settlement` and `location` are present.
    activityKeywords: ['hex', 'settlement', 'location'],
    domains: ['world', 'worldgen', 'terrain', 'coastline', 'river', 'lake', 'depression',
              'region', 'hex', 'sublocation', 'settlementgenome', 'road'],
    // `settlement tier`, not bare `settlement`: promotion/demotion and genome reassessment
    // change what stands on the map, but Settlement *Prosperity* is what a settlement
    // produces — Mortal Economy & Prosperity's, per this row's note.
    phaseMatch: /\b(worldgen|terrain|genome|hex state|settlement tier)\b/i,
    note: 'The map itself and what worldgen puts on it: Areas, Hexes, Locations, Places. Distinct from Movement & Colocation, which moves agents across them and owns sublocation dissolution; distinct from Mortal Economy & Prosperity, which owns what settlements produce rather than where they are.',
  },
];

/**
 * Canonical subsystem names, for cross-registry validation. `interface-contracts.ts`
 * checks every contract's `producerSystem`/`consumerSystem` against this set so a
 * typo or a divergent name surfaces as a registry error instead of a silently
 * unmatched row.
 */
export const SUBSYSTEM_NAMES: ReadonlySet<string> = new Set(SUBSYSTEMS.map((s) => s.name));

/**
 * Every `domains` token any row claims — the vocabulary the world-object registry's
 * reverse pin resolves writer modules against (THR-1407).
 */
export const SUBSYSTEM_DOMAINS: ReadonlySet<string> = new Set(SUBSYSTEMS.flatMap((s) => s.domains));

/**
 * Module domains that deliberately belong to no single subsystem (THR-1407).
 *
 * `domainOf()` in `generate-systems-inventory.ts` buckets a top-level module by the
 * leading lower-case token of its basename, so these three collapse work from a dozen
 * subsystems into one token: `phaseFactionActions.ts` and `phaseDoom.ts` are both
 * `phase`; `gameInit.ts` boots every subsystem at once; `unifiedActionResolution.ts` is
 * the shared action pipeline every verb runs through. Claiming one of them for a single
 * row would attribute all of its siblings to that row in the systems inventory — a
 * misattribution worse than the gap it closes. They are listed here, rather than
 * silently skipped, so the reverse pin still fails on a genuinely unhomed writer.
 */
export const CROSS_CUTTING_DOMAINS: ReadonlySet<string> = new Set(['game', 'phase', 'unified']);

/**
 * Which module-domain token a module under `src/engine/` belongs to (THR-1431).
 *
 * Moved here from `generate-systems-inventory.ts` so the two generators that need it
 * share one authority rather than keeping divergent copies — the drift this module was
 * extracted to stop. A module in a sub-directory takes the directory name
 * (`groups/phaseGroups.ts` → `groups`); a top-level module takes the leading lower-case
 * run of its basename (`strategicGraphOps.ts` → `strategic`, `phaseDoom.ts` → `phase`).
 *
 * @param relFromEngine module path relative to `src/engine/`, either separator.
 */
export function domainOf(relFromEngine: string): string {
  // Both separators, deliberately: `path.relative` yields backslashes on Windows, and a
  // class of `/` alone silently stops splitting sub-directory modules there — they fall
  // through to the basename branch, so `content-eval\detectors.ts` buckets as `content`
  // and merges two real domains into one. It still compiles and every test still passes;
  // only `check:generated-freshness` catches it.
  const parts = relFromEngine.split(/[\\/]/);
  if (parts.length > 1) return parts[0].toLowerCase();
  const base = parts[0].replace(/\.ts$/, '');
  return (base.match(/^[a-z0-9]+/)?.[0] ?? base).toLowerCase();
}

/**
 * The subsystem a module under `src/engine/` implements, or `null` when it belongs to
 * none (THR-1431).
 *
 * `null` has two distinct causes and the caller is expected to treat them the same way
 * — as "this module does not tell you which subsystem was reached":
 *   - a **cross-cutting** domain (`CROSS_CUTTING_DOMAINS`): `phase`, `game`, `unified`
 *     collapse a dozen subsystems into one token, so claiming one would attribute all
 *     of its siblings to that row;
 *   - a domain no row claims at all.
 */
export function subsystemForModule(relFromEngine: string): string | null {
  const domain = domainOf(relFromEngine);
  if (CROSS_CUTTING_DOMAINS.has(domain)) return null;
  return SUBSYSTEMS.find((s) => s.domains.includes(domain))?.name ?? null;
}
