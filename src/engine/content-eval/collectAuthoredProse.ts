// Authored-content prose collector (THR-490).
//
// Pure, deterministic sweep over the static authored-content tables that
// produces `EvalInput[]` for the prose-quality scorer. No GameState, no tick
// loop, no PRNG — same content library → same corpus, always.
//
// This is the read-side companion to `scoreProseBatch`: the DebugPanel "Prose
// QA" tab and the `__DEBUG.proseQualityReport()` bridge both call
// `collectAuthoredProse()` then hand the result to the scorer. It authors no
// content; it only makes the existing library legible to the scorer.
//
// Each table sweep is isolated in try/catch so a single malformed/renamed table
// degrades to one visible `error`-band entry rather than throwing into the UI
// (NFP #4 fail-soft).

import type { EvalInput } from './proseQualityScore';
import type { RegisterKind } from './registerCompliance';
import type { GraphNode } from '../../types/graph';
import {
  UNIFIED_ACTION_TEMPLATES,
  LOCATION_BRANCHING_ENCOUNTER_TEMPLATES,
} from '../../data/unified-action-templates';
import type { UnifiedActionTemplate } from '../../types/unifiedAction';
import { SOCIAL_SCENE_TEMPLATES } from '../../data/social-scene-templates';
import { SPELL_TEMPLATES } from '../../data/spell-templates';
import { OMEN_TEMPLATES } from '../../data/omenTemplates';
import { STARTER_POSSESSIONS, STARTER_CONDITIONS } from '../../data/starter-attachments';
import {
  REWARD_POSSESSIONS,
  REWARD_CONDITIONS,
  REWARD_BESTOWED_POWERS,
} from '../../data/reward-attachment-catalog';

// ---------------------------------------------------------------------------
// Field-extraction helpers
// ---------------------------------------------------------------------------

/** Add a prose field only when `value` is a present, non-blank string. Keeps
 *  the corpus free of empty fields (the scorer skips empties anyway, but this
 *  keeps the EvalInput.fields map honest about what was actually authored). */
function addField(fields: Record<string, string>, key: string, value: unknown): void {
  if (typeof value === 'string' && value.trim().length > 0) {
    fields[key] = value;
  }
}

/** Read a string property from a loosely-typed graph-node property bag. */
function readProp(props: unknown, key: string): unknown {
  if (props && typeof props === 'object') {
    return (props as Record<string, unknown>)[key];
  }
  return undefined;
}

/** Synthetic entry surfaced when a table sweep throws, so the miss is visible
 *  in the report instead of silently dropping content (NFP #4). */
function collectErrorEntry(table: string, err: unknown): EvalInput {
  const message = err instanceof Error ? err.message : String(err);
  return {
    entryId: `${table}::collect-error`,
    contentType: 'meta',
    fields: { detail: `collector failed for ${table}: ${message}` },
  };
}

// ---------------------------------------------------------------------------
// Per-field register declarations (THR-609)
// ---------------------------------------------------------------------------
//
// Canon (Docs/canon/prose.md § the register model) designates a small set of
// surfaces as *peak* register — rationed lyricism, scored under the peak
// thresholds instead of the plainspoken baseline. Everything else defaults to
// baseline. Keys are matched by field base name (the part before any
// `.choiceId` suffix), so declaring `aftermath` covers every `aftermath.<id>`
// and `aftermath.fallback` field the encounter collector emits.
//
// Only unambiguous canon peak surfaces are declared here. Outcome prose
// (success/failure/contested) stays baseline by default: plain is the rule, and
// leaving a genuinely-drifted outcome line at baseline surfaces it for rewrite
// rather than hiding it under peak tolerances.

/** Encounter fields scored under peak register: the major aftermath beats
 *  (chronicler-voice overviews), a canon peak surface. */
const ENCOUNTER_FIELD_REGISTERS: Readonly<Record<string, RegisterKind>> = {
  aftermath: 'peak',
};

// ---------------------------------------------------------------------------
// Per-table collectors
// ---------------------------------------------------------------------------

