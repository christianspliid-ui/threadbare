# Package critic — The Tourney Marshal
> Slug: tourney-marshal | Pass: 3b package | Date: 2026-10-14 | Batch: master-everyday-2 slot 4

templateId: encounter.town.tourney_marshal
packageVerdict: connected
packageLeaves: The young noble's house owes the marshal a favour that can be called in later, the town keeps a Festival and thinks better of its marshal; on failure the noble carries a Wounded condition, the house trusts the marshal less and the town thinks less of them, and the success-side reactions move the marshal's bond with the champion or the noble.

## Half A — anchoring

| Chip | Referent | In the catalog? | Prose names it? | Verdict |
|---|---|---|---|---|
| cs/s/sac · BOND a favour owed | the `owes_favor` edge, debtor the heir | `agent` 🔗 linked (concept `$cast:heir`); favour concept tooltip `ui.favour_owed` | yes — "{cast:heir} owes {actor} a favour now." | anchored |
| cs/s/sac · BOON Festival | `trait.condition.location.festival` on the town | `attachment` 🔗 linked | yes — "{location} keeps the tourney's last day as a feast." | anchored |
| cs/s/sac · BOON reputation with {location} | town standing | `location` (`$here`) | yes — "{location} thinks well of {actor} now." | anchored |
| f · SCAR Wounded | `trait.condition.wounded` on the heir | `attachment` 🔗 linked | yes — "{cast:heir} is Wounded from the bout." | anchored |
| f · SCAR reputation with {location} | town standing | `location` (`$here`) | yes | anchored |
| f · BOND reputation with {target} | the heir | `agent` 🔗 linked (`$cast:heir`) | yes — "{cast:heir} trusts {actor} less." | anchored |
| cf · SCAR reputation with {location} | town standing | `location` (`$here`) | yes | anchored |
| cf · BOND reputation with {target} | the heir | `agent` 🔗 linked (`$cast:heir`) | yes | anchored |

No fold, no bind. Every chip is backed on every route into its page (see `tourney-marshal-systems.md` § 3).

## Half B — what it leaves behind

A favour on the heir's sheet is a real `owes_favor` edge that later favour-calling reads, and the player sees it as a chip linked to the noble. The Festival sits on the town for its duration (36 ticks) and shows on the location. Wounded sits on the heir. Town standing and the two cast bonds move in both directions. The secret family is a favour rather than a hidden fact, which the brief allows; it is the thinnest of the writes but it is real and visible. Verdict: **connected**.

## Notes

- The `success_at_cost` page carries the same three gains as `success`; its cost is in prose only. This is an engine limit (no band-keyed step effect), accepted.
- No fix-list: the editorial pass's eight fixes were prose and route truth, and none changed a chip.

PACKAGE PASS
