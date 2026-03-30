/**
 * Agent Info Card Content Data
 *
 * Sections and display configuration for the agent detail panel.
 */

/** Ordered sections shown in the AgentInfoCard */
export const AGENT_INFO_SECTIONS = ['profile', 'inventory', 'relationships', 'movement'] as const;

/** Labels for each section */
export const AGENT_INFO_SECTION_LABELS: Record<string, string> = {
  profile: 'Profile',
  inventory: 'Inventory',
  relationships: 'Relationships',
  movement: 'Movement',
};
