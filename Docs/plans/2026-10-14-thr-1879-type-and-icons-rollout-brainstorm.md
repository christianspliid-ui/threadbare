# Brainstorm companion — Type and icons rollout (THR-1879)

> Companion to [`2026-10-14-thr-1879-type-and-icons-rollout.md`](2026-10-14-thr-1879-type-and-icons-rollout.md). Records the alternatives weighed, the tensions, and the premises the plan rests on. Authored by a design session spawned from the attended map carve-up session of 2026-10-14.

## How this started

The wayfinder map *The Map Is the Table* (THR-1823) closed on 2026-10-14 with two decisions about how the game reads: three faces with one job each (THR-1833) and one carved icon family (THR-1834, chosen by Christian on a comparison sheet, then amended the same day to carve places too and to swap Disease, Ambition and Poison). The foundation plans built the parts (type steps, the `Icon` primitive, the ratchet) but deliberately left the contents to this ticket. The ask: ship the faces and the label rule, write the one concept → shape table, vendor the shapes with their credits, and say in what order the old glyphs leave.

## Premises

- **Christian judges icons on a sheet, not in a table.** THR-1834 was decided by looking at gold silhouettes beside today's glyphs. So the table's real form is a sheet, built from the same data as the plan's appendices, and every pick was checked by eye on it before publishing.
- **Fantasy-period objects, not symbols.** Christian rejected a bacteriophage (science) and mountain summits (abstract) for Disease and Ambition. The test for every pick: would a player name the object, and does the object belong in the world? A lyre and a harp beat a speaker; a stork beats a baby's face; an old wagon beats a camper van.
- **One shape per idea, not per key.** About 330 keys exist; many mean the same idea (a debt and a bargain, the activity *travel* and the toast target *journey*). Shapes belong to ideas; keys point at ideas. That keeps Law 10 honest without inventing 330 shapes.
- **Law 58 decides the file layout.** One list for the shapes (the registry), one map per class pointing into it, total over its union so a new member without an icon fails the build, and one resolver that draws a plain mark for anything unknown.

## Decision 1 — Where the shapes come from

| Option | Verdict |
|---|---|
| **The upstream repository (`game-icons/icons`) at a pinned commit, by a script, committed as generated data** | **Chosen.** The author is the directory, which the credits need; a pinned commit makes the output reproducible; nothing runs at runtime. |
| Iconify's API (as the THR-1834 sheet and this sheet were built) | Rejected for vendoring, kept for sheets. Iconify carries the paths but no per-icon author, and its collection silently picks one file where upstream has two authors for a slug. Ten of our picks are such slugs; the plan names the author whose file matches the sheet. |
| The `game-icons` npm package, or an icon font (RPG Awesome) | Rejected. A runtime dependency or a font is what THR-1834 call 1 ruled out ("no icon font, no npm icon package at runtime"), and RPG Awesome is a frozen subset. |
| Hand-copying paths into the registry | Rejected. 219 paths by hand is error-prone and loses the licence metadata; the script is small and re-runnable. |

**Tension: bundle size.** 219 paths are 313 KB raw / 141 KB gzip. Rounding to one decimal gives 247 / 103 KB with no visible change; integer rounding would halve it again but drifts on relative path commands. A warn budget (150 KB gzip) and a lazy-chunk fallback in the kill criteria keep it honest without optimising early.

## Decision 2 — How many shapes, and which

