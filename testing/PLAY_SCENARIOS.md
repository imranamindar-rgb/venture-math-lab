# Venture Math Play Scenarios

Use these scenarios after deployment if you want quick ways to pressure-test the app and build intuition.

## 1. Seed priced round baseline

Route:

- `/simulator`

Set:

- Current stage: `seed`
- Current round type: `priced preferred`
- Current pre-money valuation: `15,800,000`
- Current round size: `3,800,000`
- Investor initial check: `1,500,000`
- Number of cofounders: `2`
- Founder 1 equity: `45`
- Founder 2 equity: `22`
- Employee common ownership: `6`
- Unissued option pool: `14`
- Existing investor ownership: `13`

What to watch:

- deterministic `Current post-money`
- deterministic `Immediate ownership`
- simulator founder-below-20% and founder-below-10% odds
- cap-table modest exit versus breakout exit waterfall

Why it is useful:

- this is the cleanest standard case for understanding how the three engines line up

## 2. Pre-seed SAFE versus priced round

Route:

- `/compare`

Baseline:

- preset using a priced seed round

Comparison:

- same company but use `Post-money SAFE`
- SAFE post-money cap: `10,000,000`
- SAFE investment: `1,000,000`
- keep market and sector the same

What to watch:

- compare memo export
- ownership and return deltas
- support badge and assumptions shift cards

Why it is useful:

- helps answer when a SAFE is simpler versus when a priced round is clearer

## 3. High-valuation founder pain test

Route:

- `/simulator`

Set:

- Current stage: `seed`
- Current pre-money valuation: `30,000,000`
- Current round size: `4,000,000`
- Investor initial check: `1,000,000`
- Market overlay: `base`
- Sector overlay: `standard`

What to watch:

- deterministic `Break-even exit`
- deterministic `Return the fund`
- compare this against a more normal `15,800,000` pre-money case

Why it is useful:

- shows that a higher valuation can feel good for founders and still make future venture math much tighter

## 4. Down-round anti-dilution stress case

Route:

- `/simulator`
- `/cap-table`

Set:

- Current round type: `priced preferred`
- Anti-dilution mode: `broad weighted average`
- then compare against `full ratchet`
- Market overlay: `bear`
- Existing investor ownership: `20`
- Preferred participation: `non_participating`

What to watch:

- support status
- founder dilution thresholds
- cap-table waterfall changes in middling exits

Why it is useful:

- shows how investor protection terms can quietly shift common economics even without a massive exit

## 5. Operator survival versus financing ambition

Route:

- `/operator`

Set:

- Cash on hand: `2,500,000`
- Monthly burn: `350,000`
- Monthly revenue: `90,000`
- Monthly revenue growth: `0.05`
- Gross margin: `0.72`
- Target cash buffer months: `6`
- Transaction fees: `150,000`

What to watch:

- runway
- buffered gap
- post-close runway
- working capital and quick ratio

Why it is useful:

- shows that a company can look reasonable in venture terms but still be operationally fragile

## 6. Return-the-fund case

Route:

- `/calculator`
- `/fund`

Calculator side:

- set a round where the investor owns roughly `15% to 20%`

Fund side:

- Fund size: `60,000,000`
- Initial check size: `1,500,000`
- Follow-on check size: `2,000,000`
- Target ownership: `0.15`

What to watch:

- deterministic `Return the fund`
- fund `One company returns fund`
- top winner share
- top quartile probability

Why it is useful:

- connects company-level ownership to actual fund-level consequences

## 7. AI premium versus normal venture math

Route:

- `/compare`

Baseline:

- `standard` sector overlay

Comparison:

- `ai_premium` sector overlay

What to watch:

- valuation shift
- investor median outcome
- founder dilution and upside changes
- whether the AI premium creates better outcomes or just more fragile expectations

Why it is useful:

- good for understanding when AI pricing helps and when it simply raises the hurdle

## 8. Employee reality check

Route:

- `/simulator`

Set:

- Employee grant percent: `0.5`
- Employee strike price: `2.50`
- Current round type: `priced preferred`
- then compare against a richer SAFE-led case

What to watch:

- employee underwater probability
- worthless or illiquid probability
- gross value versus exercise coverage

Why it is useful:

- makes employee equity less abstract and shows why exit structure matters

## Best way to use the app

If you are exploring for intuition, use this order:

1. `/dashboard`
2. `/calculator`
3. `/simulator`
4. `/cap-table`
5. `/operator`
6. `/fund`
7. `/report`
8. `/compare`

That sequence moves from simple formulas to uncertainty, then to legal-economic payout, then to operating reality, and finally to whole-fund logic.
