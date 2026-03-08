import { describe, it, expect } from 'vitest';
import {
  formatDashboard,
  formatNarrativeLog,
  formatTraceDeepDive,
  formatFullReport,
  type Snapshot,
  type PlaytestReportData,
} from '../playtest-format';
import type { TickEvent, ChronicleEntry } from '../../src/types/gameState';
import type { TraceEntry } from '../../src/types/trace';

// ─── Test Fixtures ───────────────────────────────────────────

const mockSnapshot: Snapshot = {
  tick: 10,
  doomStage: 1,
  agentCount: 5,
  essenceTotal: 42.5,
  mandateProgress: 0.25,
  reputationStats: { min: -0.8, median: 0.1, max: 0.9 },
  cultureCount: 2,
};

const mockSnapshots: Snapshot[] = [
  {
    tick: 1,
    doomStage: 0,
    agentCount: 4,
    essenceTotal: 30,
    mandateProgress: 0,
    reputationStats: { min: -0.5, median: 0, max: 0.5 },
    cultureCount: 1,
  },
  {
    tick: 10,
    doomStage: 1,
    agentCount: 5,
    essenceTotal: 42.5,
    mandateProgress: 0.25,
    reputationStats: { min: -0.8, median: 0.1, max: 0.9 },
    cultureCount: 2,
  },
  {
    tick: 20,
    doomStage: 2,
    agentCount: 5,
    essenceTotal: 55,
    mandateProgress: 0.5,
    reputationStats: { min: -0.9, median: 0.2, max: 1.0 },
    cultureCount: 2,
  },
];

const mockEvents: TickEvent[] = [
  {
    id: 'ev1',
    tick: 5,
    type: 'agent_action',
    message: 'Agent A performed action',
    significance: 0.4,
  },
  {
    id: 'ev2',
    tick: 8,
    type: 'narrative',
    message: 'A great event unfolded',
    sphere: 'Force',
    significance: 0.85,
  },
  {
    id: 'ev3',
    tick: 12,
    type: 'doom_escalation',
    message: 'Doom escalates',
    significance: 0.7,
  },
  {
    id: 'ev4',
    tick: 15,
    type: 'agent_action',
    message: 'Minor action',
    significance: 0.2,
  },
];

const mockChronicleEntry: ChronicleEntry = {
  id: 'chron1',
  tier: 'chronicle',
  title: 'The Great Awakening',
  prose: 'In this moment, all the threads converged...',
  tick: 20,
  promptContext: {
    actors: ['actor1', 'actor2'],
    location: 'The Throne of Shadows',
    sphere: 'Mind',
    mood: 'momentous',
  },
};

const mockActionSelectionTrace: any = {
  id: 1,
  tick: 5,
  timestamp: 1000,
  category: 'action_selection',
  agentId: 'agent-123',
  summary: 'Agent selects action',
  stages: [
    { stageName: 'survival', candidateIds: ['a1', 'a2'], scores: [0.5, 0.3] },
  ],
  finalPick: {
    actionId: 'action-1',
    actionName: 'Attack',
    targetId: 'enemy-1',
    targetName: 'Rival A',
    score: 0.8,
    probability: 0.75,
    roll: 0.7,
  },
};

const mockNarrativeGenerationTrace: any = {
  id: 2,
  tick: 6,
  timestamp: 2000,
  category: 'narrative_generation',
  agentId: 'agent-456',
  summary: 'Generates prose',
  tier: 'notable',
  templateId: 'tmpl-1',
  sphereWords: ['darkly', 'powerfully'],
  personalityClause: 'with ruthless grace',
  finalProse:
    'The agent moved with darkly potent grace, shattering the old order with a single thought.',
};

const mockContextHarvestTrace: any = {
  id: 3,
  tick: 7,
  timestamp: 3000,
  category: 'context_harvest',
  agentId: 'agent-789',
  summary: 'Harvests narrative context',
  harvestedCount: 12,
  rankedTop: [
    { nodeId: 'n1', name: 'The Shadowed Tower', score: 0.95 },
    { nodeId: 'n2', name: 'Lord of Echoes', score: 0.88 },
    { nodeId: 'n3', name: 'Betrayal Past', score: 0.82 },
    { nodeId: 'n4', name: 'Hidden Artifact', score: 0.75 },
  ],
  selectedIds: ['n1', 'n2'],
  oppositionTension: 0.62,
};

const mockDilemmaResolutionTrace: any = {
  id: 4,
  tick: 8,
  timestamp: 4000,
  category: 'dilemma_resolution',
  agentId: 'agent-111',
  targetId: 'agent-222',
  summary: 'Resolves dilemma',
  actorStrategy: 'tit_for_tat',
  targetStrategy: 'always_defect',
  actorMove: 'cooperate',
  targetMove: 'defect',
  outcome: 'exploited',
  stakes: 2.5,
  sentimentDelta: -0.3,
  reputationDeltas: { actor: -0.2, target: 0.1 },
};