- **Distinct shapes per calling (23)** rather than one per calling family (10). Callings are what the world calls a mortal; the table is open-ended ("add a row, never a branch"), and each title is a distinct readable pattern. The family presentation derives from each family's seed calling, so there is no second list.
- **Dead tables are deleted, not mapped.** `EFFECT_TYPE_GLYPHS` (28), `WHEEL_SLOT_GLYPHS` (9) and three smaller tables have no reader. Vendoring shapes for them would add credits and bytes for nothing; a surface that later needs one adds an entry under the same rules. (This also shows THR-1874's broken escapes never reach a screen; the bug stays filed because it is cheap.)
- **Resource anomalies get their own shapes** instead of today's tinted reuse of the grove, ruins and wreck drawings: a golden grove and a herb garden are not groves at a glance.
- **A cleared lair is not a second shape.** The map already says "cleared" with a muted fill; a second cave would be two shapes for one place type.
- **Ornaments are not icons.** The ✦ dividers become plain rules; the tag-axis glyphs go because the chip's word is the axis.

Picks replaced on the first look at the sheet, because they read as modern: a camper van (*trade route*), an org chart (*legacy*), a fedora spy (*someone will notice*), a rank chevron (*boost*), speech bubbles (*social*), a cartoon baby (*birth*), a four-arrow "contract" glyph (*treaty*), a palm-tree spout (*fountain*). Each is recorded so a later swap does not reintroduce it.

## Decision 3 — What to leave open

The brief: where a class has no obvious period object, list candidates for Christian rather than deciding. Five classes qualified:

- **Doom kinds** — cosmic endings (Breach, Convergence, Sundering…). Four already show their sphere's icon in the top bar, so the sphere icon is one candidate for those.
- **Strands of a mortal** — Presence, Desires, Beliefs, Fears are inner life; any object is a metaphor.
- **Action verbs** — Create, Find out, Change, Destroy, Control, Upkeep are verbs, not things.
- **Places of power** — convergences, time scars and ley nexuses are magic phenomena with no common silhouette.
- **Rival temperaments** — aggression or subtlety are temper, not objects.

Classes that were close calls but decided (unsure picks): omens, consequence categories, thread-row badges, Codex categories. They have reasonable objects (a totem, laurels, an open gate), and a wrong pick costs one entry.

**Tension: the map cannot wait for the open places.** `ICON_FOR_LOCATION_SUBTYPE` is total over the union, so the six open places need *something*. Copying today's map drawings into the registry as temporary own entries keeps the map unchanged until Christian picks, without deciding for him.

## Decision 4 — The label rule's route in

| Option | Verdict |
|---|---|
| **Fix the shared label classes and token first (S1), then sweep the kept surfaces (S3)** | **Chosen.** Six classes reach about 26 call sites at once; the sweep then handles the inline cases by reach. |
| One big sweep with the font change | Rejected. It would touch about 100 files beside the font PR and collide with every surface build in flight. |
| A `text-transform: none` override at the root | Rejected. It would show lower-case strings as lower case ("primary") and Title Case as Title Case; sentence case must be written in the strings. |

**Tension: small Cinzel.** The rule says Cinzel only at 22 px and up, but nothing counts it. A ratchet row (`display-face-small`, same-block detection like THR-1821's overlay row) makes it measurable; without it, the 255 `--font-display` uses would drift back.

## Decision 5 — Fonts

- **Alegreya as one variable roman file** because Google serves 400 and 500 from the same file anyway (42.5 KB), plus italic 400 for afterimages and flavour, plus Alegreya Sans 800 for capital labels on the map. 88.5 KB total.
- **No Reserved Font Names** in any of the three OFL files (checked), so the Unity port can rename converted files.
- **The face ships with its step** (THR-1819's feed): every `--font-prose` site is sorted into story (the prose shorthand at `--text-base`) or not story (the UI face). Georgia stays only as the fallback.

## Vision premises invoked

- *Dark world, hidden magic, threads that break through* (Dark Tapestry): icons are gold silhouettes on dark, one colour, tinted by sphere, never repainted.
- *Narrative over mechanical perfection* (NFP 5): the story gets its own face and a larger step; icons are objects from the world, not UI symbols.
- *Mechanics through words, not numbers* (Law 13): every icon carries its word or tooltip; tabular figures apply only where numbers already are allowed (the essence pool, costs, dates).

## Open questions this plan does not answer

- Which candidates Christian picks for the five open classes ([THR-1908](https://linear.app/threadbare/issue/THR-1908)).
- Whether any unsure pick reads badly in the real UI at 18 px; the sweep may swap a shape (THR-1834 allows it), regenerating the sheet.
- The storefront DRM question, which only arises if a DRM-wrapped build is ever made.
