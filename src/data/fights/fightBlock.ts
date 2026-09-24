/**
 * `fightBlock(spec)` — the fight block as authoring (THR-1543, plan doc
 * `Docs/plans/2026-09-23-fight-block.md` § Content pillar, THR-1269 §1).
 *
 * A pure helper that returns plain `ActionStep[]`: one nerve step and up to
 * `FIGHT_EXCHANGE_CAP` clash steps, each stamped with `fightRole` (and
 * `opponentRef` when the spec names one). Nothing here is a fight *behaviour* —
 * every behaviour is engine logic keyed on `fightRole`, and authors write no fight
 * effects. What the helper owns is the shape and the defaults:
 *
 *  - `difficulty: FIGHT_STEP_PLACEHOLDER_DIFFICULTY` — the roll never reads it (the
 *    card prices every fight step), but card-blind readers (the planner, the cache,
 *    the CMS, the codex) read a plausible middle value instead of zero;
 *  - `duration: FIGHT_STEP_DURATION` and `failBehavior: FIGHT_STEP_FAIL_BEHAVIOR`;
 *  - the default reaches (heart for nerve, iron for each clash);
 *  - the default band afterimages, one per band per role, in the game's register.
 *
 * **The block is terminal** (plan doc §6, v1): once a step carries `fightRole`,
 * every later step does too. A pure helper cannot see what an author appends to
 * its return value, so the rule is enforced twice: `assertFightBlockTerminal`
 * (throws, for a template author's own test) and the catalog-wide content
 * invariant over `UNIFIED_ACTION_TEMPLATES`.
 *
 * The JSON package path pre-expands it in `scripts/compile-encounter.ts`: a
 * package step `{ "fightBlock": { … } }` is replaced by this function's return
 * value, so no function ever reaches the generated action catalog.
 */

import type { ActionStep, StepNudge, StepOutcome } from '../../types/unifiedAction';
import type { ReachDomain } from '../../types/traits';
import type { ComplicationTemplate } from '../../types/complication';
import {
  FIGHT_DEFAULT_CLASH_REACH,
  FIGHT_DEFAULT_NERVE_REACH,
  FIGHT_EXCHANGE_CAP,
  FIGHT_STEP_DURATION,
  FIGHT_STEP_FAIL_BEHAVIOR,
  FIGHT_STEP_PLACEHOLDER_DIFFICULTY,
} from '../fight-constants';

/** One fight step's authored prose: its pressure line and any band afterimage overrides. */
export interface FightStepProse {
  readonly narrativeTemplate?: string;
  readonly purposeLine?: string;
  readonly afterimages?: Partial<Record<StepOutcome, string>>;
}

export interface FightBlockSpec {
  /** Clash steps after the nerve step. Default and maximum: `FIGHT_EXCHANGE_CAP`. */
  readonly exchanges?: number;
  /**
   * The cast key naming the opponent. Absent ⇒ the action's target (a standalone
   * fight template's opponent is its target). When set it **must** bind.
   */
  readonly opponentRef?: string;
  readonly nerveReach?: ReachDomain;
  readonly clashReach?: ReachDomain;
  /** The nerve step's prose — a fight template's opening line belongs here, not in a separate step. */
  readonly nerve?: FightStepProse;
  /** Per-exchange prose, by exchange (the last entry repeats for later exchanges). */
  readonly clashes?: readonly FightStepProse[];
  readonly nerveNudges?: readonly StepNudge[];
  readonly clashNudges?: readonly StepNudge[];
  readonly deal?: ActionStep['deal'];
  /** Mid-fight events merged into this fight's complication pool (plan doc §12). */
  readonly complications?: readonly ComplicationTemplate[];
}

/**
 * The index a fight's result memory is written at: past the terminal block, an
 * index no step owns (plan doc §6, "the memory rule"). A fight template's
 * aftermath sets `branchOnStep: fightResultIndex(steps)`.
 */
export function fightResultIndex(steps: readonly unknown[]): number {
  return steps.length;
}

const EXCHANGE_WORDS = ['first', 'second', 'third', 'fourth', 'fifth'] as const;

function exchangeWord(index: number): string {
  return EXCHANGE_WORDS[index] ?? 'next';
}

/**
 * The default band afterimages (plan doc § Prose tables), one per band per role.
 * `{opponent}` is replaced by the block's opponent token: `{target}` for a
 * standalone fight, `{cast:<ref>}` for a cast-bound opponent. GAME register, GM
 * narration: what happened, plainly.
 */
export const FIGHT_DEFAULT_AFTERIMAGES: Readonly<Record<'nerve' | 'clash', Readonly<Record<StepOutcome, string>>>> = {
  nerve: {
    critical_success: '{name} holds, and something hot in the chest answers.',
    success: '{name} holds.',
    near_miss: '{name} holds, badly.',
    success_at_cost: '{name} holds, shaking.',
    failure: 'The fear gets into {name}.',
    critical_failure: '{name} breaks and runs.',
  },
  clash: {
    critical_success: '{name} lands a clean, telling blow on {opponent}.',
    success: '{name} lands a blow on {opponent}.',
    near_miss: '{name} and {opponent} trade blows.',
    success_at_cost: '{name} lands one on {opponent} and takes one back.',
    failure: '{opponent} drives {name} back.',
    critical_failure: '{opponent} strikes {name} down.',
  },
};

/** The default pressure lines, when the spec authors none. */
const DEFAULT_NERVE_NARRATIVE = 'Before the first blow, {name} has to find the nerve to stand against {opponent}.';
const DEFAULT_CLASH_NARRATIVE = 'The {exchange} exchange: {name} closes with {opponent}.';

