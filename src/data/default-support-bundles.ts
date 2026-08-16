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
 * THR-1044 adds a **second lookup** for families whose prefix names no place —
 * `encounter.*`, the whole nudge-era id space — which resolve their default by
 * setting class instead. See {@link SETTING_KEYED_FAMILIES} and
 * {@link DEFAULT_SETTING_SUPPORT_BUNDLES} below. Both lookups obey the same
 * bind-only rule; neither ever adds population.
 *
 * `reuseNpcRoles` lists are drawn from the real `NpcRole` vocabulary
 * (`src/types/npc.ts` rosters) and kept disjoint within a family so one NPC
 * does not play two parts in the same scene. `spawnName` doubles as the prose
 * fallback name for a declared-but-unbound key (Slice C cast context).
 */

import type { EncounterSupportBundle } from '../types/encounter';
import type { UnifiedActionTemplate } from '../types/unifiedAction';
import { SETTING_CLASSES, settingClassForSubtype, type SettingClass } from './settingClasses';

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

// ─── Setting-keyed defaults — the `encounter.*` family (THR-1044) ────

/**
 * Families whose id prefix carries no cast signal, so their defaults resolve by
 * **setting class** instead (THR-1044).
 *
 * The tables above key on the id prefix because that prefix names a *place with
 * people in it* — `tg.` is the thieves' guild, `cg.` the city guard, `ts.` the
 * temple of spheres. `encounter.` names nothing: it is the whole nudge-era id
 * space, 191 templates spread across every location in the world. One flat cast
 * for that family would put a taproom keeper on a battlefield.
 *
 * So for these families the lookup runs through {@link primarySettingClass} —
 * the THR-884 setting envelope the template declares, which is exactly the axis
 * that decides *where* the encounter happens and therefore *who is standing
 * there*.
 */
export const SETTING_KEYED_FAMILIES: readonly string[] = ['encounter'];

/**
 * Per-setting-class default cast for the setting-keyed families.
 *
 * Same load-bearing rule as the family table: **bind-only**. Every spec is
 * `delivery: 'pre-seeded'`, so a spec binds an NPC already standing at the
 * anchor location or stays unresolved. Defaults add zero world population.
 *
 * `reuseNpcRoles` are drawn from the roles worldgen actually seeds at that
 * class's subtypes (`LOCATION_ROLE_ROSTERS` in `src/types/npc.ts`), not from the
 * full 56-role vocabulary — a reuse list naming roles that never appear at a
 * shrine is a spec that can never bind, which is the dead-vocabulary failure in
 * a new place. Where a class has no roster at all (`tower`, the ruin subtypes,
 * `battleground`), the list names the nearest roles worldgen does seed nearby;
 * those specs bind when such an NPC happens to be present and stay unresolved
 * otherwise, which is the honest outcome rather than a spawned prop.
 */
