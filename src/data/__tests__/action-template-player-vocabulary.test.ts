/**
 * THR-1085 — an action card never speaks engine or backlog to the player.
 *
 * `UnifiedActionTemplate`'s prose fields render on the action card and in the
 * Codex, so they are read by a player, not by us. Two kinds of word leak into
 * them and both were found in shipped content:
 *
 *   • an engine identifier — a graph edge type, actor type id, effect kind, or
 *     any bare `snake_case` token. `divine.relay.compose_a_clue` told the player
 *     the agent "gains a knows_clue_of edge": the graph shape, not the knowledge.
 *   • development status — a version marker, a deferral, a follow-up note.
 *     `loc.awaken_spirit` narrated its own backlog ("v1 …; spawning the embodied
 *     place_spirit actor is filed as a follow-up"), handing a player a release note.
 *
 * The ticket asked for a predicate sweep rather than its own two-item list, and
 * this is that predicate. Per Law 14 the fix is always in the vocabulary, never a
 * renderer-side scrub — the surface prints what the template holds (THR-1051's
 * ruling, reaffirmed by THR-1085).
 *
 * `technicalEffect` is deliberately NOT swept. It is the design-reference field
 * that `public/action-catalog.html` renders for us, and naming constants and
 * graph-ops is its whole job; THR-1085's predicate names the player-facing
 * fields only. Sweeping it would report ~15 entries doing exactly what they
 * should and train the next reader to silence the gate.
 */

import { describe, it, expect } from 'vitest';
import { UNIFIED_ACTION_TEMPLATES } from '../unified-action-templates';

/** Prose keys a player reads, by the object that holds them. */
const TEMPLATE_PROSE_KEYS = ['description', 'name', 'spellName'] as const;
const NARRATIVE_PROSE_KEYS = ['success', 'failure', 'initiation'] as const;
const CONTROL_PROSE_KEYS = ['established', 'active', 'lapsed', 'destroyed', 'usurped'] as const;

/**
 * Enrichment placeholder and conditional-block syntax — `{name}`, `{cast:patron}`,
 * `{?has_faction}…{/has_faction}`. These carry `snake_case` on purpose and the
 * player never sees a character of them: `enrichProse()` resolves the whole span
 * before the string reaches a surface (systemic wiring guide, Capability 1).
 *
 * Stripped before scanning rather than exempted afterwards, because the leak this
 * file hunts can sit *inside* an enriched string, next to a legitimate placeholder.
 */
const ENRICHMENT_SYNTAX = /\{[^{}]*\}/g;

/**
 * A bare `snake_case` token — the shape every engine identifier takes here
 * (`knows_clue_of`, `place_spirit`, `recovered_doctrine`). Once the placeholder
 * spans are stripped, prose has no reason to contain one: an underscore never
 * appears in an English sentence we author.
 */
const ENGINE_IDENTIFIER = /\b[a-z][a-z0-9]*(?:_[a-z0-9]+)+\b/g;

/**
 * Development-status language: a statement about *our* progress, not the world's.
 *
 * Deliberately narrow, and the narrowness is load-bearing. The world's own prose
 * says "not yet", "for now", and "what is owed is deferred — not forgiven", all
 * of which are good sentences about the world; a flat lexicon flagged the last of
 * those and would have taught the next reader to silence this gate. Only phrasings
 * that can *only* be about the backlog are members.
 */
const DEV_STATUS = [
  /\bv[0-9]+\b/i,
  /\bnot yet wired\b/i,
  /\bnot yet implemented\b/i,
  /\bTODO\b/,
  /\bas a follow-up\b/i,
  /\bplaceholder\b/i,
  /\bunimplemented\b/i,
];

interface ProseEntry {
  templateId: string;
  field: string;
  text: string;
}

/** Every player-facing string in the catalog, tagged with where it came from. */
function collectPlayerProse(): ProseEntry[] {
  const entries: ProseEntry[] = [];

  for (const template of UNIFIED_ACTION_TEMPLATES) {
    const id = template.id;
    // Read by key rather than by field, so a prose field added later is picked up
    // by adding its name to the lists above and nothing else.
    const fields = template as unknown as Record<string, unknown>;

    for (const key of TEMPLATE_PROSE_KEYS) {
      const value = fields[key];
      if (typeof value === 'string') entries.push({ templateId: id, field: key, text: value });
    }

    const narrative = fields.narrativeTemplates;
    if (narrative && typeof narrative === 'object') {
      for (const key of NARRATIVE_PROSE_KEYS) {
        const value = (narrative as Record<string, unknown>)[key];
        if (typeof value === 'string') {
          entries.push({ templateId: id, field: `narrativeTemplates.${key}`, text: value });
        }
      }
    }

    const control = fields.controlSpec;
    const controlNarrative =
      control && typeof control === 'object'
        ? (control as Record<string, unknown>).narrativeTemplates
        : undefined;
    if (controlNarrative && typeof controlNarrative === 'object') {
      for (const key of CONTROL_PROSE_KEYS) {
        const value = (controlNarrative as Record<string, unknown>)[key];
        if (typeof value === 'string') {
          entries.push({
            templateId: id,
            field: `controlSpec.narrativeTemplates.${key}`,
            text: value,
          });
        }
      }
    }
  }

  return entries;
}

describe('THR-1085 — action-template prose speaks the world, not the engine', () => {
  const prose = collectPlayerProse();

  it('sweeps a non-empty corpus (guards against a vacuous pass)', () => {
    // A predicate that finds nothing because it collected nothing is the failure
    // mode this whole file exists to avoid.
    expect(prose.length).toBeGreaterThan(400);
    expect(new Set(prose.map((entry) => entry.templateId)).size).toBeGreaterThan(100);
  });

  it('names no engine identifier', () => {
    const offenders = prose.flatMap((entry) => {
      const hits = entry.text.replace(ENRICHMENT_SYNTAX, ' ').match(ENGINE_IDENTIFIER) ?? [];
      return hits.map((hit) => `${entry.templateId} · ${entry.field} · "${hit}"`);
    });

    expect(offenders).toEqual([]);
  });

  it('still sees an identifier that sits beside a legitimate placeholder', () => {
    // Falsifies the strip: if ENRICHMENT_SYNTAX ever widened to swallow whole
    // strings, both assertions above would pass vacuously on any content at all.
    const planted = '{name} gains a knows_clue_of edge in {location}.';
    expect(planted.replace(ENRICHMENT_SYNTAX, ' ').match(ENGINE_IDENTIFIER)).toEqual([
      'knows_clue_of',
    ]);
  });

  it('narrates no development status', () => {
    const offenders = prose
      .filter((entry) => DEV_STATUS.some((pattern) => pattern.test(entry.text)))
      .map((entry) => `${entry.templateId} · ${entry.field}`);

    expect(offenders).toEqual([]);
  });
});
