#!/usr/bin/env node
// CC review client — called as a subprocess by wrapper.ts (THR-182)
//
// Reads diff from stdin (or --diff <path>), calls Claude API for structural review,
// emits heartbeat JSON to stdout every HEARTBEAT_INTERVAL_MS, then emits findings JSON.
//
// Requires: ANTHROPIC_API_KEY env var
//
// Output protocol (newline-delimited JSON to stdout):
//   Heartbeats: {"heartbeat":true,"elapsed_s":N,"step":"..."}
//   Findings:   {"verdict":"none|minor|major","summary":"...","findings":[...]}

import { readFileSync } from 'fs';
import { type ReviewFindings } from './types.js';

const HEARTBEAT_INTERVAL_MS = 30_000;
const MODEL = 'claude-sonnet-4-6';

const REVIEW_SYSTEM_PROMPT = `You are a structural code reviewer for a TypeScript/React game engine project (The Fantasy World Simulator).

Review the provided git diff for:
1. Type errors or TypeScript violations that tsc --noEmit would not catch (runtime type unsafety, etc.)
2. NFP violations: missing named constants (magic numbers), missing traces/inspectability, non-deterministic PRNG calls, crash risks in the tick loop
3. Three-pillar completeness: if the change touches Engine, are Content and UI pillars addressed?
4. Architectural violations: new property-bag relationships that should be graph edges, new singletons that bypass SimulationRuntime scoping, V1 SVG hex map artifacts
5. Orphan deferrals: TODO/DEFERRED comments without a THR-XX reference

Return a JSON object ONLY — no prose, no markdown fences:
{
  "verdict": "none" | "minor" | "major",
  "summary": "one sentence",
  "findings": [
    { "severity": "minor" | "major", "category": "nfp|arch|three-pillar|type|deferral", "description": "...", "file": "optional", "line": null }
  ]
}

"none" = no issues. "minor" = issues worth noting but not blocking. "major" = blocking issues that should be fixed before merge.`;

function heartbeat(elapsedMs: number, step: string): void {
  const line = JSON.stringify({ heartbeat: true, elapsed_s: Math.round(elapsedMs / 1000), step });
  process.stdout.write(line + '\n');
}

function emitFindings(findings: ReviewFindings): void {
  process.stdout.write(JSON.stringify(findings) + '\n');
}

async function readDiff(): Promise<string> {
  const args = process.argv.slice(2);
  const diffFlag = args.indexOf('--diff');
  if (diffFlag >= 0 && args[diffFlag + 1]) {
    return readFileSync(args[diffFlag + 1], 'utf-8');
  }
  // Read from stdin
  return new Promise((resolve) => {
    let buf = '';
    process.stdin.setEncoding('utf-8');
    process.stdin.on('data', (chunk) => { buf += chunk; });
    process.stdin.on('end', () => resolve(buf));
  });
}

async function run(): Promise<void> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    process.stderr.write('[review-client] ANTHROPIC_API_KEY not set\n');
    process.exit(1);
  }

  const startMs = Date.now();

  heartbeat(0, 'reading diff');
  const diff = await readDiff();

  if (!diff.trim()) {
    process.stderr.write('[review-client] empty diff, nothing to review\n');
    emitFindings({ verdict: 'none', summary: 'Empty diff — nothing to review', findings: [], reviewedAt: new Date().toISOString() });
    process.exit(0);
  }

  heartbeat(Date.now() - startMs, 'calling Claude API');

  // Set up heartbeat interval while waiting for API response
  let apiDone = false;
  const hbTimer = setInterval(() => {
    if (!apiDone) heartbeat(Date.now() - startMs, 'waiting for review response');
  }, HEARTBEAT_INTERVAL_MS);

  let findings: ReviewFindings;
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 2048,
        system: REVIEW_SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: `Review this diff:\n\n\`\`\`diff\n${diff.slice(0, 30_000)}\n\`\`\``,
          },
        ],
      }),
    });

    apiDone = true;
    clearInterval(hbTimer);

    if (!response.ok) {
      const body = await response.text();
      process.stderr.write(`[review-client] API error ${response.status}: ${body}\n`);
      emitFindings({
        verdict: 'error',
        summary: `API returned ${response.status}`,
        findings: [],
        reviewedAt: new Date().toISOString(),
      });
      process.exit(1);
    }

    const data = await response.json() as { content: Array<{ type: string; text: string }> };
    const text = data.content?.[0]?.text ?? '{}';

    heartbeat(Date.now() - startMs, 'parsing response');

    const parsed = JSON.parse(text) as ReviewFindings;
    findings = { ...parsed, reviewedAt: new Date().toISOString() };
  } catch (err) {
    apiDone = true;
    clearInterval(hbTimer);
    process.stderr.write(`[review-client] error: ${err instanceof Error ? err.message : String(err)}\n`);
    emitFindings({
      verdict: 'error',
      summary: `Review client error: ${err instanceof Error ? err.message : String(err)}`,
      findings: [],
      reviewedAt: new Date().toISOString(),
    });
    process.exit(1);
  }

  emitFindings(findings);
  process.exit(0);
}

run().catch((err) => {
  process.stderr.write(`[review-client] fatal: ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(2);
});