export const DEFAULT_SETTING_SUPPORT_BUNDLES: Readonly<Record<SettingClass, EncounterSupportBundle>> = {
  // hamlet / farmland / mining — the hamlet roster is the only one seeded here.
  rural: [
    {
      kind: 'actor',
      key: 'elder',
      delivery: 'pre-seeded',
      persistence: 'must-persist',
      reuseNpcRoles: ['elder'],
      supportRole: 'village_elder',
      spawnNpcRole: 'elder',
      spawnName: 'Village Elder',
    },
    {
      kind: 'actor',
      key: 'neighbor',
      delivery: 'pre-seeded',
      persistence: 'must-persist',
      reuseNpcRoles: ['innkeeper', 'brewer'],
      supportRole: 'village_neighbor',
      spawnNpcRole: 'innkeeper',
      spawnName: 'Steading Neighbor',
    },
    {
      kind: 'actor',
      key: 'bystander',
      delivery: 'pre-seeded',
      persistence: 'must-persist',
      reuseNpcRoles: ['wanderer', 'pilgrim'],
      supportRole: 'village_bystander',
      spawnNpcRole: 'wanderer',
      spawnName: 'Passing Bystander',
    },
  ],
  // town / city / capital — roles common to all three rosters.
  urban: [
    {
      kind: 'actor',
      key: 'clerk',
      delivery: 'pre-seeded',
      persistence: 'must-persist',
      reuseNpcRoles: ['clerk', 'steward'],
      supportRole: 'town_clerk',
      spawnNpcRole: 'clerk',
      spawnName: 'Town Clerk',
    },
    {
      kind: 'actor',
      key: 'trader',
      delivery: 'pre-seeded',
      persistence: 'must-persist',
      reuseNpcRoles: ['merchant', 'trader'],
      supportRole: 'market_trader',
      spawnNpcRole: 'merchant',
      spawnName: 'Market Trader',
    },
    {
      kind: 'actor',
      key: 'watch',
      delivery: 'pre-seeded',
      persistence: 'must-persist',
      reuseNpcRoles: ['guard', 'guard_captain'],
      supportRole: 'town_watch',
      spawnNpcRole: 'guard',
      spawnName: 'Town Watch',
    },
  ],
  // castle / fort — the castle roster; `fort` carries none of its own.
  stronghold: [
    {
      kind: 'actor',
      key: 'castellan',
      delivery: 'pre-seeded',
      persistence: 'must-persist',
      reuseNpcRoles: ['steward', 'marshal'],
      supportRole: 'castellan',
      spawnNpcRole: 'steward',
      spawnName: 'Castellan',
    },
    {
      kind: 'actor',
      key: 'officer',
      delivery: 'pre-seeded',
      persistence: 'must-persist',
      reuseNpcRoles: ['guard_captain', 'commander'],
      supportRole: 'watch_officer',
      spawnNpcRole: 'guard_captain',
      spawnName: 'Watch Officer',
    },
    {
      kind: 'actor',
      key: 'sentry',
      delivery: 'pre-seeded',
      persistence: 'must-persist',
      reuseNpcRoles: ['guard', 'scout'],
      supportRole: 'gate_sentry',
      spawnNpcRole: 'guard',
      spawnName: 'Gate Sentry',
    },
  ],
  // shrine / temple — both rosters seed acolyte, pilgrim and healer.
  sacred: [
    {
      kind: 'actor',
      key: 'celebrant',
      delivery: 'pre-seeded',
      persistence: 'must-persist',
      reuseNpcRoles: ['priest', 'oracle'],
      supportRole: 'shrine_celebrant',
      spawnNpcRole: 'priest',
      spawnName: 'Shrine Celebrant',
    },
    {
      kind: 'actor',
      key: 'attendant',
      delivery: 'pre-seeded',
      persistence: 'must-persist',
      reuseNpcRoles: ['acolyte', 'monk'],
      supportRole: 'shrine_attendant',
      spawnNpcRole: 'acolyte',
      spawnName: 'Shrine Attendant',
    },
    {
      kind: 'actor',
      key: 'supplicant',
      delivery: 'pre-seeded',
      persistence: 'must-persist',
      reuseNpcRoles: ['pilgrim', 'healer'],
      supportRole: 'waiting_supplicant',
      spawnNpcRole: 'pilgrim',
      spawnName: 'Waiting Supplicant',
    },
  ],
  // tower — no roster of its own; the city roster's arcane roles are the nearest real vocabulary.
  arcane: [
    {
      kind: 'actor',
      key: 'adept',
      delivery: 'pre-seeded',
      persistence: 'must-persist',
      reuseNpcRoles: ['enchanter', 'warmage'],
      supportRole: 'tower_adept',
      spawnNpcRole: 'enchanter',
      spawnName: 'Tower Adept',
    },
    {
      kind: 'actor',
      key: 'archivist',
      delivery: 'pre-seeded',
      persistence: 'must-persist',
      reuseNpcRoles: ['scholar', 'sage'],
      supportRole: 'tower_archivist',
      spawnNpcRole: 'scholar',
      spawnName: 'Tower Archivist',
    },
  ],
  // ruins and the unexplored point of interest — no roster; whoever else came looking.
  ruin: [
    {
      kind: 'actor',
      key: 'delver',
      delivery: 'pre-seeded',
      persistence: 'must-persist',
      reuseNpcRoles: ['scout', 'ranger'],
      supportRole: 'ruin_delver',
      spawnNpcRole: 'scout',
      spawnName: 'Ruin Delver',
    },
    {
      kind: 'actor',
      key: 'antiquarian',
      delivery: 'pre-seeded',
      persistence: 'must-persist',
      reuseNpcRoles: ['sage', 'scholar'],
      supportRole: 'ruin_antiquarian',
      spawnNpcRole: 'sage',
      spawnName: 'Ruin Antiquarian',
    },
  ],
  // camp / oasis / wilderness — the slice's own class. Every reuse role below is
  // seeded by the `wilderness` roster; `hexer` is deliberately left out, being a
  // figure a scene is *about* rather than background cast.
  wayside: [
    {
      kind: 'actor',
      key: 'keeper',
      delivery: 'pre-seeded',
      persistence: 'must-persist',
      reuseNpcRoles: ['hermit'],
      supportRole: 'wayside_keeper',
      spawnNpcRole: 'hermit',
      spawnName: 'Wayside Keeper',
    },
    {
      kind: 'actor',
      key: 'traveler',
      delivery: 'pre-seeded',
      persistence: 'must-persist',
      reuseNpcRoles: ['wanderer', 'pilgrim'],
      supportRole: 'fellow_traveler',
      spawnNpcRole: 'wanderer',
      spawnName: 'Fellow Traveler',
    },
    {
      kind: 'actor',
      key: 'outrider',
      delivery: 'pre-seeded',
      persistence: 'must-persist',
      reuseNpcRoles: ['ranger', 'hunter'],
      supportRole: 'road_outrider',
      spawnNpcRole: 'ranger',
      spawnName: 'Road Outrider',
    },
  ],
  // battleground — no roster; the military-outpost roles are who is left standing.
  battlefield: [
    {
      kind: 'actor',
      key: 'commander',
      delivery: 'pre-seeded',
      persistence: 'must-persist',
      reuseNpcRoles: ['commander', 'marshal'],
      supportRole: 'field_commander',
      spawnNpcRole: 'commander',
      spawnName: 'Field Commander',
    },
    {
      kind: 'actor',
      key: 'veteran',
      delivery: 'pre-seeded',
      persistence: 'must-persist',
      reuseNpcRoles: ['mercenary', 'quartermaster'],
      supportRole: 'field_veteran',
      spawnNpcRole: 'mercenary',
      spawnName: 'Field Veteran',
    },
  ],
};

