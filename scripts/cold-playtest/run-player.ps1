# Cold playtest — run ONE cold tester against the deployed build.
# The tester is a fresh `claude -p` process started OUTSIDE the repo, with a
# replaced system prompt, no setting sources, and only Playwright browser tools,
# so it carries none of the project's rules, vocabulary or debug levers.
# Plan: Docs/plans/2026-09-25-thr-1610-cold-playtest-loop.md (THR-1610).
param(
  [Parameter(Mandatory)] [string] $Persona,
  [Parameter(Mandatory)] [string] $OutDir,
  [string] $Kickoff = "Begin. Open the game and play."
)
$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$cfg = Get-Content (Join-Path $root 'config.json') -Raw | ConvertFrom-Json

$runDir = Join-Path $OutDir $Persona
$shotDir = Join-Path $runDir 'shots'
New-Item -ItemType Directory -Force $shotDir | Out-Null

$personas = Get-Content (Join-Path $root 'personas.json') -Raw | ConvertFrom-Json
$personaText = $personas.$Persona
if (-not $personaText) { throw "unknown persona '$Persona'" }
$brief = (Get-Content (Join-Path $root 'player-brief.md') -Raw).
  Replace('{{PERSONA}}', $personaText).
  Replace('{{START_URL}}', $cfg.startUrl).
  Replace('{{ACTION_BUDGET}}', [string]$cfg.actionBudget)
$sysFile = Join-Path $runDir 'system.md'
Set-Content -Path $sysFile -Value $brief -NoNewline

$mcpArgs = @('-y', "@playwright/mcp@$($cfg.playwrightMcpVersion)", '--headless', '--isolated',
  '--viewport-size', $cfg.viewport, '--caps', 'vision', '--output-dir', $shotDir)
$mcp = @{ mcpServers = @{ pw = @{ command = 'npx'; args = $mcpArgs } } } | ConvertTo-Json -Depth 6
$mcpFile = Join-Path $runDir 'mcp.json'
Set-Content -Path $mcpFile -Value $mcp

# Hands: element refs from page snapshots. Eyes: screenshots. No page-script,
# console or network access — those would reach the game's internals.
$allowed = @('navigate','navigate_back','click','type','press_key','hover','take_screenshot','snapshot',
  'mouse_click_xy','mouse_move_xy','mouse_drag_xy','mouse_wheel','wait_for','select_option') |
  ForEach-Object { "mcp__pw__browser_$_" }
$denied = @('Bash','PowerShell','Read','Write','Edit','Glob','Grep','WebFetch','WebSearch','Task','Agent',
  'NotebookEdit','TodoWrite','Skill','Artifact','ArtifactComments','ArtifactData','CronCreate','CronDelete',
  'CronList','DesignSync','EnterWorktree','ExitWorktree','ListAgents','Monitor','PushNotification',
  'RemoteTrigger','ReportFindings','ScheduleWakeup','SendMessage','Workflow',
  'mcp__pw__browser_evaluate','mcp__pw__browser_run_code_unsafe','mcp__pw__browser_console_messages',
  'mcp__pw__browser_network_requests','mcp__pw__browser_network_request','mcp__pw__browser_tabs',
  'mcp__pw__browser_file_upload')

$log = Join-Path $runDir 'transcript.jsonl'
$err = Join-Path $runDir 'stderr.txt'
# Run from the persona dir, which is outside the repo, so no CLAUDE.md is discovered.
Push-Location $runDir
try {
  $cargs = @('-p', $Kickoff, '--model', $cfg.testerModel, '--system-prompt-file', $sysFile,
    '--strict-mcp-config', '--mcp-config', $mcpFile,
    '--allowedTools', ($allowed -join ','), '--disallowedTools', ($denied -join ','),
    '--permission-mode', 'dontAsk', '--setting-sources', 'local',
    '--output-format', 'stream-json', '--verbose')
  & claude @cargs > $log 2> $err
  $code = $LASTEXITCODE
} finally { Pop-Location }

node (Join-Path $root 'extract.mjs') $runDir | Out-Null
"persona=$Persona exit=$code dir=$runDir"
