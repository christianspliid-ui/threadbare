import { describe, expect, it } from 'vitest';
import { parseDebugCommand, tokenizeDebugCommand } from '../debugCommands';

describe('debugCommands', () => {
  it('tokenizes quoted command arguments', () => {
    expect(tokenizeDebugCommand('spawn encounter "Captain Merrow" cg.quest.gate_duty --courtPosition the_first')).toEqual([
      'spawn',
      'encounter',
      'Captain Merrow',
      'cg.quest.gate_duty',
      '--courtPosition',
      'the_first',
    ]);
  });

  it('parses spawn encounter commands', () => {
    expect(parseDebugCommand('spawn encounter Recruit cg.quest.gate_duty --courtPosition retinue')).toEqual({
      kind: 'spawn-encounter',
      agentQuery: 'Recruit',
      templateId: 'cg.quest.gate_duty',
      courtPosition: 'retinue',
    });
  });

  it('parses spawn location commands', () => {
    expect(parseDebugCommand('spawn location town --hex 12 7 --name "South Gate"')).toEqual({
      kind: 'spawn-location',
      subtype: 'town',
      col: 12,
      row: 7,
      name: 'South Gate',
    });
  });

  it('parses spawn attachment commands', () => {
    expect(parseDebugCommand('spawn attachment @hero "Gate Seal Case" --tick 12')).toEqual({
      kind: 'spawn-attachment',
      agentQuery: '@hero',
      templateQuery: 'Gate Seal Case',
      tick: 12,
    });
  });

  it('parses spawn encounter-context commands', () => {
    expect(parseDebugCommand('spawn encounter-context cg.quest.gate_duty --agent @hero --hex 10 10')).toEqual({
      kind: 'spawn-encounter-context',
      templateId: 'cg.quest.gate_duty',
      agentQuery: '@hero',
      col: 10,
      row: 10,
      moveAgent: true,
    });
  });

  it('parses spawn npc commands', () => {
    expect(parseDebugCommand('spawn npc guard_captain --hex 12 7 --name "Captain Merrow" --faction civic_guard --spotlight notable')).toEqual({
      kind: 'spawn-npc',
      role: 'guard_captain',
      col: 12,
      row: 7,
      name: 'Captain Merrow',
      factionDefId: 'civic_guard',
      spotlightTier: 'notable',
    });
  });

  it('parses inspect encounter commands', () => {
    expect(parseDebugCommand('inspect encounters Recruit')).toEqual({
      kind: 'inspect-encounters',
      agentFilter: 'Recruit',
    });
  });

  it('parses move agent commands', () => {
    expect(parseDebugCommand('move agent @hero --hex 10 10')).toEqual({
      kind: 'move-agent',
      agentQuery: '@hero',
      col: 10,
      row: 10,
    });
  });

  it('rejects unknown spawn flags', () => {
    expect(parseDebugCommand('spawn encounter Recruit cg.quest.gate_duty --bogus nope')).toEqual({
      error: "Unknown flag '--bogus'.",
    });
  });

  it('rejects world spawn commands without anchors', () => {
    expect(parseDebugCommand('spawn npc guard')).toEqual({
      error: 'spawn npc requires either --at <location|actor|@hero> or --hex <col> <row>.',
    });
  });

  it('rejects move agent commands without destinations', () => {
    expect(parseDebugCommand('move agent @hero')).toEqual({
      error: 'move agent requires either --to <location|actor|@ascendant> or --hex <col> <row>.',
    });
  });

  it('rejects encounter-context commands without anchors', () => {
    expect(parseDebugCommand('spawn encounter-context cg.quest.gate_duty')).toEqual({
      error: 'spawn encounter-context requires --agent <agent>, --at <location|actor>, or --hex <col> <row>.',
    });
  });
});
