#!/usr/bin/env bash
# Gate 5: Two-tree edit-path guard (THR-685, THR-880) — shim.
#
# The guard is implemented in worktree-write-guard.mjs (THR-1717): one Node
# process instead of bash + three `node` spawns + up to three `git` calls, which
# cost ~2 s per Edit/Write on Windows and timed out (fail-open) under load.
# `.claude/settings.json` registers the .mjs directly; this shim keeps the
# regression suite (scripts/__tests__/worktree-write-guard.test.ts) and every
# doc reference to the .sh pointed at the real guard. stdin passes through exec.
exec node "$(dirname "$0")/worktree-write-guard.mjs"
