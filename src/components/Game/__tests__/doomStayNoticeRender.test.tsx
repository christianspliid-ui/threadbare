// @vitest-environment jsdom
/**
 * THR-2207 — browser-verify substitution (jsdom-render): the Doom notice as composed.
 *
 * A real `doom_escalation` tick event goes through `routeNotifications` (which tags the
 * popup with its `eventType`), the host's rule `doomStayNotice` reads a real god, and
 * the real `EventPopup` renders the result — the same three steps `DialogHost` runs.
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EventPopup } from '../EventPopup';
import { routeNotifications } from '../../../engine/notificationRouter';
import { doomStayNotice, DOOM_STAY_NOTICE_EVENT_TYPE } from '../../../engine/views/doomStayNotice';
import { seedWorld } from '../../../engine/worldSeed';
import { createAscendant } from '../../../engine/ascendant';
import { spawnControlEffect } from '../../../engine/controlEffectSpawn';
import { getUnifiedTemplateById } from '../../../data/unified-action-templates';
import { DOOM_STAY_TEMPLATE_ID } from '../../../data/doom-stay-content';
import type { GameState, TickEvent } from '../../../types/gameState';
import type { CosmologyProfile } from '../../../types/index';
import type { UnifiedAction } from '../../../types/unifiedAction';
import { SPHERE_NAMES } from '../../../types/index';

function makeGod() {
  const cosmology = {} as CosmologyProfile;
  for (const s of SPHERE_NAMES) cosmology[s] = 0.125;
  const tiles = [{ coord: { col: 0, row: 0 }, geoParams: { elevation: 0.5, temperature: 0.5, moisture: 0.5 }, terrain: 'grassland' as const }];
  const { graph } = seedWorld(cosmology, tiles, 42);
  graph.addNode({ id: 'loc.start', type: 'location', name: 'Grove', properties: { locationType: 'location' } });
  const { ascendantId } = createAscendant(graph, {
    archetype: {
      id: 'arch_test', name: 'The Watcher Divine', title: 'The Watcher', description: 'Test',
      sphereAlignment: { primary: 'mind', secondary: 'spirit' },
      startingDomainAffinities: { iron: 2, gold: 1 }, personalitySeed: {}, flavorText: 'Test',
    },
    avatar: { name: 'Avatar', startLocationId: 'loc.start', formDescription: 'An avatar' },
  } as Parameters<typeof createAscendant>[1]);
  return { graph, ascendantId };
}

const DOOM_EVENT: TickEvent = {
  id: 'evt_doom_2',
  tick: 217,
  type: 'doom_escalation',
  message: 'The Breach intensifies — Reality Cracks',
  significance: 0.9,
  notification: { channel: 'popup', popup: { title: 'Reality Cracks', body: 'Hairline Rifts • Borrowed Voices' } },
} as TickEvent;

function routedPopup() {
  const routed = routeNotifications([DOOM_EVENT], { toasts: [], alerts: [], popupQueue: [], entityNotices: [] }, 0);
  return routed.popupQueue[0];
}

function renderNotice(state: Parameters<typeof doomStayNotice>[0]) {
  const popup = routedPopup();
  const stay = popup.eventType === DOOM_STAY_NOTICE_EVENT_TYPE ? doomStayNotice(state) : {};
  return render(
    <EventPopup
      popup={popup}
      queueLength={1}
      onDismiss={() => {}}
      noteLine={stay.line}
      secondaryAction={stay.button ? { label: stay.button, onClick: () => {} } : undefined}
    />,
  );
}

describe('THR-2207 — the Doom notice, composed', () => {
  it('the router tags the popup with its event type', () => {
    expect(routedPopup().eventType).toBe('doom_escalation');
  });

  it('card held, not active: the paying pool line and "Stay it" beside Acknowledge', () => {
    const { graph, ascendantId } = makeGod();
    renderNotice({ graph, ascendantId, unlockedActionIds: [DOOM_STAY_TEMPLATE_ID], controlEffects: [], unifiedActions: [] } as unknown as GameState);
    expect(screen.getByText('Reality Cracks')).toBeTruthy();
    expect(screen.getByTestId('event-popup-note').textContent)
      .toMatch(/^Stay the Unmaking slows it\. Holding it draws on your [A-Z][a-z]+ essence every day\.$/);
    expect(screen.getAllByRole('button').map(b => b.textContent)).toEqual(['Stay it', 'Acknowledge']);
  });

  it('card held and active: "You are holding it back." and no second button', () => {
    const { graph, ascendantId } = makeGod();
    const spawned = spawnControlEffect(
      { id: 'ua', templateId: DOOM_STAY_TEMPLATE_ID, actorId: ascendantId, targetId: ascendantId, resolved: true, outcome: 'success' } as unknown as UnifiedAction,
      getUnifiedTemplateById(DOOM_STAY_TEMPLATE_ID)!, 0, graph, [],
    );
    renderNotice({ graph, ascendantId, unlockedActionIds: [DOOM_STAY_TEMPLATE_ID], controlEffects: [spawned!.effect], unifiedActions: [] } as unknown as GameState);
    expect(screen.getByTestId('event-popup-note').textContent).toBe('You are holding it back.');
    expect(screen.queryByTestId('event-popup-secondary')).toBeNull();
  });

  it('card not held: the notice is unchanged', () => {
    const { graph, ascendantId } = makeGod();
    renderNotice({ graph, ascendantId, unlockedActionIds: [], controlEffects: [], unifiedActions: [] } as unknown as GameState);
    expect(screen.queryByTestId('event-popup-note')).toBeNull();
    expect(screen.getAllByRole('button').map(b => b.textContent)).toEqual(['Acknowledge']);
  });
});
