> **Prototype audit for THR-1766** (wayfinder map THR-1758, project Dominion — Player Power Progression). Attended session 2026-10-11, Christian present in chat; decided by delegation with a veto invited.
>
> The mock is [`dominion-mock.html`](2026-10-11-thr-1766-dominion-mock/dominion-mock.html): one static file holding five 1920×1080 screens, selected by `#map-a`, `#map-b`, `#map-c`, `#sheets` or `#card`. Screenshots sit next to it.
>
> Sources the mock is built from:
> - the real terrain fills (`src/components/HexMapV2/palette/terrainPalette.ts`, `waterPalette.ts`)
> - the real location overlays (`public/hex-tiles/overlay-*.png`)
> - the design-system tokens (`src/index.css`)
> - the THR-1760 bands
>
> Terrain glyphs are simple stand-ins; the registry's own glyphs are placeholders too.

# THR-1766 — what the player sees

The ticket asked for three screens: the map with a Dominion overlay; the band on a location page and on a mortal sheet; and the band beside the cost on a card. It also asked what those screens teach about the band words and about the overlay's palette against the terrain art.

## Three premises the code corrected

1. **There is no player-facing map layer control.** HexMapV2 has only a debug checkbox and lab toggles. The overlay needs a new small control. The mock uses the ActionDrawer's narrative-tab styling: Terrain / Dominion / Borders / Threads.
2. **The "focused card" is gone.** THR-1002 retired it (`ActionDrawer.tsx:25-28`), so every card has one face (`CardFace.tsx`). The band goes on that face, after the cost pips (`CostPips`, `OddsPips.tsx:145-217`; ✦ glyphs, never a number).
3. **Essence trend words already exist.** `EssenceBlock` shows ↑ Rising / — Steady / ↓ Ebbing (`ascendant-bar-content.ts:203`), so the ticket's "rising / steady / draining" needs no new surface.

## 1. The overlay: three encodings, one survives

The god in every mock is the Shepherd: Life primary, seat at Hesk Crossing, an Entropy power pressing from the east. About 17% of land hexes read Touched or better and 10% Hostile, close to the THR-1765 census for a god three weeks in with a rival nearby. Water carries no band.

| Variant | Encoding | What it showed |
|---|---|---|
| [A · Wash](2026-10-11-thr-1766-dominion-mock/map-a.png) | Hexes tinted in the god's sphere colour, stronger by band; Hostile tinted in the opposing sphere | **Fails.** Life green on the olive lowland palette turns the turf one green, so forests, fields and hills stop reading. The Entropy teal on desert reads as water. Any sphere whose colour sits near the terrain palette has the same problem: Matter `#d4a87a` on desert and hills, Time `#ffb355` on hills, Life on every lowland. Hue is already taken by the terrain. |
| [B · Outline](2026-10-11-thr-1766-dominion-mock/map-b.png) | Outlines in the sphere colour, weighted by band; hatching on Hostile; gold where Held meets Hostile | **Noisy.** Hundreds of bright outlines make a lattice, the hatching is invisible at map scale, and the turf's shape is hard to see. |
| **[C · Dim the rest](2026-10-11-thr-1766-dominion-mock/map-c.png)** | Your turf keeps its terrain colour. Foreign is dimmed, Hostile dimmed further with a faint hatch, Touched lightly dimmed. Sovereign gets a small glow in the sphere colour. A **gold line** traces the edge of your turf, thicker where it meets Hostile ground. | **Reads at a glance.** It uses lightness instead of hue, so it works for every sphere on every terrain. The gold frontier line is the planning surface: *where do I push next*. |

**Decided: C.** Hue appears only in the Sovereign glow, which is small and sits on the god's own ground. Inside the turf, Held and Touched differ only by a light dim. The exact band of a hex is read on hover and on the place's page, not from colour.

## 2. The band on a place and on a mortal ([screen](2026-10-11-thr-1766-dominion-mock/sheets.png))

- **Location page:** a *Dominion* box right after *Livelihood*, in the same component shape (`LivelihoodLine`, `LocationView.tsx:955-1023`). It holds the band word in the sphere colour and one line on what it means. A second, smaller line names the pressure and the risk, both from THR-1763: *pressed from the east by a power of Entropy; left untended, it will slip back.*
- **Mortal sheet:** one row under *Attuned to* in the header (`AgentProfileModal.tsx` header). It holds the band word and one line about what a thread on this mortal would carry (THR-1761 thread yield; THR-1764: a mortal reads her own scores).

The band words with their one-liners (≤ 15 words each; sheet register):

| Band | Line |
|---|---|
| Sovereign | Wholly yours. Your works come easiest here. |
| Held | Yours, and holding. Cheaper works, richer threads. |
| Touched | Your mark is on it. A little cheaper. |
| Foreign | Neither yours nor set against you. |
| Hostile | Turned against you. Your works cost dearly. |

## 3. The band beside the cost ([screen](2026-10-11-thr-1766-dominion-mock/card.png))

- **The band belongs to the target, not the card.** Every card cast on Held ground is cheaper there, whatever its sphere (THR-1761 applies the band first, then the flat sphere discounts).
- **A chip after the pips:** *Held · cheaper here* in the band's colour, or *Hostile · dearer here* in `--negative`.
  - **A ghost pip** (struck, faint) shows what Foreign ground would have cost.
  - **Red pips** show what Hostile ground adds.
  - **The price stays gold:** CardFace never tints it.
- **Foreign shows no chip.** Par is silent, so only a change the band actually makes is shown (Law 56 in spirit).
- **The cast bar** names the target and the band in words: *on Hesk Crossing · Held ground: a little cheaper, a little stronger in the odds* (THR-1761's cast-odds row).

## 4. UI-Laws judgement

| Law | Verdict |
|---|---|
| **13** (no raw magnitudes) | ✓ The mock shows band words and pip glyphs, never a number. The pip count is the existing accepted cost glyph. |
| **33** (1920×1080) | ✓ All five screens fit one viewport. |
| **56** (chips only for real changes) | ✓ Foreign shows no chip. |
| **1 / 17** (tooltips) | ✗ in the static mock. Each band word needs a registry tooltip; the UL entries exist from THR-1746. The new layer control needs tooltips too. |
| **21** (names clickable) | ✗ in the mock. Place and mortal names must route. |

The ✗ rows are build obligations for THR-1750, not direction defects. Sphere tint is kept on the cards (Christian's standing preference).

**Side finding:** Order's gold differs between `SPHERE_COLORS` (`#fbbf24`, essence rows) and `--sphere-order-bright` (`#e8c860`, card tints). It is cosmetic, outside this ticket, and noted for the THR-1750 build.

## 5. Decided, veto

**Decided by delegation:**

1. **Overlay:** C (dim the rest, gold frontier, Sovereign glow).
2. **Layer control:** a new one, Terrain / Dominion / Borders / Threads, styled like the ActionDrawer tabs.
3. **Places:** the band as a box after Livelihood.
4. **Mortals:** the band as one row under *Attuned to*.
5. **Cards:** a chip after the pips, with ghost and red pips for the band's effect, and no chip on Foreign ground.
6. **Words:** the five band one-liners above.
7. **Essence:** no new surface.

**Veto lines:** *tint the turf in my sphere colour after all* · *show the band chip on Foreign ground too* · *no ghost pips*.
