/**
 * THR-1459 — the corpus half of the Gate Duty `{cast:*}` leak.
 *
 * The defect that motivated this: Gate Duty's ending rendered
 * `{cast:suspect_courier}` verbatim in a `future_hook` change detail and in a
 * reaction card's intent. The token was *declared* correctly; the bespoke stage
 * adapter simply never ran those two strings through `enrichProse`.
 *
 * Two different things can break here, and they need two different guards:
 *
 * 1. **The render path** — a surface that forgets to enrich. Locked in
 *    `components/Game/encounter-stage/__tests__/buildGateDutyEncounterStageModel.test.ts`,
 *    because only a surface test can catch a surface that skips the enricher.
 * 2. **The authoring** — a `{cast:<key>}` naming a key the template never
 *    declares. That one is corpus-wide and belongs here.
 *
 * This file owns (2), and deliberately sweeps *every registered template's*
 * authored aftermath prose rather than the five files the ticket's grep happened
 * to list. A file list is a snapshot that rots the moment someone authors a sixth;
 * the membership predicate — "an authored aftermath string containing a cast
 * token" — does not.
 *
 * Why declaration is sufficient for "resolves": `proseEnrichment` guarantees that
 * every key a template declares enters the cast context bound or unbound (bound
 * name, else the spec's authored `spawnName`), so a declared key always renders a
 * name. An *undeclared* key strips to an empty string, which is a hole in the
 * sentence — silent, and exactly what this sweep is for.
 */

import { describe, expect, it } from 'vitest';
import {
  UNIFIED_ACTION_TEMPLATES,
  LOCATION_BRANCHING_ENCOUNTER_TEMPLATES,
} from '../unified-action-templates';
import { ENCOUNTER_TEMPLATES } from '../encounter-content';
import type {
  AftermathVariant,
  UnifiedActionTemplate,
} from '../../types/unifiedAction';

/** `{cast:<key>}` — the same key grammar `enrichProse` matches. */
const CAST_TOKEN = /\{cast:([A-Za-z0-9_.-]+)\}/g;

/** One authored string, carrying enough provenance to name it in a failure. */
interface AuthoredString {
  readonly templateId: string;
  readonly where: string;
  readonly text: string;
}

/**
 * Every player-facing string an aftermath variant authors.
 *
 * Covers the banded overrides too (`byOutcome`, THR-969): a band restates only
 * what differs, so a token can live in a band override that the un-banded variant
 * never carries — and a sweep that read only the base variant would not see it.
 */
function variantStrings(
  templateId: string,
  variantKey: string,
  variant: AftermathVariant,
): AuthoredString[] {
  const out: AuthoredString[] = [];
  const push = (where: string, text: string | undefined) => {
    if (typeof text === 'string' && text.length > 0) out.push({ templateId, where, text });
  };

  push(`${variantKey}.overview`, variant.overview);
  push(`${variantKey}.reactionPrompt`, variant.reactionPrompt);
  variant.changes?.forEach((change, i) => {
    push(`${variantKey}.changes[${i}].title`, change.title);
    push(`${variantKey}.changes[${i}].detail`, change.detail);
  });
  variant.reactions?.forEach((reaction, i) => {
    push(`${variantKey}.reactions[${i}].label`, reaction.label);
    push(`${variantKey}.reactions[${i}].intent`, reaction.intent);
  });

  for (const [band, override] of Object.entries(variant.byOutcome ?? {})) {
    if (!override) continue;
    const bandKey = `${variantKey}.byOutcome.${band}`;
    push(`${bandKey}.overview`, override.overview);
    push(`${bandKey}.reactionPrompt`, override.reactionPrompt);
    override.changes?.forEach((change, i) => {
      push(`${bandKey}.changes[${i}].title`, change.title);
      push(`${bandKey}.changes[${i}].detail`, change.detail);
    });
    override.reactions?.forEach((reaction, i) => {
      push(`${bandKey}.reactions[${i}].label`, reaction.label);
      push(`${bandKey}.reactions[${i}].intent`, reaction.intent);
    });
  }

  return out;
}

