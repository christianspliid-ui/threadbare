# Economy and Consequence Second Pass — Design Brief

> **Date:** 2026-04-02
> **Status:** Design
> **Backlog:** TB-071, TB-017
> **Scope:** Economic ripples, prosperity shocks, scarcity pressure, chain reactions, fail-forward world consequences
> **Related:** `2026-03-17-gold-reach-economic-systems-design.md`, `2026-03-17-world-state-and-hex-actions-design.md`, `2026-03-31-social-systems-expansion-design.md`, `2026-04-02-agent-success-redesign-roadmap.md`, `2026-04-02-encounter-redesign-guidelines.md`, `2026-04-02-sovereignty-vs-consumption-design.md`

## Summary

The best next design move is not another isolated encounter pack. It is the layer that makes outcomes matter after the roll is over.

Right now the game has:

- encounters and actions
- rewards and penalties
- prosperity shocks
- unrest and magical saturation
- trade route concepts
- factions, attachments, and growing social systems

But these pieces are still too disconnected. A failed escort, a successful trade mission, a plague curse, or a festival blessing should not feel like local bookkeeping. They should leave behind a **world consequence trail**:

- markets get richer or poorer
- routes become safer or more dangerous
- settlements become hopeful, tense, or desperate
- rumors and favors open new opportunities
- scarcity and unrest alter what kinds of encounters appear next

This design brief combines the spirit of `TB-071` and `TB-017` into one system goal:

**Make success and failure propagate through the world in deterministic, inspectable, motivating ways.**

---

## Why This Comes First

This is the highest-leverage design item because it connects almost every major thread in the larger roadmap:

- fail-forward success/failure
- quintessence and spendable resilience
- encounter reward/penalty meaning
- unified actions
- economy and location state
- reputation and faction behavior
- later social systems like rumors, favors, and taverns

If the game learns to transform local outcomes into visible future state, then:

- failure stops feeling wasted
- rewards become more than item drops
- the world feels authored by play, not only by content seeding

---

## Design Goals

### Player-facing goals

- Success should create momentum, access, and visible improvement.
- Failure should create complications, damage, scarcity, or new pressure instead of dead air.
- Economic state should be legible through prose, location feel, encounter availability, and faction behavior.
- A hero’s actions should leave footprints in the world over a `2-3` hour run.

### System goals

- Local outcomes should feed world state through a small number of consistent channels.
- Consequences should be deterministic, traceable, and cheap to evaluate.
- Economic pressure should influence future encounter scoring and availability.
- The system should work for both positive and negative outcomes.

### Design guardrails

- Do not build a giant free-form simulation.
- Use a small vocabulary of consequences that combine well.
- Prefer decaying pressure over permanent clutter.
- Preserve inspectability for telemetry and debugging.

---

## Core Design Idea

Introduce a **Consequence Layer** between encounter/action resolution and long-lived world state.

Instead of each encounter directly mutating everything ad hoc, outcomes produce structured consequence payloads. Those payloads are then translated into:

- immediate local state changes
- medium-duration pressures
- possible chain reactions when thresholds are crossed

In other words:

`action or encounter outcome -> consequence packet -> world pressures and state shifts -> future opportunities and risks`

---

## The Four Consequence Channels

Most world-facing consequences should travel through one or more of these channels.

### 1. Prosperity

Economic health of a settlement or route-connected location.

Positive examples:

- caravan secured
- market deal completed
- guild investment succeeds
- harvest ritual succeeds

Negative examples:

- route raided
- extortion drains local wealth
- crop blight or corruption spreads
- repeated theft undermines trade confidence

### 2. Security / Risk

How safe a place or route feels for commerce and travel.

Positive examples:

- patrols established
- local threats cleared
- fortification completed
- monster lair reduced

Negative examples:

- repeated ambushes
- rumors of monsters or bandits
- faction rivalry intensifies
- failed escort exposes weakness

### 3. Social Tension

Local unrest, grievance, debt, rumor pressure, or faction hostility.

Positive examples:

- festival restores morale
- debt forgiven
- fair trade agreement signed
- leader resolves dispute cleanly

Negative examples:

- price gouging
- broken agreement
- starvation or scarcity
- curse blamed on local authority

### 4. Access / Opportunity

What future content becomes easier, harder, or newly available.

