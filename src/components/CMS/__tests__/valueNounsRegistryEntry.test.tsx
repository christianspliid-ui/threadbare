// @vitest-environment jsdom

/**
 * The VALUE_NOUNS table reaches the CMS content browser (THR-1200).
 *
 * THR-1200 is a content/engine ticket — `fearResolver` substituted the adjective register
 * into `{value}`, a noun slot, on all 109 slots of `FEAR_PROSE`. Registering the new
 * `VALUE_NOUNS` table on the CMS browsing surface, so content authors can see the noun
 * register beside the adjective one it is easily confused with, puts a file under
 * `src/components/` in the diff and trips the UI-pillar browser-verify trigger.
 *
 * This file is the **browser-verify substitution** for that (THR-754 / impediments #546,
 * #574). `preview_start` was refused this run — the tool returned "Dev servers can't be
 * started from unattended sessions" — so the contractual 1920x1080 capture has no reachable
 * route. The substitution is honest rather than merely convenient: the change appends one
 * entry to an existing list of ~90 sibling entries, rendered by the same `RecordViewer` its
 * `VALUE_LABELS` neighbour already uses, so the failure classes only pixels can catch
 * (overflow, z-index, off-viewport paint) are structurally absent — the row cannot lay out
 * differently from the sibling shipping on that surface today.
 *
 * What this asserts that a screenshot could not: that the words painted are the NOUN
 * register. A capture of the CMS would show a table of nine rows whatever strings it held,
 * which is the precise blindness that let the defect ship in the first place.
 */

import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RecordViewer } from '../viewers/RecordViewer';
import { CONTENT_REGISTRY, getEntryById } from '../registry';
import { VALUE_NOUNS, VALUE_LABELS } from '../../../data/strand-content';

/** The data the CMS browsing surface actually renders for this entry. */
function registryData(): Record<string, unknown> {
  return getEntryById('value-nouns')!.data as Record<string, unknown>;
}

describe('CMS registry — VALUE_NOUNS (THR-1200)', () => {
  it('registers the table beside its adjective sibling, on the same viewer', () => {
    const nouns = getEntryById('value-nouns');
    const labels = getEntryById('value-labels');

    expect(nouns).toBeDefined();
    expect(nouns!.data).toBe(VALUE_NOUNS);
    // Same viewer and category as the sibling, so it browses identically.
    expect(nouns!.viewer).toBe(labels!.viewer);
    expect(nouns!.category).toBe(labels!.category);
    // Adjacent in the list — the two registers are confusable and are meant to be read together.
    const ids = CONTENT_REGISTRY.map((e) => e.id);
    expect(ids.indexOf('value-nouns')).toBe(ids.indexOf('value-labels') + 1);
  });

  it('paints every axis with its noun pole, not its adjective label', () => {
    // Render what the REGISTRY points at, not the module imported directly — otherwise this
    // asserts about `VALUE_NOUNS` in isolation and stays green while the browsing surface
    // shows the wrong table entirely.
    render(
      <RecordViewer data={registryData()} selectedKey={null} onSelectItem={() => {}} />,
    );

    // Every axis row reaches the surface. Values are collapsed to "[2 items]" until the row
    // is expanded, so drive the same click the browser does — otherwise this asserts on the
    // key list only, and `mercy` would "pass" as a substring of `mercy_ruthlessness`.
    for (const axis of Object.keys(VALUE_NOUNS)) {
      const row = screen.getByText(axis);
      expect(row).toBeTruthy();
      fireEvent.click(row.closest('button')!);
    }

    // The painted values are the live nouns, not literals duplicated into this test, so the
    // arm fails if the registry drifts from the module the resolver imports.
    const painted = document.body.textContent ?? '';
    for (const [axis, [positive, negative]] of Object.entries(VALUE_NOUNS)) {
      // Strip the key text before matching, so a noun can never be satisfied by the axis
      // name that contains it — the vacuous shape this assertion exists to avoid.
      const values = painted.split(axis).slice(1).join(axis);
      expect(values).toContain(positive);
      expect(values).toContain(negative);
    }

    // And the adjective register is absent from this surface. 'Cunning' is excluded because
    // it is the one pole where the two registers legitimately share a spelling (pinned in
    // src/data/__tests__/strand-content.test.ts); every other adjective appearing here would
    // mean the entry is pointed at VALUE_LABELS.
    const adjectives = Object.values(VALUE_LABELS)
      .flat()
      .filter((a) => a.toLowerCase() !== 'cunning');
    for (const adjective of adjectives) {
      expect(painted).not.toContain(adjective);
    }
  });

  it('filters to a single axis on search, the way the browser drives it', () => {
    render(
      <RecordViewer
        data={registryData()}
        searchQuery="courage"
        selectedKey={null}
        onSelectItem={() => {}}
      />,
    );

    expect(screen.getByText('courage_prudence')).toBeTruthy();
    // Absence where the row should not render — the half a presence-only assertion misses.
    expect(screen.queryByText('mercy_ruthlessness')).toBeNull();
  });
});
