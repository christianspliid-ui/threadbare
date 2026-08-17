/**
 * Tallies — the designer readout for reputation tallies (THR-1140).
 *
 * THR-1136 §5 ruled per-Reach reputation tallies a **system-visible** quantity:
 * they keep steering scoring and gating and keep minting the Whispered/Known/
 * Legendary traits at their thresholds, but they never speak to the player. The
 * same ruling preserved their inspectability *"in traces and the designer view"*
 * — this tab is that designer view, and it is what makes the preservation real
 * rather than notional.
 *
 * **Why raw numbers are correct here.** Law 13 bans raw magnitudes on any
 * *mortal-facing* surface and names traces and the designer view as where
 * numbers do live. The debug panel is the designer view, so the tally value, its
 * distance to the next threshold, and the tick counts are shown as themselves.
 * Law 14's key ban is likewise a player-surface rule — and this tab shows the
 * key *and* its resolved words, because a designer needs to know which key they
 * are looking at while still reading what it means.
 *
 * Nothing here is a route back to a player-facing tally chip: that is the thing
 * §5 removed, and Law 13's visibility-parity clause forbids re-adding it until a
 * tally gains a character-sheet surface.
 */

import React from 'react';
import type { WorldGraph } from '../../../engine/graph';
import type { GraphNode } from '../../../types/graph';
import type { TraceEntry } from '../../../types/trace';
import type { ReputationTallies } from '../../../types/agent';
import type { RetinueAgent } from '../../../engine/retinue';
import { describeTallyKey, magnitudeWord, TALLY_MAGNITUDE_BANDS } from '../../../engine/aftermathWords';
import {
  REPUTATION_LEVEL_1_THRESHOLD,
  REPUTATION_LEVEL_2_THRESHOLD,
  REPUTATION_LEVEL_3_THRESHOLD,
} from '../../../data/agent-behavior-constants';
import { EMPTY_STATE_STYLE } from './debugPanelStyles';

/**
 * The trait ladder, single-sourced from the thresholds the phase actually reads
 * (`phaseReputationTraits.levelFromTally`). Names come from those constants'
 * own documentation — the engine stores a level, not a word.
 */
const LEVEL_LADDER: readonly { readonly level: number; readonly min: number; readonly name: string }[] = [
  { level: 3, min: REPUTATION_LEVEL_3_THRESHOLD, name: 'Legendary' },
  { level: 2, min: REPUTATION_LEVEL_2_THRESHOLD, name: 'Known' },
  { level: 1, min: REPUTATION_LEVEL_1_THRESHOLD, name: 'Whispered' },
];

/** Minimum increment samples before a movement delta is honest (first→last needs two). */
const MIN_SAMPLES_FOR_MOVEMENT = 2;

interface TallyRow {
  readonly key: string;
  readonly value: number;
  /** Resolved through the engine's own vocabulary — never the raw key alone. */
  readonly phrase: string;
  readonly level: number;
  readonly levelName?: string;
  /** Tally still needed for the next rung; undefined once Legendary. */
  readonly toNext?: number;
  readonly nextName?: string;
  /** Movement across the visible trace window, when two or more increments were seen. */
  readonly movement?: number;
  readonly movementWord?: string;
  readonly sampleCount: number;
}

interface ActorTallies {
  readonly actorId: string;
  readonly name: string;
  readonly rows: readonly TallyRow[];
}

interface TalliesDebugTabProps {
  graph?: WorldGraph;
  traces: readonly TraceEntry[];
  focusedAgentId?: string;
  retinueAgents?: readonly RetinueAgent[];
}

function levelFor(value: number): { level: number; levelName?: string; toNext?: number; nextName?: string } {
  for (const rung of LEVEL_LADDER) {
    if (value >= rung.min) {
      const next = LEVEL_LADDER.find(r => r.level === rung.level + 1);
      return {
        level: rung.level,
        levelName: rung.name,
        toNext: next ? next.min - value : undefined,
        nextName: next?.name,
      };
    }
  }
  const first = LEVEL_LADDER[LEVEL_LADDER.length - 1];
  return { level: 0, toNext: first.min - value, nextName: first.name };
}

/**
 * Movement per tally key from the visible trace window.
 *
 * `tally_increment` traces carry the value *after* the increment, so the honest
 * delta is last − first, and it needs two samples. One sample proves the tally
 * moved but not by how much, so it reports no movement rather than a made-up
 * zero — the band would otherwise read "again" for every freshly-touched tally.
 */
function movementByKey(traces: readonly TraceEntry[], actorId: string): Map<string, { movement?: number; samples: number }> {
  const samples = new Map<string, number[]>();

  for (const trace of traces) {
    if (trace.category !== 'reputation_trait') continue;
    if (trace.agentId !== actorId) continue;
    if (trace.action !== 'tally_increment') continue;
    if (typeof trace.tallyValue !== 'number' || !Number.isFinite(trace.tallyValue)) continue;

    const key = `${trace.reach}.${trace.polarity}`;
    const bucket = samples.get(key) ?? [];
    bucket.push(trace.tallyValue);
    samples.set(key, bucket);
  }

  const out = new Map<string, { movement?: number; samples: number }>();
  for (const [key, values] of samples) {
    out.set(key, {
      movement: values.length >= MIN_SAMPLES_FOR_MOVEMENT ? values[values.length - 1] - values[0] : undefined,
      samples: values.length,
    });
  }
  return out;
}

/**
 * The display name, read off the node's own `name` field.
 *
 * `GraphNode.name` is where a name lives — **not** `properties.name`, which is
 * absent on every actor a live world generates (verified against seed 42 at
 * tick 60: `Object.keys(actor.properties)` carries `templateName` and
 * `cultureIdentity`, no `name`). Reading the property instead would have left
 * most rows saying "(unresolved)", which Law 4 counts as a broken fallback
 * rather than a designed one.
 */
