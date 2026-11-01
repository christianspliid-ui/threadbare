> **title:** Brainstorm companion — art-led pass, slice 5, the dialogs (THR-2101)
> **plan doc:** `Docs/plans/2026-11-01-art-led-dialogs.md`
> **author:** Claude Code (design lane, unattended, 2026-11-01)
> **created:** 2026-11-01

# Brainstorm companion — the dialogs

The alternatives the design lane weighed before deciding, kept here so the plan doc can state only the choice.

## Vision premises in play

- North star: *the mortal has to feel like a person.* Five of the eight dialogs are about one mortal and show no face.
- Non-negotiable #3: mechanics through prose. The court is the one dialog still written as a form ("Position:", "Cost:", "Required:").
- Taste profile: prose first, one gold emphasis, no ornament for its own sake. That pulls against icon-on-everything; it is why settings and the world message stay plain.

## Alternatives considered

### The receipt's art

- **Replace the act's painting with the target's face.** Rejected: the receipt is about *what the act bought*; the act's painting is the subject (R1). The target is the second subject, so it gets a medallion.
- **Draw both at hero size.** Rejected: the receipt is `size="s"`; two hero images would push the changes below 85vh at 1920×1080.

### The court

- **Keep the counts ("2 bonuses") and add a tooltip.** Rejected: Law 16 and R6/R7; the player has to hover to learn anything.
- **Hide the Sacred Sites and Divine Artifacts rows until they exist.** Rejected for this slice: removing a row changes what the court promises, which is a design call beyond dressing. A quiet slot keeps the promise and drops the "Coming Soon" placeholder voice.
- **Give the seat headings invented shapes (crown for Apex, ring for Inner Circle).** Rejected: the programme rule is no invented shapes; they join the icon pick.

### The world message

- **Paint doom stages and a failed Mandate.** Rejected: new art is out of scope for every slice, and no engine producer sets `PopupItem.art`.
- **Draw the `doom` / `mandate` shape on the message.** Rejected: `PopupItem` carries no kind, so the component would have to guess from the title; adding a kind is an engine notification change outside a dressing slice. The sphere medallion already carries R1 on the ceremonial tier.

### The warm-start wait

- **Show The First's face.** Rejected: the overlay knows The First only by name, and it is a loading wait the player cannot act in. A season shape tells them where in time the world is, which is what the wait is about.

### Settings

- **Icons on every section (Display, Audio…).** Rejected: R2 binds headings that name a *game* idea; these are configuration groups. Law 30 keeps reference surfaces neutral.
- **Keep the emoji.** Rejected: emoji are a second icon family on screen, against `Docs/design-system/icons.md` (one family).

## Tensions

- **Slice 4 dependency.** The receipt's carved consequence shapes and relic tiles repeat slice 4's decisions 4–5. If Christian vetoes those ("keep the old chip marks", "no relic pictures on encounter chips"), S5.3 drops with them. The `Claimable from` hold sits past both windows.
- **Debug levers.** Four dialogs gain real `openHomedSurface` levers. Receipt, world message and warm start keep hints: each needs a real act, a doom stage or a reload, and faking them would test a state the game never reaches.
