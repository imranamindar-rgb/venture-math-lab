# Verification Summary

## Commands Run

- `npm run lint`
- `npm run test`
- `npm run build`

## Outcomes

- Lint: passed with no warnings or errors
- Tests: passed with 41 passing tests across 7 test files
- Build: passed; all app routes prerendered successfully

## Route Build Output

| Route | First Load JS |
| --- | ---: |
| `/` | 96.5 kB |
| `/_not-found` | 88.5 kB |
| `/calculator` | 264 kB |
| `/cap-table` | 161 kB |
| `/compare` | 256 kB |
| `/dashboard` | 242 kB |
| `/fund` | 239 kB |
| `/health` | 0 B |
| `/methodology` | 96.5 kB |
| `/operator` | 258 kB |
| `/report` | 153 kB |
| `/simulator` | 263 kB |

## Performance Artifact

The benchmark harness recorded:

- Scenario: `nvca_standard`
- Iterations: `10,000`
- First run: `275.05ms`
- Second run: `135.07ms`

## Release Hardening Highlights

- Report page now hydrates safely, renders deterministic content without waiting on Monte Carlo, and handles direct load / no-scenario states.
- Compare mode now includes a decision matrix, saved-scenario loading, and exportable board notes.
- Scenario editing now supports Quick, Standard, Advanced, and Legal Terms modes.
- Monte Carlo output now reports fixed seed plus batch-estimated 95% confidence intervals for key statistics.
- Cap-table output now separates holder totals from instrument subtotals, reconciles exit cash explicitly, and explains post-money SAFE dilution on existing holders.
- Fund defaults and presets now avoid the earlier under-diversified seed-fund framing problem.
- Primary workflows now lead with answer cards first and keep the full scenario/editor surface collapsed until the user explicitly opens it.
- Deterministic calculator now includes a founder take-home panel and an option-pool shuffle illustration in both ownership and dollar terms.
- Fund Lab now includes a median J-curve timeline covering DPI, TVPI, and paid-in ratio.
- Monte Carlo terminal outcomes now use a continuous Pareto tail with user-visible alpha control, and SAFE/note conversions now create explicit shadow series in the waterfall stack.
- Compare mode now includes term-sheet A/B outcome curves for founder net and investor proceeds across deterministic exit values.
- Deterministic calculator now includes a liquidation dead-zone chart that shows where the preferred stack still dominates the payout.
- Fund Lab now includes a follow-on/signaling-risk strategy matrix, a net-TVPI tornado chart, a yearly LP fee/carry schedule, contextual vintage benchmark overlays, and loss-ratio vs concentration decomposition.

## Environment Notes

- Local route probing through a running HTTP server was constrained by sandbox/network behavior.
- DNS resolution to `venture-math-lab.onrender.com` failed in the current shell environment, so live deploy checks were not included in the automated artifact set.
