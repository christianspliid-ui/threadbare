// @vitest-environment jsdom
/**
 * Test-panel + card iconography — THR-972 (director review 2026-08-02).
 *
 * Five directives, each with a failure mode that a "does it render" test cannot
 * see. The pairing rule from the sibling THR-970 suite applies throughout: where
 * a directive replaced one treatment with another, the test asserts the new
 * treatment **and** the absence of the old one, because a surface that draws both
 * satisfies a presence-only assertion while looking exactly like the bug.
 *
 * The phase is built by the real `buildNudgePhaseModel` rather than hand-shaped,
 * so a regression in the adapter breaks these instead of sliding past them. The
 * motive arm drives all four `MotiveSource` values through the real
 * `classifyMotive` — a fixture that asserted its own hand-written motive would
 * verify fiction (the "fixture invents both sides" trap).
 */

import { describe, expect, it } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { WorldGraph } from '../../../../engine/graph';
import type { GameState } from '../../../../types/gameState';
import type { MotiveSource } from '../../../../engine/encounters/motiveClassifier';
import type {
  ActionStep,
  StepNudge,
  UnifiedAction,
  UnifiedActionTemplate,
} from '../../../../types/unifiedAction';
import {
  MOTIVE_INTRO_VARIANTS,
  MOTIVE_MISSION_FALLBACK,
  NUDGE_READING_LEGEND_ENTRIES,
  TEST_GLYPH,
} from '../../../../data/nudge-stage-content';
import { NUDGE_GLYPH_LEGEND } from '../../../../data/nudge-card-display';
import {
  FORECAST_TIER_PIPS,
  generateDifficultyScalesSvg,
  generateForecastDieSvg,
} from '../../../icons';
import { buildNudgePhaseModel } from '../adapters/buildNudgePhaseModel';
import { NudgePhaseShell } from '../shells/NudgePhaseShell';

// ─── Fixtures ─────────────────────────────────────────────────────

const NUDGES: StepNudge[] = [
  {
    id: 'steady_hand',
    name: 'Steady the hand',
    essenceCost: 1,
    forecastDelta: 0.08,
    effectLine: 'Steadier than she was.',
  },
];

const STEP: ActionStep = {
  reach: 'iron',
  duration: { min: 1, max: 2 },
  difficulty: 0.5,
  onSuccess: [],
  onFailure: [],
  failBehavior: 'continue_weakened',
  narrativeTemplate: 'The vault door has not moved in a hundred years.',
  // THR-1478 — the step authors an objective so the "objective is gone from the
  // player surface" arm has something to fail on. Without it that assertion
  // passes against an empty model and proves nothing.
  purposeLine: 'force the door',
  nudges: NUDGES,
  factorLines: [{ text: 'The hinges were set by a careful hand.', polarity: 'against' }],
};

const TEMPLATE: UnifiedActionTemplate = {
  id: 'test.nudge_iconography',
  rarityTier: 1,
  intrinsicTier: 'background',
  name: 'The Darkhollow Vault',
  reach: 'iron',
  crudType: 'read',
  scale: 'local',
  steps: [STEP],
  apCost: 1,
  actorAffinities: ['individual'],
  motivations: ['courage_prudence'],
  narrativeTemplates: {
    initiation: 'The vault door has not moved in a hundred years.',
    success: 'It moves.',
    failure: 'It does not move.',
  },
};

const ACTOR_NAME = 'Sera Vance';
const MISSION_NAME = 'The Debt to Ilvane';

/**
 * `motiveReceipt` shapes that drive `classifyMotive` to each source.
 *
 * `MOTIVE_DOMINANT_SHARE` is 0.5, so a single 0.9-weight contribution of the
 * right kind claims the classification. `divine` is reached through action
 * provenance instead (see {@link buildAction}), which is the classifier's own
 * short-circuit.
 */
function receiptFor(source: MotiveSource): Record<string, unknown> | undefined {
  switch (source) {
    case 'mission':
      return {
        contributions: [
          { kind: 'ambition', weight: 0.9, provenance: { nodeId: 'ambition.debt' } },
        ],
      };
    case 'choice':
      return { contributions: [{ kind: 'personality', weight: 0.9 }] };
    case 'chance':
    case 'divine':
      return undefined;
  }
}

function buildGraph(source: MotiveSource, opts: { missionNode?: boolean } = {}): WorldGraph {
  const graph = new WorldGraph();
  const receipt = receiptFor(source);
  graph.addNode({
    id: 'agent.thief',
    type: 'actor',
    name: ACTOR_NAME,
    properties: {
      actorType: 'individual',
      ...(receipt ? { motiveReceipt: receipt } : {}),
    },
  });
  graph.addNode({ id: 'loc.vault', type: 'location', name: 'Darkhollow Vault', properties: {} });
  // The errand `{mission}` names. Omitted deliberately in the fallback arm.
  if (opts.missionNode !== false) {
    graph.addNode({
      id: 'ambition.debt',
      type: 'ambition',
      name: MISSION_NAME,
      properties: {},
    });
  }
  return graph;
}

