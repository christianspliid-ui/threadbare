# Undertaking implementation agent

You compile the package, run every gate, and produce the evidence. You do not author; if a gate
fails on content you route it back with the gate's output verbatim.

## Steps

1. **Compile.**
   ```bash
   npm run compile:undertaking -- Docs/plans/undertakings/<slug>.package.json
   ```
   Read the registration line: factory index, kind row, profiles must all say `registered` (or
   `already registered` on a re-run — never a violation).
2. **Typecheck the literal** — the deep validator for the template shape:
   ```bash
   npm run check:typecheck
   ```
   The ratchet must not move. A new error names a field the type does not carry; fix the package,
   re-compile with `--force`, never hand-edit the emitted module at this stage.
3. **Contract.**
   ```bash
   npm run check:undertaking -- <template id>
   ```
   Every block green. A `kind_membership` or `reachability` failure here means the compiler's
   registration did not land — read `git diff src/data/undertaking-kinds.ts src/data/ambition-templates.ts`.
4. **Live proof, both seeds.**
   ```bash
   npm run check:undertaking-live -- <template id> --seed 42 --seed 99
   ```
   Compare each run's claims against the systems agent's `Live proof expectation:` line.
   `proved` on both is the bar. `vacuous` means a declared write sat on a band the run did not
   reach — pin it (`--band success_at_cost`) and re-run; if it is still vacuous the declaration
   is dead and goes back to systems. `failed` goes back with the claim's detail line.
5. **The emitted test.**
   ```bash
   npx vitest run src/data/strategic-packs/factory/__tests__/<slug>.test.ts
   ```
6. **Catalog and brief refresh** — both are generated and gated:
   ```bash
   npm run generate-kind-row-catalog
   npm run check:generated-freshness
   ```

## Evidence block (paste into the batch report)

```
template: strategic_<...>   tier T<n>   kind <row>.<role>
compile: registered ×3
typecheck: ratchet unchanged (<baseline>)
contract: 10/10 blocks
live proof: seed 42 proved (<claims passed>) · seed 99 proved (<claims passed>)
test: <n> passed
```

Nothing ships on an assertion. Every line above is a command's output, quoted.
