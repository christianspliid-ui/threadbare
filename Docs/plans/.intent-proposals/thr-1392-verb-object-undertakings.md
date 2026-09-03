# Action Proposal — THR-1392 undertakings as verb × object type

## intent_quote

> (Christian, 2026-09-03, on approving the undertaking factory's pilot brief:) "make sure the undertaking framework is kept systemically simple, scalable and that the complexity comes from how it connects to other systems. is the architecture of undertakings and the CRUD approach well mapped architecturally?"

> (Christian, 2026-09-03:) "what i am afraid of on the undertaking is that we technically make an extreme amount of variants that never fire. to me 'burn the charts' seems a way to specific undertaking, defined by something that doesn't even systemically exist. a chart, if in the game, would be an attachment, and so for me the undertaking should be a generic 'destroy attachment' undertaking with flavour text from the attachment being destroyed and the destroyer? is this abstraction level misunderstood? is this not systemically what best connects to the other systems and scales naturally?"

> (Christian, 2026-09-03:) "lets go into design again. and do a thorough design pass, comparing the designs (both old and new), their scalability and connectivity and simplicity. make sure we also get another agent to review and give feedback."

## scope (what this plan does)

Compares the shipped undertaking content model (64 authored templates in 8 kind rows) with a verb × object-type model on scalability, connectivity and simplicity, using a census of every template and the THR-1388 probe runs; runs the pre-design debate (two advocates, cross-examination, trade-off card) and an independent critic review, both recorded in the doc; chooses the verb × object model and specifies it — an object-type registry with typed shapes and per-type verb semantics owned by the objects' systems, six verbs, derived cells with bounded authored overrides, one resolver replacing the per-template switch, prose composed from the object and the actor — with a flagged migration of the 64 templates, a retirement list reviewed in chat, and a measured acceptance (census envelope, harm probe, every cell with an object fires, register score on composed lines).

## scope (what this plan does NOT do — explicit non-goals)

- Does not run the undertaking factory pilot batch on the template model (THR-1300 slice 5 is superseded; the factory tooling is retargeted at cells and object types).
- Does not delete any template before its cell exists and proves live; the packs stay behind `UNDERTAKING_MODEL = 'templates'` until the census passes on cells.
- Does not add object types for people (acts on mortals belong to the reactive loop and the encounter pipeline) or a trade/exchange verb (the economy owns it).
- Does not change the checkpoint dice, the binder, the motive gate, the harm classes, the moment surfaces or the covet rivalry.
- Does not retune the decision board.

## impact_class

High-risk — a content-model change with a rulebook edit (§10.6–10.8 verbs), a canon rewrite, and a migration that retires a registry (`undertaking-kinds.ts`). **User sign-off line:** Christian directed this design pass in chat on 2026-09-03 ("lets go into design again…") after framing the model himself ("the undertaking should be a generic 'destroy attachment' undertaking with flavour text from the attachment"); the plan's verdict is his framing made concrete, and the remaining decision (approve the plan for Ready for Dev) is asked of him in chat with the comparison, the debate card and the critic's findings.

## evidence cited

- **Linear issue:** THR-1392 (and THR-1300 for the factory it retargets, THR-1388 for the probe runs, THR-1348 for the reachability shape, THR-1309 for the list-position measurement)
- **Vision premises invoked:** `Vision/02-non-negotiables.md` §4, §5, §6, §7; `Vision/03-design-tensions.md` §1, §2; `Vision/00-north-star.md`; `Vision/taste-profile.md` (pure template-based prose anti-pattern; state facts, never encode them)
- **UL terms touched:** undertaking, kind row (retired), work, christening, freehold, moment (existing); **object type**, **verb cell**, **cell override** (new — `UL-proposal` to be filed with the implementation)
- **Canon pages consulted:** `Docs/canon/undertakings.md`, `Docs/canon/rulebook.md` §10, `Docs/canon/systems-inventory.md`, `Docs/canon/interface-map.md`
- **Prior plan docs this builds on:** `Docs/plans/2026-09-02-thr-1300-undertaking-factory.md`; the THR-1292/1296/1297 undertaking substrate docs
- **Rejected approaches considered and dismissed:** typed objectShape as a refactor of the template model (the object was never in the model); fully generated prose with no overrides (taste-profile anti-pattern); two permanent models; object types as a taxonomy over attachments only

## load-bearing decisions touched

- "Everything is a graph node/edge" — respected and **repaired**: intelligence records move from a property bag to `knows_of` edges.
- "No inventing node types without verification" — none invented; `ruined` is a property on an existing node type.
- "Relationships between entities are graph edges, not property fields" — the object registry reads existing edges (`owns`, `controls`, `commanded_by`, `possesses`, `member_of`, `trades_with`, `knows_secret_of`, `knows_of`).
- Rejected approach "Pure template-based prose — replaced by hybrid layered engine" — the plan is the layered engine for undertakings, not a return to pure templates; the debate card records the argument.

## high-impact files touched (from Codesight)

`src/types/trace.ts` (116 importers, additive); `src/types/strategicAction.ts` (the template type — the old `verb` union stays as an alias during migration so importers compile unchanged). Blast Radius section present.

## kill criteria

- The census on cells fails the envelope on either default seed after the verb tables are tuned once → the cell model over- or under-supplies; the flag stays on templates and the ticket reopens with the numbers.
- The register scorer on 200 composed lines scores below the shipped templates → the flatness risk is real; overrides are not the answer at scale; the ticket reopens on prose architecture before the flip.
- `undertaking_cell_unreachable` stays non-zero for an object type that exists in the world → that type's semantics are missing; the type is removed from the registry rather than shipped hollow.
