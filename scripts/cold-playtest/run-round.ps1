# Cold playtest — run every persona in parallel for one round, then write
# round.json (per-persona summaries + deployed build identity).
# Usage: pwsh scripts/cold-playtest/run-round.ps1 -Round 2
#        pwsh scripts/cold-playtest/run-round.ps1 -Round 2 -Label dry-run   (writes round-2-dry-run/)
# Plan: Docs/plans/2026-09-25-thr-1610-cold-playtest-loop.md (THR-1610).
param(
  [Parameter(Mandatory)] [int] $Round,
  [string] $ArtifactRoot = (Join-Path $env:USERPROFILE '.threadbare\cold-playtest'),
  # Optional suffix for the round directory. A dry run uses it so it never
  # occupies the real round-N directory the next lane round will need.
  [string] $Label = ''
)
$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$cfg = Get-Content (Join-Path $root 'config.json') -Raw | ConvertFrom-Json
$dirName = if ($Label) { "round-$Round-$Label" } else { "round-$Round" }
$outDir = Join-Path $ArtifactRoot $dirName
if (Test-Path (Join-Path $outDir 'round.json')) { throw "round $Round already has a round.json in $outDir — pick the next round number" }
New-Item -ItemType Directory -Force $outDir | Out-Null

# Fail fast if the site is down: a dead page would waste every tester's budget.
try { $null = Invoke-WebRequest $cfg.startUrl -UseBasicParsing -TimeoutSec 20 }
catch { throw "start URL unreachable: $($cfg.startUrl) — $($_.Exception.Message)" }

# Deployed build identity, so the report can say which commit the round played.
$deployedCommit = $null
try {
  $deployedCommit = (git -C $root rev-parse origin/main 2>$null)
} catch { $deployedCommit = $null }

$started = Get-Date
$jobs = foreach ($p in $cfg.personas) {
  Start-ThreadJob -ArgumentList $root, $p, $outDir -ScriptBlock {
    param($root, $p, $outDir)
    & (Join-Path $root 'run-player.ps1') -Persona $p -OutDir $outDir
  }
}
$null = $jobs | Wait-Job -Timeout ($cfg.playerTimeoutMinutes * 60)
$jobs | Where-Object State -eq 'Running' | Stop-Job
$jobs | Receive-Job -ErrorAction Continue | Write-Output
$jobs | Remove-Job -Force

# A tester stopped by the timeout never reached its own extract step; extract
# its partial transcript here so it reports failure = incomplete, not no-summary.
foreach ($p in $cfg.personas) {
  $pDir = Join-Path $outDir $p
  if ((Test-Path $pDir) -and -not (Test-Path (Join-Path $pDir 'summary.json'))) {
    try { node (Join-Path $root 'extract.mjs') $pDir | Out-Null } catch { }
  }
}

$summaries = foreach ($p in $cfg.personas) {
  $f = Join-Path $outDir "$p\summary.json"
  if (Test-Path $f) { Get-Content $f -Raw | ConvertFrom-Json }
  else { [pscustomobject]@{ persona = $p; ok = $false; failure = 'no-summary' } }
}
$round = [ordered]@{
  round = $Round
  label = $Label
  startedAt = $started.ToUniversalTime().ToString('o')
  minutes = [int]((Get-Date) - $started).TotalMinutes
  startUrl = $cfg.startUrl
  deployedCommit = $deployedCommit
  briefVersion = $cfg.briefVersion
  testerModel = $cfg.testerModel
  personas = $summaries
  usable = @($summaries | Where-Object ok).Count
}
$round | ConvertTo-Json -Depth 6 | Set-Content (Join-Path $outDir 'round.json')
"round=$Round usable=$($round.usable)/$($cfg.personas.Count) dir=$outDir"

# Prune: keep screenshots only for the newest `keepRoundsWithScreenshots` rounds
# (~240 MB/round). Transcripts, logs and summaries are always kept.
try {
  $keep = [int]$cfg.keepRoundsWithScreenshots
  $rounds = Get-ChildItem -Directory $ArtifactRoot |
    Where-Object { $_.Name -match '^round-(\d+)' } |
    Sort-Object { [int]([regex]::Match($_.Name, '^round-(\d+)').Groups[1].Value) }, LastWriteTime -Descending
  foreach ($old in ($rounds | Select-Object -Skip $keep)) {
    Get-ChildItem -Directory $old.FullName | ForEach-Object {
      $shots = Join-Path $_.FullName 'shots'
      if (Test-Path $shots) { Remove-Item -Recurse -Force $shots; "pruned $shots" }
    }
  }
} catch { "prune skipped: $($_.Exception.Message)" }
