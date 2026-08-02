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
