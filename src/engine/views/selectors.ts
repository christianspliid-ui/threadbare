/**
 * VIEW_SELECTORS — the one registry of view-model selectors (THR-1822 § D2, UI Law 58).
 *
 * `useView()` reads selectors by import; `__DEBUG.getView(id, args)` and
 * `__DEBUG.listViews()` read them through this list. A new view-model family is
 * one entry here — `views/__tests__/selectors.test.ts` fails, naming the id, when
 * an entry is unreachable, duplicated or has no fallback.
 */
import type { ViewSelector } from './readView';
import { hexContentsIndexSelector, hexContentsSelector } from './hexContents';
import { mapAgentsSelector } from './map/agents';
import { mapThreadLinesSelector } from './map/threadLines';
import { mapCompaniesSelector } from './map/companies';
import { mapActivitySelector } from './map/activityIcons';
import { mapPlacesSelector } from './map/places';
import { mapArmiesAndBattlesSelector } from './map/armiesAndBattles';
import { lensViewSelector } from './lenses/lensView';
import { mapRealmInkSelector } from './map/realmInk';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- a heterogeneous registry; each entry keeps its own types at its import
export type AnyViewSelector = ViewSelector<any, unknown>;

export const VIEW_SELECTORS: readonly AnyViewSelector[] = [
  mapAgentsSelector,
  mapThreadLinesSelector,
  mapCompaniesSelector,
  mapActivitySelector,
  mapPlacesSelector,
  mapArmiesAndBattlesSelector,
  mapRealmInkSelector,
  hexContentsIndexSelector,
  hexContentsSelector,
  lensViewSelector,
];

export type ViewSelectorId = (typeof VIEW_SELECTORS)[number]['id'];

export function getViewSelector(id: string): AnyViewSelector | undefined {
  return VIEW_SELECTORS.find(s => s.id === id);
}

export interface ViewListing {
  id: string;
  invalidation: ViewSelector<unknown, unknown>['invalidation'];
}

export function listViewSelectors(): ViewListing[] {
  return VIEW_SELECTORS.map(s => ({ id: s.id, invalidation: s.invalidation }));
}
