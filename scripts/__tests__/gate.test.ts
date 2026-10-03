/**
 * THR-1717 — `npm run gate` picks the right gates for a file list.
 *
 * The track decision is delegated to `docs-only-predicate.ts` (CI's own predicate),
 * so these tests pin what this script adds on top of it: which commands each track
 * owes, when the engine-only gates join, and that the tree-diffing gates run only in
 * the final phase — the ordering rule from `Docs/canon/verification-gates.md` that a
 * session most often gets wrong by hand.
 */

import { describe, it, expect } from 'vitest';

import {
  CLI_SMOKE_INPUT,
  checkCliSmoke,
  isEnginePath,
  planGates,
  renderSummary,
  tailLines,
  warnPlanDocLint,
  workingTreeContribution,
  type GateOptions,
} from '../gate.ts';

const TRACK: GateOptions = { final: false, all: false, heavy: false };
const names = (plan: ReturnType<typeof planGates>) => ({
  stages: plan.stages.map((stage) => stage.map((gate) => gate.name)),
  final: plan.final.map((gate) => gate.name),
});

describe('planGates', () => {
  it('runs test, typecheck, build and the encounter gate concurrently for a code diff, with no final phase', () => {
    const plan = planGates(['src/components/Foo.tsx', 'Docs/changelog.md'], TRACK);
    expect(plan.track).toBe('code');
    expect(plan.engine).toBe(false);
    expect(names(plan)).toEqual({ stages: [['test', 'typecheck', 'build', 'encounter']], final: [] });
  });

  it('adds the CLI smoke, then test:heavy in a stage of its own, when an engine path is touched', () => {
    const plan = planGates(['src/engine/orchestrator.ts'], TRACK);
    expect(plan.engine).toBe(true);
    expect(names(plan).stages).toEqual([['test', 'typecheck', 'build', 'encounter', 'cli-smoke'], ['test-heavy']]);
    const smoke = plan.stages[0].find((gate) => gate.name === 'cli-smoke');
    expect(smoke?.stdin).toBe(CLI_SMOKE_INPUT);
  });

  it('treats gameState.ts and graph.ts as engine paths, and --heavy forces the engine gates', () => {
    expect(isEnginePath('src/types/gameState.ts')).toBe(true);
    expect(isEnginePath('src\\types\\graph.ts')).toBe(true);
    expect(isEnginePath('src/types/trace.ts')).toBe(false);
    expect(planGates(['scripts/gate.ts'], { ...TRACK, heavy: true }).engine).toBe(true);
  });

  it('owes only the docs gates for a docs-only diff, linting changed plan docs', () => {
    const plan = planGates(['Docs/plans/2026-10-03-delivery-velocity.md', 'Docs/changelog.md'], TRACK);
    expect(plan.track).toBe('docs-only');
    expect(plan.engine).toBe(false);
    expect(names(plan).stages).toEqual([['impediment-ids', 'predicate-copies', 'plan-doc-lint']]);
    expect(plan.stages[0][2].command).toContain('Docs/plans/2026-10-03-delivery-velocity.md');
    expect(plan.stages.flat().some((gate) => gate.command.includes('npm test'))).toBe(false);
  });

  it('never owes engine gates on the docs track, even with --heavy', () => {
    expect(planGates(['Docs/changelog.md'], { ...TRACK, heavy: true }).engine).toBe(false);
  });

  it('--final runs only the closeout-sensitive gates, and --all appends them after the track', () => {
    expect(names(planGates(['src/components/Foo.tsx'], { ...TRACK, final: true }))).toEqual({
      stages: [],
      final: ['impediment-ids', 'generated-freshness', 'wiki-freshness'],
    });
    expect(names(planGates(['src/components/Foo.tsx'], { ...TRACK, all: true })).final).toEqual([
      'impediment-ids',
      'generated-freshness',
      'wiki-freshness',
    ]);
  });

  it('honours a forced track over the classifier', () => {
    expect(planGates(['Docs/changelog.md'], { ...TRACK, forceTrack: 'code' }).track).toBe('code');
    expect(planGates(['src/engine/a.ts'], { ...TRACK, forceTrack: 'docs-only' }).track).toBe('docs-only');
  });
});

