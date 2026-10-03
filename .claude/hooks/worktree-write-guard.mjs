#!/usr/bin/env node
// Gate 5: Two-tree edit-path guard (THR-685) — Node implementation (THR-1717).
//
// Blocks Write/Edit calls that target the HOME worktree while the session is
// running in a LINKED worktree. That combination is the "two-tree edit-path
// trap": both trees are usually byte-identical, so a repo-root-looking absolute
// path succeeds silently against the wrong tree and nothing surfaces until a
// symbol probe misses. Fired in 4 of 12 hourly runs on 2026-07-20/21
// (impediments #387, #417, #421).
//
// Gate on CWD, not on target alone: interactive sessions legitimately run IN the
// home tree and must never be blocked. Fail-soft everywhere — a guard that
// errors is a guard that stops real work.
//
// THR-880: ownership is resolved against the REGISTERED worktree list, never by
// a bare home-tree prefix test. The harness places .claude/worktrees/ inside the
// home tree's own working copy, so every linked worktree path begins with the
// home-tree path — a prefix test cannot tell a sibling-worktree write from a
// home-tree write, and blocked all of the former (impediment #317).
//
// THR-1717: why Node and not bash. The bash guard spawned `node` three times to
// read three JSON fields and made up to three `git` calls; on Windows that cost
// ~2 s on EVERY Edit/Write (Edit median 2.0 s vs Read 0.0 s, n = 1,586), and
// under load it hit the harness's 10 s timeout, where the hook is cancelled and
// the write goes through unchecked (93 times in two days). One process, one
// JSON parse, and one `git rev-parse` for both paths. The decision table below
// is a rule-for-rule port; `worktree-write-guard.sh` is now a shim that execs
// this file so its regression suite still exercises the real guard.

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ALLOW = 0;
const BLOCK = 2;

function git(cwd, args) {
  return execFileSync('git', ['-C', cwd, ...args], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
    windowsHide: true,
  });
}

// Normalize Windows separators; git reports forward slashes.
const slashes = (p) => p.replace(/\\/g, '/');
// Case-insensitive compare: Windows paths vary in drive-letter and segment case.
const lower = (p) => p.toLowerCase();

function main() {
  let input;
  try {
    input = JSON.parse(fs.readFileSync(0, 'utf8'));
  } catch {
    return ALLOW;
  }

  const tool = input?.tool_name;
  if (tool !== 'Write' && tool !== 'Edit') return ALLOW;

  const rawFile = input?.tool_input?.file_path;
  const rawCwd = input?.cwd;
  // Missing either field → nothing to reason about. Allow.
  if (typeof rawFile !== 'string' || !rawFile || typeof rawCwd !== 'string' || !rawCwd) return ALLOW;

  const filePath = slashes(rawFile);
  const cwd = slashes(rawCwd);

  // Resolve the session's worktree root and the shared .git dir in one call. In
  // a linked worktree --git-common-dir points at the MAIN repo's .git, so its
  // parent is the home tree. Derived, never hardcoded — works for
  // .claude/worktrees/* and sibling tfws-pickup-* alike.
  let wtRoot;
  let commonDir;
  try {
    [wtRoot, commonDir] = git(cwd, ['rev-parse', '--path-format=absolute', '--show-toplevel', '--git-common-dir'])
      .split(/\r?\n/)
      .map((s) => s.trim());
  } catch {
    return ALLOW;
  }
  if (!wtRoot || !commonDir) return ALLOW;
  wtRoot = slashes(wtRoot);
  const homeTree = path.posix.dirname(slashes(commonDir));

  const fpL = lower(filePath);
  const wtL = lower(wtRoot);
  const homeL = lower(homeTree);

  // Session is in the main tree (not a linked worktree) → allow everything.
  if (wtL === homeL) return ALLOW;

  // Target is inside the session worktree → correct tree, allow. Fast path for
  // the overwhelmingly common case; also handled by the ownership resolution.
  if (fpL.startsWith(`${wtL}/`)) return ALLOW;

  // --- Ownership resolution (THR-880) ------------------------------------
  // Which registered worktree does the target belong to? Every linked worktree
  // under .claude/worktrees/ is lexically under the home tree, so the LONGEST
  // matching registered root is the owner — never the first or the shortest.
  // Lexical on purpose: a Write may target a path that does not exist yet.
  let roots;
  try {
    roots = git(cwd, ['worktree', 'list', '--porcelain'])
      .split(/\r?\n/)
      .filter((line) => line.startsWith('worktree '))
      .map((line) => line.slice('worktree '.length));
  } catch {
    return ALLOW;
  }
  // Cannot enumerate → cannot attribute ownership. Fail-soft: allow.
  if (roots.length === 0) return ALLOW;

  let ownerL = '';
  for (const root of roots) {
    const rootL = lower(slashes(root));
    if (!rootL || !fpL.startsWith(`${rootL}/`)) continue;
    if (rootL.length > ownerL.length) ownerL = rootL;
  }

  // Not inside any registered worktree (a scratchpad, a temp dir, another
  // repo) → not this guard's business. Allow.
  if (!ownerL) return ALLOW;

  // Owned by a SIBLING linked worktree → a deliberate cross-worktree write
  // (THR-880). Allow.
  if (ownerL !== homeL) return ALLOW;

  // Owned by the home tree itself → the THR-685 trap. Block with the fix.
  const corrected = `${wtRoot}${filePath.slice(homeTree.length)}`;
  const mkdirNote = fs.existsSync(path.posix.dirname(corrected))
    ? ''
    : '\n(That directory does not exist in the session worktree yet — create it first.)';

  process.stderr.write(`Two-tree edit-path guard (THR-685): blocked a write into the HOME worktree from a linked-worktree session.

  session worktree : ${wtRoot}
  home tree        : ${homeTree}
  attempted path   : ${filePath}

The home tree is a read-only mirror of main (THR-672). This write would have
succeeded silently against the wrong tree — both trees are usually identical,
so nothing would surface until verification ran against unedited code.

Use the worktree-prefixed path instead:

  ${corrected}${mkdirNote}

If you genuinely meant the home tree, do it from a home-tree session. Recovery
for edits that already landed there: Docs/impediments.md #417 (diff → checkout
-- → git apply into the worktree).
`);
  return BLOCK;
}

process.exitCode = main();