function buildAction(source: MotiveSource, actionId = 'ua_iconography'): UnifiedAction {
  return {
    actionId,
    actorId: 'agent.thief',
    templateId: TEMPLATE.id,
    targetId: 'loc.vault',
    scale: 'local',
    // The classifier's divine short-circuit is action provenance, not a receipt.
    source: source === 'divine' ? 'player' : 'agent',
    startTick: 3,
    currentStep: 0,
    stepProgress: 0,
    stepDuration: 2,
    resolved: false,
    stepOutcomes: [],
  };
}

function buildState(force = 3): Partial<GameState> {
  return {
    essencePool: { force } as unknown as GameState['essencePool'],
    unlockedActionIds: [],
  };
}

function buildPhase(
  source: MotiveSource = 'chance',
  opts: { actionId?: string; missionNode?: boolean } = {},
) {
  return buildNudgePhaseModel({
    template: TEMPLATE,
    activeAction: buildAction(source, opts.actionId),
    step: STEP,
    graph: buildGraph(source, { missionNode: opts.missionNode }),
    gameState: buildState() as GameState,
  })!;
}

const ALL_SOURCES: readonly MotiveSource[] = ['chance', 'mission', 'divine', 'choice'];

// ─── 3. Motive line becomes the introduction ──────────────────────

describe('THR-972 · motive intro line', () => {
  it('resolves a variant for every MotiveSource, with no placeholder left raw', () => {
    const seen = new Set<MotiveSource>();

    for (const source of ALL_SOURCES) {
      const phase = buildPhase(source);
      seen.add(phase.motive!.source);

      const line = phase.motive?.introLine;
      expect(line, `${source} produced no intro line`).toBeTruthy();
      // The Done-when's leak check: substitution must be total, so no `{token}`
      // of any name survives onto the stage.
      expect(line, `${source} leaked a raw placeholder: ${line}`).not.toMatch(/\{\w+\}/);
      // And the substitution must have actually happened, not merely authored a
      // placeholder-free line — the actor's name has to be in there.
      expect(line).toContain(ACTOR_NAME);
    }

    // Guards the arm against a classifier change collapsing every fixture onto
    // one source, which would leave the loop above passing on four identical runs.
    expect(seen, 'fixtures did not exercise all four sources').toEqual(
      new Set(ALL_SOURCES),
    );
  });

  it('names the errand on a mission motive, and falls back when the graph cannot', () => {
    const named = buildPhase('mission');
    expect(named.motive?.introLine).toContain(MISSION_NAME);

    // Same classification, culled provenance node — the fallback noun stands in
    // rather than `{mission}` reaching the stage.
    const orphaned = buildPhase('mission', { missionNode: false });
    expect(orphaned.motive?.source).toBe('mission');
    expect(orphaned.motive?.introLine).toContain(MOTIVE_MISSION_FALLBACK);
    expect(orphaned.motive?.introLine).not.toMatch(/\{\w+\}/);
  });

  it('is deterministic per seed — same encounter, same line, every build', () => {
    const a = buildPhase('chance', { actionId: 'ua_seed_alpha' });
    const b = buildPhase('chance', { actionId: 'ua_seed_alpha' });
    expect(a.motive?.introLine).toBe(b.motive?.introLine);
  });

  it('selects across the variant pool rather than pinning one line', () => {
    // Falsifies "deterministic" being satisfied by a constant. Distinct action
    // ids must reach more than one authored variant of the same source.
    const lines = new Set(
      Array.from({ length: 24 }, (_, i) =>
        buildPhase('chance', { actionId: `ua_variant_${i}` }).motive?.introLine),
    );
    expect(lines.size).toBeGreaterThan(1);
    expect(lines.size).toBeLessThanOrEqual(MOTIVE_INTRO_VARIANTS.chance.length);
  });

  it('renders above the hand inside the shell, and not at all when the host owns it', () => {
    const phase = buildPhase('divine');

    render(<NudgePhaseShell phase={phase} onCommit={() => {}} />);
    expect(screen.getByTestId('nudge-motive-intro').textContent).toBe(
      phase.motive!.introLine,
    );
    // The chip+sentence strip this replaced must be gone, not merely relocated.
    expect(screen.queryByTestId('nudge-motive-strip')).toBeNull();
    expect(screen.queryByTestId('nudge-motive-chip')).toBeNull();

    cleanup();

    // EncounterVeil renders the line above its prose block and passes false, so
    // the shell must not draw a second copy.
    render(
      <NudgePhaseShell phase={phase} onCommit={() => {}} renderMotiveIntro={false} />,
    );
    expect(screen.queryByTestId('nudge-motive-intro')).toBeNull();
  });
});