describe('checkCliSmoke', () => {
  // Shape of the real status block (ANSI colour included), from a seed-42 medium run.
  const status = (tick: number, agents: number) =>
    `\x1b[2mfws>\x1b[0m \x1b[32m✓\x1b[0m Tick ${tick}  |  88 events\n  Tick:     ${tick}\n  Agents:   ${agents}\n`;

  it('passes a run that reaches tick 30 with agents', () => {
    expect(checkCliSmoke(status(30, 532))).toBeNull();
  });

  it('fails a run whose ticks crashed — the CLI still exits 0, so the output is the only signal', () => {
    const crashed = '[Orchestrator] Tick crashed, returning previous state: TypeError: x\n' + status(0, 532);
    expect(checkCliSmoke(crashed)).toMatch(/Tick crashed/);
  });

  it('fails a run that stops short of tick 30, or has no agents, or printed no status', () => {
    expect(checkCliSmoke(status(12, 532))).toMatch(/did not reach tick 30 \(read 12\)/);
    expect(checkCliSmoke(status(30, 0))).toMatch(/no agents/);
    expect(checkCliSmoke('fws> Goodbye.')).toMatch(/no status block/);
  });

  it('is attached to the cli-smoke gate', () => {
    const smoke = planGates(['src/engine/a.ts'], TRACK).stages[0].find((gate) => gate.name === 'cli-smoke');
    expect(smoke?.check).toBe(checkCliSmoke);
  });
});

describe('verdict output', () => {
  it('prints one line per gate and names the log of a failure', () => {
    const plan = planGates(['src/components/Foo.tsx'], TRACK);
    const text = renderSummary(
      plan,
      [
        { gate: plan.stages[0][0], ok: true, seconds: 73, log: '.cache/gate/test.log' },
        { gate: plan.stages[0][2], ok: false, seconds: 20, log: '.cache/gate/build.log' },
      ],
      74,
    );
    expect(text).toMatch(/PASS {2}test +73s/);
    expect(text).toMatch(/FAIL {2}build +20s {2}→ \.cache\/gate\/build\.log/);
    expect(text).toContain('gate: FAIL (1 of 2) — track=code engine=no — 74s wall');
  });

  it('tails the last non-empty lines of a log', () => {
    expect(tailLines('a\r\nb\nc\n\n\n', 2)).toEqual(['b', 'c']);
  });

  it('labels an advisory finding WARN without failing the gate', () => {
    const plan = planGates(['Docs/plans/2026-10-04-x.md'], TRACK);
    const lint = plan.stages[0].find((gate) => gate.name === 'plan-doc-lint')!;
    const text = renderSummary(
      plan,
      [{ gate: lint, ok: true, seconds: 1, log: '.cache/gate/plan-doc-lint.log', warning: '2 lint error(s)' }],
      1,
    );
    expect(text).toMatch(/WARN {2}plan-doc-lint +1s {2}→ 2 lint error\(s\)/);
    expect(text).toContain('gate: PASS with 1 warning(s)');
  });
});

describe('plan-doc lint is advisory but visible', () => {
  it('counts [ERROR] lines — the lint exits 0 without --strict, so its output is the only signal', () => {
    const output = '[ERROR] done-when Docs/plans/x.md:1 Missing\n  [ERROR] wiring Docs/plans/x.md:1 Missing\n[WARN] blast-radius\n';
    expect(warnPlanDocLint(output)).toMatch(/^2 lint error\(s\)/);
    expect(warnPlanDocLint('lint:plan-doc passed (no findings).')).toBeNull();
  });

  it('is attached to the plan-doc-lint gate as a warning, never a failure', () => {
    const lint = planGates(['Docs/plans/2026-10-04-x.md'], TRACK).stages[0].find((g) => g.name === 'plan-doc-lint');
    expect(lint?.warn).toBe(warnPlanDocLint);
    expect(lint?.check).toBeUndefined();
  });
});

describe('workingTreeContribution', () => {
  it('drops the harness-rewritten local settings file, in either slash form', () => {
    expect(
      workingTreeContribution(['.claude/settings.local.json', '.claude\\settings.local.json', 'Docs/plans/a.md']),
    ).toEqual(['Docs/plans/a.md']);
  });

  it('keeps the classification docs-only when only the local settings file is dirty', () => {
    const files = [...['Docs/plans/a.md'], ...workingTreeContribution(['.claude/settings.local.json'])];
    expect(planGates(files, TRACK).track).toBe('docs-only');
  });

  it('keeps the checked-in project settings — a real config change', () => {
    expect(workingTreeContribution(['.claude/settings.json'])).toEqual(['.claude/settings.json']);
  });
});
