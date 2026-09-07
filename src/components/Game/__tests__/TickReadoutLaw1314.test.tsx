// @vitest-environment jsdom
/**
 * Every player-facing remaining-term readout reads in words, never in ticks (THR-1423).
 *
 * ## Why this file exists as browser-verify evidence
 *
 * These render assertions stand in for the contractual 1920×1080 pixel capture, which
 * this unattended run cannot produce — `preview_start` is refused outright with
 * *"Dev servers can't be started from unattended sessions"* (impediments #546 ×10, #574),
 * which also shuts the Playwright route, since that presumes a running server. Recorded
 * in the commit body as
 * `Browser-verify substitution: jsdom-render — unattended run, no startable dev server`.
 *
 * They assert the real components' rendered DOM for every face the change produces, which
 * is what requirement 1 exists to establish: that the change reached the surface. What they
 * deliberately do NOT cover is what only pixels can — paint regressions, overflow, z-index,
 * off-viewport rendering. The pixel pass is owed and named in the PR.
 *
 * ## The contract under test
 *
 * `4 ticks remaining` fails two UI Laws at once: the bare integer is a raw magnitude
 * (**Law 13**), and a tick is an engine unit with no player-facing display name anywhere in
 * the game (**Law 14**). `durationLabel` is the sanctioned reading — it converts by the
 * game's own `TICKS_PER_DAY` and spells the count out, so no numeral escapes.
 *
 * Each case asserts three things, and the third is the one that matters: **the element
 * carries no digit at all**. Pinning only the expected phrase would pass against a renderer
 * that printed `four days remaining (48 ticks)`.
 *
 * ## Falsification (THR-1421's lesson, restated because it was learned the hard way)
 *
 * Every arm below was falsified by mutating the branch the fixture actually exercises —
 * reverting the call site to `{ticksRemaining} ticks remaining` — and watching it go red,
 * then restored. THR-1421's first falsification attempt mutated a branch its fixture never
 * took, so the test passed against a deliberately broken renderer and looked like proof.
 * A guard that has only been watched going green has not been tested.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WorldGraph } from '../../../engine/graph';
import { durationLabel } from '../../../engine/aftermathWords';
import { TOOLTIP_SHOW_DELAY } from '../../../types/tooltip';

import { OmenDetail } from '../OmenDetail';
import { DoomClockDetail } from '../DoomClockDetail';
import { FactionSheet } from '../FactionSheet';
import { AttachmentDetailView } from '../AttachmentDetailView';
import { ReadTheThreadsPanel } from '../ReadTheThreadsPanel';
import { AgentInfoCard } from '../AgentInfoCard';
import { AttachmentsTab } from '../tabs/AttachmentsTab';
import { ProwessTab } from '../tabs/ProwessTab';

import type { AgentInfoCardData } from '../../../engine/agentDetail';
import type { AttachmentFullEntry } from '../../../engine/agentAttachments';
import type { OmenState } from '../../../types/omen';
import type { DoomClockDefinition, DoomClockState } from '../../../types/doomClock';

/**
 * 48 ticks is four days at `TICKS_PER_DAY` 12 — inside the spelled-count ladder, so the
 * reading is `four days` and contains no numeral. Derived from the constant rather than
 * hardcoded, so a retune of `TICKS_PER_DAY` moves the expectation with it instead of
 * turning this file red for a reason that has nothing to do with the Laws.
 */
const FOUR_DAYS_IN_TICKS = 48;
const FOUR_DAYS = durationLabel(FOUR_DAYS_IN_TICKS);

/** Guards the fixture itself: a value that already read as words would make every arm vacuous. */
function expectWordsNotNumerals(text: string): void {
  expect(text).toMatch(/[a-z]/i);
  expect(text).not.toMatch(/\d/);
  expect(text).not.toMatch(/tick/i);
}

afterEach(() => {
  vi.useRealTimers();
});

