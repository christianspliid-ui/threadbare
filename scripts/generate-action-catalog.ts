/**
 * generate-action-catalog — code-true snapshot of the ascendant-facing action catalog.
 *
 * Reads the LIVE template registry (`UNIFIED_ACTION_TEMPLATES`), the within-run
 * unlock buckets (`ASCENDANT_ACTION_BUCKETS`), and the starter-floor helper
 * (`isStarterActionId`) and emits `public/action-catalog.generated.json`: one entry
 * per ascendant-facing template with its real fields and real availability bucket.
 * `public/action-catalog.html` fetches the sibling JSON at runtime, so the catalog
 * always reflects shipped templates — including the Ascendant Beats verbs
 * (imbue / consecrate / bestow / anoint) — with no hand-maintained snapshot.
 *
 * Wired into `npm run build` via prebuild (mirrors generate-ul-dashboard /
 * generate-design-wiki). Output is deterministic (no timestamp) so the committed
 * JSON does not churn on every build — NFP #3.
 *
 * Divergences from the THR-519 issue text (Cowork authored it from a stale, pre-Beats
 * checkout — see the reopen comment):
 *   • Output lives in `public/` (not `Docs/visuals/`) because THR-521 moved the
 *     Design Reference Wiki home to `public/`; the HTML fetches the sibling JSON.
 *   • `requiresSphere` is not a real `UnifiedActionTemplate` field — the sphere axis
 *     is carried by `sphereAffinity`, which is emitted. No separate field is invented.
 *   • Costs are emitted as the resolved runtime numbers. The original "keep the expr"
 *     ask would require fragile source parsing; importing the live module yields the
 *     authoritative resolved value, which is what the catalog needs.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { UNIFIED_ACTION_TEMPLATES } from '../src/data/unified-action-templates';
import { ASCENDANT_ACTION_BUCKETS, type ActionBucket } from '../src/data/ascendant-beat-content';
import { isStarterActionId } from '../src/engine/actionUnlock';
import { RARITY_TIER_NAMES, type RarityTier } from '../src/types/rarity';
import { REACH_DOMAINS, type ReachDomain } from '../src/types/traits';
import type { UnifiedActionTemplate } from '../src/types/unifiedAction';

export const SCHEMA_VERSION = 1;

const OUTPUT_FILE = 'public/action-catalog.generated.json';

/** Top-level catalog facet, mirroring the in-game Codex grouping (codexRegistry.ts). */
export type CatalogCategory =
  | 'divine'
  | 'action'
  | 'hex'
  | 'location'
  | 'artifact'
  | 'threads';

/** Thread/insight verbs the Codex groups under "Thread & Insight". */
const THREAD_INSIGHT_IDS: ReadonlySet<string> = new Set([
  'observe_agent',
  'scry_agent',
  'whisper_insight',
  'dream_sending',
]);

export interface ActionCatalogEntry {
  readonly id: string;
  readonly name: string;
  readonly spellName: string | null;
  readonly category: CatalogCategory;
  readonly reach: ReachDomain;
  readonly sphereAffinity: string | null;
  readonly crudType: string;
  readonly scale: string;
  readonly rarityTier: RarityTier;
  readonly rarityName: string;
  readonly intrinsicTier: string;
  readonly apCost: number;
  readonly essenceCost: number | null;
  readonly durationMode: 'instant' | 'sustained';
  readonly hasControlSpec: boolean;
  readonly targetCategories: readonly string[];
  readonly targetSubtypes: readonly string[];
  readonly requiresReach: ReachDomain | null;
  readonly starter: boolean;
  /** True when the id is wired into a beat grant (`ASCENDANT_ACTION_BUCKETS`). */
  readonly beatGranted: boolean;
  /** Effective availability bucket (declared if beat-granted; otherwise derived). */
  readonly bucket: ActionBucket;
  /** True when `bucket` comes from an explicit `ASCENDANT_ACTION_BUCKETS` entry. */
  readonly bucketDeclared: boolean;
  readonly description: string;
}

export interface ActionCatalogData {
  readonly schemaVersion: typeof SCHEMA_VERSION;
  readonly totals: {
    readonly total: number;
    readonly byCategory: Record<string, number>;
    readonly byReach: Record<string, number>;
    readonly byBucket: Record<string, number>;
    readonly beatGranted: number;
    readonly starters: number;
  };
  readonly entries: readonly ActionCatalogEntry[];
}

/**
 * Classify a template id into a catalog facet, or null if it is not an
 * ascendant-facing action (encounter / faction / army / monster templates are
 * agent-driven, not player-fired, so they are excluded). Mirrors the Codex's
 * id-prefix grouping in codexRegistry.ts.
 */
function categoryFor(id: string): CatalogCategory | null {
  if (id.startsWith('divine.')) return 'divine';
  if (id.startsWith('hex.')) return 'hex';
  if (id.startsWith('loc.') || id.startsWith('sub.')) return 'location';
  if (id.startsWith('artifact.')) return 'artifact';
  if (id.startsWith('bind_thread_') || id.startsWith('thread.') || THREAD_INSIGHT_IDS.has(id)) {
    return 'threads';
  }
  if (id.startsWith('action.')) return 'action';
  return null;
}

