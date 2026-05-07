import React from 'react';
import { ThreadStrip, type ThreadStripData } from './ThreadStrip';
import { DetectionThread } from './DetectionThread';
import { DriftIndicator, type DriftIndicatorData } from './DriftIndicator';

export interface SceneStatePanelData {
  readonly threads: readonly ThreadStripData[];
  readonly factionsPresent: readonly string[];
  readonly placeConditions: readonly string[];
  readonly protagonistConditions: readonly string[];
  readonly detectionPressure?: number;
  readonly drift?: DriftIndicatorData | null;
}

export interface SceneStatePanelProps {
  data: SceneStatePanelData;
  onDriftDismiss?: (signature: string) => void;
}

const SECTION_LABEL_STYLE: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: 11,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: 'var(--text-tertiary)',
  marginBottom: 6,
};

const EMPTY_LINE_STYLE: React.CSSProperties = {
  fontSize: 11,
  fontStyle: 'italic',
  color: 'var(--text-muted)',
  lineHeight: 1.4,
};

const CONDITION_LINE_STYLE: React.CSSProperties = {
  fontSize: 12,
  color: 'var(--text-secondary)',
  lineHeight: 1.4,
};

function FactionChips({ factions }: { factions: readonly string[] }) {
  if (factions.length === 0) {
    return <div style={EMPTY_LINE_STYLE}>no factions present</div>;
  }
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {factions.map((faction) => (
        <span
          key={faction}
          data-testid={`encounter-scene-faction-${faction}`}
          style={{
            fontSize: 10,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: 'var(--accent-gold-dim)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 999,
            padding: '2px 8px',
            background: 'var(--bg-raised)',
          }}
        >
          {faction}
        </span>
      ))}
    </div>
  );
}

function ConditionList({
  conditions,
  emptyText,
  testIdPrefix,
}: {
  conditions: readonly string[];
  emptyText: string;
  testIdPrefix: string;
}) {
  if (conditions.length === 0) {
    return <div style={EMPTY_LINE_STYLE}>{emptyText}</div>;
  }
  return (
    <ul
      style={{
        listStyle: 'none',
        margin: 0,
        padding: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
      }}
    >
      {conditions.map((condition, index) => (
        <li
          key={`${testIdPrefix}-${index}`}
          data-testid={`${testIdPrefix}-${index}`}
          style={CONDITION_LINE_STYLE}
        >
          {condition}
        </li>
      ))}
    </ul>
  );
}

/**
 * SceneStatePanel — bottom of the right rail (Phase C4).
 * Renders:
 *   - threads in play (sphere-coded, weighted)
 *   - the regional detection thread (when pressure ≥ 0.50)
 *   - factions present (chips)
 *   - place conditions
 *   - conditions on the protagonist
 *   - cumulative archetype drift indicator (italic, threshold-tiered)
 *
 * Reads scene state from the encounter contract; reads drift from B1
 * (driftAccumulator); reads detection from B4 (detectionPressure). No numbers
 * are surfaced — every signal expresses through prose + visual weight.
 */
export function SceneStatePanel({ data, onDriftDismiss }: SceneStatePanelProps) {
  const detectionPressure = data.detectionPressure ?? 0;
  const driftValue = data.drift ?? null;

  return (
    <section
      data-testid="encounter-scene-state-panel"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        padding: 12,
        background: 'var(--bg-surface)',
        borderTop: '1px solid var(--border-subtle)',
      }}
    >
      <div data-testid="encounter-scene-threads">
        <div style={SECTION_LABEL_STYLE}>Threads In Play</div>
        {data.threads.length === 0 && detectionPressure < 0.5 ? (
          <div style={EMPTY_LINE_STYLE}>no threads pulled tight</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {data.threads.map((thread) => (
              <ThreadStrip key={thread.id} thread={thread} />
            ))}
            <DetectionThread pressure={detectionPressure} />
          </div>
        )}
      </div>

      <div data-testid="encounter-scene-factions">
        <div style={SECTION_LABEL_STYLE}>Factions Present</div>
        <FactionChips factions={data.factionsPresent} />
      </div>

      <div data-testid="encounter-scene-place-conditions">
        <div style={SECTION_LABEL_STYLE}>Place Conditions</div>
        <ConditionList
          conditions={data.placeConditions}
          emptyText="the place rests ordinary"
          testIdPrefix="encounter-scene-place-condition"
        />
      </div>

      <div data-testid="encounter-scene-protagonist-conditions">
        <div style={SECTION_LABEL_STYLE}>Conditions On Her</div>
        <ConditionList
          conditions={data.protagonistConditions}
          emptyText="she carries nothing unusual"
          testIdPrefix="encounter-scene-protagonist-condition"
        />
      </div>

      <DriftIndicator drift={driftValue} onDismiss={onDriftDismiss} />
    </section>
  );
}
