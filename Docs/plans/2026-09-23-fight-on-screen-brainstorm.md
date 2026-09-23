> **title:** Brainstorm companion — the fight on screen (Physical Conflict plan doc 4)
> **companion_to:** `Docs/plans/2026-09-23-fight-on-screen.md`
> **created:** 2026-09-23

# Brainstorm companion — the fight on screen

**Route:** the closed Physical Conflict map (THR-1258). **Decision ticket:** THR-1272. Christian's eye matters most here; the whole doc is veto-invited.

## The clock's glyph
| Considered | Verdict |
|---|---|
| A numeral (3/4) | Forbidden (Law 13) |
| A progress bar (`ProgressBar`) | Allowed by the Law 13 amendment, but a continuous bar misreads a discrete clock as a meter. |
| A ring (`DoomClockDetail`) | Allowed, but it's the doom clock's identity, and borrowing it would conflate a monster's wounds with the world's doom. |
| **Pips (`StepDots` magnitude)** | **Chosen.** Discrete segments are what a clock is. The variant already exists (THR-718), so Law 15's "no third magnitude language" holds. |

## The clock's word
The word carries meaning the pips can't: *half-broken* tells a story, while "2 of 4 filled" tells arithmetic. Five words cover the states and read naturally in a chronicle line and on the sidebar.

## Where the card sits in the veil
A block under `ContextStrip`, only on fight steps. A new modal or a side panel would break the one-chrome law (Law 37). The veil is fixed-height, so the executor shrinks the art before the hand ever scrolls (Law 33).

## Temper visibility
Showing the temper word from the start would give the player the fight's hidden turn (the Choir is skittish) before anyone learned it. **Chosen:** the temper stays hidden until someone has fought the monster or a hunt tracked it. That makes tracking (plan doc 6) worth doing, and makes a monster's first fight a discovery.

## Moments (a deviation from THR-1272)
THR-1272 imagined MomentCards for followed mortals' marked fights. Moments are undertaking-scoped by type (`UndertakingMomentClass`), and a threaded mortal's fight already opens the veil through the attention pipeline. A second attention path for fights would compete with it. Fight moments move to the v2 layer.

## Two defects found along the way
- The lair sidebar prints a raw node id (Law 14/21).
- `WorldPulse` counts monsters as mortals.

Both are fixed in F1: small and visible, and they get the monster onto the screen by name before the richer surfaces land.

## Vision premises touched
- A prose-first, number-free UI (taste profile).
- The god is not the protagonist: the header is about the mortal's opponent.
- One chrome.

## Revisions during review (2026-09-23, intent-judge run 1)

**The attention premise was wrong.** Draft 1 said a threaded mortal's fight "already surfaces". In fact watched mortals drop a tier, and shaping surfaces only through an attended tug. `fight.lair.confront` is now pinned at `story_beat`. That reproduces what draft 1 assumed for The First and the retinue, and it states plainly what a watched mortal's fight shows. Moments stay deferred (route b), now with that description attached.

**Chips inside the four categories.** Draft 1 invented six chip "categories". UL's SCAR entry forbids a fifth category without a design decision, and none was wanted, so every fight chip is a *kind* within SCAR, BOND or BOON:
- wearing a beast down is a BOON with magnitude;
- losing face is a BOND loss.

Chips read `fightState`, never traces, because traces can be off.

**The card as a sentence.** A `dread: fair · might: steep` strip violates Law 16. The phrase tables keep the card words as words ("fearsome to face, dangerous to fight"), each carrying its concept tooltip.
