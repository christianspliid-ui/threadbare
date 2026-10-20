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
 * THR-1901 (D10): the minimap sits in the same corner, above the cluster — open by default
 * on a wide canvas, else folded into the cluster's fifth button; it hides with the corner.
 *
 * THR-1878 (Lenses I): the lens that is on comes from GameScreenState; a Dominion lens
 * reaches HexMapV2 as `dominionLens`, every other lens as one `hexLens` view model drawn
 * by the generic hex layer. The hex click passes through unchanged (D11).
 *
 * THR-1892 (plan THR-1877 § D5, § D9): the map side of the Stage lives here. While a moment
 * plays on the Stage the map dims with its hex lit (`useStageCamera`), and the map's HTML
 * overlays and corner controls hide — the map holds still, so they would do nothing (Law 25).
 * The lens bar stays, under the panel, with its lens pressed.
 */
import { useCallback, useMemo, type RefObject } from 'react';
import type { GameState } from '../../../types/gameState';
import type { HexCoord } from '../../../types';
import type { VisibilityMap } from '../../../types/visibility';
import type { HarvestResult } from '../../../engine/cycleEnd';
import type { ThreadCategory } from '../../../engine/retinue';
import HexMapV2 from '../../HexMapV2/HexMapV2';
import type { HexMapV2Handle, HexMapV2Props } from '../../HexMapV2/HexMapV2';
import { CAMERA_CONSTANTS } from '../../HexMapV2/camera/D3ZoomCamera';
import { MapControls } from '../../HexMapV2/chrome/MapControls';
import { MapCornerChrome } from '../../HexMapV2/chrome/MapCornerChrome';
import { Minimap } from '../../HexMapV2/chrome/Minimap';
import { useMinimapOpen } from '../../HexMapV2/chrome/minimapState';
import { mapMinimapSelector } from '../../../engine/views/map/minimap';
import { readView } from '../../../engine/views/readView';
import { hexKey } from '../../../lib/hexKey';
import { MAP_PAN_DIRECTIONS, type MapCommandId } from '../../../data/map-commands';
import { resolveFirstHex, resolveSeatHex } from '../../../engine/views/map/focusTargets';
import { useMapHotkeys } from './useMapHotkeys';
import { MapLensSwitch } from '../../HexMapV2/chrome/MapLensSwitch';
import type { MapLensSwitchProps } from '../../HexMapV2/chrome/MapLensSwitch';
import type { MapLensId } from '../../../data/map-lenses';
import type { HexLensVM } from '../../../engine/views/lenses/lensTypes';
import { MapAnchoredDialogs } from '../hosts/DialogHost';
import type { MapAnchoredDialogsProps } from '../hosts/DialogHost';
import { useGameScreenState } from '../frame/GameScreenState';
import { isStageOpen } from '../stage/stageState';
import { useStageCamera } from '../stage/useStageCamera';

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
  /** THR-1914 — an armed card's lit hexes (the lens is suppressed meanwhile), or null. */
  armedHighlight?: HexMapV2Props['armedHighlight'];
  setMapLensFromBar: MapLensSwitchProps['onChange'];
  dominionBandColors: MapLensSwitchProps['bandColors'];
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
  armedHighlight = null,
  setMapLensFromBar,
  dominionBandColors,
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

  // THR-1901 — the minimap: open or folded (the player's choice kept), and its world in small.
  const { open: minimapOpen, toggle: toggleMinimap } = useMinimapOpen(hexMapRef);
  const firstHexKey = firstHex ? hexKey(firstHex.col, firstHex.row) : null;
  const minimapVM = readView(runtime, gameState, mapMinimapSelector, { fogOff: fogDisabled, firstHex: firstHexKey }, tiles);

  // THR-1900 — one runner for every map command, so a button and its key cannot disagree.
  const runMapCommand = useCallback((id: MapCommandId) => {
    if (id === 'toggle_minimap') {
      toggleMinimap();
      return;
    }
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
  }, [hexMapRef, firstHex, seatHex, toggleMinimap]);

  // THR-1892 — the Stage drives the map through GameScreenState; the Stage holds no handle.
  const { state: screen, setStage } = useGameScreenState();
  const stageOpen = isStageOpen(screen.stage);
  useStageCamera(hexMapRef, screen.stage, setStage);
  // The map holds still under the Stage: its keys rest too.
  useMapHotkeys(runMapCommand, !stageOpen);

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
        overlayOpen={scryVisible || harvestResult !== null || stageOpen}
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
        armedHighlight={armedHighlight}
        firstHex={firstHex}
        seatHex={seatHex}
        tick={gameState.tick}
      />

      {/* THR-1900 / THR-1901 — the bottom-right corner: the minimap above the control cluster */}
      {!stageOpen && (
        <MapCornerChrome>
          {minimapOpen && <Minimap vm={minimapVM} hexMapRef={hexMapRef} />}
          <MapControls
            hexMapRef={hexMapRef}
            hasFocusTarget={firstHex !== null || seatHex !== null}
            onCommand={runMapCommand}
            minimapOpen={minimapOpen}
          />
        </MapCornerChrome>
      )}

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
