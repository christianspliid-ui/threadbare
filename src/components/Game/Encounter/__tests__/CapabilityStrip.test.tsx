// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { CapabilityStrip } from '../CapabilityStrip';

interface FixtureCapability {
  id: string;
  label: string;
  sphereLabel?: string;
  narrativeHint?: string;
  filledDots: number;
  accentColor?: string;
}

function renderInViewport(node: React.ReactElement) {
  return render(
    <div style={{ width: 1920, height: 1080 }}>{node}</div>,
  );
}

function CapabilityStack({ capabilities }: { capabilities: FixtureCapability[] }) {
  return (
    <div style={{ display: 'grid', gap: 8, width: 420 }}>
      {capabilities.map((capability) => (
        <CapabilityStrip
          key={capability.id}
          label={capability.label}
          sphereLabel={capability.sphereLabel}
          narrativeHint={capability.narrativeHint}
          filledDots={capability.filledDots}
          accentColor={capability.accentColor}
        />
      ))}
    </div>
  );
}

const defaultThree: FixtureCapability[] = [
  {
    id: 'force',
    label: 'Force',
    sphereLabel: 'IRON',
    narrativeHint: 'a steady arm in a tight queue',
    filledDots: 3,
    accentColor: 'var(--sphere-force-bright)',
  },
  {
    id: 'mind',
    label: 'Mind',
    sphereLabel: 'EYE',
    narrativeHint: 'she misses little',
    filledDots: 3,
    accentColor: 'var(--sphere-mind-bright)',
  },
  {
    id: 'spirit',
    label: 'Spirit',
    sphereLabel: 'HEART',
    narrativeHint: 'her deepest thread',
    filledDots: 5,
    accentColor: 'var(--sphere-spirit-bright)',
  },
];

describe('CapabilityStrip snapshots', () => {
  it('matches snapshots for 3-strip, single-strip, and empty fail-soft fixtures', () => {
    const { asFragment, rerender } = renderInViewport(
      <CapabilityStack capabilities={defaultThree} />,
    );
    expect(asFragment()).toMatchSnapshot('three-strip-default');

    rerender(
      <div style={{ width: 1920, height: 1080 }}>
        <CapabilityStack
          capabilities={[
            {
              id: 'single',
              label: 'Force',
              sphereLabel: 'IRON',
              narrativeHint: 'one hard choice in view',
              filledDots: 4,
              accentColor: 'var(--sphere-force-bright)',
            },
          ]}
        />
      </div>,
    );
    expect(asFragment()).toMatchSnapshot('single-strip');

    rerender(
      <div style={{ width: 1920, height: 1080 }}>
        <CapabilityStack capabilities={[]} />
      </div>,
    );
    expect(asFragment()).toMatchSnapshot('empty-fail-soft');
  });
});
