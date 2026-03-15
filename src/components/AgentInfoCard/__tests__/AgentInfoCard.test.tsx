import { describe, it, expect } from 'vitest';
import { AGENT_INFO_SECTIONS } from '../../../data/agent-info-content';

describe('agent-info-content', () => {
  it('defines the required sections', () => {
    expect(AGENT_INFO_SECTIONS).toContain('profile');
    expect(AGENT_INFO_SECTIONS).toContain('inventory');
    expect(AGENT_INFO_SECTIONS).toContain('relationships');
  });
});
