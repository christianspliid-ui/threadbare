/**
 * Faction rank-reachability sweep (THR-810).
 *
 * Measures whether the apex guild rank tier (`minReputation` 0.85) is reachable
 * within a run of normal length, and reports the reputation economy's actual
 * flow: gains by cause vs decay, and the distribution of `member_of.reputation`.
 *
 * Acceptance evidence for THR-810 — the ticket asks the sweep to *re-measure* the
 * ceiling rather than assume the 0.78 figure recorded at filing time.
 *
 * It currently exits **non-zero**, and that is the correct reading: no mortal holds an
 * apex tier and every rank-gated template is blocked, because faction encounters never
 * reach faction members at all (THR-814). Once that lands this becomes a live gate.
 * Verdict + full evidence: `Docs/audits/2026-07-27-thr-810-guild-rank-reachability.md`.
 *
 * Measure inside the `phase: playing` window only — the run enters `twilight` between
 * ticks 150 and 225, so later samples describe a post-game world. Each sample carries
 * its phase for that reason.
 *
 * Usage:
 *   npx tsx scripts/rank-reach-sweep.ts [--seed 42] [--map medium] [--ticks 900]
 *   npm run sweep:rank-reach
 */

import { initializeGameState, MAP_SIZE_PRESETS } from '../src/engine/gameInit';
import type { MapSizePreset } from '../src/engine/gameInit';
import { runTick } from '../src/engine/orchestrator';
import { createBalancedCosmology } from '../src/engine/cosmology';
import { generateArchetypes } from '../src/engine/ascendant';
import { createSimulationRuntime } from '../src/engine/simulationRuntime';
import { FACTION_DEFINITIONS } from '../src/data/faction-definitions';
import { computeRankFromReputation } from '../src/types/faction';
import { meetsFactionRankRequirement } from '../src/engine/factionReputation';
import { FACTION_ENCOUNTER_META } from '../src/data/faction-encounter-content';
import type { GameState } from '../src/types/gameState';
import type { MemberOfEdgeProperties } from '../src/types/disposition';

// ─── Args ────────────────────────────────────────────────────────────────

const argv = process.argv.slice(2);
function flag(name: string, fallback: string): string {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback;
}
const SEED = Number(flag('seed', '42'));
const MAP = flag('map', 'medium') as MapSizePreset;
const TICKS = Number(flag('ticks', '900'));
/** Ticks between distribution samples. */
const SAMPLE_EVERY = Number(flag('every', '150'));

// ─── Measurement ─────────────────────────────────────────────────────────

interface Sample {
  tick: number;
  /** Run phase at sample time — a `twilight`/`harvest` sample is a post-game world, not a live run. */
  phase: string;
  memberships: number;
  max: number;
  p90: number;
  median: number;
  ge060: number;
  ge075: number;
  ge085: number;
  /** Distinct mortals holding each guild's apex tier at this sample. */
  apexHolders: number;
}

function reputations(state: GameState): number[] {
  return state.graph
    .getEdgesByType('member_of')
    .map(e => e.properties as Partial<MemberOfEdgeProperties>)
    .filter(p => Boolean(p.factionDefId))
    .map(p => p.reputation ?? 0)
    .sort((a, b) => b - a);
}

/** Mortals standing at the top `rankTiers` entry of their own faction definition. */
function apexHolders(state: GameState): number {
  let n = 0;
  for (const edge of state.graph.getEdgesByType('member_of')) {
    const props = edge.properties as Partial<MemberOfEdgeProperties>;
    if (!props.factionDefId) continue;
    const def = FACTION_DEFINITIONS.get(props.factionDefId);
    if (!def || def.rankTiers.length === 0) continue;
    const apex = def.rankTiers[def.rankTiers.length - 1];
    if (computeRankFromReputation(props.reputation ?? 0, def).id === apex.id) n++;
  }
  return n;
}

