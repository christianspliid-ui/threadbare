> **Decision audit for THR-1828** (wayfinder map THR-1823, *The Map Is the Table*; project UI Visual Overhaul — Design System v1). Design lane run 2026-10-12b, unattended; decided by delegation (process.md rule 4) with a veto invited. The blocker, THR-1825 (what asks for the god's attention), closed 2026-10-11. Every substrate claim below was measured in this run against `origin/main` at `f19ce3ab`. Mock: [`mock.html`](2026-10-12-thr-1828-screen-frame/mock.html) rendered to [`frame-1440p.jpg`](2026-10-12-thr-1828-screen-frame/frame-1440p.jpg), [`frame-1080p.jpg`](2026-10-12-thr-1828-screen-frame/frame-1080p.jpg) and [`frame-1080p-inspector-queue.jpg`](2026-10-12-thr-1828-screen-frame/frame-1080p-inspector-queue.jpg). The mock is layout, not art: the map is a placeholder, and icons are empty squares until THR-1834 picks the family.

# THR-1828 — The screen frame

## The decision in one paragraph

The frame is **one row of top bar and two rails**, and the map gets everything else. The **top bar** holds time (pause **and** speed, in one place), a **Needs you** button that appears only when something waits, the **Find** field, **Doom** and **Omen**, and four labelled buttons: Rivals, Notables, Read the Threads, Settings. World-Soul leaves the top bar for the Ledger rail, and Attention moves into the god rail beside essence. The **god rail** (left) always shows who you are, your essence and Attention, and **your hand**. Reaches, Mandate, Covenants, Signatures and Hooks fold into one-line rows at the bottom, each with a one-line summary. The **Ledger rail** (right) holds Threads and the Chronicle. The Chapter Ledger becomes a tab of the Chronicle. World Pulse retires: its speed control moves to the top bar, and its counts go. The Ledger rail folds to a narrow strip of icons and counts, by the player or automatically while the Inspector is open. Nothing in the frame is smaller than the game's 16 px text floor, and nothing uses spaced small capitals. With both rails open, the map keeps at least 60% of the screen at both sizes.

## What the game has today (measured)

| Fact | Evidence |
|---|---|
| The top bar is `GameViewTopBar`, min height `--topbar-height` 44 / 48 / 52 px (default / ≥1920 / ≥2560), and it can wrap to two rows | `GameViewTopBar.tsx:170-179,197`; `index.css:311,352,361` |
| Top bar, left to right: Time (`SimulationControls compact`: label, ⏸/⏵, season · year, status line), World-Soul, Attention · Doom, Omen, Rivals (⚔ + label), Notables (♛ + label), Read the Threads (📖, **icon only**), Settings (⚙, **icon only**) | `GameViewTopBar.tsx:210-241,261-320`; `RivalsButton.tsx:23,42`; `NotablesButton.tsx:32,42` |
| **The top bar has no speed control.** Speed and step exist only in the non-compact `SimulationControls`, which the top bar does not use | `SimulationControls.tsx:171-212`; speed steps `[1, 2, 3, 5, 10, 20]` at `:58` |
| **The only visible speed control is in World Pulse**, down the right rail, in monospace: `◀ {speed}× ▶`. World Pulse also repeats the season, shows Active Agents and Cultures counts (monospace), a doom mood line, and a second "World Omen" | `WorldPulse.tsx:105-108,113-136,150-160,168`; mounted `GameView.tsx:5971` |
| The god rail is `AscendantBar`, a fixed 360 px at every size; eight foldable sections in order: identity + quintessence, Reaches, Signatures, Essence, Actions, Covenants, Mandate, Hooks | `ascendant-bar/styles.module.css:6-17`; `AscendantBar.tsx:42-58,174-257` |
| Its labels go down to 9–10 px uppercase with wide tracking ("Quintessence" 9 px, "Primary"/"Secondary" 9 px, Actions group headers 10 px at 0.22em, Hooks headers 10 px); section headers are 12 px uppercase at 0.18em | `IdentityStrip.tsx:187-192`; `ReachesBlock.tsx:60-68`; `ActionsBlock.tsx:66-70,100-103`; `HooksBlock.tsx:369,379,389`; `styles.module.css:108-116` |
| The game's own type scale says 16 px is "smallest readable size" | `index.css:50` `--text-xs: 1rem; /* 16px */` |
| The right rail is `--sidebar-width` 280 / 360 / 400 / 420 px, always rendered: ThreadsPanel → a "📖 Chapter Ledger" launcher with an unread count → World Pulse → ChroniclePanel | `GameView.tsx:5893-5982`; `index.css:310,351,360,368` |
| The floating "Active Locations" box is `LiveLocationBar`, absolute over the map's bottom-left, dismissible | `LiveLocationBar.tsx:104-113`; already retired by THR-1827 |
| **The alert channel is produced and never shown.** `AlertBar` is imported but not mounted; alerts are capped at 12 | `GameViewTopBar.tsx:295` `{/* AlertBar disabled */}`; `notificationRouter.ts:240`; `types/notification.ts:208`; `GameView.tsx:145` |
| The IA manifest still claims the alert bar is always mounted | `src/data/ia-manifest.ts:420-430` |
| Game hotkeys: Space, `+`/`=`, `-`, `.`, `m`; all skipped while typing | `useTopBarHotkeys.ts:13-51` |
| `layout-zones.md` is stale: it names HexSidebar (60–220 px) as the left zone and lists MandateTracker / EssencePanel in the top bar | `layout-zones.md:47,56-57,173` |
| GameView is one 6,583-line flexbox file with no Tailwind breakpoints | `GameView.tsx`; layout rows at `:5374,5431,5463,5832` |

Settled input this decision builds on, not re-opened: the Inspector (THR-1827: docked 28vw, the hand in the god rail, the Ledger folds while the Inspector is open, Doom/Mandate/Omen stay dialogs), map chrome (THR-1831: controls bottom-right, minimap on at 1440p and folded at 1080p), Find anything (THR-1832: a labelled Find field in the top bar, Ctrl+K and `/`), the attention research (THR-1825: what the queue carries), and two plans already queued for building, THR-1814 (top-bar tooltips, the clock names who holds it, empty rail sections hidden) and THR-1812 (a paused choice stays on screen).

Laws that bind: 11 (icon carrying meaning alone sizes up), 12 (legend on first contact), 25 (a control that does nothing does not render), 33 (one viewport, nothing scrolls at page level), 36 (progressive lists), 45 (contrast), 46 (24 px hit area), 49 (coalesce, no silent drop), 51 (preferences outlive the session), 52 (temporal state always visible, every pause named), 53 (persistent HUD is a budget).

## The calls

### 1. Top bar — one row, never wraps

Left to right:

| Slot | What | Notes |
|---|---|---|
| **Time** | date (season · year, day), **pause/play**, **speed stepper** `‹ 2× ›` over the existing six steps, the status line | The one home of run/pause/speed (Law 52). THR-1814's "held by …" status line renders here unchanged. No monospace. |
| **Needs you** | a gold pill with a count; opens a drop-down list | **Renders only when the count is above zero** (Law 25, Law 53). See call 4. |
| **Find** | labelled field, hint "Find a place, a person, a power, a card…", `Ctrl K` key cap | THR-1832. Takes the free middle; shrinks first when space is short (min 240 px). |
| **Doom** | label + stage name + the five-stage bar | Opens the Doom dialog, as today (THR-1827 call 5). |
| **Omen** | label + omen name | Hidden until the first omen, as today (THR-1648). Opens its flyout. |
| **Rivals · Notables · Read the Threads · Settings** | icon **and text label**, always | Read the Threads and Settings gain their labels; the `topbar-compact-hide` rule below 1600 px goes (widths under 1920 are out of scope). |

- **World-Soul leaves the top bar.** It is a reading of the world, not something the god acts on every minute (THR-1814's own tooltip: "You read it; you do not spend it"). It becomes the one-line header of the Chronicle, merged with World Pulse's doom mood line: *"World-Soul · the world leans to Spirit, and grows uneasy."* Its tooltip from THR-1814 moves with the component.
- **Attention leaves the top bar for the god rail**, under essence. It is the god's own resource, drawn when attending a moment, so it belongs with essence.
- **Heights:** 48 px at 1920, 56 px at 2560 (`--topbar-height`; THR-1819 owns the token). One row only; a wrap is a bug.
- **While an encounter is open** the right group stays dimmed and click-guarded, exactly as THR-1814 builds it.

### 2. God rail (left) — who you are, what you hold, what you can cast

Top to bottom:

1. **Identity** (always): portrait, name, state ("Rooted"), one line naming your First. Quintessence becomes a plain line in sentence case (a word and its tooltip, at the floor size), not a 9 px capital label.
2. **Essence and Attention** (always): the spheres you hold, two to a row, your primary sphere named in the header; the Attention gauge with its state word under it.
3. **Your hand** (always; fills the remaining height and scrolls inside itself): the cards, sphere-tinted (never strip the tint), each with name, sphere, price and target in words. Arming a card lights its targets (THR-1827 call 14). This replaces the Actions section.
4. **Folded rows** (pinned to the bottom, one line each with a summary, click to open in place): **Reaches** ("Veil · Adept"), **Mandate** ("2 of 5"), **Covenants**, **Signatures**, **Hooks**. Covenants, Signatures and Hooks render only when they hold something (THR-1814 rule 4, unchanged). Fold state is a remembered preference (Law 51).

- **Widths:** 320 px at 1920, 400 px at 2560 (THR-1819's `--rail-left-w`). Today it is a fixed 360.
- **Type:** the smallest text in the rail is the game's 16 px floor (`--text-xs`), stepping up with THR-1819's root step-up at 2560. Section labels are sentence case, bold, in the tertiary text colour. **No uppercase-tracked labels anywhere in the frame.** THR-1833 picks the faces.
- **Measured fit:** at 1920×1080 with 16 px labels, identity + essence + Attention + a five-card hand + three folded rows fit with about 280 px to spare (see `frame-1080p.jpg`). So THR-1827's fallback (the hand moves to a strip along the map's bottom edge at 1080p) is **not needed**, and the hand stays in the rail at both sizes.
- **Why Reaches folds** when THR-613 kept it open as "the player's identity anchor": the folded row still shows both permanent Reaches and their rung, so the anchor stays visible; the full rung ladder opens on click.

### 3. Ledger rail (right) — your threads and the story so far

1. **Threads**: your threaded mortals, one row each (portrait, name, what they are doing, "asks you" when they do). The ThreadsPanel sections and their fold rules are kept.
2. **Chronicle**: the World-Soul line (call 1), then the tabs **Now · Years · Ledger**. The Chapter Ledger launcher box becomes the **Ledger** tab with its unread count ("Ledger · 2 new"). It still opens the existing Chapter Ledger reader, and still holds the clock while open (THR-1825 row 22).
- **Retires:** World Pulse entirely: its speed control moves to the top bar; season/year are already in the top bar; the Active Agents and Cultures counts go (no decision rests on them, Law 53); its "World Omen" duplicates the top bar; its mood line merges into the World-Soul line. The floating Active Locations box is already retired by THR-1827.
- **Folds to a strip**, 56 px wide: one icon and count per section (threads waiting on you, new chronicle entries), each with a tooltip. **The mock taught this:** words in a 48 px strip clip at 16 px ("Chronicl…" in `frame-1080p-inspector-queue.jpg`), so the strip is icons with counts, from THR-1834's family.
- **When it folds:** automatically while the Inspector is open (THR-1827 call 6), and whenever the player folds it. The player's choice is remembered (Law 51); closing the Inspector restores the player's choice.
- **Widths:** 340 px at 1920, 420 px at 2560 (THR-1819's `--sidebar-w`).

### 4. The Needs you queue

From THR-1825's answer, the queue holds three groups, in this order:

| Group | What | Click |
|---|---|---|
| **Waiting for you** | asks that do not stop time: the ascendant-beat offer; divine receipts of the toast tier while unacknowledged; a named pause such as your avatar arriving | opens the thing (the offer, the receipt) |
| **Held behind this chapter** | interrupts waiting behind the one on screen, each named ("A premonition about Kael Thorne") | nothing to click until the current one closes; the row says "after this" |
| **News** | the alert channel: mandate milestones and victory, ambitions won or failed, faction outcomes, revelations | routes the named subject into the Inspector |

- **The count** is the number of rows. **Opening the list never clears it** (Law 40): a row leaves when its thing is opened or resolves. News rows leave when opened or after `NEEDS_YOU_NEWS_KEEP_DAYS = 3` in-game days, and then live on in the Chronicle.
- **No silent drop** (Law 49): if News holds more than `NEEDS_YOU_NEWS_MAX = 12` rows, the last row reads "and N earlier, in the Chronicle".
- **Per-entity news stays on the row badges** (THR-664/665/666/667/935, unchanged). Toasts stay for action feedback only.
- **Never pauses time**, like Find.
- The drop-down hangs under the pill, about 440 px wide, capped at 60vh, and closes on Esc (Law 23).
- Avatar arrival, today a toast plus an ad-hoc pause outside the interrupt registry (`GameView.tsx:750-764`), joins the registry so the clock can name it (THR-1814's holder table gets one row) and the queue can list it.

### 5. The budget (Law 53)

| Screen | Frame | Map keeps |
|---|---|---|
| 2560×1440, both rails open (56 + 400 + 420) | 34.7% | **65.3%** (1740 × 1384) |
| 2560×1440, Ledger folded to the 56 px strip | 21.0% | **79.0%** |
| 2560×1440, Inspector docked (717) + strip | 47.9% | **52.1%** |
| 1920×1080, both rails open (48 + 320 + 340) | 37.3% | **62.7%** (1260 × 1032) |
| 1920×1080, Ledger folded to the 56 px strip | 23.2% | **76.8%** |
| 1920×1080, Inspector docked (560) + strip | 51.0% | **49.0%** |
| *today, 1920×1080 (48 + 360 + 360)* | *40.3%* | *59.7%* |
| *today, 2560×1440 (52 + 360 + 400)* | *32.2%* | *67.8%* |

- **The rule, as tunables:** `FRAME_MAP_SHARE_MIN = 0.60` with both rails open, and `FRAME_MAP_SHARE_MIN_INSPECTOR = 0.45` with the Inspector docked, checked at 1920×1080 and 2560×1440. A later addition to the frame is measured against these two numbers.
- At 1080p the map gains 3 points over today. At 1440p it gives up 2.5 points for readable rails, which is the trade Christian asked for ("the chrome reads small" at 2560, THR-1819).

### 6. Hotkeys

Kept: Space, `+`/`=`, `-`, `.`, `m`. Taken by earlier decisions: Ctrl+K and `/` (Find), `W` (widen), `1`–`5` (lenses). **New:** `N` opens Needs you (when it renders), `L` folds or unfolds the Ledger rail. Both are skipped while typing, like the rest.

## Options weighed

- **Keep World-Soul and Attention in the top bar.** Rejected: the bar must hold Find, Needs you and four labels in one row at 1920. World-Soul is a reading, and Attention sits better with the other resource.
- **Speed lives only in Settings or a hotkey.** Rejected: Law 52 puts run/pause/speed in persistent chrome, and today speed is half-hidden in World Pulse.
- **A permanent Needs you slot showing "0".** Rejected: a control with nothing to do does not render (Law 25), and it costs budget for nothing.
- **Hand as a strip along the map's bottom edge** (THR-1827's fallback). Not needed: the mock fits the hand in the rail at 1080p.
- **Keep World Pulse as a smaller box.** Rejected: everything in it is either duplicated elsewhere or not decision-relevant.
- **Narrower rails (today's 360 at 2560) for more map.** Rejected: at 2560 the 16 px floor and real card names need the width; the map still keeps 65%.
- **The Chapter Ledger as a top-bar button.** Rejected: it is a reader of the story, so it lives with the Chronicle.

## Would change the call

- **Christian says "keep World-Soul up top"**: it returns to the top bar after Omen; the Find field shrinks to its 240 px minimum at 1920.
- **Christian says "I want to see the counts"** (agents, cultures): they come back as a line under the World-Soul line, not as a box.
- **A real hand of seven or more cards overflows the rail at 1080p in play**: the hand scrolls inside itself first; if the scroll hides armed cards, take THR-1827's strip fallback.
- **THR-1819 sets different rail tokens**: these widths are the input; the budget rule above is what must survive.

## Feeds

| Ticket | What it takes from this |
|---|---|
| THR-1819 (1440p layout contract) | `--topbar-height` 48/56, `--rail-left-w` 320/400, `--sidebar-w` 340/420, strip 56; the two budget constants; `layout-zones.md`'s left zone and top-bar list rewritten |
| THR-1833 (type) | the 16 px floor and "no uppercase-tracked labels" for the frame; Cinzel for names only |
| THR-1834 (icons) | labelled top-bar buttons; strip icons for Threads and Chronicle; the Needs you group icons |
| THR-1822 (view-model seam) | a `needsYou` view model built from the interrupt registry, the beat offer, unacked receipts and the alert channel |
| THR-1829 (Stage) | "Held behind this chapter" is the Stage's waiting line |
| THR-1814 / THR-1812 (queued builds) | unchanged; the World-Soul and Attention components move with their new tooltips. Build them first; the frame plan doc lands after |
| The map's *GameView split* (Not yet specified) | the frame is three modules: TopBar, GodRail, LedgerRail |
