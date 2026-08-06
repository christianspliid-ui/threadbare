/**
 * Action-art asset resolution (THR-769).
 *
 * The four `company.*` verbs shipped artless because the blocker was asset authoring, not
 * wiring — and THR-732 deliberately declined to add map entries pointing at files that did
 * not exist, since a mapped-but-missing asset renders a BROKEN IMAGE, which is strictly
 * worse than the artless fallback. That trade-off only holds while something proves the
 * mapped paths are real, so this file pins both halves: the company verbs are covered, and
 * every path in the map resolves to a file on disk.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';
import { ACTION_ART, getActionArt } from '../actionArt';
import { UNIFIED_ACTION_TEMPLATES } from '../../../data/unified-action-templates';

/** Map a public-root art URL ('/assets/actions/x.jpg') to its on-disk path. */
function assetPath(url: string): string {
  return join('public', url.replace(/^\//, ''));
}

const COMPANY_VERBS = [
  'company.bless',
  'company.draw_together',
  'company.reunite',
  'company.sunder',
] as const;

describe('THR-769 — company action cards have art', () => {
  it('covers all four company verbs, and covers every company verb that exists', () => {
    // Guard the guard: derive the live set rather than trusting the literal above, so a
    // fifth company verb added later fails here instead of shipping artless unnoticed.
    const live = UNIFIED_ACTION_TEMPLATES.filter(t => t.id.startsWith('company.')).map(t => t.id);
    expect(live.slice().sort()).toEqual([...COMPANY_VERBS].sort());

    for (const id of live) {
      expect(getActionArt(id), `art for ${id}`).toMatch(/^\/assets\/actions\/.+\.jpg$/);
    }
  });

  it('derives each company filename from the template spellName, not its id', () => {
    // The recipe keys filenames off `spellName` ("Awning Unfurled" -> awning-unfurled.jpg).
    // Pinning it here is what stops the next card being filed under its id by accident.
    const kebab = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    for (const id of COMPANY_VERBS) {
      const template = UNIFIED_ACTION_TEMPLATES.find(t => t.id === id);
      expect(template, `template ${id}`).toBeDefined();
      expect(getActionArt(id)).toBe(`/assets/actions/${kebab(template!.spellName!)}.jpg`);
    }
  });
});

describe('action-art assets resolve on disk', () => {
  it('points every mapped path at a file that exists under public/', () => {
    const entries = Object.entries(ACTION_ART);
    // Guard the guard: an empty or collapsed map would make the loop below vacuous.
    expect(entries.length).toBeGreaterThanOrEqual(80);

    const missing = entries
      .filter(([, url]) => !existsSync(assetPath(url)))
      .map(([id, url]) => `${id} -> ${url}`);

    expect(missing).toEqual([]);
  });
});
