/**
 * Force-full-encounter-visibility override — THR-878.
 *
 * A testing lever for the Encounter Experience project: while WS5 content is
 * mid-migration, most encounters are authored at background/shaping tier and
 * never pop a modal, which makes it impossible to browse and judge new
 * content by playing normally. Setting this flag makes every *threaded*
 * (non-dormant court position) encounter notification behave as if the
 * agent were The First — full prose, full choice set, and an immediate
 * pop-up instead of a silent/backgrounded resolution. Unthreaded (dormant)
 * agents remain invisible; this flag never surfaces the whole world's worth
 * of ambient encounters, only widens what an already-threaded agent shows.
 *
 * Read via a URL flag (`?forceencounters`) in GameView so it also works on
 * the deployed Vercel build, not just local dev — unlike `window.__DEBUG`,
 * which is stripped from production bundles.
 */
let forceFullEncounterVisibility = false;

export function setForceFullEncounterVisibility(value: boolean): void {
  forceFullEncounterVisibility = value;
}

export function isForceFullEncounterVisibility(): boolean {
  return forceFullEncounterVisibility;
}
