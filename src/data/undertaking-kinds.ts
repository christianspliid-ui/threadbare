// src/data/undertaking-kinds.ts
//
// The undertaking kind registry (THR-1297 §1; grammar verdict THR-1281 §1/§2).
//
// A kind row is the CRUD closure for one kind of work: what builds it, what changes
// it, and — non-negotiably — what can undo it. The registry is data the engine reads
// for naming, holdings and (doc 6) the factory gates. Candidate generation continues
// to run off the packs: a row does not make a verb offerable, it declares what the
// verb *builds* and how the world can take it back.
//
// NFP #1 (Tunability): every row is data; adding a kind is a row, not a code path.
// NFP #2 (Inspectability): `validateKindRegistry` returns named problems, not a boolean.
// NFP #4 (Fail-soft): lookups return `undefined`; a bad row is a build-time failure
//   (the schema test), never a runtime throw.

import type {
  StrategicActionTemplate,
  UndertakingKindId,
  UndertakingKindRow,
} from '../types/strategicAction';
import { MOTIVE_GATE_KINDS } from './strategic-action-constants';

// ─── The registry ───────────────────────────────────────────────────

/**
 * The authored kind rows.
 *
 * **Tier 1 in slice 5 — five kinds, each shipped with its counter-play in the same
 * commit.** Slice 2 registered this array empty on purpose: a row must name at least
 * one destroy template and every destroy must carry a motive gate, and the corpus at
 * that point held exactly one `destroy` verb in 43 (`strategic_raid_supply_lines`, a
 * raid rather than any kind's undoing). Registering rows against create verbs would
 * have been the vacuous satisfaction the plan names as a kill criterion. So the rows
 * waited for their destroys, and arrive with them.
 *
 * The consequence, stated plainly then and honoured here: **until a kind can be undone,
 * it is not a kind.** Every row below names a real, reachable, motive-gated counter-play.
 *
 * Tiers 2 and 3 (sublocation, place-tier location, trade route, warband, faction) land
 * with their own destroys in the T2/T3 issues filed from this plan. They are absent
 * rather than stubbed for the same reason the array was empty before.
 */
export const UNDERTAKING_KIND_ROWS: readonly UndertakingKindRow[] = [
  {
    kindId: 'intelligence_cache',
    tier: 1,
    displayName: 'Intelligence cache',
    objectShape: "actor-side `strategicIntelligence` record plus `knows_of` familiarity",
    // Its own economy: what a scholar knows is not ground, and the holdings system is
    // about ground and organisations.
    ownable: false,
    createTemplateIds: [
      'strategic_research_archive',
      'strategic_investigate_anomaly',
      'strategic_mount_expedition',
    ],
    updateTemplateIds: ['strategic_write_treatise'],
    destroyTemplateIds: ['strategic_expose_cache'],
    lexicon: 'cache',
  },
  {
    kindId: 'leverage_mark',
    tier: 1,
    displayName: 'Leverage mark',
    objectShape: '`knows_secret_of` edge (Secrets & Favors)',
    ownable: false,
    createTemplateIds: ['strategic_cultivate_informant'],
    // Press and burn are both *uses* of a held mark, not counter-play against it — the
    // D column is what the **world** can do to take a work back. Burn is authored
    // `verb: 'change'` for the reason recorded at its template: the corpus invariant
    // that no destroy verb ships ungated is worth more than the taxonomic neatness of
    // calling a self-spend a destroy.
    updateTemplateIds: ['strategic_press_the_mark', 'strategic_burn_the_mark'],
    destroyTemplateIds: ['strategic_expose_mark'],
    lexicon: 'mark',
  },
  {
    kindId: 'masterwork_item',
    tier: 1,
    displayName: 'Masterwork',
    objectShape: '`artifact` node held by `possesses` — already an attachment',
    // Carried on `possesses`, not the `holding` category. A hammer is not ground.
    ownable: false,
    createTemplateIds: ['strategic_craft_masterwork'],
    updateTemplateIds: ['strategic_improve_masterwork'],
    destroyTemplateIds: ['strategic_destroy_masterwork'],
    lexicon: 'item',
  },
  {
    kindId: 'chart_find',
    tier: 1,
    displayName: 'Chart',
    objectShape: 'treasure-map possession plus `knows_clue_of` / `knows_of` edges',
    ownable: false,
    createTemplateIds: ['strategic_chart_the_wilds'],
    updateTemplateIds: ['strategic_follow_the_chart', 'strategic_walk_the_unmapped'],
    destroyTemplateIds: ['strategic_burn_the_charts'],
    lexicon: 'chart',
  },
  {
    kindId: 'network',
    tier: 1,
    displayName: 'Network',
    objectShape: 'actor-side network record with `member_of` contacts',
    // Commanded, not held — the distinction slice 3's `owns` edge exists to keep.
    ownable: false,
    createTemplateIds: ['strategic_establish_spy_network'],
    updateTemplateIds: ['strategic_extend_reach'],
    destroyTemplateIds: ['strategic_sever_network'],
    lexicon: 'network',
  },
];

const ROWS_BY_KIND = new Map<UndertakingKindId, UndertakingKindRow>(
  UNDERTAKING_KIND_ROWS.map(row => [row.kindId, row]),
);