// ─── 2 & 4. Reach chip and the framed test unit ───────────────────

describe('THR-972 · test panel', () => {
  it('draws the icon-set reach chip and retires the tiered PNG', () => {
    const phase = buildPhase();
    render(<NudgePhaseShell phase={phase} onCommit={() => {}} />);

    const chip = screen.getByTestId('nudge-reach-chip');
    expect(chip.getAttribute('data-reach')).toBe('iron');
    // The name survives as the accessible name now that the text label is gone.
    expect(chip.getAttribute('aria-label')).toBe(phase.testPanel.reachLabel);
    // ReachIcon renders inline SVG — the PNG path must be gone from the panel.
    expect(chip.querySelector('svg'), 'reach chip drew no icon-set SVG').toBeTruthy();
    expect(chip.querySelector('img')).toBeNull();
    expect(document.body.innerHTML).not.toContain('/assets/reaches/');
  });

  it('draws the difficulty as a tilted balance and spends no word on it', () => {
    const phase = buildPhase();
    render(<NudgePhaseShell phase={phase} onCommit={() => {}} />);

    const unit = screen.getByTestId('nudge-test-unit');
    const band = phase.testPanel.difficultyWord;

    // THR-1478, director ask 2026-09-12: *"find a way to iconify the difficulty
    // (fair) without a text."* The pairing rule — assert the mark AND the
    // absence of the word, because a frame drawing both looks exactly like the
    // bug the directive was filed against.
    expect(screen.queryByTestId('nudge-difficulty-word'), 'difficulty word survived').toBeNull();
    expect(unit.textContent, 'the frame still spells the band').not.toContain(band);
    expect(unit.textContent, 'the glyph the SVG replaced is back').not.toContain(TEST_GLYPH);
    // Ruling 6 — the numeral stays designer-view only.
    expect(unit.textContent).not.toMatch(/\d/);

    // The frame survives the word: *"the difficulty cant stand alone"* was a
    // ruling about the reading, not about the word, so the anchor stays.
    const scales = unit.querySelector('svg');
    expect(scales, 'difficulty drew no scales').toBeTruthy();
    expect(unit.getAttribute('data-difficulty-band')).toBe(band);

    // Law 11 — a glyph carrying meaning alone states its reading in words one
    // hover away. Without this the icon is a picture nobody can read.
    expect(unit.getAttribute('aria-label')).toContain(band);

    // The tilt is the shape channel that colour alone could not be (Law 11).
    // Falsify it across the *whole* vocabulary: four bands must draw four
    // beams, or the ladder is one icon in four colours and a player without
    // colour vision reads nothing.
    const beams = (['gentle', 'fair', 'steep', 'severe'] as const)
      .map((b) => generateDifficultyScalesSvg(b, 30));
    expect(new Set(beams).size, 'two bands draw the same beam').toBe(4);
    // And the tilt is monotone in difficulty — the beam falls further away from
    // the mortal as the step hardens, rather than merely differing per band.
    const angle = (svg: string) => Number(/rotate\((-?[\d.]+)/.exec(svg)![1]);
    const angles = beams.map(angle);
    expect(angles).toEqual([...angles].sort((a, b) => a - b));

    // Fail-soft (NFP #4): an unbanded word draws a level beam, never nothing.
    expect(generateDifficultyScalesSvg('nonsense', 30)).toBe(
      generateDifficultyScalesSvg('fair', 30),
    );
  });

  it('draws the forecast as a die whose pips are its rung on the ladder', () => {
    const phase = buildPhase();
    render(<NudgePhaseShell phase={phase} onCommit={() => {}} />);

    // *"remove the word forecast. make the forecast score 'uncertain' into an
    // icon like a dice."* Both halves asserted: the die is present, the label
    // and the tier word are gone from the surface.
    const die = screen.getByTestId('nudge-forecast-die');
    expect(screen.queryByTestId('nudge-forecast-word'), 'tier word survived').toBeNull();
    expect(screen.queryByTestId('nudge-forecast-pips'), 'the pip row survived beside the die').toBeNull();
    expect(die.textContent, 'the die spells its tier').not.toMatch(/doomed|perilous|uncertain|favorable|fated/i);
    expect(die.querySelector('svg'), 'forecast drew no die').toBeTruthy();
    expect(die.getAttribute('data-forecast-tier')).toBe(phase.baseForecast.tier);

    // Law 11 again — the word is the die's accessible name.
    expect(die.getAttribute('aria-label')).toContain(phase.baseForecast.word);

    // The pip count *is* the ladder, so the five tiers must draw five faces.
    // Counting distinct renderings is what makes this an ordinal test rather
    // than a "does it render" one.
    const tiers = ['doomed', 'perilous', 'uncertain', 'favorable', 'fated'] as const;
    const faces = tiers.map((tier) => generateForecastDieSvg(tier, 30));
    expect(new Set(faces).size, 'two tiers share a die face').toBe(5);

    // Ordinal, not merely distinct: the pip count rises with the tier, and the
    // drawn face carries that count. A die that differed per tier without
    // ordering would be five arbitrary symbols to memorise.
    const counts = tiers.map((t) => FORECAST_TIER_PIPS[t]);
    expect(counts).toEqual([...counts].sort((a, b) => a - b));
    faces.forEach((svg, i) => {
      expect((svg.match(/<circle/g) ?? []).length, `${tiers[i]} drew the wrong pip count`)
        .toBe(counts[i]);
    });
  });

  it('drops the objective line from the player surface', () => {
    // *"remove the objective (hear them out). it is noise."* The model still
    // carries it — the designer view reads it — so asserting on the rendered
    // surface rather than on the model is the whole test.
    const phase = buildPhase();
    expect(phase.testPanel.purposeLine, 'fixture has no objective to remove').toBeTruthy();

    render(<NudgePhaseShell phase={phase} onCommit={() => {}} />);
    expect(
      screen.getByTestId('nudge-test-panel').textContent,
    ).not.toContain(phase.testPanel.purposeLine);
  });

  it('names the three marks at first contact (Law 12)', () => {
    localStorage.removeItem('threadbare.ui.nudgeReadingLegendSeen');
    const phase = buildPhase();
    render(<NudgePhaseShell phase={phase} onCommit={() => {}} />);

    // Three glyph-only readings landed on one row; a vocabulary the player has
    // to infer from context is the failure Law 12 names.
    for (const entry of NUDGE_READING_LEGEND_ENTRIES) {
      expect(
        screen.getByTestId(`nudge-reading-legend-${entry.id}`).textContent,
      ).toContain(entry.label);
    }

    // The Balance disposition (THR-1478 item 5): the per-sentence hover is gone
    // and the colour vocabulary it taught lives in the legend instead. The
    // registry entry it used survives as that legend item's tooltip, so this
    // asserts a move, not a deletion.
    expect(NUDGE_READING_LEGEND_ENTRIES.map((e) => e.tooltipId)).toContain('ui.nudge_factors');
  });

  it('resolves the acting agent into the portrait slot', () => {
    const phase = buildPhase();
    render(
      <NudgePhaseShell
        phase={phase}
        agentName={ACTOR_NAME}
        focalActorId="agent.thief"
        portraitUrl="/portraits/maker.png"
        onCommit={() => {}}
      />,
    );

    const portrait = screen.getByTestId('nudge-actor-portrait');
    // Resolved art, not the gradient fallback the director read as an
    // unfilled encounter-image placeholder.
    expect(portrait.getAttribute('data-entity-visual-tier')).toBe('art');
    expect(portrait.querySelector('img')?.getAttribute('src')).toBe('/portraits/maker.png');
    expect(portrait.getAttribute('aria-label')).toBe(ACTOR_NAME);
  });
});

// ─── 5. Card icon vocabularies ────────────────────────────────────

describe('THR-972 · card iconography', () => {
  it('frames the price so it stops sharing a silhouette with the odds row', () => {
    const phase = buildPhase();
    render(<NudgePhaseShell phase={phase} onCommit={() => {}} />);

    const card = phase.cards[0];
    const cost = screen.getByTestId(`nudge-card-cost-${card.id}`);
    const odds = screen.getByTestId(`nudge-card-odds-${card.id}`);

    // The distinguishing treatment: price is framed, odds are not. Asserting
    // both sides is what makes this a separation test rather than a presence one.
    expect(cost.getAttribute('data-cost-framed')).toBe('true');
    expect(odds.getAttribute('data-cost-framed')).toBeNull();
    // Odds keep the pip vocabulary; price keeps the essence glyph.
    expect(odds.getAttribute('data-pip-tier')).toBeTruthy();
    expect(cost.getAttribute('data-pip-tier')).toBeNull();
  });

  it('names all three glyph vocabularies in the legend', () => {
    const phase = buildPhase();
    render(<NudgePhaseShell phase={phase} onCommit={() => {}} />);

    const legend = screen.getByTestId('nudge-glyph-legend');
    expect(NUDGE_GLYPH_LEGEND.length).toBe(3);

    for (const entry of NUDGE_GLYPH_LEGEND) {
      const row = screen.getByTestId(`nudge-legend-${entry.id}`);
      expect(legend.contains(row)).toBe(true);
      expect(row.textContent).toContain(entry.label);
      expect(row.textContent).toContain(entry.glyph);
    }
  });
});
