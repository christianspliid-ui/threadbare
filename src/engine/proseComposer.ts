/**
 * Prose Composer — sorts, caps, and joins ProseLayer fragments into final prose.
 *
 * Design doc: Docs/plans/2026-03-09-prose-generator-framework-design.md
 */
import type { ProseLayer, ProseCategory } from '../types/prose';
import { MAX_LAYERS_PER_CATEGORY, SUMMARY_MAX_CHARS, FULL_MAX_PARAGRAPHS } from '../types/prose';

/**
 * Compose full prose from layers: sort by priority, cap per category, join.
 */
export function composeProse(layers: ProseLayer[]): string {
  if (layers.length === 0) return '';

  // Sort by priority descending
  const sorted = [...layers].sort((a, b) => b.priority - a.priority);

  // Cap per category
  const categoryCounts = new Map<ProseCategory, number>();
  const selected: ProseLayer[] = [];

  for (const layer of sorted) {
    if (selected.length >= FULL_MAX_PARAGRAPHS) break;
    const count = categoryCounts.get(layer.category) ?? 0;
    if (count >= MAX_LAYERS_PER_CATEGORY) continue;
    selected.push(layer);
    categoryCounts.set(layer.category, count + 1);
  }

  return selected.map(l => l.text).join('\n\n');
}

/**
 * Compose summary prose: take highest-priority layer, truncate if needed.
 */
export function composeSummary(layers: ProseLayer[]): string {
  if (layers.length === 0) return '';

  const sorted = [...layers].sort((a, b) => b.priority - a.priority);
  const text = sorted[0].text;

  if (text.length <= SUMMARY_MAX_CHARS) return text;
  return text.slice(0, SUMMARY_MAX_CHARS) + '...';
}
