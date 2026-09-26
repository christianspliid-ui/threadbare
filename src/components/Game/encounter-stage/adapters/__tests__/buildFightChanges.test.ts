/**
 * THR-1553 (fight on screen F3) — the fight chips: one per `fightState` field,
 * anchored, categorised, and never drawn without their write (Law 56).
 */
import { describe, expect, it } from 'vitest';
import { WorldGraph } from '../../../../../engine/graph';
import type { FightState } from '../../../../../types/fight';
import type {
  EncounterAftermathChange,
  UnifiedAction,
  UnifiedActionTemplate,
} from '../../../../../types/unifiedAction';
import type { EncounterNotification } from '../../../../../types/encounterVisibility';
import { buildFightChanges, fillFightChipSlots, mergeFightChanges } from '../buildFightChanges';
import { buildFightChipWorld } from '../chipCollaborators';
import { buildAftermathConsequences } from '../buildAftermathConsequences';
import { buildUnifiedEncounterStageModel } from '../buildUnifiedEncounterStageModel';
import { resolveTooltip } from '../../../../../engine/tooltipResolver';
import { FIGHT_CHIP_TOOLTIP_IDS } from '../../../../../data/fight-screen-content';

const FIGHTER = 'agent.bryn';
const BEAST = 'elite.mire_ox';
const LAIR = 'loc.lair.mire';
const TOWN = 'loc.town.hollowmere';
const BLADE = 'artifact.old_blade';
const TROPHY = 'item.inst.tusk';

function buildGraph(): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({ id: FIGHTER, type: 'actor', name: 'Bryn Ashford', properties: { actorType: 'individual' } });
  graph.addNode({ id: BEAST, type: 'actor', name: 'the Mire Ox', properties: { actorType: 'individual', isMonsterElite: true } });
  graph.addNode({ id: LAIR, type: 'location', name: 'the Mire Den', properties: {} });
  graph.addNode({ id: TOWN, type: 'location', name: 'Hollowmere', properties: {} });
  graph.addNode({ id: BLADE, type: 'artifact', name: 'the Old Blade', properties: {} });
  graph.addNode({ id: TROPHY, type: 'artifact', name: 'a Mire Ox tusk', properties: {} });
  for (const [id, name, tags] of [
    ['trait.condition.wounded', 'Wounded', ['#condition', '#negative']],
    ['trait.condition.inspired', 'Inspired', ['#condition', '#positive']],
    ['trait.condition.shaken', 'Shaken', ['#condition', '#negative']],
    ['trait.condition.odd', 'Odd', ['#condition', '#positive']],
  ] as const) {
    graph.addNode({ id, type: 'trait', name, properties: { subcategory: 'condition', tags: [...tags] } });
  }
  return graph;
}

function fight(overrides: Partial<FightState> = {}): FightState {
  return {
    opponentId: BEAST,
    clockSize: 4,
    clockAtStart: 1,
    clockNow: 3,
    persistent: true,
    exchanges: 3,
    harmTaken: 0,
    wounds: 0,
    blowsLanded: 2,
    momentum: 0,
    temperFired: false,
    berserk: false,
    advantages: [],
    forks: [],
    conditionsApplied: [],
    storiedClimbs: [],
    ...overrides,
  };
}

/** Every field set: the richest record a fighter's side can carry. */
function fullFight(): FightState {
  return fight({
    conditionsApplied: ['trait.condition.wounded', 'trait.condition.inspired', 'trait.condition.wounded'],
    storiedClimbs: [BLADE],
    ending: {
      face: 'overcome_monster',
      scarWritten: true,
      grudgeWritten: true,
      reputation: { counterpartyId: TOWN, delta: 0.1 },
      reward: { templateId: 'item.tusk', instanceId: TROPHY, tier: 1 },
    },
    lairOutcome: { lairId: LAIR, felled: false, lairCleared: false },
  });
}

function chipsFor(state: FightState | undefined, graph = buildGraph()) {
  return buildFightChanges(state, FIGHTER, buildFightChipWorld(graph));
}

