# Encounter Portfolio Assessment — THR-1215

**Status:** live. This is the standing portfolio reference that step 1 of the authoring
order (`.claude/skills/encounter-pipeline/reference/nudge-authoring-spec.md` § Authoring
order) reads from. Refresh the census when a batch ships; re-rank the target mix only on
a director ruling.

**Director rule, step 1 (Christian, chat, 2026-08-24):** *"assess what and how many types
of each encounter we need. pick a category to start building the encounter."* The standing
note from the same sitting: the game is **epic fantasy**, not slice-of-life.

**Measured** 2026-08-24 against `origin/main` (`68226bdb`), by bundling the live
`UNIFIED_ACTION_TEMPLATES` array and counting it — not by reading files. The counts below
are machine-true unless a row says otherwise.

**One input was unavailable when this was written, and is available now.** Task step 2
names the 1,200-hook corpus at `Design/research/quest-hooks/`. At the time of measurement
those files were not in the repository — `.gitignore:73` (`Design/*`) hid them, and a
worktree cut from `main` found an empty path. The breadth reference was therefore **not
consulted**, and the genre gap list below is built from the director's stated bar plus the
spec's recorded mechanical gaps. Nothing in the census half depends on it.

**The corpus was published 2026-08-24 (THR-1217)** and now reads from any worktree. The
gap list below has *not* been re-derived against it — treat the ranking as the
director-bar-plus-mechanical-gaps product it says it is. Anyone re-ranking the target mix
should read `Design/research/quest-hooks/README.md` § Measured distributions first; its
two named gaps (`stronghold` empty, `iron` thinnest at 52) are independent evidence about
the same question this assessment answers, and they were not in view here.

---

## 1. Census

### 1a. Corpus scale, and what the gate can see

| Family | Templates | Inside `check:encounter`? |
|---|---:|---|
| `encounter.*` | 195 | yes |
| Guild families (`ag` `mc` `tg` `ac` `bf` `cg` `hod` `uk` `rb` `mct` `lk` `ts`) | 184 | **no** |
| Other encounter-shaped (`borderland` `social` `tavern` `liminal` `crafting` `enc` `mentorship` `monster` `invest` `reputation` `company` …) | 87 | **no** |
| **Mortal-facing encounter templates, total** | **466** | **195 of 466 (42%)** |
| God/world actions (`divine` `action` `hex` `loc` `army` `artifact` …) | 187 | n/a — not encounters |
| NPC verbs and misc | 34 | n/a |
| **Whole template corpus** | **687** | |

The gate scopes on the literal `encounter.` prefix (`scripts/check-encounter.ts:277`). The
~271 encounter-shaped templates outside that prefix — the entire guild, borderland, social
and tavern content — are not checked by anything. **A portfolio target expressed as "N% of
the corpus is compliant" is measuring the 42% that can be measured.**

### 1b. Composition tier

| Tier | Count | Which |
|---|---:|---|
| Composition-complete (off the ratchet, passes `check:encounter`) | **~20** *(refreshed 2026-08-29 — the 08-24 count of 10 predated the late-August batches: toll-of-blades, standing-the-line, the-drowned-archive, the-broken-seal, granary/garrison/ruin/relic/rite, one-body-short; the live membership predicate is "`encounter.*` and not on `RETROFIT_PENDING`")* | slice + company + the post-batch files in `src/data/encounters/` |
| On the ratchet (`RETROFIT_PENDING`) | 185 *(refreshed 2026-08-29; only ever shrinks — read the live count from the file)* | legacy + un-retrofitted nudge-era |
| Outside the gate entirely | 271 | guild / borderland / social / tavern / old branching |

`RETROFIT_PENDING` holds 185 ids — every one of them an `encounter.*` template. THR-1130
owns retrofitting the 15 nudge-era ones.

### 1c. Setting — the skew, measured

**~25 templates in the 687-template corpus declare a setting envelope** *(refreshed
2026-08-29 — the 08-24 census counted 13; the late-August batches roughly doubled it: 14
shipped content files now carry `settings:` declarations. Measure with
`grep -rE "^\s+settings: \[" src/data --include=*.ts`, never trust this number)*. Every
one is nudge-era; no legacy template has one.

