# Icons — the carved registry

**When to read:** adding or swapping an icon, giving a new kind of game thing an icon, drawing an icon on a surface, or porting the game (Unity, a storefront build).

Design: [`Docs/plans/2026-10-14-thr-1879-type-and-icons-rollout.md`](../plans/2026-10-14-thr-1879-type-and-icons-rollout.md) § 4–8 and Appendices A–C. Family decision: [`Docs/audits/2026-10-14-thr-1834-icon-family-decision.md`](../audits/2026-10-14-thr-1834-icon-family-decision.md). Laws: 9, 10, 11, 12, 58 (`laws.md`).

---

## The three layers

| Layer | File | What it holds |
|---|---|---|
| **Registry** — one entry per *idea* | `src/data/icons/iconRegistry.ts` | `IconName` → `{ meaning, shape, source }`. 229 carved game-icons.net shapes (`carved('<slug>')`), the `fallback` mark, and six temporary `own` entries for the open places |
| **Vendored shapes** — generated | `src/data/icons/carvedShapes.generated.ts` | One single-path shape per carved slug on the 512 × 512 grid, plus `GAME_ICONS_SOURCE` (repo, pinned commit, licence, changes, DRM note). Never edited by hand |
| **Class maps** — which key draws which idea | `src/data/icons/conceptIcons.ts`; `icon` fields on `CALLING_PRESENTATION` rows, `NUDGE_CARD_TYPE_ICON_NAMES`, the Codex `catDefs` | `ICON_FOR_WORLD_REF_KIND`, `PLACE_ICON`, `ICON_FOR_SUBLOCATION_TYPE`, the attachment maps, `ICON_FOR_ACTIVITY`, `ICON_FOR_ALERT`, `ICON_FOR_CONSEQUENCE`, `ICON_FOR_UNDERTAKING_OBJECT`, `ICON_FOR_RESOURCE_CLASS`, `ICON_FOR_AMBITION`, `ICON_FOR_SEASON`, `ICON_FOR_OMEN`, `ICON_FOR_LENS` and the rest |

Several keys may draw one idea when they mean the same thing (`debt` and `bargain`; the card type `kindled_ambition` and the ambition). That is Law 10 kept: one meaning, one shape. Two ideas never share a shape — `iconRegistry.test.ts` fails if they do.

## Drawing an icon

- `<Icon name="…" size="floor|chip|list|alone" decorative />` with a word beside it, or `label="…"` when the icon stands alone (`src/components/shared/Icon.tsx`). Shapes resolve through `iconShape()` only (Law 3).
- A class key resolves through `iconForKey(ICON_CLASSES.<class>, key)`; a sublocation through `iconForSublocation(typeId, parentSubtype)` (its own icon, else its parent place's, else `place-within`).
- **Colour:** an icon fills `currentColor`. Tertiary or secondary text colour at rest; the sphere colour when the concept is tied to a sphere; gold only where the surface already marks the god's attention or a selection (Law 31, one gold emphasis per panel).
- **Not icons:** spheres (`SphereIcon`), reaches (`ReachIcon`) and heraldry (`CoatOfArms`) stay our drawings; the Law 15 magnitude marks (`OddsPips`, `CostPips`, `DeltaCluster`, `ForecastDie`, `DifficultyScales`) are unchanged.

## Adding or swapping an icon

1. Write or change the registry entry: `name: { meaning: '…', ...carved('<slug>') }`. Pick a fantasy-period object a player would name at 18 px (Christian rejected a bacteriophage and mountain summits; picks that read as modern are replaced). Browse slugs at game-icons.net.
2. Run `npm run icons:vendor`. It fetches only what is missing from `github.com/game-icons/icons` at the pinned commit, drops the background square, keeps the one path, rounds to one decimal, drops shapes no entry uses, and prints the size (warns above 150 KB gzip).
3. If the slug exists under two authors upstream, the script stops and names both: write `carved('<slug>', { author: '<dir>' })`. A new author directory stops it too: add the credited name to `GAME_ICONS_AUTHOR_NAMES` in `src/data/icons/gameIconsSource.ts`.
4. Add the concept's key to its class map (or its row's `icon` field).
5. Commit the registry, the generated file and the map together.

What catches a mistake: a class map is total over its union (type error); `conceptIcons.test.ts` names any live content key with no entry; `carvedShapes.test.ts` names an entry whose slug is not vendored, with the command; at runtime an unknown key draws the fallback mark, warns once naming the map, and appears in `window.__DEBUG.getIconReport().fallbacksDrawn`.

The one transform the registry may ask for is a horizontal mirror (`carved('return-arrow', { mirror: true })` is `forward`); the mirrored path is stored as its own shape.

## The fallback mark

An empty roundel — a plain ring, outer radius 200, ring width 48, on the 512 grid. Meaning "Not yet drawn". It shows when a key reaches a surface with no entry; the caller's own label still names the thing. Never an emoji, never a blank, never a throw.

## Open classes

Five classes have no obvious period object and wait for Christian's pick ([THR-1908](https://linear.app/threadbare/issue/THR-1908)): doom kinds, strands, card verbs, places of power, rival tempers (plan Appendix C; candidates on the review sheet, `Docs/audits/2026-10-14-thr-1879-icon-table/icon-table.html`). Until then those surfaces keep today's glyph, and the six open places (convergence, time scar, shadow hollow, ley nexus, corruption, place of power) are temporary `own` copies of the map's drawings; `elder_ruin` draws the fallback. Each becomes carved by swapping its one entry.

**Caveat on those six copies:** the map draws them with an outline pass, so their open line strokes show there; `Icon` only fills, so in a panel those strokes vanish and the shape reads faint (the ley nexus shows only its halo). No panel reads them yet. A reader that moves onto `PLACE_ICON` before THR-1908's pick should expect that, not a bug in `Icon`.

## Licence and credits

- The shapes are **CC BY 3.0** (game-icons.net). The start page's **Credits** prints the Icons line, its author list rendered from `ICON_CREDITS` (the distinct authors of the carved entries), with links to game-icons.net and the licence. The line must ship in the same change as any new author.
- Changes made to the upstream files are recorded in `GAME_ICONS_SOURCE.changes`: recoloured through `currentColor`, background square dropped, coordinates rounded to one decimal, `return-arrow` also stored mirrored.
- **DRM.** CC BY 3.0 § 4(a) forbids technological measures that restrict a recipient's rights under the licence. The web build has none. **Before any build ships on a storefront that wraps the game in DRM** (for example Steam's optional wrapper), whoever handles legal checks this clause (THR-1834 call 1). Shipping without the wrapper avoids the question.
- **Unity.** The registry is path data only, so a port can rasterise the same entries into a sprite atlas.

## Where to see it

- `?view=styleguide` § Icon — every entry at four sizes, its meaning, slug and author.
- Start page → Credits — the Icons line.
- `await window.__DEBUG.getIconReport()` — `{ registry, carved, own, fallbacksDrawn, credits }`.