function kindsOf(changes: readonly EncounterAftermathChange[]): string[] {
  return changes.map(c => c.id.split('-')[2]);
}

function render(changes: readonly EncounterAftermathChange[]) {
  return buildAftermathConsequences({
    changes,
    enrich: (t) => t,
    link: (id, text) => ({ id, segments: [{ text }] }),
  });
}

describe('buildFightChanges (THR-1553)', () => {
  it('draws nothing for an action with no fightState', () => {
    expect(chipsFor(undefined)).toEqual([]);
  });

  it('every chip anchors to a node that exists in the world', () => {
    const graph = buildGraph();
    const changes = chipsFor(fullFight(), graph);
    expect(changes.length).toBeGreaterThan(0);
    for (const change of changes) {
      const anchor = change.stateNoun?.entityId;
      expect(anchor, change.id).toBeTruthy();
      expect(graph.getNode(anchor!), change.id).toBeDefined();
    }
  });

  it('a chip whose anchor node is gone does not render', () => {
    const graph = buildGraph();
    graph.removeNode(TROPHY);
    graph.removeNode(BLADE);
    const kinds = kindsOf(chipsFor(fullFight(), graph));
    expect(kinds).not.toContain('trophy');
    expect(kinds).not.toContain('storied');
  });

  describe('each chip is absent when its fightState field is absent', () => {
    const cases: Array<[string, FightState, FightState]> = [
      ['clock', fight(), fight({ clockNow: 1 })],
      ['slain_opponent', fight({ lairOutcome: { lairId: LAIR, felled: true, lairCleared: false } }), fight({ lairOutcome: { lairId: LAIR, felled: false, lairCleared: false } })],
      ['lair_cleared', fight({ lairOutcome: { lairId: LAIR, felled: true, lairCleared: true } }), fight({ lairOutcome: { lairId: LAIR, felled: true, lairCleared: false } })],
      ['scarred', fight({ ending: { face: 'mauled', scarWritten: true, grudgeWritten: false } }), fight({ ending: { face: 'mauled', scarWritten: false, grudgeWritten: false } })],
      ['slain_fighter', fight({ ending: { face: 'slain', scarWritten: false, grudgeWritten: false } }), fight({ ending: { face: 'mauled', scarWritten: false, grudgeWritten: false } })],
      ['condition', fight({ conditionsApplied: ['trait.condition.shaken'] }), fight({ conditionsApplied: [] })],
      ['storied', fight({ storiedClimbs: [BLADE] }), fight({ storiedClimbs: [] })],
      ['trophy', fight({ ending: { face: 'overcome_monster', scarWritten: false, grudgeWritten: false, reward: { templateId: 'x', instanceId: TROPHY, tier: 1 } } }), fight({ ending: { face: 'overcome_monster', scarWritten: false, grudgeWritten: false } })],
      ['standing', fight({ ending: { face: 'overcome_monster', scarWritten: false, grudgeWritten: false, reputation: { counterpartyId: TOWN, delta: 0.1 } } }), fight({ ending: { face: 'overcome_monster', scarWritten: false, grudgeWritten: false } })],
      ['grudge', fight({ ending: { face: 'mauled', scarWritten: false, grudgeWritten: true } }), fight({ ending: { face: 'mauled', scarWritten: false, grudgeWritten: false } })],
    ];
    for (const [kind, withField, withoutField] of cases) {
      it(kind, () => {
        expect(kindsOf(chipsFor(withField))).toContain(kind);
        expect(kindsOf(chipsFor(withoutField))).not.toContain(kind);
      });
    }
  });

  it('the slain-opponent chip suppresses the clock chip', () => {
    const kinds = kindsOf(chipsFor(fight({ clockNow: 4, lairOutcome: { lairId: LAIR, felled: true, lairCleared: true } })));
    expect(kinds).toContain('slain_opponent');
    expect(kinds).toContain('lair_cleared');
    expect(kinds).not.toContain('clock');
  });

  it('slain (fighter) suppresses scarred', () => {
    const kinds = kindsOf(chipsFor(fight({ ending: { face: 'slain', scarWritten: true, grudgeWritten: false } })));
    expect(kinds).toContain('slain_fighter');
    expect(kinds).not.toContain('scarred');
  });

  it('inspired renders as BOON and wounded as SCAR, deduped', () => {
    const changes = chipsFor(fight({
      conditionsApplied: ['trait.condition.inspired', 'trait.condition.wounded', 'trait.condition.wounded'],
    })).filter(c => c.id.includes('-condition-'));
    expect(changes).toHaveLength(2);
    const inspired = changes.find(c => c.stateNoun?.entityId === 'trait.condition.inspired')!;
    const wounded = changes.find(c => c.stateNoun?.entityId === 'trait.condition.wounded')!;
    expect(inspired.category).toBe('boon');
    expect(inspired.direction).toBe('gain');
    expect(wounded.category).toBe('scar');
    expect(wounded.direction).toBe('loss');
  });

  it('a condition outside the copy table takes its polarity from its tags', () => {
    const change = chipsFor(fight({ conditionsApplied: ['trait.condition.odd'] }))[0];
    expect(change.category).toBe('boon');
    expect(change.detail).toBe('Bryn Ashford came away odd.');
  });

  it('the grudge chip renders when ending.grudgeWritten, anchored to the victor', () => {
    const grudge = chipsFor(fight({ ending: { face: 'mauled', scarWritten: false, grudgeWritten: true } }))
      .find(c => c.id.includes('-grudge-'))!;
    expect(grudge.category).toBe('bond');
    expect(grudge.direction).toBe('loss');
    expect(grudge.stateNoun?.entityId).toBe(BEAST);
    expect(grudge.detail).toBe('Bryn Ashford holds a grudge against the Mire Ox.');
  });

  it('a per-fight clock produces no clock chip', () => {
    expect(kindsOf(chipsFor(fight({ persistent: false, clockAtStart: 0, clockNow: 3 })))).not.toContain('clock');
  });

  it('the clock chip carries the clock word as its sentence and marker word', () => {
    const clock = chipsFor(fight({ clockAtStart: 0, clockNow: 2 })).find(c => c.id.includes('-clock-'))!;
    expect(clock.category).toBe('path');
    expect(clock.detail).toBe('Bryn Ashford wore the Mire Ox down to half-broken.');
    expect(clock.deltaLabel).toBe('half-broken');
    expect(clock.stateNoun?.text).toBe("the Mire Ox's clock");
  });

  it('agent mode: a fighter who wins and spares the loser shows none of the loser\'s marks', () => {
    const rival = 'agent.orrin';
    const graph = buildGraph();
    graph.addNode({ id: rival, type: 'actor', name: 'Orrin Vale', properties: { actorType: 'individual' } });
    const changes = chipsFor(fight({
      opponentId: rival,
      persistent: false,
      clockAtStart: 0,
      clockNow: 3,
      fightMode: 'agent',
      fighterClockSize: 4,
      fighterClockNow: 1,
      opponentLoss: 'yielded',
      ending: { face: 'overcome_mortal', scarWritten: false, grudgeWritten: false },
      opponentEnding: {
        face: 'spared',
        scarWritten: true,
        grudgeWritten: true,
        humiliation: { counterpartyId: TOWN, delta: -0.1 },
      },
    }), graph);
    const kinds = kindsOf(changes);
    for (const absent of ['scarred', 'slain_fighter', 'grudge', 'standing', 'clock']) {
      expect(kinds, absent).not.toContain(absent);
    }
  });

  it('the standing chip names the settlement and reads a humiliation as a loss', () => {
    const gain = chipsFor(fight({ ending: { face: 'overcome_monster', scarWritten: false, grudgeWritten: false, reputation: { counterpartyId: TOWN, delta: 0.1 } } }))
      .find(c => c.id.includes('-standing-'))!;
    expect(gain.stateNoun?.text).toBe('Hollowmere');
    expect(gain.stateNoun?.visualKind).toBe('location');
    expect(gain.category).toBe('bond');
    expect(gain.direction).toBe('gain');
    expect(gain.detail).toBe('Hollowmere will remember this.');

    const loss = chipsFor(fight({ ending: { face: 'yielded_to_monster', scarWritten: false, grudgeWritten: false, humiliation: { counterpartyId: TOWN, delta: -0.1 } } }))
      .find(c => c.id.includes('-standing-'))!;
    expect(loss.direction).toBe('loss');
    expect(loss.detail).toBe('Hollowmere will hear of it.');
  });

  it('no raw `{` renders in any chip', () => {
    const chips = render(chipsFor(fullFight()));
    expect(chips.length).toBeGreaterThanOrEqual(7);
    for (const chip of chips) {
      expect(chip.sentenceText, chip.id).not.toContain('{');
      expect(chip.nounLabel ?? '', chip.id).not.toContain('{');
      expect(chip.delta?.label ?? '', chip.id).not.toContain('{');
    }
    const slain = render(chipsFor(fight({ lairOutcome: { lairId: LAIR, felled: true, lairCleared: true } })));
    for (const chip of slain) expect(chip.sentenceText).not.toContain('{');
  });

  it('a sentence opening on a lowercase name opens on a capital; the ◆ word stays lowercase (THR-1561)', () => {
    const graph = buildGraph();
    graph.addNode({ id: 'faction.ink', type: 'actor', name: 'sovereignty of Open Ink', properties: { actorType: 'faction' } });
    const standing = chipsFor(fight({ ending: { face: 'overcome_monster', scarWritten: false, grudgeWritten: false, reputation: { counterpartyId: 'faction.ink', delta: 0.1 } } }), graph)
      .find(c => c.id.includes('-standing-'))!;
    expect(standing.detail).toBe('Sovereignty of Open Ink will remember this.');
    expect(standing.stateNoun?.text).toBe('sovereignty of Open Ink');
    const slain = chipsFor(fight({ lairOutcome: { lairId: LAIR, felled: true, lairCleared: false } }))
      .find(c => c.id.includes('-slain_opponent-'))!;
    expect(slain.deltaLabel).toBe('slain');
  });

  it('fillFightChipSlots removes an unfilled slot rather than rendering it', () => {
    expect(fillFightChipSlots('{fighter} took {item}.', { fighter: 'Bryn' })).toBe('Bryn took .');
  });

  it('a PATH chip draws the ◆ marker with its own word; an existing PATH chip keeps "a way opens"', () => {
    const chips = render([
      ...chipsFor(fight({ lairOutcome: { lairId: LAIR, felled: true, lairCleared: true } })),
      {
        id: 'hook', kind: 'future_hook', title: 'A road', detail: 'A road opens north.', polarity: 'info',
        category: 'path', direction: 'opens', stateNoun: { text: 'the North Road' },
      },
    ]);
    const slain = chips.find(c => c.id.includes('slain_opponent'))!;
    expect(slain.delta).toEqual({ direction: 'opens', count: 1, label: 'the Mire Ox — slain', word: 'slain' });
    const cleared = chips.find(c => c.id.includes('lair_cleared'))!;
    expect(cleared.delta?.word).toBe('cleared');
    const hook = chips.find(c => c.id === 'consequence-hook')!;
    expect(hook.delta).toEqual({ direction: 'opens', count: 1, label: 'the North Road — a way opens' });
  });

  it('each chip kind\'s tooltip id resolves in the one registry (Law 17)', () => {
    for (const { tooltipId } of Object.values(FIGHT_CHIP_TOOLTIP_IDS)) {
      expect(resolveTooltip(tooltipId), tooltipId).not.toBeNull();
    }
  });

  it('merging skips a fight chip whose state an existing change already names', () => {
    const existing: EncounterAftermathChange = {
      id: 'reward', kind: 'item', title: 'tusk', detail: 'Bryn gained a Mire Ox tusk.', polarity: 'gain',
      category: 'boon', direction: 'gain', stateNoun: { text: 'a Mire Ox tusk', entityId: TROPHY, visualKind: 'artifact' },
    };
    const merged = mergeFightChanges([existing], chipsFor(fullFight()));
    expect(merged.filter(c => c.stateNoun?.entityId === TROPHY)).toHaveLength(1);
    expect(merged.length).toBeGreaterThan(1);
  });
});