Positive examples:

- merchants arrive
- sponsorship opens better encounter pools
- grateful locals reveal a hidden site
- a faction starts issuing better quests

Negative examples:

- court closes to the disgraced
- ruined route suppresses trade scenes
- town becomes too fearful for normal commerce
- monopoly or corruption crowds out low-tier opportunities

---

## Consequence Packets

Each encounter or action outcome should be able to emit a small structured packet. This is the bridge between fail-forward design and world simulation.

### Proposed shape

```typescript
interface ConsequencePacket {
  sourceType: 'encounter' | 'action' | 'faction_action' | 'system';
  sourceId: string;
  actorId?: string;
  locationId?: string;
  routeId?: string;
  tick: number;

  prosperityDelta?: number;
  securityDelta?: number;
  unrestDelta?: number;
  scarcityDelta?: number;
  rumorDelta?: number;
  favorDelta?: number;
  reputationDelta?: number;

  tags?: string[];
  targetScope?: 'location' | 'route' | 'faction' | 'region';
}
```

This should stay intentionally small. The goal is not to encode every story fact, only the state changes that matter for downstream systems.

### Design rule

An authored encounter should usually emit **1-3 meaningful consequence deltas**, not 8 tiny ones.

Example:

- `Escort the Caravan` success:
  - `prosperityDelta +4`
  - `securityDelta +3`
  - `rumorDelta +1`
- `Escort the Caravan` failure:
  - `prosperityDelta -3`
  - `securityDelta -4`
  - `unrestDelta +2`

That is enough to make the future feel different without drowning the run in noise.

---

## Chain Reactions

Consequence packets do not need to directly author every downstream effect. Instead, a small deterministic trigger layer should watch for threshold crossings and state combinations.

### Principle

Chain reactions are not “random extra effects.” They are rule-based escalations when pressure becomes significant.

### Examples

#### Route collapse chain

- repeated raids push route security below threshold
- route volume decays faster
- prosperity at both ends drops
- desperation raises unrest
- unrest spawns more theft/extortion opportunities

#### Scarcity chain

- repeated resource disruption raises scarcity
- prices and social tension climb
- food aid / smuggling / grain monopoly encounters become more likely
- festival and relief actions become more valuable

#### Curse panic chain

- multiple harmful mystical outcomes land in one settlement
- rumor pressure rises
- unrest rises
- religious debate, blame, witch-hunt, or exorcism scenes become available

#### Growth chain

- successful trade + sponsorship + festival all land in one town
- prosperity crosses tier threshold
- new sublocation opportunities appear
- higher-status social and economic encounters unlock

---

## State Model Recommendation

Do not create a brand-new giant simulation subsystem. Build on the state the game already has or is already close to having.

### Keep and extend

- `prosperityShocks` on `GameState`
- location `prosperity`
- location `unrest`
- trade route volume and threat state
- attachment/effect system
- faction relations and sponsorship edges
- encounter availability/scoring hooks

### Add selectively

#### Location-level fields

- `economicSecurity` or `routeSecurity`
- `scarcity`
- `rumorHeat`

These should be simple bounded floats or `0-100` values, like prosperity and unrest.

#### Route-level fields

- `risk`
- `throughputPressure`
- `scarcityType` or dominant disrupted good

#### Faction-level fields later

- treasury or liquidity
- economic posture

That can wait until faction agency gets another pass.

---

## How This Supports Fail-Forward

This layer is the economic/social version of `success_at_cost`.

Instead of a failed encounter meaning “nothing,” it means:

- the hero still changed the world
- but the change came with damage, instability, or pressure

Examples:

### Failed relic hunt

Current flat version:

- no relic
- maybe a curse

Fail-forward world version:

- no relic
- local rumor heat increases
- rival treasure-seekers appear
- settlement prosperity dips if the expedition was publicly funded
- a recovery or blame encounter becomes available

### Hard-won caravan success

Current flat version:

- reward item

Fail-forward world version:

- caravan arrives
- prosperity improves
- route security still drops because of bloodshed
- injured survivors create aid scenes
- guild notices the hero

The important part is that both success and failure generate new texture.

---

## Economic Context Should Feed Future Encounters

This system is not complete if consequences only change background numbers. Those numbers must influence what the simulation offers next.

