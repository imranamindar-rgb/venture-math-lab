# Release Hardening Checklist

This checklist consolidates the external review panels, live-app criticism, and internal audit findings into one release gate.

Status meanings:

- `BLOCKER`: must be fixed before public release
- `PENDING`: real gap, but not release-blocking by itself
- `VALIDATE`: criticism may be correct, but needs code-level confirmation
- `ALREADY ADDRESSED`: current code already handles it; improve visibility or docs if needed
- `FIXED LOCALLY`: code has been changed locally and must still pass validation and deployment

## Release Gate

Do not redeploy as a public-ready product until:

1. every `BLOCKER` is closed
2. no `VALIDATE` item remains unresolved
3. the trust checks pass:
   - waterfall reconciliation visible and correct
   - ownership sums to 100%
   - report renders deterministically
   - compare view shows real deltas
   - founder SAFE/note flows are not labeled approximate without a justified scope note
4. first-run onboarding passes:
   - the product leads with answers, not a full expert input wall
   - Quick mode is the visible default path for founders
   - Fund Lab defaults and presets do not imply a structurally broken seed-fund lesson without explanation

## Confirmed And Likely Blockers

| ID | Item | Status | Notes |
|---|---|---|---|
| RH-01 | Cap-table waterfall cards mixed holder totals with instrument subtotals, making the UI appear to create money | `FIXED LOCALLY` | The card showed modeled investor total alongside SAFE and note subtotals. Also mixed exit proceeds with previously realized secondary. Fixed in cap-table summary/UI; validate on live deploy. |
| RH-02 | Waterfall reconciliation is not explicit enough in the UI | `FIXED LOCALLY` | The UI now shows exit value, allocated waterfall cash, and difference. Validate on live deploy and screenshot review. |
| RH-03 | Fund Lab defaults teach an under-diversified seed fund by accident | `FIXED LOCALLY` | Defaults and presets were changed to a more credible standard-seed baseline; still validate that framing is prominent enough. |
| RH-04 | Post-money SAFE dilution source is not taught clearly enough | `FIXED LOCALLY` | SAFE dilution bridge now lives on the cap-table page; validate clarity with founder-first review. |
| RH-05 | Report page is too fragile on direct load and can appear stuck on “Preparing report…” | `FIXED LOCALLY` | Report now accepts self-contained share links and direct URL loads instead of depending only on saved local state. |
| RH-06 | Compare page is not decision-grade yet | `FIXED LOCALLY` | Compare now has a decision matrix, scenario deltas, and saved-scenario loading. Validate UX quality on live deploy. |
| RH-07 | Quick / Standard / Advanced input disclosure is missing | `FIXED LOCALLY` | Scenario editor now supports Quick, Standard, Advanced, and Legal modes. |
| RH-08 | Monte Carlo tail distribution is still bucketed rather than true Pareto-style | `FIXED LOCALLY` | Terminal exits now use a continuous Pareto-style tail with visible `paretoAlpha` control. Validate calibration quality on live review. |
| RH-09 | `chooseStableConversionSet` is exponential in the number of convertible series | `FIXED LOCALLY` | Replaced with an iterative conversion solver. Validate correctness under multi-series cases. |
| RH-09A | The app still leads with too much model structure before the first answer | `FIXED LOCALLY` | Calculator, simulator, cap-table, operator, dashboard, and fund flows now render answer-first surfaces before exposing the expert controls. Validate with live founder-first UX review. |

## High-Priority Product Gaps

