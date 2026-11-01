> **title:** How people read UI panels — a screenshot-checkable rulebook for panel legibility — THR-2116
> **linear_issue:** THR-2116
> **author:** Claude Code (wayfinder research ticket on the THR-2114 legibility map, 2026-11-01)
> **created:** 2026-11-01
> Plan-size-exempt: a research audit — one numbered rule per finding with its source and a screenshot test; no build plan.

# How people read UI panels — THR-2116

*Eighteen rules, each tied to a published source and a test a reviewer can run on one 1920×1080 or 2560×1440 screenshot. The rules are inputs for the THR-2114 panel reviews, not new law.*

## What this is, and what it is not

The question: what established UX findings say about how people read a panel, and which of them hold for a strategy god-game at 1440p. Sources were read on 2026-11-01 (URLs per rule). Quotes are under fifteen words; everything else is paraphrase.

**Settled, not reopened.** Every rule below is written to sit inside these:

- **Faces and the label rule** (THR-1833 / THR-1879, `Docs/design-system/typography.md`): three faces, one role each; small labels are Alegreya Sans 700, sentence case, tertiary colour, 16 px floor. Only *which sizes a panel uses* and *how hierarchy is built* are in scope here.
- **Words, never numerals** (Law 13, Part IV of `Docs/design-system/laws.md`): number rules (rule 16) apply only where numerals already legitimately appear — the essence pool balance in persistent chrome, the designer view, debug surfaces.
- **Grow before scroll** (Law 57, Part XV) and **one viewport** (Law 33).
- **One Inspector + Stage + lenses**, no fourth container type. Rules about grouping (rules 8–9) talk about whitespace and boxes *inside* those containers, never about new ones.

**How to run a check.** Take the screenshot at 1920×1080 (the floor) unless the rule says otherwise. Where a rule asks to measure pixels, use the image-zoom tool (`imgzoom.py zoom … --pixel`) rather than eyeballing.

## The rules

### A. Where the eye goes first

