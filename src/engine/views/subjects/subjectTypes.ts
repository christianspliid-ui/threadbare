/**
 * Subject page view models (THR-1822 § D7, THR-1876 § D5 / § D7).
 *
 * What the Inspector renders for any subject the router opens: one shared header, an Act
 * row, a registry-built body, and Connections last (THR-1827 call 8). The land page adds
 * *In this land*. Plain data only (THR-1822 § D1): no Map, Set, class or graph object.
 */
import type { PageLayoutKind, Section } from '../../../types/detailPage';
import type { WorldRef, WorldRefKind } from '../../../types/worldRef';
import type { SphereName } from '../../../types';
import type { HexKey } from '../../hexActorIndex';
import type { ConnectionGroupId, LandIndexRowId } from '../../../data/view-content';
import type { RefRow } from '../types';

/** One named row in Connections or *In this land*: a link plus its one plain fact. */
export interface LinkRowVM extends RefRow {
  /** One plain fact: "Priest · Congregation of the Spheres". Empty when there is none. */
  fact: string;
  /** Law 22: a map-located row draws the eye. */
  mapLocated: boolean;
  hexKey: HexKey | null;
  /** "last seen …" for a remembered place, else null (knowledge floor; OPEN today). */
  staleFact: string | null;
}

/** A standing chip in the header (`Chip role="state"`). */
export interface StateChipVM {
  label: string;
  tooltipId?: string;
}

/** The header every page shares (§ D5 item 2). */
export interface SubjectHeaderVM {
  /** The subject as a link (null for the god's own page and the missing page). */
  ref: WorldRef | null;
  name: string;
  /** Worded: "Temple quarter", "Priest", "Faction". Never a raw key. */
  kindLabel: string;
  epithet: string | null;
  /**
   * The player's own avatar (THR-1990, THR-1609): the header reads "{name} — your mortal
   * shape" with the god's title line under it. Null on every other page.
   */
  mortalShape: { godTitleLine: string } | null;
  /** Containment, innermost first: Temple Quarter → The Bone Coast. */
  whereLine: RefRow[];
  /**
   * What `EntityVisual` draws: the subject's kind and id, and the Law 8 portrait gate.
   * `src` is art the page already chose (the land page's hero, THR-1916); it wins over
   * the resolver's own lookup. Absent ⇒ the resolver decides.
   */
  visual: { kind: WorldRefKind | 'god' | 'land' | 'content' | 'record' | 'missing'; id: string; portraitGate: 'shown' | 'silhouette'; src?: string | null };
  standing: StateChipVM[];
  /** What the subject is doing now, one sentence. */
  doingLine: string | null;
  /** The land page's one-line opener. */
  lede: string | null;
  mapLocated: boolean;
  hexKey: HexKey | null;
  /** Opens wide by default (factions, past events — THR-1827 call 12). */
  opensWide: boolean;
  /** A moving subject (people, armies) offers Follow (S3). */
  follow: boolean;
}

/** One card on the Act row. */
export interface ActOnCardVM {
  actionId: string;
  name: string;
  sphere: SphereName | null;
  available: boolean;
  /** Why it is locked, in the card face's own words; null when available. */
  reason: string | null;
}

/** The Act row (§ D9 way 1): what is castable on the subject; S3 (THR-1911) casts from it. */
export interface ActOnVM {
  heading: string;
  cards: ActOnCardVM[];
  /** "None of your cards works on Shutash." when there is nothing to show. */
  emptyLine: string | null;
}

export interface ConnectionsGroupVM {
  id: ConnectionGroupId;
  label: string;
  rows: LinkRowVM[];
  total: number;
  /** Rows a docked page keeps when it must fold to fit (§ D6 fit, then fold). */
  foldAfter: number;
}

/** Always in `CONNECTION_GROUP_ORDER`; empty groups omitted (Law 25). */
export interface ConnectionsVM {
  title: string;
  groups: ConnectionsGroupVM[];
}

export interface LandIndexRowVM {
  id: LandIndexRowId;
  label: string;
  rows: LinkRowVM[];
  /** The always-rows' empty line ("No one lives here."); null for a when-present row. */
  emptyLine: string | null;
}

export interface LandIndexVM {
  hexKey: HexKey;
  title: string;
  rows: LandIndexRowVM[];
}

/** The page classes the dispatcher builds (THR-1822 § D7 table). */
export type SubjectPageKind =
  | 'person'
  | 'location'
  | 'land'
  | 'faction'
  | 'army'
  | 'artifact'
  | 'god'
  | 'content'
  | 'record'
  | 'missing';

interface SubjectPageBase {
  /** A stable key for history, the lab and `getInspectorLab()`: `agent:npc_98`, `hex:12,7`. */
  subjectKey: string;
  /** Which registry rows the body came from. */
  layoutKind: PageLayoutKind;
  header: SubjectHeaderVM;
  /** Null where no card can target the subject (a record, a content card, the missing page). */
  actOn: ActOnVM | null;
  /** The registry sections, every width — the Inspector filters by its size. */
  body: Section[];
  connections: ConnectionsVM;
}

export interface LandPageVM extends SubjectPageBase {
  pageKind: 'land';
  inThisLand: LandIndexVM;
}

export interface ContentCardVM extends SubjectPageBase {
  pageKind: 'content';
  /** "Read in the Codex" renders only when the Codex holds the entry (Law 25). */
  codexEntryId: string | null;
}

export interface GenericSubjectPageVM extends SubjectPageBase {
  pageKind: Exclude<SubjectPageKind, 'land' | 'content'>;
}

export type SubjectPageVM = LandPageVM | ContentCardVM | GenericSubjectPageVM;
