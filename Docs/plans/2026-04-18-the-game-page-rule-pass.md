# The Game page — voice rule pass

**Status:** Ready for Dev
**Target file:** `public/the-game.html` (the live marketing page; deployed via Vercel under `/the-game.html` and linked from `threadbearer.co/the-game.html`)
**Reference for visual structure:** `Docs/plans/Threadbearer Landing _standalone_.html` (12 MB claude.ai/design export — for visual rhythm reference only; do not bundle into `public/`)
**Pillar coverage:** UI (copy + minor markup) only. No engine, no content data, no new components.

## Why this exists

The user reviewed both the current `public/the-game.html` and a claude.ai/design-generated alternate (`Threadbearer Landing _standalone_.html`). The visual design of the current plain-HTML page is approved; the **copy fails seven voice rules** the user has now locked. This pass applies those rules to the existing file and ports two structural wins from the design-test.

The voice rule for marketing copy is: **evoke, don't explain** (memory `feedback_marketing_copy_voice.md`). Manual-style prose stays in docs; landing copy must spark imagination through concrete scenes, never expose engine internals.

## The seven rules (locked by user 2026-04-17)

| # | Rule | Source |
|---|---|---|
| 1 | **No numeric stats** — strip "43 divine actions", "Eight intervention types", "19 archetypes", "64+ templates", "Seven doom archetypes". Numbers belong in design docs, not on the landing page. | User directive |
| 2 | **Keep all 12 spheres visible** — the current sphere strip shows only 8 Creation spheres. Add the 4 Foundation spheres (Chaos, Order, Light, Darkness) for full symmetry. **This is an explicit override** of `project_elder_magic.md` for the marketing page only — Foundation spheres remain "elder magic discovered through ruins" *in-game*, but symmetry wins on the landing page. | User directive |
| 3 | **Replace "emergent myth" subtitle** — currently "A god-game of emergent myth" in hero tagline (line 535) and footer (line 706). | User directive |
| 4 | **Abstract or remove explicit inspiration references** — "Crusader Kings, Dwarf Fortress" in closing (line 701). Translate into qualities, not titles. | User directive |
| 5 | **Strip dev vocab** — "First", "retinue", "agents", "axiological profiles", "Seeded Determinism", "Graph-Native World", "simulation produces it", "Encounter System", "scripted", "deterministic", "templates", "subtypes". Use player-facing language. | User directive |
| 6 | **Reframe or remove "Doom Clock"** — currently in The Promise (line 545), Promise card title (line 578), Pillar 4 (line 648), atmosphere quote (line 655), and Under the Hood card (line 686). Reframe as *structural pressure* (an age ending, the world fraying, the great unmaking) — not a literal clock. | User directive (consistent with `project_turn_based.md` — turn-based god-game shouldn't lean on clock-ticking imagery) |
| 7 | **Length is fine if visually rich** — do not shorten just to shorten. Add visual goodies. | User directive |

## What to keep (do not touch)

- Hero markup, wordmark image, background image, scroll hint, `Enter the World` CTA (line 536) — visually correct.
- All four Pillar `<div class="pillar">` block structures and their image refs — only the text inside `.pillar-text` changes.
- All `<div class="art-full">` atmosphere art blocks — only the `.art-quote` text changes for the inaccurate one.
- All CSS in `<style>` — no design-system changes.
- The `IntersectionObserver` reveal script at the bottom — leave alone.

## Two structural wins to port from the design-test

These are additive — they add value without destroying what's there.

**A. Premise hook + closing bookend.** The design-test opens with a two-line premise ("Somewhere, a scholar is rereading a word that should not exist. / Somewhere, a swordbearer is waking to a morning she will not survive.") and closes by calling those same lines back ("The tapestry waits. / Pick a thread. Pull."). Add this premise as a new `<section>` between Hero and The Promise, and rewrite Closing to bookend it.

**B. Numbered chapter markers.** The design-test uses Roman-numeral chapter tags (I · PREMISE, II · THE WORKING, etc.) above each section title. Our current `.section-tag` styling already supports this — change the tag text only (no CSS work). This makes the page feel like a novel's table of contents, not a marketing checklist.

## Section-by-section copy diff

Diffs are by current line number in `public/the-game.html`. Where a whole block changes, the new block is given verbatim. Use proper HTML entities (`&mdash;`, `&hellip;`, `&apos;`, `&amp;`) consistent with the existing file.

### 1. Hero tagline (line 535)

```html
<!-- BEFORE -->
<div class="hero-tagline">A god-game of emergent myth</div>

<!-- AFTER -->
<div class="hero-tagline">Pull the threads. Weave the world.</div>
```

### 2. NEW SECTION — Premise (insert immediately after Hero closes, before The Promise on line 542)

```html
<!-- ═══════════════ I · PREMISE ═══ -->
<section class="reveal" style="text-align:center; max-width: 900px;">
  <div class="section-tag">I &middot; The Premise</div>
  <h2 style="font-style: italic;">A world without gods is not without prayer.</h2>
  <p class="lead" style="font-style: italic; color: var(--gold-pale);">
    Somewhere, a scholar is rereading a word that should not exist.<br>
    Somewhere, a swordbearer is waking to a morning she will not survive.<br>
    Somewhere, the wind is changing direction for the first time in an age.
  </p>
  <p class="lead">You are new. The world is old. It will not wait for you to learn its name.</p>
</section>
```

### 3. The Promise → renumber + replace "the clock is always ticking" (lines 542–546)

```html
<!-- BEFORE -->
<section class="reveal">
  <div class="section-tag">The Promise</div>
  <h2>You are a god.<br>The world is <em>yours to shape.</em></h2>
  <p class="lead">Awaken as a newly formed deity in a world that doesn't know your name. Thread your will through mortal lives. Build civilizations. Forge empires. Wage wars. Watch as your choices ripple through a living simulation where every action shifts the cosmic balance &mdash; and the clock is always ticking toward the end of everything.</p>
</section>

<!-- AFTER -->
<section class="reveal">
  <div class="section-tag">II &middot; The Working</div>
  <h2>You whisper. <em>They choose.</em></h2>
  <p class="lead">Awaken as a young god in a world that has forgotten what gods are. You will not move them; you will move what they see, what they dream, what falls in their path. Civilizations will rise and fall around the few mortals you watch most closely. Every thread you pull sends a tremor through the tapestry &mdash; and somewhere ahead, an age is ending.</p>
</section>
```

### 4. Atmosphere quote (line 551) — keep as-is. It already passes.

### 5. Four Promises section (lines 555–582) — renumber + rewrite all four cards

```html
<!-- BEFORE: section opening -->
<section class="reveal">
  <div class="section-tag">What awaits</div>
  <h2>A world that <em>lives</em></h2>
  <p class="lead">Threadbearer is not a game with a world attached. It is a world with a game discovered inside it.</p>

<!-- AFTER: section opening -->
<section class="reveal">
  <div class="section-tag">III &middot; Four Promises</div>
  <h2>What we promise the <em>thread you pull.</em></h2>
  <p class="lead">Threadbearer is not a game with a world attached. It is a world with a game discovered inside it.</p>
```

Replace the four `.promise` blocks with:

```html
<div class="promise reveal">
  <span class="p-icon">&#x2726;</span>
  <h3>Your world is yours alone</h3>
  <p>The same seed produces the same world; your choices produce a different age. No two reigns are the same myth twice. Share a world with a friend and watch your stories diverge from the same dawn.</p>
</div>
<div class="promise reveal">
  <span class="p-icon">&#x2737;</span>
  <h3>Failure is a turn, not a loss</h3>
  <p>A failed gambit deepens the story rather than ending it. A mortal who falls short of greatness becomes a cautionary saga. A war you lose redraws the map and the next age inherits the scars.</p>
</div>
<div class="promise reveal">
  <span class="p-icon">&#x2735;</span>
  <h3>Stories, not spreadsheets</h3>
  <p>You will never see a stat block. A merchant is not <em>Gold: 7</em> &mdash; she is a shrewd trader whose ambition outpaces her caution. The world speaks in prose. You read stories, not data.</p>
</div>
<div class="promise reveal">
  <span class="p-icon">&#x2739;</span>
  <h3>Every age must end</h3>
  <p>The world frays as your reign deepens. Resources wither. Old debts come due. Armies converge on places they have always converged. You do not race a clock &mdash; you choose what becomes of the world before its ending becomes your own.</p>
</div>
```

### 6. Pillar 1 — Divine Power (lines 584–596)

Renumber tag, replace First/retinue, kill numeric stats.

```html
<!-- BEFORE -->
<div class="section-tag">Divine Power</div>
<h3>Shape the world through <em>will alone</em></h3>
<p>You don't move units or click buttons. You are a god. Dream prophecies into mortal minds. Inspire heroes. Curse the land. Forge artifacts of terrible power. Shift the cosmic balance between Life and Entropy, Order and Chaos.</p>
<p>Your influence flows through the agents you've chosen &mdash; mortals threaded to your will. Your First, the hero whose journey defines your reign. Your retinue, the faithful who carry your purpose into the world.</p>
<div class="pillar-detail">43 divine actions across four narrative layers: Land, Soul, People, and Ruins. Eight intervention types from subtle dreams to devastating afflictions.</div>

<!-- AFTER -->
<div class="section-tag">IV &middot; Your Hand</div>
<h3>You do not move units. <em>You send a dream.</em></h3>
<p>You are a god. You dream prophecies into the heads of sleeping kings. You inspire a coward to draw his sword. You curse a harvest. You set a single word into the mouth of a wandering scholar and watch what he builds with it. You shift the cosmic balance between Life and Entropy, Order and Chaos &mdash; not by command, but by where you place your weight.</p>
<p>Your will reaches the world through the few mortals you watch most closely &mdash; the one whose story you are most invested in, and the smaller circle of those drawn into their orbit. You whisper. They choose. Sometimes they hear you. Sometimes they hear something else.</p>
<div class="pillar-detail">Whispers, dreams, omens, blessings, curses, visions, calls and visitations &mdash; every divine touch arrives as something a mortal can refuse, misread, or carry too far.</div>
```

### 7. Pillar 2 — Living World (lines 598–610)

Renumber tag; trim "simulation produces it".

```html
<!-- BEFORE -->
<div class="section-tag">A Living World</div>
<h3>Civilizations that <em>grow, trade, and fall</em></h3>
<p>... Not because we scripted it, but because the simulation produces it.</p>
<div class="pillar-detail">Dynamic prosperity, trade routes with decay, economic sublocations (mines, markets, harbors), faction-driven guilds, and settlement promotion from hamlet to metropolis.</div>

<!-- AFTER -->
<div class="section-tag">V &middot; The Weather</div>
<h3>Civilizations that <em>grow, trade, and fall.</em></h3>
<p>Settlements rise from hamlets to cities. Markets open. Trade routes thread between capitals. Guilds form, compete, and scheme. Prosperity flows where commerce thrives &mdash; and collapses where war arrives.</p>
<p>Every settlement has character. A mining town in the mountains feels different from a port city on the coast &mdash; not because someone wrote each one, but because the world remembers what kind of place it is.</p>
<div class="pillar-detail">Markets and mines, harbors and shrines, ruined keeps and golden capitals. Settlements that climb, settlements that fall, and the trade roads that thread them together.</div>
```

### 8. Sphere strip (lines 612–622) — **add 4 Foundation spheres**

Currently shows 8 Creation spheres (Life, Force, Mind, Spirit, Time, Entropy, Matter, Energy). Add Chaos, Order, Light, Darkness. Total 12. Group visually if possible (4 Foundations on top, 8 Creation below) — but if that requires CSS work beyond the existing `.sphere-strip` flex layout, just append the 4 new cells after Energy and let it wrap to a second row.

Image assets to verify exist: `/backgrounds/court/chaos.png`, `/backgrounds/court/order.png`, `/backgrounds/court/light.png`, `/backgrounds/court/darkness.png`. If any are missing, fall back to the existing court images of nearest-meaning sphere and flag in the issue comment so the user can commission art.

```html
<!-- ADD after the existing 8 cells, before </div> on line 622 -->
<div class="sphere-cell"><img src="/backgrounds/court/chaos.png" alt="Chaos sphere" loading="lazy"><span class="sphere-name">Chaos</span></div>
<div class="sphere-cell"><img src="/backgrounds/court/order.png" alt="Order sphere" loading="lazy"><span class="sphere-name">Order</span></div>
<div class="sphere-cell"><img src="/backgrounds/court/light.png" alt="Light sphere" loading="lazy"><span class="sphere-name">Light</span></div>
<div class="sphere-cell"><img src="/backgrounds/court/darkness.png" alt="Darkness sphere" loading="lazy"><span class="sphere-name">Darkness</span></div>
```

### 9. Pillar 3 — War & Ruin (lines 624–636)

Renumber tag; copy is already strong. Light edit.

```html
<!-- BEFORE -->
<div class="section-tag">War & Ruin</div>

<!-- AFTER -->
<div class="section-tag">VI &middot; War &amp; Ruin</div>
```

Replace `.pillar-detail` (line 634):

```html
<!-- BEFORE -->
<div class="pillar-detail">Faction-driven warfare, siege mechanics, location destruction and demotion, refugee generation, monster encounters scaled by province danger, and divine intervention in battle.</div>

<!-- AFTER -->
<div class="pillar-detail">Sieges that grind. Cities that fall and become ruins for the next age to plunder. Rival gods who field armies of their own. Old monsters who remember when the borderlands were theirs.</div>
```

### 10. Pillar 4 — Mortal Lives (lines 638–650)

Renumber tag; strip "First", "axiological profiles", "doom clock", "19 narrative archetypes".

```html
<!-- BEFORE -->
<div class="section-tag">Mortal Lives</div>
<h3>Guide heroes through <em>their own stories</em></h3>
<p>Every mortal has values, ambitions, and a cooperation strategy shaped by their experiences. They don't follow orders &mdash; they have their own axiological profiles that determine how they respond to your divine influence.</p>
<p>Meet your First: the mortal whose journey defines your reign. Witness their origin through dilemmas you choose. Watch them grow from uncertain wanderer to legendary champion &mdash; or tragic cautionary tale.</p>
<div class="pillar-detail">19 narrative archetypes, axiological motivation engine, hero's journey arcs tied to the doom clock, familiarity-gated revelation, and prose-driven character sheets that unfold as you learn about each mortal.</div>

<!-- AFTER -->
<div class="section-tag">VII &middot; Mortal Lives</div>
<h3>The one you <em>watch most closely.</em></h3>
<p>Every mortal carries values, ambitions, and a way of refusing the things they were not raised to want. They do not follow orders. They listen, sometimes, to the small voice between their thoughts &mdash; and decide what to do with what they heard.</p>
<p>One of them is your particular concern. Their origin unfolds through choices you only half-make for them. You watch them become an oathkeeper, or a wanderer, or a schemer, or a folk hero. You watch them become a cautionary tale. You read the page that turns next.</p>
<div class="pillar-detail">Seekers and oathkeepers, schemers and wanderers, doomed innocents and reluctant kings. A handful of shapes a life can take, all of them yours to witness as the page turns.</div>
```

### 11. Atmosphere art quote (line 655) — fix factual error + reframe

Currently says "Nine spheres of creation. Nine reaches of mortal endeavor. One clock counting down to the end." This is wrong (12 spheres, not 9), uses numeric stats, and uses the clock metaphor.

```html
<!-- BEFORE -->
<div class="art-quote">"Nine spheres of creation. Nine reaches of mortal endeavor. One clock counting down to the end."</div>

<!-- AFTER -->
<div class="art-quote">"Twelve cosmic powers. Nine ways a mortal can reach. One world, fraying toward an ending only you can shape."</div>
```

### 12. Under the Hood section (lines 658–690) — **the worst offender**

The whole section is engineer-facing. Rewrite the section title and lead, and replace the six feature cards with player-facing equivalents that say *what the player experiences*, not what the engine does.

```html
<!-- BEFORE -->
<section class="reveal">
  <div class="section-tag">Under the Hood</div>
  <h2>A simulation with <em>real depth</em></h2>
  <p class="lead">Threadbearer's world is built on interconnected systems that produce emergent behavior. Nothing is scripted. Everything is deterministic.</p>
  ... 6 feature cards ...
</section>

<!-- AFTER -->
<section class="reveal">
  <div class="section-tag">VIII &middot; The Cycle</div>
  <h2>Every age <em>turns.</em></h2>
  <p class="lead">A reign is not a campaign. It is a season in the world's long memory.</p>

  <div class="features">
    <div class="feature reveal">
      <h4>A world you can re-enter</h4>
      <p>Share a world with a friend and play the same dawn. Your choices write a different myth from the same starting page; their choices write theirs. The same world. Two reigns. Two endings.</p>
    </div>
    <div class="feature reveal">
      <h4>Everything is connected</h4>
      <p>An assassination redraws a trade route. A new heresy reshapes an army. A drought wakes an old monster. Pull a thread and the whole tapestry shifts &mdash; you find out where the ripples end only by following them.</p>
    </div>
    <div class="feature reveal">
      <h4>A world made by weather</h4>
      <p>Mountains form ranges. Rivers flow downhill. Deserts gather behind rain shadows. Coasts curl around drowned valleys. The land is not decoration; it shapes what people grow, what they fight over, and where the old powers sleep.</p>
    </div>
    <div class="feature reveal">
      <h4>Encounters with their own weight</h4>
      <p>Each meeting carries its own weather &mdash; a culture, a history, a way of going wrong. The same scene plays differently in a city, a shrine, a borderland, a ruin. Outcomes ripple outward.</p>
    </div>
    <div class="feature reveal">
      <h4>Factions that act on their own</h4>
      <p>Guilds, cults and orders form, recruit, scheme, and turn on each other without your permission. Some will hate you and never know why. Some will pray to you and never reach you. They are playing their own game.</p>
    </div>
    <div class="feature reveal">
      <h4>The shape of an age</h4>
      <p>Each age fails its own way &mdash; a breach, a convergence, a slow failing, a sundering. The world feels different as the ending nears, and the ending it earns becomes the next age's foundation.</p>
    </div>
  </div>
</section>
```

### 13. Gallery atmosphere quote (line 695) — keep as-is. "What kind of god will you be?" passes.

### 14. Closing (lines 698–703) — rewrite as bookend to the Premise; abstract references

```html
<!-- BEFORE -->
<div class="closing reveal">
  <h2>The world is waiting.<br>It doesn't know your name <em>yet.</em></h2>
  <p>Threadbearer is a god-game for people who love emergent stories, deep simulations, and worlds that feel alive. It's inspired by Crusader Kings, Dwarf Fortress, and the feeling of reading a fantasy epic where you control the divine hand.</p>
  <a href="/?view=game" class="hero-cta">Play Now</a>
</div>

<!-- AFTER -->
<div class="closing reveal">
  <div class="section-tag" style="margin-bottom: 1rem;">XII &middot; The Tapestry Waits</div>
  <h2>Pick a thread. <em>Pull.</em></h2>
  <p style="font-style: italic; color: var(--gold-pale);">Somewhere, a scholar is rereading a word that should not exist.<br>Somewhere, a swordbearer is waking to a morning she will not survive.<br>Somewhere, the wind is changing direction for the first time in an age.</p>
  <p>Threadbearer is for readers who love living casts who carry their own will into your plans, simulations deep enough to surprise their own makers, prose as the primary interface, and epics where the gods stand at the periphery and history is half-remembered.</p>
  <a href="/?view=game" class="hero-cta">Enter the World</a>
</div>
```

(The four "for readers who love…" clauses are the abstracted versions of Crusader Kings / Dwarf Fortress / Disco Elysium / Malazan respectively. Same intent, no titles named.)

### 15. Footer (line 706)

```html
<!-- BEFORE -->
Threadbearer &mdash; The Fantasy World Simulator &middot; A systemic god-game of emergent myth &middot; In development

<!-- AFTER -->
Threadbearer &mdash; The Fantasy World Simulator &middot; A turn-based god-game of living worlds &middot; In development
```

## Numbering recap

After this pass the sections read: I Premise · II The Working · III Four Promises · IV Your Hand · V The Weather · (sphere strip, no number) · VI War & Ruin · VII Mortal Lives · (atmosphere quote, no number) · VIII The Cycle · (gallery, no number) · XII The Tapestry Waits.

Gaps between VIII and XII are intentional — leaves room to drop in additional pillar sections later (e.g. a Twelve Spheres deep-dive or a Portrait Gallery) without renumbering. If asked, just say "the chapter numbers don't have to be contiguous, the page is meant to read like an excerpt from a longer work."

## Verification checklist (CC must run before pushing)

- [ ] `grep -in 'first\|retinue\|axiolog\|deterministic\|scripted\|simulation\|template\|subtype\|emergent myth\|doom clock\|seeded\|graph-native' public/the-game.html` returns no marketing-copy hits (matches inside HTML comments labelled `BEFORE` are fine if CC kept old copy in comments — recommend deleting `BEFORE` blocks entirely).
- [ ] `grep -E '\b(43|Eight|19|64|Seven|Nine)\b' public/the-game.html` returns no numeric-stat hits in the visible copy. (The art-quote uses "Twelve" and "Nine" deliberately — those are evocative, not stats. Numbers spelled out are OK; bare digit-stats are not.)
- [ ] All 12 spheres render in the sphere strip (test at `npm run dev` then open `/the-game.html`).
- [ ] No reference to "Crusader Kings", "Dwarf Fortress", "Disco Elysium", or "Malazan" in the rendered text.
- [ ] `npx vite build` succeeds — `public/` is copied as-is by Vite, so this is just a sanity check.
- [ ] Visual check at 1920×1080: hero, Premise (new), and Closing all sit visually balanced. Take a screenshot and attach to the Linear comment.
- [ ] Vercel preview deploy URL works and renders all sections including the new Premise insert.

## Known image-asset risk

Sphere strip section may need 4 new images (`chaos.png`, `order.png`, `light.png`, `darkness.png`) under `/public/backgrounds/court/`. CC should check if these exist; if not, use `spirit.png` / `entropy.png` / nearest-meaning fallbacks and add a note in the issue comment so the user can commission proper Foundation-sphere art later.

## Out of scope (deferrals)

- **Spheres wheel interactive component** (the radial diagram from the design-test) — visually impressive but a real build. Defer to a follow-up issue if user wants it; this pass is copy + 4 sphere cells.
- **Portrait gallery section** (12 archetype portraits from the design-test, Section X) — same. Defer to follow-up.
- **Migrating the entire design-test layout into `public/`** — out of scope. The 12 MB React bundle is unsuitable for a marketing page; current plain HTML is the right substrate.
- Any change to `/?view=game` route, game CSS, or anything outside `public/the-game.html`.

## NFP compliance

| Priority | Status |
|---|---|
| 1 Tunability | N/A — static marketing page |
| 2 Inspectability | N/A |
| 3 Determinism | N/A |
| 4 Fail-soft | PASS — image fallback strategy specified for missing sphere art |
| 5 Narrative over mechanical | PASS — entire purpose of the rule pass |
| 6 Additive over destructive | PASS with note — Pillar/feature copy is rewritten, not added; this is intentional. The structural changes (new Premise section, new Closing bookend) are additive |
| 7 Performance budget | PASS — page loses ~200 words of dev jargon, gains ~120 of evocative copy + 4 small sphere images |

## Codex review

`yes` — copy is high-visibility public marketing; second-pair-of-eyes catches voice regressions and broken anchors before push.
