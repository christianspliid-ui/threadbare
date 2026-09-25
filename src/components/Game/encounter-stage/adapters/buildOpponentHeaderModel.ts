/**
 * The opponent header's view-model (THR-1551, plan doc
 * `Docs/plans/2026-09-23-fight-on-screen.md` § UI pillar 1, slice F2).
 *
 * On a fight step the veil shows who the mortal is facing and how close it is
 * to falling: the opponent's name (a link), one card sentence (Law 16), the
 * clock as square pips and a word (Law 13 — never a digit), and, in a duel,
 * the fighter's own clock beside it. The watched view gets the compact `line`.
 *
 * **Who the opponent is** (plan doc 2 §1): after the nerve step,
 * `fightState.opponentId`; before it, the step's `opponentRef` through the
 * action's cast bindings, else the action's target — the same
 * `resolveFightOpponent` the roll uses, so `monster.hunt.named_elite` (target:
 * the lair) names the beast on its nerve step.
 *
 * **The clock** reads `fightState.clockNow` once the fight exists. Before it (the
 * nerve step) it reads the opponent card's *recovered* clock through
 * `readOpponentCard` — exactly the value FB2 records as `clockAtStart`, so the
 * word never drops between "Facing it" and the first exchange.
 *
 * Pure: reads the graph and the action, writes nothing, emits no traces (the
 * plan's Tracing section is N/A — `window.__DEBUG.getOpponentHeaderModel`
 * returns this model).
 */

import type { GameState } from '../../../../types/gameState';
import type { FightRatingWord, FightTemper } from '../../../../types/fight';
import type {
  ActionStep,
  UnifiedAction,
  UnifiedActionTemplate,
} from '../../../../types/unifiedAction';
import { isActionStepBranch } from '../../../../types/unifiedAction';
import type { MonsterFamilyId } from '../../../../types/monster';
import { resolveStepDefinition } from '../../../../engine/unifiedActionLifecycle';
import { fightRoleOf, resolveFightOpponent } from '../../../../engine/fights/fightStepInputs';
import { readOpponentCard } from '../../../../engine/fights/opponentCard';
import { isMonster } from '../../../../engine/monsters/isMonster';
import { FIGHT_MORTAL_CLOCK } from '../../../../data/fight-constants';
import { MONSTER_FAMILIES } from '../../../../data/monster-families';
import {
  DREAD_PHRASES,
  FIGHT_STEP_LABELS,
  FIGHT_STEP_LABEL_OVERFLOW,
  FIGHT_TOOLTIP_IDS,
  MIGHT_PHRASES,
  MORTAL_OPPONENT_LINE,
  TEMPER_CLAUSES,
  UNKNOWN_FOE_NAME,
  WATCHED_OPPONENT_LINE_PREFIX,
  clockStateWord,
  clockWordTooltipId,
  type ClockStateWord,
} from '../../../../data/fight-screen-content';

// ─── Model ────────────────────────────────────────────────────────

/** One clock row: square pips and the clock-state word (never a digit). */
export interface OpponentHeaderClockModel {
  /** Pip count (the clock's size). */
  readonly size: number;
  /** Filled pips. */
  readonly filled: number;
  readonly word: ClockStateWord;
  /** The clock-state word's registry id (`fight.clock.<word>`). */
  readonly wordTooltipId: string;
  /** The pip row's `aria-label` — the word, so the row reads the way it looks. */
  readonly ariaLabel: string;
}

/** A clause of the card sentence and the concept it explains (Law 17). */
export interface OpponentSentenceSegment {
  readonly text: string;
  readonly tooltipId?: string;
  /** The family clause truncates first when the header runs out of room (Law 33). */
  readonly role: 'family' | 'dread' | 'might' | 'temper' | 'joiner';
}

