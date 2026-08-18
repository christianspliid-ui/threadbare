// @vitest-environment jsdom
/**
 * LocationProfileModal — artifact-representation pattern locks (THR-1023).
 *
 * Before THR-1023 this modal rendered "Full location profile coming in a future
 * update" for every place, reached from HexSidebar and HexDetailView — a
 * live-looking link to an empty page (UI Law 21). These tests fail against that
 * build.
 *
 * The fixture mirrors a real node: property names and values are taken from
 * `loc_0` in a seed-42 medium world (verified via CLI), including the raw
 * `prosperity` float the sheet must not surface.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LocationProfileModal } from '../LocationProfileModal';
import { WorldGraph } from '../../../engine/graph';
import { seedEncounterTraitDefinitions } from '../../../engine/traitDefinitionSeeding';
import { decayConditions } from '../../../engine/conditionDecay';
import { resolveAttachmentTemplateTooltip } from '../../../engine/attachmentTemplateIndex';
import {
  CONDITION_PASS_CLOSED_DURATION,
  CONDITION_STANDING_WELCOME_DURATION,
  LOCATION_CONDITION_IDS,
} from '../../../data/condition-trait-content';

function graphWithKeep(): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({
    id: 'loc_0',
    type: 'location',
    name: 'Ardenmor Keep',
    properties: {
      locationType: 'capital',
      locationSubtype: 'capital',
      terrain: 'temperate_forest',
      rarityTier: 1,
      archetypeName: 'Seat of Power',
      archetypeProseFlavor: 'power flows downhill from these walls',
      // Raw magnitudes the sheet must NOT surface (Law 13).
      prosperity: 48.508699108995636,
      importance: 0,
      populationLagTicks: 3,
    },
  } as never);
  return graph;
}

describe('LocationProfileModal — location representation (THR-1023)', () => {
  it('Law 21: renders real content, not a "coming soon" stub', () => {
    render(
      <LocationProfileModal
        name="Ardenmor Keep"
        locationId="loc_0"
        graph={graphWithKeep()}
        onClose={() => {}}
      />,
    );

    expect(screen.queryByText(/coming in a future update/i)).toBeNull();
    expect(screen.getByText('Power flows downhill from these walls.')).toBeTruthy();
  });

  it('carries its canonical visual (Law 1) and identity block', () => {
    render(
      <LocationProfileModal
        name="Ardenmor Keep"
        locationId="loc_0"
        graph={graphWithKeep()}
        onClose={() => {}}
      />,
    );

    expect(screen.getByTestId('location-profile-visual')).toBeTruthy();
    expect(screen.getByText('Capital')).toBeTruthy();
    expect(screen.getByText('Seat of Power')).toBeTruthy();
  });

  it('Law 13: surfaces no raw magnitude — prosperity, importance or tick counts', () => {
    const { container } = render(
      <LocationProfileModal
        name="Ardenmor Keep"
        locationId="loc_0"
        graph={graphWithKeep()}
        onClose={() => {}}
      />,
    );

    expect(container.textContent).not.toMatch(/48\.5/);
    expect(container.textContent).not.toMatch(/prosperity/i);
    expect(container.textContent).not.toMatch(/\d+%/);
  });

  it('Law 14: an unnamed subtype is omitted rather than printed as its key', () => {
    const graph = new WorldGraph();
    graph.addNode({
      id: 'loc_odd',
      type: 'location',
      name: 'The Nameless Place',
      properties: { locationSubtype: 'not_a_real_subtype', terrain: 'plateau' },
    } as never);

    const { container } = render(
      <LocationProfileModal
        name="The Nameless Place"
        locationId="loc_odd"
        graph={graph}
        onClose={() => {}}
      />,
    );

    expect(container.textContent).not.toMatch(/not_a_real_subtype/);
  });

  it('Law 14: a live-world null subtype prints nothing, not "null"', () => {
    const graph = new WorldGraph();
    graph.addNode({
      id: 'loc_null',
      type: 'location',
      name: 'Open Country',
      properties: { locationSubtype: null, terrain: 'grassland' },
    } as never);

    const { container } = render(
      <LocationProfileModal
        name="Open Country"
        locationId="loc_null"
        graph={graph}
        onClose={() => {}}
      />,
    );

    expect(container.textContent).not.toMatch(/null|undefined/);
  });

  it('NFP #4: an unresolvable node still renders a designed body, never a blank', () => {
    const { container } = render(
      <LocationProfileModal
        name="Lost Hold"
        locationId="missing_id"
        graph={new WorldGraph()}
        onClose={() => {}}
      />,
    );

    expect(screen.getByText(/Nothing further is recorded/i)).toBeTruthy();
    expect(container.textContent).not.toMatch(/undefined|null/);
  });

  it('NFP #4: renders without a graph at all (callers that pass only a name)', () => {
    const { container } = render(<LocationProfileModal name="Somewhere" onClose={() => {}} />);

    expect(screen.getByText(/Nothing further is recorded/i)).toBeTruthy();
    expect(container.textContent).not.toMatch(/undefined|null/);
  });
});

// ─── Active conditions (THR-1143) ────────────────────────────────────────────

/**
 * The panel is reader #3 of the location-condition primitive. These lock the two
 * things that make it a *reader* rather than decoration: it shows only what the
 * graph actually holds, and it stops showing it the moment the engine's own decay
 * loop removes the edge. The absence case is asserted alongside the presence case
 * because a section that always renders proves nothing about the data behind it.
 */
