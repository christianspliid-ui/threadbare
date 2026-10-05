# Package critic (Pass 3b): The Forged Charter

> Batch: master-everyday (THR-1688), slot 1 (the batch's appointment slot) · Date: 2026-10-05
> Input: `Docs/plans/encounters/forged-charter-inquest-final.md` (§ 15 chip text, § 20 sequels, § 21 chip declarations). Brief: `master-everyday-brief.md` slot 1. Calibration: `mill-lease-auction-package.md` (same appointment shape, shipped).

templateId: encounter.town.forged_charter_inquest
packageVerdict: connected
packageLeaves: The master's standing with the town rises or falls, and the town's page shows it; a Political Secret record of who forged the count's charter (one of the steward's own clerks) lands in their intelligence panel, where court and intrigue encounters score it; and naming the forger books them to be back in the town hall in three days for court day, with the count's steward there to answer — keep it and the town's charter stands, the town thinks better of them and the steward turns cold toward them, miss it and the steward comes looking for them wherever they are and thinks less of them if they cannot answer.

---

## Half A — anchoring

### Parent: `encounter.town.forged_charter_inquest`

| Chip | Referent | In the catalog? | Prose names it? | Verdict |
|---|---|---|---|---|
| BOND reputation with {location} (critical_success, success, success_at_cost) | the mortal's standing with the town (`reputation_with $here` step 1 success +0.06; net +0.03 on the step-0-failure → step-1-success path, still a gain) | `$here` → `location`, 🔗 linked (`visualKind: 'location'` declared) | yes. `{location}` enriches to the town's name in the tag and the detail | anchored |
| BOON knowledge (critical_success, success, success_at_cost) | the `political_secret` intelligence record from step 1 success ("One of the count's steward's own clerks wrote the count's copy of the charter") | concept, `tooltipId: 'ui.knowledge'`, no `entityId`. This is the shipped mill-lease / boundary-survey shape; the record shows in the intelligence panel | yes. "who wrote the count's copy of the charter" is the record's own label and content; the cause names the household | anchored |
| PATH appointment (critical_success, success, success_at_cost) | the booking to be in the town hall on court day (the `owes_favor` edge carrying `properties.appointment`; place `$here`, counterparty `$cast:steward`) | `$appointment` (THR-1518) → `location`, 🔗 linked. Lawful because step 1 success plants an `encounter_seed` with an `appointment` block | yes. "{cast:steward} answers the findings in {location} in three days" names the person, the place and the day | anchored |
| SCAR reputation with {location} (failure) | standing with the town, lost (step 1 failure −0.06) | `$here` → `location`, 🔗 linked | yes | anchored |
| SCAR reputation with {location} (critical_failure) | standing lost: step 1 failure −0.06 (wrong clerk named), or step 0 failure −0.03 on the step-0-critical path (the word against the town's copy) | `$here` → `location`, 🔗 linked | yes. "Said before the council" is true on both paths | anchored |

No PRIZE chip on the parent and none expected: the hand is knowledge + story_seed.

**THR-1685 check:** no chip interpolates `{target}`. Every reputation chip anchors the town (`$here`). The only person-keyed reputation write (the steward) lives in the missed sequel, which authors no chip.

### Sequel (kept): `town.charter_inquest_heard`

| Chip | Referent | In the catalog? | Prose names it? | Verdict |
|---|---|---|---|---|
| *(no authored chips: `fallback.changes: []`, the mill-lease sequel precedent; no reward pool, so no auto PRIZE)* | — | — | — | — |

Its writes (reputation with the town +0.05, steward bond −0.06 sentiment) carry no chip and claim none. The success afterimage's "the market stays free of the count's tolls" is prose, not a chip, and claims no state change beyond the ruling it narrates.

### Sequel (missed): `town.charter_inquest_defaulted`

| Chip | Referent | In the catalog? | Prose names it? | Verdict |
|---|---|---|---|---|
| *(no authored chips)* | — | — | — | — |

The failure afterimage's "thinks less of the master who stayed away" is backed by `reputation_with targetAgentId '$cast:steward' −0.04` plus the bond write, and is correctly kept off `$here`.

**Half A result:** every chip is anchored. No `fold`, no `bind`.

### Checks that found nothing to fix

- **Raw `seedLabel` tokens.** Both labels are plain prose ("…with the count's steward there to answer them." / "…the count's steward comes looking for the master who made them."). No `{…}`.
- **`stateNoun` braces.** BOND/SCAR `stateNoun.text` is `reputation with {location}` — the same field shape the shipped mill-lease chips carry, so it renders as that precedent does. PATH and BOON nouns are plain words.
- **Both-paths truth.** success_at_cost and critical_failure each have two entry paths; the final § 15 reads both overviews and the CF SCAR against both. The CF SCAR's step-0 path is backed by step 0's `failureMetadata` −0.03 (keep it).
- **Rule 7b.** The only later-tense promise (findings read on court day) rides the appointment; the success `narrativeTemplates` line "the findings go before the inquest on court day" is backed by the seed. No overview promises the inquest's result.
- **Brief binding (slot 1).** knowledge via `intelligence`, story_seed via `encounter_seed` + `appointment { locationId: '$here', counterpartyId: '$cast:steward', missed }`; both sequels authored. Matches.

## Half B — what it leaves behind

- **Reputation with the town (`$here`).** Settlement reputation gates and the Location Profile standing row read it; the player sees it on the BOND/SCAR tag and on the town's page.
- **The appointment.** The strongest thread. The movement lean pulls the mortal back to the town hall within the window and the `owes_favor` edge sits on their sheet. Kept → `town.charter_inquest_heard` fires there, the town's regard moves and the steward's bond turns cold (he lost, and knows to whom). Missed → `town.charter_inquest_defaulted` finds them wherever they stand; the steward's bond and standing move.
- **The knowledge record (`political_secret`).** Shown in the intelligence panel; `TEMPLATE_CATEGORY_MATCHERS` (`src/engine/intelligence.ts:72`) lifts templates whose ids contain `court · intrigue · blackmail · extort · betray`, so later court/intrigue business scores it. Thinner than mill lease's `trade_route`, but real.
- **The cast.** Steward and forger are `must-persist`; a later encounter reusing a steward/noble at this town meets Aldric Vane again, and the sequels carry him by `inheritContext`.

**Honest gap (optional, not required):** the record carries no `targetEntityId`, so `hasIntelligenceAbout(forger)` stays false and the record says "one of the clerks" rather than naming `{cast:forger}`, although the afterimages do. Same optional gap as the mill lease and boundary survey; only pursue if the step-metadata intelligence path is confirmed to resolve `$cast:` in that field.

**Verdict: `connected`.**

## Implementer notes

1. Keep step 0's `failureMetadata` `reputation_with $here −0.03` — without it the step-0 critical_failure SCAR has no write behind it.
2. Keep the step-1 success `encounter_seed` with its `appointment` block — `check:encounter` accepts PATH's `$appointment` anchor only because of it.
3. The sequel file and its two registration lines (final § 20/§ 21) must land in the same compile, or both appointment branches are `dead_template` and the PATH chip promises a meeting that never fires.

PACKAGE PASS
