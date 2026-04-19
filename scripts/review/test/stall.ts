#!/usr/bin/env node
// Test subprocess for review-wrapper: sleeps 700s to trigger the 600s timeout (THR-182)
// Usage: node stall.mjs

process.stdout.write(JSON.stringify({ heartbeat: true, elapsed_s: 0, step: 'starting stall test' }) + '\n');

// Sleep 700s — should be killed by wrapper's 600s wall-clock timeout
setTimeout(() => {
  process.exit(0); // should never reach here
}, 700_000);
