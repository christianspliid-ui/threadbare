// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { DebugPanel } from '../DebugPanel';

describe('DebugPanel CLI tab', () => {
  beforeEach(() => {
    window.__DEBUG = {
      spawnEncounterContext: vi.fn(() => ({
        success: true,
        templateId: 'cg.quest.gate_duty',
        templateName: 'Gate Duty',
        mode: 'unified',
        anchorLocationId: 'loc_1',
        anchorLocationName: 'Debug Town',
        bindings: [{ key: 'gatehouse' }, { key: 'gate_guard' }, { key: 'gate_captain' }] as any,
        message: "Prepared 'Gate Duty' context at 'Debug Town'.",
      })),
      spawnEncounter: vi.fn(() => ({
        success: true,
        templateId: 'cg.quest.gate_duty',
        templateName: 'Gate Duty',
        mode: 'unified',
        actionId: 'ua-1',
        notificationId: 'note-1',
        message: "Spawned 'Gate Duty' on 'Recruit'",
      })),
      spawnAttachment: vi.fn(() => ({
        success: true,
        kind: 'attachment',
        nodeId: 'reward_agent_1_1_reward_tools_instruments_gate_seal_case',
        nodeName: 'Gate Seal Case',
        message: "Spawned possession 'Gate Seal Case' on 'Recruit' from 'Gate Seal Case'.",
      })),
      spawnLocation: vi.fn(() => ({
        success: true,
        kind: 'location',
        nodeId: 'loc_1',
        nodeName: 'Debug Town',
        locationId: 'loc_1',
        locationName: 'Debug Town',
        message: "Spawned location 'Debug Town' at (10, 10).",
      })),
      spawnSublocation: vi.fn(),
      spawnNpc: vi.fn(),
      moveAgent: vi.fn(() => ({
        success: true,
        kind: 'agent',
        nodeId: 'agent_1',
        nodeName: 'Recruit',
        locationId: 'loc_1',
        locationName: 'Debug Town',
        message: "Moved 'Recruit' to 'hex (10, 10)'.",
      })),
      inspectEncounterPipeline: vi.fn(() => ({ pending: [] })),
    } as any;
  });

  it('runs spawn encounter commands from the in-game CLI tab', () => {
    render(<DebugPanel currentTick={1} />);

    fireEvent.click(screen.getByText('CLI'));
    fireEvent.change(screen.getByLabelText('Encounter CLI input'), {
      target: { value: 'spawn encounter Recruit cg.quest.gate_duty --courtPosition the_first' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Run' }));

    expect(window.__DEBUG?.spawnEncounter).toHaveBeenCalledWith(
      'Recruit',
      'cg.quest.gate_duty',
      { courtPosition: 'the_first', open: true },
    );
    expect(screen.getByLabelText('Encounter CLI output').textContent).toContain('Spawn complete.');
  });

  it('runs encounter-context commands from the in-game CLI tab', () => {
    render(<DebugPanel currentTick={1} />);

    fireEvent.click(screen.getByText('CLI'));
    fireEvent.change(screen.getByLabelText('Encounter CLI input'), {
      target: { value: 'spawn encounter-context cg.quest.gate_duty --agent @hero --hex 10 10' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Run' }));

    expect(window.__DEBUG?.spawnEncounterContext).toHaveBeenCalledWith('cg.quest.gate_duty', {
      agentQuery: '@hero',
      locationQuery: undefined,
      col: 10,
      row: 10,
      moveAgent: true,
    });
    expect(screen.getByLabelText('Encounter CLI output').textContent).toContain('Context ready.');
  });

  it('runs world spawn commands from the in-game CLI tab', () => {
    render(<DebugPanel currentTick={1} />);

    fireEvent.click(screen.getByText('CLI'));
    fireEvent.change(screen.getByLabelText('Encounter CLI input'), {
      target: { value: 'spawn location town --hex 10 10 --name "Debug Town"' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Run' }));

    expect(window.__DEBUG?.spawnLocation).toHaveBeenCalledWith('town', 10, 10, { name: 'Debug Town' });
    expect(screen.getByLabelText('Encounter CLI output').textContent).toContain("Spawned location 'Debug Town'");
  });

  it('runs attachment spawn commands from the in-game CLI tab', () => {
    render(<DebugPanel currentTick={1} />);

    fireEvent.click(screen.getByText('CLI'));
    fireEvent.change(screen.getByLabelText('Encounter CLI input'), {
      target: { value: 'spawn attachment @hero "Gate Seal Case" --tick 12' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Run' }));

    expect(window.__DEBUG?.spawnAttachment).toHaveBeenCalledWith('@hero', 'Gate Seal Case', { tick: 12 });
    expect(screen.getByLabelText('Encounter CLI output').textContent).toContain('Attachment spawned.');
  });

  it('runs move agent commands from the in-game CLI tab', () => {
    render(<DebugPanel currentTick={1} />);

    fireEvent.click(screen.getByText('CLI'));
    fireEvent.change(screen.getByLabelText('Encounter CLI input'), {
      target: { value: 'move agent @hero --hex 10 10' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Run' }));

    expect(window.__DEBUG?.moveAgent).toHaveBeenCalledWith('@hero', { col: 10, row: 10, locationQuery: undefined }, {
      destinationLabel: 'hex (10, 10)',
    });
    expect(screen.getByLabelText('Encounter CLI output').textContent).toContain('Move complete.');
  });

  it('runs a pasted batch of multiline commands in order', () => {
    render(<DebugPanel currentTick={1} />);

    fireEvent.click(screen.getByText('CLI'));
    fireEvent.change(screen.getByLabelText('Encounter CLI input'), {
      target: {
        value: 'spawn encounter-context cg.quest.gate_duty --agent @hero --hex 10 10\nspawn encounter @hero cg.quest.gate_duty --courtPosition the_first',
      },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Run' }));

    expect(window.__DEBUG?.spawnEncounterContext).toHaveBeenCalledWith('cg.quest.gate_duty', {
      agentQuery: '@hero',
      locationQuery: undefined,
      col: 10,
      row: 10,
      moveAgent: true,
    });
    expect(window.__DEBUG?.spawnEncounter).toHaveBeenCalledWith('@hero', 'cg.quest.gate_duty', {
      courtPosition: 'the_first',
      open: true,
    });
    expect(screen.getByLabelText('Encounter CLI output').textContent).toContain('> spawn encounter-context cg.quest.gate_duty --agent @hero --hex 10 10');
    expect(screen.getByLabelText('Encounter CLI output').textContent).toContain('> spawn encounter @hero cg.quest.gate_duty --courtPosition the_first');
  });
});
