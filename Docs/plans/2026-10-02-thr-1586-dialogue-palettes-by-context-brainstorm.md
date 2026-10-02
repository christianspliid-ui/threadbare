> **title:** `Dialogue palettes by context — brainstorm companion — THR-1586`
> **linear_issue:** THR-1586
> **companion_to:** `Docs/plans/2026-10-02-thr-1586-dialogue-palettes-by-context.md`
> **created:** 2026-10-02

# Dialogue palettes by context — brainstorm companion

The alternatives considered, the tensions weighed, and the Vision premises the plan leans on. The plan doc is the contract; this is why it looks the way it does.

## The signal Christian gave

On 2026-09-25 he reacted to the compulsion-tier Premonition window, unprompted: *"i love the colorfulness of the dialogue window."* What he saw was colour that *means* something: the wine-plum ground says "the god is forcing this", and each option's sphere tint says which essence pays. The second message, *"different color dialogue boxes for different contexts and dialogue types"*, generalises the first. The taste signal is not "more colour". It is **colour that carries meaning**. Every decision below is tested against that.

## Alternatives considered

### Taxonomy

- **One palette per component.** Rejected: there are ~25 `Modal` call sites, so colour would become noise. That is the failure the ticket's own recommendation names ("if every surface is coloured, colour stops telling the player what kind of moment they are in").
- **Palette by importance** (bigger moment, louder colour). Rejected: Law 26 already rejects "felt importance" as the selector for the family. Importance also drifts per author, while context is checkable: what is the player doing?
- **Palette by sphere of the moment** (a Mind story beat goes blue). Tempting, because spheres are the game's colour language. Rejected for grounds: a full sphere-coloured ground at twelve hues would collide with the sphere tint on options and the sphere marks on cards, and the player could no longer tell "this is a Mind moment" from "this option costs Mind". Sphere colour stays on the *options and marks*, where it means "what pays"; context colour goes on the *ground*, where it means "what kind of moment". Two channels, two meanings.
- **Chosen: the approved table.** It has five contexts, of which two exist already and one is neutral. That is small enough to learn, and each answers "what is the player doing?"

### Colour values

- **Story in gold or parchment.** Rejected: gold is already the god's attention (Law 31). A warm *non*-gold (terracotta-amber over firelit umber) keeps story mortal-scale and distinct from gain at a glance.
- **Gain in green** (gain = green under Law 31). Rejected: a receipt can report a failure, and a green ground under a failed act lies about the outcome. Polarity must stay with the outcome word and band. Gilt plus the one game gold says "the god acted / you received", which is polarity-free.
- **Elder in black-violet** (Darkness-adjacent). Rejected: it is too close to the Premonition's whisper violet, and it would read as a Darkness-sphere moment. Verdigris (old copper) is the agreed "old, uncanny" direction. It sits near Entropy's teal but at ground saturation, far from Entropy's mark colour.

### Mechanism

- **A wrapper component per context** (`<StoryDialog>`). Rejected: to change the panel's ground and edge it would have to fork or reach inside `Modal`. That breaks Laws 26 and 27.
- **Context classes applied by each surface** to its own content div, the Premonition's current pattern. Rejected: each surface would repaint over the neutral panel, giving two grounds stacked with the neutral border showing. It also scatters the decision across eight files.
- **Chosen: a `context` prop on `Modal` mapping to a class that sets local `--dlg-*` properties,** with today's values as `var()` fallbacks. Neutral modals stay byte-identical. The palette lives only in `index.css`, and the mapping lives in one registry file.

### The sphere tint

- **Keep it Premonition-only.** Safe but timid. Christian named exactly this as what he loved. The memory note from that day says to suggest it on choice surfaces and invite a veto.
- **Tint everything that has a sphere** (cards with no cost included). Rejected: a free card tinted by its sphere would claim "this costs Spirit" when nothing is paid. The tint must mean *what pays*, so the predicate is `sphere && essenceCost > 0`, the same one THR-1607's essence-row preview already uses.
- **Tint the price text too**, as the Premonition does. Rejected for cards: the price's colour carries affordability, and Law 31 keeps state off a category hue. Edge and wash only.

## Tensions

- **Law 32 vs. the loved surface.** The Premonition gradient Christian praised is already brighter than `--bg-surface`. Either the law bends for sanctioned variant sets or the colour goes quieter. Laws change jointly with him, so this is put to him as one question with a measured fallback. It is not assumed.
- **Gold budget (THR-799) on gain surfaces.** A gilt ground plus a gold accent plus a gold medallion ring could become gold soup. Mitigation: the ground is *dark* gilt (barely warm), the accent rides at rule and edge alphas, and the medallion ring stays the single bright gold.
- **State colours inside coloured dialogs.** Step dots, selected options and band accents must keep their meaning on every ground. The plan pins them to their state tokens, and only decoration takes the context hue.

## Vision premises leaned on

- **The player is a god reading the world.** The colour of a dialog is read before its words, so it should say what kind of moment this is.
- **Narrative over mechanical perfection (NFP #5).** The contexts are story categories (a beat, an elder intrusion, a gift landing), not system categories.
- **Restraint keeps meaning.** Reference surfaces stay neutral, so a coloured frame always signals a moment.

## Found in passing

- `--bg-base` is used twice and defined nowhere: the gold primary buttons on story beats render their label at 1.7:1 (Law 45).
- `JourneyVignetteModal` carries a second gold (`#ffd700`) and an off-token red. `EmergenceDilemmaModal` carries hex fallbacks that disagree with their tokens (a third gold).
- `MeetingEncounterModal` is unmounted on `main`; only a comment names it.

The first two are fixed by this plan, because they sit on the surfaces it re-skins. The third is recorded and left alone.
