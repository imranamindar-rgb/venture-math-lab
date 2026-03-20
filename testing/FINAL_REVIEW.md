# Venture Math Lab Audit Review

## 1. Executive Summary

Venture Math Lab is a thoughtful early-stage venture finance product with real educational value. Its strongest qualities are:

- a clean three-engine architecture
- good baseline deterministic math
- clear stage presets tied to public market data
- fast simulation performance
- a useful cap-table / waterfall surface for standard terms

Its biggest problem is not raw code quality. The problem is trust calibration. Several outputs look more institutionally credible than they really are. The app is strongest when it behaves like an explainable teaching tool for standard venture math. It is weakest when it implies it can support board-grade or investment-memo-grade judgment without stronger validation, richer exports, and more realistic term modeling.

**Bottom line:** this is a promising educational beta and a useful internal sandbox. It is **not yet a high-trust venture decision engine**.

## 2. App Capabilities Found

Capabilities confirmed in the codebase:

- deterministic deal calculator
- Monte Carlo simulation for founder, employee, and investor outcomes
- cap-table and waterfall lab
- post-money SAFE and capped note modeling
- option-pool refresh and pro rata reserve logic
- comparison mode
- local scenario persistence
- JSON export/import
- cofounder equity split inputs

Capabilities not found:

- fund construction engine
- portfolio-level power-law simulation
- CSV / PDF / image export
- participating preferred
- anti-dilution
- stacked preferred series with separate conversion choices
- board-grade summary artifacts
- browser-level E2E harness

## 3. Testing Methodology

This audit combined:

- code inspection across all engines, routes, and UI components
- existing test review
- added benchmark-oracle and invariant tests
- local build/lint/test verification
- market calibration against public venture data sources
- structured UX, UI, output, robustness, and accessibility review

Automated evidence was generated in:

- `testing/results/benchmark-oracles.json`
- `testing/results/performance.json`

## 4. Market Benchmark Sources Used

All external benchmarks below were used explicitly in the audit.

| Source | Exact Metric Used | Period / Date | Benchmark Type | URL |
| --- | --- | --- | --- | --- |
| PitchBook-NVCA Venture Monitor | Median pre-money valuations by stage: pre-seed `$7.7M`, seed `$15.8M`, Series A `$46.5M`, Series B `$133.2M`, Series C `$307.0M`; median deal sizes by stage: `$0.5M`, `$3.8M`, `$14.0M`, `$32.4M`, `$56.5M` | As of September 30, 2025 | Hard benchmark | https://nvca.org/wp-content/uploads/2025/10/Q3-2025-PitchBook-NVCA-Venture-Monitor.pdf |
| Carta Founder Ownership Report 2025 | Founding-team ownership after seed `56.2%`, Series A `36.1%`, Series B `23.0%`; equal two-person founder splits `45.9%` in 2024 | Published January 21, 2025; data from 2015-2024 startups | Hard benchmark for dilution, contextual benchmark for cofounder split | https://carta.com/uk/en/data/founder-ownership/ |
| Carta State of Pre-Seed: Q3 2024 | `89%` of pre-priced investments structured as SAFEs; `87%` of those SAFEs were post-money; median post-money SAFE over prior year `$275k` at `$10M` cap | Published November 4, 2024 | Hard benchmark | https://carta.com/data/state-of-pre-seed-q3-2024/ |
| Y Combinator SAFE Financing Documents | Three US post-money SAFE forms; post-money ownership sold is immediately calculable; liquidity event cash-out vs conversion behavior | Docs page current as accessed March 20, 2026; User Guide / Primer version 1.1 | Hard legal-structure benchmark | https://www.ycombinator.com/documents.html |
| Carta State of Private Markets: 2025 in Review | AI Series A valuation premium `38%`; dilution from seed through Series C fell from about `18%` to `16%`; `$119.5B` raised across `4,859` rounds, indicating concentration into fewer rounds | Published February 18, 2026; 2025 review | Soft benchmark for current market dynamics | https://carta.com/data/state-of-private-markets-q4-2025/ |
| OECD: Venture capital investments in artificial intelligence through 2025 | AI made up `61%` of global VC investment in 2025 (`$258.7B` of `$427.1B`); AI mega deals comprised about `73%` of AI investment value | OECD 2026 brief using 2025 data | Hard benchmark for AI concentration context | https://www.oecd.org/en/publications/venture-capital-investments-in-artificial-intelligence-through-2025_a13752f5-en/full-report.html |

## 5. Scenario-by-Scenario Findings

| Scenario | Finding | Classification |
| --- | --- | --- |
| Pre-seed SAFE with cap | Ownership math matched the YC-style post-money formula exactly. | Exact match |
| Seed priced round | Clean post-money and ownership math matched exactly. | Exact match |
| Series A ownership target case | Required check for 20% ownership matched exactly. | Exact match |
| Multi-round dilution path | Directionally useful but benchmark-driven rather than company-driven. | Modeling-choice difference |
| Option pool shuffle | Pre-money pool top-up formula matched exactly. | Exact match |
| SAFE vs note | Distinct mechanics are present, but discount SAFE is not supported. | Modeling-choice difference |
| 1x non-participating preference | Single-series threshold behavior is correct in isolated benchmarks. | Exact match |
| Participating preferred | Not modeled at all. | Severe error for coverage |
| Down round with anti-dilution | Not modeled at all. | Severe error for coverage |
| Return-the-fund case | Shortcut formula works, but it is not a real waterfall-solved result. | Modeling-choice difference |
| Reserve strategy | Pro rata reserve deployment works in isolated benchmark. | Exact match |
| Fund construction case | Unsupported. | Severe error for relevance |
| Power-law portfolio simulation | Unsupported. | Severe error for relevance |
| AI startup premium | Mechanical valuation uplift works, but AI realism is too thin. | Modeling-choice difference |
| Slower non-AI startup | Only approximated through bear/standard overlays. | Modeling-choice difference |
| Stacked preferred waterfall | Unsupported. | Severe error for financial realism |

