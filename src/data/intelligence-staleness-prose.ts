/**
 * Threshold-crossing prose for intelligence reliability decay (THR-137).
 *
 * Two transition tables × 3 variants each. Category-agnostic for v1.
 * {agent.name} and {intel.label} are resolved at emission time by the decay phase.
 * Per-category tables can be added as a keyed lookup layer without breaking
 * the existing consumers.
 */

export const STALENESS_PROSE_RELIABLE_TO_UNCERTAIN: readonly string[] = [
  "What {agent.name} knew about {intel.label} grows less certain. Details slip. The shape persists.",
  "The memory of {intel.label} softens at its edges for {agent.name}.",
  "{agent.name}'s grip on {intel.label} loosens — still knowledge, but knowledge that could lie.",
];

export const STALENESS_PROSE_UNCERTAIN_TO_DUBIOUS: readonly string[] = [
  "{intel.label} is, for {agent.name}, now rumour more than record.",
  "{agent.name} can no longer swear to {intel.label}. Only that there was, once, something.",
  "What {intel.label} meant for {agent.name} has worn down to a half-truth.",
];