| Setting class | Openings authored | Where |
|---|---:|---|
| `wayside` | 8 | 6 of the 8 slice encounters, + company, + apotheosis |
| `urban` | 4 | slice ×2, company, apotheosis |
| `rural` | 3 | slice, company, apotheosis |
| `sacred` | 2 | company, apotheosis |
| `ruin` | 1 | `company.gate_held` |
| `stronghold` | 1 | `company.gate_held` |
| `arcane` | 1 | `company.quiet_offer` |
| `battlefield` | 1 | `company.quiet_offer` |

This is the director's flagged convergence, stated exactly: **six of the eight slice
encounters open on a roadside.** The four company-drama encounters are the only content in
the game reaching `ruin`, `stronghold`, `arcane` or `battlefield` — one opening each, and
both "epic" classes belong to templates whose scenes are a held gate and a recruitment
conversation. **`battlefield` has one authored opening in the whole game, and nothing
fights in it.**

### 1d. Reach and structure

Reach across all `encounter.*` steps: `eye` 95 · `gold` 70 · `iron` 68 · `heart` 65 ·
`stone` 59 · `veil` 52 · `shadow` 42 · `star` 30 · (`resolve` 3, `combat` 1 — non-canonical
strays worth a sweep). Perception leads; `star` trails the seven other canonical reaches by
roughly half.

Step counts: 3 steps ×108 · 2 steps ×74 · 1 step ×13. Structurally uniform.

### 1e. Systems actually exercised, across all 195 `encounter.*`

| System | Templates touching it | Catalog tier |
|---|---:|---|
| `reputation` (delta writes) | 179 | — |
| `rewardPool` | 129 | — |
| `supportBundle` | 50 | — |
| `aftermathConfig` | 23 | — |
| `traitVariants` | 16 | mature |
| `intelligence` | 15 | — |
| `encounter_seed` | 13 | mature |
| `forks` (`decidedBy`) | 4 | mature |
| `spawn_artifact` | 2 | mature |
| `carryover` | 2 | mature |
| `omens` (`emit_omen`) | 1 | middling |
| **`conditions`** (apply/remove) | **1** | **mature** |
| `illustrationUrl` | 1 | — |
| **`{cast:*}` tokens** | **0** | — |
| **`favors`** | **0** | middling |
| **`groups`** | **0** | middling |

Two rows deserve to be read twice. **`conditions` is a mature, target-freely system and one
single `encounter.*` template uses it** — the catalog's core traveling-agent loop
(exhausted, wounded, Balm targets) is essentially unexercised. And the 08-24 census's
**"zero `{cast:*}` tokens across all 195" is no longer true** *(refreshed 2026-08-29: 21
files in `src/data/encounters/` now carry `{cast:*}` bindings — the post-batch templates
bind cast routinely, and THR-1044's setting-class default bundles closed the structural
gap the composition audit §2c traced this to)*. The legacy majority still binds nothing.

### 1f. Genre bands

Hand-classified by id and display name — **the one non-machine count here**, because only
13 templates carry a machine-readable design block. Treat as ±3.

| Band | ≈ templates | Nudge-native | Composition-complete |
|---|---:|---:|---:|
| Trade, theft and the purse | 32 | 1 | 0 |
| Camp / wayside chores and survival | 33 | 7 | 0 |
| Ruins, delving and anomalies | 23 | 0 | 0 |
| War, siege, watch and raid | 20 | 0 | 1 (a held gate) |
| Faction, guild and court | 14 | 0 | 0 |
| Deep magic and wards | 13 | 0 | 0 |
| Duels, trials and contests | 10 | 0 | 0 |
| Building and settlement | 10 | 0 | 0 |
| Monsters and the hunt | 8 | 0 | 0 |
| Prophecy, stars and vision | 8 | 0 | 0 |
| Aid and crisis | 7 | 0 | 0 |
| New-era slice / company / apotheosis / shell-proof | 16 | 13 | 10 |

