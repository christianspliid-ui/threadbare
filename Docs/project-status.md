# Project Status

> Updated 2026-03-27. Split from monolithic status file — see Docs/project-history.md for completed milestone archive.

## Current Focus
**TB-058: Faction Vertical Slice (Adventuring Guild)** — All 5 phases complete.

**Recent completions:**
- ✅ TB-066: Palette Theme System (2026-03-27) — feature-flagged color schemes with two shipped themes (Golden Hour warm default, Dark Parchment cool/dark alt). URL param `?palette=dark-parchment`, Settings panel dropdown, 30 terrain + 5 water overrides. 23 tests.
- ✅ TB-067: Notification Expansion (2026-03-27) — right-click dismiss, nav targets, notification preferences.
- ✅ TB-063: Faction UI & Visibility (2026-03-27) — agent profile faction section, faction TickEvents (join/promotion/demotion), alert glyphs, debug panel Factions tab. 16 tests.
- ✅ TB-065: Encounter Modal Prose Variables (2026-03-27) — resolve {actor}, {adj}, {verb}, {noun}, {action} placeholders in TieredEncounterModal.
- ✅ TB-064: In-Game Settings Panel (2026-03-27) — single gear icon dropdown replaces fog+debug buttons.
- ✅ Reroute teleportation fix (2026-03-27) — agents no longer teleport back to origin on reroute.
- ✅ TB-062: Faction Social Encounters & Rank Bonuses (2026-03-27) — 6 faction-scoped social templates, shared-faction filter, 3 rank bonus types wired. 25 tests.
- ✅ TB-061: Join & Promotion Encounters (2026-03-27) — lifecycle candidates, not_faction visibility filter, partial-success promotion. 32 tests.
- ✅ TB-060: Quest Board & Reputation (2026-03-27) — 10 quest templates, reputation gain/decay/rank recalc.
- ✅ TB-059: Schema & Seeding (2026-03-27) — FactionDefinition types, guild seeder, guild hall placement.

## Full Backlog
See: `.planning/BACKLOG.md`

## Completed Work
See: Docs/project-history.md
