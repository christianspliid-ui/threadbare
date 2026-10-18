/**
 * GameMap — the game screen's world map: HexMapV2, the map lens switch, the living
 * world summary bar and the dialogs anchored inside the map area.
 *
 * THR-1881 (the GameView split, step d): the `viewLevel === 'world'` block moved out
 * of `GameView.tsx` verbatim. The props carry GameView's own names. GameView mounts
 * this host where the block stood, inside the map area's `relative` box and after the
 * toast stack, so every absolutely positioned child (lens switch, summary bar, agenda
 * picker, intervention confirm, effect choice set) keeps its place at 1920×1080.
 *
 * THR-1900 (plan THR-1878 D6–D9): the map's camera commands live here — the control
 * cluster in `MapCornerChrome` (bottom-right) and the map keys (`useMapHotkeys`), both
 * running `MAP_COMMANDS` through one `runMapCommand`; the First and the seat are passed to
 * HexMapV2 for the opening view.
 *
 * THR-1878 (Lenses I): the lens that is on comes from GameScreenState; a Dominion lens
 * reaches HexMapV2 as `dominionLens`, every other lens as one `hexLens` view model drawn
 * by the generic hex layer. The hex click passes through unchanged (D11).
 */
import { useCallback, useMemo, type RefObject } from 'react';
import type { GameState } from '../../../types/gameState';
import type { HexCoord } from '../../../types';
import type { VisibilityMap } from '../../../types/visibility';
import type { LocationActivitySummary } from '../../../types/locationActivity';
import type { HarvestResult } from '../../../engine/cycleEnd';
import type { ThreadCategory } from '../../../engine/retinue';
import HexMapV2 from '../../HexMapV2/HexMapV2';
import type { HexMapV2Handle, HexMapV2Props } from '../../HexMapV2/HexMapV2';
import { CAMERA_CONSTANTS } from '../../HexMapV2/camera/D3ZoomCamera';
import { MapControls } from '../../HexMapV2/chrome/MapControls';
import { MapCornerChrome } from '../../HexMapV2/chrome/MapCornerChrome';
import { MAP_PAN_DIRECTIONS, type MapCommandId } from '../../../data/map-commands';
import { resolveFirstHex, resolveSeatHex } from '../../../engine/views/map/focusTargets';
import { useMapHotkeys } from './useMapHotkeys';
import { MapLensSwitch } from '../../HexMapV2/chrome/MapLensSwitch';
import type { MapLensSwitchProps } from '../../HexMapV2/chrome/MapLensSwitch';
import type { MapLensId } from '../../../data/map-lenses';
import type { HexLensVM } from '../../../engine/views/lenses/lensTypes';
import { LiveLocationBar } from '../LiveLocationBar';
import { MapAnchoredDialogs } from '../hosts/DialogHost';
import type { MapAnchoredDialogsProps } from '../hosts/DialogHost';

