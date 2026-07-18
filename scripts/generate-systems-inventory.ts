/**
 * generate-systems-inventory — THR-658.
 *
 * Emits `Docs/canon/systems-inventory.md`: a generated, grep-able map of every
 * subsystem wired into the engine, with an ACTIVE / DORMANT badge derived from a
 * standard headless run. Built because a design session (THR-614) planned a
 * green-field war system while ~3,300 lines of it sat wired in `orchestrator.ts`
 * with no canon page, no rulebook entry, and drifted naming ("TB-073 Conflict &
 * Destruction" built; "war / armies" designed). This inventory is the
 * substrate-existence surface the design workflow greps before drafting an
 * Engine-pillar plan.
 *
 * Three data layers:
 *   1. **Subsystem registry** (curated, additive) — one row per player-meaningful
 *      subsystem: aliases (incl. legacy TB-xx names), the engine domains + tick
 *      phases that implement it, and a GENERATED ACTIVE/DORMANT badge. This is the
 *      "does X already exist, and does it run?" answer, kept reliable by hand-picked
 *      activity keywords. The only hand-maintained piece — but its coverage is
 *      lint-checked against the mechanical layers below, so a new wired phase that
 *      no subsystem claims surfaces under "Unclassified phases".
 *   2. **Tick-loop phases** (mechanical) — every `// Phase X.Y: Name (tags)` comment
 *      in `orchestrator.ts` + the `ENGINE_PHASES` registry. The wiring ground truth.
 *   3. **Engine modules by domain** (mechanical) — every module under `src/engine/**`
 *      (excluding tests), clustered by sub-dir / leading token. The completeness
 *      guarantee: if it is coded, it is here.
 *
 * The badge comes from a 120-tick seed-42 headless run: the union of runtime trace
 * *categories* and tick-event *types* is tokenised into an activity vocabulary. A
 * subsystem is DORMANT when none of its activity keywords appear — i.e. it is wired
 * but produced no matching output (the exact trace-count check the issue asks for).
 * Badging is confined to the curated registry because a per-phase heuristic is
 * unreliable: many phases emit under shared category names (the army phases emit
 * `faction_ambition`, not `army_*`), so a naive per-phase token match false-flags a
 * live phase as dormant — the one dangerous error, since it would hide substrate.
 *
 * Fail-soft (NFP #4): if the headless run throws, the structural inventory (registry
 * rows, phases, modules, tags) is still emitted with every badge degraded to
 * UNKNOWN — searchability survives an unstable engine.
 *
 * Usage:
 *   npm run generate-systems-inventory            # write the doc
 *   npm run generate-systems-inventory:check      # regenerate + diff vs committed (advisory)
 *   npm run generate-systems-inventory -- --ticks 200 --seed 7 --map large
 */

import * as fs from 'fs';
import * as path from 'path';

import { initializeGameState, MAP_SIZE_PRESETS } from '../src/engine/gameInit';
import type { MapSizePreset } from '../src/engine/gameInit';
import { runTick, resetEventCounter, resetDecisionCache } from '../src/engine/orchestrator';
import { createBalancedCosmology } from '../src/engine/cosmology';
import { generateArchetypes } from '../src/engine/ascendant';
import { createSimulationRuntime } from '../src/engine/simulationRuntime';
import { enableTracing, getTraces, clearTraces } from '../src/engine/traceBuffer';
import { ENGINE_PHASES } from '../src/engine/phases';

// ─── Tunable constants (NFP #1) ───────────────────────────────────────────────

/** Standard run the ACTIVE/DORMANT badge is computed against. Matches the CLAUDE.md engine-smoke seed. */
const DEFAULT_TICKS = 120;
const DEFAULT_SEED = 42;
const DEFAULT_MAP: MapSizePreset = 'medium';

const OUTPUT_REL = path.join('Docs', 'canon', 'systems-inventory.md');
const ENGINE_REL = path.join('src', 'engine');
const ORCHESTRATOR_REL = path.join('src', 'engine', 'orchestrator.ts');

