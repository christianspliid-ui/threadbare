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
  ARMY_NO_OBJECTIVE_COPY,
} from '../../data/army-words';
import { armyAimView, type WarAimSlot } from '../../engine/warAims/sheetView';
import { EntityLink } from '../shared/EntityLink';
import type { WorldGraph } from '../../engine/graph';

/**
 * THR-1933 — the war-aim line (why it marches, or why it holds), with the town and the
 * enemy host as links (UI Law 21). The graph reads live in `armyAimView` (NFP #2).
 */
function warAimLine(graph: WorldGraph, armyId: string): React.ReactNode[] | null {
  const view = armyAimView(graph, armyId);
  if (!view) return null;
  const slots: Record<string, WarAimSlot | null> = view.slots;
  return view.template.split(/({town}|{enemy})/).map((part, i) => {
    const key = part === '{town}' ? 'town' : part === '{enemy}' ? 'enemy' : null;
    if (!key) return <React.Fragment key={i}>{part}</React.Fragment>;
    const slot = slots[key];
    return slot
      ? <EntityLink key={i} id={slot.id} name={slot.name} entityRef={{ kind: slot.kind, id: slot.id }} />
      : <React.Fragment key={i}>{key}</React.Fragment>;
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
  const aimLine = armyId && graph && armyState ? warAimLine(graph, armyId) : null;

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