describe('the unified adapter renders the fight chips (THR-1553)', () => {
  const TEMPLATE: UnifiedActionTemplate = {
    id: 'test.fight',
    rarityTier: 1,
    intrinsicTier: 'story_beat',
    name: 'The Mire Den',
    reach: 'iron',
    crudType: 'delete',
    scale: 'local',
    steps: [{
      reach: 'iron', duration: { min: 1, max: 1 }, difficulty: 0.5, onSuccess: [], onFailure: [],
      failBehavior: 'continue_weakened', narrativeTemplate: 'The beast charged.',
    }],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ['courage_prudence'],
    narrativeTemplates: { initiation: 'A den in the mire.', success: 'It fell.', failure: 'It won.' },
  };
  const notification = {
    id: 'n', agentId: FIGHTER, agentName: 'Bryn Ashford', courtPosition: 'the_first',
    encounterId: TEMPLATE.id, encounterName: TEMPLATE.name, prose: '', choices: [],
    createdTick: 60, autoResolveTick: null, viewed: false, resolved: false,
  } as unknown as EncounterNotification;

  it('the aftermath carries slain, lair cleared and standing chips from fightState', () => {
    const graph = buildGraph();
    const action: UnifiedAction = {
      actionId: 'ua_fight', actorId: FIGHTER, templateId: TEMPLATE.id, targetId: LAIR,
      scale: 'local', source: 'agent', startTick: 60, currentStep: 0, stepProgress: 0, stepDuration: 1,
      resolved: true, outcome: 'critical_success', stepOutcomes: ['critical_success'],
      fightState: fight({
        clockNow: 4,
        ending: { face: 'overcome_monster', scarWritten: false, grudgeWritten: false, reputation: { counterpartyId: TOWN, delta: 0.1 } },
        lairOutcome: { lairId: LAIR, felled: true, lairCleared: true },
      }),
      aftermathSummary: {
        encounterId: TEMPLATE.id, outcome: 'critical_success', overview: 'The beast is dead.',
        changes: [], reactionPrompt: '', reactions: [],
      },
    };
    const model = buildUnifiedEncounterStageModel({
      template: TEMPLATE, activeAction: action, notification, agentName: 'Bryn Ashford',
      threadTier: 'strong', graph, essence: 0,
    });
    const chips = model.aftermath?.consequences ?? [];
    const byId = (part: string) => chips.find(c => c.id.includes(part));
    expect(byId('slain_opponent')?.delta?.word).toBe('slain');
    expect(byId('slain_opponent')?.category).toBe('path');
    expect(byId('lair_cleared')?.delta?.word).toBe('cleared');
    expect(byId('standing')?.category).toBe('bond');
    expect(byId('standing')?.nounLabel).toBe('HOLLOWMERE');
    expect(byId('-clock-')).toBeUndefined();
    // The noun links its anchor and explains the chip kind (Laws 17, 21, 56).
    expect(byId('slain_opponent')?.nounEntityId).toBe(BEAST);
    expect(byId('slain_opponent')?.nounTooltipId).toBe('fight.chip.slain_opponent');
    // A monster anchor draws the monster tile (F1's refinement).
    expect(byId('slain_opponent')?.icon?.kind).toBe('monster');
  });
});

