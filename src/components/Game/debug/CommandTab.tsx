import React, { useMemo, useState } from 'react';
import type { RetinueAgent } from '../../../engine/retinue';
import { parseDebugCommand } from '../../../engine/debugCommands';
import { EMPTY_STATE_STYLE, PANEL_STYLES } from './debugPanelStyles';

interface CommandTabProps {
  retinueAgents?: readonly RetinueAgent[];
  followAgentId?: string;
}

function formatInspectResult(value: unknown): string {
  if (value == null) return 'No encounter pipeline data returned.';
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

const PANEL_CARD: React.CSSProperties = {
  border: '1px solid var(--border-subtle)',
  borderRadius: '8px',
  background: 'var(--bg-raised)',
  padding: '12px',
};

const COMMAND_INPUT: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: '6px',
  border: '1px solid var(--border-subtle)',
  background: 'var(--bg-deep)',
  color: 'var(--text-primary)',
  fontFamily: 'Consolas, Monaco, monospace',
  fontSize: '12px',
  resize: 'vertical',
  minHeight: '88px',
};

const RUN_BUTTON: React.CSSProperties = {
  padding: '8px 12px',
  borderRadius: '6px',
  border: '1px solid var(--border-subtle)',
  background: 'var(--accent-gold)',
  color: '#16120b',
  fontWeight: 600,
  cursor: 'pointer',
};

const EXAMPLE_BUTTON: React.CSSProperties = {
  padding: '6px 8px',
  borderRadius: '6px',
  border: '1px solid var(--border-subtle)',
  background: 'var(--bg-abyss)',
  color: 'var(--text-primary)',
  cursor: 'pointer',
  fontSize: '11px',
  textAlign: 'left',
};

const OUTPUT_STYLE: React.CSSProperties = {
  ...PANEL_CARD,
  whiteSpace: 'pre-wrap',
  fontFamily: 'Consolas, Monaco, monospace',
  fontSize: '12px',
  color: 'var(--text-primary)',
  minHeight: '120px',
};

