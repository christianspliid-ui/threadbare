/**
 * THR-1466 — an appositive `{cast:*}` needs a name to apposit.
 *
 * The defect: three of the five slice parents introduced their cast member with an
 * appositive — *"The keeper, {cast:bridge_keeper}, takes two coppers"* — and the
 * token resolved to a **title-form** name (`'The Keeper at the Crossing'`) that
 * restated the role the sentence had just given. On screen: *"The keeper, The
 * Keeper at the Crossing, takes two coppers."*
 *
 * ## Why this is a contract, not three typos
 *
 * `resolveSceneCastContext` renders `boundName ?? spec.spawnName` — so the string
 * the player reads is, when the key is unbound, exactly the authored `spawnName`.
 * The engine is faithful; the two sides simply disagreed about what a `spawnName`
 * is for. Seven of the eleven appositive sites in the corpus had it right all
 * along (`Bram Oskell`, `Sef Aldwin`, `Ilme Fenn`, `Idren Kall`, `Orin Vask`,
 * `Neven Arbeck`, `Soren Vance`), which is what settles the rule: **a personal
 * name is the house convention for cast spawn names**, and the four title-form
 * names in `vertical-slice.ts` were the outliers.
 *
 * So neither branch the ticket offered is what landed. Generating personal names
 * engine-side would override a deliberately authored `spawnName` and break the
 * THR-713 contract that an unbound key renders it byte-identically. Banning the
 * appositive corpus-wide would rewrite eleven sentences — seven of them correct —
 * to dodge four bad strings, and would delete a good prose form.
 *
 * **The rule, which is what this file enforces:** an appositive `{cast:*}` is
 * allowed exactly when that key's authored spawn name is a personal name. A cast
 * member who is *deliberately* anonymous — the crossroads stranger, whose spec
 * comment says the name "keeps the register of the scene, which never tells you
 * what he is" — keeps the title form, and its prose gives up the appositive
 * instead. Both sides stay expressive; only the collision is forbidden.
 *
 * ## What this gate can and cannot see
 *
 * It checks the **authored** name, because that is the one guaranteed to render:
 * a `reuseNpcRoles` bind may substitute a live NPC's name, which is itself a
 * personal name and reads correctly in the same slot. Authoring is the side that
 * can drift; binding is not.
 *
 * The collector deep-walks each template rather than naming prose fields, so a
 * newly authored prose field is swept the day it appears. A field list would be a
 * snapshot that rots the moment someone adds the twelfth place prose can live —
 * the same reasoning as the sibling sweep in `aftermathCastTokenCorpus.test.ts`,
 * whose aftermath-only collector this deliberately does not reuse (that file owns
 * "does the key resolve at all"; this one owns "does the name fit the sentence",
 * and they want different populations).
 */

import { describe, expect, it } from 'vitest';
import {
  UNIFIED_ACTION_TEMPLATES,
  LOCATION_BRANCHING_ENCOUNTER_TEMPLATES,
} from '../unified-action-templates';
import { ENCOUNTER_TEMPLATES } from '../encounter-content';
import type { UnifiedActionTemplate } from '../../types/unifiedAction';

/**
 * An appositive `{cast:*}`: the token wrapped in commas, preceded by a word.
 *
 * The leading `\w` matters — it is what distinguishes an appositive from a token
 * that merely happens to sit mid-list, and it is why a sentence-initial
 * `'{cast:stranger} waits under the dead tree'` is correctly not a match.
 */
const APPOSITIVE_CAST = /\w\s*,\s*\{cast:([A-Za-z0-9_.-]+)\}\s*,/g;

/** Any `{cast:*}`, appositive or not — the denominator for the vacuity guard. */
const ANY_CAST = /\{cast:([A-Za-z0-9_.-]+)\}/g;

/**
 * A name that restates a role rather than naming a person.
 *
 * The article is the whole tell, and it separates the corpus cleanly: every
 * personal name in it (`Hesta Ryle`, `Bram Oskell`, …) fails this, and every
 * title-form name (`The Keeper at the Crossing`, `The Caravan Master`,
 * `The Stranger at the Crossroads`, `The Paper-Seller`) matches it. Deliberately
 * kept dumb — a cleverer heuristic here would be a second thing to drift.
 */
const TITLE_FORM = /^(the|a|an)\s/i;

interface AuthoredString {
  readonly templateId: string;
  readonly where: string;
  readonly text: string;
}

/**
 * Every string anywhere in a template, with a JSON-ish path for the failure message.
 *
 * Cycles are impossible in these literals, but the `seen` set costs nothing and
 * makes the walk safe against a future template that shares a sub-object.
 */
