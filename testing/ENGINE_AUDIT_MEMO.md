# Engine Audit Memo

This memo maps the core venture math engines to the exact TypeScript functions that implement them, with plain-English explanations of what each function is doing and what to audit.

## Scope

This covers:

1. Monte Carlo simulation engine
2. SAFE and convertible note conversion math
3. Liquidation waterfall logic
4. Related helpers that materially affect the outputs

## Recommended Audit Order

Read the code in this sequence:

1. [current-financing.ts](/Users/imranamindar/Documents/GPT_Coding/venture-math-lab/lib/current-financing.ts#L17)
2. [unpriced.ts](/Users/imranamindar/Documents/GPT_Coding/venture-math-lab/lib/engines/cap-table-waterfall/unpriced.ts#L8)
3. [rounds.ts](/Users/imranamindar/Documents/GPT_Coding/venture-math-lab/lib/engines/cap-table-waterfall/rounds.ts#L13)
4. [waterfall.ts](/Users/imranamindar/Documents/GPT_Coding/venture-math-lab/lib/engines/cap-table-waterfall/waterfall.ts#L169)
5. [index.ts](/Users/imranamindar/Documents/GPT_Coding/venture-math-lab/lib/engines/monte-carlo/index.ts#L134)

That order follows the logic flow:

- define current financing assumptions
- convert unpriced instruments
- issue priced rounds and anti-dilution adjustments
- distribute exit proceeds
- simulate many paths and summarize them

## 1. Current Financing Reference Logic

Primary file:

- [current-financing.ts](/Users/imranamindar/Documents/GPT_Coding/venture-math-lab/lib/current-financing.ts#L17)

### What this function does

`getCurrentFinancing(config)` produces the canonical interpretation of the current round.

It returns:

- total round raise
- modeled investor check
- syndicate check
- priced post-money
- reference post-money
- investor ownership estimate
- warnings when fields conflict

### Priced round logic

Relevant lines:

- [current-financing.ts:18](/Users/imranamindar/Documents/GPT_Coding/venture-math-lab/lib/current-financing.ts#L18)
- [current-financing.ts:22](/Users/imranamindar/Documents/GPT_Coding/venture-math-lab/lib/current-financing.ts#L22)

Formula:

```ts
const totalRoundRaise = Math.max(0, config.currentRoundSize);
const pricedPostMoney = config.currentPreMoney + totalRoundRaise;
const modeledInvestorCheck = Math.min(Math.max(0, config.investor.initialCheck), totalRoundRaise);
const investorOwnershipEstimate = pricedPostMoney > 0 ? modeledInvestorCheck / pricedPostMoney : 0;
```

Plain English:

- the full round size defines total dilution
- the modeled investor cannot invest more than the total round
- priced-round ownership estimate is simply modeled investor check divided by post-money

### Post-money SAFE logic

Relevant lines:

- [current-financing.ts:43](/Users/imranamindar/Documents/GPT_Coding/venture-math-lab/lib/current-financing.ts#L43)

Formula:

```ts
const modeledInvestorCheck = config.safe.enabled ? Math.max(0, config.safe.investment) : 0;
referencePostMoney = Math.max(config.safe.postMoneyCap, pricedPostMoney);
investorOwnershipEstimate = config.safe.postMoneyCap > 0
  ? modeledInvestorCheck / config.safe.postMoneyCap
  : 0;
```

Plain English:

- SAFE economics follow the SAFE investment amount, not the generic investor check field
- the app uses the SAFE post-money cap as the ownership anchor
- if the current round size differs from the SAFE check, the extra raise affects company runway but is not yet modeled as a separate SAFE holder

### Convertible note logic

Relevant lines:

- [current-financing.ts:80](/Users/imranamindar/Documents/GPT_Coding/venture-math-lab/lib/current-financing.ts#L80)

Formula:

```ts
const modeledInvestorCheck = config.note.enabled ? Math.max(0, config.note.principal) : 0;
const noteReferencePostMoney = config.note.preMoneyCap + totalRoundRaise;
referencePostMoney = Math.max(noteReferencePostMoney, pricedPostMoney);
investorOwnershipEstimate = noteReferencePostMoney > 0
  ? modeledInvestorCheck / noteReferencePostMoney
  : 0;
```

Plain English:

- the note principal is the capital at risk
- the note reference is built from cap plus current raise
- warnings are emitted when the note principal and generic investor check disagree

### What to audit here

1. Whether warnings appear whenever `investor.initialCheck` disagrees materially with SAFE or note economics.
2. Whether `referencePostMoney` should use `Math.max(...)` or whether that hides edge cases.
3. Whether the product copy clearly distinguishes:
   - priced post-money
   - SAFE cap reference
   - note cap reference

## 2. SAFE Conversion Math

Primary file:

- [unpriced.ts](/Users/imranamindar/Documents/GPT_Coding/venture-math-lab/lib/engines/cap-table-waterfall/unpriced.ts#L8)

### Core function

`maybeConvertSafe(snapshot, config)`

Formula:

```ts
const existingShares = getFullyDilutedShares(snapshot);
const ownershipTarget = snapshot.safePostMoneyCap > 0
  ? snapshot.safeOutstanding / snapshot.safePostMoneyCap
  : 0;
const issuedShares = (ownershipTarget * existingShares) / (1 - ownershipTarget);
```

Plain English:

- first compute the SAFE holder's target ownership from investment divided by post-money cap
- then solve for how many new shares must be issued so that:
  - new shares / (existing shares + new shares) = target ownership

Equivalent algebra:

```text
issuedShares / (existingShares + issuedShares) = ownershipTarget

issuedShares = ownershipTarget * (existingShares + issuedShares)
issuedShares - ownershipTarget * issuedShares = ownershipTarget * existingShares
issuedShares * (1 - ownershipTarget) = ownershipTarget * existingShares
issuedShares = (ownershipTarget * existingShares) / (1 - ownershipTarget)
```

### How the conversion is recorded

Relevant lines:

- [unpriced.ts:17](/Users/imranamindar/Documents/GPT_Coding/venture-math-lab/lib/engines/cap-table-waterfall/unpriced.ts#L17)

The SAFE is added as a preferred series with:

- `shares = issuedShares`
- `liquidationPreference = snapshot.safeOutstanding`
- preferred terms inherited from current preferred config
- new seniority rank

Then:

```ts
snapshot.safeOutstanding = 0;
```

### Important modeling choice

This is modeling the SAFE as a post-money ownership contract.

That means:

- dilution falls on existing holders
- the SAFE is translated into a new preferred series at conversion
- after conversion, it participates in the waterfall according to configured preferred terms

### What to audit here

1. Whether a post-money SAFE should inherit the same participation and liquidation settings as the current preferred config.
2. Whether SAFE seniority should always be `getNextPreferredSeniority(snapshot)`.
3. Whether pre-conversion SAFE downside treatment in the waterfall matches the intended legal approximation.

## 3. Convertible Note Conversion Math

Primary file:

- [unpriced.ts](/Users/imranamindar/Documents/GPT_Coding/venture-math-lab/lib/engines/cap-table-waterfall/unpriced.ts#L34)

### Core function

`maybeConvertNote(snapshot, config, qualifiedPreMoney, monthsElapsed)`

### Step 1: Accrue interest

Formula:

```ts
const accruedPrincipal =
  snapshot.noteOutstanding * (1 + config.note.interestRate * (monthsElapsed / 12));
```

Plain English:

- this is simple interest, not compounding interest
- elapsed months are converted to years

### Step 2: Compute candidate conversion prices

Formula:

```ts
const fullyDilutedShares = getFullyDilutedShares(snapshot);
const roundPricePerShare = qualifiedPreMoney / fullyDilutedShares;
const capPricePerShare = config.note.preMoneyCap / fullyDilutedShares;
const discountPricePerShare = roundPricePerShare * (1 - config.note.discountRate);
const conversionPrice = Math.min(capPricePerShare, discountPricePerShare);
```

Plain English:

- round price per share is based on the qualified financing pre-money
- cap price per share is based on the note cap
- discount price per share is based on the qualified round price reduced by discount
- the note converts at the lower of cap price and discount price

### Step 3: Compute conversion shares

Formula:

```ts
const issuedShares = accruedPrincipal / conversionPrice;
```

Plain English:

- accrued principal buys as many shares as it can at the better conversion price

### Step 4: Record as preferred

Relevant lines:

- [unpriced.ts:54](/Users/imranamindar/Documents/GPT_Coding/venture-math-lab/lib/engines/cap-table-waterfall/unpriced.ts#L54)

The note becomes a preferred series with:

- `liquidationPreference = accruedPrincipal`
- `referencePricePerShare = conversionPrice`
- preferred terms inherited from current preferred config

### What to audit here

1. Whether note interest should be simple or compounded for the intended use case.
2. Whether `qualifiedPreMoney / fullyDilutedShares` is the intended round price basis.
3. Whether the note should inherit the same seniority and participation settings as the new preferred round.

## 4. Anti-Dilution and Future Round Issuance

Primary file:

- [rounds.ts](/Users/imranamindar/Documents/GPT_Coding/venture-math-lab/lib/engines/cap-table-waterfall/rounds.ts#L13)

### Anti-dilution logic

Function:

- [rounds.ts:13](/Users/imranamindar/Documents/GPT_Coding/venture-math-lab/lib/engines/cap-table-waterfall/rounds.ts#L13)

#### Full ratchet

Formula:

```ts
if (series.antiDilutionMode === "full_ratchet") {
  newConversionPrice = pricePerShare;
}
```

Plain English:

- if the new round is priced below the old reference price, the old series is repriced all the way down to the new round price

#### Broad weighted average

Formula:

```ts
const numerator = preRoundShares + roundSize / oldPrice;
const denominator = preRoundShares + issuedShares;
newConversionPrice = denominator > 0 ? oldPrice * (numerator / denominator) : oldPrice;
```

Plain English:

- this approximates broad-based weighted-average anti-dilution
- it softens the conversion-price reset relative to full ratchet

#### Extra anti-dilution shares

Formula:

```ts
const ratioLift = newConversionPrice > 0 ? oldPrice / newConversionPrice : 1;
const extraShares = Math.max(0, series.shares * (ratioLift - 1));
```

Plain English:

- if the conversion price is lowered, the series becomes entitled to more as-converted shares
- the share increase is proportional to how much the conversion ratio improved

### New round issuance

Function:

- [rounds.ts:122](/Users/imranamindar/Documents/GPT_Coding/venture-math-lab/lib/engines/cap-table-waterfall/rounds.ts#L122)

#### Core priced round math

Formula:

```ts
const preRoundShares = getFullyDilutedShares(snapshot);
const pricePerShare = preMoney / preRoundShares;
const issuedShares = roundSize / pricePerShare;
```

Plain English:

- pre-money divided by pre-round fully diluted shares gives round price per share
- round size divided by price per share gives shares issued in the new round

#### Pro rata follow-on

Formula:

```ts
const investorExistingPct = getInvestorOwnership(snapshot);
const targetFollowOnShares = config.investor.proRata ? issuedShares * investorExistingPct : 0;
const targetFollowOnCash = targetFollowOnShares * pricePerShare;
```

Plain English:

- if pro rata is on, the modeled investor tries to buy enough of the new round to maintain their existing percentage

#### Reserve cap

Formula:

```ts
const reserveCap = financing.modeledInvestorCheck * config.investor.reserveMultiple;
const reserveRemaining = Math.max(
  0,
  reserveCap - Math.max(0, snapshot.modeledInvestorInvested - financing.modeledInvestorCheck),
);
const actualFollowOnCash = Math.min(targetFollowOnCash, reserveRemaining);
```

Plain English:

- the modeled investor cannot deploy more reserve capital than the configured reserve multiple allows
- actual follow-on cash is limited by remaining reserves

### What to audit here

1. Whether anti-dilution is intentionally approximate or meant to mimic NVCA language more tightly.
2. Whether pro rata should be based on current ownership after or before certain conversions.
3. Whether reserve cap should be pegged to initial modeled check or a broader fund-level budget.

## 5. Liquidation Waterfall

Primary file:

- [waterfall.ts](/Users/imranamindar/Documents/GPT_Coding/venture-math-lab/lib/engines/cap-table-waterfall/waterfall.ts#L169)

This is the core exit proceeds engine.

## 5.1 SAFE downside payout helper

Helper:

- [waterfall.ts:3](/Users/imranamindar/Documents/GPT_Coding/venture-math-lab/lib/engines/cap-table-waterfall/waterfall.ts#L3)

Formula:

```ts
const safeAsConvertedValue =
  snapshot.safeOutstanding > 0 && snapshot.safePostMoneyCap > 0
    ? remaining * (snapshot.safeOutstanding / snapshot.safePostMoneyCap)
    : 0;
return Math.min(remaining, Math.max(snapshot.safeOutstanding, safeAsConvertedValue));
```

Plain English:

- before a SAFE is converted, the engine compares:
  - the SAFE principal
  - the SAFE's implied as-converted share of remaining exit proceeds
- then it pays the better of the two, capped by remaining cash

This is an approximation of downside SAFE treatment, not a charter-specific legal implementation.

## 5.2 Preference allocation by seniority

Helper:

- [waterfall.ts:11](/Users/imranamindar/Documents/GPT_Coding/venture-math-lab/lib/engines/cap-table-waterfall/waterfall.ts#L11)

Formula:

```ts
const layerPreference = layer.reduce(
  (total, entry) => total + entry.liquidationPreference * entry.liquidationMultiple,
  0,
);
const layerPayout = Math.min(remaining, layerPreference);
```

Plain English:

- preferred series are grouped by seniority rank
- each seniority layer is paid before the next
- within a layer, payout is allocated pro rata to liquidation preference size

## 5.3 Conversion-set solver

Helpers:

- [waterfall.ts:46](/Users/imranamindar/Documents/GPT_Coding/venture-math-lab/lib/engines/cap-table-waterfall/waterfall.ts#L46)
- [waterfall.ts:84](/Users/imranamindar/Documents/GPT_Coding/venture-math-lab/lib/engines/cap-table-waterfall/waterfall.ts#L84)

This is the most important part of the waterfall.

### How it works

The engine:

1. enumerates all combinations of non-participating preferred series converting or not converting
2. evaluates each combination
3. checks whether any single series would prefer a different choice
4. keeps only stable combinations
5. if several stable combinations exist, chooses the one with the greatest converted-share base

Core logic:

```ts
const totalCombos = 1 << convertible.length;

for (let mask = 0; mask < totalCombos; mask += 1) {
  ...
  const evaluation = getEvaluation(set);
  ...
  const alternative = getEvaluation(altSet).seriesPayouts.find((item) => item.id === entry.id)?.payout ?? 0;
  if (alternative > current + 1e-6) {
    stable = false;
    break;
  }
}
```

Plain English:

- this is a brute-force equilibrium search over non-participating preferred conversion decisions
- a set is stable only if no individual convertible series would earn more by flipping its own decision

### Why this matters

This avoids forcing one aggregate convert-or-stay decision across the full preferred stack.

Each non-participating series can choose independently, which is closer to actual economics.

## 5.4 Final waterfall assembly

Main function:

- [waterfall.ts:169](/Users/imranamindar/Documents/GPT_Coding/venture-math-lab/lib/engines/cap-table-waterfall/waterfall.ts#L169)

Order of operations:

1. pay notes
2. pay SAFE downside claim
3. solve preferred conversion and preference allocation
4. compute common share price
5. compute founder, employee, investor, prior-investor, and secondary-common payouts

Core logic:

```ts
let remaining = exitValue;
const notePayout = Math.min(remaining, snapshot.noteOutstanding);
remaining -= notePayout;
const safePayout = getSafePayout(snapshot, remaining);
remaining -= safePayout;

const evaluation = chooseStableConversionSet(snapshot, remaining);
const founderPayout = snapshot.founderCommon * evaluation.commonPrice;
const employeeGrossPayout = snapshot.employeeCommon * evaluation.commonPrice;
const employeeNetPayout = Math.max(0, employeeGrossPayout - employeeExerciseCost);
```

### Investor payout composition

Formula:

```ts
const investorPreferredPayout = seriesPayouts
  .filter((entry) => entry.ownerGroup === "modeled")
  .reduce((total, entry) => total + entry.totalPayout, 0);

const investorPayout = investorPreferredPayout + notePayout + safePayout;
```

Plain English:

- modeled investor proceeds include:
  - any modeled preferred series owned by that investor
  - note payout if the modeled instrument is still outstanding
  - SAFE payout if the modeled instrument is still outstanding

### Important presentation caution

The engine tracks payout buckets that are not always all shown together in the UI:

- `notePayout`
- `safePayout`
- `priorInvestorPayout`
- `investorPayout`
- `founderPayout`
- `employeeGrossPayout`
- `employeeNetPayout`
- `secondaryCommonPayout`

So a UI can look non-conserving even when the engine is conserving value, if it omits one of those buckets or mixes gross and net employee treatment.

## 6. Monte Carlo Path Engine

Primary file:

- [index.ts](/Users/imranamindar/Documents/GPT_Coding/venture-math-lab/lib/engines/monte-carlo/index.ts#L134)

### Path simulation function

Function:

- [index.ts:134](/Users/imranamindar/Documents/GPT_Coding/venture-math-lab/lib/engines/monte-carlo/index.ts#L134)

This simulates one company path.

### Step 1: Initialize state

Key lines:

- [index.ts:135](/Users/imranamindar/Documents/GPT_Coding/venture-math-lab/lib/engines/monte-carlo/index.ts#L135)

What happens:

- create deterministic RNG from `seed + iteration`
- compute current financing
- create initial cap table snapshot
- initialize current post-money, stage index, reserve usage, and flags

### Step 2: Walk stage by stage

Key lines:

- [index.ts:154](/Users/imranamindar/Documents/GPT_Coding/venture-math-lab/lib/engines/monte-carlo/index.ts#L154)

At each future stage:

- add months to next round
- compute failure probability with market and step penalty
- compute early exit probability
- sample one of three events:
  - fail
  - exit
  - raise

Formula:

```ts
const failureProbability = clamp(stagePreset.failureProbability * market.failure + stepPenalty, 0.05, 0.75);
const earlyExitProbability = clamp(stagePreset.earlyExitProbability, 0.04, 0.22);
const event = pickWeighted(rng, [
  { value: "fail", weight: failureProbability },
  { value: "exit", weight: earlyExitProbability },
  { value: "raise", weight: Math.max(0.1, 1 - failureProbability - earlyExitProbability) },
]);
```

Plain English:

- fragile paths become more failure-prone if step-up quality is poor
- the model enforces a minimum raise probability

### Step 3: If the company fails

Key lines:

- [index.ts:169](/Users/imranamindar/Documents/GPT_Coding/venture-math-lab/lib/engines/monte-carlo/index.ts#L169)

Formula:

```ts
exitValue = currentPostMoney * randomBetween(rng, 0, 0.12);
```

Plain English:

- a shutdown is not always zero
- the model allows weak salvage value up to 12% of current post-money

### Step 4: If the company exits early

Key lines:

- [index.ts:176](/Users/imranamindar/Documents/GPT_Coding/venture-math-lab/lib/engines/monte-carlo/index.ts#L176)

Formula:

```ts
exitValue =
  currentPostMoney *
  randomBetween(rng, strong ? 1.3 : 0.45, strong ? 7.5 : 1.4) *
  market.exit *
  sectorOverlayMultipliers[config.sectorOverlay].exit;
```

Plain English:

- early exits are sampled as modest or strong acquisitions
- exit scale depends on current post-money and overlay multipliers

### Step 5: If the company raises

Key lines:

- [index.ts:188](/Users/imranamindar/Documents/GPT_Coding/venture-math-lab/lib/engines/monte-carlo/index.ts#L188)

What happens:

1. sample next round terms
2. optionally refresh the option pool
3. convert note if still outstanding
4. convert SAFE if still outstanding
5. issue preferred round
6. possibly apply secondary liquidity
7. append ownership point and round record

This is where the cap table engine and simulation engine meet.

### Step 6: Terminal exit if no explicit fail or early exit happened

Helper:

- [index.ts:41](/Users/imranamindar/Documents/GPT_Coding/venture-math-lab/lib/engines/monte-carlo/index.ts#L41)

Bucket weights:

- shutdown: 33%
- modest acquisition: 29%
- strong acquisition: 21%
- IPO-scale: 12%
- outlier: 5%

Then the model samples a multiple within each bucket and multiplies by current post-money.

### Step 7: Apply waterfall and compute investor return metrics

Key lines:

- [index.ts:250](/Users/imranamindar/Documents/GPT_Coding/venture-math-lab/lib/engines/monte-carlo/index.ts#L250)

Formula:

```ts
const waterfall = computeWaterfall(snapshot, exitValue, employeeExerciseCost, config.preferred);
const investorProceeds = waterfall.investorPayout;
const investorMoic = snapshot.modeledInvestorInvested > 0
  ? investorProceeds / snapshot.modeledInvestorInvested
  : 0;
const investorIrr = investorMoic > 0 ? Math.pow(investorMoic, 1 / yearsElapsed) - 1 : -1;
```

Plain English:

- every path ends in a full waterfall
- investor MOIC and IRR are path-specific outputs, not separate shortcut calculations

## 7. Monte Carlo Summary Builder

Primary file:

- [index.ts:299](/Users/imranamindar/Documents/GPT_Coding/venture-math-lab/lib/engines/monte-carlo/index.ts#L299)

### What this function does

`buildSummary(config, paths)` converts the raw path list into:

- stakeholder summaries
- threshold probabilities
- outcome mix
- dilution attribution
- histograms
- warnings
- sample paths

### Important outputs

#### Mean vs median spread

Formula:

```ts
const meanInvestor = investorValues.reduce((sum, value) => sum + value, 0) / (investorValues.length || 1);
const medianInvestor = median(investorValues);
meanVsMedianSpread = medianInvestor === 0 ? 0 : meanInvestor / Math.max(1, medianInvestor);
```

Plain English:

- if mean materially exceeds median, the simulation is being carried by the tail

#### Founder thresholds

Formula:

```ts
toProbability("Founder below 50%", ...)
toProbability("Founder below 20%", ...)
toProbability("Founder below 10%", ...)
```

Plain English:

- these are path frequencies, not deterministic milestones

#### Investor thresholds

Formula:

```ts
toProbability("1x+", ...)
toProbability("3x+", ...)
toProbability("10x+", ...)
toProbability("25x+", ...)
```

Plain English:

- these are hit-rate outputs from the full simulation

## 8. Public Monte Carlo Entry Point

Primary file:

- [index.ts:454](/Users/imranamindar/Documents/GPT_Coding/venture-math-lab/lib/engines/monte-carlo/index.ts#L454)

Function:

```ts
export function runMonteCarlo(input: ScenarioConfig): SimulationSummary {
  const config = sanitizeScenario(input);
  const paths = Array.from({ length: config.controls.iterations }, (_, index) => simulatePath(config, index));
  return buildSummary(config, paths);
}
```

Plain English:

- sanitize the scenario
- run `simulatePath` once per iteration
- summarize the resulting path array

## 9. Specific Audit Questions Worth Answering

If you are auditing line by line, these are the best high-value questions:

1. Does `getCurrentFinancing` define one unambiguous source of truth for priced, SAFE, and note cases?
2. Does the SAFE conversion formula match post-money SAFE ownership mechanics?
3. Does the note conversion correctly choose the better of cap and discount?
4. Does anti-dilution behave as intended for broad weighted average versus full ratchet?
5. Does the waterfall conserve value when every bucket is included, including:
   - notes
   - SAFE
   - prior preferred
   - modeled investor preferred
   - founders
   - employees
   - secondary common
6. Is employee exercise cost meant to reduce only net employee proceeds, or should it also change how the UI reconciles total exit value?
7. Is the simulation's path structure intentionally using:
   - stage-specific failure rates
   - step-up penalties
   - weighted exit buckets
   - market and sector overlays
8. Are the current warning strings strong enough where the modeling is approximate rather than standard?

## 10. Short Version

If you only want the three most important code entrypoints:

- Monte Carlo engine: [index.ts:134](/Users/imranamindar/Documents/GPT_Coding/venture-math-lab/lib/engines/monte-carlo/index.ts#L134)
- SAFE conversion: [unpriced.ts:8](/Users/imranamindar/Documents/GPT_Coding/venture-math-lab/lib/engines/cap-table-waterfall/unpriced.ts#L8)
- Liquidation waterfall: [waterfall.ts:169](/Users/imranamindar/Documents/GPT_Coding/venture-math-lab/lib/engines/cap-table-waterfall/waterfall.ts#L169)

Those three functions are the fastest way to understand how the app actually thinks.
