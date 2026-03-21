# Combined Review Task Ledger

This ledger assimilates the March 21, 2026 definitive combined review and maps every cited defect, improvement, and feature gap to a concrete task and current disposition.

Status meanings:

- `DONE`: implemented and validated in the current local codebase
- `VALIDATED`: already present locally and re-verified against the review claim
- `ROADMAP`: valid request, but still expansion work beyond the current pass
- `REJECTED`: critique does not hold against the current implementation

## Critical Defects

| ID | Task | Status | Disposition |
| --- | --- | --- | --- |
| `CD-1` | Remove SAFE / modeled-investor double counting from cap-table waterfall display and show explicit reconciliation | `DONE` | The cap-table cards now separate investor subtotal from SAFE/note detail and show exit-value reconciliation plus difference checks. |
| `CD-2` | Replace discrete exit buckets with continuous Pareto-style terminal exit modeling | `DONE` | Terminal exit sampling now uses a continuous capped Pareto tail with user-visible `paretoAlpha` control and stage-aware shutdown probability. |
| `CD-3` | Spawn SAFE conversions as distinct shadow series rather than treating them as generic new-round preferred | `DONE` | SAFE and note conversions now create explicit shadow series types and share the priced round's seniority layer. |
| `CD-4` | Harden financial precision so shares and dollars reconcile at display and test level | `DONE` | Added cent-safe and microshare-safe quantization plus rounded allocation logic for waterfall outputs. |
| `CD-5` | Make `/report` render deterministically and safely on direct load | `VALIDATED` | Report now hydrates from saved scenario state, renders deterministic sections before Monte Carlo completes, and provides export actions. |
| `CD-6` | Turn `/compare` into a real decision surface with deltas | `VALIDATED` | Compare now renders headline cards, driver deltas, risk-layer deltas, exports, and saved-scenario loading. |

## High-Priority Improvements

| ID | Task | Status | Disposition |
| --- | --- | --- | --- |
| `HP-1` | Progressive disclosure with Quick / Standard / Advanced / Legal modes | `VALIDATED` | Already in `ScenarioEditor`, and the main pages now default to answer-first with the editor collapsed. |
| `HP-2` | Replace vague “approximate” founder workflows with auditable SAFE/note bridges where supported | `DONE` | SAFE and note pages now show explicit conversion bridges; support labels remain only where the model is truly simplified. |
| `HP-3` | Scenario library with save / load / rename / delete / compare / export / reproducible seed | `VALIDATED` | Scenario store already supports save/load/rename/delete/import/export; seed is persisted and shown in report/simulation outputs. |
| `HP-4` | Add a crisp decision dashboard / answer layer | `VALIDATED` | Calculator, simulator, cap-table, dashboard, fund, and operator now lead with answer cards before the modeling surface. |
| `HP-5` | Add DPI / J-curve timeline | `DONE` | Fund engine now computes a median DPI/TVPI/paid-in timeline and the fund page renders a J-curve chart. |
| `HP-6` | Add follow-on strategy and signaling-risk modeling | `DONE` | Fund Lab now includes a three-strategy matrix covering full pro rata, selective winners, and no follow-on, with signaling-risk and ownership-defense metrics. |
| `HP-7` | Add sensitivity / tornado diagram | `DONE` | Fund Lab now includes a net-TVPI tornado chart driven by one-at-a-time perturbations of core construction inputs. |
| `HP-8` | Show confidence intervals on Monte Carlo outputs | `VALIDATED` | Simulation and report surfaces already show batch-estimated 95% confidence intervals. |
| `HP-9` | Add option-pool shuffle visualization | `DONE` | Calculator now shows pre-money vs post-money pool-shuffle founder impact in both ownership and dollars. |
| `HP-10` | Add “What do I take home?” founder calculator | `DONE` | Calculator now includes a custom exit-value take-home panel for founder, employee, modeled investor, and prior investors. |

## Design / Workflow Shortcomings

| ID | Task | Status | Disposition |
| --- | --- | --- | --- |
| `UX-1` | Reduce first-run input burden and lead with answers, not the engine architecture | `DONE` | Primary workflows now hide the full scenario editor by default and lead with outputs. |
| `UX-2` | Make the dashboard read like a decision tool rather than a seminar handout | `DONE` | Dashboard now opens on answer cards and threshold takeaways before exposing teaching controls. |
| `UX-3` | Make Fund Lab defaults and framing less accidentally pessimistic | `DONE` | Fund defaults/presets were rebalanced and the page now frames median-below-1x outcomes more honestly. |
| `UX-4` | Make report/share surfaces board-grade | `DONE` | Report and compare exports now include memo/CSV surfaces, assumptions, support status, and deterministic + simulation context. |

