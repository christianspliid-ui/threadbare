/**
 * Nudge grant liveness — every content id a card grants must resolve against
 * content that is actually built. THR-885.
 *
 * **Why this is a build gate and not a lint.** A card that says it leaves a
 * blade in the reeds, and names an artifact template nobody wrote, fails
 * *silently*: the grant no-ops deep inside the aftermath applier, the fiction
 * still prints, and the player is told a thing happened that did not. THR-844
 * is the standing evidence — 66 of 138 hidden-mark entries pointed at a reveal
 * family that had never existed, and nothing surfaced it for months because
 * dead references cost nothing at runtime.
 *
 * So: the reference is checked where it is cheapest to fix, at build time,
 * against the same catalogs the runtime will look in.
 *
 * Related: `validateTraitRefs` (`src/engine/traitRefValidation.ts`) does this job
 * for trait gates. This is the same idea over the card-grant surface.
 */

import type {
  EncounterAftermathReactionEffect,
  UnifiedActionTemplate,
} from '../types/unifiedAction';
import { isActionStepBranch } from '../types/unifiedAction';
import { AMBITION_TEMPLATES } from '../data/ambition-templates';
import { ARTIFACT_TEMPLATES } from '../data/artifact-templates';
import { CONDITION_TRAIT_DEFINITIONS } from '../data/condition-trait-content';
// THR-1110 — every catalog `attachment_grant` can name. This list mirrors the
// sources `seedAttachments` puts in the graph plus the two registry-backed paths
// (`getAgreementTemplate`, `getCompanionTemplate`), so the gate asks exactly the
// question `instantiateReward` will ask at runtime.
import { STARTER_POSSESSIONS, STARTER_CONDITIONS } from '../data/starter-attachments';
import {
  REWARD_POSSESSIONS,
  REWARD_CONDITIONS,
  REWARD_BESTOWED_POWERS,
} from '../data/reward-attachment-catalog';
import {
  ANOMALY_SIGNATURE_ARTIFACTS,
  ANOMALY_BESTOWED_POWERS,
  ANOMALY_CONDITIONS,
} from '../data/anomaly-reward-catalog';
import { AGREEMENT_REWARD_TEMPLATES } from '../data/agreement-reward-catalog';
import { COMPANION_TEMPLATES } from '../data/companion-templates';

/** Content kinds a card grant can name. */
export type NudgeGrantRefKind = 'ambition' | 'artifact' | 'condition' | 'attachment';

export interface DeadNudgeGrantRef {
  readonly templateId: string;
  readonly stepIndex: number;
  readonly nudgeId: string;
  readonly effectKind: string;
  readonly refKind: NudgeGrantRefKind;
  /** The id that resolved against nothing. */
  readonly ref: string;
}

export interface NudgeGrantLivenessReport {
  /** Grant references checked — a zero here means the sweep matched nothing (see below). */
  readonly checkedRefs: number;
  /** Cards carrying at least one grant. */
  readonly cardsWithGrants: number;
  readonly dead: readonly DeadNudgeGrantRef[];
}

// ─── Catalog indexes ─────────────────────────────────────────────────

function buildLiveIndex(): Readonly<Record<NudgeGrantRefKind, ReadonlySet<string>>> {
  return {
    ambition: new Set(AMBITION_TEMPLATES.map((t) => t.id)),
    artifact: new Set(ARTIFACT_TEMPLATES.map((t) => t.id)),
    condition: new Set(CONDITION_TRAIT_DEFINITIONS.map((n) => n.id)),
    attachment: new Set([
      ...STARTER_POSSESSIONS.map((n) => n.id),
      ...STARTER_CONDITIONS.map((n) => n.id),
      ...REWARD_POSSESSIONS.map((n) => n.id),
      ...REWARD_CONDITIONS.map((n) => n.id),
      ...REWARD_BESTOWED_POWERS.map((n) => n.id),
      ...ANOMALY_SIGNATURE_ARTIFACTS.map((n) => n.id),
      ...ANOMALY_BESTOWED_POWERS.map((n) => n.id),
      ...ANOMALY_CONDITIONS.map((n) => n.id),
      ...CONDITION_TRAIT_DEFINITIONS.map((n) => n.id),
      ...AGREEMENT_REWARD_TEMPLATES.map((t) => t.id),
      ...COMPANION_TEMPLATES.map((t) => t.id),
    ]),
  };
}

/**
 * Content references a single grant effect makes, if any.
 *
 * Only effects that name a *catalog id* are checked. `emit_omen` names an
 * `OmenCategory`, which the type system already closes, and `favor_creation`
 * names no content at all — neither can rot, so neither is swept. Adding a new
 * id-naming effect kind means adding it here, or its cards go unchecked.
 */
function refsForEffect(
  effect: EncounterAftermathReactionEffect,
): readonly { kind: NudgeGrantRefKind; ref: string }[] {
  switch (effect.kind) {
    case 'assign_ambition':
      return [{ kind: 'ambition', ref: effect.templateId }];
    case 'spawn_artifact':
      // `templateId` is optional — a category-only spawn picks at runtime and
      // names nothing that can rot.
      return effect.templateId ? [{ kind: 'artifact', ref: effect.templateId }] : [];
    case 'remove_condition':
    case 'apply_condition':
      return [{ kind: 'condition', ref: effect.conditionTraitId }];
    case 'condition_attachment':
      return [{ kind: 'condition', ref: effect.templateId }];
    case 'attachment_grant':
      return [{ kind: 'attachment', ref: effect.templateId }];
    default:
      return [];
  }
}

// ─── Sweep ───────────────────────────────────────────────────────────

/**
 * Sweep a template pool for card grants naming content that does not exist.
 *
 * Fail-soft in shape (returns a report, never throws) so a caller can decide
 * whether a dead ref is fatal. The test that owns this gate treats it as fatal.
 */
export function validateNudgeGrantRefs(
  templates: readonly UnifiedActionTemplate[],
): NudgeGrantLivenessReport {
  const live = buildLiveIndex();
  const dead: DeadNudgeGrantRef[] = [];
  let checkedRefs = 0;
  let cardsWithGrants = 0;

  for (const template of templates) {
    const steps = template.steps ?? [];
    for (let stepIndex = 0; stepIndex < steps.length; stepIndex++) {
      const step = steps[stepIndex];
      // Branch nodes carry no nudges — skipping them is correct, not a gap.
      if (isActionStepBranch(step)) continue;
      for (const nudge of step.nudges ?? []) {
        if (!nudge.grants || nudge.grants.length === 0) continue;
        cardsWithGrants++;
        for (const effect of nudge.grants) {
          for (const { kind, ref } of refsForEffect(effect)) {
            checkedRefs++;
            if (live[kind].has(ref)) continue;
            dead.push({
              templateId: template.id,
              stepIndex,
              nudgeId: nudge.id,
              effectKind: effect.kind,
              refKind: kind,
              ref,
            });
          }
        }
      }
    }
  }

  return { checkedRefs, cardsWithGrants, dead };
}

/** One line per dead ref, for a test failure message or a CLI report. */
export function formatDeadNudgeGrantRefs(dead: readonly DeadNudgeGrantRef[]): string {
  return dead
    .map((d) =>
      `${d.templateId} step ${d.stepIndex} card '${d.nudgeId}' `
      + `${d.effectKind} → unknown ${d.refKind} '${d.ref}'`)
    .join('\n');
}
