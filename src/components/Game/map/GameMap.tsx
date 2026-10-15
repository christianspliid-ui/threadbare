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
 * Nothing here changes what the game does.
 */
import type { RefObject } from 'react';
import type { GameState } from '../../../types/gameState';
import type { HexCoord } from '../../../types';
import type { VisibilityMap } from '../../../types/visibility';
import type { LocationActivitySummary } from '../../../types/locationActivity';
import type { HarvestResult } from '../../../engine/cycleEnd';
import type { ThreadCategory } from '../../../engine/retinue';
import { hexToPixel } from '../../../lib/hexMath';
import HexMapV2 from '../../HexMapV2/HexMapV2';
import type { HexMapV2Handle, HexMapV2Props } from '../../HexMapV2/HexMapV2';
import { HEX_CONSTANTS } from '../../HexMapV2/scene/HexFillMesh';
import { MapLensSwitch } from '../../HexMapV2/chrome/MapLensSwitch';
import type { MapLensSwitchProps } from '../../HexMapV2/chrome/MapLensSwitch';
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
  locationNodes: HexMapV2Props['locations'];
  anomalyNodes: HexMapV2Props['anomalies'];
  roadPaths: HexMapV2Props['roadPaths'];
  agentRenderDataWithActivity: HexMapV2Props['agents'];
  armyRenderData: HexMapV2Props['armies'];
  reachSignatureMarkers: HexMapV2Props['reachSignatureMarkers'];
  rivalInfluenceMarkers: HexMapV2Props['rivalInfluenceMarkers'];
  tradeRouteLines: HexMapV2Props['tradeRouteLines'];
  routeTooltipsByHex: HexMapV2Props['routeTooltipsByHex'];
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
  hexStrategicOverlays: HexMapV2Props['strategicOverlays'];
  locationActivityByHex: HexMapV2Props['locationActivityMap'];
  spotlightThreadColor: HexMapV2Props['spotlightThreadColor'];
  cameraGateCallback: HexMapV2Props['shouldCenterOnAgent'];
  dominionLensForMap: HexMapV2Props['dominionLens'];
  dominionTooltip: HexMapV2Props['dominionTooltip'];
  // Map lens switch
  dominionLensOn: boolean;
  toggleMapLens: MapLensSwitchProps['onToggle'];
  dominionBandColors: MapLensSwitchProps['bandColors'];
  // Living World summary bar
  locationActivitySummaries: Map<string, LocationActivitySummary>;
  RETINUE_EYE_ZOOM_SCALE: number;
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
  locationNodes,
  anomalyNodes,
  roadPaths,
  agentRenderDataWithActivity,
  armyRenderData,
  reachSignatureMarkers,
  rivalInfluenceMarkers,
  tradeRouteLines,
  routeTooltipsByHex,
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
  hexStrategicOverlays,
  locationActivityByHex,
  spotlightThreadColor,
  cameraGateCallback,
  dominionLensForMap,
  dominionTooltip,
  dominionLensOn,
  toggleMapLens,
  dominionBandColors,
  locationActivitySummaries,
  RETINUE_EYE_ZOOM_SCALE,
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
        locations={locationNodes}
        anomalies={anomalyNodes}
        roadPaths={roadPaths}
        agents={agentRenderDataWithActivity}
        armies={armyRenderData}
        reachSignatureMarkers={reachSignatureMarkers}
        rivalInfluenceMarkers={rivalInfluenceMarkers}
        tradeRouteLines={tradeRouteLines}
        routeTooltipsByHex={routeTooltipsByHex}
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
        strategicOverlays={hexStrategicOverlays}
        locationActivityMap={locationActivityByHex}
        spotlightedAgentId={gameState.spotlightedAgent}
        spotlightThreadColor={spotlightThreadColor}
        shouldCenterOnAgent={cameraGateCallback}
        dominionLens={dominionLensForMap}
        dominionTooltip={dominionTooltip}
      />

      {/* THR-1750 — the map lens switch (lens one: Dominion), key 1 */}
      {gameState.ascendantId && (
        <MapLensSwitch
          active={dominionLensOn ? 'dominion' : null}
          onToggle={toggleMapLens}
          bandColors={dominionBandColors}
        />
      )}

      {/* AvatarHUD superseded by AscendantBar (THR-184) */}

      {/* Living World summary bar — top-3 active locations (THR-127) */}
      <LiveLocationBar
        summaries={locationActivitySummaries}
        tick={gameState.tick}
        onCenterOnHex={(col, row) => {
          if (!hexMapRef.current) return;
          const px = hexToPixel({ col, row }, HEX_CONSTANTS.HEX_SIZE);
          hexMapRef.current.centerOn(px.x, -px.y, RETINUE_EYE_ZOOM_SCALE);
        }}
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