/**
 * The one setting class a template unambiguously sits in, or `undefined`.
 *
 * Two sources, in order:
 *
 *  1. **The declared envelope** (`settings`, THR-884) — the authoring surface,
 *     and the answer whenever it exists. Read in canonical `SETTING_CLASSES`
 *     order rather than declaration order, so `['urban', 'rural']` and
 *     `['rural', 'urban']` resolve identically (NFP #3).
 *  2. **The subtypes the template registers at** — for the ~183 pre-envelope
 *     `encounter.*` templates, which predate `settings` and carry only
 *     `locationSubtypes`. Used **only when every authorable subtype maps to the
 *     same class**.
 *
 * The unambiguous-or-nothing rule in (2) is the load-bearing half. Of those 183
 * templates, 131 register across two or more classes and 15 across none — a
 * template drawable at a hamlet, a temple and a battlefield alike has no setting,
 * and picking one anyway would stamp it with a cast belonging to a place it is
 * usually not in. That is the placeless-prose failure `settingClasses.ts` was
 * written to end. Returning `undefined` leaves those templates exactly as they
 * are today (no bundle, no cast), so the default reaches the 37 that do sit in
 * one place plus every envelope-declaring template, and invents nothing for the
 * rest.
 */
export function primarySettingClass(template: UnifiedActionTemplate): SettingClass | undefined {
  const declared = template.settings;
  if (declared && declared.length > 0) {
    for (const cls of SETTING_CLASSES) {
      if (declared.includes(cls)) return cls;
    }
  }

  const spanned = new Set<SettingClass>();
  for (const subtype of template.locationSubtypes ?? []) {
    const cls = settingClassForSubtype(subtype);
    if (cls) spanned.add(cls);
  }
  return spanned.size === 1 ? [...spanned][0] : undefined;
}