| ID | Item | Status | Notes |
|---|---|---|---|
| RH-10 | Scenario library with create / rename / duplicate / compare / export | `PENDING` | Needed for serious use and reproducibility. |
| RH-11 | Fund Lab presets | `FIXED LOCALLY` | Micro, standard seed, Series A, and growth presets now exist. Validate that they are discoverable enough for first-run users. |
| RH-12 | Return-the-fund needs denominator context | `PENDING` | Show fund size and ownership assumption inline. |
| RH-13 | Dashboard needs guided teaching path | `PENDING` | Good pedagogy exists, but still reads like a handout instead of a guided flow. |
| RH-14 | “What do I take home?” founder view | `FIXED LOCALLY` | Calculator now includes a custom exit-value take-home panel for founder, employee, modeled investor, and prior investors. |
| RH-15 | Term-sheet A/B comparison | `FIXED LOCALLY` | Compare now renders founder-net and investor-proceeds A/B curves across deterministic exit values. |
| RH-16 | Confidence intervals / convergence diagnostics | `FIXED LOCALLY` | Batch-estimated 95% confidence intervals are now visible in simulation and report surfaces. |
| RH-17 | Fixed random seed control visible in UI/export | `FIXED LOCALLY` | Seed is visible in advanced controls and report output. Validate whether the UI prominence is sufficient. |
| RH-18 | CSV export should include full parameter state and simulation metadata | `FIXED LOCALLY` | CSV now includes flattened scenario parameter state plus simulation metadata. |
| RH-19 | J-curve / DPI timeline in Fund Lab | `FIXED LOCALLY` | Fund Lab now includes a median DPI/TVPI/paid-in timeline chart. |
| RH-20 | Assumption provenance and benchmark citations in-product | `FIXED LOCALLY` | Methodology now includes calibration references and limitations; still validate whether they are prominent enough. |

## Modeling And Finance Accuracy Items

