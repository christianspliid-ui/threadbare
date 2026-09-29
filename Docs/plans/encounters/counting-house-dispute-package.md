# Package critic — The Counting-House Dispute

templateId: encounter.town.counting_house_dispute
packageVerdict: connected
packageLeaves: The arbiter walks away carrying the winning house's fee (Corrow's Letters of Introduction or Aldane's Assessor's Weighted Scales) and a favour owed by that house's factor, a named merchant the favour card can later call in; a refused ruling instead costs standing with the losing factor, and a critical success can raise the town's regard or leave a hidden mark of knowing both ledgers.

## Half A — anchoring

| Chip | Referent | In the catalog? | Prose names it? | Verdict |
|---|---|---|---|---|
| pos crit/success/sac · boon · Letters of Introduction | the granted attachment | `attachment` 🔗 linked | yes — "Corrow's seals", title names the item | anchored |
| pos crit/success/sac · bond · a favour owed | `owes_favor` debtor `$cast:corrow` | `owes_favor` edge, anchor the endpoint agent | yes — "Corrow's factor, {cast:corrow}" | anchored |
| pos failure/crit failure · scar · reputation with {target} | `reputation_with` counterparty `$cast:aldane` | `reputation_with` 📍, agent 🔗 | yes — "{cast:aldane} thinks less of {actor}" | anchored |
| neg crit/success/sac · boon · Assessor's Weighted Scales | the granted attachment | `attachment` 🔗 linked | yes — "weighing pans Aldane's assessors use" | anchored |
| neg crit/success/sac · bond · a favour owed | `owes_favor` debtor `$cast:aldane` | as above | yes — "Aldane's factor, {cast:aldane}" | anchored |
| neg failure/crit failure · scar · reputation with {target} | `reputation_with` counterparty `$cast:corrow` | as above | yes | anchored |

Every chip is backed by a write on its own path (Law 56): item chips by `attachment_grant`,
bond chips by `favor_creation`, scar chips by `reputation_with` in `failureMetadata`. The
crit-success reactions carry no chip; their intents now say only what their effects write
(`reputation_with` on `$here` → "the town thinks better of the arbiter"; `hidden_mark`).

## Half B — what it leaves behind

A persistent item on the mortal's sheet and an `owes_favor` edge to a persistent, named cast
member — the Favor card's `requiresFavor` gate reads exactly that edge, so a later encounter
can spend it, and the player sees the debtor on both sheets. Failure leaves a readable
standing drop with a named person. **connected.**

## Fixes applied this pass
- Step 0 gains a named, bound person (`$cast:founder`); founder de-gendered everywhere.
- Crit-success reaction intent no longer promises future quarrels or renders `{location}`.
- Overview/chip repetitions folded (overview says "in kind"; the chip carries the item).

PACKAGE PASS
