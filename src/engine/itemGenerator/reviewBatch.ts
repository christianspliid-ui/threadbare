/**
 * The review path's batch — generate N items the way a reviewer reads them (THR-1570).
 *
 * Plan: `Docs/plans/2026-09-26-thr-1570-seeded-item-generator.md` § Review path. The CLI
 * `generate items`, `__DEBUG.previewGeneratedItem` and the gate test all draw through
 * here, so what a person reads is what the gate checked. Seed keys follow the plan:
 * `gen_item:${seed}:${origin}:${index}`.
 */

import { ITEM_GEN_BANDS, MASTERWORK_MAX_BAND } from '../../data/item-generator-tables';
import type { ItemGenBand, ItemGenOrigin } from '../../data/item-generator-tables';
import { emptyItemGenHistory, recordInHistory } from './generateItem';
import { generateValidItem } from './mintGeneratedItem';
import { describeItem } from './describeItem';
import { REVIEW_MAKERS, reviewWorldContext } from './reviewWorld';
import type { GeneratedItem, ItemGenHistory, ItemWorldContext } from './types';

export interface ReviewedItem {
  readonly item: GeneratedItem | null;
  readonly seedKey: string;
  readonly band: ItemGenBand;
  readonly origin: ItemGenOrigin;
  readonly rerolls: number;
  /** The validator's words when the generator gave up; empty on a pass. */
  readonly problems: readonly string[];
  readonly does: readonly string[];
  readonly catches: readonly string[];
}

export interface ReviewBatchOptions {
  readonly seed: number;
  readonly count: number;
  /** Fixed band; omitted = cycle through the bands the origin allows. */
  readonly band?: ItemGenBand;
  /** Fixed origin; omitted = alternate masterwork and found. */
  readonly origin?: ItemGenOrigin;
  /**
   * The world to dress items from. Omitted = the review world. A live world context has
   * a maker for masterworks but no past for found things (THR-1637), so found items on a
   * live context come only from the cores its world can tell.
   */
  readonly world?: (index: number) => ItemWorldContext;
  readonly history?: ItemGenHistory;
}

/** Bands an origin may mint at: a workshop never makes a Legendary. */
export function bandsForOrigin(origin: ItemGenOrigin): readonly ItemGenBand[] {
  return origin === 'masterwork' ? ITEM_GEN_BANDS.filter(b => b <= MASTERWORK_MAX_BAND) : ITEM_GEN_BANDS;
}

/** Generate a review batch. Deterministic in `(seed, count, band, origin)`. */
export function generateReviewBatch(opts: ReviewBatchOptions): ReviewedItem[] {
  const history = opts.history ?? emptyItemGenHistory();
  const out: ReviewedItem[] = [];
  for (let index = 0; index < opts.count; index++) {
    const origin: ItemGenOrigin = opts.origin ?? (index % 2 === 0 ? 'masterwork' : 'found');
    const bands = bandsForOrigin(origin);
    const band = opts.band && bands.includes(opts.band) ? opts.band : bands[index % bands.length];
    const world = opts.world ? opts.world(index) : reviewWorldContext(origin === 'masterwork' ? REVIEW_MAKERS[index % REVIEW_MAKERS.length] : null);
    const seedKey = `gen_item:${opts.seed}:${origin}:${index}`;
    const result = generateValidItem({ seedKey, band, origin, world, history });
    if (result.ok) {
      const heroId = result.item.concepts.find(c => c.kind === 'actor' && world.heroes[c.id])?.id ?? null;
      recordInHistory(history, result.item, heroId);
      const words = describeItem(result.item.effects, result.item.catchIndexes, result.item.catchNotes);
      out.push({ item: result.item, seedKey, band, origin, rerolls: result.rerolls, problems: [], does: words.does, catches: words.catches });
    } else {
      out.push({ item: null, seedKey, band, origin, rerolls: 0, problems: result.lastProblems.length ? result.lastProblems : [result.reason], does: [], catches: [] });
    }
  }
  return out;
}

/** One review card as plain text — the CLI's output and the review report's rows. */
export function formatReviewCard(r: ReviewedItem, index: number, readBackVerdict?: string): string {
  if (!r.item) return `#${index + 1} — (no item: ${r.problems.join('; ')})  [${r.seedKey}]`;
  const it = r.item;
  const bandWord = it.band === 2 ? 'Storied' : it.band === 3 ? 'Mythic' : 'Legendary';
  const lines = [
    `#${index + 1} ${it.name} — ${bandWord} ${it.formNoun} · ${it.origin} · ${it.coreLabel} (${it.signatureId})`,
    `  ${it.look} ${it.provenance}`,
    ...r.does.map(d => `  + ${d}`),
    ...r.catches.map(c => `  - ${c}`),
    `  under the hood: ${it.effects.map(e => e.type).join(', ')} · sphere ${it.sphere} · reach ${it.reach} · loss ${it.lossCondition}${it.cursed ? ' · cursed' : ''} · rerolls ${r.rerolls}`,
    `  verdict: validator clean${readBackVerdict ? ` · ${readBackVerdict}` : ''}  [${r.seedKey}]`,
  ];
  return lines.join('\n');
}