/** Legacy / provenance tags harvested from phase comments and module headers. */
const TAG_RE = /\b(TB-\d+|THR-\d+|M\d+(?:\.\d+)?|Phase\s+\d+)\b/g;
/** Inline phase-comment shape: `// Phase 2.352: Army Movement (TB-073 — …)`. */
const PHASE_COMMENT_RE = /^\s*\/\/\s*Phase\s+([\w.]+):\s*(.+?)\s*$/;
/** Chars of each module read when harvesting header-comment provenance tags. */
const HEADER_SCAN_CHARS = 1500;

/**
 * Curated subsystem registry — the substrate a designer might otherwise rebuild.
 * Additive only, so it can never cause completeness drift (the mechanical tables
 * remain the guarantee). Each entry:
 *   - `aliases`: every noun a premise might use (incl. legacy names) — search keys.
 *   - `activityKeywords`: single lower-case tokens that appear in the runtime
 *     activity vocabulary when the subsystem is doing its job. The badge is ACTIVE
 *     iff any appears. Chosen from observed trace categories / event types.
 *   - `domains`: engine module-domain tokens (Section 3) that implement it.
 *   - `phaseMatch`: regex over phase names/tags to claim the tick phases (Section 2).
 */
interface Subsystem {
  name: string;
  aliases: string[];
  activityKeywords: string[];
  domains: string[];
  phaseMatch: RegExp;
  note: string;
}

const SUBSYSTEMS: readonly Subsystem[] = [
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

// ─── Types ─────────────────────────────────────────────────────────────────

type Badge = 'active' | 'dormant' | 'unknown';

interface PhaseRow {
  id: string;
  name: string;
  tags: string[];
  source: 'orchestrator' | 'registry';
}
interface DomainRow { domain: string; files: string[]; tags: string[] }

// ─── Args ────────────────────────────────────────────────────────────────────

interface Args { ticks: number; seed: number; mapSize: MapSizePreset; check: boolean }

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  const a: Args = { ticks: DEFAULT_TICKS, seed: DEFAULT_SEED, mapSize: DEFAULT_MAP, check: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--check') a.check = true;
    else if (arg === '--ticks' && argv[i + 1]) { const n = parseInt(argv[++i], 10); if (!isNaN(n)) a.ticks = n; }
    else if (arg === '--seed' && argv[i + 1]) { const n = parseInt(argv[++i], 10); if (!isNaN(n)) a.seed = n; }
    else if (arg === '--map' && argv[i + 1]) { const m = argv[++i]; if (m in MAP_SIZE_PRESETS) a.mapSize = m as MapSizePreset; }
  }
  return a;
}

// ─── Structural parse ──────────────────────────────────────────────────────

function parseOrchestratorPhases(repoRoot: string): PhaseRow[] {
  const src = fs.readFileSync(path.join(repoRoot, ORCHESTRATOR_REL), 'utf-8');
  const rows: PhaseRow[] = [];
  for (const line of src.split(/\r?\n/)) {
    const m = PHASE_COMMENT_RE.exec(line);
    if (!m) continue;
    const rest = m[2];
    const name = rest.replace(/\s*\(.*$/, '').trim();
    const tags = uniq((rest.match(TAG_RE) ?? []).map(t => t.replace(/\s+/g, ' ')));
    rows.push({ id: m[1], name, tags, source: 'orchestrator' });
  }
  return rows;
}

function registryPhaseRows(): PhaseRow[] {
  return ENGINE_PHASES.map(p => ({ id: p.id, name: p.id, tags: [], source: 'registry' as const }));
}

/** Domain for a module: its first sub-directory under src/engine, else the leading
 *  lower-case token of a top-level file's basename (`armyMovement` → `army`). */
function domainOf(relFromEngine: string): string {
  const parts = relFromEngine.split(/[\\/]/);
  if (parts.length > 1) return parts[0].toLowerCase();
  const base = parts[0].replace(/\.ts$/, '');
  return (base.match(/^[a-z0-9]+/)?.[0] ?? base).toLowerCase();
}

function isSourceModule(name: string): boolean {
  return name.endsWith('.ts') && !name.endsWith('.d.ts') && !name.endsWith('.test.ts') && !name.endsWith('.spec.ts');
}

function walkEngine(repoRoot: string): { rel: string; abs: string }[] {
  const root = path.join(repoRoot, ENGINE_REL);
  const out: { rel: string; abs: string }[] = [];
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const abs = path.join(dir, entry.name);
      if (entry.isDirectory()) { if (entry.name !== '__tests__') walk(abs); }
      else if (isSourceModule(entry.name)) out.push({ rel: path.relative(root, abs), abs });
    }
  };
  walk(root);
  return out;
}