### Encounter availability modifiers

- high prosperity increases trade, sponsorship, festival, and luxury scenes
- high scarcity increases relief, smuggling, theft, extortion, and unrest scenes
- high security increases caravan, investment, and diplomacy scenes
- low security increases patrol, escort, ambush, and monster pressure scenes
- high rumor heat increases social and investigative scenes

### Scoring modifiers

- traders should seek prosperous, stable routes
- desperate agents should be pulled toward high-scarcity or high-unrest opportunities
- factions should respond to disruption where their interests are strongest

### Reward modifiers

- scarcity should shift some reward pools toward provisions, debts, favors, or cursed bargains
- prosperity should shift some pools toward tools, luxury goods, allies, or sponsorship

---

## Recommended Mechanical Vocabulary

To keep the system coherent, use a small shared vocabulary across content packs.

### Positive consequence tags

- `trade_secured`
- `market_boom`
- `festival_relief`
- `relief_delivered`
- `guild_backing`
- `route_cleared`

### Negative consequence tags

- `route_raided`
- `crop_loss`
- `scarcity_spike`
- `panic`
- `price_gouging`
- `broken_agreement`
- `curse_scare`

### Mixed / fail-forward tags

- `victory_with_damage`
- `costly_relief`
- `suspicious_windfall`
- `dangerous_patronage`
- `fragile_truce`

These tags are useful both for content authoring and for future trigger rules.

---

## Pacing Rules

This system must respect the run cadence. At roughly one encounter every five ticks, consequences cannot all be massive or permanent.

### Most common consequence duration

- `5-20` encounters of visible influence

### Medium consequences

- `20-60` encounters

### Major, identity-shaping consequences

- rare
- highly telegraphed
- often tied to thresholds or explicit high-tier content

### Design rule

The default consequence should create **temporary pressure or opportunity**, not permanent irreversible damage.

That preserves motivation across a full run.

---

## Example Scenarios

## 1. Bandit Pressure Loop

1. repeated ambush encounters fail or succeed at high cost
2. route risk rises
3. prosperity at nearby settlements weakens
4. unrest and scarcity begin to climb
5. merchants request escorts, militias recruit, thieves gain opportunities

This makes one bandit cluster feel like a living regional problem.

## 2. Rising Market Town

1. trade agreements succeed
2. a guild invests
3. a festival resolves unrest and boosts rumor heat positively
4. prosperity crosses a tier threshold
5. higher-tier social and commerce encounters unlock

This is how “innkeeper to goddess” gets a grounded civic middle game instead of only combat escalation.

## 3. Famine and Debt

1. harvest or relief encounters fail
2. scarcity spikes
3. unrest climbs
4. favors and debts become more common as social currencies
5. extortion, aid, black-market, and salvation scenes appear

This is where later social systems can plug in naturally.

---

## Integration With Future Backlog Work

This design intentionally sets up later items instead of competing with them.

### TB-095 / TB-096 / TB-099 social expansions

Rumors, favors, taverns, and deep social scenes become much stronger when locations can actually be tense, prosperous, desperate, celebratory, or panicked.

### TB-069 location NPCs

NPCs become carriers of scarcity, rumor, relief, and local economic identity.

### TB-032 pre-existing relationships

Existing debt, patronage, and faction ties become better initial inputs into this system.

### Reputation items TB-089 to TB-092

Economic and social consequences give reputations a stronger substrate.

---

## Recommended Implementation Order

This is a design brief, not a build plan, but the intended order is:

1. Finish phase-1 balance eval groundwork.
2. Add consequence packet design and telemetry support.
3. Expand prosperity shocks into a broader world-pressure model.
4. Add a small deterministic trigger layer for threshold crossings.
5. Feed economic/social state into encounter availability and scoring.
6. Then layer social information economy content on top.

That keeps the bigger roadmap intact:

- first observability
- then shared runtime foundations
- then richer world consequences
- then richer authored content

---

## Decision

Start with **economy and consequence propagation** before the broader social expansion.

Reason:

- it is the strongest multiplier on the success/failure redesign
- it gives rewards and penalties downstream meaning
- it prepares the ground for rumors, favors, taverns, parties, and faction agency
- it strengthens the whole run, not just one content slice

This should be the next major design front after the balance-eval foundation is stable enough to measure it.
