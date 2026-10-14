> **title:** `The 1440p layout contract — brainstorm companion — THR-1819`
> **linear_issue:** THR-1819
> **companion_to:** `Docs/plans/2026-10-14-thr-1819-1440p-layout-contract.md`
> **created:** 2026-10-14

# The 1440p layout contract — brainstorm companion

The alternatives considered, the tensions weighed, and the Vision premises the plan leans on. The plan doc is the contract; this file explains why it looks the way it does.

## How this started

Christian's 2026-10-11 UI review: *"design primarily for minimum 1440p landscape"*. At 2560×1440 the game drew a 1080p layout with the map stretched across the rest of the screen. Four decisions on the THR-1823 map then fixed concrete numbers: rails 320/400 and 340/420, Inspector 560/717, Stage window 280/520, and a 16 px floor with prose one step above UI text. Each one said "THR-1819 owns the token". The attended groundwork session on 2026-10-14 settled the frame of this ticket: three tiers, a root step-up at 2560, one 85vh rule, and a shared ratchet. What was left was the *how*.

## First-pass framing I considered

"Add a 2560 value to every width and bump the rem scale." That would have missed three things the measurement found:
- the scale cannot get a real prose step without moving a 1080p size, because 16/17/18 leaves no room;
- JS positioning code (`Tooltip`, `HoverCard`, `SphereIcon`) hard-codes px or assumes 16 px per rem, so a root step-up alone would misplace tooltips at 1440p;
- the map is already under its own budget floor at 1080p today (59.7% against 0.60).

## Alternatives considered

### The type scale