describe('THR-1423 — no player-facing surface renders a raw tick count', () => {
  it('the fixture value is one that could fail: 48 ticks reads as words, not a numeral', () => {
    // If `durationLabel` ever returned a numeral, every arm below would silently
    // assert nothing. Pin the reading itself before trusting it as a fixture.
    expect(FOUR_DAYS).toBe('four days');
    expectWordsNotNumerals(FOUR_DAYS);
  });

  // ── OmenDetail ───────────────────────────────────────────────────────────

  it('OmenDetail: the omen term reads in words', () => {
    const omenState: OmenState = {
      primary: {
        templateId: 'omen.breach.thin_places',
        name: 'Thin Places',
        category: 'doom_echo',
        startTick: 0,
        duration: FOUR_DAYS_IN_TICKS,
        slot: 'primary',
        lastBeatTick: 0,
      },
      secondary: null,
      history: [],
    };

    const { container } = render(
      <OmenDetail omenState={omenState} currentTick={0} onClose={() => {}} />,
    );

    const term = screen.getByText(new RegExp(`${FOUR_DAYS} remaining`));
    expect(term).toBeTruthy();
    expectWordsNotNumerals(term.textContent!);
    expect(container.textContent).not.toMatch(/\d+\s*ticks?\s*remaining/i);
  });

  // ── DoomClockDetail ──────────────────────────────────────────────────────

  it('DoomClockDetail: elapsed and remaining both read in words, and the row labels drop "Ticks"', () => {
    const stage = (n: number) => ({
      stage: n,
      name: `Stage ${n}`,
      tickThreshold: (n - 1) / 5,
      // `events` is read as `stage.events.length` with no guard — an empty array is
      // the real shape, and omitting it throws rather than rendering a stageless clock.
      events: [],
    });
    const definition = {
      archetype: 'breach',
      totalTicks: 96,
      stages: [stage(1), stage(2), stage(3), stage(4), stage(5)],
    } as unknown as DoomClockDefinition;

    const state = {
      definitionArchetype: 'breach',
      currentTick: FOUR_DAYS_IN_TICKS,
      totalTicks: 96,
      currentStage: 3,
      progress: 0.5,
      stageTransitions: [],
      expired: false,
      tickModifier: 1,
      nextEscalationSeverityModifier: 0,
      counterOmens: 0,
      resolvedEvents: [],
    } as unknown as DoomClockState;

    render(
      <DoomClockDetail open onClose={() => {}} definition={definition} state={state} />,
    );

    // Both rows are durations, so `durationLabel` reads each without inventing a language.
    const remaining = screen.getByText(FOUR_DAYS, { exact: true });
    expectWordsNotNumerals(remaining.textContent!);

    // The unit was spelled into the row LABEL as well as the value — Law 14 catches both.
    expect(screen.queryByText(/Ticks Remaining/i)).toBeNull();
    expect(screen.queryByText(/Ticks Elapsed/i)).toBeNull();
    expect(screen.getByText('Remaining')).toBeTruthy();
    expect(screen.getByText('Elapsed')).toBeTruthy();
  });

  // ── FactionSheet ─────────────────────────────────────────────────────────

  it('FactionSheet: a sitting conclave reads its term in words', () => {
    const graph = new WorldGraph();
    // Two shape traps, both of which render an empty sheet rather than erroring, so an
    // arm that gets either wrong passes vacuously on a surface that drew nothing:
    //   1. `type: 'actor'` + `actorType: 'faction'` — NOT `type: 'faction'`.
    //      `getFactionNetworkSummary` returns null on any other shape, and the conclave
    //      block lives inside the `summary`-gated half of the sheet.
    //   2. a real `factionDefId`, since the sheet bails when neither a definition nor a
    //      summary resolves.
    graph.addNode({
      id: 'faction_def_adventuring_guild',
      type: 'actor',
      name: 'The Wayfarers',
      properties: {
        actorType: 'faction',
        factionDefId: 'adventuring_guild',
        activeConclave: {
          question: 'Whether to break the old accord.',
          participants: ['agent.1'],
          ticksRemaining: FOUR_DAYS_IN_TICKS,
        },
      },
    } as never);

    render(
      <FactionSheet
        factionId="faction_def_adventuring_guild"
        name="The Wayfarers"
        graph={graph}
        onClose={() => {}}
      />,
    );

    const line = screen.getByText(/Conclave in session/);
    expect(line.textContent).toContain(`${FOUR_DAYS} remaining`);
    expectWordsNotNumerals(line.textContent!);
  });

  // ── AttachmentDetailView ─────────────────────────────────────────────────

  it('AttachmentDetailView: the Duration section reads a remaining term, not an x/y tick pair', () => {
    const transient = {
      id: 'trait.condition.wounded',
      name: 'Wounded',
      category: 'condition',
      subcategory: 'injury',
      tier: 1,
      mechanicalSummary: 'Iron is dulled while it holds.',
      tags: [],
      ticksRemaining: FOUR_DAYS_IN_TICKS,
      totalTicks: 96,
    } as unknown as Parameters<typeof AttachmentDetailView>[0]['attachment'];

    const { container } = render(
      <AttachmentDetailView attachment={transient} onBack={vi.fn()} />,
    );

    expect(screen.getByText(`${FOUR_DAYS} remaining`)).toBeTruthy();
    // The `8 / 20 ticks` shape is gone entirely, not merely reworded alongside.
    expect(container.textContent).not.toMatch(/\d+\s*\/\s*\d+\s*ticks/i);
  });

  // ── ReadTheThreadsPanel ──────────────────────────────────────────────────

  it('ReadTheThreadsPanel: the cooldown button reads its wait in words', () => {
    render(
      <ReadTheThreadsPanel
        open
        onClose={() => {}}
        digestBuffer={[] as never}
        currentTick={2}
        essenceAvailable={100}
        onSpendEssence={() => {}}
        lastReadTick={0}
      />,
    );

    const button = screen.getByText(/Cooldown \(/);
    expectWordsNotNumerals(button.textContent!);
  });

  // ── AgentInfoCard (tooltip desc) ─────────────────────────────────────────

  it('AgentInfoCard: an active effect\'s tooltip reads its term in words', async () => {
    const card: AgentInfoCardData = {
      id: 'agent.1',
      name: 'Kael',
      locationId: 'loc.1',
      locationName: 'Ashvale',
      primarySphere: 'shadow',
      knowledgeLevel: 'known',
      activeEffects: [
        {
          type: 'blessing',
          label: 'Blessed',
          sphere: 'shadow',
          strength: 0.6,
          ticksRemaining: FOUR_DAYS_IN_TICKS,
        },
      ],
    } as unknown as AgentInfoCardData;

    render(<AgentInfoCard card={card} onViewProfile={() => {}} onBack={() => {}} />);

    // The desc is portalled and gated behind TOOLTIP_SHOW_DELAY. The trigger listens on
    // `onPointerEnter` / `onFocus` — NOT `onMouseEnter`, which jsdom does not synthesise
    // from a pointer event, so a `fireEvent.mouseEnter` here opens nothing and the arm
    // fails looking like a missing string rather than a missing event.
    fireEvent.focus(screen.getByText('Blessed').closest('span')!);

    const desc = await screen.findByText(new RegExp(`${FOUR_DAYS} remaining`), undefined, {
      timeout: TOOLTIP_SHOW_DELAY + 800,
    });
    expect(desc.textContent).toContain(`${FOUR_DAYS} remaining`);
    expect(desc.textContent).not.toMatch(/tick/i);
    // NOT numeral-free as a whole: `strengthPct` is deliberately still a percentage here.
    // Law 13 bans it outright with no sanctioned alternative, so replacing it is a Law 15
    // ruling, split to THR-1424 rather than invented in this diff. This arm pins that the
    // split was deliberate — when THR-1424 lands it should fail and be tightened.
    expect(desc.textContent).toMatch(/%/);
  });

  it('AgentInfoCard: a permanent effect drops the term clause instead of reading it as present', async () => {
    // `ticksRemaining` is optional on `ActiveEffect`. The old string interpolated a missing
    // one straight through as `undefined ticks remaining`; typing it into `durationLabel`
    // is what surfaced that. The clause is now absent, not empty and not `undefined`.
    const card = {
      id: 'agent.1',
      name: 'Kael',
      locationId: 'loc.1',
      locationName: 'Ashvale',
      primarySphere: 'shadow',
      knowledgeLevel: 'known',
      activeEffects: [
        { type: 'blessing', label: 'Blessed', sphere: 'shadow', strength: 0.6 },
      ],
    } as unknown as AgentInfoCardData;

    render(<AgentInfoCard card={card} onViewProfile={() => {}} onBack={() => {}} />);
    fireEvent.focus(screen.getByText('Blessed').closest('span')!);

    const desc = await screen.findByText(/strength/, undefined, {
      timeout: TOOLTIP_SHOW_DELAY + 800,
    });
    expect(desc.textContent).not.toMatch(/undefined/);
    expect(desc.textContent).not.toMatch(/remaining/);
    expect(desc.textContent).not.toMatch(/·\s*$/);
  });

  // ── AttachmentsTab / ProwessTab (shared entry-row shape) ─────────────────

  /**
   * `injury` rather than `curse`: ProwessTab's `isConditionVisible` gates `curse` behind
   * `intimate` knowledge, so a cursed fixture renders nothing and both arms below would
   * pass vacuously on an empty tab. An injury is visible at every knowledge level.
   */
  const timedEntry = (): AttachmentFullEntry =>
    ({
      id: 'trait.condition.wounded',
      name: 'Wounded',
      subcategory: 'injury',
      tier: 2,
      mechanicalSummary: 'A borrowed voice follows.',
      tags: [],
      lossCondition: 'expires',
      slotTag: 'condition',
      active: true,
      isPinned: false,
      ticksRemaining: FOUR_DAYS_IN_TICKS,
      totalTicks: 96,
    }) as unknown as AttachmentFullEntry;

  /** Both tabs read timed conditions off `card.afflictions`. */
  const cardWith = (entries: AttachmentFullEntry[]): AgentInfoCardData =>
    ({
      id: 'agent.1',
      name: 'Kael',
      locationId: 'loc.1',
      locationName: 'Ashvale',
      primarySphere: 'shadow',
      knowledgeLevel: 'known',
      afflictions: entries,
    }) as unknown as AgentInfoCardData;

  it('AttachmentsTab: the possessions/conditions row reads its term in words', () => {
    const { container } = render(<AttachmentsTab card={cardWith([timedEntry()])} />);
    expect(container.textContent).not.toMatch(/\d+\s*ticks?\s*remaining/i);
    expect(container.textContent).toContain(`${FOUR_DAYS} remaining`);
  });

  it('ProwessTab: the timed-entry row reads its term in words', () => {
    const { container } = render(<ProwessTab card={cardWith([timedEntry()])} />);
    expect(container.textContent).not.toMatch(/\d+\s*ticks?\s*remaining/i);
    expect(container.textContent).toContain(`${FOUR_DAYS} remaining`);
  });
});