/**
 * How many faction members can reach the draw path *at all* (THR-814).
 *
 * `phaseAgentDecision` iterates only `actorType: 'individual'` actors at
 * `spotlightTier: 'spotlight'`, and `generateFactionQuestCandidates` is called from
 * inside that loop. A member on any other tier therefore never generates a guild
 * candidate, never draws guild work, and never gains reputation — no scoring or
 * tuning change can reach them.
 *
 * Reported next to the reputation distribution because it is the denominator that
 * distribution is really over: a run with 227 memberships and 2 eligible members is
 * not a guild economy that is badly tuned, it is one that is switched off.
 */
function decisionEligibleMembers(state: GameState): { eligible: number; total: number } {
  const members = new Set<string>();
  for (const edge of state.graph.getEdgesByType('member_of')) {
    const props = edge.properties as Partial<MemberOfEdgeProperties>;
    if (props.factionDefId) members.add(edge.source);
  }
  let eligible = 0;
  for (const id of members) {
    const node = state.graph.getNode(id);
    if (!node) continue;
    const tier = (node.properties.spotlightTier as string | undefined) ?? 'spotlight';
    if (node.properties.actorType === 'individual' && tier === 'spotlight') eligible++;
  }
  return { eligible, total: members.size };
}

function sample(state: GameState): Sample {
  const r = reputations(state);
  const at = (p: number) => (r.length ? r[Math.min(r.length - 1, Math.floor(p * r.length))] : 0);
  return {
    tick: state.tick,
    phase: state.phase,
    memberships: r.length,
    max: r[0] ?? 0,
    p90: at(0.1),
    median: at(0.5),
    ge060: r.filter(v => v >= 0.6).length,
    ge075: r.filter(v => v >= 0.75).length,
    ge085: r.filter(v => v >= 0.85).length,
    apexHolders: apexHolders(state),
  };
}

/**
 * Which rank-gated templates can any live mortal actually draw?
 *
 * Asks the shipped gate ({@link meetsFactionRankRequirement}) rather than
 * re-deriving the threshold, so this answers the Done-when in the same terms
 * the engine uses at draw time.
 */
function reachableGatedTemplates(state: GameState): { reachable: string[]; blocked: string[] } {
  const reachable: string[] = [];
  const blocked: string[] = [];

  const memberIds = new Map<string, string[]>(); // factionDefId -> agent ids
  for (const edge of state.graph.getEdgesByType('member_of')) {
    const props = edge.properties as Partial<MemberOfEdgeProperties>;
    if (!props.factionDefId) continue;
    const list = memberIds.get(props.factionDefId) ?? [];
    list.push(edge.source);
    memberIds.set(props.factionDefId, list);
  }

  for (const [templateId, meta] of FACTION_ENCOUNTER_META) {
    const def = FACTION_DEFINITIONS.get(meta.factionDefId);
    if (!def) continue;
    const tier = def.rankTiers.find(t => t.id === meta.minRank);
    // Entry-tier templates are ungated by construction — not this sweep's subject.
    if (!tier || tier.minReputation <= 0) continue;

    const candidates = memberIds.get(meta.factionDefId) ?? [];
    const anyQualifies = candidates.some(agentId =>
      meetsFactionRankRequirement(state.graph, agentId, meta.factionDefId, meta.minRank),
    );
    (anyQualifies ? reachable : blocked).push(templateId);
  }

  return { reachable: reachable.sort(), blocked: blocked.sort() };
}

// ─── Run ─────────────────────────────────────────────────────────────────

