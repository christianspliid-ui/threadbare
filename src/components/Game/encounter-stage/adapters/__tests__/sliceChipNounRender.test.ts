/**
 * THR-1472 — what the *shipped* slice chips draw, read off the render adapter.
 *
 * `chipStateNounWording.test.ts` proves the gate. This proves the surface: it
 * takes the real Snow on the Pass template out of `UNIFIED_ACTION_TEMPLATES`,
 * runs the same adapter `EncounterVeil` renders through, and asserts the
 * `CATEGORY · NOUN` tag the player actually sees on the band the director
 * reviewed. A gate green over a corpus is not evidence the tag changed — the
 * noun travels through `resolveRefAnchor` → `enrich` → `nounText` before it
 * reaches the screen, and any of those could drop it.
 *
 * **Browser-verify substitution: jsdom-render — unattended run, no startable
 * dev server** (`Docs/canon/verification-gates.md` § Browser-verify). This is a
 * scheduled run; `preview_start` is refused by design, which shuts the Playwright
 * route with it. The diff is also outside the UI-pillar trigger paths — it touches
 * `src/data/` and `scripts/` only, and no component changed — so what is owed here
 * is proof the data reaches the tag, which is exactly what the adapter returns.
 */

import { describe, expect, it } from 'vitest';
import { UNIFIED_ACTION_TEMPLATES } from '../../../../../data/unified-action-templates';
import { buildAftermathConsequences } from '../buildAftermathConsequences';
import type { EncounterAftermathChange } from '../../../../../types/unifiedAction';

const passthrough = {
  enrich: (text: string) => text,
  link: (id: string, text: string) => ({ id, segments: [{ text }] }),
};

/**
 * The `CATEGORY · NOUN` pairs one authored band draws, in render order.
 *
 * A band lives under `fallback.byOutcome` *or* under any variant's `byOutcome` —
 * the crossroads authors its endings under a variant, and a lookup that checked
 * only the fallback silently returned the fallback's own chips instead. Walking
 * every face and collecting the named band is what stops a miss from reading as
 * a different-but-plausible answer.
 */
function tagsFor(templateId: string, band: string): string[] {
  const template = UNIFIED_ACTION_TEMPLATES.find(t => t.id === templateId);
  expect(template, `${templateId} is not in the shipped catalog`).toBeDefined();
  const cfg = template!.aftermathConfig as unknown as {
    fallback?: Record<string, unknown>;
    variants?: Record<string, Record<string, unknown>>;
  };
  const carriers = [cfg?.fallback, ...Object.values(cfg?.variants ?? {})].filter(Boolean);
  const faces = carriers
    .map(c => (c!.byOutcome as Record<string, unknown> | undefined)?.[band])
    .filter(Boolean);
  expect(faces.length, `${templateId} authors no '${band}' band on any variant`).toBeGreaterThan(0);
  const changes = faces.flatMap(
    f => ((f as { changes?: readonly EncounterAftermathChange[] }).changes ?? []),
  );
  expect(changes.length, `${templateId}/${band} authors no changes`).toBeGreaterThan(0);
  return buildAftermathConsequences({ changes, ...passthrough })
    .map(c => `${c.categoryLabel} · ${c.nounLabel ?? '(no noun)'}`);
}

describe('THR-1472 — Snow on the Pass draws sheet words', () => {
  // The director's sitting, verbatim: the first scar "is called exhausted. this
  // is good… the second scar 'the nerve they came down with' does not work".
  const tags = () => tagsFor('encounter.slice.snow_on_the_pass', 'failure');

  it('still draws the scar the director approved', () => {
    expect(tags()).toContain('SCAR · EXHAUSTED');
  });

  it('draws the second scar as a one-word state, not a scene phrase', () => {
    expect(tags()).toContain('SCAR · SHAKEN');
    // The exact string that was on screen when the ruling was made must be gone
    // from the surface, not merely absent from the gate's finding list.
    expect(tags().join('|')).not.toContain('NERVE');
  });

  it('leaves no tag on this band the player could not read cold', () => {
    // The cover-the-title test, mechanised for the reviewed band: every noun a
    // handful of words, none of them a sentence about the climb.
    for (const tag of tags()) {
      const noun = tag.split(' · ')[1];
      expect(noun, `'${tag}' draws no noun`).not.toBe('(no noun)');
      expect(noun.split(' ').length, `'${tag}' reads as a scene phrase`).toBeLessThanOrEqual(3);
    }
  });
});

describe('THR-1472 — the director\'s other two rulings reach the tag', () => {
  it("draws the crossroads bond as the generic 'agreement'", () => {
    // *"'the promise at the cross roads' bond on the aftermath should be the
    // generic agreement."* — same sitting.
    const tags = tagsFor('encounter.slice.bargain_at_crossroads', 'critical_success');
    expect(tags.join('|')).toContain('AGREEMENT');
    expect(tags.join('|')).not.toContain('PROMISE AT THE CROSSROADS');
  });

  it('names the item the full-moon band mints, not the hands holding it', () => {
    const tags = tagsFor('encounter.slice.full_moon_collection', 'critical_success');
    expect(tags.join('|')).toContain('THE CROSSROADS GIFT');
    expect(tags.join('|')).not.toContain('PARCEL IN THEIR HANDS');
  });
});
