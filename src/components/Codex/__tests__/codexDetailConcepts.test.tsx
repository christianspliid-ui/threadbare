// @vitest-environment jsdom

/**
 * THR-1507 — concept words in Codex detail rows hover, in every section, the same way.
 *
 * Three things are pinned here, and the third is the one that stops the defect recurring:
 *
 *  1. **Every declared concept is honest** — it resolves in the one registry (Law 17) and
 *     its text is a substring of the value it decorates (Law 2), across the whole catalog.
 *  2. **The panel paints the shape** — a multi-concept value renders as separate hovering
 *     spans, a single-concept `tooltipId` row still renders as one, and the plain runs are
 *     still there. This block is also the **browser-verify substitution** for an unattended
 *     run (`Docs/canon/verification-gates.md` § Browser-verify, jsdom-render): the change
 *     splits a text node into inline spans inside a row that already rendered, so the only
 *     layout property a pixel pass could add is inline wrapping inside a 360px column that
 *     already wraps its longest rows — and the length bound in the sibling suite still holds.
 *  3. **A new mapper cannot ship a concept row plain.** Every row of every entry is swept
 *     for the registry's own concept words — the tooltip-backed reach names, the twelve
 *     Sphere names, the four scale words — and each hit must be covered by a declared span
 *     (or a whole-value `tooltipId`). The sweep is the *guard*, not the surface: the panel
 *     never scans English (Law 2); this test scans it so that a producer that forgot to
 *     declare fails by name. Two row kinds are excused with their reasons below, and the
 *     checker is falsified against an injected undeclared row so it is proven able to fail.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CodexDetailPanel } from '../CodexDetailPanel';
import { getAllCodexEntries, type CodexEntry } from '../codexRegistry';
import {
  conceptRow,
  detailConcepts,
  reachConcept,
  sphereConcept,
  splitDetailValue,
  type CodexDetail,
} from '../codexConcepts';
import { tooltipResolves } from '../../../engine/tooltipResolver';
import { REACH_DISPLAY_NAMES, TOOLTIP_BACKED_REACHES, reachDisplayName } from '../../../engine/aftermathWords';
import { SPHERE_NAMES } from '../../../types/index';

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * The concept words the sweep looks for, each with the id the registry resolves it under.
 * Built from the registry's own key lists, never a hand-typed fixture, so a reach added
 * to the world model is swept the day it is added.
 */
const CONCEPT_WORDS: ReadonlyMap<string, string> = new Map([
  ...TOOLTIP_BACKED_REACHES.map(r => [reachDisplayName(r), `reach.${r}`] as const),
  ...SPHERE_NAMES.map(s => [cap(s), `sphere.${s}`] as const),
  ...(['personal', 'local', 'regional', 'cosmic'] as const).map(s => [cap(s), `ui.card.scale.${s}`] as const),
]);

/**
 * Rows the sweep excuses, each for a reason a reviewer can check:
 *
 * - `The marks along the way` — ambition milestone prose, three authored sentences. A reach
 *   word inside a sentence (*Stone walls. A banner.*) is English, not a concept reference,
 *   and Law 2 forbids the surface deciding otherwise; the producer declares nothing there.
 * - `Keyword` — a card type's own name. Two cards are keyworded *Veil*, which is a homonym
 *   of the reach and not a reference to it; hovering it as `reach.veil` would explain the
 *   wrong thing.
 * - `What it does` / `The decision` — the card type's authored effect and question, prose.
 */
const PROSE_ROW_LABELS: ReadonlySet<string> = new Set([
  'The marks along the way',
  'Keyword',
  'What it does',
  'The decision',
]);