/** Encounter templates — the primary authored-prose surface. Sweeps both the
 *  unified pool and the location-branching pool. */
function collectEncounters(): EvalInput[] {
  const templates: readonly UnifiedActionTemplate[] = [
    ...UNIFIED_ACTION_TEMPLATES,
    ...LOCATION_BRANCHING_ENCOUNTER_TEMPLATES,
  ];
  const entries: EvalInput[] = [];

  for (const t of templates) {
    const fields: Record<string, string> = {};

    addField(fields, 'name', t.name);
    addField(fields, 'description', t.description);
    addField(fields, 'narrative', t.narrativeTemplates?.initiation);
    addField(fields, 'success', t.narrativeTemplates?.success);
    addField(fields, 'failure', t.narrativeTemplates?.failure);
    addField(fields, 'contested', t.narrativeTemplates?.contested);
    addField(fields, 'consequenceSuccess', t.consequenceMessage?.success);
    addField(fields, 'consequenceFailure', t.consequenceMessage?.failure);

    // Authored choice cards (per-step map): intent is the enriched prose body.
    for (const stepChoices of Object.values(t.authoredChoices ?? {})) {
      for (const choice of stepChoices ?? []) {
        // Prefix the choice id so multiple choices don't overwrite each other.
        addField(fields, `intent.${choice.id}`, choice.intent);
        addField(fields, `likelyBurden.${choice.id}`, choice.likelyBurden);
      }
    }

    // Context fragments (THR-573) — every authored variant is swept individually so
    // multiplied surfaces clear the same register bar as inline prose. Fragment tables
    // are statically enumerable, which is what makes this sweep possible at all;
    // without it the multiplied library would be invisible to Prose QA.
    for (const set of t.contextFragments ?? []) {
      for (const [axisValue, text] of Object.entries(set.variants ?? {})) {
        addField(fields, `frag.${set.slot}.${axisValue}`, text);
      }
    }

    // Branch-aware aftermath overviews (chronicler voice).
    if (t.aftermathConfig) {
      for (const [choiceId, variant] of Object.entries(t.aftermathConfig.variants ?? {})) {
        addField(fields, `aftermath.${choiceId}`, variant?.overview);
      }
      addField(fields, 'aftermath.fallback', t.aftermathConfig.fallback?.overview);
    }

    if (Object.keys(fields).length === 0) continue;
    entries.push({
      entryId: t.id,
      contentType: 'encounter',
      marquee: typeof t.rarityTier === 'number' && t.rarityTier >= 3,
      fields,
      fieldRegisters: ENCOUNTER_FIELD_REGISTERS,
    });
  }

  return entries;
}

/**
 * Context fragments on the social-scene pool (THR-573).
 *
 * Social scenes are generated per-agent rather than registered in
 * `UNIFIED_ACTION_TEMPLATES`, so `collectEncounters` never reaches them. This collector
 * emits **only** their fragment variants — deliberately not their step/outcome prose,
 * which has never been in the QA corpus and is not this ticket's scope to add. Every
 * multiplied surface therefore clears the same register bar as inline prose, while the
 * corpus grows by exactly the authored fragments.
 */
function collectSocialSceneFragments(): EvalInput[] {
  const entries: EvalInput[] = [];
  for (const t of SOCIAL_SCENE_TEMPLATES) {
    if (!t.contextFragments || t.contextFragments.length === 0) continue;
    const fields: Record<string, string> = {};
    for (const set of t.contextFragments) {
      for (const [axisValue, text] of Object.entries(set.variants ?? {})) {
        addField(fields, `frag.${set.slot}.${axisValue}`, text);
      }
    }
    if (Object.keys(fields).length === 0) continue;
    entries.push({
      entryId: `${t.id}#fragments`,
      contentType: 'encounter',
      fields,
    });
  }
  return entries;
}

/** Spell flavor + backlash prose. `mechanicalSummary` is intentionally numeric
 *  and is deliberately excluded. */
