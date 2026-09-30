// @vitest-environment jsdom
/**
 * THR-1685 — a reputation chip about a person names the person, not the town.
 *
 * **Browser-verify substitution: jsdom-render — unattended run, no startable dev
 * server** (`Docs/canon/verification-gates.md` § Browser-verify). The Done-when
 * is about the tag's *text*, so render assertions are the stronger evidence: they
 * can prove the settlement's name is absent, which a screenshot cannot.
 *
 * The change under test is the real authored one — The Mason's Commission's
 * "The Inspector's Trust" chip, `reputation with {target}` anchored on
 * `$cast:inspector` — run through the same graph-holding collaborators both
 * adapters pass, on a board draw (the action targets the town, as
 * `phaseAgentDecision` builds it when the entry has no target agent). The noun
 * is then drawn exactly as `EncounterVeil`'s chip block draws it.
 */

import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { buildAftermathConsequences } from '../buildAftermathConsequences';
import {
  buildChipAnchorNameResolver,
  buildChipAnchorResolver,
} from '../chipCollaborators';
import { NarrativeSegments } from '../../NarrativeSegments';
import { WorldGraph } from '../../../../../engine/graph';
import { MASONS_COMMISSION_TEMPLATE } from '../../../../../data/encounters/masons-commission';
import type { EncounterAftermathChange, UnifiedAction } from '../../../../../types/unifiedAction';

afterEach(cleanup);

const TOWN = 'loc.ardenmor.3';
const INSPECTOR = 'actor.inspector.12';
const MASON = 'agent.mason.1';

function buildGraph(): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({ id: TOWN, type: 'location', name: 'Ardenmor', properties: {} });
  graph.addNode({ id: INSPECTOR, type: 'actor', name: 'Maud Harrow', properties: { actorType: 'individual' } });
  graph.addNode({ id: MASON, type: 'actor', name: 'Bryn Ashford', properties: { actorType: 'individual' } });
  return graph;
}

/** A board draw: the action targets the location, the inspector is cast. */
const boardDraw = {
  actionId: 'ua_masons',
  actorId: MASON,
  templateId: MASONS_COMMISSION_TEMPLATE.id,
  targetId: TOWN,
  supportBindings: [{
    key: 'inspector',
    nodeId: INSPECTOR,
    kind: 'actor',
    delivery: 'existing',
    persistence: 'persistent',
    reused: true,
  }],
} as unknown as UnifiedAction;

/** Every authored change on the template whose noun is anchored on `anchor`. */
function authoredChangesAnchoredOn(anchor: string): EncounterAftermathChange[] {
  const found: EncounterAftermathChange[] = [];
  const walk = (value: unknown): void => {
    if (!value || typeof value !== 'object') return;
    if (Array.isArray(value)) { value.forEach(walk); return; }
    const record = value as Record<string, unknown>;
    const noun = record.stateNoun as { entityId?: string } | undefined;
    if (typeof record.kind === 'string' && noun?.entityId === anchor) {
      found.push(record as unknown as EncounterAftermathChange);
    }
    Object.values(record).forEach(walk);
  };
  walk(MASONS_COMMISSION_TEMPLATE.aftermathConfig);
  return found;
}

/** The scene's reading of `{target}` on a board draw: the town. */
const sceneEnrich = (text: string) => text.replace(/\{target\}/g, 'Ardenmor');

function chipsFor(changes: EncounterAftermathChange[]) {
  const graph = buildGraph();
  return buildAftermathConsequences({
    changes,
    enrich: sceneEnrich,
    link: (id, text) => ({ id, segments: [{ text }] }),
    resolveAnchor: buildChipAnchorResolver(graph, boardDraw),
    anchorNameFor: buildChipAnchorNameResolver(graph),
  });
}

/** Draw the noun as `EncounterVeil`'s chip block does. */
function renderNoun(chip: ReturnType<typeof chipsFor>[number]) {
  render(
    <NarrativeSegments
      paragraph={{
        id: `${chip.id}-noun`,
        segments: [{
          text: chip.nounLabel!,
          emphasis: 'accent',
          tooltipId: chip.nounTooltipId,
          entityId: chip.nounEntityId,
          entityKind: chip.nounEntityKind,
        }],
      }}
      openEntity={() => undefined}
      linkColor="#d9a441"
      underlineColor="#7a5c22"
      plainColor="#e8ddc9"
      testIdPrefix="consequence-chip-noun-bond"
    />,
  );
  return screen.getByTestId('consequence-chip-noun-bond-seg-0');
}

describe('THR-1685 · the Inspector\'s Trust chip on a board draw', () => {
  const inspectorChanges = authoredChangesAnchoredOn('$cast:inspector');

  it('finds the authored chip the ticket names (premise, asserted)', () => {
    expect(inspectorChanges.length).toBeGreaterThan(0);
    expect(inspectorChanges[0].stateNoun?.text).toBe('reputation with {target}');
  });

  it('renders the inspector\'s name in the tag, and never the town\'s', () => {
    const chip = chipsFor([inspectorChanges[0]])[0];
    const noun = renderNoun(chip);
    expect(noun.textContent).toBe('REPUTATION WITH MAUD HARROW');
    expect(noun.textContent).not.toContain('ARDENMOR');
    // The noun still routes to the inspector (Law 56 clause 2) — unchanged.
    expect(chip.nounEntityId).toBe(INSPECTOR);
    expect(chip.delta?.label).toContain('Maud Harrow');
  });

  it('every inspector-anchored chip on the template reads the inspector', () => {
    for (const chip of chipsFor(inspectorChanges)) {
      expect(chip.nounLabel).toBe('REPUTATION WITH MAUD HARROW');
    }
  });

  it('the same noun anchored on $target keeps the scene reading (regression pin)', () => {
    const asTarget: EncounterAftermathChange = {
      ...inspectorChanges[0],
      stateNoun: { ...inspectorChanges[0].stateNoun!, entityId: '$target', visualKind: 'location' },
    };
    const noun = renderNoun(chipsFor([asTarget])[0]);
    expect(noun.textContent).toBe('REPUTATION WITH ARDENMOR');
  });
});