/**
 * The reach words the registry itself has no entry for (`time`, `life` — no world-model node,
 * excluded from `TOOLTIP_BACKED_REACHES` by design). A `Reach` row painting one of them is the
 * registry's own declared gap, not a producer that forgot: `life` is also a Sphere name, and
 * hovering the reach row as `sphere.life` would explain the wrong concept. Derived, not typed,
 * so a reach that gains a node leaves this set the day it does. Found by this sweep on
 * `divine.afflict_bless` (reach `life`), 2026-09-16.
 */
const UNBACKED_REACH_WORDS: ReadonlySet<string> = new Set(
  Object.keys(REACH_DISPLAY_NAMES).filter(k => !TOOLTIP_BACKED_REACHES.includes(k)).map(reachDisplayName),
);

interface Undeclared {
  readonly entryId: string;
  readonly label: string;
  readonly word: string;
}

/** Concept words a row paints without declaring — the checker the falsification arm runs. */
function undeclaredConceptWords(entries: readonly Pick<CodexEntry, 'id' | 'details'>[]): Undeclared[] {
  const out: Undeclared[] = [];
  for (const entry of entries) {
    for (const detail of entry.details) {
      if (PROSE_ROW_LABELS.has(detail.label)) continue;
      const declared = detailConcepts(detail);
      for (const [word] of CONCEPT_WORDS) {
        if (!new RegExp(`\\b${word}\\b`).test(detail.value)) continue;
        if (declared.some(c => c.text === word || c.text === detail.value)) continue;
        if (detail.label === 'Reach' && UNBACKED_REACH_WORDS.has(word)) continue;
        out.push({ entryId: entry.id, label: detail.label, word });
      }
    }
  }
  return out;
}

describe('THR-1507 — every declared concept is honest', () => {
  it('resolves in the registry and lies inside its value, across the whole catalog', () => {
    const bad: string[] = [];
    let declared = 0;
    for (const entry of getAllCodexEntries()) {
      for (const detail of entry.details) {
        for (const concept of detailConcepts(detail)) {
          declared++;
          if (!tooltipResolves(concept.tooltipId)) bad.push(`${entry.id} · ${detail.label}: '${concept.tooltipId}' resolves to nothing`);
          if (!detail.value.includes(concept.text)) bad.push(`${entry.id} · ${detail.label}: '${concept.text}' is not in "${detail.value}"`);
        }
      }
    }
    expect(bad).toEqual([]);
    // Non-vacuous: the action mappers alone contribute three rows per entry.
    expect(declared).toBeGreaterThan(300);
  });

  it('every section that has a concept-bearing row declares at least one span', () => {
    const byCategory = new Map<string, { rows: number; declared: number }>();
    for (const entry of getAllCodexEntries()) {
      const stat = byCategory.get(entry.category) ?? { rows: 0, declared: 0 };
      for (const detail of entry.details) {
        stat.rows++;
        if (detailConcepts(detail).length > 0) stat.declared++;
      }
      byCategory.set(entry.category, stat);
    }
    // The sections the ticket named as tooltip-less, each now carrying spans. Undertakings
    // was the one section that already did; it is in the list so it cannot regress either.
    for (const category of ['divine', 'actions', 'hex', 'location', 'artifact', 'company', 'threads', 'conditions', 'resources', 'undertakings', 'companions', 'cards']) {
      expect(byCategory.get(category)?.declared ?? 0, `${category} declares no concept on any row`).toBeGreaterThan(0);
    }
  });
});