function opponentToken(spec: FightBlockSpec): string {
  return spec.opponentRef ? `{cast:${spec.opponentRef}}` : '{target}';
}

function afterimageFields(
  role: 'nerve' | 'clash',
  token: string,
  overrides: Partial<Record<StepOutcome, string>> | undefined,
): Pick<ActionStep,
  'successAfterimage' | 'failureAfterimage' | 'successAtCostAfterimage'
  | 'criticalSuccessAfterimage' | 'criticalFailureAfterimage' | 'nearMissAfterimage'> {
  const line = (band: StepOutcome) =>
    (overrides?.[band] ?? FIGHT_DEFAULT_AFTERIMAGES[role][band]).replace(/\{opponent\}/g, token);
  return {
    criticalSuccessAfterimage: line('critical_success'),
    successAfterimage: line('success'),
    nearMissAfterimage: line('near_miss'),
    successAtCostAfterimage: line('success_at_cost'),
    failureAfterimage: line('failure'),
    criticalFailureAfterimage: line('critical_failure'),
  };
}

/**
 * Expand a fight block into plain steps: one nerve step, then `exchanges` clash
 * steps. Throws on an exchange count outside `[1, FIGHT_EXCHANGE_CAP]` — an
 * authoring error, caught at module load and by the block's test, never in the
 * tick loop.
 */
export function fightBlock(spec: FightBlockSpec = {}): ActionStep[] {
  const exchanges = spec.exchanges ?? FIGHT_EXCHANGE_CAP;
  if (!Number.isInteger(exchanges) || exchanges < 1 || exchanges > FIGHT_EXCHANGE_CAP) {
    throw new Error(
      `fightBlock: exchanges must be an integer in [1, ${FIGHT_EXCHANGE_CAP}], got ${String(spec.exchanges)}`,
    );
  }
  const token = opponentToken(spec);
  const fill = (text: string, exchange?: number) => text
    .replace(/\{opponent\}/g, token)
    .replace(/\{exchange\}/g, exchange === undefined ? '' : exchangeWord(exchange));

  const shared = {
    duration: FIGHT_STEP_DURATION,
    difficulty: FIGHT_STEP_PLACEHOLDER_DIFFICULTY,
    failBehavior: FIGHT_STEP_FAIL_BEHAVIOR,
    onSuccess: [],
    onFailure: [],
    ...(spec.opponentRef ? { opponentRef: spec.opponentRef } : {}),
    ...(spec.deal ? { deal: spec.deal } : {}),
    ...(spec.complications?.length ? { fightComplications: spec.complications } : {}),
  } as const;

  const nerve: ActionStep = {
    ...shared,
    fightRole: 'nerve',
    reach: spec.nerveReach ?? FIGHT_DEFAULT_NERVE_REACH,
    narrativeTemplate: fill(spec.nerve?.narrativeTemplate ?? DEFAULT_NERVE_NARRATIVE),
    ...(spec.nerve?.purposeLine ? { purposeLine: spec.nerve.purposeLine } : {}),
    ...afterimageFields('nerve', token, spec.nerve?.afterimages),
    ...(spec.nerveNudges?.length ? { nudges: spec.nerveNudges } : {}),
  };

  const clashes: ActionStep[] = [];
  for (let i = 0; i < exchanges; i++) {
    const prose = spec.clashes?.[Math.min(i, (spec.clashes?.length ?? 1) - 1)];
    clashes.push({
      ...shared,
      fightRole: 'clash',
      reach: spec.clashReach ?? FIGHT_DEFAULT_CLASH_REACH,
      narrativeTemplate: fill(prose?.narrativeTemplate ?? DEFAULT_CLASH_NARRATIVE, i),
      ...(prose?.purposeLine ? { purposeLine: prose.purposeLine } : {}),
      ...afterimageFields('clash', token, prose?.afterimages),
      ...(spec.clashNudges?.length ? { nudges: spec.clashNudges } : {}),
    });
  }
  return [nerve, ...clashes];
}

/**
 * The JSON package path's pre-expansion (`scripts/compile-encounter.ts`): every step
 * entry of the shape `{ "fightBlock": FightBlockSpec }` is replaced by the block's
 * steps, inline, so the compiled module carries plain steps and no function reaches
 * the generated action catalog. Other entries pass through untouched.
 */
export function expandFightBlockSteps(steps: readonly unknown[]): unknown[] {
  return steps.flatMap((step) => {
    if (step && typeof step === 'object' && 'fightBlock' in step) {
      return fightBlock((step as { fightBlock: FightBlockSpec }).fightBlock);
    }
    return [step];
  });
}

/**
 * The terminal rule (plan doc §6): once a step carries `fightRole`, every later
 * step does too. Throws naming the first offending step. Branch entries carry no
 * `fightRole` of their own, so a branch after a block is content after it.
 */
export function assertFightBlockTerminal(steps: readonly unknown[], templateId: string): void {
  let inBlock = false;
  steps.forEach((step, index) => {
    const role = (step as { fightRole?: unknown }).fightRole;
    if (role) {
      inBlock = true;
    } else if (inBlock) {
      throw new Error(
        `${templateId}: step ${index} follows a fight block but carries no fightRole — `
        + 'a fight block is terminal in v1 (plan doc §6). A branch that wants a fight plants '
        + 'a standalone fight template instead.',
      );
    }
  });
}
