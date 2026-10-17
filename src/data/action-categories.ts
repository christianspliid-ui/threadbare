/**
 * Action categories — the ONE table that files a player action under a category (THR-1886).
 *
 * UI Law 58: the UI grows by adding entries, not by writing screens. Before this module a
 * player action under a new id-prefix needed the same prefix written into three hand-kept
 * lists — `categoryFor()` in `scripts/generate-action-catalog.ts`, the bucketing arms in
 * `getAllCodexEntries()` and the `catDefs` tabs in `getCodexCategories()` (both in
 * `src/components/Codex/codexRegistry.ts`). Two of them failed silently: an unknown prefix
 * returned `null` and the action vanished from the catalog, and `company.*` / `thread.*` sat
 * castable-but-invisible in the Codex for months (THR-999).
 *
 * Now both readers import this file and keep no prefix arms of their own:
 *   - `ACTION_CATEGORIES` declares every category once — its Codex tab label and its facet
 *     name in the designer action catalog. The record is closed over `ActionCategory`, so a
 *     category without a label is a type error. Labels are sentence case (the Codex sets them
 *     as bold labels). Its icon lives beside the Codex's other marks (`ACTION_CATEGORY_ICONS`
 *     in codexRegistry.ts, also closed over the union; the text glyphs retired in THR-1907).
 *   - `ACTION_CATEGORY_RULES` maps id-prefixes (and a few bare ids) to a category. Rule order
 *     is the Codex's entry order, so keep new rows grouped with their category.
 *   - `uncategorisedActionMessages()` names the prefix and this file for any player-castable
 *     template that no rule matches; the Codex coverage test and the catalog generator both
 *     fail on it, so a new prefix breaks the build instead of shipping invisible.
 *
 * To add a player action under a new prefix: add one row to `ACTION_CATEGORY_RULES` (and,
 * only if it needs a new home, one entry to `ACTION_CATEGORIES` plus its Codex glyph and mapper). Recipe:
 * `Docs/design-system/extending.md` § New player action.
 */

/** Every category a player action can be filed under (the Codex category id). */
export type ActionCategory =
  | 'divine'
  | 'hex'
  | 'location'
  | 'artifact'
  | 'company'
  | 'threads'
  | 'actions';

/** The facet name the designer action catalog (`public/action-catalog.generated.json`) uses. */
export type CatalogCategory =
  | 'divine'
  | 'action'
  | 'hex'
  | 'location'
  | 'artifact'
  | 'company'
  | 'threads';

export interface ActionCategoryDef {
  /** Codex tab label. */
  readonly label: string;
  /** Facet name in the designer action catalog. */
  readonly catalogFacet: CatalogCategory;
}

/**
 * The categories, in Codex tab order. Closed over `ActionCategory`: adding a member to the
 * union without a row here (or a row without a label) fails the typecheck.
 */
export const ACTION_CATEGORIES = {
  divine: { label: 'Divine actions', catalogFacet: 'divine' },
  hex: { label: 'Hex actions', catalogFacet: 'hex' },
  location: { label: 'Place actions', catalogFacet: 'location' },
  artifact: { label: 'Artifact actions', catalogFacet: 'artifact' },
  company: { label: 'Company actions', catalogFacet: 'company' },
  threads: { label: 'Thread & insight', catalogFacet: 'threads' },
  actions: { label: 'Mortal actions', catalogFacet: 'action' },
} as const satisfies Record<ActionCategory, ActionCategoryDef>;

/** Category ids in Codex tab order. */
export const ACTION_CATEGORY_IDS = Object.keys(ACTION_CATEGORIES) as ActionCategory[];

export interface ActionCategoryRule {
  readonly category: ActionCategory;
  /** Id prefixes this rule claims (`'company.'`, or a bare stem like `'bind_thread_'`). */
  readonly prefixes: readonly string[];
  /** Whole ids this rule claims — verbs whose id carries no prefix. */
  readonly ids?: readonly string[];
}

/**
 * Prefix → category. The first matching rule wins. Rule order is the Codex's entry order.
 */