const mockTickSummaryTrace: any = {
  id: 5,
  tick: 10,
  timestamp: 5000,
  category: 'tick_summary',
  summary: 'End of tick 10',
  phaseEventCounts: { action_selection: 5, narrative_generation: 4 },
  agentsProcessed: 5,
  doomStage: 1,
  essenceTotal: 42.5,
  mandateProgress: 0.25,
};

// ─── Tests: formatDashboard ──────────────────────────────────

describe('formatDashboard', () => {
  it('includes seed and tick count', () => {
    const result = formatDashboard(42, 100, []);
    expect(result).toContain('**Seed:**');
    expect(result).toContain('`42`');
    expect(result).toContain('**Total Ticks:** 100');
  });

  it('renders snapshot table with correct columns', () => {
    const result = formatDashboard(42, 100, mockSnapshots);
    expect(result).toContain('| Tick | Doom | Agents | Essence | Mandate | Rep (min/med/max) | Cultures |');
    expect(result).toContain('| 1 | 0 | 4 | 30.0 | 0.0 | -0.5/0.0/0.5 | 1 |');
    expect(result).toContain('| 10 | 1 | 5 | 42.5 | 0.3 | -0.8/0.1/0.9 | 2 |');
    expect(result).toContain('| 20 | 2 | 5 | 55.0 | 0.5 | -0.9/0.2/1.0 | 2 |');
  });

  it('handles empty snapshots gracefully', () => {
    const result = formatDashboard(42, 0, []);
    expect(result).toContain('**Seed:**');
    expect(result).toContain('**Total Ticks:** 0');
    expect(result).toContain('No snapshots recorded');
  });

  it('includes section header', () => {
    const result = formatDashboard(1, 50, mockSnapshots);
    expect(result).toContain('## 1. Dashboard');
  });
});

// ─── Tests: formatNarrativeLog ──────────────────────────────

describe('formatNarrativeLog', () => {
  it('groups events by tick range', () => {
    const result = formatNarrativeLog(mockEvents, 10);
    expect(result).toContain('### Ticks 1–10');
    expect(result).toContain('### Ticks 11–20');
  });

  it('includes significance scores in [0.XX] format', () => {
    const result = formatNarrativeLog(mockEvents, 10);
    expect(result).toContain('[0.40]');
    expect(result).toContain('[0.85]');
    expect(result).toContain('[0.70]');
  });

  it('filters events below minSignificance threshold', () => {
    const result = formatNarrativeLog(mockEvents, 10, 0.5);
    expect(result).toContain('A great event unfolded');
    expect(result).toContain('Doom escalates');
    expect(result).not.toContain('Agent A performed action'); // 0.4 < 0.5
    expect(result).not.toContain('Minor action'); // 0.2 < 0.5
  });

  it('displays event messages', () => {
    const result = formatNarrativeLog(mockEvents, 10);
    expect(result).toContain('Agent A performed action');
    expect(result).toContain('A great event unfolded');
    expect(result).toContain('Doom escalates');
  });

  it('handles empty events', () => {
    const result = formatNarrativeLog([], 10);
    expect(result).toContain('No events recorded');
  });

  it('includes section header', () => {
    const result = formatNarrativeLog(mockEvents, 10);
    expect(result).toContain('## 2. Narrative Log');
  });

  it('appends chronicle entries', () => {
    const result = formatNarrativeLog(mockEvents, 10, 0.3, [mockChronicleEntry]);
    expect(result).toContain('### Chronicle Entries');
    expect(result).toContain('#### The Great Awakening');
    expect(result).toContain('Tick 20');
    expect(result).toContain('In this moment, all the threads converged...');
  });

  it('handles only chronicle entries, no events', () => {
    const result = formatNarrativeLog([], 10, 0.3, [mockChronicleEntry]);
    expect(result).toContain('The Great Awakening');
    expect(result).toContain('In this moment');
  });

  it('respects custom groupSize', () => {
    const result = formatNarrativeLog(mockEvents, 5);
    expect(result).toContain('### Ticks 1–5');
    expect(result).toContain('### Ticks 6–10');
    expect(result).toContain('### Ticks 11–15');
  });
});

// ─── Tests: formatTraceDeepDive ──────────────────────────────

