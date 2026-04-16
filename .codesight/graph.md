# Dependency Graph

## Most Imported Files (change these carefully)

- `src\engine\graph.ts` — imported by **389** files
- `src\types\gameState.ts` — imported by **192** files
- `src\types\index.ts` — imported by **191** files
- `src\types\traits.ts` — imported by **173** files
- `src\engine\traceBuffer.ts` — imported by **113** files
- `src\types\encounter.ts` — imported by **106** files
- `src\types\agent.ts` — imported by **99** files
- `src\types\graph.ts` — imported by **89** files
- `src\types\influence.ts` — imported by **86** files
- `src\types\unifiedAction.ts` — imported by **83** files
- `src\lib\hexMath.ts` — imported by **55** files
- `src\types\trace.ts` — imported by **53** files
- `src\types\faction.ts` — imported by **51** files
- `src\types\disposition.ts` — imported by **46** files
- `src\data\sphereIcons.ts` — imported by **43** files
- `src\types\effects.ts` — imported by **39** files
- `src\lib\prng.ts` — imported by **37** files
- `src\components\HexMapV2\scene\RenderLayers.ts` — imported by **37** files
- `src\data\encounter-content.ts` — imported by **36** files
- `src\types\rarity.ts` — imported by **34** files

## Import Map (who imports what)

- `src\engine\graph.ts` ← `src\components\AgentInfoCard\AgentInfoCard.tsx`, `src\components\Game\AgentInfoCard.tsx`, `src\components\Game\debug\ArmiesTabContent.tsx`, `src\components\Game\debug\BondOverlay.tsx`, `src\components\Game\debug\DebugTabContent.tsx` +384 more
- `src\types\gameState.ts` ← `scripts\cli.ts`, `scripts\playtest-format.ts`, `scripts\playtest.ts`, `scripts\__tests__\playtest-format.test.ts`, `src\components\Game\AscendantSheet.tsx` +187 more
- `src\types\index.ts` ← `scripts\cli.ts`, `scripts\playtest.ts`, `src\components\Game\ActionCard.tsx`, `src\components\Game\DoomBar.tsx`, `src\components\Game\InterventionConfirm.tsx` +186 more
- `src\types\traits.ts` ← `src\components\CMS\registry.ts`, `src\components\Game\AgentDetailPanel.tsx`, `src\components\Game\AgentInfoCard.tsx`, `src\components\Game\AscendantSheet.tsx`, `src\components\Game\AscendantSheet.tsx` +168 more
- `src\engine\traceBuffer.ts` ← `src\components\Game\DebugPanel.tsx`, `src\components\Game\GameView.tsx`, `src\components\Game\hooks\useAvatarData.ts`, `src\components\Game\__tests__\DebugPanel-intervention.test.tsx`, `src\components\Game\__tests__\DebugPanel-modifier.test.tsx` +108 more
- `src\types\encounter.ts` ← `src\components\Game\debug\DebugTabContent.tsx`, `src\components\Game\debug\EncounterCacheView.tsx`, `src\components\Game\debug\EncounterCacheView.tsx`, `src\components\Game\DebugPanel.tsx`, `src\components\Game\encounter-stage\adapters\buildSimpleEncounterStageModel.ts` +101 more
- `src\types\agent.ts` ← `src\data\action-template-content.ts`, `src\data\agenda-content.ts`, `src\data\counter-argument-content.ts`, `src\data\domain-words.ts`, `src\data\narrative-content.ts` +94 more
- `src\types\graph.ts` ← `scripts\cli.ts`, `src\components\Codex\codexRegistry.ts`, `src\components\Game\debug\BondOverlay.tsx`, `src\components\Game\debug\EncounterCacheView.tsx`, `src\components\Game\debug\RelationshipGraph.tsx` +84 more
- `src\types\influence.ts` ← `src\App.tsx`, `src\components\Ascendant\ArchetypeCard.tsx`, `src\components\Ascendant\AscendantSelection.tsx`, `src\components\Game\AscendantSheet.tsx`, `src\components\Game\contexts\ScryContext.tsx` +81 more
- `src\types\unifiedAction.ts` ← `src\components\Game\ActionDrawer.tsx`, `src\components\Game\ActionDrawer.tsx`, `src\components\Game\encounter-stage\adapters\buildGateDutyEncounterStageModel.ts`, `src\components\Game\encounter-stage\adapters\__tests__\buildUnifiedEncounterStageModel.test.ts`, `src\components\Game\encounter-stage\__tests__\buildGateDutyEncounterStageModel.test.ts` +78 more
