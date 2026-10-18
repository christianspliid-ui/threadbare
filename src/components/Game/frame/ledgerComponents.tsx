/**
 * The Ledger rail's section bodies, one per `LEDGER_RAIL_SECTIONS` entry (THR-1893,
 * frame plan § F2 check 4, Law 58).
 *
 * `Record<LedgerSectionId, …>`: a section added to the registry without a body here is a
 * type error. The Chronicle's tab panels are the same kind of map, `LEDGER_TAB_PANELS`,
 * kept beside the panels in `ChroniclePanel.tsx` and re-exported here.
 */
import type { ComponentProps, ReactElement } from 'react';
import type { LedgerSectionId } from '../../../data/frame-registry';
import { ThreadsPanel } from '../ThreadsPanel';
import { ChroniclePanel } from '../ChroniclePanel';

export { LEDGER_TAB_PANELS } from '../ChroniclePanel';

/** Everything the rail hands its sections; each body reads its own part. */
export interface LedgerSectionBag {
  threads: ComponentProps<typeof ThreadsPanel>;
  chronicle: ComponentProps<typeof ChroniclePanel>;
}

export const LEDGER_SECTION_COMPONENTS: Record<LedgerSectionId, (bag: LedgerSectionBag) => ReactElement> = {
  threads: (bag) => <ThreadsPanel {...bag.threads} />,
  chronicle: (bag) => <ChroniclePanel {...bag.chronicle} />,
};