## Founder Feature Gaps

| ID | Task | Status | Disposition |
| --- | --- | --- | --- |
| `F-1` | Founder personal proceeds at exit X | `DONE` | Added to the calculator. |
| `F-2` | Option-pool shuffle in founder dollars | `DONE` | Added to the calculator. |
| `F-3` | Term-sheet A/B comparison | `DONE` | Compare page now includes deterministic A/B outcome curves for founder net and investor proceeds across exit values. |
| `F-4` | Liquidation dead-zone visualization | `DONE` | Calculator now includes a liquidation dead-zone chart showing founder net and investor proceeds across the exit range with the overhang window shaded. |
| `F-5` | Cap-table evolution slider | `ROADMAP` | Ownership drift exists, but not a dedicated step slider on the cap-table page. |
| `F-6` | Down-round SAFE vs priced-round interaction explanation | `DONE` | SAFE bridge now compares cap vs round-price conversion and teaches dilution source explicitly. |

## VC / LP Feature Gaps

| ID | Task | Status | Disposition |
| --- | --- | --- | --- |
| `V-1` | Deal return heatmap by exit value and timing | `ROADMAP` | Not added in this pass. |
| `V-2` | Follow-on strategy modeler with signaling risk | `DONE` | Fund Lab now surfaces a follow-on/signaling-risk strategy matrix that compares TVPI, concentration, return-the-fund odds, and ownership defense. |
| `V-3` | Reserve-ratio optimizer / fund-size constraint map | `ROADMAP` | Warnings and thresholds exist, but not an optimizer surface. |
| `V-4` | IC memo export with assumptions appendix | `DONE` | Report and compare memo exports now include assumptions, support status, and scenario metadata. |
| `LP-1` | DPI / J-curve timeline | `DONE` | Added to Fund Lab. |
| `LP-2` | Paid-in / fee schedule by year | `DONE` | Fund Lab now includes a yearly LP fee/carry schedule with fees, paid-in, gross distributions, carry, net distributions, and cumulative net distributions. |
| `LP-3` | Loss-ratio vs concentration decomposition | `DONE` | Fund Lab now includes median loss ratios and a quadrant decomposition separating loss intensity from concentration dependence. |
| `LP-4` | Vintage benchmark overlay | `DONE` | Fund Lab now overlays contextual vintage benchmark DPI/TVPI curves onto the J-curve and lets the user switch the reference vintage. |

## Academic / Audit Requests

| ID | Task | Status | Disposition |
| --- | --- | --- | --- |
| `A-1` | Expose random seed in UI and exports | `VALIDATED` | Seed is visible in advanced controls, reports, and exported data. |
| `A-2` | Export full parameter state | `VALIDATED` | Scenario CSV export includes flattened config and simulation metadata. |
| `A-3` | Confidence intervals everywhere important | `VALIDATED` | Added to simulator and report outputs. |
| `A-4` | Calibration citations / methodology provenance | `VALIDATED` | Methodology already includes calibration references and limitations. |
| `A-5` | Tornado / one-at-a-time sensitivity diagrams | `DONE` | Added to Fund Lab with one-at-a-time perturbation bars for the key construction levers. |

## Critiques Rebutted By Current Code

| ID | Claim | Status | Disposition |
| --- | --- | --- | --- |
| `R-1` | Monte Carlo runs synchronously on the main thread | `REJECTED` | The app uses a Web Worker through `useSimulationRunner`; sync execution is only a fallback. |
| `R-2` | Report and compare are only headers / non-functional | `REJECTED` | That was true on an older deploy, not in the current local code. |
| `R-3` | Progressive disclosure is absent | `REJECTED` | Quick / Standard / Advanced / Legal modes already exist and answer-first page flows now default to collapsed controls. |

## Summary

### Closed in this pass

- Waterfall display trust layer
- Continuous Pareto tail control
- SAFE / note shadow series and seniority cleanup
- Precision / reconciliation hardening
- Founder take-home calculator
- Option-pool shuffle illustration
- Fund J-curve / DPI timeline

### Already present and re-validated

- Web Worker simulation execution
- Report rendering and export
- Compare deltas and export
- Scenario library basics
- Reproducible seeds
- Confidence intervals
- Answer-first onboarding

### Still roadmap-scale

- Deal return heatmap by exit value and timing
- Reserve-ratio optimizer / fund-size constraint map
- Cap-table evolution slider
