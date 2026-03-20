# Benchmark Scenarios

This file defines the benchmark suite used for the audit. Scenarios are marked as:

- `Supported`: the current app can model the scenario directly
- `Partial`: the app can approximate the scenario, but important mechanics are missing or simplified
- `Unsupported`: the app cannot model the scenario credibly today

## Supported or Partial Benchmarks

| Scenario | User Question | Status | Oracle / Expected Result | Current Outcome |
| --- | --- | --- | --- | --- |
| Pre-seed SAFE with valuation cap | How much ownership does a post-money SAFE sell? | Supported | `$500k / $10M = 5%` ownership estimate | Exact match |
| Seed priced round | What ownership does a clean priced round imply? | Supported | `$3M / ($12M + $3M) = 20%` | Exact match |
| Series A ownership target | How much check is required to own 20%? | Supported | `(0.2 * 46.5M) / 0.8 = $11.625M` | Exact match |
| Multi-round dilution from seed to Series C | How does founder ownership drift under median rounds? | Partial | Deterministic benchmark path should show declining founder ownership and rising preferred ownership | Mechanically works, but uses stage medians rather than company-specific round planning |
| Option pool shuffle | How much dilution is created by a pre-money pool top-up? | Supported | `added_pool = (target * total - current_pool) / (1 - target)` | Exact match |
| SAFE vs capped note comparison | How do unpriced instruments differ? | Partial | SAFE should lock ownership; note should accrue interest and use best-of cap/discount | Supported for SAFE vs note, not SAFE cap vs discount SAFE |
| 1x non-participating liquidation preference | When does preferred convert? | Supported | Convert when as-converted proceeds exceed liquidation preference | Exact match in isolated single-series case |
| Return-the-fund shortcut | Can one company return the fund? | Partial | `fund_size / ownership_at_exit` | Exact for shortcut math, approximate versus real waterfall |
| Reserve strategy: pro rata vs no pro rata | Does pro rata deploy reserve capital? | Supported | Pro rata should use reserve; no-pro-rata should not | Exact match |
| AI startup higher valuation case | What does AI premium do to benchmark valuation? | Partial | AI overlay should mechanically raise pre-money vs standard | Exact mechanical uplift, weak broader realism |
| Slower non-AI startup case | How does a colder market affect path outcomes? | Partial | Bear + standard overlay should compress step-ups and worsen outcomes | Modeled through overlays, not through dedicated operating cadence assumptions |
| Cofounder equity split | How do multiple founders split the founder pool? | Supported | Individual founder rows and waterfall split should sum to the founder total | Works in cap-table and waterfall views |

## Unsupported or Severe-Gap Benchmarks

| Scenario | Why It Matters | Status | Audit Classification |
| --- | --- | --- | --- |
| Post-money SAFE vs discount SAFE comparison | YC supports distinct post-money safe forms | Unsupported | Severe coverage gap |
| Participating preferred | Common investor-friendly downside term in non-standard deals | Unsupported | Severe coverage gap |
| Down round with anti-dilution | Real down-round pain is path-dependent and often asymmetric | Unsupported | Severe coverage gap |
| Fund construction case for a seed fund | Return-the-fund logic is only half the VC story | Unsupported | Severe relevance gap |
| Power-law portfolio simulation | Venture outcomes are portfolio-shaped, not only company-shaped | Unsupported | Severe relevance gap |
| Exit waterfall with stacked preferred rounds | Multi-series exits require per-series seniority and conversion choices | Unsupported | Severe financial-model gap |

## Key Oracle Notes

### Pre-seed SAFE with valuation cap

- Formula: `ownership = purchase_amount / post_money_cap`
- Reference: YC post-money SAFE guide and Primer
- Current app result: exact match for ownership estimate

### Seed priced round

- Formula: `ownership = new_money / post_money`
- Current app result: exact match

### Option pool shuffle

- Formula: `added_pool = (target_pct * total_shares - current_pool) / (1 - target_pct)`
- Current app result: exact match

### Convertible note cap

- Formula:
  - `accrued = principal * (1 + interest_rate * months/12)`
  - `conversion_price = min(cap_price, discount_price)`
  - `issued_shares = accrued / conversion_price`
- Current app result: exact match in isolated benchmark

### 1x non-participating preference

- Formula: convert when `as_converted_share * exit_value > liquidation_preference`
- Important nuance: unissued option pool dilutes fully diluted ownership but does not participate in proceeds, so the true conversion threshold depends on participating shares, not fully diluted shares
- Current app result: exact in isolated single-series benchmark

## Scenarios That Expose Current Audit Findings

- Contradictory cash inputs: `currentRoundSize`, `investor.initialCheck`, `safe.investment`, and `note.principal` can diverge materially
- SAFE pre-financing exit: current app does not model SAFE liquidity event cash-out behavior
- Aggregate preferred conversion: current waterfall makes one election for the whole preferred stack
- Histogram labels: current Monte Carlo histograms use human-friendly labels that do not match the generated bucket edges
- Employee option outputs: underwater and exercise coverage labels do not match the implemented calculations