export function CommandTab({ retinueAgents = [], followAgentId }: CommandTabProps) {
  const defaultAgent = useMemo(() => {
    if (followAgentId) return followAgentId;
    return retinueAgents[0]?.id ?? '@hero';
  }, [followAgentId, retinueAgents]);

  const [command, setCommand] = useState(
    `spawn encounter-context cg.quest.gate_duty --agent "${defaultAgent}" --hex 10 10\nspawn encounter "${defaultAgent}" cg.quest.gate_duty --courtPosition the_first`,
  );
  const [output, setOutput] = useState('Ready.\nTry spawning Gate Duty or inspect the encounter pipeline.');

  const examples = useMemo(
    () => [
      `spawn encounter-context cg.quest.gate_duty --agent "${defaultAgent}" --hex 10 10`,
      `spawn encounter "${defaultAgent}" cg.quest.gate_duty --courtPosition the_first`,
      `spawn attachment "${defaultAgent}" "Gate Seal Case"`,
      'spawn location town --hex 10 10 --name "Debug Town"',
      'spawn sublocation sublocation-type.gatehouse --hex 10 10 --name "South Gatehouse"',
      'spawn npc guard_captain --hex 10 10 --name "Captain Merrow" --faction civic_guard --spotlight notable',
      `move agent "${defaultAgent}" --hex 10 10`,
      `spawn encounter "${defaultAgent}" cg.quest.gate_duty --courtPosition retinue`,
      `inspect encounters "${defaultAgent}"`,
    ],
    [defaultAgent],
  );

  const executeCommand = (commandText: string): string => {
    const parsed = parseDebugCommand(commandText);
    if ('error' in parsed) {
      return `Error: ${parsed.error}`;
    }

    if (!window.__DEBUG) {
      return 'Error: debug bridge not available.';
    }

    if (parsed.kind === 'spawn-encounter') {
      const result = window.__DEBUG.spawnEncounter(parsed.agentQuery, parsed.templateId, {
        courtPosition: parsed.courtPosition,
        open: true,
      });
      return [
        result.success ? 'Spawn complete.' : 'Spawn failed.',
        result.message,
        result.templateId ? `template: ${result.templateId}` : null,
        result.templateName ? `name: ${result.templateName}` : null,
        result.mode ? `mode: ${result.mode}` : null,
        result.actionId ? `action: ${result.actionId}` : null,
        result.notificationId ? `notification: ${result.notificationId}` : null,
      ].filter(Boolean).join('\n');
    }

    if (parsed.kind === 'spawn-encounter-context') {
      const result = window.__DEBUG.spawnEncounterContext(parsed.templateId, {
        agentQuery: parsed.agentQuery,
        locationQuery: parsed.locationQuery,
        col: parsed.col,
        row: parsed.row,
        moveAgent: parsed.moveAgent,
      });
      return [
        result.success ? 'Context ready.' : 'Context failed.',
        result.message,
        result.anchorLocationName ? `anchor: ${result.anchorLocationName}` : null,
        result.agentName ? `agent: ${result.agentName}${result.movedAgent ? ' (moved)' : ''}` : null,
        result.bindings ? `bindings: ${result.bindings.length}` : null,
        result.blockedKeys?.length ? `blocked: ${result.blockedKeys.join(', ')}` : null,
        result.unresolvedKeys?.length ? `unresolved: ${result.unresolvedKeys.join(', ')}` : null,
      ].filter(Boolean).join('\n');
    }

    if (parsed.kind === 'spawn-attachment') {
      const result = window.__DEBUG.spawnAttachment(parsed.agentQuery, parsed.templateQuery, {
        tick: parsed.tick,
      });
      return [
        result.success ? 'Attachment spawned.' : 'Attachment spawn failed.',
        result.message,
        result.nodeName ? `node: ${result.nodeName}` : null,
        parsed.tick !== undefined ? `tick: ${parsed.tick}` : null,
      ].filter(Boolean).join('\n');
    }

    if (parsed.kind === 'spawn-location') {
      const result = window.__DEBUG.spawnLocation(parsed.subtype, parsed.col, parsed.row, {
        name: parsed.name,
      });
      return [
        result.success ? 'Spawn complete.' : 'Spawn failed.',
        result.message,
        result.nodeName ? `node: ${result.nodeName}` : null,
        result.locationName && result.locationName !== result.nodeName ? `anchor: ${result.locationName}` : null,
      ].filter(Boolean).join('\n');
    }

    if (parsed.kind === 'spawn-sublocation') {
      const result = window.__DEBUG.spawnSublocation(parsed.sublocationTypeId, {
        locationQuery: parsed.locationQuery,
        col: parsed.col,
        row: parsed.row,
      }, {
        name: parsed.name,
      });
      return [
        result.success ? 'Spawn complete.' : 'Spawn failed.',
        result.message,
        result.nodeName ? `node: ${result.nodeName}` : null,
        result.locationName ? `anchor: ${result.locationName}` : null,
      ].filter(Boolean).join('\n');
    }

    if (parsed.kind === 'spawn-npc') {
      const result = window.__DEBUG.spawnNpc(parsed.role, {
        locationQuery: parsed.locationQuery,
        col: parsed.col,
        row: parsed.row,
      }, {
        name: parsed.name,
        factionDefId: parsed.factionDefId,
        spotlightTier: parsed.spotlightTier,
      });
      return [
        result.success ? 'Spawn complete.' : 'Spawn failed.',
        result.message,
        result.nodeName ? `node: ${result.nodeName}` : null,
        result.locationName ? `anchor: ${result.locationName}` : null,
      ].filter(Boolean).join('\n');
    }

    if (parsed.kind === 'move-agent') {
      const result = window.__DEBUG.moveAgent(parsed.agentQuery, {
        locationQuery: parsed.locationQuery,
        col: parsed.col,
        row: parsed.row,
      }, {
        destinationLabel: parsed.locationQuery ?? (parsed.col !== undefined && parsed.row !== undefined ? `hex (${parsed.col}, ${parsed.row})` : undefined),
      });
      return [
        result.success ? 'Move complete.' : 'Move failed.',
        result.message,
        result.nodeName ? `agent: ${result.nodeName}` : null,
        result.locationName ? `location: ${result.locationName}` : null,
      ].filter(Boolean).join('\n');
    }

    const inspect = window.__DEBUG.inspectEncounterPipeline(parsed.agentFilter);
    return formatInspectResult(inspect);
  };

  const runCommand = () => {
    const lines = command
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      setOutput('Error: enter a command.');
      return;
    }

    const combinedOutput = lines
      .map(line => `> ${line}\n${executeCommand(line)}`)
      .join('\n\n');

    setOutput(combinedOutput);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '8px' }}>
      <div style={PANEL_CARD}>
        <div style={{ color: 'var(--accent-gold)', fontWeight: 600, marginBottom: '8px' }}>Encounter CLI</div>
        <div style={{ color: 'var(--text-muted)', fontSize: '12px', lineHeight: 1.5, marginBottom: '10px' }}>
          Use the in-game debug panel to spawn real encounters and inspect the encounter pipeline without leaving the sim.
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            runCommand();
          }}
          style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
        >
          <textarea
            aria-label="Encounter CLI input"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            rows={4}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                runCommand();
              }
            }}
            style={COMMAND_INPUT}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
              Supported: <code>spawn encounter-context</code>, <code>spawn encounter</code>, <code>spawn attachment</code>, <code>spawn location</code>, <code>spawn sublocation</code>, <code>spawn npc</code>, <code>move agent</code>, <code>inspect encounters</code>. Run one command per line, or press <code>Ctrl+Enter</code> to execute the whole batch.
            </div>
            <button type="submit" style={RUN_BUTTON}>Run</button>
          </div>
        </form>
      </div>

      <div style={PANEL_CARD}>
        <div style={{ color: 'var(--accent-gold)', fontWeight: 600, marginBottom: '8px' }}>Examples</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {examples.map((example) => (
            <button
              key={example}
              type="button"
              style={EXAMPLE_BUTTON}
              onClick={() => setCommand(example)}
            >
              {example}
            </button>
          ))}
        </div>
      </div>

      <div aria-label="Encounter CLI output" style={output ? OUTPUT_STYLE : EMPTY_STATE_STYLE}>
        {output}
      </div>
    </div>
  );
}
