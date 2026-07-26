# `clean-stale-git.sh` — recoverability mirror

The Threadbare host git reaper lives at `C:/Users/chris/Dev/Projects/clean-stale-git.sh`,
**outside** version control — it runs hourly at `:40` via Windows Task Scheduler
(`Threadbare Git Cleanup`; see CLAUDE.md § Scheduled Tasks → Windows Task Scheduler lane).
Because it is not tracked, a disk loss takes it with it. This file is a **copy for
recoverability and review**, not the source of truth. When you change the script, update
this mirror in the same PR (as THR-753 does).

Last synced: 2026-07-26 (THR-797 — live-session-safe worktree reaping).

## Full script body

```bash
#!/usr/bin/env bash
# clean-stale-git.sh — keep Threadbare's local git tree small.
#
# Safe, idempotent prune of stale worktrees and branches. Designed to run
# unattended (Windows Task Scheduler) but also fine to run by hand:
#     bash /c/Users/chris/Dev/Projects/clean-stale-git.sh
#
# What it does (and what it WON'T touch):
#   1. Removes worktrees whose branch is merged into origin/main AND which have
#      no substantive uncommitted work (line-ending / .codesight noise ignored).
#   2. Prunes stale worktree metadata.
#   3. Deletes local branches that are: merged into origin/main, OR whose remote
#      is gone (PR merged+deleted), OR ephemeral session branches
#      (claude/* pickup/* resume/*) that are no longer checked out.
#
#   NEVER deletes: main, any branch checked out in a live worktree, any branch
#   with an OPEN pull request, or any worktree holding real uncommitted work.
#
# The remote side is already self-cleaning (GitHub delete_branch_on_merge=true).
set -uo pipefail

REPO="C:/Users/chris/Dev/Projects/TheFantasyWorldSimulator"
LOG="C:/Users/chris/Dev/Projects/clean-stale-git.log"
exec > >(tee -a "$LOG") 2>&1
echo "===== clean-stale-git $(date '+%Y-%m-%d %H:%M:%S') ====="

cd "$REPO" || { echo "repo not found: $REPO"; exit 1; }
git fetch origin --prune --quiet 2>/dev/null
MAIN=$(git rev-parse origin/main 2>/dev/null) || { echo "no origin/main"; exit 1; }

# Branches checked out in any worktree — never delete these.
CHECKED_OUT=$(git worktree list --porcelain | awk '/^branch /{sub("refs/heads/","",$2); print $2}')
is_checked_out() { grep -qxF "$1" <<< "$CHECKED_OUT"; }

# Open-PR head branches — never delete these (gh optional; empty if unavailable).
OPEN_PRS=$(gh pr list --state open --limit 400 --json headRefName -q '.[].headRefName' 2>/dev/null | sort -u)
has_open_pr() { [ -n "$OPEN_PRS" ] && grep -qxF "$1" <<< "$OPEN_PRS"; }

# Branch belongs to an unregistered-but-still-active worktree corpse (THR-797)?
# Matched on basename: worktree dir `<name>` ↔ branch `claude/<name>` (also pickup/,
# resume/). Populated by the orphan-dir sweep, which runs before the branch pass.
# No match → behaviour is exactly as before, so this can only ever keep MORE branches.
has_live_orphan_dir() {
  [ -n "${LIVE_ORPHAN_BASENAMES:-}" ] && grep -qxF "${1##*/}" <<< "$LIVE_ORPHAN_BASENAMES"
}

noise='^(\.codesight/|dist/|node_modules/|\.codex-edge-profile/|coverage/|\.vite/)'

# Liveness guard (THR-673). A live session's worktree is indistinguishable from
# a finished one: rebased to zero unique commits with nothing uncommitted looks
# exactly like merged, work-free debris. Removing one mid-session partially
# succeeds — git unregisters it and deletes .git, but the rm fails because the
# directory is in use — and the NEXT run then deletes the session's branch,
# because an unregistered worktree no longer protects it via is_checked_out.
# So: never touch a worktree whose git admin dir shows recent activity.
WORKTREE_MIN_IDLE_MINUTES=${WORKTREE_MIN_IDLE_MINUTES:-180}

# Working-tree activity probe (THR-797). The git-admin-dir signal below only moves
# on git operations, but a session's CLOSEOUT — Linear updates, doc edits, impediment
# logging — writes files for hours without touching git. On 2026-07-26 that blind spot
# fired: PR #880 merged 03:38, is_live correctly skipped the worktree at 03:40/04:40/
# 05:40/06:40/07:40, then at 08:40 the admin mtimes aged past 180m and removal ran
# against a session that was still very much alive. The tell is in that one run's own
# log: the removal WARN and a "skipped orphan dir (recent activity)" line name the SAME
# path two lines apart — the orphan sweep's filesystem probe knew, and the worktree
# pass did not ask it. So ask the same question here. Same threshold, same semantics.
worktree_recently_touched() {
  local wt="$1"
  find "$wt" -maxdepth 3 \
       \( -name node_modules -o -name .git -o -name dist -o -name coverage \
          -o -name .codesight -o -name .vite \) -prune -o \
       -newermt "-$WORKTREE_MIN_IDLE_MINUTES minutes" -print -quit 2>/dev/null | grep -q .
}

is_live() {
  local wt="$1" admin newest=0 f
  # (a) git-admin-dir mtime — moves on commit/checkout/index refresh.
  admin=$(git -C "$wt" rev-parse --git-dir 2>/dev/null) || return 0   # unreadable → assume live
  for f in "$admin/index" "$admin/HEAD" "$admin/logs/HEAD"; do
    [ -f "$f" ] || continue
    local m; m=$(date -r "$f" +%s 2>/dev/null) || continue
    [ "$m" -gt "$newest" ] && newest=$m
  done
  if [ "$newest" -gt 0 ] \
     && [ $(( ($(date +%s) - newest) / 60 )) -lt "$WORKTREE_MIN_IDLE_MINUTES" ]; then
    return 0
  fi
  # (b) working-tree filesystem activity — the signal a git-idle closeout still emits.
  # Reached when (a) is stale OR absent, so a missing admin signal no longer means
  # "not live" on its own; it now means "ask the filesystem".
  worktree_recently_touched "$wt"
}

# Merge-recency grace (THR-797). Defence in depth for the narrower case the impediment
# originally hypothesised: a session doing closeout in the minutes right after its PR
# merges. A merge is NOT proof the session ended — the closeout continues well past it.
# This did not cause the 2026-07-26 incident (that was the is_live blind spot above,
# 5h after the merge), so it is a second gate, not the fix. Never weaken the merge gate
# itself — this only DELAYS reaping, it never authorises it.
WORKTREE_MERGE_GRACE_MINUTES=${WORKTREE_MERGE_GRACE_MINUTES:-90}
merged_recently() {
  local head="$1" mc t
  # Oldest commit on the ancestry path head..MAIN is the merge that first took it in.
  mc=$(git rev-list --ancestry-path "$head..$MAIN" 2>/dev/null | tail -1)
  [ -z "$mc" ] && return 1                                            # can't date it → don't block
  t=$(git log -1 --format=%ct "$mc" 2>/dev/null) || return 1
  [ -z "$t" ] && return 1
  [ $(( ($(date +%s) - t) / 60 )) -lt "$WORKTREE_MERGE_GRACE_MINUTES" ]
}

# Junction guard (THR-753). A worktree's node_modules is normally a Windows
# reparse point (junction/symlink) into the home tree's ONE real install. A
# `git worktree remove --force` — or an `rm -rf` — follows that reparse point and
# empties the home tree's real node_modules, breaking hooks/dev/tests for every
# tree at once (impediments 2026-07-22 ×2, #203, #207). Severing the reparse point
# FIRST (cmd `rmdir`, no /s) deletes only the link, never the target's contents;
# on a real non-empty directory rmdir fails without deleting anything, so this is
# safe to run unconditionally before any removal. Returns non-zero only when the
# path IS a reparse point but the sever failed — caller must then skip removal.
sever_node_modules_reparse() {
  local wt="$1" nm="$1/node_modules" win
  [ -e "$nm" ] || [ -L "$nm" ] || return 0                           # no node_modules → nothing to sever
  win=$(cygpath -w "$nm" 2>/dev/null) || win="$nm"
  if [ -L "$nm" ] || MSYS_NO_PATHCONV=1 cmd /c fsutil reparsepoint query "$win" >/dev/null 2>&1; then
    if MSYS_NO_PATHCONV=1 cmd /c rmdir "$win" >/dev/null 2>&1; then
      echo "  junction-guard: severed node_modules reparse point in $wt"
    else
      echo "  WARN junction-guard: $nm is a reparse point but rmdir failed — refusing to remove $wt (would follow junction into home node_modules)"
      return 1
    fi
  fi
  return 0                                                            # real dir or successfully severed
}

# Home-tree node_modules integrity check (THR-753). If a junction-follow ever slips
# through and empties the real install, surface it LOUDLY so a human repairs it. The
# reaper NEVER auto-installs (that is a dev action) — it only names the repair.
check_home_node_modules() {
  local bin="$REPO/node_modules/.bin" n
  if [ -e "$bin/esbuild.exe" ] || [ -e "$bin/esbuild" ]; then
    return 0
  fi
  n=$(ls "$bin" 2>/dev/null | wc -l | tr -d ' ')
  echo "!!!!! HOME-TREE node_modules DAMAGED: $bin has no esbuild (entries: ${n:-0}). REPAIR: run 'npm install' in $REPO (reaper will NOT auto-install)."
}

# ---- 1. remove merged, work-free worktrees -------------------------------
git worktree list --porcelain \
  | awk '/^worktree /{wt=$2} /^HEAD /{h=$2} /^branch /{b=$2} /^$/{print wt"|"h"|"b}' \
  | while IFS='|' read -r wt head br; do
      [ -z "$wt" ] && continue
      case "$wt" in *"/TheFantasyWorldSimulator") continue;; esac   # main repo
      [ ! -d "$wt" ] && continue
      # substantive uncommitted work? (ignore whitespace + generated noise)
      real=$( { git -C "$wt" diff --ignore-all-space --name-only;
                git -C "$wt" diff --ignore-all-space --name-only --cached;
                git -C "$wt" ls-files --others --exclude-standard; } 2>/dev/null \
              | grep -vE "$noise" | grep -v '^$' )
      [ -n "$real" ] && continue                                    # keep — real WIP
      is_live "$wt" && { echo "skipped worktree (live session): $wt"; continue; }
      if git merge-base --is-ancestor "$head" "$MAIN" 2>/dev/null; then
        # THR-797: merged is not "session finished" — hold off for the grace window.
        merged_recently "$head" && {
          echo "skipped worktree (merged <${WORKTREE_MERGE_GRACE_MINUTES}m ago, closeout may still run): $wt"
          continue
        }
        # Junction guard (THR-753): sever node_modules reparse point first, or
        # `git worktree remove --force` follows it into the home tree's real
        # node_modules and empties it. A failed sever refuses the removal.
        sever_node_modules_reparse "$wt" || continue
        # Fail loud: a partial removal unregisters the worktree, and silence
        # there is what let the next run delete a live session's branch.
        if git worktree remove --force "$wt" 2>/dev/null; then
          echo "removed worktree (merged): $wt"
        else
          echo "WARN: worktree removal FAILED (in use?): $wt — may now be unregistered; verify before next run"
        fi
      fi
    done
check_home_node_modules   # THR-753: catch a junction-follow wipe right after the worktree-removal pass

# ---- 2. prune stale metadata + orphan directories ------------------------
git worktree prune
# Sweep directories under the worktree roots that git no longer tracks
# (left behind when a worktree dir was locked at removal time).
TRACKED=$(git worktree list --porcelain | awk '/^worktree /{print $2}')
# THR-797: basenames of unregistered-but-still-active worktree corpses. A partially
# failed removal unregisters the worktree, so is_checked_out stops protecting its
# branch and the NEXT run deletes it out from under a session that is still running
# (2026-07-26: worktree removal WARN at 08:40, "deleted branch: claude/happy-swartz-
# 826e7d" at 09:40, while the dir was still being skipped for recent activity).
# Collected here, consumed by the branch pass below.
LIVE_ORPHAN_BASENAMES=""
for root in "$REPO/.claude/worktrees" "C:/Users/chris/Dev/Projects/_codex_worktrees" "C:/Users/chris/Dev/Projects/_pickup_worktrees"; do
  [ -d "$root" ] || continue
  for dir in "$root"/*/; do
    [ -d "$dir" ] || continue
    d=${dir%/}
    grep -qxF "$d" <<< "$TRACKED" && continue       # still a live worktree — skip
    # An unregistered dir may be the corpse of a partially-removed LIVE worktree
    # (see is_live). Recent file activity means a session is still working in it.
    if find "$d" -maxdepth 2 -newermt "-$WORKTREE_MIN_IDLE_MINUTES minutes" -print -quit 2>/dev/null | grep -q .; then
      echo "skipped orphan dir (recent activity): $d"
      LIVE_ORPHAN_BASENAMES="${LIVE_ORPHAN_BASENAMES}${d##*/}"$'\n'
      continue
    fi
    sever_node_modules_reparse "$d" || continue   # THR-753: don't let rm -rf follow a node_modules junction
    rm -rf "$d" 2>/dev/null && echo "removed orphan dir: $d"
  done
done
# Stale pickup worktree dirs that live in the Dev root or the Projects root.
for dir in C:/Users/chris/Dev/tfws-pickup-*/ C:/Users/chris/Dev/tfws-resume-*/ \
           C:/Users/chris/Dev/Projects/tfws-pickup-*/ C:/Users/chris/Dev/Projects/tfws-resume-*/; do
  [ -d "$dir" ] || continue
  d=${dir%/}
  grep -qxF "$d" <<< "$TRACKED" && continue
  sever_node_modules_reparse "$d" || continue   # THR-753: don't let rm -rf follow a node_modules junction
  rm -rf "$d" 2>/dev/null && echo "removed orphan dir: $d"
done
check_home_node_modules   # THR-753: catch a junction-follow wipe after the orphan-dir sweep

# ---- 2.5 escalate old, UNMERGED worktrees (never auto-deleted) -----------
# A worktree whose branch is not an ancestor of origin/main holds work that
# exists nowhere else. Age alone must never authorize deleting it, so these are
# only ever surfaced for human disposition. Loop runs in the current shell
# (process substitution, not a pipe) so the counter survives for the summary.
WORKTREE_ESCALATE_DAYS=${WORKTREE_ESCALATE_DAYS:-14}
NOW=$(date +%s)
ESCALATE_CUTOFF=$(( NOW - WORKTREE_ESCALATE_DAYS * 86400 ))
NEEDS_DISPOSITION=0
while IFS='|' read -r wt head br; do
    [ -z "$wt" ] && continue
    case "$wt" in *"/TheFantasyWorldSimulator") continue;; esac       # main repo
    [ ! -d "$wt" ] && continue
    git merge-base --is-ancestor "$head" "$MAIN" 2>/dev/null && continue   # merged — not stranded
    last=$(git -C "$wt" log -1 --format=%ct 2>/dev/null)
    [ -z "$last" ] && continue
    [ "$last" -gt "$ESCALATE_CUTOFF" ] && continue                    # younger than threshold
    echo "NEEDS-DISPOSITION: $wt (branch ${br:-<detached>}, $(( (NOW - last) / 86400 ))d stale, unmerged)"
    NEEDS_DISPOSITION=$(( NEEDS_DISPOSITION + 1 ))
  done < <(git worktree list --porcelain \
           | awk '/^worktree /{wt=$2; h=""; b=""} /^HEAD /{h=$2} /^branch /{sub("refs/heads/","",$2); b=$2} /^$/{print wt"|"h"|"b}')

# ---- 3. delete stale local branches --------------------------------------
git for-each-ref --format='%(refname:short)|%(upstream:track)' refs/heads/ \
  | while IFS='|' read -r b track; do
      [ "$b" = "main" ] && continue
      is_checked_out "$b" && continue
      has_open_pr "$b" && continue
      has_live_orphan_dir "$b" && {                                   # THR-797
        echo "kept branch (worktree corpse still active): $b"; continue; }
      tip=$(git rev-parse "$b" 2>/dev/null)
      del=0
      [ "$track" = "[gone]" ] && del=1
      git merge-base --is-ancestor "$tip" "$MAIN" 2>/dev/null && del=1
      case "$b" in claude/*|pickup/*|resume/*) del=1;; esac          # ephemeral session branches
      [ "$del" = 1 ] && git branch -D "$b" >/dev/null 2>&1 && echo "deleted branch: $b"
    done

# ---- 4. summary ----------------------------------------------------------
# Single machine-readable line. keep-work-flowing-cc tails this into the hourly
# briefing, so a reaper that silently stops running becomes visible within the
# hour instead of going unnoticed for days (the 07-06→07-17 gap).
echo "SUMMARY: worktrees: $(git worktree list | wc -l | tr -d ' ') | local branches: $(git branch | wc -l | tr -d ' ') | stashes: $(git stash list | wc -l | tr -d ' ') | needs-disposition: $NEEDS_DISPOSITION"
echo "===== done ====="
```
