/**
 * Family-level default support bundles — Scene Integration Slice E (THR-698).
 *
 * Only ~24 of ~260 templates declare a `supportBundle`; the linear tavern /
 * social / guild templates bind no cast, so scene placeholders (`{cast:*}`,
 * Slice C) have nothing to resolve there. Rather than hand-authoring ~235
 * bundles, each linear family gets a small default cast merged onto its
 * templates at registry assembly (`withDefaultSupportBundle`).
 *
 * Load-bearing design decision: **defaults are bind-only.** Every spec is
 * `delivery: 'pre-seeded'` with `reuseNpcRoles` — under
 * `prepareEncounterSupportBundle` semantics a pre-seeded spec binds an existing
 * NPC at the anchor location or stays unresolved; it never materializes
 * (`allowMaterializePreseeded` remains a debug-path-only option). Defaults add
 * zero world population — they only attach the world's existing keeper /
 * officer / witness to the scene when one is present. Do NOT change any spec
 * to `lazy-materialize-on-trigger`.
 *
 * Family key = template-id prefix before the first dot (the THR-112
 * `revealFamilies` convention). Borderland is deliberately excluded v1 —
 * wilderness encounters have no settlement cast to bind.
 *
 * `reuseNpcRoles` lists are drawn from the real `NpcRole` vocabulary
 * (`src/types/npc.ts` rosters) and kept disjoint within a family so one NPC
 * does not play two parts in the same scene. `spawnName` doubles as the prose
 * fallback name for a declared-but-unbound key (Slice C cast context).
 */

import type { EncounterSupportBundle } from '../types/encounter';
import type { UnifiedActionTemplate } from '../types/unifiedAction';

/** Cap on default-bundle specs merged onto a linear template (NFP #1). */
export const DEFAULT_BUNDLE_MAX_SPECS = 3;