function collectSpells(): EvalInput[] {
  return SPELL_TEMPLATES.map((s) => {
    const fields: Record<string, string> = {};
    addField(fields, 'name', s.name);
    addField(fields, 'flavor', s.flavorText);
    addField(fields, 'narrativeTemplate', s.backlash?.narrativeTemplate);
    return { entryId: s.id, contentType: 'spell', fields };
  }).filter((e) => Object.keys(e.fields).length > 0);
}

/** Omen tagline + atmosphere vocabulary + per-beat prose. */
function collectOmens(): EvalInput[] {
  return OMEN_TEMPLATES.map((o) => {
    const fields: Record<string, string> = {};
    addField(fields, 'name', o.name);
    addField(fields, 'description', o.tagline);
    const atmosphere = o.vocabulary?.atmosphere;
    if (Array.isArray(atmosphere) && atmosphere.length > 0) {
      addField(fields, 'narrative', atmosphere.join(' '));
    }
    const beatProse = (o.beats ?? []).flatMap((b) => b.prose ?? []);
    if (beatProse.length > 0) {
      addField(fields, 'prose', beatProse.join(' '));
    }
    return { entryId: o.id, contentType: 'omen', fields };
  }).filter((e) => Object.keys(e.fields).length > 0);
}

/** GraphNode-backed attachment/condition tables share a property-bag shape:
 *  `name` on the node, `description`/`flavorText` in `properties`. */
function collectGraphNodes(nodes: readonly GraphNode[], contentType: string): EvalInput[] {
  const entries: EvalInput[] = [];
  for (const node of nodes) {
    const fields: Record<string, string> = {};
    addField(fields, 'name', node.name);
    addField(fields, 'description', readProp(node.properties, 'description'));
    // Item flavor is often static lore by design; keep it under `flavorText`
    // (not the dynamic `flavor` key) so it is voice/exclusion-checked but not
    // penalised for lacking enrichment placeholders.
    addField(fields, 'flavorText', readProp(node.properties, 'flavorText'));
    if (Object.keys(fields).length === 0) continue;
    const tier = readProp(node.properties, 'tier');
    entries.push({
      entryId: node.id,
      contentType,
      marquee: typeof tier === 'number' && tier >= 3,
      fields,
    });
  }
  return entries;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** One collector per authored table; each is fail-soft-isolated below. */
const TABLE_COLLECTORS: ReadonlyArray<{ table: string; run: () => EvalInput[] }> = [
  { table: 'encounters', run: collectEncounters },
  { table: 'socialSceneFragments', run: collectSocialSceneFragments },
  { table: 'spells', run: collectSpells },
  { table: 'omens', run: collectOmens },
  { table: 'possessions', run: () => collectGraphNodes([...STARTER_POSSESSIONS, ...REWARD_POSSESSIONS, ...REWARD_BESTOWED_POWERS], 'attachment') },
  { table: 'conditions', run: () => collectGraphNodes([...STARTER_CONDITIONS, ...REWARD_CONDITIONS], 'condition') },
];

/**
 * Sweep every authored-content table and return the flattened `EvalInput[]`
 * corpus for the prose-quality scorer. Pure and deterministic. A table that
 * throws contributes a single visible `error`-band entry rather than aborting
 * the whole sweep.
 */
export function collectAuthoredProse(): EvalInput[] {
  const corpus: EvalInput[] = [];
  // Dedupe by entryId — the same template can be referenced from more than one
  // array (e.g. a branching encounter lives in both the unified pool and
  // LOCATION_BRANCHING_ENCOUNTER_TEMPLATES). First occurrence wins, so ids stay
  // globally unique (a requirement for stable React keys downstream).
  const seen = new Set<string>();
  for (const { table, run } of TABLE_COLLECTORS) {
    try {
      for (const entry of run()) {
        if (seen.has(entry.entryId)) continue;
        seen.add(entry.entryId);
        corpus.push(entry);
      }
    } catch (err) {
      corpus.push(collectErrorEntry(table, err));
    }
  }
  return corpus;
}