## 6. Math and Finance Correctness Findings

### High-Severity Findings

1. **Capital inputs are internally inconsistent.** The app allows `currentRoundSize`, `investor.initialCheck`, `safe.investment`, and `note.principal` to diverge, and different engines consume different fields. That can produce contradictory ownership, MOIC, and waterfall outputs.
2. **SAFE pre-financing exits are wrong.** The current app effectively gives SAFEs zero claim before conversion, which conflicts with YC’s documented liquidity-event structure.
3. **Preferred conversion is modeled as one aggregate election.** Real stacks require per-series conversion and seniority logic.

### Medium-Severity Findings

4. Deterministic note conversion uses the current post-money reference before the next qualified round is actually projected.
5. Return-the-fund and break-even exits are ownership shortcuts, not full waterfall-solved thresholds.
6. Prior preferred liquidation preference is inferred from ownership and reference post-money rather than from actual historical checks.
7. `recoveryRate` exists in the schema but is unused.

### Monte Carlo Findings

8. Strong acquisition paths are counted as `ipo`, which overstates IPO frequency in the outcome mix.
9. Histogram labels are numerically misleading because the bucket edges are dynamic but the labels are fixed strings.
10. `dilutionAttribution` is only a heuristic summary, not true attribution by source.

### Employee Option Findings

11. Employee underwater and exercise-coverage outputs do not match what their labels imply.
12. The exercise-cost model is heuristic and should not be presented as economically faithful option math.

## 7. UX Findings

### Strengths

- Input guidance is useful and plain-spoken.
- The three-engine split is a strong product architecture.
- The scenario builder feels approachable for advanced, non-technical users.

### Weaknesses

- Contradictory fields create hidden ambiguity.
- Silent normalization of cap-table percentages reduces trust.
- There is no strong indication of which scenarios are exact versus approximate.
- The compare page is too shallow to support serious board or partner review.

## 8. UI Brilliance Findings

### What works

- Warm visual palette and serif heading choice create a differentiated tone.
- Layout is clean and avoids generic SaaS blandness.
- Tables and cards are readable.

### What does not yet work

- Charts are visually acceptable but not premium or memo-grade.
- No legends for ownership lines; color-only interpretation is weak.
- No strong presentation mode, print mode, or branded report view.
- The interface still feels more like a polished prototype than an institutional analytics product.

## 9. Output / Shareability Findings

Current shareability is poor:

- JSON export only
- no CSV
- no PDF
- no board-summary view
- no assumption block attached to charts for screenshots
- no executive summary generated from scenario outputs

The current output is fine for internal exploration, not for external communication.

## 10. Bugs and Failures

1. Contradictory cash-input model across engines
2. SAFE pre-financing liquidity behavior missing
3. Single aggregate preferred conversion decision
4. Employee underwater and coverage metrics mislabeled
5. IPO/acquisition misclassification in Monte Carlo results
6. Misleading histogram bucket labels
7. Unused `recoveryRate`
8. Deterministic note conversion references the wrong financing anchor
9. Silent cap-table normalization
10. Live Render DNS was not resolvable in this shell environment, so deploy probing was not fully automated

## 11. Scorecard

See `testing/FINAL_SCORECARD.md`.

## 12. Launch Readiness Verdict

**Verdict: useful with caveats**

This app is not unsafe in the sense of “everything is wrong.” The dangerous part is subtler: it makes several simplified outputs look more authoritative than they are. For an educational product or internal sandbox, that is acceptable with good disclaimers. For founders making fundraising decisions or investors circulating analysis, it is not yet enough.

## 13. Must-Fix List

1. Unify capital inputs across the app.
2. Model SAFE liquidity-event behavior.
3. Fix employee option output labels and calculations.
4. Fix Monte Carlo outcome labeling and histogram bucket labeling.
5. Add a shareable summary/report surface with assumptions.

## 14. High-Leverage Improvements

1. Per-series preferred stack and waterfall engine
2. Scenario support badges and stronger limitations copy
3. Fund construction / portfolio layer
4. Learn mode with formula expansion and why-it-changed annotations
5. Export system for JSON + CSV + PDF / printable summary

## 15. Appendix

### Verification Summary

- `npm run lint`: passed
- `npm run test`: passed with 23 tests
- `npm run build`: passed
- 10,000-path Monte Carlo runtime on this machine: `92.4ms` first run, `50.33ms` second run

### Key Evidence Files

- `testing/results/benchmark-oracles.json`
- `testing/results/performance.json`
- `testing/results/market-benchmarks.json`
- `testing/results/verification-summary.md`
