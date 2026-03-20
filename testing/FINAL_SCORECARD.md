# Final Scorecard

## Weighted Scores

| Category | Weight | Score (1-10) | Weighted Contribution | Rationale |
| --- | ---: | ---: | ---: | --- |
| Correctness | 20% | 6.0 | 1.20 | Core formulas are mostly right, but several outputs are materially inconsistent or mislabeled. |
| Mathematical accuracy | 15% | 6.5 | 0.98 | Deterministic math and several benchmark oracles match exactly; summary statistics and some heuristics are weaker. |
| Finance / venture realism | 15% | 5.0 | 0.75 | Stage presets are well-calibrated, but SAFE liquidity events, stacked preferred, fund construction, and anti-dilution realism are missing. |
| Relevance | 10% | 8.5 | 0.85 | It answers many founder/investor questions well, but analysts and fund-model users are underserved. |
| Ease of use | 10% | 7.0 | 0.70 | Guided inputs help, but contradictory fields and silent normalization create cognitive friction. |
| Context / explainability | 10% | 7.0 | 0.70 | Methodology and formula notes are helpful, but some outputs still imply more certainty than they deserve. |
| UI brilliance | 8% | 6.5 | 0.52 | Clean and intentional, but not yet premium enough for institutional presentation. |
| Output / shareability | 7% | 4.5 | 0.32 | JSON export exists, but there is no memo-grade or board-grade output surface. |
| Robustness | 3% | 6.0 | 0.18 | Invariants and build health are decent, but validation and unsupported edge cases remain weak. |
| Performance | 1% | 9.0 | 0.09 | 10,000-path Monte Carlo runs quickly on this machine. |
| Accessibility | 1% | 5.0 | 0.05 | Basic labels exist, but charts and focus/keyboard affordances are not strong enough. |

**Weighted overall score: 6.34 / 10**

## Additional Ratings

| Category | Score (1-10) |
| --- | ---: |
| Trustworthiness | 5.5 |
| Production readiness | 5.5 |
| Overall readiness | 6.3 |

## Verdict

**Classification: useful with caveats**

The app is credible as an educational and exploratory venture math tool for standard cases. It is not yet launchable as a high-trust venture decision engine for founders, investors, or boards because several outputs are either inconsistent, oversimplified, or insufficiently shareable.

## Top 10 Critical Flaws

1. Capital input fields are inconsistent and can drive contradictory outputs across engines.
2. SAFE holders receive effectively zero value in pre-financing exits, which conflicts with YC-style liquidity-event behavior.
3. The preferred stack is aggregated into one convert-or-stay decision, which breaks multi-series realism.
4. Employee underwater and exercise-coverage outputs do not match the implemented option math.
5. Monte Carlo histograms are labeled with ranges that do not match the generated buckets.
6. Strong acquisition outcomes are classified as `ipo` in the Monte Carlo outcome mix.
7. Deterministic note conversion uses the current post-money reference instead of the actual qualified-financing pre-money.
8. The app silently renormalizes cap-table percentages instead of forcing users to resolve contradictory inputs.
9. Export/shareability is weak: JSON only, no board-grade summary, CSV, or printable report.
10. Unsupported terms such as participating preferred, anti-dilution, and stacked waterfalls are not surfaced aggressively enough as hard limitations.

## Top 10 Highest-Leverage Improvements

1. Create a single canonical capital model so raise amount, investor check, SAFE size, and note principal cannot drift.
2. Model SAFE liquidity events explicitly using YC cash-out versus conversion logic.
3. Refactor waterfalls to support per-series preferred elections and seniority.
4. Correct employee option metrics and labels.
5. Replace fake histogram labels with true bucket boundaries and expose bucket math in the UI.
6. Add strong validation and explicit warnings for contradictory or economically impossible inputs.
7. Add board-grade shareable outputs: summary cards, printable report, CSV, PDF, and labeled charts.
8. Add a fund-construction / portfolio engine or explicitly narrow the product promise.
9. Add scenario support-status badges: `standard`, `approximate`, `unsupported`.
10. Add accessibility improvements for focus states, chart descriptions, and keyboard use.

## Top 5 Must Fix Before Launch

1. Resolve contradictory capital-input handling across all three engines.
2. Fix SAFE pre-financing exit behavior.
3. Fix mislabeled employee outputs and Monte Carlo outcome labels.
4. Replace misleading histogram bucket labels.
5. Add a clear, shareable output format with assumptions and limitations.

## Top 5 Wow-Factor Opportunities

1. Board-ready export that turns a scenario into a clean venture memo with assumptions and charts.
2. Interactive waterfall threshold chart that shows conversion breakpoints by series.
3. Learn mode with expandable formulas and plain-English “why this changed” explanations.
4. Portfolio/fund construction lab with concentration and return-the-fund analysis.
5. Scenario story mode that turns a simulation into founder, investor, and employee narratives.
