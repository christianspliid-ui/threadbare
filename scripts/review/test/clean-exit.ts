#!/usr/bin/env node
// Test subprocess for review-wrapper: emits 3 heartbeats then clean findings (THR-182)
// Usage: node clean-exit.mjs

import { type ReviewFindings } from '../types.js';

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function heartbeat(step: string, elapsedMs: number): void {
  process.stdout.write(JSON.stringify({ heartbeat: true, elapsed_s: Math.round(elapsedMs / 1000), step }) + '\n');
}

async function run(): Promise<void> {
  const start = Date.now();

  heartbeat('starting mock review', 0);
  await sleep(1_000);

  heartbeat('scanning types', Date.now() - start);
  await sleep(1_000);

  heartbeat('checking nfp compliance', Date.now() - start);
  await sleep(500);

  const findings: ReviewFindings = {
    verdict: 'none',
    summary: 'No structural issues found in this diff.',
    findings: [],
    reviewedAt: new Date().toISOString(),
  };
  process.stdout.write(JSON.stringify(findings) + '\n');
  process.exit(0);
}

run();
