#!/usr/bin/env bash
#
# ops-publish.sh — publish operational exhaust to the `ops` branch (THR-947).
#
# WHY THIS EXISTS
#
# The coordination layer stores its state as files. Until THR-947 those files
# lived on protected `main`, so every hourly status artifact became a
# branch → PR → CI → merge cycle. Measured 2026-08-01 10:24–14:24Z: 8 merges to
# `main`, only 3 of them product code. Under strict branch protection each of
# those ~90s paperwork merges knocked every in-flight code PR to BEHIND, costing
# an ~18-minute gate re-run apiece (THR-920, THR-945, THR-735).
#
# Branch protection covers `main` only. Publishing exhaust to an unprotected
# `ops` branch therefore needs no PR, no CI, no auto-merge, and cannot move
# `main`'s tip — which removes the collision at its source rather than managing
# it downstream.
#
# WHY PLUMBING AND NOT A CHECKOUT
#
# This commits with `hash-object` / `update-index` / `commit-tree` against a
# throwaway index, and never checks anything out. Three properties follow, and
# all three are load-bearing:
#
#   1. No working tree is touched — so this is safe to call from a session
#      worktree without violating the THR-672 home-tree rule, and it cannot
#      manufacture the phantom-diff state THR-671 produced.
#   2. No `git worktree add` — so the hourly reaper has nothing new to reap and
#      the THR-797 reaped-worktree-retargets-git trap cannot fire here.
#   3. The caller's branch, index and HEAD are untouched, so a lane can publish
#      mid-session without disturbing whatever else it is doing.
#
# USAGE
#
#   bash scripts/ops-publish.sh -m "<message>" <repo-relative-path>...
#
# Paths are repo-relative and must exist in the calling worktree; the script
# refuses to run outside the repository root so a relative path can never be
# ambiguous. Content is read from the caller's working tree, not its index, so
# files do NOT need to be staged or committed first.
#
#   bash scripts/ops-publish.sh -m "docs(briefing): refresh (2026-08-02 01:26)" \
#     Design/briefing.md Design/user-actions.md
#
# Exit codes: 0 published (or nothing to publish), 1 failed. Callers treat a
# failure as fail-soft — note it in the run output and let the next run
# reconcile; the file content is still sitting in the worktree.

set -euo pipefail

OPS_BRANCH="${OPS_BRANCH:-ops}"
OPS_REMOTE="${OPS_REMOTE:-origin}"
# A push races only against other lanes publishing in the same second. Three
# attempts is generous: each retry re-fetches, so a loser rebuilds on the
# winner's tree rather than clobbering it.
MAX_PUSH_RETRIES="${OPS_PUBLISH_MAX_RETRIES:-3}"

die() { echo "[ops-publish] ERROR: $*" >&2; exit 1; }

MESSAGE=""
FILES=()
while [ $# -gt 0 ]; do
  case "$1" in
    -m|--message) MESSAGE="${2:-}"; shift 2 ;;
    -h|--help) sed -n '1,50p' "$0"; exit 0 ;;
    -*) die "unknown flag: $1" ;;
    *) FILES+=("$1"); shift ;;
  esac
done

[ -n "$MESSAGE" ] || die "missing -m <message>"
[ "${#FILES[@]}" -gt 0 ] || die "no files given"

TOPLEVEL="$(git rev-parse --show-toplevel)" || die "not inside a git repository"
# Paths are interpreted repo-relative, so refuse to guess from a subdirectory.
[ "$(pwd -P)" = "$(cd "$TOPLEVEL" && pwd -P)" ] || \
  die "run from the repository root ($TOPLEVEL), not $(pwd -P)"

for f in "${FILES[@]}"; do
  [ -f "$f" ] || die "no such file: $f"
  case "$f" in
    /*|../*|*/../*) die "path must be repo-relative and inside the repo: $f" ;;
  esac
done

git fetch "$OPS_REMOTE" "$OPS_BRANCH" --quiet 2>/dev/null || true

attempt=1
while [ "$attempt" -le "$MAX_PUSH_RETRIES" ]; do
  # `mktemp -u` yields a name that does not exist: git writes a fresh index
  # there. An existing zero-byte file would read as a corrupt index.
  GIT_INDEX_FILE="$(mktemp -u)"
  export GIT_INDEX_FILE
  trap 'rm -f "$GIT_INDEX_FILE"' EXIT

  parent=""
  if git rev-parse --verify --quiet "refs/remotes/$OPS_REMOTE/$OPS_BRANCH" >/dev/null; then
    parent="$(git rev-parse "refs/remotes/$OPS_REMOTE/$OPS_BRANCH")"
    git read-tree "$parent"
  fi

  for f in "${FILES[@]}"; do
    blob="$(git hash-object -w -- "$f")"
    # Everything published here is text. Hard-coding the mode avoids depending
    # on core.filemode, which is false on Windows and would flip modes randomly.
    git update-index --add --cacheinfo "100644,$blob,$f"
  done

  tree="$(git write-tree)"

  if [ -n "$parent" ] && [ "$tree" = "$(git rev-parse "$parent^{tree}")" ]; then
    echo "[ops-publish] no content change against $OPS_REMOTE/$OPS_BRANCH — nothing to publish."
    rm -f "$GIT_INDEX_FILE"; trap - EXIT
    exit 0
  fi

  if [ -n "$parent" ]; then
    commit="$(git commit-tree "$tree" -p "$parent" -m "$MESSAGE")"
  else
    commit="$(git commit-tree "$tree" -m "$MESSAGE")"
  fi

  rm -f "$GIT_INDEX_FILE"; trap - EXIT
  unset GIT_INDEX_FILE

  if git push "$OPS_REMOTE" "$commit:refs/heads/$OPS_BRANCH" --quiet 2>/dev/null; then
    echo "[ops-publish] published ${#FILES[@]} file(s) to $OPS_REMOTE/$OPS_BRANCH as ${commit:0:7} (attempt $attempt)."
    exit 0
  fi

  echo "[ops-publish] push rejected (attempt $attempt/$MAX_PUSH_RETRIES) — re-fetching and rebuilding." >&2
  git fetch "$OPS_REMOTE" "$OPS_BRANCH" --quiet 2>/dev/null || true
  attempt=$((attempt + 1))
done

die "could not publish to $OPS_REMOTE/$OPS_BRANCH after $MAX_PUSH_RETRIES attempts"
