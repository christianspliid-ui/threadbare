// @vitest-environment jsdom
/**
 * THR-1713 — readable on hover: what you spend and what you risk.
 *
 * Round 2's three cold testers hovered "sphere bars, Reaches, stars, dice" and got
 * nothing. These are render assertions on the real components — the sanctioned
 * structure-shaped half of browser-verify (absence of a raw `title`, absence of a
 * lowercase tier key, absence of the quintessence on the strip are things a
 * screenshot cannot prove). The paint half is the PR's 1920×1080 capture.
 *
 * Plan: `Docs/plans/2026-10-05-thr-1713-readable-on-hover.md` (Done-when 1, 3–7).
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';
import { EssenceBlock } from '../EssenceBlock';
import { IdentityStrip } from '../IdentityStrip';
import {
  essenceRowHover,
  selectEssenceRows,
  selectQuintessenceView,
  type AscendantIdentityView,
  type EssenceRowView,
  type QuintessenceView,
} from '../selectors';
import { AscendantSheet } from '../../AscendantSheet';
import { NudgeCard, } from '../../encounter-stage/shells/NudgePhaseShell';
import { NudgeBalance, NudgeReadingMarks } from '../../encounter-stage/shells/NudgeStageHeader';
import type { NudgeHandCard } from '../../encounter-stage/useNudgeHand';
import type { EncounterStageTestPanelModel } from '../../encounter-stage/types';
import { CardFace, type CardFaceModel } from '../../../shared/CardFace';
import { CostPips, OddsPips } from '../../../shared/OddsPips';
import { WorldGraph } from '../../../../engine/graph';
import { resolveTooltip } from '../../../../engine/tooltipResolver';
import { recordEssenceMovement } from '../../../../engine/essenceMovement';
import { NUDGE_CARD_TYPES } from '../../../../data/nudge-card-library';
import { PIP_ODDS_TIERS, PIP_PENALTY_TIER } from '../../../../data/nudge-pip-vocabulary';
import { FORECAST_TIER_WORDS, NUDGE_FACTOR_KIND_TAGS } from '../../../../data/nudge-stage-content';
import { ASCENDANT_QUINTESSENCE_STRIP_SHOW_BELOW } from '../../../../data/ascendant-bar-content';
import { TOOLTIP_SHOW_DELAY } from '../../../../types/tooltip';
import { SPHERE_NAMES } from '../../../../types';
import type { GameState } from '../../../../types/gameState';
import type { AscendantArchetype, EssencePool } from '../../../../types/influence';

afterEach(cleanup);

const ASCENDANT_ID = 'asc_1';
const FORECAST_TIERS = ['doomed', 'perilous', 'uncertain', 'favorable', 'fated'] as const;

function pool(overrides: Partial<EssencePool> = {}): EssencePool {
  return { ...(Object.fromEntries(SPHERE_NAMES.map((s) => [s, 50])) as EssencePool), ...overrides };
}

function makeState(quintessence = 100, extra: Partial<GameState> = {}): GameState {
  const graph = new WorldGraph();
  graph.addNode({
    id: ASCENDANT_ID,
    type: 'actor',
    name: 'The Witness',
    properties: {
      actorType: 'ascendant',
      quintessence,
      quintessenceMax: 100,
      domainAffinities: { iron: 0.8, gold: 0.5 },
    },
  });
  return {
    tick: 150, cycle: 0, seed: 42, graph, phase: 'playing',
    cosmology: { reachDomains: [], spheres: [] }, tiles: [],
    clock: { dayOfCycle: 0, ticksOfDay: 0 },
    ascendantId: ASCENDANT_ID, essencePool: pool(),
    mandateDefinition: null, mandateState: null, rivalDefinitions: [], rivalStates: [],
    tickEvents: [], recentEvents: [], chronicleEntries: [],
    visibilityMap: new Map(), familiarityMap: new Map(), culturalInsightMap: new Map(),
    agentKnowledge: new Map(), encounterProgress: [], actionsInProgress: [],
    unifiedActions: [], clearanceGateStates: new Map(),
    ...extra,
  } as unknown as GameState;
}

const ARCHETYPE = {
  name: 'The Witness',
  title: 'The Unblinking',
  sphereAlignment: { primary: 'matter', secondary: 'mind' },
  startingDomainAffinities: {},
} as unknown as AscendantArchetype;

function hover(target: Element): void {
  fireEvent.pointerEnter(target);
  act(() => { vi.advanceTimersByTime(TOOLTIP_SHOW_DELAY); });
}

// ─── Done-when 1 — essence rows explain themselves ──────────────────────────

describe('essence rows (D1, D2)', () => {
  it('reads the movement record: arrow and hover agree with the sign of the net', () => {
    let rec = recordEssenceMovement(undefined, pool(), pool({ matter: 44 }), 'upkeep', 120);
    rec = recordEssenceMovement(rec, pool(), pool({ mind: 56 }), 'income', 121);
    const rows = selectEssenceRows(makeState(100, { essenceMovement: rec }), ARCHETYPE);
    const matter = rows.find((r) => r.sphere === 'matter')!;
    const mind = rows.find((r) => r.sphere === 'mind')!;
    expect(matter.trend).toBe('ebbing');
    expect(matter.hoverDesc).toMatch(/Ebbing\. Drawn by your threads' upkeep\./);
    expect(mind.trend).toBe('rising');
    expect(mind.hoverDesc).toMatch(/Rising\. Fed by the cosmos's flow\./);
  });

  it('never puts a numeral in the hover (Law 13 — the balance is the only number)', () => {
    let rec = recordEssenceMovement(undefined, pool(), pool({ mind: 57.25 }), 'income', 1);
    rec = recordEssenceMovement(rec, pool(), pool({ mind: 41 }), 'spend_nudge', 2);
    rec = recordEssenceMovement(rec, pool(), pool({ mind: 46 }), 'other', 3);
    for (const row of selectEssenceRows(makeState(100, { essenceMovement: rec }), ARCHETYPE)) {
      expect(row.hoverDesc, row.sphere).not.toMatch(/\d/);
    }
  });

  it('reads Steady with the role alone when nothing has moved (fail-soft)', () => {
    const row = selectEssenceRows(makeState(), ARCHETYPE).find((r) => r.sphere === 'matter')!;
    expect(row.trend).toBe('steady');
    expect(row.hoverDesc).toMatch(/Steady\.$/);
    expect(row.hoverDesc).not.toMatch(/Fed by|Drawn by/);
  });

  it('hovers the whole row — label, bar or arrow — not only the numeral', () => {
    vi.useFakeTimers();
    try {
      const row: EssenceRowView = {
        sphere: 'matter', level: 42, trend: 'ebbing', isPrimary: true, isSecondary: false, isElder: false,
        hoverDesc: essenceRowHover('matter', { trend: 'ebbing', feeds: [], draws: ['upkeep'] }),
      };
      render(<EssenceBlock rows={[row]} />);
      expect(screen.getByTestId('essence-trend-matter').getAttribute('data-trend')).toBe('ebbing');
      hover(screen.getByTestId('essence-fill-matter'));
      expect(screen.getByText(/Drawn by your threads' upkeep/)).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });
});

// ─── Done-when 3 — nudge-card marks hover ───────────────────────────────────

const CARD: NudgeHandCard = {
  id: 'nudge.steady_hand',
  libraryCardId: 'card.boost',
  keyword: 'Boost',
  keywordIcon: '◈',
  keywordTypeId: 'boost',
  name: 'Steady The Hand',
  effectLine: 'His grip stops shaking.',
  essenceCost: 2,
  sphere: 'force',
  state: 'playable',
  forecastDelta: 0.9,
  selected: false,
  interactive: true,
};

describe('nudge-card marks (D4)', () => {
  it('cost, odds, sphere and keyword each carry a registry id, and no raw title remains', () => {
    const { container } = render(<NudgeCard card={CARD} designerView={false} onToggle={() => {}} />);
    const ids = [...container.querySelectorAll('[data-tooltip-id]')].map((el) => el.getAttribute('data-tooltip-id'));
    expect(ids).toEqual(expect.arrayContaining([
      'ui.card.cost', 'ui.card.odds.fated', 'sphere.force', 'ui.card.keyword.boost',
    ]));
    for (const id of ids) expect(resolveTooltip(id!), id!).not.toBeNull();
    expect(screen.getByTestId(`nudge-card-cost-${CARD.id}`).hasAttribute('title')).toBe(false);
    expect(screen.getByTestId(`nudge-card-odds-${CARD.id}`).hasAttribute('title')).toBe(false);
    // Law 11 — the accessible reading stays.
    expect(screen.getByTestId(`nudge-card-odds-${CARD.id}`).getAttribute('aria-label')).toMatch(/Fated/);
  });

  it('the pip primitives keep their raw title when no tooltip is asked for', () => {
    render(<><CostPips cost={2} data-testid="c" /><OddsPips value={0.1} data-testid="o" /></>);
    expect(screen.getByTestId('c').getAttribute('title')).toBe('2 essence');
    expect(screen.getByTestId('o').hasAttribute('title')).toBe(true);
  });

  it('every card type and every pip tier resolves in the registry', () => {
    for (const type of NUDGE_CARD_TYPES) {
      const entry = resolveTooltip(`ui.card.keyword.${type.id}`);
      expect(entry, type.id).not.toBeNull();
      expect(entry!.label).toBe(type.keyword);
      expect(entry!.desc.length, type.id).toBeLessThanOrEqual(200);
    }
    for (const tier of [...PIP_ODDS_TIERS, PIP_PENALTY_TIER]) {
      expect(resolveTooltip(`ui.card.odds.${tier.id}`), tier.id).not.toBeNull();
    }
  });
});

// ─── Done-when 4 — forecast words explain themselves ────────────────────────

const PANEL = {
  reach: 'iron',
  reachLabel: 'Iron',
  factors: [
    { id: 'f1', text: 'The intelligence could stop a war.', polarity: 'against' },
    { id: 'f2', text: 'She knows these roads.', polarity: 'for' },
    { id: 'f3', text: 'It is raining.', polarity: 'neutral' },
  ],
} as unknown as EncounterStageTestPanelModel;

describe('forecast words (D5)', () => {
  it('the dilemma pill hovers its own tier, and changes when the hand moves it', () => {
    const marks = (tier: (typeof FORECAST_TIERS)[number]) => (
      <NudgeReadingMarks
        testPanel={PANEL}
        forecast={{ tier, word: FORECAST_TIER_WORDS[tier], probability: 0.5 }}
        baseForecast={{ tier: 'doomed', word: 'Doomed', probability: 0.1 }}
        forecastMoved={tier !== 'doomed'}
        designerView={false}
      />
    );
    const { container, rerender } = render(marks('doomed'));
    expect(container.querySelector('[data-tooltip-id="ui.forecast.doomed"]')).not.toBeNull();
    rerender(marks('favorable'));
    expect(container.querySelector('[data-tooltip-id="ui.forecast.favorable"]')).not.toBeNull();
    expect(container.querySelector('[data-tooltip-id="ui.nudge_forecast"]')).toBeNull();
  });

  it('each tier word says what it means for the attempt and chains the ladder', () => {
    for (const tier of FORECAST_TIERS) {
      const desc = resolveTooltip(`ui.forecast.${tier}`)?.desc ?? '';
      expect(desc, tier).toMatch(/^As things stand/);
      expect(desc, tier).toContain('{{ui.nudge_forecast}}');
    }
  });

  it.each(FORECAST_TIERS)('a cast card prints the display word for %s, never the key', (tier) => {
    const model: CardFaceModel = {
      id: 'c1', testIdPrefix: 'action-card',
      picture: { tier: 'fallback', glyph: '◇', gradientIndex: 0, alt: 'x', kind: 'encounter' } as never,
      cost: 1, name: 'A Working', effectLine: 'Something happens.',
      odds: { kind: 'forecast', tier }, selected: false, dimmed: false, disabled: false,
    };
    render(<CardFace model={model} designerView={false} onToggle={() => {}} />);
    const word = screen.getByTestId('action-card-forecast-c1');
    expect(word.textContent).toBe(FORECAST_TIER_WORDS[tier]);
    expect(word.textContent).not.toBe(tier);
  });
});

// ─── Done-when 5 — factor polarity is a word ────────────────────────────────

describe('factor kind tags (D6, Law 31)', () => {
  it('every for/against line carries its tag; neutral lines carry none', () => {
    const { container } = render(<NudgeBalance testPanel={PANEL} />);
    for (const li of container.querySelectorAll('[data-factor-polarity]')) {
      const polarity = li.getAttribute('data-factor-polarity') as 'for' | 'against' | 'neutral';
      const tag = li.querySelector('[data-factor-kind]');
      if (polarity === 'neutral') {
        expect(tag).toBeNull();
      } else {
        expect(tag?.textContent).toBe(NUDGE_FACTOR_KIND_TAGS[polarity]);
        expect(li.querySelector(`[data-tooltip-id="ui.nudge_factor.${polarity}"]`)).not.toBeNull();
      }
    }
  });
});

// ─── Done-when 6 + 7 — Reaches on the sheet; quintessence leaves the strip ──

const IDENTITY: AscendantIdentityView = {
  divineName: 'Vess', mortalName: 'Vess', archetypeTitle: 'The Unblinking',
  epithet: 'The Hunger', portraitSrc: null, primarySphere: 'mind', secondarySphere: 'spirit',
};

describe('Reaches and quintessence (D7, D8)', () => {
  it('the sheet hovers every Reach tier word and the Reaches heading, and keeps the quintessence', () => {
    render(
      <AscendantSheet
        open onClose={() => {}} gameState={makeState()} archetype={ARCHETYPE}
        avatarName="Aurel Vane" sphereColor="#8899ff" originFragmentId="frag_1"
      />,
    );
    // The sheet renders through a portal, so read the document, not the container.
    const tiers = document.querySelectorAll('[data-testid^="sheet-reach-tier-"]');
    expect(tiers.length, 'premise: reach rows rendered').toBe(2);
    for (const el of tiers) {
      const id = el.parentElement?.getAttribute('data-tooltip-id');
      expect(id, el.getAttribute('data-testid')!).toBeTruthy();
      expect(resolveTooltip(id!)).not.toBeNull();
    }
    expect(screen.getByTestId('sheet-reaches-heading').parentElement?.getAttribute('data-tooltip-id')).toBe('ui.reaches');
    expect(screen.getByTestId('sheet-quintessence-word').textContent).toBe('Absolute');
  });

  it('showOnStrip flips below ASCENDANT_QUINTESSENCE_STRIP_SHOW_BELOW', () => {
    const top = ASCENDANT_QUINTESSENCE_STRIP_SHOW_BELOW * 100;
    expect(selectQuintessenceView(makeState(100)).showOnStrip).toBe(false);
    expect(selectQuintessenceView(makeState(top)).showOnStrip).toBe(false);
    expect(selectQuintessenceView(makeState(top - 1)).showOnStrip).toBe(true);
  });

  it('the identity strip drops every quintessence piece while it has not moved', () => {
    const at = (q: QuintessenceView) =>
      render(<IdentityStrip identity={IDENTITY} quintessence={q} onOpen={vi.fn()} />).container;
    const hidden = at({ ratio: 1, band: 'healthy', lexiconWord: 'Absolute', showOnStrip: false });
    expect(hidden.querySelector('[data-testid^="identity-quintessence-"]')).toBeNull();
    expect(hidden.textContent).not.toContain('Absolute');
    cleanup();
    const shown = at({ ratio: 0.6, band: 'healthy', lexiconWord: 'Resonant', showOnStrip: true });
    expect(shown.querySelector('[data-testid="identity-quintessence-label"]')).not.toBeNull();
    expect(shown.textContent).toContain('Resonant');
  });

  it('the bar and sheet Reaches heading copy resolves and says Spheres are separate', () => {
    expect(resolveTooltip('ui.reaches')?.desc).toMatch(/Spheres are what fuels it/);
  });
});