- **A. Shift the values, keep the names (chosen).** xs 16, sm 18, base 20, lg 22, xl 26, 2xl 32. The six names stay strictly increasing with no aliases, and ~1,700 references need no edit. The cost is +1 px on `--text-sm` users and +2 px on `--text-base` users at 1080p. `body` moves to `--text-sm` so the default size does not change.
- **B. Keep `--text-base` at 18 and alias `--text-sm` to it, adding `--text-prose` at 20.** No `--text-base` site moves. Rejected: two names for one size invites "which do I pick?" on every new component, and the scale stops reading as a ladder.
- **C. Role tokens** (`--text-label`, `--text-ui`, `--text-prose`, `--text-name` …) on top of the size steps. This is the most self-documenting option. Rejected for now: it doubles the vocabulary while 1,700 sites still speak the size names, and THR-1833's roles map one-to-one onto the shifted names anyway (the plan's role column).
- **Prose at 19 px** (THR-1833's "about 19"). Rejected: it is 1 px from UI text, which breaks the rule the ticket exists to establish. 20 px is one full step above.

### The root step-up

- **`html { font-size: 18px }`.** Rejected: it overrides a player's own browser font-size preference. 112.5% gives 18 px at the default and respects a larger one.
- **Fluid type (`clamp()` with `vw`).** Rejected: continuous scaling makes the budget arithmetic depend on every pixel of width. Legibility is a matter of viewing distance, not proportion, and the brief chose one step.
- **Width-only trigger (the brief's literal wording).** Kept for every supported screen. Added a `min-height: 1200px` guard so a 2560×1080 ultrawide keeps the 1080p type size. Its pixels are 1080p-sized, so the step would cost ~12% of a short screen for type that is already large. The guard changes nothing on 2560×1440, 3440×1440 or 1920×1080, which is why it does not reopen the brief's decision. It is still flagged to the parent session as a veto point.

### Width tokens

- **Inspector as `28vw` / `50vw`** (the decision's own phrasing). Rejected for stepped px: with vw the docked panel would grow continuously and the budget would have to be checked at every width. With stepped px the map's share only rises as the window widens inside a tier, so checking each tier at its breakpoint proves the whole range.
- **Text containers in px per tier** (tooltip 280 → 315 …). Rejected for rem declared once: their job is a reading measure, which follows the type, and rem gives exactly today's widths at 1080p with no tier block to keep in sync.
- **Widen the rails and Inspector again at 3440.** Rejected: the type does not step at 3440, so the panels' measure is already right; the extra 880 px goes to the map and the Stage window ("extra width only").
- **`--sidebar-width` kept as an alias of `--rail-right-w`.** Rejected: one consumer, no test. An alias is a second name nobody needs.

### Breakpoints for JS

- **CSS custom properties `--bp-*`** (what `layout.md` promised). Impossible: custom properties cannot be used in media queries. This is the brief's decision 2.
- **Generate the CSS blocks from the TS table.** Rejected: it adds a build step for twenty values. The repo already locks CSS to constants with a parity test (`dialogContextTokens.test.ts`), which is cheaper and catches the same drift.
- **Read token values at runtime with `getComputedStyle` everywhere.** Used only for the root size (`rootFontPx()`), the one value the browser owns. Everything else comes from the TS table, which the test pins to the CSS.
- **Ship `useLayoutTier()` now.** Rejected: no consumer in this ticket, and the wiring checklist reads an unconsumed module as unintegrated. The Stage build adds it when it needs the window width.

### The undefined `--text-2xs`

- **Define it as an alias of `--text-xs`.** It would fix nine dangling references at once. Rejected: three of them are `CardFace` lines that render at their 11 px fallback today, and a 16 px alias would silently re-flow 210 px card faces on encounter surfaces that other tickets are editing. Counting them in the ratchet keeps the debt visible without moving pixels on hot files.

### Literal font sizes

- **Count `em` and `%` too.** Rejected: they are relative to text that is already on the scale. A ratchet that blocks every new `0.75em` glyph would be noise.
- **Count dev surfaces.** Rejected: the 16 px floor is a player-surface law; the debug panel and the CMS are the designer view (Law 13).
- **Migrate the 198 now.** Rejected: 53 of them sit in the god rail that the frame build rebuilds, and the encounter shells move to the Stage build. Migrating surfaces that are about to be rebuilt is the big-bang migration the brief's decision 10 rules out.

### Evidence

- **Change the gate to "screenshots at 2560×1440" everywhere.** Rejected: 1920×1080 is still the tightest fit (rails grow ×1.25 and type ×1.125 at 1440p, while height grows ×1.33), so it is the better default proof. Only layout- and type-token changes add the 1440p capture.

## Tensions surfaced

- **Legibility vs. the 1080p fold.** A real scale means +1/+2 px at 1080p, on the screen where THR-1856 already has an aftermath below the fold. The plan holds the scale and fixes surfaces, never the reverse (kill criterion 1). Browser-verify asserts page-level scroll and rail clipping at 1080p.
- **Map share vs. readable rails** (Law 53). At 1440p the map gives up 2.5 points against today: 65.3% against 67.8%, with rails of 400 + 420 and a 56 px top bar against 360 + 400 and 52 px. That is the trade Christian asked for, and THR-1828 already accepted it. At 1080p the map gains 3 points and moves back over its own floor.
- **Tokens before consumers.** Defining Inspector and Stage tokens with no component reading them looks like the inverse of the defect the issue names (docs promising tokens that do not exist). The difference is that these exist and are tested, and the next builds are queued to consume them.
- **Law amendment protocol.** Laws change jointly with Christian. The Law 33 edit only writes down his own 2026-10-11 screen ruling and the brief's settled cases, so it lands with the implementing PR and needs no new gate.

## Vision premises this plan leans on

- **The map is the table** (direction B). The map's share becomes a tested floor at both screens instead of a hope.
- **The god reads the world.** The primary screen gets type sized for its pixel density, and the story reads one step larger than the controls.
- **Tunability first (NFP #1).** The whole 1440p feel is one percentage and one column of widths.

## Branches not taken

- A fourth tier at 3840 (4K). A 4K screen at 150% OS scaling already reports 2560 CSS px. At 100% it would report 3840 and land in `uwqhd` with 18 px type on tiny pixels. That case is unsupported and left alone.
- A `--rail-*-w` value below 1920. The brief says no new work below 1920.

## Open questions

- Whether Christian wants the height guard. The parent session relays it as a veto point.
- Whether the Inspector's Full view at 3440 should cap its page width. Today the page column takes everything between the trail and the Connections column, with prose capped by `--measure-prose`. The Inspector build decides on sight.

## Brainstorm status

Complete enough to hand off.

---
*captured 2026-10-14 — Claude Code design session (Opus), spawned from the attended groundwork session*