export const ACTION_CATEGORY_RULES: readonly ActionCategoryRule[] = [
  // The generic divine interventions plus the eight reach signatures (`invest.*`, THR-503).
  // The signatures are the only reach-locked ascendant cards; cataloguing them in the Codex
  // is what makes "locked this incarnation" legible (THR-613 Slice 3b-tail).
  { category: 'divine', prefixes: ['divine.', 'invest.'] },
  { category: 'actions', prefixes: ['action.'] },
  { category: 'hex', prefixes: ['hex.'] },
  { category: 'location', prefixes: ['loc.'] },
  { category: 'location', prefixes: ['sub.'] },
  { category: 'artifact', prefixes: ['artifact.'] },
  // The four verbs that act on a company of travelling mortals (THR-999). Their own category:
  // the Codex is organised by what a verb acts upon, and a company is its own target class.
  { category: 'company', prefixes: ['company.'] },
  // Thread-binding, thread management (`thread.*` dormant / reactivate, THR-999) and agent
  // observation.
  {
    category: 'threads',
    prefixes: ['bind_thread_', 'thread.'],
    ids: ['observe_agent', 'scry_agent', 'whisper_insight', 'dream_sending'],
  },
];

/**
 * Prefixes the Codex files but the designer action catalog leaves out. `invest.*` has never
 * been in `public/action-catalog.generated.json`; THR-1886 moved the lists into this file
 * without changing what either surface shows, and this row keeps that gap explicit rather
 * than a silent `null`.
 */
export const DESIGNER_CATALOG_EXCLUDED_PREFIXES: readonly string[] = ['invest.'];

function ruleMatches(rule: ActionCategoryRule, id: string): boolean {
  return rule.prefixes.some(p => id.startsWith(p)) || (rule.ids?.includes(id) ?? false);
}

/** The category a template id files under, or null when no rule claims it. */
export function actionCategoryFor(id: string): ActionCategory | null {
  for (const rule of ACTION_CATEGORY_RULES) {
    if (ruleMatches(rule, id)) return rule.category;
  }
  return null;
}

/**
 * The designer action catalog facet for a template id, or null when the id is not in that
 * catalog (no rule claims it, or its prefix is in `DESIGNER_CATALOG_EXCLUDED_PREFIXES`).
 */
export function catalogCategoryFor(id: string): CatalogCategory | null {
  if (DESIGNER_CATALOG_EXCLUDED_PREFIXES.some(p => id.startsWith(p))) return null;
  const category = actionCategoryFor(id);
  return category ? ACTION_CATEGORIES[category].catalogFacet : null;
}

/**
 * Templates grouped by the rule that claims them, in rule order — the Codex's entry order.
 * First matching rule wins, so a template is never listed under two rules.
 */
export function templatesByRule<T extends { readonly id: string }>(
  templates: readonly T[],
): { rule: ActionCategoryRule; templates: T[] }[] {
  return ACTION_CATEGORY_RULES.map(rule => ({
    rule,
    templates: templates.filter(t => ACTION_CATEGORY_RULES.find(r => ruleMatches(r, t.id)) === rule),
  }));
}

/** `company.bless` -> `company.`; a bare id like `observe_agent` -> itself. */
export function actionIdPrefix(id: string): string {
  const dot = id.indexOf('.');
  return dot === -1 ? id : id.slice(0, dot + 1);
}

/** The path readers name when a template has no category. */
export const ACTION_CATEGORIES_FILE = 'src/data/action-categories.ts';

/**
 * One message per prefix that no rule claims, each naming the prefix and this file. Pass
 * the player-castable templates (filter with `isPlayerReachableTemplate`). Empty means
 * every template has a category.
 */
export function uncategorisedActionMessages(
  templates: readonly { readonly id: string }[],
): string[] {
  const byPrefix = new Map<string, string[]>();
  for (const t of templates) {
    if (actionCategoryFor(t.id) !== null) continue;
    const prefix = actionIdPrefix(t.id);
    byPrefix.set(prefix, [...(byPrefix.get(prefix) ?? []), t.id]);
  }
  return [...byPrefix.entries()].map(
    ([prefix, ids]) =>
      `add \`${prefix}\` to ${ACTION_CATEGORIES_FILE} (ACTION_CATEGORY_RULES) — ` +
      `uncategorised player-castable template(s): ${ids.join(', ')}`,
  );
}