function main(): void {
  const runtime = createSimulationRuntime();
  const archetype = generateArchetypes(SEED)[0];
  const cosmology = createBalancedCosmology();
  const preset = MAP_SIZE_PRESETS[MAP];
  const { state: initial } = initializeGameState(
    archetype,
    'RankSweep',
    cosmology,
    SEED,
    preset.cols,
    preset.rows,
  );

  console.log(`THR-810 rank-reachability sweep — seed ${SEED}, map ${MAP}, ${TICKS} ticks\n`);

  let state = initial;
  const samples: Sample[] = [sample(state)];

  // Gain census. The distribution alone cannot separate "gain too small to hold the
  // apex" from "no gain at all" — both look like decline. Diffing every membership's
  // reputation tick-over-tick answers it directly and needs no trace plumbing.
  let gainEvents = 0;
  let gainTotal = 0;
  let gainEventsWhilePlaying = 0;
  let lastRep = new Map<string, number>();
  const snapshotReps = (s: GameState): Map<string, number> => {
    const m = new Map<string, number>();
    for (const e of s.graph.getEdgesByType('member_of')) {
      const p = e.properties as Partial<MemberOfEdgeProperties>;
      if (p.factionDefId) m.set(`${e.source}->${e.target}`, p.reputation ?? 0);
    }
    return m;
  };
  lastRep = snapshotReps(state);

  // Draw census. A gain of zero has two very different causes — faction encounters
  // never drawn, or drawn by non-members / never succeeding. Counting distinct
  // faction-template action instances separates them.
  const drawnFactionActions = new Set<string>();
  const drawnByMembers = new Set<string>();

  for (let t = 0; t < TICKS; t++) {
    state = runTick(state, [], runtime);

    for (const a of state.unifiedActions) {
      const meta = FACTION_ENCOUNTER_META.get(a.templateId);
      if (!meta) continue;
      drawnFactionActions.add(a.actionId);
      const isMember = state.graph
        .getOutgoingEdges(a.actorId, 'member_of')
        .some(e => (e.properties as Partial<MemberOfEdgeProperties>).factionDefId === meta.factionDefId);
      if (isMember) drawnByMembers.add(a.actionId);
    }

    const now = snapshotReps(state);
    for (const [key, rep] of now) {
      const prev = lastRep.get(key);
      // Only pre-existing memberships: a fresh join is not a gain.
      if (prev !== undefined && rep > prev + 1e-9) {
        gainEvents++;
        gainTotal += rep - prev;
        if (state.phase === 'playing') gainEventsWhilePlaying++;
      }
    }
    lastRep = now;

    if (state.tick % SAMPLE_EVERY === 0) samples.push(sample(state));
  }

  console.log(
    `Reputation gain census over ${TICKS} ticks: ${gainEvents} increases (${gainEventsWhilePlaying} while phase=playing), total +${gainTotal.toFixed(3)}`,
  );
  console.log(
    `Faction-template draw census: ${drawnFactionActions.size} action instances, ${drawnByMembers.size} of them drawn by a member of the owning faction`,
  );

  const { eligible, total } = decisionEligibleMembers(state);
  console.log(
    `Draw-path eligibility: ${eligible} of ${total} members are individual+spotlight, i.e. can reach phaseAgentDecision at all`,
  );
  if (eligible < total) {
    console.log(
      `  → ${total - eligible} members are off the decision loop entirely (ambient/notable tier). ` +
      'No scoring or reward change can reach them — see THR-814.',
    );
  }
  console.log('');

  console.log('| tick | phase | memberships | max | p90 | median | >=0.60 | >=0.75 | >=0.85 | apex holders |');
  console.log('| ---: | :-- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |');
  for (const s of samples) {
    console.log(
      `| ${s.tick} | ${s.phase} | ${s.memberships} | ${s.max.toFixed(3)} | ${s.p90.toFixed(3)} | ${s.median.toFixed(3)} | ${s.ge060} | ${s.ge075} | ${s.ge085} | ${s.apexHolders} |`,
    );
  }

  const { reachable, blocked } = reachableGatedTemplates(state);
  console.log(`\nRank-gated templates at tick ${state.tick} — ${reachable.length} reachable, ${blocked.length} blocked`);
  if (blocked.length > 0) console.log(`  BLOCKED: ${blocked.join(', ')}`);
  if (reachable.length > 0) console.log(`  reachable: ${reachable.join(', ')}`);

  const final = samples[samples.length - 1];
  const verdict = final.apexHolders > 0 && blocked.length === 0;
  console.log(
    `\nVERDICT: ${verdict ? 'PASS' : 'FAIL'} — apex holders at tick ${final.tick}: ${final.apexHolders}; blocked gated templates: ${blocked.length}`,
  );
  process.exit(verdict ? 0 : 1);
}

main();