/**
 * Pure merge: attach the default bundle to a template that declares none. A
 * template-declared `supportBundle` wins outright (no per-key merge). Unknown
 * family or no default → the same template object back, untouched.
 *
 * Two lookups, one rule: a {@link SETTING_KEYED_FAMILIES} member resolves by
 * setting class (THR-1044), everything else by id prefix (THR-698).
 */
export function withDefaultSupportBundle(template: UnifiedActionTemplate): UnifiedActionTemplate {
  if (template.supportBundle && template.supportBundle.length > 0) return template;
  const family = template.id.split('.')[0];
  const defaults = SETTING_KEYED_FAMILIES.includes(family)
    ? settingClassDefaultsFor(template)
    : DEFAULT_FAMILY_SUPPORT_BUNDLES[family];
  if (!defaults || defaults.length === 0) return template;
  return { ...template, supportBundle: defaults.slice(0, DEFAULT_BUNDLE_MAX_SPECS) };
}

/** The setting-class default for a template, or `undefined` when its setting is ambiguous. */
function settingClassDefaultsFor(template: UnifiedActionTemplate): EncounterSupportBundle | undefined {
  const cls = primarySettingClass(template);
  return cls ? DEFAULT_SETTING_SUPPORT_BUNDLES[cls] : undefined;
}

/**
 * The default bundle this template *would* receive, whether or not it has one.
 *
 * Exposed so a consumer can tell a **template-authored** cast from a bundle this
 * module attached — a distinction `template.supportBundle` alone cannot carry,
 * because {@link withDefaultSupportBundle} writes the default into that same
 * field at registry assembly.
 *
 * The distinction is load-bearing for anything judging whether an unbound cast
 * is a defect (THR-1132). An authored bundle is a promise the encounter makes.
 * A default is the opposite: bind-only by construction, and per this module's
 * own rule a spec that finds nobody "stays unresolved … which is the honest
 * outcome rather than a spawned prop". Treating both as promises made
 * `check:encounter-live` fail 5 of 6 vertical-slice templates for behaving
 * exactly as designed.
 */
export function defaultSupportBundleFor(
  template: UnifiedActionTemplate,
): EncounterSupportBundle | undefined {
  const family = template.id.split('.')[0];
  const defaults = SETTING_KEYED_FAMILIES.includes(family)
    ? settingClassDefaultsFor(template)
    : DEFAULT_FAMILY_SUPPORT_BUNDLES[family];
  return defaults && defaults.length > 0 ? defaults.slice(0, DEFAULT_BUNDLE_MAX_SPECS) : undefined;
}

/**
 * Whether every spec on this template's bundle came from a default table.
 *
 * Compares by **spec identity**, not by value: `withDefaultSupportBundle` copies
 * the array but shares the spec objects, so identity is exact here and a
 * template that hand-authors a spec with the same fields still reads as
 * authored — which is the answer we want, since it wrote the promise itself.
 */
export function hasOnlyDefaultSupportBundle(template: UnifiedActionTemplate): boolean {
  const bundle = template.supportBundle;
  if (!bundle || bundle.length === 0) return false;
  const defaults = defaultSupportBundleFor(template);
  if (!defaults) return false;
  return bundle.every(spec => defaults.includes(spec));
}