describe('formatTraceDeepDive', () => {
  it('groups traces by category with headers', () => {
    const traces = [
      mockActionSelectionTrace,
      mockNarrativeGenerationTrace,
      mockContextHarvestTrace,
    ];
    const result = formatTraceDeepDive(traces);
    expect(result).toContain('### Action Selection');
    expect(result).toContain('### Narrative Generation');
    expect(result).toContain('### Context Harvest');
  });

  it('formats action_selection trace correctly', () => {
    const result = formatTraceDeepDive([mockActionSelectionTrace]);
    expect(result).toContain('Final Pick: Attack');
    expect(result).toContain('Score: 0.80 | Probability: 75.0%');
    expect(result).toContain('Target: Rival A');
    expect(result).toContain('Agent: agent-123');
  });

  it('formats narrative_generation trace correctly', () => {
    const result = formatTraceDeepDive([mockNarrativeGenerationTrace]);
    expect(result).toContain('(notable)');
    expect(result).toContain('darkly potent grace');
  });

  it('truncates narrative prose to 200 chars', () => {
    const longProseTrace = {
      ...mockNarrativeGenerationTrace,
      finalProse: 'x'.repeat(300),
    };
    const result = formatTraceDeepDive([longProseTrace]);
    expect(result).toContain('...');
    expect(result.split('x').length - 1).toBeLessThanOrEqual(201);
  });

  it('formats context_harvest trace correctly', () => {
    const result = formatTraceDeepDive([mockContextHarvestTrace]);
    expect(result).toContain('Harvested: 12 objects');
    expect(result).toContain('Opposition Tension: 0.62');
    expect(result).toContain('The Shadowed Tower');
    expect(result).toContain('Lord of Echoes');
    expect(result).toContain('Betrayal Past');
  });

  it('shows only top 3 ranked items in context_harvest', () => {
    const result = formatTraceDeepDive([mockContextHarvestTrace]);
    expect(result).toContain('The Shadowed Tower');
    expect(result).toContain('Betrayal Past');
    expect(result).not.toContain('Hidden Artifact'); // 4th item, should not appear
  });

  it('formats dilemma_resolution trace correctly', () => {
    const result = formatTraceDeepDive([mockDilemmaResolutionTrace]);
    expect(result).toContain('Agent vs agent-222');
    expect(result).toContain('Actor: cooperate | Target: defect');
    expect(result).toContain('Outcome: exploited');
    expect(result).toContain('Stakes: 2.50 | Sentiment: -0.30');
  });

  it('formats tick_summary trace correctly', () => {
    const result = formatTraceDeepDive([mockTickSummaryTrace]);
    expect(result).toContain('Agents Processed: 5 | Doom Stage: 1');
    expect(result).toContain('Essence: 42.5 | Mandate: 0.3');
    expect(result).toContain('action_selection: 5');
    expect(result).toContain('narrative_generation: 4');
  });

  it('handles empty traces', () => {
    const result = formatTraceDeepDive([]);
    expect(result).toContain('No traces recorded');
  });

  it('includes section header', () => {
    const result = formatTraceDeepDive([mockTickSummaryTrace]);
    expect(result).toContain('## 3. Trace Deep-Dive');
  });

  it('processes traces in category order', () => {
    const traces = [
      mockTickSummaryTrace,
      mockActionSelectionTrace,
      mockNarrativeGenerationTrace,
    ];
    const result = formatTraceDeepDive(traces);
    const actionIdx = result.indexOf('### Action Selection');
    const narrativeIdx = result.indexOf('### Narrative Generation');
    const tickIdx = result.indexOf('### Tick Summary');
    expect(actionIdx).toBeLessThan(narrativeIdx);
    expect(narrativeIdx).toBeLessThan(tickIdx);
  });
});

// ─── Tests: formatFullReport ─────────────────────────────────

describe('formatFullReport', () => {
  it('contains all three section headers', () => {
    const data: PlaytestReportData = {
      seed: 42,
      totalTicks: 100,
      snapshots: mockSnapshots,
      allEvents: mockEvents,
      chronicleEntries: [mockChronicleEntry],
      traces: [mockTickSummaryTrace],
    };
    const result = formatFullReport(data);
    expect(result).toContain('## 1. Dashboard');
    expect(result).toContain('## 2. Narrative Log');
    expect(result).toContain('## 3. Trace Deep-Dive');
  });

  it('includes playtest report title with seed', () => {
    const data: PlaytestReportData = {
      seed: 99,
      totalTicks: 50,
      snapshots: [],
      allEvents: [],
      chronicleEntries: [],
      traces: [],
    };
    const result = formatFullReport(data);
    expect(result).toContain('# Playtest Report — Seed 99');
  });

  it('includes generation timestamp', () => {
    const data: PlaytestReportData = {
      seed: 1,
      totalTicks: 10,
      snapshots: [],
      allEvents: [],
      chronicleEntries: [],
      traces: [],
    };
    const result = formatFullReport(data);
    expect(result).toContain('*Generated:');
  });

  it('includes dashboard content', () => {
    const data: PlaytestReportData = {
      seed: 42,
      totalTicks: 100,
      snapshots: [mockSnapshot],
      allEvents: [],
      chronicleEntries: [],
      traces: [],
    };
    const result = formatFullReport(data);
    expect(result).toContain('**Seed:**');
    expect(result).toContain('| Tick | Doom | Agents |');
  });

  it('includes narrative log content', () => {
    const data: PlaytestReportData = {
      seed: 42,
      totalTicks: 100,
      snapshots: [],
      allEvents: mockEvents,
      chronicleEntries: [],
      traces: [],
    };
    const result = formatFullReport(data);
    expect(result).toContain('A great event unfolded');
  });

  it('includes trace deep-dive content', () => {
    const data: PlaytestReportData = {
      seed: 42,
      totalTicks: 100,
      snapshots: [],
      allEvents: [],
      chronicleEntries: [],
      traces: [mockActionSelectionTrace],
    };
    const result = formatFullReport(data);
    expect(result).toContain('Final Pick: Attack');
  });

  it('handles empty data gracefully', () => {
    const data: PlaytestReportData = {
      seed: 1,
      totalTicks: 0,
      snapshots: [],
      allEvents: [],
      chronicleEntries: [],
      traces: [],
    };
    const result = formatFullReport(data);
    expect(result).toContain('Playtest Report');
    expect(result).toContain('Dashboard');
    expect(result).toContain('Narrative Log');
    expect(result).toContain('Trace Deep-Dive');
  });
});