describe('THR-1507 — no concept-bearing row ships undeclared (the guard)', () => {
  it('sweeps a non-trivial population', () => {
    const rows = getAllCodexEntries().flatMap(e => e.details).filter(d => !PROSE_ROW_LABELS.has(d.label));
    expect(rows.length).toBeGreaterThan(500);
  });

  it('finds no row that paints a registry concept word without declaring it', () => {
    const missing = undeclaredConceptWords(getAllCodexEntries())
      .map(m => `${m.entryId} · ${m.label} paints '${m.word}' plain`);
    expect(missing).toEqual([]);
  });

  it('is falsifiable — an injected plain row is reported by name', () => {
    const injected: Pick<CodexEntry, 'id' | 'details'> = {
      id: 'test.injected',
      details: [
        { label: 'Reach', value: 'Iron' },
        { label: 'Good for', value: 'a solid edge in Gold, a faint edge in Heart', concepts: [{ text: 'Gold', tooltipId: 'reach.gold' }] },
      ],
    };
    const found = undeclaredConceptWords([injected]);
    expect(found).toEqual([
      { entryId: 'test.injected', label: 'Reach', word: 'Iron' },
      { entryId: 'test.injected', label: 'Good for', word: 'Heart' },
    ]);
    // And the excuses are real excuses, not holes: the same word in a prose row is not
    // reported, an unbacked reach on a Reach row is not reported, but the same unbacked
    // reach word painted on any *other* row still is.
    expect(undeclaredConceptWords([{ id: 'test.prose', details: [{ label: 'Keyword', value: 'Veil' }] }])).toEqual([]);
    expect(undeclaredConceptWords([{ id: 'test.reach', details: [{ label: 'Reach', value: 'Life' }] }])).toEqual([]);
    expect(undeclaredConceptWords([{ id: 'test.sphere', details: [{ label: 'Sphere', value: 'Life' }] }]))
      .toEqual([{ entryId: 'test.sphere', label: 'Sphere', word: 'Life' }]);
  });
});

describe('THR-1507 — the mapper helpers declare only what the registry resolves', () => {
  it('a reach without a world-model node declares nothing, a Sphere that is not one of the twelve declares nothing', () => {
    expect(reachConcept('iron', 'Iron')).toEqual({ text: 'Iron', tooltipId: 'reach.iron' });
    expect(reachConcept('time', 'Time')).toBeNull();
    expect(sphereConcept('mind', 'Mind')).toEqual({ text: 'Mind', tooltipId: 'sphere.mind' });
    expect(sphereConcept('void', 'Void')).toBeNull();
  });

  it('conceptRow drops a span the value does not contain and leaves the field off when nothing is placed', () => {
    const row = conceptRow('Reach', 'Iron', [reachConcept('gold', 'Gold'), null]);
    expect(row).toEqual({ label: 'Reach', value: 'Iron' });
    expect('concepts' in row).toBe(false);
  });

  it('splitDetailValue cuts first occurrence, in declaration order, without re-splitting a claimed run', () => {
    const value = 'a strong edge in Stone, a slight edge in Eye';
    expect(splitDetailValue(value, [
      { text: 'Stone', tooltipId: 'reach.stone' },
      { text: 'Eye', tooltipId: 'reach.eye' },
    ])).toEqual([
      { text: 'a strong edge in ' },
      { text: 'Stone', tooltipId: 'reach.stone' },
      { text: ', a slight edge in ' },
      { text: 'Eye', tooltipId: 'reach.eye' },
    ]);
    // A concept the value does not contain is skipped, not a crash and not an empty run.
    expect(splitDetailValue('Iron', [{ text: 'Gold', tooltipId: 'reach.gold' }])).toEqual([{ text: 'Iron' }]);
    // The whole-value shorthand folds into the same list.
    const single: CodexDetail = { label: 'The verb', value: 'Create', tooltipId: 'ui.verb.create' };
    expect(splitDetailValue(single.value, detailConcepts(single))).toEqual([{ text: 'Create', tooltipId: 'ui.verb.create' }]);
  });
});

/** The rendered hovering spans of one panel, as `[tooltipId, text]` pairs in paint order. */
function paintedConcepts(container: HTMLElement): [string, string][] {
  return Array.from(container.querySelectorAll('[data-testid="codex-detail-concept"]'))
    .map(el => [el.getAttribute('data-tooltip-id') ?? '', el.textContent ?? '']);
}

