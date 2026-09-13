/**
 * The realm-court family spends `$realm` all the way to the word the sheet draws —
 * THR-1454, the ticket's third Done-when.
 *
 * THR-1155 shipped the substrate and proved *its* half: a Realm is minted, its
 * definition resolves through the lookup, and `applyFactionReputationGain` walks the
 * court ladder (`realmCourtLadder.test.ts`). What it could not prove is the half that
 * did not exist yet — that **authored content** reaches that ladder. This file is that
 * arm, and it deliberately reads every operand off the shipped templates rather than
 * retyping them, so an author who changes the effect, the sentinel or the amount
 * changes this test's subject rather than leaving it green over a fiction.
 *
 * The chain, end to end, in the order the game walks it:
 *
 *   1. the template authors `faction_reputation_gain` naming `$realm`;
 *   2. `$realm` is a *legal* binding for `factionId` (the authoring-time gate);
 *   3. the real binder resolves it, on a generated world, to the Realm whose
 *      projection claims the hex the actor is standing on;
 *   4. applying the bound effect moves the mortal's rung on the court ladder;
 *   5. `getFactionNetworkSummary` — the one producer of the `rankLabel` the faction
 *      sheet's member row renders (`FactionSheet.tsx:635`) — reports the new court
 *      word.
 *
 * **Step 5 is why this file ends where it does rather than at the engine.** The
 * Done-when is about a *sheet*, and the honest end of the chain is the exact string
 * that surface draws. Asserting the rank in `factionReputation` and calling the sheet
 * proved would be the two-halves-each-green failure this project keeps meeting:
 * `rankLabel` falls back to the edge's stored `role` when the definition does not
 * resolve, so a Realm whose ladder was unreachable would render a plausible word and
 * pass an engine-only assertion.
 *
 * **Browser-verify substitution: jsdom-render is not taken here and this is not it.**
 * The diff is `src/data/` only — no `src/components/`, `src/hooks/`, `src/contexts/`
 * or `index.css` — so the UI-pillar clause does not fire. This file discharges the
 * *ticket's* own Done-when, which names a surface, by proving the string that surface
 * is handed.
 *
 * The world is **generated**, never a fixture, for THR-1155's reason: that Realms are
 * minted over culture domains, that they hold ground, and that the projection claims
 * hexes are all properties of real worldgen. A fixture would invent all three.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { initializeGameState, MAP_SIZE_PRESETS } from '../../../engine/gameInit';
import { createBalancedCosmology } from '../../../engine/cosmology';
import { generateArchetypes } from '../../../engine/ascendant';
import { applyFactionReputationGain } from '../../../engine/factionReputation';
import { getFactionNetworkSummary } from '../../../engine/factionNetwork';
import { buildRealmProjection } from '../../../engine/realmProjection';
import { bindAftermathSceneTargets } from '../../../engine/encounterAftermath';
import { sentinelBindingRefusal, SENTINEL_REALM } from '../../../engine/sceneSentinels';
import { REALM_RANK_LADDER, REALM_FACTION_CLASS } from '../../realm-content';
import { FACTION_ENCOUNTER_META, metaBelongsToDefinitionId } from '../../faction-encounter-content';
import { COURT_SUMMONS_TEMPLATE } from '../court-summons';
import { BORDER_LEVY_TEMPLATE } from '../border-levy';
import { TITHE_DEMANDED_TEMPLATE } from '../tithe-demanded';
import type { GameState } from '../../../types/gameState';
import type { GraphNode } from '../../../types/graph';
import type {
  ActionStep,
  EncounterAftermathReactionEffect,
  UnifiedAction,
  UnifiedActionTemplate,
} from '../../../types/unifiedAction';

const SEED = 42;

/** The three the ticket named, so an arm cannot quietly cover two of them. */
const FAMILY: readonly UnifiedActionTemplate[] = [
  COURT_SUMMONS_TEMPLATE,
  BORDER_LEVY_TEMPLATE,
  TITHE_DEMANDED_TEMPLATE,
];