function authoredStrings(template: UnifiedActionTemplate): AuthoredString[] {
  const out: AuthoredString[] = [];
  const seen = new Set<object>();

  const walk = (value: unknown, path: string): void => {
    if (typeof value === 'string') {
      if (value.length > 0) out.push({ templateId: template.id, where: path, text: value });
      return;
    }
    if (typeof value !== 'object' || value === null) return;
    if (seen.has(value)) return;
    seen.add(value);

    if (Array.isArray(value)) {
      value.forEach((item, i) => walk(item, `${path}[${i}]`));
      return;
    }
    for (const [key, item] of Object.entries(value)) walk(item, path ? `${path}.${key}` : key);
  };

  walk(template, '');
  return out;
}

/**
 * Every template any surface can render, de-duplicated by id.
 *
 * Three registries because the corpus genuinely lives in three; a template in
 * more than one is the same object and the id set collapses it.
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

/** The name `{cast:key}` renders when the key is unbound — the authored one. */
function authoredCastName(templateId: string, key: string): string | undefined {
  const spec = allTemplates()
    .find(t => t.id === templateId)
    ?.supportBundle?.find(s => s.key === key);
  if (!spec) return undefined;
  return spec.kind === 'actor' ? spec.spawnName : spec.fallbackName;
}

interface CastReference extends AuthoredString {
  readonly key: string;
}

function referencesMatching(pattern: RegExp): CastReference[] {
  const out: CastReference[] = [];
  for (const template of allTemplates()) {
    for (const authored of authoredStrings(template)) {
      // A fresh RegExp per string: `matchAll` on a shared /g literal is safe, but
      // a shared `lastIndex` across helpers is the classic way this rots.
      for (const match of authored.text.matchAll(new RegExp(pattern.source, pattern.flags))) {
        out.push({ ...authored, key: match[1]! });
      }
    }
  }
  return out;
}

describe('THR-1466 — an appositive {cast:*} resolves to a personal name', () => {
  /**
   * Anti-vacuity. Every assertion below loops over a collector; if the walk, the
   * registries, or the regex silently stopped matching, those loops would pass
   * while testing nothing. So the population is asserted first — and asserted to
   * span several templates, because a sweep that only ever sees `vertical-slice`
   * is a vertical-slice test wearing a corpus sweep's name.
   */
  it('finds appositive cast tokens across several templates', () => {
    const all = referencesMatching(ANY_CAST);
    expect(all.length).toBeGreaterThan(50);

    const appositives = referencesMatching(APPOSITIVE_CAST);
    expect(appositives.length).toBeGreaterThan(5);
    expect(new Set(appositives.map(r => r.templateId)).size).toBeGreaterThan(3);

    // The sites that motivated the ticket must be in the swept population, and
    // every one of them must resolve to a spec — otherwise this file could go on
    // passing over whatever survived a rename.
    for (const key of ['bridge_keeper', 'caravan_master']) {
      const ref = appositives.find(r => r.key === key);
      expect(ref, `appositive {cast:${key}} is no longer in the corpus`).toBeDefined();
      expect(authoredCastName(ref!.templateId, key)).toBeTruthy();
    }
  });

  it('no appositive cast token renders a title-form name', () => {
    const failures: string[] = [];
    for (const ref of referencesMatching(APPOSITIVE_CAST)) {
      const name = authoredCastName(ref.templateId, ref.key);
      if (name && TITLE_FORM.test(name)) {
        failures.push(
          `${ref.templateId} ${ref.where} uses {cast:${ref.key}} appositively, but that ` +
            `key's spawn name is ${JSON.stringify(name)} — a role restatement, not a name. ` +
            `Either give the spec a personal name, or drop the appositive form here.`,
        );
      }
    }
    expect(failures).toEqual([]);
  });

  /**
   * Falsification arms. Without these, a `TITLE_FORM` that matched nothing, or an
   * `APPOSITIVE_CAST` that matched everything, would make the rule above
   * unfalsifiable — it would pass on an empty predicate just as happily.
   */
  it('TITLE_FORM discriminates — it catches the retired names and spares the real ones', () => {
    for (const bad of [
      'The Keeper at the Crossing',
      'The Caravan Master',
      'The Stranger at the Crossroads',
      'The Paper-Seller',
    ]) {
      expect(TITLE_FORM.test(bad), `${bad} should read as title-form`).toBe(true);
    }
    for (const good of ['Halda Brenn', 'Ferrin Oake', 'Hesta Ryle', 'Bram Oskell', 'Orin Vask']) {
      expect(TITLE_FORM.test(good), `${good} should read as a personal name`).toBe(false);
    }
  });

  it('APPOSITIVE_CAST matches the appositive form and not the subject form', () => {
    const matches = (text: string) => new RegExp(APPOSITIVE_CAST.source).test(text);
    expect(matches('The keeper, {cast:bridge_keeper}, takes two coppers')).toBe(true);
    // The shape the stranger's prose was rewritten into — token as subject.
    expect(matches('{cast:stranger} waits under the dead tree')).toBe(false);
    expect(matches('She spoke with {cast:keeper} about the roof')).toBe(false);
  });
});