function graphWithConditions(opts?: { ticksRemaining?: number | null }): WorldGraph {
  const graph = graphWithKeep();
  seedEncounterTraitDefinitions(graph);
  const ticks = opts?.ticksRemaining;
  graph.addEdge({
    id: 'has_trait_loc_0_pass_closed',
    source: 'loc_0',
    target: 'trait.condition.location.pass_closed',
    type: 'has_trait',
    properties: {
      appliedAt: 10,
      durationTicks: CONDITION_PASS_CLOSED_DURATION,
      ...(ticks === null ? {} : { ticksRemaining: ticks ?? CONDITION_PASS_CLOSED_DURATION }),
    },
  } as never);
  return graph;
}

describe('LocationProfileModal — active conditions (THR-1143)', () => {
  it('lists a condition the place is carrying, by name', () => {
    render(
      <LocationProfileModal
        name="Ardenmor Keep"
        locationId="loc_0"
        graph={graphWithConditions()}
        onClose={() => {}}
      />,
    );

    expect(screen.getByTestId('location-profile-conditions')).toBeTruthy();
    expect(screen.getByText('Closed for the Season')).toBeTruthy();
  });

  it('Law 13/14: the remaining term reads in words — no ticks, no numerals', () => {
    render(
      <LocationProfileModal
        name="Ardenmor Keep"
        locationId="loc_0"
        graph={graphWithConditions({ ticksRemaining: 48 })}
        onClose={() => {}}
      />,
    );

    const section = screen.getByTestId('location-profile-conditions');
    expect(section.textContent).toContain('four days');
    // Scoped to the rows, not the section: the group count in the heading is the
    // one numeral Law 36 explicitly sanctions ("counts on the group header").
    const rows = section.textContent!.replace(/^Conditions \(\d+\)/, '');
    expect(rows).not.toMatch(/\d/);
    expect(rows).not.toMatch(/tick/i);
    // And never the raw template id (Law 14).
    expect(rows).not.toContain('trait.condition');
  });

  it('an indefinite condition reads as a state, not a blank or a zero', () => {
    render(
      <LocationProfileModal
        name="Ardenmor Keep"
        locationId="loc_0"
        graph={graphWithConditions({ ticksRemaining: null })}
        onClose={() => {}}
      />,
    );
    expect(screen.getByTestId('location-profile-conditions').textContent).toContain('until it lifts');
  });

  it('Law 25: renders no Conditions section at all when the place carries none', () => {
    render(
      <LocationProfileModal
        name="Ardenmor Keep"
        locationId="loc_0"
        graph={graphWithKeep()}
        onClose={() => {}}
      />,
    );
    expect(screen.queryByTestId('location-profile-conditions')).toBeNull();
    expect(screen.queryByText(/conditions/i)).toBeNull();
  });

  it('the section disappears once the engine\'s own decay loop expires the edge', () => {
    const graph = graphWithConditions({ ticksRemaining: 1 });
    decayConditions(graph, 11);
    render(
      <LocationProfileModal
        name="Ardenmor Keep"
        locationId="loc_0"
        graph={graph}
        onClose={() => {}}
      />,
    );
    expect(screen.queryByTestId('location-profile-conditions')).toBeNull();
  });

  it('lists only conditions — a non-condition trait on the same place is not one', () => {
    // The reachable half of the guard. A dangling `has_trait` edge cannot be built
    // at all (`addEdge` rejects a missing target), so the case that can actually
    // occur is a place carrying a trait from another family; this section is
    // "Conditions", and a mastery or archetype marker is not a timed state.
    const graph = graphWithConditions();
    graph.addNode({
      id: 'trait.core.storied',
      type: 'trait',
      name: 'Storied',
      properties: { subcategory: 'core' },
    } as never);
    graph.addEdge({
      id: 'has_trait_loc_0_storied',
      source: 'loc_0',
      target: 'trait.core.storied',
      type: 'has_trait',
      properties: {},
    } as never);

    render(
      <LocationProfileModal
        name="Ardenmor Keep"
        locationId="loc_0"
        graph={graph}
        onClose={() => {}}
      />,
    );

    const section = screen.getByTestId('location-profile-conditions');
    expect(section.textContent).toContain('Closed for the Season');
    expect(section.textContent).not.toContain('Storied');
    expect(section.textContent).toContain('Conditions (1)');
  });

  it('THR-1175: a standing welcome reaches the player on the place that carries it', () => {
    // The acted-on half of THR-1175. The Grateful Kin used to express "there is a
    // roof in this town that opens for them now" as an `owes_favor` edge with the
    // *town* as debtor — real, well-formed, and inert, because every favour
    // consumer is person-shaped, so the only code that would ever touch it again
    // was the expiry sweep. The condition replaces it, and this is the assertion
    // that it is not the same defect in a new coat: the state a player was
    // promised is on the surface a player can open, named in words, on the place
    // the chip anchors to. Without a live reader this write would be exactly as
    // uncollectable as the edge it replaced.
    const graph = graphWithKeep();
    seedEncounterTraitDefinitions(graph);
    graph.addEdge({
      id: 'has_trait_loc_0_standing_welcome',
      source: 'loc_0',
      target: 'trait.condition.location.standing_welcome',
      type: 'has_trait',
      properties: {
        appliedAt: 10,
        durationTicks: CONDITION_STANDING_WELCOME_DURATION,
        ticksRemaining: CONDITION_STANDING_WELCOME_DURATION,
        intensity: 0.55,
      },
    } as never);

    render(
      <LocationProfileModal
        name="Ardenmor Keep"
        locationId="loc_0"
        graph={graph}
        onClose={() => {}}
      />,
    );

    const section = screen.getByTestId('location-profile-conditions');
    expect(section.textContent).toContain('A Standing Welcome');
    expect(section.textContent).toContain('Conditions (1)');
    // Law 14 — the surface names the state, never the id behind it.
    expect(section.textContent).not.toContain('trait.condition');
  });

  it('Law 17: every shipped location condition resolves a tooltip from the one registry', () => {
    for (const id of LOCATION_CONDITION_IDS) {
      const content = resolveAttachmentTemplateTooltip(id);
      if (!content) throw new Error(`${id} has no tooltip`);
      expect(content.label).toBeTruthy();
      expect(content.desc).toBeTruthy();
      // Law 18: plain-register, capped length; Law 14: no raw ids leaking.
      expect(content.desc.length).toBeLessThanOrEqual(200);
      expect(content.desc).not.toContain('trait.condition');
    }
  });
});