function clusterModules(repoRoot: string): DomainRow[] {
  const byDomain = new Map<string, DomainRow>();
  for (const { rel, abs } of walkEngine(repoRoot)) {
    const domain = domainOf(rel);
    let row = byDomain.get(domain);
    if (!row) { row = { domain, files: [], tags: [] }; byDomain.set(domain, row); }
    row.files.push(rel.replace(/\\/g, '/'));
    const header = fs.readFileSync(abs, 'utf-8').slice(0, HEADER_SCAN_CHARS);
    for (const t of header.match(TAG_RE) ?? []) row.tags.push(t.replace(/\s+/g, ' '));
  }
  return [...byDomain.values()]
    .map(r => ({ ...r, files: r.files.sort(), tags: uniq(r.tags) }))
    .sort((a, b) => a.domain.localeCompare(b.domain));
}

// ─── Activity run ────────────────────────────────────────────────────────────

/** Tokenised activity vocabulary from a headless run: the set of lower-case tokens
 *  from every trace category + tick-event type observed. `null` if the run threw. */
function buildActivityTokens(args: Args): Set<string> | null {
  resetDecisionCache();
  resetEventCounter();
  clearTraces();
  enableTracing();
  const runtime = createSimulationRuntime();
  const cosmology = createBalancedCosmology();
  const preset = MAP_SIZE_PRESETS[args.mapSize];
  const archetype = generateArchetypes(4, args.seed)[0];
  const { state: initial } = initializeGameState(archetype, 'SystemsInventory', cosmology, args.seed, preset.cols, preset.rows);

  const tokens = new Set<string>();
  const add = (raw: string) => { for (const tok of raw.toLowerCase().split(/[^a-z0-9]+/)) if (tok) tokens.add(tok); };
  let state = initial;
  for (let i = 0; i < args.ticks; i++) {
    state = runTick(state, [], runtime);
    for (const t of getTraces()) add(t.category);         // drain per tick — survives ring eviction
    for (const e of state.recentEvents) add(String(e.type));
  }
  return tokens;
}

function badgeFor(keywords: string[], tokens: Set<string> | null): Badge {
  if (tokens === null) return 'unknown';
  return keywords.some(k => tokens.has(k.toLowerCase())) ? 'active' : 'dormant';
}

// ─── Rendering ────────────────────────────────────────────────────────────────

const BADGE_LABEL: Record<Badge, string> = { active: '🟢 ACTIVE', dormant: '🟠 DORMANT', unknown: '⚪ UNKNOWN' };
function uniq<T>(xs: T[]): T[] { return [...new Set(xs)]; }
function fmtTags(tags: string[]): string { return tags.length ? tags.map(t => '`' + t + '`').join(', ') : '—'; }
function fmtList(xs: string[]): string { return xs.length ? xs.map(x => '`' + x + '`').join(', ') : '—'; }

interface SubsystemView extends Subsystem { badge: Badge; phaseIds: string[] }

