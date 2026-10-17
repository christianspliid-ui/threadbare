/**
 * ArmySheet (THR-1023) — the detail surface for a raised army, built to the same
 * artifact-representation pattern THR-1009 gave `ArtifactSheet`: **canonical
 * visual + identity block + player-relevant information**.
 *
 * Until THR-1023 this was a stub reading "Full army sheet coming in a future
 * update" — a live-looking link to an empty page (UI Law 21's dead-link clause).
 *
 * **Armies are a live subject, contrary to THR-1023's premise.** That ticket
 * recorded "a seeded medium world at tick 12 holds zero army nodes
 * (`getNodesByType('army').length === 0`)" and reasoned there was nothing to
 * design against. That query asks the wrong noun: per `types/army.ts`, armies
 * are `actor` nodes carrying an `armyState` property bag, not `army`-typed
 * nodes, so the check could only ever return 0. Asking the right question —
 * actors with `armyState` — a seed-42 medium world holds a live host by tick 60
 * ("The Iron Covenant — Host", marching to take Ardenmor Keep). Armies are rare
 * in a short peacetime run, not unreachable: `factionAmbitions.maybeSpawnArmy`
 * raises one whenever a faction pursues a military ambition. So the category
 * keeps its route and gets a real sheet.
 *
 * **What is deliberately NOT rendered:** every scalar in `ArmyState` —
 * `headcount` (10000), `cohesion` (94.15), `cohesionMax`, `maintenanceCost`,
 * `supply`, `supplyMax`, `supplyHops`, `raisedTick`, and the objective's
 * `estimatedAttrition`. Law 13 bars raw magnitudes from a mortal-facing surface,
 * and `types/army.ts` already commits to it for supply ("the larder scalar
 * behind this is private and never rendered"). The player gets size, condition,
 * provisioning and intent as words; the numbers stay in the debug Armies tab.
 *
 * NFP #4 (fail-soft): an unresolvable node, an army with no `armyState`, and one
 * with no objective each still render a visual, a name and a designed line.
 */

import React from 'react';
import { Modal } from '../shared/Modal';
import { EntityVisual } from '../shared/EntityVisual';
import {
  getArmyCohesionWord,
  getArmySizeName,
  getArmySupplyWord,
  armyObjectiveSentence,
  armyAimTemplate,
  scarceClauseOf,
  ARMY_NO_OBJECTIVE_COPY,
  ARMY_HOLD_COPY,
} from '../../data/army-words';
import { RESOURCE_DEFINITIONS } from '../../data/resource-content';
import { getResourceTierProse } from '../../data/resource-classes';
import { EntityLink } from '../shared/EntityLink';
import type { WorldGraph } from '../../engine/graph';
import type { AnyRef } from '../../types/contentRef';

interface Slot { id: string; name: string; entityRef: AnyRef }

/** Fill a war-aim template's `{town}` / `{enemy}` slots with links (UI Law 21). */
function renderTemplate(template: string, slots: Record<string, Slot | null>): React.ReactNode[] {
  return template.split(/({town}|{enemy})/).map((part, i) => {
    const key = part === '{town}' ? 'town' : part === '{enemy}' ? 'enemy' : null;
    if (!key) return <React.Fragment key={i}>{part}</React.Fragment>;
    const slot = slots[key];
    return slot
      ? <EntityLink key={i} id={slot.id} name={slot.name} entityRef={slot.entityRef} />
      : <React.Fragment key={i}>{key}</React.Fragment>;
  });
}

/**
 * THR-1933 — the war-aim line: why this army marches where it does, or why it holds.
 * Null when the objective carries no reason (an old save, a campaign army) — the plain
 * objective sentence covers that.
 */
function warAimLine(
  graph: WorldGraph,
  armyId: string,
  armyState: Record<string, unknown>,
  objective: Record<string, unknown> | null,
): React.ReactNode[] | string | null {
  if (!objective) {
    if (armyState.holdReason !== 'no_enemy_in_reach') return null;
    const factionId = graph.getOutgoingEdges(armyId, 'member_of')[0]?.target;
    const locId = graph.getOutgoingEdges(armyId, 'located_at')[0]?.target;
    const parent = locId ? graph.getNode(locId)?.properties.parentLocationId : undefined;
    const placeId = typeof parent === 'string' ? parent : locId;
    const atHome = !!factionId && !!placeId
      && graph.getIncomingEdges(placeId, 'controls').some(e => e.source === factionId);
    return atHome ? ARMY_HOLD_COPY.home : ARMY_HOLD_COPY.away;
  }
  const townId = typeof objective.targetNodeId === 'string' ? objective.targetNodeId : null;
  const town = townId ? graph.getNode(townId) : undefined;
  if (!town) return null;

  let enemy: Slot | null = null;
  if (typeof objective.againstArmyId === 'string') {
    const enemyFactionId = graph.getOutgoingEdges(objective.againstArmyId, 'member_of')[0]?.target;
    const enemyFaction = enemyFactionId ? graph.getNode(enemyFactionId) : undefined;
    if (graph.getNode(objective.againstArmyId) && enemyFaction?.name) {
      enemy = { id: objective.againstArmyId, name: enemyFaction.name, entityRef: { kind: 'army', id: objective.againstArmyId } };
    }
  }

  const rid = typeof objective.reasonResourceId === 'string' ? objective.reasonResourceId : null;
  const attackerId = graph.getOutgoingEdges(armyId, 'member_of')[0]?.target;
  const template = armyAimTemplate({
    objectiveType: objective.type,
    reason: objective.reason,
    resourceName: rid ? (RESOURCE_DEFINITIONS[rid]?.name ?? rid).toLowerCase() : null,
    scarceClause: rid ? scarceClauseOf(rid, getResourceTierProse(rid, 'scarce')) : null,
    attackerFactionName: attackerId ? (graph.getNode(attackerId)?.name ?? null) : null,
    hasNamedEnemy: enemy !== null,
  });
  if (!template) return null;
  return renderTemplate(template, {
    town: { id: town.id, name: town.name, entityRef: { kind: 'location', id: town.id } },
    enemy,
  });
}

