# Venture Math Audit Test Plan

## Objective

Audit Venture Math Lab as a venture decision tool, not just a functioning web app. The test plan focuses on whether the product is mathematically correct, financially credible, venture-realistic, understandable, and shareable enough for founders, investors, executives, students, and board members.

## App Surface Under Test

- Frontend: Next.js app under `app/` and `components/`
- Deterministic finance engine: `lib/engines/deterministic-finance`
- Monte Carlo engine: `lib/engines/monte-carlo`
- Cap table and waterfall engine: `lib/engines/cap-table-waterfall`
- Scenario state and export schema: `lib/state/scenario-store.ts`, `lib/sim/types.ts`
- Existing tests: `tests/sim.test.ts`, `tests/deterministic-engines.test.ts`
- Added audit tests: `tests/invariants.test.ts`, `tests/audit-harness.test.ts`

## Product Claims To Test

Explicit and implicit claims identified from the codebase and UI:

- The app can model startup financing math across deterministic and Monte Carlo surfaces.
- The app can model priced rounds, post-money SAFEs, capped notes, dilution, option-pool refreshes, and 1x non-participating preferred.
- The app can compare founder, employee, and investor outcomes.
- The app can explain venture power-law behavior and step-up risk.
- The app can produce shareable outputs via scenario save/export.
- The app is relevant to executives, founders, investors, and educational users.

Each claim is tested against code, UI copy, outputs, and external market references.

## Test Streams

### 1. Mathematical Correctness

- Inspect deterministic formulas for post-money, ownership, required check, and required exit thresholds.
- Verify option-pool top-up formula independently.
- Verify SAFE and note conversion formulas independently.
- Verify waterfall conservation and conversion thresholds.
- Verify seeded Monte Carlo reproducibility.
- Verify ownership conservation across rounds.

### 2. Finance Correctness

- Check whether outputs reflect MOIC-style reasoning, liquidation preference behavior, and reserve deployment correctly.
- Test whether deterministic and Monte Carlo outputs use consistent capital inputs.
- Review whether employee option economics reflect the labels used in the UI.

### 3. Venture Realism

- Compare stage presets and scenario defaults to PitchBook-NVCA and Carta references.
- Compare founder dilution and cofounder split assumptions to Carta founder ownership data.
- Compare SAFE mechanics and liquidity behavior to Y Combinator documentation.
- Compare AI concentration and valuation premium assumptions to Carta and OECD references.
- Flag places where the math is internally valid but economically misleading.

### 4. UX and Explainability

- Review first-run clarity, input guidance, layout, and page structure.
- Evaluate whether formulas are inspectable and whether outputs are understandable without the code.
- Check whether uncertainty is explained honestly and whether the app distinguishes median from tail outcomes.

### 5. Output Quality and Shareability

- Review scenario export capabilities and schema quality.
- Check whether outputs are labeled with assumptions and can be copied into a memo or deck.
- Check whether chart labeling is numerically honest.

### 6. Robustness and Regression Safety

- Test edge-case clamping and invalid/extreme inputs.
- Extend test harness with invariants and benchmark oracles.
- Capture benchmark outputs in `testing/results`.

### 7. Performance and Accessibility

- Measure 10,000-iteration Monte Carlo runtime locally.
- Review code-level accessibility basics: labels, semantic tables, keyboard affordances, contrast/focus patterns, and chart accessibility limitations.

## Automated Coverage Added

- `tests/invariants.test.ts`
  - ownership sums to 100%
  - waterfall conserves exit value at the aggregate level
  - sanitization clamps extreme inputs
  - higher-iteration seed reproducibility
- `tests/audit-harness.test.ts`
  - benchmark-oracle tests for priced round, SAFE, note, option-pool shuffle, preference threshold, pro rata, AI overlay, Series A target ownership
  - Monte Carlo reproducibility and runtime measurement
  - artifact generation to `testing/results/benchmark-oracles.json` and `testing/results/performance.json`

## Semi-Automated Review Work

- Code inspection across routes, components, engines, tests, and schemas
- Manual UX/UI review based on implemented layouts and chart components
- Market calibration against external sources listed in `testing/results/market-benchmarks.json`
- Shareability review based on current export surfaces and generated outputs

## Known Environment Limits During Audit

- No browser automation stack such as Playwright is installed in the repo.
- Local HTTP probing was constrained by sandbox/network behavior, so route health evidence relies on successful production build output rather than browser-session screenshots.
- DNS resolution to the Render hostname failed in the current shell environment, so live deploy probing was not included in the automated artifact set.

## Evidence Artifacts

- `testing/results/benchmark-oracles.json`
- `testing/results/performance.json`
- `testing/results/market-benchmarks.json`
- `testing/results/verification-summary.md`

## Exit Criteria

The audit is complete when:

- formulas are independently checked where feasible
- benchmark scenario coverage is documented
- test artifacts are generated
- market references are recorded with source, metric, period, and benchmark type
- a final scorecard and launch-readiness verdict are written