function render(args: Args, subsystems: SubsystemView[], phases: PhaseRow[], domains: DomainRow[], unclaimed: PhaseRow[], ran: boolean): string {
  const L: string[] = [];
  const dormant = subsystems.filter(s => s.badge === 'dormant');

  L.push('# Systems Inventory');
  L.push('');
  L.push('> **GENERATED FILE — do not edit by hand.** Regenerate with `npm run generate-systems-inventory`.');
  L.push('> Ground truth: the subsystem registry in `scripts/generate-systems-inventory.ts` + `orchestrator.ts` phase comments + the `ENGINE_PHASES` registry + every module under `src/engine/**` + a headless run.');
  L.push('');
  L.push('This is the **substrate-existence surface** for the design workflow (THR-658). Before drafting any plan');
  L.push('with an Engine pillar, grep this file (and `src/engine/`) for the domain nouns of your premise. If a');
  L.push('subsystem already exists here, your plan must say whether it **extends / activates / replaces** it —');
  L.push('never propose a green-field build of something already listed. A 🟠 DORMANT badge means *wired but no');
  L.push('matching output was observed* in the standard run — it exists; it is not missing.');
  L.push('');
  L.push('**Run inputs:** seed `' + args.seed + '`, `' + args.ticks + '` ticks, `' + args.mapSize + '` map.');
  if (!ran) {
    L.push('');
    L.push('> ⚠️ **The headless run failed this generation** — every badge is ⚪ UNKNOWN. The structural inventory');
    L.push('> below is still complete; re-run once the engine is stable to restore badges.');
  }
  L.push('');
  L.push('**Badge:** 🟢 ACTIVE = produced matching runtime output · 🟠 DORMANT = wired, no matching output observed · ⚪ UNKNOWN = run unavailable.');
  L.push('DORMANT is a keyword-match heuristic against one seed — a strong signal, but a phase that emits under a shared category name can read DORMANT while still doing work; verify before assuming truly unused.');
  L.push('');

  // ── Built-but-dormant callout ──
  L.push('## ⚠️ Built-but-dormant subsystems');
  L.push('');
  L.push('Registered but producing no matching output in the standard run. **The highest-risk substrate for a');
  L.push('design agent** — they exist, are easy to miss (no playtest or screenshot reveals them), and a');
  L.push('green-field plan will silently duplicate them. This is the exact failure THR-614 hit.');
  L.push('');
  if (!ran) L.push('_Unavailable — the headless run failed this generation._');
  else if (dormant.length === 0) L.push('_None detected in this run — every registered subsystem produced output._');
  else {
    L.push('| Subsystem | Aliases | Domains | Note |');
    L.push('|---|---|---|---|');
    for (const s of dormant) L.push(`| ${s.name} | ${s.aliases.join(', ')} | ${fmtList(s.domains)} | ${s.note} |`);
  }
  L.push('');

  // ── Subsystem registry ──
  L.push('## Subsystem registry');
  L.push('');
  L.push('One row per player-meaningful subsystem, with the engine domains + tick phases that implement it and a');
  L.push('generated activity badge. **Search here first** — the aliases column carries the nouns (incl. legacy');
  L.push('names like `TB-073`) a premise might use.');
  L.push('');
  L.push('| Subsystem | Status | Aliases (search keys) | Domains | Tick phases |');
  L.push('|---|---|---|---|---|');
  for (const s of subsystems) {
    L.push(`| **${s.name}** | ${BADGE_LABEL[s.badge]} | ${s.aliases.join(', ')} | ${fmtList(s.domains)} | ${s.phaseIds.length ? s.phaseIds.map(p => '`' + p + '`').join(', ') : '—'} |`);
  }
  L.push('');
  for (const s of subsystems) {
    L.push(`- **${s.name}** — ${s.note}`);
  }
  L.push('');

  // ── Unclassified phases (drift signal) ──
  L.push('## Unclassified tick phases');
  L.push('');
  L.push('Wired phases that **no subsystem registry entry claims**. When this list is non-empty a new system has');
  L.push('landed without a registry row — add it to `SUBSYSTEMS` in the generator so the subsystem search stays');
  L.push('complete. (These phases still appear in the full wiring table below; they just lack a curated home.)');
  L.push('');
  if (unclaimed.length === 0) L.push('_None — every wired phase maps to a registered subsystem._');
  else {
    L.push('| Phase | Name | Tags |');
    L.push('|---|---|---|');
    for (const p of unclaimed) L.push(`| \`${p.id}\` | ${p.name} | ${fmtTags(p.tags)} |`);
  }
  L.push('');

  // ── Full tick-loop wiring ──
  L.push('## Tick-loop phases (full wiring)');
  L.push('');
  L.push('Every phase the orchestrator runs each tick — inline `orchestrator.ts` comments then the `ENGINE_PHASES`');
  L.push('registry. The wiring ground truth: if it is on the tick path, it is here.');
  L.push('');
  L.push('| Phase | Name | Legacy tags | Source |');
  L.push('|---|---|---|---|');
  for (const p of phases) L.push(`| \`${p.id}\` | ${p.name} | ${fmtTags(p.tags)} | ${p.source} |`);
  L.push('');

  // ── Full engine domains ──
  L.push('## Engine modules by domain (full)');
  L.push('');
  L.push('Every module under `src/engine/**` (excluding tests), clustered by sub-directory or leading token. The');
  L.push('completeness guarantee — if a system is coded, it is in this table. Sorted alphabetically for grep.');
  L.push('');
  L.push('| Domain | Files | Tags |');
  L.push('|---|---|---|');
  for (const d of domains) L.push(`| \`${d.domain}\` (${d.files.length}) | ${fmtList(d.files)} | ${fmtTags(d.tags)} |`);
  L.push('');

  L.push('---');
  L.push('');
  L.push(`_Counts: ${subsystems.length} registered subsystems (${dormant.length} dormant) · ${phases.length} tick phases · ${domains.length} engine domains · ${domains.reduce((n, d) => n + d.files.length, 0)} modules._`);
  L.push('');
  return L.join('\n');
}

