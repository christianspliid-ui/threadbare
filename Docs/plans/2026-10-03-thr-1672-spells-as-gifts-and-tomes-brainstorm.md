> **title:** Brainstorm companion — spells as divine gifts and found tomes — THR-1672
> **linear_issue:** THR-1672
> **author:** Claude Code (design lane, run 2026-10-03b)
> **created:** 2026-10-03
> **companion_of:** `Docs/plans/2026-10-03-thr-1672-spells-as-gifts-and-tomes.md`

# Brainstorm companion — THR-1672

The options weighed for each lane decision, the tensions left open, and the Vision premises leaned on.

## Lane decision 1 — one grant seam

- **Taken:** a new `grantSpell`, with the three existing writers repointed after their edges are pinned.
- **Weighed:** leave the three writers alone and add only the two new channels. Rejected because THR-1231's resolution names one minting seam for all five channels, and because a fourth and fifth hand-written writer would repeat the `attachment_grant` side-door defect (a spell routed through the generic trait clone).
- **Weighed:** route grants through `attachment_grant`. Rejected because that path clones a template per bearer, while the spell model is one shared definition node with per-bearer edges (THR-1395, THR-1429).

## Lane decision 2 — what a god teaches

- **Taken:** the god's own spheres first (primary, then secondary), tiers 1–2, falling back to the mortal's tradition library.
- **Weighed:** the mortal's own tradition only. That is true to the mortal, but it makes a god's teaching indistinguishable from study, so the god leaves no fingerprint. Rejected as the primary rule and kept as the fallback.
- **Weighed:** any spell in the world. Too flat; the god's identity disappears from the gift.
- **Weighed:** let gods teach elder (Foundation) magic. Rejected, because the taste profile says elder magic is *discovered, not selected*, and a god choosing it for a mortal is selection. The tier cap enforces it without a special case.
- **Tension:** a god whose primary sphere is a Foundation sphere teaches from its secondary sphere or the mortal's tradition, so its "own" magic never appears as a gift. That is consistent with elder magic being rare. If Christian wants such gods to teach their elder sphere, that is a one-constant change (`DIVINE_TEACH_MAX_TIER = 3`).

## Lane decision 3 — Spell, not Bestowal

- **Taken:** a god-taught spell is a Spell; Bestow Power is unchanged; Teach a Spell is a new card.
- **Weighed:** turn Bestow Power into a spell grant. Rejected because it would remove a shipped, liked stat gift, and because the UL keeps Bestowal (a god-given power with its own effects) distinct from Spell.
- **Weighed:** a new Power variant, "divine spell". Rejected because it adds a fourth variant for what is only a provenance; the `knows_spell` edge's `source` says it.

## Lane decision 4 — the price of dark teaching

- **Taken:** teaching a transgression costs doom 0.05 and detection 0.15 in the mortal's region. Each later cast adds detection 0.05 and names the god on the existing notice mark. Gentler teaching costs only essence.
- **Weighed:** charge every god-taught cast, whatever its price layer. Rejected because ruling 5 ties the consequence to *forbidden* magic, and a healer taught a blessing should not expose the god.
- **Weighed:** route the caster's soul price to the god. Rejected because quintessence is the caster's own soul, and moving it would break FB3's per-caster accounting.
- **Weighed:** a per-god detection ledger. Rejected for now, since only the player god teaches. Detection is regional and every nudge cost already treats it as the god's exposure.
- **Weighed:** doom per cast. Rejected because THR-1572's Lane decision 4 kept world doom off spells for good reason (multiplication across carriers). Here doom is one-off and bounded, at teaching time only.

## Lane decision 5 — knowing is not being a caster

- **Taken:** the badge stays as ruled; a given spell can be carried and cast, but not studied beyond.
- **Weighed:** any known spell confers the badge. Rejected because ruling 4 lists how the badge is earned, and widening it is Christian's call. It would also silently let every book reader study up a tradition.
- **Tension:** "item drops can change who an agent is" (THR-1231) still holds, because the spell changes what they do. The identity word does not change.

## Lane decision 6 — which books teach, and when

- **Taken:** a predicate over tags (`tomes_scrolls` with `#arcane` or `#ancient`, not `#map`) plus the generated forbidden book. A book teaches when it comes into hands (reward, mint to a non-maker, seizure), once per reader.
- **Weighed:** only generated tomes, per the literal ticket wording. Rejected because generated tomes do not occur yet (census: 0 in three worlds), so channel 4 would be dark until THR-1626. That would also make this plan depend on a decision still inside its veto window. Authored arcane books already reach 11–16 mortals per world, and teaching from them is the same fiction.
- **Weighed:** a "read the book" action. Rejected as a bespoke surface; THR-1231 asked for simple triggers.
- **Weighed:** teach at mint time only. Rejected because a maker writing a book should not learn from it, and a book changing hands should teach its new holder.
- **Weighed:** every tome teaches. Rejected because 32–52 tome rewards per world would carpet the world in spells, and ledgers, chronicles and bounty scrolls are not magic.
- **Taken, with the Vision behind it:** ancient books may teach tier 3 and prefer elder spells. This is the taste profile's *"discover them through ruins, texts"* made literal.

## Lane decision 7 — the nudge grant

- **Taken:** one reaction kind, `spell_grant`, and one Cache-family member.
- **Weighed:** a new card type (a 22nd keyword). Rejected because the repertoire keeps the vocabulary at 21 words learned once; a grant is "something left behind", which is Cache's fiction.
- **Weighed:** no card, only the kind. Rejected because a vocabulary nothing uses is a dead constant.

## Open tensions carried forward

- The god's *decision* to teach is the player's. The mortal has no say in what a god puts in their head. That is consistent with Meet The First's formative tests, where fate writes the poles, but it may deserve a reception beat later (THR-1644's ceremony work).
- A mortal who is not a caster but carries a dark spell is noticed like a caster. That is correct fiction (the magic is noticed, not the badge), but it may surprise a player.
