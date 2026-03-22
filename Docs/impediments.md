# Impediment Log

Centralized record of blockers, workarounds, and friction encountered during development. Every agent logs here when they hit an obstacle. Reviewed periodically via `/retrospective`.

## Log Format

Each entry is a row in the table below. Append new entries at the bottom. Never delete rows — mark resolved ones in retrospective notes.

| # | Count | Date | Category | Description | Consequence | Impact | Workaround Found? | Workaround Description | Session Context |
|---|-------|------|----------|-------------|-------------|--------|--------------------|------------------------|-----------------|

<!-- Categories: tool-failure | api-quirk | permission | environment | skill-gap | process-friction | dependency | unclear-requirements | flaky-test | other -->
<!-- Impact: S (small, <2 min lost) | M (medium, 2-15 min lost) | L (large, 15+ min lost) | Blocked (could not complete task) -->
| 1 | 1 | 2026-03-21 | tool-failure | Claude Preview preview_screenshot times out on WebGL canvas (Three.js 60K hex render). Headless browser WebGL compositing too slow for screenshot capture. | Had to switch to Playwright MCP for screenshots. | M | Yes | Use mcp__playwright__browser_take_screenshot instead of preview_screenshot for WebGL content. | Phase 01 verification |
| 2 | 1 | 2026-03-21 | api-quirk | d3-zoom default wheel handler assumes standard screen↔data coordinate mapping. Our syncCameraToZoom uses non-standard mapping (cx=-tx/k, cy=ty/k with Y-flip). Default zoom-toward-cursor math silently produces wrong results — zooms change scale but don't converge on cursor. | Zoom toward cursor appeared broken. Required full manual wheel handling with correct math for our coordinate system. | M | Yes | Handle ALL wheel events manually with correct zoom-toward-point math derived from our custom coordinate mapping. | Phase 01 verification |
| 3 | 1 | 2026-03-21 | api-quirk | ResizeObserver callback in HexMapV2 called resizeHexScene which reset camera frustum to origin, overwriting d3-zoom's centered camera transform. Race condition: d3-zoom sets correct camera → ResizeObserver fires → camera reset to origin. | Grid appeared in bottom-right corner instead of centered. | M | Yes | resizeHexScene now only updates renderer size. Caller re-syncs d3-zoom transform via syncCameraToZoom after resize. | Phase 01 verification |
| 4 | 3 | 2026-03-22 | process-friction | GSD executor subagents create new files (e.g. hexMovementPath.ts, vite-plugin-constant-writer.ts) that are imported by tracked files but don't `git add` them before committing. Files exist locally so dev server works, but Vercel build fails on deploy because the files aren't in git. | Vercel build fails repeatedly. Requires manual fix commits to add the missing files. Three occurrences in one session. | L | Yes | Manual catch-up commits after subagent completes. Root fix: add pre-push hook or GSD executor post-commit check that verifies no untracked files are imported by tracked files. | Phase 04 execution |