function authoredAftermathStrings(template: UnifiedActionTemplate): AuthoredString[] {
  const config = template.aftermathConfig;
  if (!config) return [];
  const out: AuthoredString[] = [];
  if (config.fallback) out.push(...variantStrings(template.id, 'fallback', config.fallback));
  for (const [choiceId, variant] of Object.entries(config.variants ?? {})) {
    if (variant) out.push(...variantStrings(template.id, `variants[${choiceId}]`, variant));
  }
  return out;
}

/**
 * Every template any surface can render an aftermath for, de-duplicated by id.
 *
 * Three registries rather than one because the corpus genuinely lives in three:
 * the main pool, the location-branching encounters authored under
 * `src/data/encounters/`, and the faction/social encounter content. A template
 * present in more than one is the same object; the id set collapses it.
 */
function allTemplates(): UnifiedActionTemplate[] {
  const byId = new Map<string, UnifiedActionTemplate>();
  for (const t of [
    ...UNIFIED_ACTION_TEMPLATES,
    ...LOCATION_BRANCHING_ENCOUNTER_TEMPLATES,
    ...ENCOUNTER_TEMPLATES,
  ]) {
    if (!byId.has(t.id)) byId.set(t.id, t);
  }
  return [...byId.values()];
}

interface CastReference extends AuthoredString {
  readonly key: string;
}

function castReferences(): CastReference[] {
  const out: CastReference[] = [];
  for (const template of allTemplates()) {
    for (const authored of authoredAftermathStrings(template)) {
      for (const match of authored.text.matchAll(CAST_TOKEN)) {
        out.push({ ...authored, key: match[1]! });
      }
    }
  }
  return out;
}

function declaredKeys(templateId: string): Set<string> {
  const template = allTemplates().find(t => t.id === templateId);
  return new Set((template?.supportBundle ?? []).map(spec => spec.key));
}

describe('THR-1459 — authored aftermath prose never references an undeclared cast key', () => {
  /**
   * Anti-vacuity (the trap this whole file would otherwise fall into).
   *
   * Every assertion below is a `for` loop over `castReferences()`. If the
   * collector silently returned nothing — a renamed registry export, an
   * `aftermathConfig` shape change, a regex that stopped matching — every one of
   * those loops would pass while testing nothing at all. So the population is
   * asserted first, and asserted to span more than the one template that
   * motivated the ticket: a guard that only ever sees Gate Duty is a Gate Duty
   * test wearing a corpus sweep's name.
   */
  it('finds cast tokens in authored aftermath prose across more than one template', () => {
    const refs = castReferences();
    expect(refs.length).toBeGreaterThan(0);

    const templateIds = new Set(refs.map(r => r.templateId));
    expect(templateIds.size).toBeGreaterThan(1);

    // The motivating case must be in the swept population, by id and by key —
    // otherwise a future refactor could drop Gate Duty from the corpus and this
    // file would go on passing over whatever remained.
    expect(templateIds.has('cg.quest.gate_duty')).toBe(true);
    expect(
      refs.some(r => r.templateId === 'cg.quest.gate_duty' && r.key === 'suspect_courier'),
    ).toBe(true);
  });

  it('resolves every referenced key against its own template support bundle', () => {
    const failures: string[] = [];
    for (const ref of castReferences()) {
      if (!declaredKeys(ref.templateId).has(ref.key)) {
        failures.push(
          `${ref.templateId} ${ref.where} references {cast:${ref.key}}, ` +
            `which its supportBundle does not declare — the token will strip to nothing.`,
        );
      }
    }
    expect(failures).toEqual([]);
  });

  /**
   * The falsification arm for the rule above.
   *
   * Without it, `declaredKeys` returning an over-broad set (every key in the
   * corpus, say, or a set built from the wrong template) would make the previous
   * test unfalsifiable. An invented key must be rejected *by the same lookup the
   * real assertion uses*, on the template that actually motivated the sweep.
   */
  it('rejects an undeclared key — the lookup is discriminating, not permissive', () => {
    const keys = declaredKeys('cg.quest.gate_duty');
    expect(keys.has('suspect_courier')).toBe(true);
    expect(keys.has('suspect_courier_typo')).toBe(false);
  });
});
