#!/usr/bin/env node

import process from 'node:process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { UNIFIED_ACTION_TEMPLATES } from '../src/data/unified-action-templates';
import { runIntelProseCategoryLint, type IntelProseCategoryWarning } from '../src/testing/intelProseCategoryLint';

function formatWarning(w: IntelProseCategoryWarning): string {
  return (
    `WARN template:${w.templateId}\n` +
    `  reaction[${w.reactionId}] effect[${w.effectIndex}]: category '${w.category}' looks implausible.\n` +
    `  Checked substrings: ${w.searchedSubstrings.join(', ')}\n` +
    `  If intentional (region/targetId match not visible to static lint), this warning can be ignored.`
  );
}

function runCli(): number {
  let result;
  try {
    result = runIntelProseCategoryLint(UNIFIED_ACTION_TEMPLATES);
  } catch (error) {
    console.error(
      `intel-prose-category-lint failed: ${error instanceof Error ? error.message : String(error)}`,
    );
    return 1;
  }

  console.info(
    `intel-prose-category-lint: scanned ${result.templateCount} templates, ` +
    `${result.effectCount} intel_referenced_prose effects found.`,
  );

  for (const w of result.warnings) {
    console.info(formatWarning(w));
  }

  console.info(
    `Summary: ${result.effectCount} effects | ${result.warnings.length} warnings (advisory only — exits 0)`,
  );

  return 0;
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : '';
const currentFilePath = fileURLToPath(import.meta.url);
if (invokedPath === currentFilePath) {
  process.exit(runCli());
}