**1. Each panel answers its own question in its first line.**
- **Rule.** The top-left of a panel (title plus first line under it) states the subject and its most important current state; detail follows in falling order of importance.
- **Source.** NN/g, *Inverted Pyramid* — lead with the conclusion, because readers "can stop reading at any point" ([nngroup.com/articles/inverted-pyramid](https://www.nngroup.com/articles/inverted-pyramid/)); NN/g, *Progressive Disclosure* — the initial view holds what users need most ([nngroup.com/articles/progressive-disclosure](https://www.nngroup.com/articles/progressive-disclosure/)).
- **Applies when.** Any Inspector page, Stage panel, lens legend or dialog the player opens to find something out.
- **Screenshot test.** Cover everything below the panel's first ~20% of height. From what is left, can a reviewer say *who or what* this is and *what is going on with it now* (wounded, at war, waiting on the player)? If the state only appears lower down, fail.
- **Constraints.** Fits Law 57: growing a panel never moves the answer, it only adds detail under it.

**2. Section headings are the scan path (layer-cake).**
- **Rule.** A panel with more than one section gives each a heading that is visibly distinct from its rows and that names the content, so a player can read headings only and pick the section they need.
- **Source.** NN/g, *Text Scanning Patterns: Eyetracking Evidence* — the layer-cake pattern (fixate headings, dive into one) is the most effective scanning mode short of full reading, and only appears when headings are meaningful and distinct ([nngroup.com/articles/text-scanning-patterns-eyetracking](https://www.nngroup.com/articles/text-scanning-patterns-eyetracking/)).
- **Applies when.** Panels with two or more sections (Inspector pages, character sheet, Codex entries). Not single-list panels.
- **Screenshot test.** Read only the headings, top to bottom. Does each tell you what is under it (not "Details", "Other", "Info")? Is each heading distinguishable from the row below it at a glance — weight, colour or spacing above? If two headings could be swapped without anyone noticing, fail.
- **Constraints.** The label rule already fixes heading *style* (Alegreya Sans 700, tertiary, sentence case) for small section labels; this rule adds only "names its content" and "has more space above than below" (see rule 8).

**3. Rows lead with the word that matters (first two words).**
- **Rule.** Every list row, chip label, button and heading front-loads its distinguishing word in the first two words (about 11 characters).
- **Source.** NN/g, *First 2 Words: A Signal for the Scanning Eye* — users scanning lists often take in only about the first two words; 85% predicted the best link's destination from its first 11 characters ([nngroup.com/articles/first-2-words-a-signal-for-scanning](https://www.nngroup.com/articles/first-2-words-a-signal-for-scanning/)).
- **Applies when.** Lists, rows, chip text, choice buttons, headings. Not story prose.
- **Screenshot test.** Mentally crop every row to its first two words. Can the rows still be told apart? Rows starting with the same filler ("The…", "A…", "Your…", "Gain…") across a list fail.
- **Constraints.** Compatible with Law 42 (plain register) and Law 16 (no key:value strips): the fix is reordering the sentence, not adding a label.

**4. What the player hunts for looks the same everywhere (spotted pattern).**
- **Rule.** Things a player looks for by type — names of people and places, states, dangers — wear one consistent, distinct treatment, so the eye can jump between them without reading the text around them.
- **Source.** NN/g, *Text Scanning Patterns* — the spotted pattern: readers skip to words that stand out (links, bold, numbers) or match the kind of thing they seek ([link above](https://www.nngroup.com/articles/text-scanning-patterns-eyetracking/)); NN/g, *Similarity Principle* — same look implies same meaning, and unrelated look-alikes mislead ([nngroup.com/articles/gestalt-similarity](https://www.nngroup.com/articles/gestalt-similarity/)).
- **Applies when.** Any panel with prose or mixed rows containing names.
- **Screenshot test.** Find every named entity on the panel. Do they all share one treatment (weight, colour, underline)? Does anything *not* clickable share that treatment? Either inconsistency fails.
- **Constraints.** This is Law 10 and Law 21 seen from the reader's side; typography.md already sets names inside prose to Alegreya 500/700. No new token needed.

**5. Nothing the player must notice sits at the far end of a long line or deep in dense prose (F-pattern defence).**
- **Rule.** Critical state is never placed only in the right third of a wide line or in the middle of a paragraph block; it gets its own line, its own chip, or the start of a sentence.
- **Source.** NN/g, *F-Shaped Pattern of Reading on the Web* — on unformatted text, attention falls on line starts and the top; content to the right and lower down is missed, and users don't notice what they missed ([nngroup.com/articles/f-shaped-pattern-reading-web-content](https://www.nngroup.com/articles/f-shaped-pattern-reading-web-content/)).
- **Applies when.** Prose blocks, long rows, wide Stage panels at 2560 where lines get long. Weak for icon-heavy or sparse panels (see Confidence).
- **Screenshot test.** Draw a vertical line at two-thirds of the text block's width. Is any warning, cost, or state the player acts on found *only* to the right of it, or only mid-paragraph? Fail.
- **Constraints.** None; this is a placement rule.

**6. On a sparse screen, the action sits where the eye's path ends (Z / Gutenberg).**
- **Rule.** On a screen with little text and one main action (start screen, ceremony, a single-choice dialog), put the title top-left or top-centre and the primary action bottom-right or at the bottom of the reading path.
- **Source.** Steven Bradley, *Design Principles: Compositional Flow and Rhythm*, Smashing Magazine, 2015 ([smashingmagazine.com/2015/04/design-principles-compositional-flow-and-rhythm](https://www.smashingmagazine.com/2015/04/design-principles-compositional-flow-and-rhythm/)). Practitioner model, no eye-tracking study behind it — see Confidence.
- **Applies when.** Sparse screens only. Not data-dense panels.
- **Screenshot test.** Trace title → end of the bottom row. Is the primary action at or near that end, and is no competing control there?
- **Constraints.** Law 48 (arm, then fire) is unaffected; this rule only places the fire control.

### B. Labels and values

**7. One label axis per facts block; labels above, or right-aligned beside.**
- **Rule.** In a facts block (label + value pairs), either put every label above its value, or put labels in one column to the left, right-aligned so each sits tight against its value; never left-aligned labels with ragged gaps to their values.
- **Source.** Matteo Penzo, *Label Placement in Forms*, UXmatters, 2006 — labels above fields gave the fastest label-to-field eye movement (~50 ms); left labels that were right-aligned roughly halved fixations against left-aligned ones; bold labels above slowed reading slightly ([uxmatters.com/mt/archives/2006/07/label-placement-in-forms.php](https://www.uxmatters.com/mt/archives/2006/07/label-placement-in-forms.php)).
- **Applies when.** Inspector facts sections, sheet stat rows, tooltips with paired lines. Penzo tested input forms, not read-only facts — transfer is plausible, not tested (see Confidence).
- **Screenshot test.** Pick a facts block. Do all labels share one alignment edge? If labels are left of values, is the largest label-to-value gap more than about twice the smallest? Fail.
- **Constraints.** Law 16 bans key:value strips *bolted onto prose*; a facts section is one of the sanctioned section shapes (Law 58). The label style (700, tertiary) is settled; Penzo's "bold labels add a little cost" finding is noted, not acted on.

### C. Grouping

**8. Space inside a group is clearly smaller than space between groups.**
- **Rule.** Related items sit close; groups are separated by a visibly larger gap; a heading sits closer to its own content than to the section above it.
- **Source.** NN/g, *Proximity Principle in Visual Design* ([nngroup.com/articles/gestalt-proximity](https://www.nngroup.com/articles/gestalt-proximity/)). NN/g gives no ratio; "at least double" below is this audit's working threshold, not the source's.
- **Applies when.** Every panel.
- **Screenshot test.** Measure (pixels) the gap between rows inside a section and the gap between sections. Between-section gap less than about 2× the within-section gap: flag. Heading whose gap to the content below is equal to or larger than its gap to the content above: fail.
- **Constraints.** Fits Law 57 — when a panel grows, the extra height goes to content, not to inflating within-group gaps.

**9. A box is used only where whitespace cannot do the grouping.**
- **Rule.** Group with space first; add a border or tinted background only when the group mixes element types, or must be told apart from a neighbour that whitespace cannot separate. Avoid boxes inside boxes.
- **Source.** NN/g, *Common Region* — a boundary is a stronger grouping cue than proximity, but unneeded borders and backgrounds add clutter and processing cost ([nngroup.com/articles/common-region](https://www.nngroup.com/articles/common-region/)); NN/g, *Visual Hierarchy* — add containers only when spacing is not enough ([nngroup.com/articles/visual-hierarchy-ux-definition](https://www.nngroup.com/articles/visual-hierarchy-ux-definition/)).
- **Applies when.** Inside the Inspector, Stage and lens surfaces.
- **Screenshot test.** Count nesting depth of visible frames from the container edge inward. More than two (container → card) on one panel: flag. For each framed group, ask: would it still read as a group with the frame removed and its gap kept? If yes, the frame is decoration.
- **Constraints.** One Inspector + Stage + lenses is fixed; this rule is about frames *inside* them and never argues for a new container.

**10. Same job, same look; different job, different look.**
- **Rule.** Elements that do the same thing share one visual treatment across panels; elements that do different things never share one.
- **Source.** NN/g, *Similarity Principle* ([link above](https://www.nngroup.com/articles/gestalt-similarity/)).
- **Applies when.** Buttons, chips, links, state badges, across all panels.
- **Screenshot test.** Put two panels side by side. Is a clickable name styled the same in both? Is any non-clickable element styled like a clickable one?
- **Constraints.** Already law (10, 26, 27); listed so a reviewer has the perceptual reason and the check in one place.

### D. Type hierarchy

**11. A panel uses at most three type sizes.**
- **Rule.** One panel shows no more than three distinct font sizes — typically title, row text, label — with prose as the single permitted fourth where a panel carries story text.
- **Source.** NN/g, *Visual Hierarchy in UX* — use no more than three sizes, and keep few elements large ([link above](https://www.nngroup.com/articles/visual-hierarchy-ux-definition/)).
- **Applies when.** Every panel. The six-step scale is the game's palette; a panel picks from it.
- **Screenshot test.** Count distinct cap heights on the panel (zoom if needed). More than three (four with a prose block): fail.
- **Constraints.** The six steps and three faces stand; this limits how many steps *one panel* draws on.

**12. Two sizes used together on a panel are at least two steps apart — or differ in weight or colour too.**
- **Rule.** Adjacent steps of the scale (16/18, 18/20, 20/22 px at 1080p — ratios near 1.1) are too close to read as different levels on their own; when a panel pairs them, the smaller one must also change weight or colour, otherwise skip a step (ratio of about 1.2 or more).
- **Source.** Tim Brown, *More Meaningful Typography*, A List Apart, 2011 — a scale is one base and one ratio, chosen so steps are distinguishable ([alistapart.com/article/more-meaningful-typography](https://alistapart.com/article/more-meaningful-typography/)); NN/g *Visual Hierarchy* — hierarchy comes from contrast between elements, not size alone. The 1.2 figure is this audit's derivation from those, not a published threshold.
- **Applies when.** Any panel pairing two sizes in a parent–child relation (heading over rows, title over subtitle).
- **Screenshot test.** For each heading/row pair, note the two sizes. If they are adjacent steps *and* share weight and colour, fail.
- **Constraints.** Does not change the scale; it is a rule for choosing from it. The label rule (700 + tertiary at 16 px) already passes it against 18 px rows, by weight and colour.

**13. Build hierarchy with weight and colour before size.**
- **Rule.** Secondary text steps down in colour (secondary/tertiary tokens) and the important line steps up in weight before anyone reaches for a bigger size.
- **Source.** NN/g, *Visual Hierarchy in UX* — weight and contrast create emphasis; save bright, saturated colour for the important few ([link above](https://www.nngroup.com/articles/visual-hierarchy-ux-definition/)).
- **Applies when.** Dense panels where space is limited — the rails at 1920.
- **Screenshot test.** Find the second-most-important line on the panel. Is it set apart by weight or colour, or only by being larger? Size-only hierarchy across more than two levels: flag.
- **Constraints.** Colour carries meaning only through tokens and polarity (Laws 30–31); a hierarchy step uses the neutral text ramp, never a polarity colour.

**14. The blur test shows the intended first element, and nothing else, dominating.**
- **Rule.** When the panel is blurred, the element meant to be seen first is the strongest blob, and no secondary element (an illustration, a coloured chip) out-shouts it.
- **Source.** NN/g, *Visual Hierarchy in UX* — the squint or blur test exposes the real emphasis; at heavy blur an unintended dominant item showed up ([link above](https://www.nngroup.com/articles/visual-hierarchy-ux-definition/)).
- **Applies when.** Every panel; most useful on art-heavy Inspector pages and Stage panels.
- **Screenshot test.** Blur the panel crop at about 5 px and 20 px (`imgzoom.py enhance` or any image tool). At 5 px, can you still see the groups? At 20 px, is the strongest blob the panel's first answer (rule 1)? If it is decoration or a secondary chip, fail.
- **Constraints.** Laws 5 and 7 already demote in-card art to "small generic images"; this test catches when art still dominates.

### E. Text measure and numbers

**15. Prose lines run 50–75 characters; UI text is left-aligned and never justified.**
- **Rule.** Story prose sits between about 50 and 75 characters per line, never over 80; no player text is justified, and multi-line text is not centred.
- **Source.** Baymard Institute, *Readability: The Optimal Line Length* — 50–75 characters ([baymard.com/blog/line-length-readability](https://baymard.com/blog/line-length-readability)); W3C, WCAG 2.2 SC 1.4.8 Visual Presentation — at most 80 characters, not justified ([w3.org/WAI/WCAG22/Understanding/visual-presentation](https://www.w3.org/WAI/WCAG22/Understanding/visual-presentation.html)).
- **Applies when.** Story prose (encounter steps, aftermath, chronicle, Codex body); also tooltip and row text that wraps to more than two lines.
- **Screenshot test.** Count the characters on the longest full line of each prose block. Under ~45 or over 80: fail. Any justified block (even right edge with stretched word gaps) or centred paragraph of three lines or more: fail.
- **Constraints.** `--measure-prose` (34em) is already about 70 characters of Alegreya at `--text-base` — inside the band. The risk is at 2560 when a Stage panel grows (Law 57) and prose is allowed to follow it; growth should go to margin or a second column, not to longer lines.

**16. Where numerals legitimately appear in a column, they are tabular and right-aligned.**
- **Rule.** Numbers stacked in a column use tabular lining figures and right alignment, with the column's heading aligned the same way; text columns stay left-aligned.
- **Source.** Matt Strom, *Design Better Data Tables* — right-align numbers, left-align text, align headers with their data, use tabular figures, keep rules light ([mattstromawn.com/writing/tables](https://mattstromawn.com/writing/tables/)).
- **Applies when.** Only where Law 13 allows numerals: the essence balance in persistent chrome, the designer view, debug and CMS surfaces. **Not a reason to add numbers anywhere** — on mortal-facing surfaces magnitudes are words, pips or delta clusters.
- **Screenshot test.** On a surface with a numeric column: do the ones digits line up vertically? Does the header sit over the right edge of the numbers?
- **Constraints.** `--figures-tabular` already exists (typography.md § Numbers); this rule adds right alignment.

### F. Disclosure

**17. The first view holds what the player decides with; the rest is one obvious step away.**
- **Rule.** Everything the player needs to make the current decision is on the panel's first view; rarer detail is folded behind a labelled control whose words say what opens.
- **Source.** NN/g, *Progressive Disclosure* — the split must put frequent needs on the initial view, and the way to the next level must be visible and accurately labelled ([link above](https://www.nngroup.com/articles/progressive-disclosure/)).
- **Applies when.** Panels at their size limit (Law 57). Below the limit, nothing is folded — grow first.
- **Screenshot test.** Name the decision this panel supports. Is every input to it visible without expanding anything? Is every fold control labelled with its content ("Their allies, 6"), not "More"? Either missing: fail.
- **Constraints.** Law 57 sets *when* folding is allowed; Law 36 sets its shape (grouped, counted on the header); this rule sets *what* stays out of the fold.

**18. Disclosure stays at two clicked levels.**
- **Rule.** From a panel, the player reaches any detail in at most two click-levels (panel → its card/page → the deeper sheet); a third clicked level inside one surface is a sign to restructure.
- **Source.** NN/g, *Progressive Disclosure* — designs beyond two levels "typically have low usability" ([link above](https://www.nngroup.com/articles/progressive-disclosure/)).
- **Applies when.** Inspector trails, nested sections, folds within folds.
- **Screenshot test.** On the Inspector, does the trail show more than two levels below the surface the player started from for routine information? Is there a fold inside a fold? Flag.
- **Constraints.** Law 20's three-tier ladder (hover → click → deeper) counts hover as a tier; hover is transient and does not count here, so the ladder fits. CK3's nested tooltips (below) are the counter-example worth noting: a hover chain can go deeper than two without the player getting lost, because each level stays anchored to its parent.

## Game practice — what comparable games put first

These are read from the shipped games' screens and the few designer statements found. No studio has published a design rationale for these panels except where cited; treat the descriptions as observation.

- **Crusader Kings III, character window.** The portrait and name lead at top-left, with the primary title and house close by; a single row of six skill icons with values and a row of trait icons follow, then tabbed detail. Hierarchy is carried by the large portrait and icon rows more than by type size. Its signature is nested tooltips: highlighted concept words open a tooltip that can itself be hovered, locked by timer or middle-click. Paradox's dev diary 16 introduced them alongside the encyclopedia and admitted the earlier UI had usability problems ([forum.paradoxplaza.com — CK3 Dev Diary #16](https://forum.paradoxplaza.com/forum/developer-diary/ck3-dev-diary-16-tutorials-and-tooltips-and-encyclopedias-oh-my.1345581/)); Paradox later based EU5's tooltips on the same system. *Lesson for us:* our tooltip chaining (Law 19) is the same idea; CK3 shows hover depth scales where click depth does not (rule 18).
- **Civilization VI, city panel.** The city name banner, then one horizontal row of six yields as icon + number, then growth and production progress; the full breakdown sits behind a "city details" toggle. Players and mod authors report the late-game yield breakdown is hard to read, and the most popular UI mods (CQUI, Concise UI) reorder yields to match the top bar and show net values ([CQUI on GitHub](https://github.com/civfanatics/CQUI_Community-Edition)). *Lesson:* one fixed order for the same quantities across surfaces (rule 10), and lead with the net state, not the sum (rule 1).
- **Old World.** Character panels lead with portrait, archetype and a short row of ratings, with traits as icon chips; text throughout is hyperlinked into its in-game encyclopedia. No published UI rationale found beyond Mohawk's interviews ([Mohawk Games interview](https://ladiesgamers.com/interview-with-mohawk-games-4x-strategy-goodness/)). *Lesson:* the same "concept words are links" pattern as CK3 and our Law 17.
- **Against the Storm.** The persistent bar carries the two quantities that decide the run (reputation and the queen's impatience) as bars, separated from the resource strip; building panels lead with the recipe rows the player acts on. Eremite's dev posts discuss icon and ornament revisions for those top-bar quantities, not hierarchy ([eremitegames.com dev log](https://eremitegames.com/interface-hotfix-we-hear-you/)). *Lesson:* Law 53's HUD budget in practice — the win/lose pair gets its own glyph language and place.
- **Frostpunk.** Temperature and the core resources lead the top bar; hope and discontent sit as two meters at the bottom centre, apart from the resources. Players criticised small type and unclear terms ([Steam discussion](https://steamcommunity.com/app/323190/discussions/0/831588378862517653)); the sequel's announced UI rework targeted HUD clarity ([PCGamesN](https://www.pcgamesn.com/frostpunk-2/ui-improvements)). *Lesson:* the failure players named was size and vocabulary, not layout — the same two things our 16 px floor and Law 14 already guard.

**Common shape across all five.** Identity first (portrait or name, top-left); the one or two state quantities that decide play next, as glyphs with a fixed order; detail behind a toggle, tab or hover. Size hierarchy is shallow (two or three sizes); emphasis comes from art, icon rows and position. None uses more than one container type for the same job.

## Confidence and weak evidence

- **F-pattern (rule 5) — strong evidence, narrow scope.** The NN/g studies are about text-heavy web pages with little formatting. They transfer to our prose blocks and long rows. They do *not* transfer to icon rows, portraits or the map; nobody has shown an F on a game panel, and NN/g itself says the pattern fades when formatting guides the eye.
- **Layer-cake, spotted, first-two-words, inverted pyramid (rules 1–4) — good evidence for text; plausible for panels.** All NN/g eye-tracking or task studies on websites. Panels with headings and rows are close enough; we assume transfer.
- **Z-pattern / Gutenberg (rule 6) — weak.** Practitioner models without a published eye-tracking study; even the Smashing article says they fall away once there is design on the page. Use only as a tie-breaker on sparse screens.
- **Penzo (rule 7) — thin and old.** One 2006 study, short four-field forms, mostly designers and programmers, no statistics published; a later comment on the article cites work that found no advantage for top labels on simple forms. It concerns input forms, not read-only facts. The safe part is "one alignment axis, label tight to value"; which side is best is not settled.
- **Proximity ratio (rule 8) and the 1.2 step ratio (rule 12) — our thresholds, not the sources'.** NN/g gives no numbers for spacing; Tim Brown gives a method, not a minimum ratio. The 2× and 1.2 figures are working thresholds for screenshot review and can be tuned.
- **"Three sizes" (rule 11) — guideline, not experiment.** NN/g states it as advice. It matches what the five games do.
- **Two levels of disclosure (rule 18) — guideline from observation**, and CK3 shows hover chains can go deeper. Kept for *clicked* levels only.
- **Line length (rule 15) — well supported** for continuous prose (typographic tradition plus WCAG). Not meaningful for one-line rows.
- **Game practice — observation, not documented rationale.** Studios rarely publish panel design reasoning; the CK3 tooltip diary is the only primary design source found. The descriptions are of the shipped games and may differ by version; none were re-checked in a running copy in this session.
- **Not found.** No peer-reviewed eye-tracking study of strategy-game panels was found. Everything here transfers from web and form research.