The epic bands are not empty on paper — 23 ruin-and-delve templates, 20 war-adjacent ones,
13 deep-magic ones exist. **Every one of them is legacy.** Nudge-native content is 7 camp
chores, 8 roadside vignettes, 4 company scenes and one ascension. The game's *new* voice
has only ever spoken slice-of-life.

---

## 2. Gaps

### 2a. Mechanical (from the spec's recorded list, re-verified)

- **No nudge-native combat.** Confirmed: zero. The one composition-complete war-band
  template is a gate held open, not a fight.
- **Near-zero grants/costs channel users.** Confirmed by proxy — `conditions` 1,
  `spawn_artifact` 2, `favors` 0, `groups` 0.
- **Zero fate-branching users.** 4 templates use `decidedBy`, all slice/company.
- **New, not previously recorded** *(the cast-token half closed by the late-August batches — see §1e's refresh)*: zero `{cast:*}` in the entire `encounter.*` family; a
  single condition write; a single omen emitter; 271 encounter-shaped templates outside the
  gate's reach.

### 2b. Genre, against the director's bar

Taking his list in order — **war, sieges, monsters, ruins, prophecy, deep magic, factional
collapse** — every one is a legacy-only band with zero nudge-native content and zero
composition-complete content. The setting classes those bands would open in (`battlefield`,
`stronghold`, `ruin`, `arcane`) carry **one authored opening each**.

### 2c. The tension this assessment exists to name

The genre bar maps almost exactly onto systems the catalog marks **deferred**: `war`,
`factions`, `agent-magic`, `economy` — plus `omens` at middling. Read one way, the bar and
the maturity gate contradict each other and the epic content cannot be built yet.

**They do not contradict.** Catalog §7 is explicit that deferred systems *"may appear as
flavor, never as required mechanics."* The gate governs what an encounter may be
**built on**, not what it may be **about**. A siege encounter runs on `movement` +
`conditions` + `carryover` + `forks` + `items` — all mature — while the siege itself is the
scene. Nothing blocks epic subject matter today except that nobody has authored it.

That is an engineering reading of the catalog and it is the agent's call. What is *not* the
agent's call is the mix below.

---

## 3. Recommended target mix — for the director's ruling

Ranked. Each entry names the mature systems it rides and the gap it closes. Roughly 24
encounters, four to six batches.

| # | Category | Build | Rides (all mature) | Closes |
|---|---|---:|---|---|
| 1 | **Siege and the war-band** | 6 | movement, conditions, carryover, forks, items | no nudge-native combat; `battlefield` + `stronghold` at 1 opening each |
| 2 | **Ruins and the delve** | 5 | movement, items, traits, seeds | `ruin` at 1 opening; 23 legacy premises to draw from |
| 3 | **Monsters and the hunt** | 4 | conditions, items, cards, forks | the emptiest genre band; first real use of `conditions` |
| 4 | **Prophecy and the stars** | 3 | seeds, omens *(middling — one per batch)*, cards | `star` reach trails; 1 omen emitter in the game |
| 5 | **Deep magic and wards** | 3 | cards, traits, items | `arcane` at 1 opening; arcane as scene, never agent-magic |
| 6 | **Factional collapse** | 3 | forks, seeds, carryover | standing as *fiction*, not `standing` stakes (deferred) |

**Why siege first.** It is the largest genre gap, it opens the two setting classes that are
emptiest, and it is the band the director named first. It also forces the `conditions`
system into the corpus, which one template currently uses.

**Not in the mix, deliberately:** trade (32 legacy templates already — the corpus's fattest
band), camp chores (33, and the whole WS5 batch), and building/settlement. These are not
gaps.

**Running alongside:** THR-1130 retrofits the 15 nudge-era encounters to the contract. That
is repair, not portfolio growth, and it does not compete with this list for category choice.

---

## Last-reviewed

2026-08-29 — census refreshed (THR-1372, round-5 context-cleanup): composition-tier counts,
envelope count and the cast-token zero-claim were stale against the late-August batches;
each refreshed row now carries its membership predicate or measurement command so the next
refresh is a re-run, not a rewrite. Previous: 2026-08-24 — created (THR-1215). Census
machine-measured against `68226bdb`; target mix awaiting the director's ruling.