| ID | Item | Status | Notes |
|---|---|---|---|
| RH-21 | SAFE and note ownership still described as forward-estimated in core founder workflows | `FIXED LOCALLY` | Founder-facing flows now pair current estimates with explicit shadow-series conversion bridges and clearer scope notes. Validate wording quality on live review. |
| RH-22 | Discount SAFE support is missing | `PENDING` | Real gap. Current app supports post-money cap SAFE, not all SAFE variants. |
| RH-23 | SAFE pre-financing liquidity-event handling needs exact YC-style treatment | `PENDING` | Improved already, but still not strong enough to call authoritative. |
| RH-24 | Note conversion needs more explicit audit trail in UI | `PENDING` | Math exists; explanation and bridge are weak. |
| RH-25 | Option-pool shuffle needs explicit founder-dollar illustration | `FIXED LOCALLY` | Calculator now shows founder ownership and dollar delta for pre-money vs post-money pool treatment. |
| RH-26 | Share-count rounding / integer enforcement | `FIXED LOCALLY` | Core finance math now quantizes dollars to cents and shares to microshares; still analytical rather than system-of-record precision. |
| RH-27 | Broad weighted average anti-dilution formula | `ALREADY ADDRESSED` | Present in [rounds.ts](/Users/imranamindar/Documents/GPT_Coding/venture-math-lab/lib/engines/cap-table-waterfall/rounds.ts#L13). Needs better documentation, not reinvention. |
| RH-28 | Liquidation preference by seniority | `ALREADY ADDRESSED` | Present in [waterfall.ts](/Users/imranamindar/Documents/GPT_Coding/venture-math-lab/lib/engines/cap-table-waterfall/waterfall.ts#L11). |

## Criticisms That Need To Be Treated Carefully

These should stay on the list, but not be accepted blindly.

| ID | Item | Status | Notes |
|---|---|---|---|
| RH-29 | “Main-thread lockup because `runMonteCarlo` is synchronous” | `ALREADY ADDRESSED` | The app already uses a Web Worker in [useSimulationRunner.ts](/Users/imranamindar/Documents/GPT_Coding/venture-math-lab/components/simulator/useSimulationRunner.ts#L13). The fallback path is synchronous only if worker creation fails. Improve visibility and progress reporting, but do not treat as unfixed architecture. |
| RH-30 | “Post-money SAFE should always convert at min(cap, round price)” | `VALIDATE` | This criticism is not obviously correct for the currently supported cap-only post-money SAFE. Need instrument-specific legal review before changing math. |
| RH-31 | “Waterfall engine itself creates money” | `FIXED LOCALLY` | The UI and engine invariants now reconcile exit value explicitly and the tests cover conservation again. |
| RH-32 | “Fake power law occurs in `lib/engines/cap-table-waterfall.ts`” | `ALREADY ADDRESSED` | Wrong file path in the critique. The underlying modeling concern is still valid and tracked as `RH-08`. |

## UX And Presentation Defects

| ID | Item | Status | Notes |
|---|---|---|---|
| RH-33 | Too many always-visible helper blurbs | `FIXED LOCALLY` | First-run surfaces now collapse most expert guidance behind answer-first cards. Validate whether copy density is low enough on live review. |
| RH-34 | Shared scenario sync is not visually obvious | `FIXED LOCALLY` | Last-modified sync messaging is now in the scenario panel; validate if it is visible enough. |
| RH-35 | Compare and report outputs are not boardroom-grade enough | `PENDING` | Better, but still needs stronger memo-quality hierarchy and more polished executive summaries. |
| RH-36 | Dashboard headline is visually buried | `FIXED LOCALLY` | Dashboard now opens on answer cards and threshold takeaways before controls. Still validate narrative hierarchy on live review. |
| RH-37 | Some pages still rely on dense expert terminology too early | `FIXED LOCALLY` | Answer-first defaults and hidden expert controls reduce early jargon load. Validate copy quality in founder testing. |
| RH-38 | Calculator and simulator still repeat too much input surface across modules | `FIXED LOCALLY` | The repeated scenario editor no longer dominates first-run pages because it starts collapsed. Validate that the answer layer clearly wins visually. |
| RH-39 | Mobile navigation, keyboard focus, and touch help affordances are too weak | `FIXED LOCALLY` | Added mobile navigation, skip link, stronger focus states, click/focus info tips, and chart semantics. |

## Release-Blocking Validation Work

These are mandatory before the next serious release candidate.

### A. Mathematical Validation

- Verify displayed waterfall scenarios sum exactly to exit value.
- Verify displayed holder-level payouts are not mixed with instrument-level subtotals.
- Verify founder, employee, investor, prior investor, SAFE, note, and secondary common roles are labeled unambiguously.
- Verify SAFE ownership semantics against the intended supported SAFE type.
- Verify note conversion bridges cap vs discount correctly.
- Verify Monte Carlo output changes materially once the power-law tail is replaced.

### B. Product Validation

- Direct-load `/report` from a cold session and confirm deterministic behavior.
- Verify `/compare` shows actual deltas, not just labels.
- Verify first useful output in under 90 seconds for a first-time founder using Quick mode.
- Verify Fund Lab defaults do not teach the wrong lesson without a warning.
- Verify the first screen on each primary module answers a question before presenting the full model.

### C. Performance Validation

- Benchmark 10k Monte Carlo iterations with worker enabled.
- Benchmark complex waterfall scenarios with multiple preferred series.
- Confirm no visible browser freeze during simulation.

## Next Workstreams

### Workstream 1: Trust Layer

1. Validate the live deployment of the now-standalone report and the new mobile/accessibility surfaces.
2. Keep SAFE/note support claims tight to the exact fidelity the engine provides.

### Workstream 2: Founder Onboarding

1. Make Quick mode the visible default and push deeper controls behind clear expansion states.
2. Add fund presets and default warnings.
3. Add founder “take-home” view and term-sheet comparison.
4. Rework answer-first page hierarchy so insight cards appear before the expert input wall.

### Workstream 3: Simulation Credibility

1. Validate the live calibration and UX framing of the new Pareto-style tail draw.
2. Add confidence intervals and visible seed metadata.
3. Refactor the waterfall conversion solver or cap complexity deliberately.

## Current Rule

No more “looks good enough” deploys.

The next release should be treated as a release candidate only after:

- trust issues are closed
- review critiques are either fixed or rebutted with code and tests
- the app no longer looks mathematically stronger than it actually is