function resolveName(node: GraphNode, retinueAgents?: readonly RetinueAgent[]): string {
  const fromRetinue = retinueAgents?.find(a => a.id === node.id)?.name;
  if (fromRetinue) return fromRetinue;
  if (node.name) return node.name;
  const templateName = node.properties?.templateName;
  if (typeof templateName === 'string' && templateName) return templateName;
  return `${node.id.slice(-8)} (unnamed)`;
}

function collectActors(
  graph: WorldGraph,
  traces: readonly TraceEntry[],
  retinueAgents?: readonly RetinueAgent[],
): ActorTallies[] {
  const actors: ActorTallies[] = [];

  for (const node of graph.getNodesByType('actor')) {
    const tallies = (node.properties?.reputationTallies as ReputationTallies | undefined) ?? {};
    const entries = Object.entries(tallies).filter(([, v]) => typeof v === 'number' && v > 0);
    if (entries.length === 0) continue;

    const movement = movementByKey(traces, node.id);

    const rows: TallyRow[] = entries.map(([key, value]) => {
      const numeric = value as number;
      const observed = movement.get(key);
      const ladder = levelFor(numeric);
      return {
        key,
        value: numeric,
        phrase: describeTallyKey(key).phrase,
        ...ladder,
        movement: observed?.movement,
        movementWord: observed?.movement !== undefined
          ? magnitudeWord(observed.movement, TALLY_MAGNITUDE_BANDS)
          : undefined,
        sampleCount: observed?.samples ?? 0,
      };
    });

    // Strongest tally first — the one nearest minting a trait is what a designer
    // is usually looking for.
    rows.sort((a, b) => b.value - a.value);
    actors.push({ actorId: node.id, name: resolveName(node, retinueAgents), rows });
  }

  actors.sort((a, b) => (b.rows[0]?.value ?? 0) - (a.rows[0]?.value ?? 0));
  return actors;
}

const SH: React.CSSProperties = {
  fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-muted)',
  textTransform: 'uppercase', letterSpacing: '0.06em',
  marginBottom: '4px', marginTop: '10px',
};

const ROW: React.CSSProperties = {
  fontSize: 'var(--text-xs)', color: 'var(--text-primary)',
  borderLeft: '2px solid var(--border-subtle)',
  paddingLeft: '6px', marginBottom: '6px',
};

const MONO: React.CSSProperties = {
  fontFamily: 'monospace', color: 'var(--text-muted)', fontSize: 'var(--text-xs)',
};

const META: React.CSSProperties = {
  color: 'var(--text-muted)', fontSize: 'var(--text-xs)',
};

/** Gold once the tally mints a trait; subtle while it is still only accumulating. */
const MINTING_COLOR = 'var(--accent-gold)';

function TallyRowView({ row }: { row: TallyRow }) {
  const minting = row.level > 0;

  return (
    <div style={{ ...ROW, borderLeftColor: minting ? MINTING_COLOR : 'var(--border-subtle)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
        <span style={{ flex: 1, fontWeight: 500 }}>{row.phrase}</span>
        {minting && (
          <span
            style={{
              color: MINTING_COLOR,
              background: 'var(--accent-gold-glow)',
              padding: '1px 4px', borderRadius: '2px', flexShrink: 0,
            }}
          >
            {row.levelName} (L{row.level})
          </span>
        )}
        <span style={{ ...MONO, flexShrink: 0 }}>{row.value.toFixed(2)}</span>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginTop: '3px', flexWrap: 'wrap' }}>
        <span style={MONO}>{row.key}</span>
        {row.toNext !== undefined && row.nextName && (
          <span style={META}>{row.toNext.toFixed(2)} to {row.nextName}</span>
        )}
        {row.movementWord && row.movement !== undefined && (
          <span style={META}>
            rose {row.movementWord} (+{row.movement.toFixed(2)} over {row.sampleCount} increments)
          </span>
        )}
        {!row.movementWord && row.sampleCount > 0 && (
          <span style={META}>{row.sampleCount} increment in window</span>
        )}
      </div>
    </div>
  );
}

function ActorBlock({ actor }: { actor: ActorTallies }) {
  return (
    <div>
      <div style={SH}>
        {actor.name} — {actor.rows.length} tall{actor.rows.length !== 1 ? 'ies' : 'y'}
      </div>
      {actor.rows.map(row => <TallyRowView key={row.key} row={row} />)}
    </div>
  );
}

export function TalliesDebugTab({ graph, traces, focusedAgentId, retinueAgents }: TalliesDebugTabProps) {
  if (!graph) {
    return <div style={EMPTY_STATE_STYLE}>No world graph connected.</div>;
  }

  const actors = collectActors(graph, traces, retinueAgents);
  if (actors.length === 0) {
    return <div style={EMPTY_STATE_STYLE}>No reputation tallies accumulated yet.</div>;
  }

  const focused = focusedAgentId ? actors.filter(a => a.actorId === focusedAgentId) : [];
  const others = focusedAgentId ? actors.filter(a => a.actorId !== focusedAgentId) : actors;

  return (
    <div style={{ padding: '8px 10px' }}>
      {focusedAgentId && (
        focused.length > 0
          ? focused.map(actor => <ActorBlock key={actor.actorId} actor={actor} />)
          : <div style={{ ...META, marginBottom: '8px' }}>No tallies on the followed agent.</div>
      )}

      {others.map(actor => <ActorBlock key={actor.actorId} actor={actor} />)}
    </div>
  );
}
