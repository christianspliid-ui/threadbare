/**
 * The Inspector lab's stress case (THR-1876 § D12): a name past 60 characters, every
 * Connections group empty but one with 30 rows, *In this land* with only its two
 * always-rows, and a body of 15 sections — Law 57 at docked (folds, then scrolls) and wide
 * (everything shown). A view model, not a world: it stresses the renderer, not the engine.
 */
import type { LandPageVM, LinkRowVM } from '../../../../engine/views/subjects/subjectTypes';
import type { Section } from '../../../../types/detailPage';
import { CONNECTION_GROUP_LABELS, LAND_INDEX_EMPTY_LINES, LAND_INDEX_LABELS, IN_THIS_LAND_TITLE } from '../../../../data/view-content';
import { CONNECTIONS_DOCKED_FOLD_AFTER } from '../../../../engine/views/viewConstants';

/** The stress case's long name, in characters. */
export const INSPECTOR_LAB_STRESS_NAME_CHARS = 64;
/** The stress case's Connections rows. */
export const INSPECTOR_LAB_STRESS_ROWS = 30;
/** The stress case's body sections. */
export const INSPECTOR_LAB_STRESS_SECTIONS = 15;

const NAMES = ['Aldric', 'Bera', 'Corwen', 'Dagny', 'Eluned', 'Fenric', 'Gwyn', 'Hald', 'Isolde', 'Jory'];
const ROLES = ['Priest', 'Smith', 'Herald', 'Warden', 'Weaver'];
const PARAGRAPH = 'The road here climbs through stone that remembers older feet, and the wind carries the smell of rain long before the rain arrives.';

export function buildStressPage(): LandPageVM {
  const base = 'The Long Windswept Plateau Above the Drowned Monastery of Saint';
  const name = (base + ' Ysolde the Unbowed').slice(0, INSPECTOR_LAB_STRESS_NAME_CHARS);
  const rows: LinkRowVM[] = Array.from({ length: INSPECTOR_LAB_STRESS_ROWS }, (_, i) => ({
    ref: { kind: 'agent', id: `stress-person-${i}` },
    name: `${NAMES[i % NAMES.length]} of the ${['Hill', 'Ford', 'Marsh'][i % 3]}`,
    fact: ROLES[i % ROLES.length],
    mapLocated: false,
    hexKey: null,
    staleFact: null,
  }));
  const body: Section[] = Array.from({ length: INSPECTOR_LAB_STRESS_SECTIONS }, (_, i) => ({
    kind: 'prose',
    typeId: `stress_section_${i + 1}`,
    label: `Stress section ${['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen'][i]}`,
    gold: false,
    tier: 'routine',
    source: 'stressFixture',
    prose: PARAGRAPH,
    // The last two sit at wide and Full only, so docked lists them under "More when widened".
    visibleAt: i >= INSPECTOR_LAB_STRESS_SECTIONS - 2 ? ['wide', 'full'] : ['docked', 'wide', 'full'],
  }));
  return {
    pageKind: 'land',
    subjectKey: 'stress:inspector-lab',
    layoutKind: 'land',
    header: {
      ref: null,
      name,
      kindLabel: 'Land',
      epithet: null,
      mortalShape: null,
      whereLine: [],
      visual: { kind: 'land', id: 'stress', portraitGate: 'shown' },
      standing: [{ label: 'Uneasy country', tooltipId: 'ui.land.danger' }, { label: 'Held by no one', tooltipId: 'ui.land.holder' }],
      doingLine: null,
      lede: 'A flat-topped expanse that rises abruptly from lower lands.',
      mapLocated: false,
      hexKey: null,
      opensWide: false,
      follow: false,
    },
    actOn: { heading: 'Act on this land', cards: [], emptyLine: 'None of your cards works on this land.' },
    body,
    connections: {
      title: 'Around it',
      groups: [{ id: 'who', label: CONNECTION_GROUP_LABELS.who, rows, total: rows.length, foldAfter: CONNECTIONS_DOCKED_FOLD_AFTER }],
    },
    inThisLand: {
      hexKey: 'stress',
      title: IN_THIS_LAND_TITLE,
      rows: [
        { id: 'people', label: LAND_INDEX_LABELS.people, rows: [], emptyLine: LAND_INDEX_EMPTY_LINES.people },
        { id: 'holder', label: LAND_INDEX_LABELS.holder, rows: [], emptyLine: LAND_INDEX_EMPTY_LINES.holder },
      ],
    },
  };
}