type RealmRank = typeof REALM_RANK_LADDER[number];

/** Every `faction_reputation_gain` a template authors on either outcome side. */
function authoredRealmGains(
  template: UnifiedActionTemplate,
): readonly Extract<EncounterAftermathReactionEffect, { kind: 'faction_reputation_gain' }>[] {
  const out: Extract<EncounterAftermathReactionEffect, { kind: 'faction_reputation_gain' }>[] = [];
  for (const step of template.steps) {
    if (!('narrativeTemplate' in step)) continue;
    const plain = step as ActionStep;
    for (const meta of [plain.successMetadata, plain.failureMetadata]) {
      for (const effect of meta?.effects ?? []) {
        if (effect.kind === 'faction_reputation_gain') out.push(effect);
      }
    }
  }
  return out;
}

let state: GameState;
let realm: GraphNode;
let realmDefId: string;
/** A hex this Realm's projection claims, and the Location standing on it. */
let heldLocationId: string;

beforeAll(() => {
  const preset = MAP_SIZE_PRESETS['medium'];
  const archetype = generateArchetypes(4, SEED)[0];
  const built = initializeGameState(
    archetype, 'Court', createBalancedCosmology(), SEED, preset.cols, preset.rows,
  );
  state = built.state;

  const projection = buildRealmProjection(state.graph, state.tiles);
  // Pick the Realm through the *projection* rather than the node list, because the
  // projection is what `$realm` reads: a Realm the map does not claim any hex for is a
  // Realm the sentinel can never bind, and choosing one here would make every arm below
  // vacuous in the one way that matters.
  const entry = projection.realms.find(r => r.heldLocationIds.length > 0);
  realm = state.graph.getNode(entry?.id ?? '') as GraphNode;
  realmDefId = realm?.properties.factionDefId as string;
  heldLocationId = entry?.heldLocationIds[0] as string;
});

