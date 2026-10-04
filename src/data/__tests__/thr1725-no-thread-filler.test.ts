/**
 * THR-1725 — the encounter contract's stock "thread" placeholders are gone.
 *
 * "The threads are shifting." reached the player as a forecast factor line on
 * The Unsafe Bridge (Christian, 2026-10-04: "makes no sense"). Its five sibling
 * defaults rode along in every contract the builder minted. A beat with nothing
 * authored now carries no factor line, and every prose field falls back to the
 * template's own authored text.
 *
 * Sweep: every template in the shipped catalogues, through the same contract
 * read the encounter stage and the hand filter use, plus the forecast the
 * player is shown. No string anywhere in the template or its contract may equal
 * a retired default, and the serialized contract (which also rides in the
 * image's alt text) may not contain one.
 */
import { describe, expect, it } from 'vitest';
import { adaptUnifiedActionTemplateToEncounterContract } from '../../engine/encounter-contract-adapter';
import { computeForecast } from '../../engine/encounters/outcomeForecast';
import type { UnifiedActionTemplate } from '../../types/unifiedAction';
import { UNIFIED_ACTION_TEMPLATES } from '../unified-action-templates';
import { ENCOUNTER_TEMPLATES } from '../encounter-content';

const RETIRED_DEFAULTS: readonly string[] = [
  'The threads are shifting.',
  'the threads tighten',
  'the moment shifts',
  'The thread stirs and waits for a choice.',
  'The thread bends, and the world remembers.',
  'The thread frays, but does not break.',
];
const RETIRED = new Set(RETIRED_DEFAULTS.map((s) => s.trim().toLowerCase()));

const encounterModules = import.meta.glob('../encounters/*.ts', { eager: true }) as Record<
  string,
  Record<string, unknown>
>;

function looksLikeTemplate(value: unknown): value is UnifiedActionTemplate {
  return Boolean(value) && typeof value === 'object'
    && typeof (value as { id?: unknown }).id === 'string'
    && Array.isArray((value as { steps?: unknown }).steps)
    && typeof (value as { narrativeTemplates?: unknown }).narrativeTemplates === 'object';
}

function collectTemplates(): UnifiedActionTemplate[] {
  const byId = new Map<string, UnifiedActionTemplate>();
  const add = (t: UnifiedActionTemplate) => { if (!byId.has(t.id)) byId.set(t.id, t); };
  UNIFIED_ACTION_TEMPLATES.forEach(add);
  ENCOUNTER_TEMPLATES.forEach(add);
  for (const moduleExports of Object.values(encounterModules)) {
    for (const value of Object.values(moduleExports)) {
      if (looksLikeTemplate(value)) add(value);
      else if (Array.isArray(value)) value.filter(looksLikeTemplate).forEach(add);
    }
  }
  return [...byId.values()].sort((a, b) => a.id.localeCompare(b.id));
}

/**
 * The contract read for one template, or null when the template has no contract
 * shape (a non-encounter action whose reach the contract schema rejects — the
 * stage and the hand filter swallow that the same way, so no line renders).
 */
function contractFor(template: UnifiedActionTemplate) {
  try {
    return adaptUnifiedActionTemplateToEncounterContract(template);
  } catch {
    return null;
  }
}

function collectStrings(value: unknown, out: string[], seen = new WeakSet<object>()): void {
  if (typeof value === 'string') { out.push(value); return; }
  if (!value || typeof value !== 'object') return;
  if (seen.has(value)) return;
  seen.add(value);
  for (const child of Array.isArray(value) ? value : Object.values(value)) collectStrings(child, out, seen);
}

describe('THR-1725 — no stock thread filler on any encounter surface', () => {
  const templates = collectTemplates();

  it('sweeps a real catalogue', () => {
    expect(templates.length).toBeGreaterThan(100);
  });

  it('no template or contract string equals a retired default', () => {
    const hits: string[] = [];
    let stringsChecked = 0;
    let contracted = 0;
    for (const template of templates) {
      const contract = contractFor(template);
      if (contract) contracted += 1;
      const strings: string[] = [];
      collectStrings(template, strings);
      collectStrings(contract, strings);
      stringsChecked += strings.length;
      for (const s of strings) {
        if (RETIRED.has(s.trim().toLowerCase())) hits.push(`${template.id}: "${s}"`);
      }
      const serialized = JSON.stringify(contract).toLowerCase();
      for (const retired of RETIRED) {
        if (serialized.includes(retired)) hits.push(`${template.id}: contract contains "${retired}"`);
      }
    }
    expect(stringsChecked).toBeGreaterThan(0);
    expect(contracted).toBeGreaterThan(100);
    console.log(`[THR-1725 sweep] templates=${templates.length} contracts=${contracted} strings=${stringsChecked} hits=${hits.length}`);
    expect(hits).toEqual([]);
  });

  it('no forecast the player is shown carries a retired default as a factor line', () => {
    const hits: string[] = [];
    for (const template of templates) {
      const contract = contractFor(template);
      if (!contract) continue;
      contract.encounter.beats.forEach((beat, beatIndex) => {
        // 0.9 is above the three-factor threshold, so the whole pool is shown.
        const { factors } = computeForecast(
          { forecastFactors: beat.forecast_factors },
          { baseProbability: 0.9, modifiers: [] },
        );
        for (const line of factors) {
          if (RETIRED.has(line.trim().toLowerCase())) hits.push(`${template.id} beat ${beatIndex}: "${line}"`);
        }
      });
    }
    expect(hits).toEqual([]);
  });

  it('a beat with nothing authored carries no factor line', () => {
    const bare = templates.find((t) => !t.illustrationAlt?.startsWith('__encounter_contract_v1:') && contractFor(t));
    expect(bare).toBeDefined();
    for (const beat of contractFor(bare!)!.encounter.beats) expect(beat.forecast_factors).toEqual([]);
  });
});
