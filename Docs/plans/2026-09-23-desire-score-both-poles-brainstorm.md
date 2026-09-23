> **title:** Brainstorm companion — a scene draws both poles of the value it is about (THR-1525)
> **companion_to:** `Docs/plans/2026-09-23-desire-score-both-poles.md`
> **created:** 2026-09-23

# Brainstorm companion — THR-1525

## The question as it arrived

THR-1524 found that A Bargain at the Crossroads was starved: the board offered it to Archivists, who refuse the bargain, and floored the Heretics who would accept it. The ticket framed a fork between two readings of the same code:

1. **Engine reading.** The score was always meant to draw both poles, as its docstring says, and the code drifted.
2. **Spec reading.** The lean is the design ("a Protector is drawn to a mercy scene"). The authoring guide should stop telling writers to reuse the selection axis for the fork.
3. Both, staged.

## What the design session found (the evidence that decided it)

- **There was no drift.** `computeDesireScore` has had one commit, 2026-03-30. The code was signed from birth, and the docstring claimed absolute from birth. Neither reading was ever the working design. The question is which one the *content* was written for.
- **The content was written for the absolute reading.** `ENCOUNTER_TYPE_MOTIVATIONS` (~308 template uses) only makes sense read as "the values this kind of scene is about". Read as signed, `steal` → `honesty_cunning` makes theft most attractive to the honest, `duel` → `mercy_ruthlessness` sends the merciful to duels, and `explore`/`assist`/`hire`/`lead` → `loyalty_ambition` prefer the Sworn over the Renegade. Hand-authored sets and undertakings follow the same habit: "The Traitor's Approach" names `loyalty_ambition`, and `strategic_establish_spy_network` names `honesty_cunning`.
- **The signed reading has a systematic political bias.** The positive pole of every `ValuePair` is the virtue. So the signed reading is not neutral between two sides. It favours the virtuous in every value-tagged scene and starves the flaw side, which is about half the population on any axis.
- **Some later work reasoned inside the signed reading.** The THR-1349 docstring ("mortals genuinely should not pursue what they do not value") and its test assumed an opposite-pole mortal floors. That reasoning protected a real distinction, between silence (an empty set) and a stated opinion. It stays valid under the new reading: silence stays neutral, and indifference or a pinned opposite pole still floors.

## Alternatives considered

| Option | Why not chosen |
|---|---|
| **Spec reading (keep signed; amend step 6; add a lint)** | It fixes forks only, and only for future authors. Every existing template, and the type table, would stay backwards, and the villain-starvation bias would persist. It would also mean re-authoring ~800 motivation sets to express what they already say. |
| **Absolute with no pin** | This is the simplest option, but it removes the one thing the signed reading could express: "this scene is for the merciful". The ruling kept that expressiveness as an opt-in. |
| **Signed pole markers in the `motivations` array itself** (e.g. `'+mercy_ruthlessness'`) | This widens `ValuePair`, which is read by lint tests, the undertaking contract and ~800 literals. A separate optional `motivationPoles` map is additive (NFP #6) and leaves every existing literal valid. |
| **Separate `selectionAxes` vs `forkAxis` fields** | This addresses the fork symptom without the corpus-wide inversion, and adds a second field authors would need to learn. The absolute reading makes the fork axis safe to name in `motivations` with no new field. |
| **Weight both poles but asymmetrically** (e.g. flaw pole at 0.5×) | There is no design reason for it. It would preserve a smaller version of the bias, without a ruling to justify it. |

## Tensions carried forward

- **The world's scene mix shifts on the first tick.** Flaw-leaning mortals start receiving value-tagged scenes they almost never saw. This is intended, and the selection census measures it before merge. It may surface second-order effects, such as more theft and more ruthless duels. That is the living world doing what its content describes, and a tuning pass can follow if it reads wrong in play.
- **Indifferent mortals.** Under the absolute reading, a mortal near zero on a scene's axes is the one who floors. "Scenes find people who care" is the intended read, and it matches the empty-set-is-neutral rule for templates.
- **Divine receipt numbers move.** The overlay delta now measures intensified conviction in either direction. The receipt keeps only positive mass, as before.

## Vision premises touched

The living world generates stories for every kind of mortal, and the god's most interesting subjects are not only the virtuous. The signed reading worked against that premise, and the ruled reading restores it. No Vision text changes.
