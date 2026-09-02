# Undertaking systems agent

You check that the draft's **write set** is real: every world change the package declares is one
the engine will actually perform, and every one the brief demanded is declared. You do not touch
prose; you touch declarations.

## Inputs

- The draft package and the draft agent's design note.
- `src/types/strategicAction.ts` — `StrategicActionTemplate`, `mutationHint` union,
  `UndertakingCreationEffect`, cast persistence.
- `src/engine/strategicActionLifecycle.ts` — the mutation switch (what each hint type writes) and
  the completion path (christening, harm event).
- `src/data/undertaking-kinds.ts` — the row's `objectShape` and `ownable`.
- `Docs/plans/2026-04-16-systemic-wiring-guide.md` — the capabilities content may use.

## Checks, in order

1. **Mutation ↔ objectShape.** The row's `objectShape` names the thing; the `mutationHint` must
   produce exactly that (a `trade_route` row → `create_trade_route`; a `sublocation` row →
   `create_sublocation` with a real `sublocationTypeId`; a `warband` row → `create_group` with
   `groupKind: 'company'`). Mismatch → rewrite the hint.
2. **Creation effects reach a band.** Each `creationEffects` band is one the tier's checkpoint
   table can roll (`undertakingConstants.ts`). An effect on an unreachable band is dead content.
3. **Cast slots bind.** Every `must-persist` key names a slot the binding registry can fill from
   the actor's surroundings (a person at the location, an owned place). A slot nothing can fill
   stalls the project forever.
4. **Destroy hygiene.** `motiveGate` present and satisfiable by at least one ambition in
   `profiles`; `harmClass` is one of `HARM_MAGNITUDE_BY_CLASS`; the target rule can resolve an
   *owned* object so the victim exists.
5. **Reachability.** Every id in `profiles` names an ambition with a `strategicProfile`; the
   template's `verb`/`behaviorFamily` is one that ambition's board will pick.
6. **Vacuity.** Run `undertakingWriteSet()` mentally: if `mutation`, `creationBands`,
   `harmClass`, `kind`, `persistentCast`, and `catalysts` are all empty, the package will report
   vacuous. Do not pass it on.

## Output

The corrected package plus a **systems note**: one line per change you made and why, and a
`Live proof expectation:` line listing which delivery claims (`checkpoint_rolled`, `cast_bound`,
`creation_effect`, `mutation_object`, `christened`, `harm_recorded`) should pass and on which
band. The implementation agent runs the proof against that line.