export const DEFAULT_FAMILY_SUPPORT_BUNDLES: Record<string, EncounterSupportBundle> = {
  tavern: [
    {
      kind: 'actor',
      key: 'keeper',
      delivery: 'pre-seeded',
      persistence: 'must-persist',
      reuseNpcRoles: ['innkeeper', 'brewer'],
      supportRole: 'tavern_keeper',
      spawnNpcRole: 'innkeeper',
      spawnName: 'Taproom Keeper',
    },
    {
      kind: 'actor',
      key: 'performer',
      delivery: 'pre-seeded',
      persistence: 'must-persist',
      reuseNpcRoles: ['bard', 'entertainer'],
      supportRole: 'tavern_performer',
      spawnNpcRole: 'bard',
      spawnName: 'Corner Bard',
    },
    {
      kind: 'actor',
      key: 'regular',
      delivery: 'pre-seeded',
      persistence: 'must-persist',
      reuseNpcRoles: ['wanderer', 'trader', 'hunter'],
      supportRole: 'tavern_regular',
      spawnNpcRole: 'wanderer',
      spawnName: 'Taproom Regular',
    },
  ],
  social: [
    {
      kind: 'actor',
      key: 'host',
      delivery: 'pre-seeded',
      persistence: 'must-persist',
      reuseNpcRoles: ['elder', 'steward', 'noble'],
      supportRole: 'social_host',
      spawnNpcRole: 'elder',
      spawnName: 'Gathering Host',
    },
    {
      kind: 'actor',
      key: 'onlooker',
      delivery: 'pre-seeded',
      persistence: 'must-persist',
      reuseNpcRoles: ['bard', 'entertainer', 'pilgrim'],
      supportRole: 'social_onlooker',
      spawnNpcRole: 'entertainer',
      spawnName: 'Curious Onlooker',
    },
  ],
  // ── Ten guild families (id prefixes verified against each content file) ──
  tg: [
    {
      kind: 'actor',
      key: 'fence',
      delivery: 'pre-seeded',
      persistence: 'must-persist',
      reuseNpcRoles: ['fence', 'broker'],
      supportRole: 'tg_fence',
      spawnNpcRole: 'fence',
      spawnName: 'Guild Fence',
    },
    {
      kind: 'actor',
      key: 'lookout',
      delivery: 'pre-seeded',
      persistence: 'must-persist',
      reuseNpcRoles: ['lookout', 'informant'],
      supportRole: 'tg_lookout',
      spawnNpcRole: 'lookout',
      spawnName: 'Street Lookout',
    },
  ],
  ac: [
    {
      kind: 'actor',
      key: 'adept',
      delivery: 'pre-seeded',
      persistence: 'must-persist',
      reuseNpcRoles: ['warmage', 'illusionist', 'enchanter'],
      supportRole: 'ac_adept',
      spawnNpcRole: 'warmage',
      spawnName: 'Circle Adept',
    },
    {
      kind: 'actor',
      key: 'archivist',
      delivery: 'pre-seeded',
      persistence: 'must-persist',
      reuseNpcRoles: ['researcher', 'librarian', 'scribe'],
      supportRole: 'ac_archivist',
      spawnNpcRole: 'researcher',
      spawnName: 'Circle Archivist',
    },
  ],
  bf: [
    {
      kind: 'actor',
      key: 'foreman',
      delivery: 'pre-seeded',
      persistence: 'must-persist',
      reuseNpcRoles: ['mason'],
      supportRole: 'bf_foreman',
      spawnNpcRole: 'mason',
      spawnName: 'Site Foreman',
    },
    {
      kind: 'actor',
      key: 'journeyman',
      delivery: 'pre-seeded',
      persistence: 'must-persist',
      reuseNpcRoles: ['smith', 'weaver'],
      supportRole: 'bf_journeyman',
      spawnNpcRole: 'smith',
      spawnName: 'Fellowship Journeyman',
    },
  ],
  cg: [
    {
      kind: 'actor',
      key: 'officer',
      delivery: 'pre-seeded',
      persistence: 'must-persist',
      reuseNpcRoles: ['guard_captain', 'marshal'],
      supportRole: 'cg_officer',
      spawnNpcRole: 'guard_captain',
      spawnName: 'Watch Officer',
    },
    {
      kind: 'actor',
      key: 'watch_guard',
      delivery: 'pre-seeded',
      persistence: 'must-persist',
      reuseNpcRoles: ['guard'],
      supportRole: 'cg_watch_guard',
      spawnNpcRole: 'guard',
      spawnName: 'Wall Guard',
    },
  ],
  hod: [
    {
      kind: 'actor',
      key: 'knight',
      delivery: 'pre-seeded',
      persistence: 'must-persist',
      reuseNpcRoles: ['paladin', 'warrior_priest'],
      supportRole: 'hod_knight',
      spawnNpcRole: 'paladin',
      spawnName: 'Dawn Knight',
    },
    {
      kind: 'actor',
      key: 'chaplain',
      delivery: 'pre-seeded',
      persistence: 'must-persist',
      reuseNpcRoles: ['chaplain', 'monk'],
      supportRole: 'hod_chaplain',
      spawnNpcRole: 'chaplain',
      spawnName: 'Order Chaplain',
    },
  ],
  uk: [
    {
      kind: 'actor',
      key: 'broker',
      delivery: 'pre-seeded',
      persistence: 'must-persist',
      reuseNpcRoles: ['broker', 'fence'],
      supportRole: 'uk_broker',
      spawnNpcRole: 'broker',
      spawnName: 'Court Broker',
    },
    {
      kind: 'actor',
      key: 'informant',
      delivery: 'pre-seeded',
      persistence: 'must-persist',
      reuseNpcRoles: ['informant', 'spy', 'lookout'],
      supportRole: 'uk_informant',
      spawnNpcRole: 'informant',
      spawnName: 'Court Informant',
    },
  ],
  rb: [
    {
      kind: 'actor',
      key: 'warden',
      delivery: 'pre-seeded',
      persistence: 'must-persist',
      reuseNpcRoles: ['ranger'],
      supportRole: 'rb_warden',
      spawnNpcRole: 'ranger',
      spawnName: 'Trail Warden',
    },
    {
      kind: 'actor',
      key: 'tracker',
      delivery: 'pre-seeded',
      persistence: 'must-persist',
      reuseNpcRoles: ['hunter', 'scout'],
      supportRole: 'rb_tracker',
      spawnNpcRole: 'hunter',
      spawnName: 'Brother Tracker',
    },
  ],
  mct: [
    {
      kind: 'actor',
      key: 'factor',
      delivery: 'pre-seeded',
      persistence: 'must-persist',
      reuseNpcRoles: ['merchant', 'trader'],
      supportRole: 'mct_factor',
      spawnNpcRole: 'merchant',
      spawnName: 'Consortium Factor',
    },
    {
      kind: 'actor',
      key: 'ledger_clerk',
      delivery: 'pre-seeded',
      persistence: 'must-persist',
      reuseNpcRoles: ['clerk', 'appraiser'],
      supportRole: 'mct_ledger_clerk',
      spawnNpcRole: 'clerk',
      spawnName: 'Ledger Clerk',
    },
  ],
  lk: [
    {
      kind: 'actor',
      key: 'archivist',
      delivery: 'pre-seeded',
      persistence: 'must-persist',
      reuseNpcRoles: ['librarian', 'scribe'],
      supportRole: 'lk_archivist',
      spawnNpcRole: 'librarian',
      spawnName: 'Covenant Archivist',
    },
    {
      kind: 'actor',
      key: 'researcher',
      delivery: 'pre-seeded',
      persistence: 'must-persist',
      reuseNpcRoles: ['researcher', 'scholar'],
      supportRole: 'lk_researcher',
      spawnNpcRole: 'researcher',
      spawnName: 'Covenant Researcher',
    },
  ],
  ts: [
    {
      kind: 'actor',
      key: 'celebrant',
      delivery: 'pre-seeded',
      persistence: 'must-persist',
      reuseNpcRoles: ['priest', 'chaplain'],
      supportRole: 'ts_celebrant',
      spawnNpcRole: 'priest',
      spawnName: 'Sphere Celebrant',
    },
    {
      kind: 'actor',
      key: 'acolyte',
      delivery: 'pre-seeded',
      persistence: 'must-persist',
      reuseNpcRoles: ['acolyte', 'monk'],
      supportRole: 'ts_acolyte',
      spawnNpcRole: 'acolyte',
      spawnName: 'Temple Acolyte',
    },
  ],
};

/**
 * Pure merge: attach the family default bundle to a template that declares
 * none. A template-declared `supportBundle` wins outright (no per-key merge).
 * Unknown family or no default → the same template object back, untouched.
 */
export function withDefaultSupportBundle(template: UnifiedActionTemplate): UnifiedActionTemplate {
  if (template.supportBundle && template.supportBundle.length > 0) return template;
  const family = template.id.split('.')[0];
  const defaults = DEFAULT_FAMILY_SUPPORT_BUNDLES[family];
  if (!defaults || defaults.length === 0) return template;
  return { ...template, supportBundle: defaults.slice(0, DEFAULT_BUNDLE_MAX_SPECS) };
}
