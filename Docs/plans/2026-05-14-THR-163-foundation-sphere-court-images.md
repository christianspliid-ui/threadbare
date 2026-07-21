# THR-163 — Foundation sphere court-background images (chaos / order / light / darkness)

**Date:** 2026-05-14
**Author:** Cowork (keep-work-flowing scheduled run)
**Linear:** THR-163 — *Commission 4 Foundation sphere images*
**Project:** Marketing Site
**Status:** Ready for Dev — assets produced by Cowork, mechanical placement + verification handed off to CC

---

## TL;DR

The `public/backgrounds/court/` directory holds 8 painterly oil-painting sphere-art pieces (the **Creation** spheres). The 4 **Foundation** spheres — chaos, order, light, darkness — are missing. Cowork has generated the 4 missing images matching the existing visual register. CC's job is purely mechanical: resize the 4 source files to exactly `1376×768`, save them as `.png` into `public/backgrounds/court/`, confirm the build is clean, eyeball them, and commit.

**Source images (Cowork-generated, reviewed against the existing 8):**

```
C:\Users\chris\Dev\NanoBananaImages\chaos.jpg
C:\Users\chris\Dev\NanoBananaImages\order.jpg
C:\Users\chris\Dev\NanoBananaImages\light.jpg
C:\Users\chris\Dev\NanoBananaImages\darkness.jpg
```

CC runs natively on Christian's machine and can read that path directly. (It is outside the Cowork sandbox mount, which is why Cowork could not place the files itself.)

---

## Correction to the issue's premise (read before starting)

THR-163's description (originally written 2026-04-18) is **partly stale**. Verified against the codebase 2026-05-14:

| Issue claims | Reality (verified) |
|---|---|
| "The sphere strip on `public/the-game.html` … renders nearest-meaning Creation sphere art fallbacks" | `the-game.html` uses the **SVG sphere diagram**, which references `/icons/spheres/{chaos,order,light,darkness}.png`. **Those 4 icon files already exist** (`public/icons/spheres/`, 1024×1024). `the-game.html` does **not** reference `backgrounds/court/` at all — there are no fallbacks and no 404s there. |
| "marketing-surface only" | `public/backgrounds/court/*` is consumed by **`src/components/Game/ScryOverlay.tsx`** (in-game Scry overlay, `COURT_BACKGROUNDS` map) and by `public/product-strategy.html`. It is an in-game + internal-page asset, not a marketing-page asset. |
| DoD: "`public/the-game.html` verified to pick them up (no 404s)" | **Not applicable** — `the-game.html` does not load `backgrounds/court/`. CC should mark this DoD line N/A in the closing comment. |

**What is still true and still needed:** `public/backgrounds/court/` is genuinely missing the 4 Foundation sphere background images. Adding them is correct regardless of the stale framing — it closes a real asset gap for `ScryOverlay.tsx` and `product-strategy.html`.

---

## Reference: the existing 8 (visual register the 4 must match)

`public/backgrounds/court/{energy,entropy,force,life,matter,mind,spirit,time}.png`

- **Format/dims:** JPEG-encoded, `.png` extension, **1376×768**, 8-bit sRGB, ~0.7–1.0 MB each.
- **Style:** abstract painterly oil painting — thick impasto brushwork, visible canvas grain, deep near-black background with heavy dark edge vignetting, a single dominant luminous hue per sphere glowing from within, no literal objects or figures. Each court background roughly tracks its sphere's hue (mind = blue, spirit = violet, energy = gold, entropy = teal …).

The 4 generated Foundation images were authored to sit in this exact register so the set reads as one cohesive family of 12.

---

## Tonal direction applied (from the issue, Christian's own notes — the authority for this task)

| Sphere | Tonal note (issue) | Image delivered |
|---|---|---|
| **Chaos** | unresolved energy, storm-before-form, shimmer without edges — *potential*, not destruction | turbulent swirling churn of iridescent violet / magenta / gold, no hard edges |
| **Order** | crystalline geometry, **cold clarity**, a lattice that holds — *gravity of pattern*, not bureaucracy | cold pale blue-white crystalline lattice glowing from within |
| **Light** | revelation, exposure, the thing that makes shadow possible — *seeing*, not goodness | radiant warm gold-white source casting long exposing rays |
| **Darkness** | what remains unseen, holds secrets, precedes a torch — *the undisclosed*, not evil | deepest indigo-black, withheld forms dissolving into shadow, barest violet undertone |

### Known, intentional palette divergence — flag for Christian

`src/data/sphereIcons.ts` → `FOUNDATION_SPHERE_ICONS` assigns older icon hues: `chaos #d4d4d8` (pale grey), `order #fbbf24` (amber). The issue's tonal notes — more recent (issue updated 2026-05-14) and more specific — point elsewhere: "cold clarity" for Order reads as cold blue-white, not amber. **Cowork followed the issue's tonal notes**, treating them as Christian's direct and current direction for this deliverable. The court-background art class does not have to match icon hue exactly. If Christian prefers the `sphereIcons.ts` palette instead, regeneration is cheap — the exact generation prompts are in the appendix below. This is the one judgment call in the task; surfacing it rather than burying it.

---

## Three-pillar coverage

### Engine — N/A
No engine code is touched by THR-163. The `ScryOverlay.tsx` `COURT_BACKGROUNDS` map is typed `Record<SphereName, string>` and `SphereName` is the 8 Creation spheres only — Foundation spheres are not in the type. **Extending the type + map so the in-game Scry overlay actually renders a Foundation-sphere court is explicitly OUT OF SCOPE** (see Follow-up below). THR-163 only drops the asset files so the path resolves for any current or future consumer.

### Content — the deliverable itself
The 4 image assets are the content. Produced and reviewed by Cowork against the existing 8. No prose, no templates, no data tables.