describe('the realm-court family reaches the court ladder (THR-1454)', () => {
  it('mints a world with a Realm that claims ground — the non-vacuity arm', () => {
    expect(realm).toBeDefined();
    expect(realm.properties.factionClass).toBe(REALM_FACTION_CLASS);
    expect(realmDefId).toMatch(/^realm\./);
    expect(heldLocationId).toBeTruthy();
  });

  it('all three templates author a realm standing move on both outcome sides', () => {
    for (const template of FAMILY) {
      const gains = authoredRealmGains(template);
      // Both directions, or the family's spine is one-way and a failure costs nothing.
      expect(gains.length, `${template.id} authors no faction_reputation_gain`)
        .toBeGreaterThanOrEqual(2);
      expect(gains.every(g => g.factionId === SENTINEL_REALM), `${template.id}`).toBe(true);
      expect(gains.some(g => g.amount > 0), `${template.id} never pays`).toBe(true);
      expect(gains.some(g => g.amount < 0), `${template.id} never costs`).toBe(true);
    }
  });

  it('registers each one class-scoped, so one row is every Realm\'s court work', () => {
    for (const template of FAMILY) {
      const meta = FACTION_ENCOUNTER_META.get(template.id);
      expect(meta, `${template.id} has no meta row`).toBeDefined();
      expect(meta!.factionClass).toBe(REALM_FACTION_CLASS);
      // The whole point of the class-scoped row: it answers for the *generated* Realm.
      expect(metaBelongsToDefinitionId(meta!, realmDefId)).toBe(true);
    }
  });

  it('`$realm` is a legal binding for the field the templates put it on', () => {
    expect(sentinelBindingRefusal('factionId', SENTINEL_REALM)).toBeNull();
    // The control: the same sentinel on an agent field is refused, so the arm above is
    // reading the field's kind rather than waving every sentinel through.
    expect(sentinelBindingRefusal('targetAgentId', SENTINEL_REALM)).not.toBeNull();
  });

  it('binds `$realm` to the Realm holding the ground, then moves the court word', () => {
    const graph = state.graph;
    const actorId = 'actor_summoned_subject';

    // A mortal standing in a town this Realm holds, sworn to nothing yet. The
    // `member_of` shape is `npcSeeding`'s — nothing here is invented.
    graph.addNode({
      id: actorId,
      type: 'actor',
      name: 'Summoned Subject',
      properties: { actorType: 'individual', hexCol: 0, hexRow: 0 },
    });
    graph.addEdge({
      id: `located_${actorId}`, source: actorId, target: heldLocationId,
      type: 'located_at', properties: {},
    });
    graph.addEdge({
      id: `member_${actorId}`, source: actorId, target: realm.id, type: 'member_of',
      properties: {
        factionDefId: realmDefId, reputation: 0, rank: 0, role: 'stranger', joinedTick: 1,
      },
    });

    const action = { actorId, targetId: undefined } as unknown as UnifiedAction;
    const projection = buildRealmProjection(graph, state.tiles);

    // The authored success-side gain, taken off the shipped template.
    const authored = authoredRealmGains(COURT_SUMMONS_TEMPLATE).find(g => g.amount > 0)!;
    const bound = bindAftermathSceneTargets(
      authored, action, graph, undefined, { realmProjection: () => projection },
    ) as Extract<EncounterAftermathReactionEffect, { kind: 'faction_reputation_gain' }>;

    // Hop 3: the sentinel is gone and the Realm the map claims is in its place.
    expect(bound.factionId).not.toBe(SENTINEL_REALM);
    expect(bound.factionId).toBe(realm.id);

    // Hop 4: the ladder. One authored summons is a nudge up the rungs, not a leap, so
    // the assertion is that the rung *moved* and is a court word — never a fixed rung,
    // which would pin the tuning of `amount` into a test that is not about tuning.
    const before = getFactionNetworkSummary(graph, realm.id)
      ?.members.find(m => m.id === actorId)?.rankLabel;

    let result = applyFactionReputationGain(
      graph, actorId, bound.factionId, bound.amount, 10, 'quest_complete',
    );
    // Walk it until a rung actually changes, so the arm proves reachability rather than
    // the size of one payout. Bounded well under the ladder's length.
    for (let i = 0; i < 40 && !result.rankChanged; i += 1) {
      result = applyFactionReputationGain(
        graph, actorId, bound.factionId, bound.amount, 11 + i, 'quest_complete',
      );
    }
    expect(result.rankChanged).toBe(true);
    expect(REALM_RANK_LADDER).toContain(result.newRank as RealmRank);

    // Hop 5: the string the faction sheet's member row draws (`FactionSheet.tsx:635`
    // renders `member.rankLabel`), read from its one producer.
    const after = getFactionNetworkSummary(graph, realm.id)
      ?.members.find(m => m.id === actorId)?.rankLabel;
    expect(after).toBeTruthy();
    expect(after).not.toBe(before);
    expect(after!.toLowerCase()).toBe(result.newRank);
    expect(REALM_RANK_LADDER).toContain(after!.toLowerCase() as RealmRank);
  });

  it('leaves `$realm` unbound when no projection is supplied — the control', () => {
    // If the arm above were green for any reason other than the projection lookup, this
    // would be green too. It is not: with no map to ask, the sentinel survives and the
    // effect no-ops rather than binding some nearby faction.
    const authored = authoredRealmGains(BORDER_LEVY_TEMPLATE).find(g => g.amount > 0)!;
    const action = { actorId: 'actor_summoned_subject', targetId: undefined } as unknown as UnifiedAction;
    const bound = bindAftermathSceneTargets(authored, action, state.graph, undefined, {});
    expect((bound as { factionId: string }).factionId).toBe(SENTINEL_REALM);
  });
});
