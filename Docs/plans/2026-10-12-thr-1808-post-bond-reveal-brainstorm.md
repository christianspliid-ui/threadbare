# Brainstorm companion — The god's screen fills one gift at a time (THR-1808)

> Companion to [`2026-10-12-thr-1808-post-bond-reveal.md`](2026-10-12-thr-1808-post-bond-reveal.md). Written alongside the plan by the design lane (run 2026-10-12c), under delegation.

## The problem in one line

Before the bond the player has a storybook; one click later they have about thirty panels and no sentence telling them what to do. THR-1648 moved the cliff from Ascend to the bond — it did not remove it.

## Paths considered

### A. Stage the reveal across the opening gifts (chosen)

Each opening gift (spine beats 1–4) brings the panel it is about. Doom and Omen arrive with the first beat or event that names them. One standing direction line points at The First until the player has seen her first main-map chapter through.

- **Costs:** one data table, one derived predicate per panel, one small UI-local "first seen" memory; every dev URL must stay full-HUD.
- **Buys:** the panel arrives *in a sentence the player just read*, which is the taste profile's teaching surface (IPK: "mechanics are taught by highlighting words inside prose, not by separate tutorials"). The reveal order rides a pacing that already exists and is already "one player act apart".

### B. A guided tutorial (coach marks over each panel)

- **Costs:** a second vocabulary and an interrupt to explain interrupts; contradicts the taste profile's IPK line and the THR-1716 plan's rejection of "a modal tutorial".
- **Buys:** certainty that every panel is pointed at once.
- **Rejected.**

### C. A "simple mode" toggle that hides advanced panels until the player turns them on

- **Costs:** puts the burden on the player who doesn't yet know what they need; a settings decision is not direction.
- **Buys:** veterans get the full HUD at once.
- **Rejected** as the primary fix. The plan keeps a quieter version of it: every hidden panel is still reachable — the reveal is a default, not a lock (see "Show every panel").

### D. Reveal by time (panel N appears after N minutes)

- **Costs:** a panel appears for no reason the player can see — PC-4 ("the game acts for the player without saying so").
- **Buys:** simple to build.
- **Rejected.** The idle fallback that already exists on the gifts covers the "player never acts" case without a second clock.

### E. Do nothing new; rely on THR-1814's "empty sections stay hidden"

- **Costs:** measured: most of the thirty items are not empty at the bond (essence bars, World Pulse counts, Reaches all have values), so emptiness hides very little.
- **Rejected** as sufficient; kept as a complementary rule.

## Trade-off card

Path A costs a per-panel predicate table and a seen-memory, and asks every panel's mount site to read one function. It buys a first ten minutes in which every new panel arrives named by the story, matching the Vision's "the game shows its hand slowly" (03-design-tensions § 4). Path B costs the taste profile's teaching premise and buys only certainty of exposure. Path C hands the problem to the player. Vision premises that favour A: IPK as the teaching surface (taste profile), "one complex story at a time … the feeling of a chapter, not the feeling of a spreadsheet" (00-north-star), "the persistent HUD is a budget" (UI Law 53). Open question A must answer: what the veteran sees — answered by the reveal being keyed to *this world's* progress, the pre-bonded dev routes staying full-HUD, and "Show every panel" in Settings.

## Tensions surfaced

- **Mechanical legibility vs. narrative mystery** (03-design-tensions § 4). Hiding panels pulls toward mystery; the direction line and the naming gifts pull back toward legibility. The counter-pull is present.
- **The screen frame redesign** ([The screen frame](https://linear.app/threadbare/issue/THR-1828)). It moves panels into new rails. The plan keys the reveal to *surface ids*, not positions, so a panel that moves keeps its row in the table. The plan does not build on the frame decision, which is still inside its veto window.
- **Warm starts** ([THR-1787](https://linear.app/threadbare/issue/THR-1787)) settle three no-choice gifts before the first warm tick. A warm start therefore arrives with those panels already revealed, which is correct: the reveal reads gift state, not elapsed time.

## Vision premises this plan leans on

- Taste profile — *IPK (in-prose keywords) as the teaching surface*: the gift's own prose names the panel it brings.
- Taste profile — *Real time, halting for every moment*: nothing in the reveal stops the clock; the direction line is a caption, not an interrupt.
- 00-north-star — *one complex story at a time*: until the first chapter is seen through, the screen is about The First.
- UI Law 53 — *Persistent HUD is a budget, not a shelf*.