interface ArmySheetProps {
  name: string;
  onClose: () => void;
  /** Graph node id — enables the visual and the information block. */
  armyId?: string;
  graph?: WorldGraph | null;
}

/** Copy shown when the node carries no army state at all (a designed state, Law 4). */
const NO_DETAIL_COPY = 'Nothing further is recorded of this force yet.';

export const ArmySheet = React.memo(function ArmySheet({
  name,
  onClose,
  armyId,
  graph,
}: ArmySheetProps) {
  const node = armyId && graph ? graph.getNode(armyId) : undefined;
  const armyState = (node?.properties?.armyState ?? null) as Record<string, unknown> | null;

  const sizeName = getArmySizeName(armyState?.size);
  const cohesionWord = getArmyCohesionWord(armyState?.cohesion, armyState?.cohesionMax);
  const supplyWord = getArmySupplyWord(armyState?.supplyTier);

  // Objective → a sentence. The target id is resolved to its name here; the
  // phrasing table stays graph-free.
  const objective = (armyState?.objective ?? null) as Record<string, unknown> | null;
  const targetId = typeof objective?.targetNodeId === 'string' ? objective.targetNodeId : null;
  const targetName = targetId && graph ? (graph.getNode(targetId)?.name ?? null) : null;
  const objectiveSentence = armyObjectiveSentence(objective?.type, targetName);
  // THR-1933 — the war-aim line (reason or hold) wins when the army carries one.
  const aimLine = armyId && graph && armyState ? warAimLine(graph, armyId, armyState, objective) : null;

  // An army with state but no readable march still gets a designed line.
  const prose = aimLine ?? objectiveSentence ?? (armyState ? ARMY_NO_OBJECTIVE_COPY : NO_DETAIL_COPY);
  const proseIsAuthored = aimLine !== null || objectiveSentence !== null;

  const identityParts = [sizeName, cohesionWord, supplyWord].filter(
    (part): part is string => part !== null,
  );

  return (
    <Modal open={true} onClose={onClose} aria-label={`${name} profile`}>
      <Modal.Header onClose={onClose}>{name}</Modal.Header>
      <Modal.Body>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {/* Canonical visual. `kind: 'army'` is passed explicitly — an army node is
              an `actor`, which the resolver's own derivation would read as a person
              and render as a name initial. The army kind falls to its designed
              crossed-swords glyph tile until a war-art registry exists. */}
          {armyId && (
            <EntityVisual
              size="hero"
              entity={{ id: armyId, kind: 'army', name }}
              graph={graph ?? null}
              data-testid="army-sheet-visual"
            />
          )}

          {/* Identity block — size, condition and provisioning, all in words. */}
          {identityParts.length > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                fontSize: 'var(--text-xs)',
                fontFamily: 'var(--font-display)',
                fontVariant: 'small-caps',
                letterSpacing: '0.05em',
                color: 'var(--text-tertiary)',
              }}
              data-testid="army-sheet-identity"
            >
              {identityParts.map((part, i) => (
                <React.Fragment key={part}>
                  {i > 0 && <span aria-hidden="true">·</span>}
                  <span>{part}</span>
                </React.Fragment>
              ))}
            </div>
          )}

          {/* Information — what this force is doing, or the designed absence line. */}
          <p
            style={{
              margin: 0,
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-base)',
              lineHeight: 1.5,
              color: proseIsAuthored ? 'var(--text-secondary)' : 'var(--text-muted)',
              fontStyle: proseIsAuthored ? 'normal' : 'italic',
            }}
            data-testid="army-sheet-prose"
          >
            {prose}
          </p>
        </div>
      </Modal.Body>
    </Modal>
  );
});

ArmySheet.displayName = 'ArmySheet';