describe('a duel loser\'s chips (THR-1561)', () => {
  const RIVAL = 'agent.orrin';

  function duelGraph(): WorldGraph {
    const graph = buildGraph();
    graph.addNode({ id: RIVAL, type: 'actor', name: 'Orrin Vale', properties: { actorType: 'individual' } });
    return graph;
  }

  /** An agent-mode fight the fighter won, with the loser's record on `opponentEnding`. */
  function duel(opponentEnding: FightState['opponentEnding']): FightState {
    return fight({
      opponentId: RIVAL,
      persistent: false,
      clockAtStart: 0,
      clockNow: 4,
      fightMode: 'agent',
      fighterClockSize: 4,
      fighterClockNow: 1,
      opponentLoss: 'clock',
      result: 'overcome',
      ending: { face: 'overcome_mortal', scarWritten: false, grudgeWritten: false },
      ...(opponentEnding ? { opponentEnding } : {}),
    });
  }

  const SLAIN: NonNullable<FightState['opponentEnding']> = { face: 'slain', scarWritten: false, grudgeWritten: false };
  const SPARED_WITH_GRUDGE: NonNullable<FightState['opponentEnding']> = {
    face: 'mauled',
    scarWritten: true,
    grudgeWritten: true,
    humiliation: { counterpartyId: TOWN, delta: -0.1 },
  };

  it('a fighter who kills the loser gets slain, anchored to the deceased opponent', () => {
    const graph = duelGraph();
    graph.getNode(RIVAL)!.properties.deceased = true;
    const slain = chipsFor(duel(SLAIN), graph).find(c => c.id.includes('-slain_opponent-'))!;
    expect(slain).toBeDefined();
    expect(slain.category).toBe('path');
    expect(slain.direction).toBe('opens');
    expect(slain.stateNoun?.entityId).toBe(RIVAL);
    expect(slain.detail).toBe('Orrin Vale was slain.');
    expect(slain.deltaLabel).toBe('slain');
  });

  it('a fighter who spares a loser who now holds a grudge gets the grudge chip: BOND ▼, anchored to the opponent', () => {
    const grudge = chipsFor(duel(SPARED_WITH_GRUDGE), duelGraph())
      .find(c => c.id.includes('-grudge_against_fighter-'))!;
    expect(grudge).toBeDefined();
    expect(grudge.category).toBe('bond');
    expect(grudge.direction).toBe('loss');
    expect(grudge.stateNoun?.entityId).toBe(RIVAL);
    expect(grudge.stateNoun?.text).toBe('Orrin Vale');
    expect(grudge.stateNoun?.tooltipId).toBe('fight.chip.grudge_against_fighter');
    expect(grudge.detail).toBe('Orrin Vale holds a grudge against Bryn Ashford.');
  });

  it('the loser\'s scar and humiliation never render in the fighter\'s aftermath', () => {
    const changes = chipsFor(duel(SPARED_WITH_GRUDGE), duelGraph());
    const kinds = kindsOf(changes);
    for (const absent of ['scarred', 'slain_fighter', 'grudge', 'standing', 'clock']) {
      expect(kinds, absent).not.toContain(absent);
    }
    // Nothing anchors to the loser's home, where the humiliation was written.
    expect(changes.some(c => c.stateNoun?.entityId === TOWN)).toBe(false);
  });

  describe('each new chip is absent when its field is absent', () => {
    it('slain_opponent', () => {
      expect(kindsOf(chipsFor(duel(SLAIN), duelGraph()))).toContain('slain_opponent');
      expect(kindsOf(chipsFor(duel({ face: 'spared', scarWritten: false, grudgeWritten: false }), duelGraph())))
        .not.toContain('slain_opponent');
      expect(kindsOf(chipsFor(duel(undefined), duelGraph()))).not.toContain('slain_opponent');
    });
    it('grudge_against_fighter', () => {
      expect(kindsOf(chipsFor(duel(SPARED_WITH_GRUDGE), duelGraph()))).toContain('grudge_against_fighter');
      expect(kindsOf(chipsFor(duel({ ...SPARED_WITH_GRUDGE, grudgeWritten: false }), duelGraph())))
        .not.toContain('grudge_against_fighter');
      expect(kindsOf(chipsFor(duel(undefined), duelGraph()))).not.toContain('grudge_against_fighter');
    });
    it('neither renders when the opponent node is gone', () => {
      const graph = duelGraph();
      graph.removeNode(RIVAL);
      const kinds = kindsOf([...chipsFor(duel(SLAIN), graph), ...chipsFor(duel(SPARED_WITH_GRUDGE), graph)]);
      expect(kinds).not.toContain('slain_opponent');
      expect(kinds).not.toContain('grudge_against_fighter');
    });
  });

  it('no raw `{` renders in either new chip', () => {
    const chips = render([
      ...chipsFor(duel(SLAIN), duelGraph()),
      ...chipsFor(duel(SPARED_WITH_GRUDGE), duelGraph()),
    ]);
    expect(chips.length).toBeGreaterThanOrEqual(2);
    for (const chip of chips) {
      expect(chip.sentenceText, chip.id).not.toContain('{');
      expect(chip.nounLabel ?? '', chip.id).not.toContain('{');
      expect(chip.delta?.label ?? '', chip.id).not.toContain('{');
    }
  });

  it('the unified adapter (which getFightChips reads) renders both', () => {
    const template = {
      id: 'test.duel', rarityTier: 1, intrinsicTier: 'story_beat', name: 'A Matter of Honour', reach: 'iron',
      crudType: 'delete', scale: 'local',
      steps: [{
        reach: 'iron', duration: { min: 1, max: 1 }, difficulty: 0.5, onSuccess: [], onFailure: [],
        failBehavior: 'continue_weakened', narrativeTemplate: 'Steel met steel.',
      }],
      apCost: 1, actorAffinities: ['individual'], motivations: ['courage_prudence'],
      narrativeTemplates: { initiation: 'A challenge.', success: 'It was won.', failure: 'It was lost.' },
    } as UnifiedActionTemplate;
    const notification = {
      id: 'n', agentId: FIGHTER, agentName: 'Bryn Ashford', courtPosition: null,
      encounterId: template.id, encounterName: template.name, prose: '', choices: [],
      createdTick: 60, autoResolveTick: null, viewed: false, resolved: false,
    } as unknown as EncounterNotification;
    const renderFor = (opponentEnding: FightState['opponentEnding']) => {
      const action: UnifiedAction = {
        actionId: 'ua_duel', actorId: FIGHTER, templateId: template.id, targetId: RIVAL,
        scale: 'local', source: 'agent', startTick: 60, currentStep: 0, stepProgress: 0, stepDuration: 1,
        resolved: true, outcome: 'success', stepOutcomes: ['success'],
        fightState: duel(opponentEnding),
        aftermathSummary: {
          encounterId: template.id, outcome: 'success', overview: 'The duel is done.',
          changes: [], reactionPrompt: '', reactions: [],
        },
      };
      return buildUnifiedEncounterStageModel({
        template, activeAction: action, notification, agentName: 'Bryn Ashford',
        threadTier: 'strong', graph: duelGraph(), essence: 0,
      }).aftermath?.consequences ?? [];
    };

    const slain = renderFor(SLAIN).find(c => c.id.includes('slain_opponent'))!;
    expect(slain.category).toBe('path');
    expect(slain.nounEntityId).toBe(RIVAL);
    expect(slain.delta?.word).toBe('slain');

    const spared = renderFor(SPARED_WITH_GRUDGE);
    const grudge = spared.find(c => c.id.includes('grudge_against_fighter'))!;
    expect(grudge.category).toBe('bond');
    expect(grudge.nounEntityId).toBe(RIVAL);
    expect(grudge.nounTooltipId).toBe('fight.chip.grudge_against_fighter');
    expect(grudge.sentenceText).toBe('Orrin Vale holds a grudge against Bryn Ashford.');
    // The loser's scar and humiliation stay on the loser's sheet.
    expect(spared.some(c => c.id.includes('-scarred-') || c.id.includes('-standing-'))).toBe(false);
  });
});
