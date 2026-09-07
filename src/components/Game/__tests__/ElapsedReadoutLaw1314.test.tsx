// @vitest-environment jsdom
/**
 * Every player-facing **elapsed and duration** readout reads in words, never in ticks (THR-1425).
 *
 * The sibling of `TickReadoutLaw1314.test.tsx`, which pins THR-1423's *remaining* terms. Same two
 * laws, different fields: `ticksAgo`, `ticksActive`, `ticksSince`, `durationTicks`, `tickLimit`,
 * and the divine receipt's elapsed span (pinned in `DivineReceiptModal.test.tsx`, beside the
 * assertion it replaced). Kept as its own file rather than folded into the THR-1423 guard so the
 * two sweeps do not collide on one file — the ticket's coordination block calls out that four of
 * these components are mutex surfaces.
 *
 * ## The contract under test
 *
 * A bare integer beside the word "ticks" fails **Law 13** (raw magnitude) and **Law 14** (an
 * engine unit with no player-facing display name) at once. Two readings resolve it, and which
 * one a site takes is the whole of this ticket's design decision:
 *
 * * **`durationLabel`** for a *term* — how long something lasts (`durationTicks`, `tickLimit`,
 *   the schism's remaining window). Floors to `one day`, which is right for a term.
 * * **`elapsedLabel`** for an *elapsed span* — how long ago, or how long so far (`ticksAgo`,
 *   `ticksActive`, `ticksSince`, the receipt). Reads under a day as `less than a day`, because
 *   `durationLabel`'s floor would state something false: a thing that happened three ticks ago
 *   did not happen `one day ago`.
 *
 * ## Why the floor is asserted separately everywhere
 *
 * `elapsedLabel` delegates to `durationLabel` above a day, so an arm that only ever exercises
 * the multi-day branch would pass identically against `durationLabel` — it would prove the
 * numeral is gone while proving nothing about the reading that was chosen. Every elapsed arm
 * below therefore renders **both** a sub-day and a multi-day value. That is the difference this
 * ticket exists to make, so it is the difference the guard has to be able to see.
 *
 * ## Falsification (THR-1421's lesson, restated because it was learned the hard way)
 *
 * Every arm below was falsified by mutating the branch its fixture actually exercises — reverting
 * each call site to its raw-tick string — and watching it go red, then restored. A guard that has
 * only been watched going green has not been tested.
 *
 * ## Browser-verify substitution
 *
 * These render assertions stand in for the contractual 1920×1080 pixel capture, which an
 * unattended run cannot produce (`preview_start` is refused outright — impediments #546, #574).
 * They establish that the change reached the surface; they do not cover paint, overflow or
 * z-index, which only pixels can. The pixel pass is owed and named in the PR.
 */

import type { ComponentProps } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WorldGraph } from '../../../engine/graph';
import { durationLabel, elapsedLabel } from '../../../engine/aftermathWords';
import { TICKS_PER_DAY } from '../../../data/attention-constants';

import { AgentInfoCard } from '../AgentInfoCard';
import { HexChronicle } from '../HexChronicle';
import { AttachmentDetailView } from '../AttachmentDetailView';
import { MandateDetail } from '../MandateDetail';
import { ThreadDetailView } from '../ThreadDetailView';

import type { AgentInfoCardData } from '../../../engine/agentDetail';
import type { AttachmentDetailData } from '../AttachmentDetailView';
import type { ControlEffect } from '../../../types/controlEffect';
import type { MandateDefinition, MandateState } from '../../../types/mandate';
import type { ThreadedFaction } from '../../../engine/retinue';

/** Under `TICKS_PER_DAY` (12), so `elapsedLabel` takes its floor branch. */
const SUB_DAY_TICKS = 3;
/** Four days at `TICKS_PER_DAY` — inside the spelled-count ladder, so it reads `four days`. */
const FOUR_DAYS_IN_TICKS = 48;

const SUB_DAY = elapsedLabel(SUB_DAY_TICKS);
const FOUR_DAYS = durationLabel(FOUR_DAYS_IN_TICKS);

/** Guards a rendered string: real words, no numeral, and the engine unit never named. */
function expectWordsNotTicks(text: string): void {
  expect(text).toMatch(/[a-z]/i);
  expect(text).not.toMatch(/\d/);
  expect(text).not.toMatch(/tick/i);
}

const noop = () => {};