export interface GameMapProps extends MapAnchoredDialogsProps {
  gameState: GameState;
  hexMapRef: RefObject<HexMapV2Handle>;
  // HexMapV2
  tiles: HexMapV2Props['tiles'];
  COLS: number;
  ROWS: number;
  hoveredHex: HexCoord | null;
  selectedHexCoord: HexCoord | null;
  selectedHex: HexCoord | null;
  riverPaths: HexMapV2Props['riverPaths'];
  lakeIds: HexMapV2Props['lakeIds'];
  areaProjection: HexMapV2Props['areaProjection'];
  realmProjection: HexMapV2Props['realmProjection'];
  realmHolderIndex: HexMapV2Props['realmHolderIndex'];
  locationNodes: HexMapV2Props['locations'];
  anomalyNodes: HexMapV2Props['anomalies'];
  roadPaths: HexMapV2Props['roadPaths'];
  agentRenderDataWithActivity: HexMapV2Props['agents'];
  armyRenderData: HexMapV2Props['armies'];
  reachSignatureMarkers: HexMapV2Props['reachSignatureMarkers'];
  battleRenderData: HexMapV2Props['battles'];
  threadLineData: HexMapV2Props['threadLines'];
  companyRenderData: HexMapV2Props['companies'];
  activityIconData: HexMapV2Props['activityIcons'];
  attentionRatio: HexMapV2Props['attentionRatio'];
  fogDisabled: boolean;
  effectiveVisibilityMap: VisibilityMap;
  showOrganicShore: HexMapV2Props['showOrganicShore'];
  scryVisible: boolean;
  harvestResult: HarvestResult | null;
  sphereColor: HexMapV2Props['selectionColor'];
  avatarTargetHex: HexMapV2Props['moveDestinationHex'];
  setCameraCenter: HexMapV2Props['onCameraCenterHex'];
  handleHexClickFull: HexMapV2Props['onHexClick'];
  setHoveredHex: HexMapV2Props['onHexHover'];
  handleThreadNodeSelect: (nodeId: string, category: ThreadCategory) => void;
  handleOpenProfileModal: (nodeId: string, category: ThreadCategory) => void;
  /** THR-1911 (§ D10): a place label opens the place in the Inspector. */
  onPlaceLabelClick?: (locationId: string) => void;
  hexStrategicOverlays: HexMapV2Props['strategicOverlays'];
  locationActivityByHex: HexMapV2Props['locationActivityMap'];
  spotlightThreadColor: HexMapV2Props['spotlightThreadColor'];
  cameraGateCallback: HexMapV2Props['shouldCenterOnAgent'];
  dominionLensForMap: HexMapV2Props['dominionLens'];
  dominionTooltip: HexMapV2Props['dominionTooltip'];
  // Map lens bar (THR-1878): the lens that is on, whether a moment holds it off, the
  // hex lens's prepared view (null unless a hex lens is on), and the bar's writer.
  activeLens: MapLensId | null;
  lensSuppressed: boolean;
  hexLens: HexLensVM | null;
  setMapLensFromBar: MapLensSwitchProps['onChange'];
  dominionBandColors: MapLensSwitchProps['bandColors'];
  // Living World summary bar
  locationActivitySummaries: Map<string, LocationActivitySummary>;
}