// ─── Main ────────────────────────────────────────────────────────────────────

function main(): void {
  const args = parseArgs();
  const repoRoot = process.cwd();

  const phases = [...parseOrchestratorPhases(repoRoot), ...registryPhaseRows()];
  const domains = clusterModules(repoRoot);

  let tokens: Set<string> | null = null;
  try {
    tokens = buildActivityTokens(args);
  } catch (err) {
    console.warn(`[generate-systems-inventory] headless run failed — badges degraded to UNKNOWN: ${(err as Error).message}`);
  }

  // Assign phases to subsystems (a phase may match several; that's fine).
  const claimed = new Set<string>();
  const subsystems: SubsystemView[] = SUBSYSTEMS.map(s => {
    const phaseIds = phases
      .filter(p => s.phaseMatch.test(p.name) || p.tags.some(t => s.phaseMatch.test(t)))
      .map(p => p.id);
    for (const id of phaseIds) claimed.add(id);
    return { ...s, phaseIds: uniq(phaseIds), badge: badgeFor(s.activityKeywords, tokens) };
  });
  const unclaimed = phases.filter(p => p.source === 'orchestrator' && !claimed.has(p.id));

  const out = render(args, subsystems, phases, domains, unclaimed, tokens !== null);
  const outPath = path.join(repoRoot, OUTPUT_REL);

  if (args.check) {
    // ADVISORY by default (SYSTEMS_INVENTORY_CHECK=advisory): a stale doc warns but
    // exits 0, mirroring check:wiki-freshness so it can chain into check:process
    // without breaking the advisory lint. Flip to `blocking` on an explicit verdict.
    const blocking = process.env.SYSTEMS_INVENTORY_CHECK === 'blocking';
    const existing = fs.existsSync(outPath) ? fs.readFileSync(outPath, 'utf-8') : '';
    if (existing.trim() === out.trim()) { console.log('[generate-systems-inventory] --check: up to date.'); process.exit(0); }
    console.warn(`[generate-systems-inventory] --check: ${OUTPUT_REL} is STALE. Run \`npm run generate-systems-inventory\`.`);
    process.exit(blocking ? 1 : 0);
  }

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, out, 'utf-8');
  const dormant = subsystems.filter(s => s.badge === 'dormant').length;
  console.log(`[generate-systems-inventory] wrote ${OUTPUT_REL} — ${subsystems.length} subsystems (${dormant} dormant), ${phases.length} phases, ${domains.length} domains, ${unclaimed.length} unclassified phases.`);
}

main();