/** The kind a template belongs to, in whichever CRUD role it plays. */
const KIND_BY_TEMPLATE_ID = new Map<string, UndertakingKindId>();
for (const row of UNDERTAKING_KIND_ROWS) {
  for (const id of [...row.createTemplateIds, ...row.updateTemplateIds, ...row.destroyTemplateIds]) {
    KIND_BY_TEMPLATE_ID.set(id, row.kindId);
  }
}

export function getUndertakingKindRow(kindId: UndertakingKindId): UndertakingKindRow | undefined {
  return ROWS_BY_KIND.get(kindId);
}

export function getUndertakingKindForTemplate(templateId: string): UndertakingKindId | undefined {
  return KIND_BY_TEMPLATE_ID.get(templateId);
}

/** Every registered row, in authoring order. */
export function getAllUndertakingKindRows(): readonly UndertakingKindRow[] {
  return UNDERTAKING_KIND_ROWS;
}

/** Whether the template is a destroy verb of some registered kind. */
export function isKindDestroyTemplate(templateId: string): boolean {
  return UNDERTAKING_KIND_ROWS.some(row => row.destroyTemplateIds.includes(templateId));
}

// ─── The no-destroy-no-kind gate ────────────────────────────────────

export type KindRegistryProblemCode =
  /** The row named no destroy template at all. */
  | 'no_destroy'
  /** A named template id resolves to nothing in the template registry. */
  | 'unreachable_template'
  /** A destroy template resolves, but carries no `motiveGate`. */
  | 'destroy_without_motive_gate'
  /** A destroy template's `motiveGate` names something outside `MOTIVE_GATE_KINDS`. */
  | 'unknown_motive'
  /** A destroy template resolves, but is not a `destroy` verb. */
  | 'destroy_role_verb_mismatch'
  /** Two rows claim the same `kindId`. */
  | 'duplicate_kind';

export interface KindRegistryProblem {
  readonly code: KindRegistryProblemCode;
  readonly kindId: UndertakingKindId;
  /** The offending template id, when the problem is about one. */
  readonly templateId?: string;
  readonly detail: string;
}

/**
 * Validate the registry against a template resolver.
 *
 * **Resolves reachability, not presence** — the distinction the plan names as a kill
 * criterion. A row that lists `destroyTemplateIds: ['strategic_raze_the_thing']` for a
 * template nobody implements has *presence* of a destroy id and no counter-play at all;
 * this returns `unreachable_template` for it. Likewise a destroy id that resolves to a
 * `create` verb, or to a template with no motive gate, is caught rather than counted.
 *
 * Takes the resolver as a parameter rather than importing the pack registry so the
 * schema test can drive it with adversarial fixtures — a validator that can only be
 * run against the (currently empty) live registry could never be shown to reject
 * anything, which is how a gate becomes a comment.
 *
 * @param rows - the rows to check
 * @param resolveTemplate - template-id → template, or `undefined` if unreachable
 * @returns every problem found, in row order; empty means the registry is sound
 */
export function validateKindRegistry(
  rows: readonly UndertakingKindRow[],
  resolveTemplate: (id: string) => StrategicActionTemplate | undefined,
): readonly KindRegistryProblem[] {
  const problems: KindRegistryProblem[] = [];
  const seenKinds = new Set<UndertakingKindId>();
  const knownMotives = new Set<string>(MOTIVE_GATE_KINDS);

  for (const row of rows) {
    if (seenKinds.has(row.kindId)) {
      problems.push({
        code: 'duplicate_kind',
        kindId: row.kindId,
        detail: `kind '${row.kindId}' is registered more than once`,
      });
    }
    seenKinds.add(row.kindId);

    // Every named id must resolve, whatever its CRUD role — an unreachable create or
    // update is as much an authoring error as an unreachable destroy, it just is not
    // the one that fakes counter-play.
    for (const templateId of [
      ...row.createTemplateIds,
      ...row.updateTemplateIds,
      ...row.destroyTemplateIds,
    ]) {
      if (!resolveTemplate(templateId)) {
        problems.push({
          code: 'unreachable_template',
          kindId: row.kindId,
          templateId,
          detail: `'${templateId}' does not resolve in the template registry`,
        });
      }
    }

    if (row.destroyTemplateIds.length === 0) {
      problems.push({
        code: 'no_destroy',
        kindId: row.kindId,
        detail: `kind '${row.kindId}' names no destroy template — a kind that cannot be undone is not a kind`,
      });
      continue;
    }

    for (const templateId of row.destroyTemplateIds) {
      const template = resolveTemplate(templateId);
      if (!template) continue; // already reported as unreachable above

      if (template.verb !== 'destroy') {
        problems.push({
          code: 'destroy_role_verb_mismatch',
          kindId: row.kindId,
          templateId,
          detail: `'${templateId}' is listed as counter-play but its verb is '${template.verb}'`,
        });
      }

      const gate = template.motiveGate;
      if (!gate || gate.length === 0) {
        problems.push({
          code: 'destroy_without_motive_gate',
          kindId: row.kindId,
          templateId,
          detail: `'${templateId}' is a kind's counter-play with no motiveGate — motiveless demolition`,
        });
        continue;
      }

      for (const motive of gate) {
        if (!knownMotives.has(motive)) {
          problems.push({
            code: 'unknown_motive',
            kindId: row.kindId,
            templateId,
            detail: `'${templateId}' names motive '${motive}', which is not in MOTIVE_GATE_KINDS`,
          });
        }
      }
    }
  }

  return problems;
}