/**
 * Effective availability bucket for a template. Beat-granted ids carry an explicit
 * `ASCENDANT_ACTION_BUCKETS` entry (the authoring source of truth); everything else
 * is derived from the real reach gate — a template with `requiresReach` is reach-gated
 * (THR-503), otherwise it sits behind the within-run unlock gate only.
 */
function bucketFor(template: UnifiedActionTemplate): {
  bucket: ActionBucket;
  declared: boolean;
  requiresReach: ReachDomain | null;
} {
  const entry = ASCENDANT_ACTION_BUCKETS[template.id];
  if (entry) {
    return {
      bucket: entry.bucket,
      declared: true,
      requiresReach: entry.requiresReach ?? template.requiresReach ?? null,
    };
  }
  const requiresReach = template.requiresReach ?? null;
  return {
    bucket: requiresReach ? 'reach-gated' : 'unlockable-generic',
    declared: false,
    requiresReach,
  };
}

function toEntry(template: UnifiedActionTemplate, category: CatalogCategory): ActionCatalogEntry {
  const { bucket, declared, requiresReach } = bucketFor(template);
  const rarityTier = (template.rarityTier ?? 1) as RarityTier;
  return {
    id: template.id,
    name: template.name,
    spellName: template.spellName ?? null,
    category,
    reach: template.reach,
    sphereAffinity: template.sphereAffinity ?? null,
    crudType: template.crudType,
    scale: template.scale,
    rarityTier,
    rarityName: RARITY_TIER_NAMES[rarityTier] ?? 'Unknown',
    intrinsicTier: template.intrinsicTier,
    apCost: template.apCost,
    essenceCost: template.essenceCost ?? null,
    durationMode: template.durationMode ?? 'instant',
    hasControlSpec: template.controlSpec != null,
    targetCategories: [...(template.targetCategories ?? [])],
    targetSubtypes: [...(template.targetSubtypes ?? [])],
    requiresReach,
    starter: template.starter === true || isStarterActionId(template.id),
    beatGranted: template.id in ASCENDANT_ACTION_BUCKETS,
    bucket,
    bucketDeclared: declared,
    description: template.description ?? template.narrativeTemplates?.initiation ?? '',
  };
}

function tally(entries: readonly ActionCatalogEntry[], pick: (e: ActionCatalogEntry) => string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const e of entries) {
    const key = pick(e);
    out[key] = (out[key] ?? 0) + 1;
  }
  return out;
}

export function buildCatalogData(): ActionCatalogData {
  const reachOrder = new Map<string, number>(REACH_DOMAINS.map((r, i) => [r, i]));

  const entries = UNIFIED_ACTION_TEMPLATES
    .map((template) => {
      const category = categoryFor(template.id);
      return category ? toEntry(template, category) : null;
    })
    .filter((e): e is ActionCatalogEntry => e !== null)
    // Deterministic order so the committed JSON is stable (NFP #3): category, reach, id.
    .sort((a, b) => {
      if (a.category !== b.category) return a.category.localeCompare(b.category);
      const ra = reachOrder.get(a.reach) ?? 99;
      const rb = reachOrder.get(b.reach) ?? 99;
      if (ra !== rb) return ra - rb;
      return a.id.localeCompare(b.id);
    });

  return {
    schemaVersion: SCHEMA_VERSION,
    totals: {
      total: entries.length,
      byCategory: tally(entries, (e) => e.category),
      byReach: tally(entries, (e) => e.reach),
      byBucket: tally(entries, (e) => e.bucket),
      beatGranted: entries.filter((e) => e.beatGranted).length,
      starters: entries.filter((e) => e.starter).length,
    },
    entries,
  };
}

export interface GenerateOptions {
  readonly outputPath?: string;
  readonly dryRun?: boolean;
}

export function generateActionCatalog(opts: GenerateOptions = {}): ActionCatalogData {
  const data = buildCatalogData();
  const outputPath = opts.outputPath ?? path.join(process.cwd(), OUTPUT_FILE);
  const serialized = `${JSON.stringify(data, null, 2)}\n`;

  const summary =
    `${data.totals.total} ascendant-facing templates ` +
    `| by category ${JSON.stringify(data.totals.byCategory)} ` +
    `| by reach ${JSON.stringify(data.totals.byReach)} ` +
    `| by bucket ${JSON.stringify(data.totals.byBucket)} ` +
    `| ${data.totals.beatGranted} beat-granted, ${data.totals.starters} starters`;

  if (opts.dryRun) {
    console.log(`[generate-action-catalog] dry-run: would write ${outputPath}`);
    console.log(`[generate-action-catalog] ${summary}`);
  } else {
    fs.writeFileSync(outputPath, serialized, 'utf8');
    console.log(`[generate-action-catalog] wrote ${outputPath}`);
    console.log(`[generate-action-catalog] ${summary}`);
  }

  return data;
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : '';
const modulePath = path.resolve(fileURLToPath(import.meta.url));
if (invokedPath && invokedPath === modulePath) {
  const dryRun = process.argv.slice(2).includes('--dry-run');
  generateActionCatalog({ dryRun });
}
