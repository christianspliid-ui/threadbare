import type { UnifiedActionTemplate } from '../types/unifiedAction';
import type { IntelligenceCategory } from '../types/unifiedAction';
import { TEMPLATE_CATEGORY_MATCHERS } from '../engine/intelligence';

// ─── Types ────────────────────────────────────────────────────────

export interface IntelProseCategoryWarning {
  readonly templateId: string;
  readonly reactionId: string;
  readonly effectIndex: number;
  readonly category: IntelligenceCategory;
  /** The matcher strings checked against template id/name/subtypes/reactions — none matched. */
  readonly searchedSubstrings: readonly string[];
}

export interface IntelProseCategoryLintResult {
  readonly warnings: readonly IntelProseCategoryWarning[];
  readonly templateCount: number;
  readonly effectCount: number;
}

// ─── Helpers ──────────────────────────────────────────────────────

/**
 * Collect all aftermath reactions across all variants of a template's aftermathConfig.
 * Returns an empty array if the template has no aftermathConfig.
 */
function collectAftermathReactions(template: UnifiedActionTemplate) {
  const config = template.aftermathConfig;
  if (!config) return [];
  const variants = [config.fallback, ...Object.values(config.variants ?? {})];
  return variants.filter(Boolean).flatMap(v => v.reactions ?? []);
}

// ─── Public API ───────────────────────────────────────────────────

/**
 * Returns true if the given intelligence category is plausible for the template.
 *
 * Co-traffic rule (primary): any reaction in aftermathConfig grants
 * `kind: 'intelligence'` with the same category.
 *
 * Structural rule (fallback): TEMPLATE_CATEGORY_MATCHERS[category] contains
 * a substring that appears in the template's id, name, locationSubtypes,
 * targetSubtypes, or any aftermath reaction id/label.
 */
export function isIntelCategoryPlausible(
  category: IntelligenceCategory,
  template: UnifiedActionTemplate,
): boolean {
  const reactions = collectAftermathReactions(template);

  // Rule 1: co-traffic
  for (const reaction of reactions) {
    for (const effect of reaction.effects) {
      if (effect.kind === 'intelligence' && effect.category === category) {
        return true;
      }
    }
  }

  // Rule 2: structural substring match
  const matchers = TEMPLATE_CATEGORY_MATCHERS[category];
  const searchTargets: string[] = [
    template.id,
    template.name,
    ...(template.locationSubtypes ?? []),
    ...(template.targetSubtypes ?? []),
    ...reactions.flatMap(r => [r.id, r.label]),
  ];

  for (const matcher of matchers) {
    for (const target of searchTargets) {
      if (target.toLowerCase().includes(matcher)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Scan templates for `intel_referenced_prose` effects whose category looks
 * implausibly wired — flagging likely author mis-wires. Advisory only; exits 0.
 *
 * A false positive is possible (region/targetId matches are invisible to static
 * analysis), so warnings are soft and require human review.
 */
export function runIntelProseCategoryLint(
  templates: readonly UnifiedActionTemplate[],
): IntelProseCategoryLintResult {
  const warnings: IntelProseCategoryWarning[] = [];
  let effectCount = 0;

  for (const template of templates) {
    const reactions = collectAftermathReactions(template);
    for (const reaction of reactions) {
      reaction.effects.forEach((effect, effectIndex) => {
        if (effect.kind !== 'intel_referenced_prose') return;
        effectCount++;
        if (isIntelCategoryPlausible(effect.category, template)) return;
        warnings.push({
          templateId: template.id,
          reactionId: reaction.id,
          effectIndex,
          category: effect.category,
          searchedSubstrings: TEMPLATE_CATEGORY_MATCHERS[effect.category] as readonly string[],
        });
      });
    }
  }

  return { warnings, templateCount: templates.length, effectCount };
}
