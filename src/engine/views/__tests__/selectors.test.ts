/**
 * THR-1822 — the seam's registry and its layering (UI Law 58, plan § D2):
 * every selector is one entry, every entry has a fallback built from bare args,
 * and nothing under `src/engine/views/` imports from `src/components/`.
 */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { VIEW_SELECTORS, getViewSelector, listViewSelectors } from '../selectors';
import { assertSerialisable } from './viewContract';

const VIEWS_DIR = path.resolve(__dirname, '..');

function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === '__tests__') continue;
      out.push(...sourceFiles(full));
    } else if (/\.tsx?$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

describe('VIEW_SELECTORS', () => {
  it('ids are unique', () => {
    const ids = VIEW_SELECTORS.map(s => s.id);
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
    expect(dupes, `duplicate VIEW_SELECTORS ids: ${dupes.join(', ')}`).toEqual([]);
  });

  it('every id resolves through getViewSelector and listViewSelectors', () => {
    const listed = listViewSelectors().map(l => l.id);
    for (const sel of VIEW_SELECTORS) {
      expect(getViewSelector(sel.id), `VIEW_SELECTORS entry '${sel.id}' does not resolve`).toBe(sel);
      expect(listed, `VIEW_SELECTORS entry '${sel.id}' missing from listViewSelectors()`).toContain(sel.id);
    }
  });

  it('the slice-1 families are registered', () => {
    for (const id of ['map.agents', 'map.threadLines', 'map.companies', 'map.activity', 'map.places', 'map.armiesAndBattles', 'hexContents', 'hexContentsIndex', 'lens']) {
      expect(getViewSelector(id), `no VIEW_SELECTORS entry for '${id}'`).toBeDefined();
    }
  });

  it('every fallback is a total constant from bare args and is serialisable', () => {
    const bare: Record<string, unknown> = { hexKey: '3,4', lensId: 'dominion', stamp: '', avatarNodeId: null, hexSize: 10, threadedAgentIds: [], telemetryVersion: 0 };
    for (const sel of VIEW_SELECTORS) {
      for (const reason of ['missing_node', 'kind_mismatch', 'no_hex', 'resolver_threw'] as const) {
        const vm = sel.fallback(bare, reason);
        assertSerialisable(vm, `${sel.id} fallback (${reason})`);
      }
    }
  });
});

describe('src/engine/views/ layering', () => {
  it('imports nothing from src/components/', () => {
    const offenders: string[] = [];
    for (const file of sourceFiles(VIEWS_DIR)) {
      const text = fs.readFileSync(file, 'utf8');
      for (const m of text.matchAll(/^\s*(?:import|export)[^;]*?from\s+['"]([^'"]+)['"]/gm)) {
        const resolved = path.resolve(path.dirname(file), m[1]);
        if (resolved.split(path.sep).join('/').includes('/src/components/')) {
          offenders.push(`${path.relative(VIEWS_DIR, file)} → ${m[1]}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});
