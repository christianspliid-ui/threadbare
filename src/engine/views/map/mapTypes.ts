/**
 * The map's always-on view models (THR-1822 slice 1, plan § D2 / § D16 step 1).
 *
 * Each row is plain and serialisable (plan § D1). Where a HexMapV2 scene's
 * render-data interface has the same shape, the map host passes the row through;
 * where the scene needs a render constant the engine does not own (the heraldic
 * palette, an army's default size, the activity icon registry, the avatar's
 * colour), the row carries a semantic key and the host applies the constant
 * after the read — `src/components/Game/map/mapViewAdapters.ts`.
 */

/** A person drawn on the map (the avatar or a threaded mortal) — `AgentRenderData` minus the avatar's paint. */
export interface MapAgentVM {
  id: string;
  hexCol: number;
  hexRow: number;
  /** Undefined for the avatar: the host paints the avatar's own portrait. */
  portraitUrl?: string;
  /** Index into the scene's heraldic palette (0–5). */
  factionIndex: number;
  isRetinue: boolean;
  /** The god holds a thread to this mortal (THR-1899: drawn as a medallion, a label obstacle). */
  isThreaded: boolean;
  isAvatar: boolean;
  name: string;
  currentRoadType?: 'major' | 'trail';
  roadHexQueueLength?: number;
}

/** A thread line from the avatar to a threaded mortal — `ThreadLineData`'s shape. */
export interface MapThreadLineVM {
  agentId: string;
  courtPosition: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
}

/** A company's ring — `CompanyRenderData`'s shape. */
export interface MapCompanyVM {
  id: string;
  worldX: number;
  worldY: number;
  threaded: boolean;
  memberCount: number;
}

/** What a mortal is doing, at their position; the host turns it into an icon key. */
export interface MapActivityVM {
  agentId: string;
  worldX: number;
  worldY: number;
  /** The encounter type the icon is read from. */
  encounterType?: string;
  /** The telemetry decision type (`queue_movement`, …), or `start_local` for a running action. */
  decisionType?: string;
  tierOpacity: number;
}

/** A Location's map icon — `LocationNode`'s shape. */
export interface MapPlaceVM {
  /** THR-1911 — the Location node id; a click on the place's label opens it. */
  id?: string;
  locationType: string;
  hexCol: number;
  hexRow: number;
  name: string;
  rarityTier?: number;
  isCapital: boolean;
  isAnomalyLocation: boolean;
  discoveredByExploration: boolean;
  isHomeSeat: boolean;
}

/** An army on campaign; the host paints its faction colour and default size. */
export interface MapArmyVM {
  armyId: string;
  hexCol: number;
  hexRow: number;
  /** Index into the scene's heraldic palette (the faction's order among factions). */
  factionIndex: number;
  factionDefId: string | null;
  /** Null when the army carries no headcount; the host applies the scene's default. */
  headcount: number | null;
  isInBattle: boolean;
}

/** A battle or siege on its hex — `BattleIndicatorData`'s shape. */
export interface MapBattleVM {
  id: string;
  hexCol: number;
  hexRow: number;
  isSiege: boolean;
  attackerName?: string;
  defenderName?: string;
}

export interface MapArmiesAndBattlesVM {
  armies: MapArmyVM[];
  battles: MapBattleVM[];
}

/** One Realm the map draws a border round, and who holds it (THR-1902). */
export interface MapRealmInkRow {
  /** The Realm's faction node id (`faction_N`). */
  realmId: string;
  name: string;
  /** The faction whose heraldic colour inks the border — the Realm's own faction. */
  holderId: string;
  /** Index into the scene's heraldic palette, or -1 (the scene's unheld ink). */
  factionIndex: number;
  /** The seated town's hex, or null when the Realm holds nothing seatable. */
  seatHex: { col: number; row: number } | null;
  /** Hexes the Realm claims — for inspection only. */
  hexCount: number;
}

/** `map.realmInk` — every Realm with its holder's ink key (THR-1902, plan § D12). */
export interface MapRealmInkVM {
  realms: MapRealmInkRow[];
}