### UI — asset availability, no component change
After placement, `public/backgrounds/court/{chaos,order,light,darkness}.png` resolve as static assets. `ScryOverlay.tsx` and `product-strategy.html` can reference the Foundation paths without 404s. **No component code changes in this issue.** Verification only: the 8 existing court backgrounds still load, the 4 new files exist at the correct dims, `vite build` succeeds.

### Wiring
`Docs/plans/wiring-checklist.md` — no new orchestrator phase / modal / GameState field / trace / player control. No checklist update required. The only "wiring" is the static-asset path: files land where existing consumers already build URLs.

---

## CC handoff — mechanical steps

1. **Resize + convert** each of the 4 source files to exactly `1376×768`, save into `public/backgrounds/court/` with a `.png` extension (matching the existing 8 — note the existing files are JPEG-encoded with a `.png` extension; keep that convention):
   ```bash
   for s in chaos order light darkness; do
     magick "C:\Users\chris\Dev\NanoBananaImages\$s.jpg" \
       -resize 1376x768^ -gravity center -extent 1376x768 \
       "public/backgrounds/court/$s.png"
   done
   ```
   (`-resize ^ … -extent` center-crops to exact dims — the source is already ~16:9 so the crop is minimal.)
2. **Verify dimensions** match the existing 8: `identify public/backgrounds/court/*.png` — all 12 should report `1376x768`.
3. **Build check:** `npx vite build` succeeds (confirms Vercel will deploy; static assets don't break the build but run it per pre-commit minimum).
4. **Visual pass:** open `public/product-strategy.html` (it references `/backgrounds/court/spirit.png`) or load `ScryOverlay` in `?view=game&seeded` and confirm the 8 existing backgrounds still render and the 4 new files are reachable (no 404 in the network tab). A 1920×1080 screenshot of any surface showing a court background is sufficient evidence — this is an asset drop, not a new UI surface, so the full browser-verify triad is light here.
5. **Commit** with `Fixes THR-163` in the body. In the closing comment: mark the stale DoD line ("`the-game.html` verified to pick them up") **N/A** with the reason from the Correction table above, and note the Follow-up below.

**Atomicity:** land all 4 at once — do not commit a partial set (per the issue's "replace all four atomically" note).

**Fallback:** if the 4 source files are missing from `C:\Users\chris\Dev\NanoBananaImages\`, regenerate from the prompts in the appendix (any image tool), then resize as above.

---

## Follow-up (do NOT do in THR-163 — file separately, needs Christian)

To make the in-game **Scry overlay actually render a Foundation-sphere court**, `ScryOverlay.tsx`'s `COURT_BACKGROUNDS` map and the `SphereName` type would need to include chaos/order/light/darkness. That is a **type-schema change with real blast radius** (`SphereName` flows through `traits.ts`-adjacent territory) and it overlaps directly with **THR-175** ("agent.sphere field + engine schema", DEFERRED) and the sphere-axis questions raised in **THR-390**'s action-system audit. It is a sphere-axis *design* decision, not an asset task — it must not be folded into THR-163 autonomously. Recommend: once THR-175 / the sphere-axis design fork is resolved, file a small follow-up to extend `COURT_BACKGROUNDS`. Flagged here so the connection isn't lost.

---

## NFP compliance

| NFP | Verdict |
|---|---|
| 1 — Tunability | PASS — N/A, static assets, no magic numbers. |
| 2 — Inspectability | PASS — N/A, no runtime logic. |
| 3 — Determinism | PASS — N/A. |
| 4 — Fail-soft | PASS with note — before this lands, a Foundation-sphere `backgrounds/court/` URL 404s; no current consumer requests one (`COURT_BACKGROUNDS` has only 8 keys), so there is no live failure. After this lands, the path resolves. |
| 5 — Narrative over mechanical | PASS — the 4 images extend the painterly cosmology art set; tonal notes honoured. |
| 6 — Additive over destructive | PASS — pure addition of 4 files; the existing 8 are untouched. |
| 7 — Performance budget | PASS — 4 static images ~0.8 MB each, lazy-loaded by consumers; no runtime cost. |

---

## Appendix — generation prompts (for regeneration if needed)

All generated at 16:9, 2K, "quality" preset. Shared style stem: *abstract painterly oil painting on heavily textured canvas, thick impasto brushwork and visible canvas grain, deep near-black background with heavy dark vignetting at all edges, no literal objects or figures or text, dark moody cosmic fantasy concept art, ancient and elder in feeling, glowing from within, horizontal 16:9 composition.*

- **Chaos:** "…the subject is unresolved primordial energy — a storm before form: a turbulent, shimmering churn of iridescent violet, magenta and shifting half-formed colors that never settles into a defined edge. Soft luminous shimmer with no hard outlines, swirling raw potential, the moment before creation decides what to become."
- **Order:** "…the subject is crystalline geometry — a cold, clear interlocking lattice of pale blue-white light, geometric facets and structured planes that hold together with the quiet gravity of pattern. Sharp luminous crystalline structure glowing from within, precise and architectural yet painterly. No buildings."
- **Light:** "…the subject is revelation itself — a radiant warm gold-white source casting long exposing rays that catch and reveal the texture of the darkness around them. Light as the act of seeing, as the thing that makes shadow possible — not as goodness or warmth. Luminous core with revealing beams cutting through dark. No sun."
- **Darkness:** "…the subject is the undisclosed — the deepest obscuring indigo-black, what remains unseen, what holds secrets, the dark that precedes a torch. Almost no glow: only the barest cold violet-blue undertone and a faint hint of withheld form dissolving into shadow. Quiet, secretive, vast and patient. Not evil — the unrevealed."