function pick(predicate: (e: CodexEntry) => boolean, label: string): CodexEntry {
  const entry = getAllCodexEntries().find(predicate);
  if (!entry) throw new Error(`no catalog entry matched ${label} — the fixture, not the fix, is stale`);
  return entry;
}

describe('THR-1507 — the rendered panel paints the spans (browser-verify substitution, jsdom-render)', () => {
  it('a two-reach contribution renders as two hovering spans with the plain runs between them', () => {
    const e = pick(x => x.id === 'reward_bestowed_patrons_backing', 'the bestowed patron entry');
    const { container } = render(<CodexDetailPanel entry={e} onClose={() => {}} />);
    const painted = paintedConcepts(container);
    expect(painted).toContainEqual(['reach.gold', 'Gold']);
    expect(painted).toContainEqual(['reach.heart', 'Heart']);
    // The sentence is intact around the spans — the value node's full text is the banded phrase.
    const value = Array.from(container.querySelectorAll('[data-testid="codex-detail-value"]'))
      .find(el => el.textContent === 'a slight edge in Gold, a faint edge in Heart');
    expect(value, 'the contribution row lost its plain runs').toBeTruthy();
  });

  it('an action paints reach, scale and cost as concepts, and a Sphere when it has one', () => {
    const e = pick(x => x.id === 'hex.bless_land', 'hex.bless_land');
    const { container } = render(<CodexDetailPanel entry={e} onClose={() => {}} />);
    const painted = paintedConcepts(container);
    expect(painted).toContainEqual(['reach.star', 'Star']);
    expect(painted).toContainEqual(['ui.card.scale.regional', 'Regional']);
    expect(painted).toContainEqual(['ui.essence_cost', '3 essence']);
    const sphere = e.details.find(d => d.label === 'Sphere');
    if (sphere) expect(painted.some(([id]) => id.startsWith('sphere.'))).toBe(true);
    // The row label is still plain text beside the value.
    expect(screen.getByText('Reach')).toBeTruthy();
  });

  it('a companion paints each reach it lends as its own span', () => {
    const e = pick(x => x.category === 'companions' && (x.details[0].concepts?.length ?? 0) >= 2, 'a two-reach companion');
    const { container } = render(<CodexDetailPanel entry={e} onClose={() => {}} />);
    const reaches = paintedConcepts(container).filter(([id]) => id.startsWith('reach.'));
    expect(reaches.length).toBeGreaterThanOrEqual(2);
  });

  it('a Sphere-signed card hovers its Sphere and paints the rest of the sentence plain', () => {
    const e = pick(x => x.category === 'cards' && x.details.some(d => d.label === 'How you hold it' && (d.concepts?.length ?? 0) > 0), 'a signed card');
    const { container } = render(<CodexDetailPanel entry={e} onClose={() => {}} />);
    const painted = paintedConcepts(container);
    expect(painted.some(([id]) => id.startsWith('sphere.'))).toBe(true);
    expect(container.textContent).toContain('held by gods of that Sphere');
  });

  it('the single-concept shorthand still renders as one whole-value span — Undertakings did not change shape', () => {
    const e = pick(x => x.category === 'undertakings', 'an undertaking');
    const { container } = render(<CodexDetailPanel entry={e} onClose={() => {}} />);
    const verb = e.details.find(d => d.label === 'The verb')!;
    expect(paintedConcepts(container)).toContainEqual([verb.tooltipId!, verb.value]);
  });

  it('a row with no concept paints no hovering span at all — no dead underline (Law 21)', () => {
    const e = pick(x => x.id === 'agreement.debt.minor', 'agreement.debt.minor');
    const { container } = render(<CodexDetailPanel entry={e} onClose={() => {}} />);
    expect(paintedConcepts(container)).toEqual([]);
    // Guard the guard: the rows are there, they just do not hover.
    expect(screen.getByText('Duration')).toBeTruthy();
    expect(screen.getByText('four days')).toBeTruthy();
  });
});
