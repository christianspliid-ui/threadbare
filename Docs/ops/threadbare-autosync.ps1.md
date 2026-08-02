# `threadbare-autosync.ps1` — recoverability mirror

The Threadbare home-tree auto-sync lives at `C:\Users\chris\bin\threadbare-autosync.ps1`,
**outside** version control — it runs hourly at `:50` via Windows Task Scheduler
(`ThreadbareRepoAutoSync`; see CLAUDE.md § Scheduled Tasks → Windows Task Scheduler lane).
Because it is not tracked, a disk loss takes it with it, and it is the automated repair for a
documented harness bug ([anthropics/claude-code#79713](https://github.com/anthropics/claude-code/issues/79713)).
This file is a **copy for recoverability and review**, not the source of truth. When you change
the script, update this mirror in the same PR — same contract as `clean-stale-git.sh.md`.

Last synced: 2026-08-01 (THR-937 — untracked-collision guard).

## Why this mirror exists at all

THR-824 filed the gap: the sibling reaper script is mirrored here and autosync was not, so the
only copy of the home-tree repair sat unversioned on one disk. THR-937 made that concrete —
a defect in this script cost 88 commits of home-tree staleness, and **the fix was unreviewable
by anyone but the machine holding the file.**

## The two loss-free exceptions

Everything this script does is a clean fast-forward. It has exactly two narrow powers to
*delete* anything, and both are gated on a provable equality:

| Step | Deletes | Gate |
|------|---------|------|
| 5 | `.codesight/` | machine-regenerated every session; gitignored, tracked by historical accident |
| 5.5 | an untracked file blocking the fast-forward | **only** when `git hash-object <file>` equals `git rev-parse origin/main:<path>` — i.e. the identical bytes arrive in the same commit |

Anything failing its gate is left untouched and logged as `MANUAL REPAIR NEEDED`. This is the
same contract as the THR-672 reattach guard at step 1.5: act only on what is provably safe,
leave everything else and say so loudly.

## Full script body

```powershell
# Threadbare home-tree auto-sync
# Keeps C:\Users\chris\Dev\Projects\TheFantasyWorldSimulator in sync with origin/main.
# SAFE BY DESIGN: only ever performs a clean fast-forward. Never forces, never merges,
# never discards your uncommitted work. If anything of yours is dirty and would be
# overwritten, git aborts non-destructively and the script just logs a skip.
#
# TWO narrow exceptions, both provably loss-free, both gated on an equality check:
#   1. It resets .codesight/ first, because that folder is machine-regenerated every
#      session (it's in .gitignore; only tracked by a historical accident, see the
#      untrack ticket). Resetting it discards nothing you authored.
#   2. It deletes an UNTRACKED file that blocks the fast-forward *only* when that file
#      hashes byte-identically to the version arriving in the same commit (step 5.5).
#      Anything that differs by even one byte is left untouched and logged loud.
#
# Registered as the Windows Scheduled Task "ThreadbareRepoAutoSync" (hourly).

$ErrorActionPreference = 'Continue'
$repo = 'C:\Users\chris\Dev\Projects\TheFantasyWorldSimulator'
$log  = 'C:\Users\chris\bin\threadbare-autosync.log'

# Reattach guard (THR-672). The CC harness parks this tree on a detached HEAD via a bare
# `git checkout HEAD` at session spawn. That park is provably loss-free ONLY when the tree
# carries no commits of its own and no tracked edits -- both conditions below must hold
# before the script will move HEAD. Any other detached state is left alone and logged loud.
$REATTACH_MAX_UNIQUE_COMMITS  = 0      # commits on HEAD that exist nowhere else
$REATTACH_MAX_TRACKED_DIRTY   = 0      # tracked (non-'??') working-tree modifications

# Collision guard (THR-937). An untracked file DOES block a fast-forward when the incoming
# commits add a file at the same path -- git refuses to clobber it and aborts the whole sync.
# This is not "your uncommitted work": it is a scheduled lane that wrote a report into this
# read-only mirror and then committed the same bytes from its own worktree, leaving a loose
# twin behind. Left alone it is permanent, because every later hour hits the same collision:
# the tree fell 88 commits behind over ~10 hours before this guard existed.
#
# Deleting such a file is loss-free ONLY when its content hashes identically to the blob
# arriving at that path. Blob-sha equality is the gate -- exact, encoding-proof (git applies
# the same clean filters to both sides), and it cannot be satisfied by a file that differs.
$CLEAR_IDENTICAL_UNTRACKED_COLLISIONS = $true

# Invariant culture pins the time separator to ':'. Under the Task Scheduler's culture
# `Get-Date -Format 'HH:mm'` renders '09:11'; under some interactive session cultures the
# same format string renders '09.11', so a log read by both had two shapes for one field.
function Log($m) {
    $ts = [DateTime]::Now.ToString('yyyy-MM-dd HH:mm', [Globalization.CultureInfo]::InvariantCulture)
    ("{0} {1}" -f $ts, $m) | Add-Content -Path $log
}

# 1. Fetch (offline / transient failure -> skip quietly)
& git -C $repo fetch origin main --quiet 2>$null
if ($LASTEXITCODE -ne 0) { Log 'skip: fetch failed (offline?)'; exit 0 }

# 1.5 Reattach a parked tree (THR-672). Runs before the branch guard, because a detached
#     HEAD is exactly the state the guard would otherwise skip on forever. Never destructive:
#     `git switch main` only moves HEAD, and it is gated on nothing being stranded.
$branch = (& git -C $repo rev-parse --abbrev-ref HEAD 2>$null).Trim()
if ($branch -eq 'HEAD') {
    $parkedAt = (& git -C $repo rev-parse --short HEAD 2>$null).Trim()
    $unique   = [int]((& git -C $repo rev-list --count origin/main..HEAD 2>$null).Trim())
    # Tracked modifications only: '??' lines never block a *ref move*. (They can block a
    # fast-forward -- that is a different question, handled at step 5.5.)
    $dirty    = @(& git -C $repo status --porcelain --untracked-files=no 2>$null |
                  Where-Object { $_ -match '\S' }).Count

    if ($unique -le $REATTACH_MAX_UNIQUE_COMMITS -and $dirty -le $REATTACH_MAX_TRACKED_DIRTY) {
        & git -C $repo switch main 2>$null
        if ($LASTEXITCODE -ne 0) { Log "skip: parked at $parkedAt, nothing stranded, but 'git switch main' failed"; exit 0 }
        Log "reattached: was parked at $parkedAt, nothing stranded"
        $branch = 'main'
    }
    elseif ($unique -gt $REATTACH_MAX_UNIQUE_COMMITS) {
        # Never offer a reset recipe here -- these commits exist nowhere else.
        Log "MANUAL REPAIR NEEDED: parked at $parkedAt with $unique commit(s) that exist nowhere else. Do NOT reset. Run: git -C '$repo' log origin/main..HEAD --oneline  and hand the SHAs to a session."
        exit 0
    }
    else {
        Log "MANUAL REPAIR NEEDED: parked at $parkedAt with $dirty tracked modification(s). Nothing unique is stranded, so this is safe to repair by hand: cd '$repo'; git stash push -m home-tree-recovery; git switch main; git pull --ff-only origin main"
        exit 0
    }
}

# 2. Only touch the tree when it is on main
if ($branch -ne 'main') { Log "skip: on branch '$branch' (not main)"; exit 0 }

# 3. Only proceed if this is a clean fast-forward (no divergence)
& git -C $repo merge-base --is-ancestor HEAD origin/main 2>$null
if ($LASTEXITCODE -ne 0) { Log 'skip: local main has diverged from origin/main (needs manual rebase)'; exit 0 }

# 4. Nothing to do?
$behind = [int]((& git -C $repo rev-list --count HEAD..origin/main 2>$null).Trim())
if ($behind -eq 0) { Log 'ok: already up to date'; exit 0 }

# 5. Reset only the machine-regenerated .codesight index (safe; rebuilt each session)
& git -C $repo checkout HEAD -- .codesight 2>$null

# 5.5 Clear untracked files that would block the fast-forward, but ONLY the provably
#     loss-free ones (see the collision guard note above). Same contract as step 1.5:
#     act only on what is provably safe, leave everything else and say so loudly.
if ($CLEAR_IDENTICAL_UNTRACKED_COLLISIONS) {
    $cleared = @()
    $blocked = @()
    $untracked = @(& git -C $repo ls-files --others --exclude-standard 2>$null |
                   Where-Object { $_ -match '\S' })

    foreach ($f in $untracked) {
        # Only a path the incoming tree also carries can collide. Everything else is inert.
        & git -C $repo cat-file -e "origin/main:$f" 2>$null
        if ($LASTEXITCODE -ne 0) { continue }

        $localSha  = (& git -C $repo hash-object -- $f 2>$null | Select-Object -First 1)
        $remoteSha = (& git -C $repo rev-parse "origin/main:$f" 2>$null | Select-Object -First 1)

        if ($localSha -and $remoteSha -and $localSha.Trim() -eq $remoteSha.Trim()) {
            $full = Join-Path $repo $f
            Remove-Item -LiteralPath $full -Force -ErrorAction SilentlyContinue
            if (Test-Path -LiteralPath $full) { $blocked += $f } else { $cleared += $f }
        }
        else {
            $blocked += $f
        }
    }

    if ($cleared.Count -gt 0) {
        Log ("cleared {0} identical untracked collision(s) before sync: {1}" -f $cleared.Count, ($cleared -join ', '))
    }
    if ($blocked.Count -gt 0) {
        Log ("MANUAL REPAIR NEEDED: {0} untracked file(s) sit where incoming commits add a file AND their contents DIFFER - not touched, sync will refuse: {1}. Compare one with: git -C '{2}' show origin/main:<path>" -f $blocked.Count, ($blocked -join ', '), $repo)
    }
}

# 6. Attempt a clean fast-forward. --ff-only aborts non-destructively if any tracked
#    file you have modified would be overwritten; nothing is lost either way.
& git -C $repo merge --ff-only origin/main 2>$null
if ($LASTEXITCODE -eq 0) {
    $short = (& git -C $repo rev-parse --short origin/main 2>$null).Trim()
    Log "synced: fast-forwarded $behind commit(s) -> $short"
} else {
    # Name the actual cause. The old message blamed "uncommitted changes" unconditionally
    # and prescribed a rebase, which is wrong for an untracked collision and was logged
    # 11 hours running while the real blocker sat one `rm` away.
    $trackedDirty = @(& git -C $repo status --porcelain --untracked-files=no 2>$null |
                      Where-Object { $_ -match '\S' }).Count
    if ($trackedDirty -gt 0) {
        Log "skip: $trackedDirty tracked modification(s) would be overwritten ($behind behind) - left untouched. Repair: cd '$repo'; git stash push -m home-tree-recovery; git pull --ff-only origin main"
    } else {
        Log "MANUAL REPAIR NEEDED: fast-forward refused with NO tracked modifications ($behind behind) - cause is not local edits. Run by hand and read the error: git -C '$repo' merge --ff-only origin/main"
    }
}
exit 0
```

## Test harness

Not run by CI — it exercises an out-of-repo script against purpose-built scratch repos.
Run it by hand after any change to the script:

```
pwsh -NoProfile -File Docs/ops/threadbare-autosync.test.ps1
```

Six scenarios, 17 assertions. The two that matter most are **B** (a *differing* untracked
collision must be preserved byte-for-byte) and **C** (an unrelated untracked file must never
be touched) — those are the cases where a bug here would destroy someone's work.

```powershell
# Test harness for threadbare-autosync.ps1 collision guard (THR-932).
# Builds a purpose-built origin+clone per scenario, runs the real script against it
# (paths rewritten), and asserts on the log line AND the resulting tree state.

$ErrorActionPreference = 'Continue'
$src  = 'C:\Users\chris\bin\threadbare-autosync.ps1'
$root = Join-Path $env:TEMP ('autosync-test-' + (Get-Random))
$pass = 0; $fail = 0

function Assert($name, $cond, $detail) {
    if ($cond) { Write-Host "  PASS  $name"; $script:pass++ }
    else       { Write-Host "  FAIL  $name  -- $detail"; $script:fail++ }
}

function New-Scenario($name) {
    $dir    = Join-Path $root $name
    $origin = Join-Path $dir 'origin.git'
    $work   = Join-Path $dir 'work'
    $seed   = Join-Path $dir 'seed'
    New-Item -ItemType Directory -Force -Path $dir | Out-Null

    git init --bare -q $origin
    git init -q $seed
    Push-Location $seed
    git config user.email t@t; git config user.name t
    'base' | Set-Content -NoNewline base.txt
    git add -A; git commit -qm base
    git branch -M main
    git remote add origin $origin; git push -q origin main
    Pop-Location

    git clone -q $origin $work
    Push-Location $work; git config user.email t@t; git config user.name t; Pop-Location
    return @{ dir = $dir; origin = $origin; work = $work; seed = $seed }
}

# Add a commit on origin that creates $path with $content
function Add-OriginCommit($s, $path, $content) {
    Push-Location $s.seed
    $full = Join-Path $s.seed $path
    New-Item -ItemType Directory -Force -Path (Split-Path $full) | Out-Null
    $content | Set-Content -NoNewline $full
    git add -A; git commit -qm ("add " + $path); git push -q origin main
    Pop-Location
}

function Invoke-Autosync($s) {
    $log    = Join-Path $s.dir 'sync.log'
    $script = Join-Path $s.dir 'autosync.ps1'
    (Get-Content $src -Raw).
        Replace("'C:\Users\chris\Dev\Projects\TheFantasyWorldSimulator'", "'$($s.work)'").
        Replace("'C:\Users\chris\bin\threadbare-autosync.log'", "'$log'") | Set-Content $script
    & pwsh -NoProfile -File $script | Out-Null
    if (Test-Path $log) { return (Get-Content $log -Raw).Trim() }
    return ''
}

Write-Host "`n=== A. identical untracked collision -> cleared, FF succeeds ==="
$s = New-Scenario 'A'
Add-OriginCommit $s 'Docs/ops/report.md' 'IDENTICAL CONTENT'
'IDENTICAL CONTENT' | Set-Content -NoNewline (New-Item -ItemType File -Force -Path (Join-Path $s.work 'Docs\ops\report.md'))
$logA = Invoke-Autosync $s
Write-Host "  log: $logA"
Assert 'cleared the collision' ($logA -match 'cleared 1 identical untracked collision') $logA
Assert 'fast-forwarded'        ($logA -match 'synced: fast-forwarded')                  $logA
Push-Location $s.work
Assert 'file is now tracked'   ((git ls-files 'Docs/ops/report.md') -eq 'Docs/ops/report.md') 'not tracked'
Assert 'content preserved'     ((Get-Content (Join-Path $s.work 'Docs\ops\report.md') -Raw) -eq 'IDENTICAL CONTENT') 'content changed'
Pop-Location

Write-Host "`n=== B. DIFFERING untracked collision -> untouched, loud, FF refused ==="
$s = New-Scenario 'B'
Add-OriginCommit $s 'Docs/ops/report.md' 'INCOMING VERSION'
'MY PRECIOUS UNSAVED WORK' | Set-Content -NoNewline (New-Item -ItemType File -Force -Path (Join-Path $s.work 'Docs\ops\report.md'))
$logB = Invoke-Autosync $s
Write-Host "  log: $logB"
Assert 'flagged MANUAL REPAIR'  ($logB -match 'MANUAL REPAIR NEEDED.*DIFFER')      $logB
Assert 'did NOT clear'          ($logB -notmatch 'cleared \d+ identical')          $logB
Assert 'did NOT fast-forward'   ($logB -notmatch 'synced: fast-forwarded')         $logB
Assert 'FILE PRESERVED BYTE-FOR-BYTE' `
    ((Get-Content (Join-Path $s.work 'Docs\ops\report.md') -Raw) -eq 'MY PRECIOUS UNSAVED WORK') 'DATA LOSS!'

Write-Host "`n=== C. unrelated untracked file -> untouched, FF succeeds (inertness) ==="
$s = New-Scenario 'C'
Add-OriginCommit $s 'Docs/ops/report.md' 'incoming'
'my scratch notes' | Set-Content -NoNewline (Join-Path $s.work 'my-notes.txt')
$logC = Invoke-Autosync $s
Write-Host "  log: $logC"
Assert 'fast-forwarded'          ($logC -match 'synced: fast-forwarded')  $logC
Assert 'no collision reported'   ($logC -notmatch 'cleared|MANUAL')       $logC
Assert 'UNRELATED FILE SURVIVES' (Test-Path (Join-Path $s.work 'my-notes.txt')) 'DELETED A USER FILE!'

Write-Host "`n=== D. tracked dirty -> skip, correct message, no data loss ==="
$s = New-Scenario 'D'
Push-Location $s.seed; 'changed upstream' | Set-Content -NoNewline base.txt; git add -A; git commit -qm up; git push -q origin main; Pop-Location
'my local edit' | Set-Content -NoNewline (Join-Path $s.work 'base.txt')
$logD = Invoke-Autosync $s
Write-Host "  log: $logD"
Assert 'skipped on tracked dirt' ($logD -match 'tracked modification\(s\) would be overwritten') $logD
Assert 'offers stash recipe'     ($logD -match 'git stash push')                                 $logD
Assert 'LOCAL EDIT PRESERVED'    ((Get-Content (Join-Path $s.work 'base.txt') -Raw) -eq 'my local edit') 'DATA LOSS!'

Write-Host "`n=== E. clean + behind -> plain FF (regression) ==="
$s = New-Scenario 'E'
Add-OriginCommit $s 'newfile.txt' 'hello'
$logE = Invoke-Autosync $s
Write-Host "  log: $logE"
Assert 'fast-forwarded'        ($logE -match 'synced: fast-forwarded 1 commit') $logE
Assert 'no guard chatter'      ($logE -notmatch 'cleared|MANUAL')               $logE

Write-Host "`n=== F. already up to date -> unchanged (regression) ==="
$s = New-Scenario 'F'
$logF = Invoke-Autosync $s
Write-Host "  log: $logF"
Assert 'reports up to date'    ($logF -match 'ok: already up to date') $logF

Write-Host "`n================ $pass passed, $fail failed ================"
Remove-Item -Recurse -Force $root -ErrorAction SilentlyContinue
if ($fail -gt 0) { exit 1 }
```