export interface OpponentHeaderModel {
  /** The step's fight role. */
  readonly role: 'nerve' | 'clash';
  /** The fight step's title ("Facing it", "First exchange", …). */
  readonly stepLabel: string;
  /** The opponent's node id — the link target, never rendered. Null = unknown foe. */
  readonly opponentId: string | null;
  /** The opponent's name, or "an unknown foe" (fail-soft: no link). */
  readonly name: string;
  /** True when the name opens the opponent's sheet (Law 21). */
  readonly linkable: boolean;
  /** `EntityVisual` kind for the art tile. */
  readonly visualKind: 'monster' | 'agent';
  readonly isMonster: boolean;
  /** The card sentence as clauses, each carrying its tooltip (Law 16/17). */
  readonly sentence: readonly OpponentSentenceSegment[];
  /** The whole sentence as plain text (tests, debug). */
  readonly sentenceText: string;
  /** Whether the temper clause renders (it has shown). */
  readonly temperShown: boolean;
  /** The opponent's clock. */
  readonly clock: OpponentHeaderClockModel;
  /**
   * A duel's own-side clock (plan doc 5): present only in agent mode — when
   * `fightState.fighterClockSize` exists, or on an agent-mode nerve step (then
   * `FIGHT_MORTAL_CLOCK`, untouched).
   */
  readonly fighterClock?: OpponentHeaderClockModel & { readonly name: string };
  /** The watched view's compact form: `Facing {name} — {word}`. */
  readonly line: string;
  /** Whether the opponent is a known, bound node (false = the fail-soft default). */
  readonly resolved: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────

function capitalize(text: string): string {
  return text.length > 0 ? text.charAt(0).toUpperCase() + text.slice(1) : text;
}

function clockModel(filled: number, size: number, deceased = false): OpponentHeaderClockModel {
  const total = Number.isFinite(size) && size >= 1 ? Math.floor(size) : 1;
  const fill = Number.isFinite(filled) ? Math.max(0, Math.min(total, Math.floor(filled))) : 0;
  const word = clockStateWord(fill, total, deceased);
  return {
    size: total,
    filled: fill,
    word,
    wordTooltipId: clockWordTooltipId(word),
    ariaLabel: word,
  };
}

function isStep(step: unknown): step is ActionStep {
  return !!step && typeof step === 'object' && !isActionStepBranch(step as never);
}

/**
 * The title of fight step `stepIndex`, or undefined for an ordinary step.
 * Counts the fight steps before it — the nerve step is "Facing it", each clash
 * after it an exchange. Branch steps never carry a fight role (the block is
 * terminal, plan doc 2 §6), so they are skipped in the count.
 */
export function fightStepLabel(
  template: Pick<UnifiedActionTemplate, 'steps'>,
  stepIndex: number,
): string | undefined {
  const step = template.steps[stepIndex];
  if (!isStep(step) || !fightRoleOf(step)) return undefined;
  let position = 0;
  for (let i = 0; i < stepIndex; i++) {
    const earlier = template.steps[i];
    if (isStep(earlier) && fightRoleOf(earlier)) position++;
  }
  return FIGHT_STEP_LABELS[position] ?? FIGHT_STEP_LABEL_OVERFLOW;
}

function familyLineFor(bag: Record<string, unknown> | undefined, monster: boolean): string {
  if (!monster) return MORTAL_OPPONENT_LINE;
  const family = typeof bag?.family === 'string' ? MONSTER_FAMILIES[bag.family as MonsterFamilyId] : undefined;
  return capitalize(family?.cardLine ?? MONSTER_FAMILIES.beast.cardLine);
}

/** The card sentence: family line, Dread and Might phrases, the temper clause once shown. */
function buildSentence(
  familyLine: string,
  dread: FightRatingWord,
  might: FightRatingWord,
  temper: FightTemper,
  temperShown: boolean,
): OpponentSentenceSegment[] {
  const segments: OpponentSentenceSegment[] = [
    { text: `${familyLine}.`, role: 'family' },
    { text: ' ', role: 'joiner' },
    { text: capitalize(DREAD_PHRASES[dread]), tooltipId: FIGHT_TOOLTIP_IDS.dread.tooltipId, role: 'dread' },
    { text: ', ', role: 'joiner' },
    { text: MIGHT_PHRASES[might], tooltipId: FIGHT_TOOLTIP_IDS.might.tooltipId, role: 'might' },
    { text: '.', role: 'joiner' },
  ];
  if (temperShown) {
    segments.push(
      { text: ' ', role: 'joiner' },
      // The clause carries the Temper concept. The plan expected the temper traits'
      // derived `attachment.trait.temper.*` ids to explain each word, but the
      // registry does not resolve them (a temper is not an attachment subcategory),
      // and a dead id draws a link that explains nothing (Law 21). THR-1551.
      { text: TEMPER_CLAUSES[temper], tooltipId: FIGHT_TOOLTIP_IDS.temper.tooltipId, role: 'temper' },
    );
  }
  return segments;
}

// ─── Builder ──────────────────────────────────────────────────────

/**
 * Build the opponent header for `action`'s current step. Returns `null` when the
 * step is not a fight step (the header renders only on `fightRole` steps).
 *
 * Fail-soft: an opponent that cannot be resolved renders as "an unknown foe"
 * with the default card and no link — review Done-whens assert a named opponent,
 * so this fallback can never satisfy one.
 */
export function buildOpponentHeaderModel(
  state: Pick<GameState, 'graph' | 'tick'>,
  action: UnifiedAction,
  template: UnifiedActionTemplate,
): OpponentHeaderModel | null {
  let step: ActionStep;
  try {
    step = resolveStepDefinition(template, action.currentStep, action.choiceHistory);
  } catch {
    return null;
  }
  const role = fightRoleOf(step);
  if (!role) return null;

  const fight = action.fightState;
  let opponentId: string | null;
  if (fight) {
    opponentId = fight.opponentId;
  } else {
    const found = resolveFightOpponent(state, action, step);
    opponentId = found.status === 'bound' || found.status === 'deceased' ? found.opponentId : null;
  }
  const node = opponentId ? state.graph.getNode(opponentId) : undefined;
  const resolved = !!node && opponentId !== action.actorId;
  if (!resolved) opponentId = null;

  const card = readOpponentCard(state.graph, opponentId, state.tick);
  const monster = resolved && isMonster(node);
  const bag = node?.properties.monsterState as Record<string, unknown> | undefined;
  const deceased = resolved && (node!.properties.deceased === true || node!.properties.status === 'dead');
  const temperShown = monster && bag?.temperShown === true;
  const name = resolved && typeof node!.name === 'string' && node!.name.trim().length > 0
    ? node!.name.trim()
    : UNKNOWN_FOE_NAME;

  // The clock: the fight's own once it exists, else the card's recovered clock.
  const clock = fight
    ? clockModel(fight.clockNow, fight.clockSize, deceased)
    : clockModel(card.clockFilled, card.clockSize, deceased);

  // A duel's own-side clock (plan doc 5): recorded once the fight exists, and on
  // an agent-mode nerve step the fighter starts untouched at FIGHT_MORTAL_CLOCK.
  let fighterClock: OpponentHeaderModel['fighterClock'];
  const fighterNode = state.graph.getNode(action.actorId);
  const fighterName = typeof fighterNode?.name === 'string' && fighterNode.name.trim() ? fighterNode.name.trim() : 'The fighter';
  if (fight && typeof fight.fighterClockSize === 'number') {
    const fighterDeceased = fighterNode?.properties.deceased === true;
    fighterClock = { ...clockModel(fight.fighterClockNow ?? 0, fight.fighterClockSize, fighterDeceased), name: fighterName };
  } else if (!fight && step.fightMode === 'agent') {
    fighterClock = { ...clockModel(0, FIGHT_MORTAL_CLOCK), name: fighterName };
  }

  const sentence = resolved
    ? buildSentence(familyLineFor(bag, monster), card.dread, card.might, card.temper, temperShown)
    : buildSentence(capitalize(UNKNOWN_FOE_NAME), card.dread, card.might, card.temper, false);

  return {
    role,
    stepLabel: fightStepLabel(template, action.currentStep) ?? FIGHT_STEP_LABELS[0],
    opponentId,
    name,
    linkable: resolved,
    visualKind: monster ? 'monster' : 'agent',
    isMonster: monster,
    sentence,
    sentenceText: sentence.map((s) => s.text).join(''),
    temperShown,
    clock,
    ...(fighterClock ? { fighterClock } : {}),
    line: `${WATCHED_OPPONENT_LINE_PREFIX} ${name} — ${clock.word}`,
    resolved,
  };
}