// ─── Tests: Edge Cases & Integration ─────────────────────────

describe('Edge Cases', () => {
  it('handles events with no agentId in traces', () => {
    const traceNoAgent = {
      ...mockActionSelectionTrace,
      agentId: undefined,
    };
    const result = formatTraceDeepDive([traceNoAgent]);
    expect(result).toContain('Final Pick: Attack');
  });

  it('handles narrative prose with newlines', () => {
    const traceWithNewlines = {
      ...mockNarrativeGenerationTrace,
      finalProse: 'Line 1\nLine 2\nLine 3',
    };
    const result = formatTraceDeepDive([traceWithNewlines]);
    expect(result).toContain('Line 1 Line 2 Line 3');
  });

  it('handles zero significance events', () => {
    const zeroSigEvent: TickEvent = {
      id: 'ev-zero',
      tick: 5,
      type: 'agent_action',
      message: 'Nothing happened',
      significance: 0,
    };
    const result = formatNarrativeLog([zeroSigEvent], 10, 0);
    expect(result).toContain('[0.00]');
  });

  it('formats very large numbers in dashboard', () => {
    const largeSnapshot: Snapshot = {
      tick: 9999,
      doomStage: 99,
      agentCount: 500,
      essenceTotal: 999999.5,
      mandateProgress: 1.0,
      reputationStats: { min: -100, median: 0, max: 100 },
      cultureCount: 50,
    };
    const result = formatDashboard(1, 10000, [largeSnapshot]);
    expect(result).toContain('9999');
    expect(result).toContain('999999.5');
  });

  it('handles multiple chronicle entries', () => {
    const entry2: ChronicleEntry = {
      id: 'chron2',
      tier: 'chronicle',
      title: 'The Fall',
      prose: 'Everything ended...',
      tick: 30,
      promptContext: {
        actors: [],
        location: 'The Void',
        sphere: 'Entropy',
        mood: 'apocalyptic',
      },
    };
    const result = formatNarrativeLog([], 10, 0.3, [
      mockChronicleEntry,
      entry2,
    ]);
    expect(result).toContain('The Great Awakening');
    expect(result).toContain('The Fall');
  });
});

// ─── Full Integration Test ───────────────────────────────────

describe('Full Report Integration', () => {
  it('produces valid markdown with all data', () => {
    const data: PlaytestReportData = {
      seed: 777,
      totalTicks: 50,
      snapshots: mockSnapshots,
      allEvents: mockEvents,
      chronicleEntries: [mockChronicleEntry],
      traces: [
        mockActionSelectionTrace,
        mockNarrativeGenerationTrace,
        mockContextHarvestTrace,
        mockDilemmaResolutionTrace,
        mockTickSummaryTrace,
      ],
    };
    const result = formatFullReport(data);

    // Verify all major sections exist
    expect(result).toContain('# Playtest Report — Seed 777');
    expect(result).toContain('## 1. Dashboard');
    expect(result).toContain('## 2. Narrative Log');
    expect(result).toContain('## 3. Trace Deep-Dive');

    // Verify sample content from each section
    expect(result).toContain('**Seed:**');
    expect(result).toContain('A great event unfolded');
    expect(result).toContain('Final Pick: Attack');

    // Ensure proper section ordering
    const dash = result.indexOf('## 1. Dashboard');
    const narr = result.indexOf('## 2. Narrative Log');
    const trace = result.indexOf('## 3. Trace Deep-Dive');
    expect(dash).toBeLessThan(narr);
    expect(narr).toBeLessThan(trace);
  });
});
