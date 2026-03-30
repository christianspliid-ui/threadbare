// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { IntentSection } from '../IntentSection';
import type { ActiveIntent } from '../../../engine/agentDetail';

// ─── Fixtures ────────────────────────────────────────────────────

const primaryIntent: ActiveIntent = {
  templateId: 'conquer_territory',
  displayName: 'Conquer Territory',
  category: 'dominion',
  priority: 'primary',
  completedMilestones: 1,
  requiredMilestones: 3,
  reachAffinity: { iron: 0.6, shadow: 0.3 },
};

const secondaryIntent: ActiveIntent = {
  templateId: 'forge_mastery',
  displayName: 'Forge Mastery',
  category: 'mastery',
  priority: 'secondary',
  completedMilestones: 0,
  requiredMilestones: 2,
  reachAffinity: {},
};

const reactiveIntent: ActiveIntent = {
  templateId: 'path_of_vengeance',
  displayName: 'Path of Vengeance',
  category: 'vengeance',
  priority: 'primary',
  completedMilestones: 0,
  requiredMilestones: 3,
  reachAffinity: {},
  reactiveTrigger: 'betrayal',
};

// ─── Tests ────────────────────────────────────────────────────────

describe('IntentSection (modal variant)', () => {
  it('renders "No discernible intent" when intents is empty', () => {
    render(<IntentSection intents={[]} variant="modal" />);
    expect(screen.getByText('No discernible intent')).toBeTruthy();
  });

  it('renders section header "Intent"', () => {
    render(<IntentSection intents={[primaryIntent]} variant="modal" />);
    expect(screen.getByText('Intent')).toBeTruthy();
  });

  it('renders ambition display name', () => {
    render(<IntentSection intents={[primaryIntent]} variant="modal" />);
    expect(screen.getByText('Conquer Territory')).toBeTruthy();
  });

  it('renders priority badge', () => {
    render(<IntentSection intents={[primaryIntent]} variant="modal" />);
    expect(screen.getByText('primary')).toBeTruthy();
  });

  it('renders milestone pips with correct aria-label', () => {
    render(<IntentSection intents={[primaryIntent]} variant="modal" />);
    expect(screen.getByLabelText('1 of 3 milestones')).toBeTruthy();
  });

  it('renders two intent cards', () => {
    render(<IntentSection intents={[primaryIntent, secondaryIntent]} variant="modal" />);
    expect(screen.getByText('Conquer Territory')).toBeTruthy();
    expect(screen.getByText('Forge Mastery')).toBeTruthy();
  });

  it('renders reactive trigger text', () => {
    render(<IntentSection intents={[reactiveIntent]} variant="modal" />);
    expect(screen.getByText(/Triggered by: betrayal/)).toBeTruthy();
  });

  it('omits reactive trigger row when not present', () => {
    render(<IntentSection intents={[primaryIntent]} variant="modal" />);
    expect(screen.queryByText(/Triggered by/)).toBeNull();
  });
});

describe('IntentSection (panel variant)', () => {
  it('renders "No discernible intent" when intents is empty', () => {
    render(<IntentSection intents={[]} variant="panel" />);
    expect(screen.getByText('No discernible intent')).toBeTruthy();
  });

  it('renders intent name in panel style', () => {
    render(<IntentSection intents={[primaryIntent]} variant="panel" />);
    expect(screen.getByText('Conquer Territory')).toBeTruthy();
  });

  it('renders reactive trigger in panel variant', () => {
    render(<IntentSection intents={[reactiveIntent]} variant="panel" />);
    expect(screen.getByText(/betrayal/)).toBeTruthy();
  });
});
