/**
 * `UNDERTAKING_RETROFIT_PENDING` — the Undertaking Contract's ratchet. THR-1300 slice 1.
 *
 * The encounter line's `retrofitPending.ts` is the sibling and decided the rules:
 *
 * **What it is.** Every template id here predates the contract and is allowed to
 * fail `check:undertaking` without failing CI. Everything *not* here must pass.
 *
 * **Why a named list and not a count.** A threshold lets a new non-compliant
 * template hide behind a retrofitted one. A named list cannot: adding a template
 * means adding its id in a diff someone reviews, and the ratchet test refuses any
 * id that is not already here.
 *
 * **It only ever shrinks.** Deleting a name is the retrofit's proof — the id leaves
 * this file in the same commit the template becomes contract-complete, and
 * `undertakingContract.test.ts` fails both ways: a listed template that now passes,
 * and an unlisted one that fails.
 *
 * **This is not an exemption mechanism** (plan ruling 3). Per-template, temporary,
 * one direction of travel.
 *
 * Regenerate — only ever to *remove* names:
 *   `npm run check:undertaking -- --all --list-failures`
 *
 * Populated at the gate's introduction (2026-09-02) from that command over the 64
 * shipped templates: 59 named, 5 pass. The blocks that put them here, so nobody reads
 * the length as rot — `board` 35 (`payoffValue` absent on every template that relies
 * on the scorer's default), `cast` 33 (the cast seam shipped unauthored, THR-1296 §3;
 * four templates declare a slot), `register` 28 (evasive vagueness and second-person
 * address in prose written before the doctrine), `kind_membership` 20
 * (`multi_tick_project` templates in no kind row — THR-1297/1308/1309 registered the
 * rows whose destroys existed and no others, on purpose), `counter_play` 1.
 */
export const UNDERTAKING_RETROFIT_PENDING: readonly string[] = [
  'strategic_assess_politics',
  'strategic_blockade_route',
  'strategic_build_granary',
  'strategic_build_warehouse',
  'strategic_burn_the_charts',
  'strategic_burn_the_mark',
  'strategic_buy_influence',
  'strategic_chart_the_wilds',
  'strategic_civic_construction',
  'strategic_claim_territory',
  'strategic_commission_quest',
  'strategic_consecrate_holy_site',
  'strategic_consecrate_site',
  'strategic_cultivate_informant',
  'strategic_destroy_masterwork',
  'strategic_draft_plans',
  'strategic_establish_dynasty_seat',
  'strategic_establish_garrison',
  'strategic_establish_research_circle',
  'strategic_establish_sacred_route',
  'strategic_establish_spy_network',
  'strategic_establish_trade_route',
  'strategic_extend_reach',
  'strategic_extend_route',
  'strategic_follow_the_chart',
  'strategic_fortify_defenses',
  'strategic_fortify_position',
  'strategic_found_guild_chapter',
  'strategic_found_order',
  'strategic_found_settlement',
  'strategic_found_shrine',
  'strategic_grow_settlement',
  'strategic_guard_knowledge',
  'strategic_improve_masterwork',
  'strategic_investigate_anomaly',
  'strategic_maintain_authority',
  'strategic_maintain_civic_order',
  'strategic_maintain_monopoly',
  'strategic_negotiate_storage',
  'strategic_organize_festival',
  'strategic_organize_patronage',
  'strategic_police_doctrine',
  'strategic_preach_masses',
  'strategic_press_the_mark',
  'strategic_raid_supply_lines',
  'strategic_raze_settlement',
  'strategic_recruit_companions',
  'strategic_recruit_warband',
  'strategic_reinforce_warband',
  'strategic_scout_defenses',
  'strategic_secure_office',
  'strategic_sever_network',
  'strategic_suborn_warband',
  'strategic_survey_faithful',
  'strategic_survey_market',
  'strategic_survey_site',
  'strategic_train_apprentice',
  'strategic_walk_the_unmapped',
  'strategic_write_treatise',
];

const PENDING_SET: ReadonlySet<string> = new Set(UNDERTAKING_RETROFIT_PENDING);

/** Membership test, so callers do not each build their own Set. */
export function isUndertakingRetrofitPending(templateId: string): boolean {
  return PENDING_SET.has(templateId);
}
