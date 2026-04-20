import type { CompositionValidationReport } from './validator';
import { validateComposition } from './validator';

export function runValidationHarness(compositionInput: unknown, worldInput: unknown): CompositionValidationReport {
  return validateComposition(compositionInput, worldInput);
}

export function formatValidationReport(report: CompositionValidationReport): string {
  const lines: string[] = [];
  lines.push(`Composition: ${report.compositionId}`);
  lines.push(`Will fire: ${report.willFire ? 'yes' : 'no'}`);
  lines.push('');
  lines.push('Preconditions:');
  for (const precondition of report.preconditions) {
    lines.push(
      `- #${precondition.index} [${precondition.strength}/${precondition.status}] ${precondition.message}`
    );
  }

  lines.push('');
  lines.push('Node resolution:');
  for (const node of Object.values(report.nodes)) {
    lines.push(`- ${node.nodeKey}: ${node.status} (${node.strategy}, ${node.tier}) - ${node.message}`);
  }

  lines.push('');
  lines.push(`Creations preview: ${report.creations.length}`);
  lines.push(`Mutations preview: ${report.mutations.length}`);
  lines.push(`Warnings: ${report.warnings.length}`);
  lines.push(`Errors: ${report.errors.length}`);
  return lines.join('\n');
}