describe('THR-1425 — elapsed and duration readouts read in words, never in ticks', () => {
  // ── The readings themselves ──────────────────────────────────────────────

  it('the two readings disagree below a day, which is the reason both exist', () => {
    // If they agreed everywhere, every arm below would be asserting nothing about which
    // reading its call site took. Pin the divergence before trusting it as a fixture.
    expect(SUB_DAY_TICKS).toBeLessThan(TICKS_PER_DAY);
    expect(elapsedLabel(SUB_DAY_TICKS)).toBe('less than a day');
    expect(durationLabel(SUB_DAY_TICKS)).toBe('one day');
    expect(elapsedLabel(SUB_DAY_TICKS)).not.toBe(durationLabel(SUB_DAY_TICKS));

    // Above a day they converge — one ladder, so a `TICKS_PER_DAY` retune moves both.
    expect(elapsedLabel(FOUR_DAYS_IN_TICKS)).toBe(FOUR_DAYS);
    expect(FOUR_DAYS).toBe('four days');

    expectWordsNotTicks(SUB_DAY);
    expectWordsNotTicks(FOUR_DAYS);
  });

  it('elapsedLabel never emits a numeral across the whole range it can be handed', () => {
    // Swept over the measured range rather than two sample points: the floor branch, the
    // spelled-count day ladder, and the week ladder above it all have to stay numeral-free.
    for (let t = 0; t <= 400; t++) {
      const reading = elapsedLabel(t);
      expect(reading, `elapsedLabel(${t})`).not.toMatch(/\d/);
      expect(reading, `elapsedLabel(${t})`).not.toMatch(/tick/i);
    }
    // Fail-soft (NFP #4): a non-finite or negative span is a designed state, not a throw.
    expect(elapsedLabel(Number.NaN)).toBe('less than a day');
    expect(elapsedLabel(-5)).toBe('less than a day');
  });

  // ── AgentInfoCard — `ticksAgo` ───────────────────────────────────────────

  /**
   * `ticksAgo` is **derived**, not a field on the card: `getAgentStrategicHistory` computes it as
   * `currentTick − entry.tick`. There is no override prop, so the only way to drive this row is
   * through the real derivation — which means three gates must all be satisfied at once, and each
   * of them fails silently rather than erroring:
   *
   *   1. `AgentInfoCard` calls the presenters only when `strategicState`, `graph` and `tick` are
   *      ALL supplied — any one missing and both come back null.
   *   2. The whole Designs block, History included, is nested inside `strategicSummary && (…)`,
   *      and `getAgentStrategicSummary` returns null when the agent has no project, no control
   *      and no history. A card with history for a *different* `actorId` renders no Designs
   *      section at all and every arm here would pass against an empty card.
   *   3. `history` is filtered on `actorId === card.id`, so the ids have to match exactly.
   */
  const cardForHistory = (): AgentInfoCardData =>
    ({
      id: 'agent.1',
      name: 'Kael',
      locationId: 'loc.1',
      locationName: 'Ashvale',
      primarySphere: 'shadow',
      knowledgeLevel: 'known',
    }) as unknown as AgentInfoCardData;

  const historyEntry = (displayName: string, tick: number, outcome: string) =>
    ({
      tick,
      actorId: 'agent.1',
      templateId: 'strategic.seize',
      ambitionId: 'ambition.1',
      verb: 'seize',
      behaviorFamily: 'territorial',
      displayName,
      outcome,
      graphOps: [],
      catalystSeeded: false,
    }) as never;

  it('AgentInfoCard: a strategic-history row reads how long ago, at both ends of the range', () => {
    const currentTick = 100;
    const strategicState = {
      projects: [],
      controls: [],
      history: [
        historyEntry('Seized the ford', currentTick - SUB_DAY_TICKS, 'completed'),
        historyEntry('Courted the smith', currentTick - FOUR_DAYS_IN_TICKS, 'failed'),
      ],
    } as never;

    render(
      <AgentInfoCard
        card={cardForHistory()}
        onViewProfile={noop}
        onBack={noop}
        graph={new WorldGraph()}
        tick={currentTick}
        strategicState={strategicState}
      />,
    );

    // Guards gate 2: if the Designs block never rendered, the queries below would fail for a
    // reason that looks like a wording mismatch rather than an empty surface.
    expect(screen.getByText('Designs')).toBeTruthy();

    const recent = screen.getByText(new RegExp(`Seized the ford — ${SUB_DAY} ago`));
    expectWordsNotTicks(recent.textContent!);
    const older = screen.getByText(new RegExp(`Courted the smith — ${FOUR_DAYS} ago`));
    expectWordsNotTicks(older.textContent!);
  });

  // ── HexChronicle — `ticksActive` ─────────────────────────────────────────

  const controlEffect = (ticksActive: number, id: string): ControlEffect =>
    ({
      effectId: id,
      templateId: 'hex.warded_ground',
      ownerId: 'ascendant.1',
      targetHexCol: 8,
      targetHexRow: 6,
      establishedTick: 0,
      ritualEssenceInvested: 12,
      // Empty, so the adjacent per-tick cost row reads `free` and cannot supply the digits
      // this arm is looking for — the assertion has to be about `ticksActive` alone.
      perTickCost: {},
      perTickMutations: [],
      perTickGraphOps: [],
      active: true,
      ticksActive,
      narrativeTemplates: {
        established: 'The ward closes.',
        active: 'The ward holds.',
        lapsed: 'The ward fails.',
      },
    }) as unknown as ControlEffect;

  function hexProps(
    overrides: Record<string, unknown> = {},
  ): ComponentProps<typeof HexChronicle> {
    const mockGraph = {
      getNode: () => null,
      getOutgoingEdges: () => [],
      getIncomingEdges: () => [],
      getNodesByType: () => [],
    } as unknown as WorldGraph;
    return {
      terrain: 'plateau' as const,
      hexCol: 8,
      hexRow: 6,
      lineOfSight: 'full' as const,
      sphereInfluence: null,
      cultures: [],
      factions: [],
      locations: [],
      agentsByLocation: {},
      regionData: null,
      onLocationClick: noop,
      onAgentClick: noop,
      graph: mockGraph,
      seed: 42,
      ...overrides,
    } as unknown as ComponentProps<typeof HexChronicle>;
  }

  it('HexChronicle: a sustained effect reads how long it has been held, not a tick count', () => {
    const { container } = render(
      <HexChronicle
        {...(hexProps({
          controlEffects: [
            controlEffect(SUB_DAY_TICKS, 'ce.1'),
            controlEffect(FOUR_DAYS_IN_TICKS, 'ce.2'),
          ],
        }))}
      />,
    );

    const fresh = screen.getByText(`held ${SUB_DAY}`);
    expectWordsNotTicks(fresh.textContent!);
    const settled = screen.getByText(`held ${FOUR_DAYS}`);
    expectWordsNotTicks(settled.textContent!);
    // The `40 ticks active` shape is gone entirely, not merely reworded alongside.
    expect(container.textContent).not.toMatch(/\d+\s*ticks?\s*active/i);
  });

  // ── AttachmentDetailView — `durationTicks` ───────────────────────────────

  it('AttachmentDetailView: a triggered condition grant reads its term in words', () => {
    // A term, not an elapsed span — so this site takes `durationLabel`, and the arm pins
    // that choice rather than only pinning the absence of a numeral.
    const triggered: AttachmentDetailData = {
      id: 'item.2',
      name: 'Cursed Blade',
      subcategory: 'arms',
      tier: 3,
      mechanicalSummary: '+Iron, +Shadow',
      tags: ['weapon', 'cursed'],
      actionTriggers: [
        {
          type: 'action_trigger',
          on: 'encounter_critical_failure',
          probability: 0.1,
          payload: {
            kind: 'condition_grant',
            conditionTraitId: 'trait.condition.hexed',
            durationTicks: FOUR_DAYS_IN_TICKS,
          },
          narrativeTemplate: 'The blade turns in the hand.',
        },
      ],
    } as unknown as AttachmentDetailData;

    const { container } = render(
      <AttachmentDetailView attachment={triggered} onBack={vi.fn()} />,
    );

    const summary = screen.getByText(new RegExp(`\\(${FOUR_DAYS}\\)`));
    expect(summary.textContent).toContain(`(${FOUR_DAYS})`);
    expect(container.textContent).not.toMatch(/\d+\s*ticks\)/i);
  });

  // ── MandateDetail — `tickLimit` ──────────────────────────────────────────

  it('MandateDetail: the Time Limit row reads a term in words, and the label carries the unit once', () => {
    const definition = {
      id: 'mandate.1',
      type: 'graph_state',
      name: 'Node Dominance',
      description: 'Establish control over the world-graph',
      tickLimit: FOUR_DAYS_IN_TICKS,
      stages: [
        {
          stage: 'setup',
          description: 'Create foundational nodes',
          conditions: [
            { type: 'node_count', description: 'Achieve 50 nodes', params: { minNodes: 50 } },
          ],
        },
      ],
    } as unknown as MandateDefinition;

    const state = {
      mandateId: 'mandate.1',
      currentStage: 'setup',
      progress: 0.5,
      completed: false,
      failed: false,
    } as unknown as MandateState;

    render(<MandateDetail open onClose={noop} definition={definition} state={state} />);

    const value = screen.getByText(FOUR_DAYS, { exact: true });
    expectWordsNotTicks(value.textContent!);
    // The row already says "Time Limit"; the value spelling `ticks` put the unit on the
    // surface a second time, which is the half of Law 14 that lives outside the numeral.
    expect(screen.queryByText(new RegExp(`${FOUR_DAYS_IN_TICKS}\\s*ticks`))).toBeNull();
  });

  // ── ThreadDetailView — the schism pair ───────────────────────────────────

  /**
   * A faction node is `type: 'actor'` with `properties.actorType: 'faction'` — NOT
   * `type: 'faction'`. The banner itself reads `graph.getNode(node.id).properties` and is not
   * gated on `getFactionNetworkSummary`, but the wrong node type renders a sheet with no
   * conclave and no error, so the shape is kept honest here too.
   */
  function graphWithFaction(props: Record<string, unknown>): WorldGraph {
    const graph = new WorldGraph();
    graph.addNode({
      id: 'faction-1',
      type: 'actor',
      name: 'Iron Legion',
      properties: { actorType: 'faction', factionDefId: 'adventuring_guild', ...props },
    } as never);
    return graph;
  }

  const factionNode = (): ThreadedFaction =>
    ({
      id: 'faction-1',
      name: 'Iron Legion',
      tier: 3,
      tierName: 'Champion',
      category: 'faction',
      threadEdgeId: 'e3',
      attentionMode: 'auto_resolve',
      courtPosition: null,
    }) as unknown as ThreadedFaction;

  it('ThreadDetailView: the pending-schism banner reads its window as a term, not a tick count', () => {
    // A remaining window is a term, so this branch takes `durationLabel`. This site sat
    // outside THR-1423's grep — the `tick${n === 1 ? '' : 's'}` interpolation splits the
    // literal it searched for, the same miss that hid `FactionSheet` from that sweep.
    render(
      <ThreadDetailView
        node={factionNode()}
        graph={graphWithFaction({ schismPendingResolutionTick: FOUR_DAYS_IN_TICKS })}
        currentTick={0}
        onClose={noop}
        onViewProfile={noop}
      />,
    );

    const banner = screen.getByTestId('schism-pending-banner');
    expect(banner.textContent).toContain(`${FOUR_DAYS} until the crisis settles`);
    expectWordsNotTicks(banner.textContent!);
  });

  it('ThreadDetailView: the reform afterimage reads how long ago, and exercises the floor', () => {
    // The afterimage is gated to the 24 ticks after a reform, so half its live range is
    // under a day — this is the site where `durationLabel`'s floor would have been visibly
    // wrong, reading a reform that happened this morning as `one day ago`.
    const { unmount } = render(
      <ThreadDetailView
        node={factionNode()}
        graph={graphWithFaction({ lastSchismReformTick: 0, lastSchismExpelledCount: 2 })}
        currentTick={SUB_DAY_TICKS}
        onClose={noop}
        onViewProfile={noop}
      />,
    );

    const fresh = screen.getByTestId('schism-reform-afterimage');
    expect(fresh.textContent).toContain(`${SUB_DAY} ago`);
    expect(fresh.textContent).not.toMatch(/tick/i);
    unmount();

    render(
      <ThreadDetailView
        node={factionNode()}
        graph={graphWithFaction({ lastSchismReformTick: 0, lastSchismExpelledCount: 0 })}
        currentTick={TICKS_PER_DAY}
        onClose={noop}
        onViewProfile={noop}
      />,
    );

    const older = screen.getByTestId('schism-reform-afterimage');
    expect(older.textContent).toContain('one day ago');
    expect(older.textContent).not.toMatch(/tick/i);
  });
});