export function GameMap({
  gameState,
  setGameState,
  runtime,
  hexMapRef,
  tiles,
  COLS,
  ROWS,
  hoveredHex,
  selectedHexCoord,
  selectedHex,
  riverPaths,
  lakeIds,
  areaProjection,
  realmProjection,
  realmHolderIndex,
  locationNodes,
  anomalyNodes,
  roadPaths,
  agentRenderDataWithActivity,
  armyRenderData,
  reachSignatureMarkers,
  battleRenderData,
  threadLineData,
  companyRenderData,
  activityIconData,
  attentionRatio,
  fogDisabled,
  effectiveVisibilityMap,
  showOrganicShore,
  scryVisible,
  harvestResult,
  sphereColor,
  avatarTargetHex,
  setCameraCenter,
  handleHexClickFull,
  setHoveredHex,
  handleThreadNodeSelect,
  handleOpenProfileModal,
  onPlaceLabelClick,
  hexStrategicOverlays,
  locationActivityByHex,
  spotlightThreadColor,
  cameraGateCallback,
  dominionLensForMap,
  dominionTooltip,
  activeLens,
  lensSuppressed,
  hexLens,
  setMapLensFromBar,
  dominionBandColors,
  locationActivitySummaries,
  agendaPickerOpen,
  pendingAgendas,
  wheelSlots,
  pendingIntervention,
  handleAgendaSelect,
  handleAgendaCancel,
  selectedAgenda,
  handleInterventionConfirm,
  handleInterventionCancel,
  pendingChoice,
  setPendingChoice,
}: GameMapProps) {
  // THR-1900 — what "Centre on my First" and the opening view centre on.
  const firstHex = useMemo(
    () => resolveFirstHex(gameState.graph, gameState.ascendantId, agentRenderDataWithActivity),
    [gameState.graph, gameState.ascendantId, agentRenderDataWithActivity],
  );
  const seatHex = useMemo(
    () => resolveSeatHex(gameState.graph, gameState.ascendantId),
    // The graph is mutated in place, so the tick is what re-reads the seat once a beat sets it.
    [gameState.graph, gameState.ascendantId, gameState.tick],
  );

  // THR-1900 — one runner for every map command, so a button and its key cannot disagree.
  const runMapCommand = useCallback((id: MapCommandId) => {
    const map = hexMapRef.current;
    if (!map) return;
    const pan = MAP_PAN_DIRECTIONS[id];
    if (pan) {
      map.panBy(pan[0] * CAMERA_CONSTANTS.PAN_STEP_FRACTION, pan[1] * CAMERA_CONSTANTS.PAN_STEP_FRACTION);
      return;
    }
    switch (id) {
      case 'zoom_in':
        map.zoomBy(CAMERA_CONSTANTS.ZOOM_STEP_FACTOR);
        break;
      case 'zoom_out':
        map.zoomBy(1 / CAMERA_CONSTANTS.ZOOM_STEP_FACTOR);
        break;
      case 'centre_first':
        if (firstHex) map.focusOn(firstHex, 'centre_first');
        else if (seatHex) map.focusOn(seatHex, 'centre_seat');
        break;
      case 'show_known_land':
        map.showKnownLand();
        break;
    }
  }, [hexMapRef, firstHex, seatHex]);

  useMapHotkeys(runMapCommand);

  return (
    <>
      <HexMapV2
        ref={hexMapRef}
        tiles={tiles}
        cols={COLS}
        rows={ROWS}
        seed={gameState.seed}
        hoveredHex={hoveredHex}
        selectedHex={selectedHexCoord ?? selectedHex}
        riverPaths={riverPaths}
        lakeIds={lakeIds}
        areaProjection={areaProjection}
        realmProjection={realmProjection}
        realmHolderIndex={realmHolderIndex}
        locations={locationNodes}
        anomalies={anomalyNodes}
        roadPaths={roadPaths}
        agents={agentRenderDataWithActivity}
        armies={armyRenderData}
        reachSignatureMarkers={reachSignatureMarkers}
        battles={battleRenderData}
        threadLines={threadLineData}
        companies={companyRenderData}
        activityIcons={activityIconData}
        attentionRatio={attentionRatio}
        visibilityMap={fogDisabled ? undefined : effectiveVisibilityMap}
        fogEnabled={!fogDisabled}
        showOrganicShore={showOrganicShore}
        overlayOpen={scryVisible || harvestResult !== null}
        selectionColor={sphereColor}
        moveDestinationHex={avatarTargetHex}
        onCameraCenterHex={setCameraCenter}
        onHexClick={handleHexClickFull}
        onHexHover={setHoveredHex}
        onAgentClick={(agentId) => handleThreadNodeSelect(agentId, 'agent')}
        onArmyClick={(armyId) => handleOpenProfileModal(armyId, 'army')}
        onPlaceLabelClick={onPlaceLabelClick}
        strategicOverlays={hexStrategicOverlays}
        locationActivityMap={locationActivityByHex}
        spotlightedAgentId={gameState.spotlightedAgent}
        spotlightThreadColor={spotlightThreadColor}
        shouldCenterOnAgent={cameraGateCallback}
        dominionLens={dominionLensForMap}
        dominionTooltip={dominionTooltip}
        hexLens={lensSuppressed ? null : hexLens}
        firstHex={firstHex}
        seatHex={seatHex}
        tick={gameState.tick}
      />

      {/* THR-1900 — the bottom-right corner: the control cluster (the minimap joins it, THR-1901) */}
      <MapCornerChrome>
        <MapControls
          hexMapRef={hexMapRef}
          hasFocusTarget={firstHex !== null || seatHex !== null}
          onCommand={runMapCommand}
        />
      </MapCornerChrome>

      {/* THR-1878 — the map lens bar and legend (keys 1–4 from MAP_LENSES); hidden with no god */}
      {gameState.ascendantId && (
        <MapLensSwitch
          active={activeLens}
          suppressed={lensSuppressed}
          onChange={setMapLensFromBar}
          bandColors={dominionBandColors}
          hexLegend={hexLens ? { head: hexLens.legend.head, headNote: hexLens.legend.headNote ?? null, lines: hexLens.legend.lines, emptyLine: hexLens.emptyLine } : null}
        />
      )}

      {/* Living World summary bar — top-3 active locations (THR-127) */}
      <LiveLocationBar
        summaries={locationActivitySummaries}
        tick={gameState.tick}
        onCenterOnHex={(col, row) => hexMapRef.current?.focusOn({ col, row })}
      />

      {/* Agenda picker, intervention confirm, effect choice set (THR-1881 step b) */}
      <MapAnchoredDialogs
        gameState={gameState}
        setGameState={setGameState}
        runtime={runtime}
        agendaPickerOpen={agendaPickerOpen}
        pendingAgendas={pendingAgendas}
        wheelSlots={wheelSlots}
        pendingIntervention={pendingIntervention}
        handleAgendaSelect={handleAgendaSelect}
        handleAgendaCancel={handleAgendaCancel}
        selectedAgenda={selectedAgenda}
        handleInterventionConfirm={handleInterventionConfirm}
        handleInterventionCancel={handleInterventionCancel}
        pendingChoice={pendingChoice}
        setPendingChoice={setPendingChoice}
      />
    </>
  );
}
