# Verification Summary

## Commands Run

- `npm run lint`
- `npm run test`
- `npm run build`

## Outcomes

- Lint: passed with no warnings or errors
- Tests: passed with 42 passing tests across 7 test files
- Build: passed; all app routes prerendered successfully

## Route Build Output

| Route | First Load JS |
| --- | ---: |
| `/` | 97.4 kB |
| `/_not-found` | 88.5 kB |
| `/calculator` | 274 kB |
| `/cap-table` | 171 kB |
| `/compare` | 256 kB |
| `/dashboard` | 244 kB |
| `/fund` | 241 kB |
| `/health` | 0 B |
| `/methodology` | 97.4 kB |
| `/operator` | 268 kB |
| `/report` | 162 kB |
| `/simulator` | 273 kB |

## Performance Artifact

The benchmark harness recorded:

- Scenario: `nvca_standard`
- Iterations: `10,000`
- First run: `2028.51ms`
- Second run: `811.61ms`

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
- Deterministic calculator now includes a deal return heatmap across exit values and timing.
- Fund Lab now includes a follow-on/signaling-risk strategy matrix, a net-TVPI tornado chart, a yearly LP fee/carry schedule, contextual vintage benchmark overlays, and loss-ratio vs concentration decomposition.
- Fund Lab now includes a reserve-ratio optimizer / fund-size constraint map that scores feasible construction zones.
- Cap Table now includes a round-evolution slider that steps through deterministic ownership drift before the waterfall.
- Report links are now self-contained and can be opened directly from a URL payload instead of relying on local saved state.
- Accessibility/mobile hardening added a skip link, mobile navigation menu, click/focus tooltips, chart semantics, and stronger visible focus states.

## Environment Notes

- Local route probing through a running HTTP server was constrained by sandbox/network behavior.
- Render API deploy attempts still returned `HTTP 400` from this environment, so a direct API trigger was not validated here.
- Deployment reliability was hardened in-repo by enabling commit-based auto deploy in [render.yaml](/Users/imranamindar/Documents/GPT_Coding/venture-math-lab/render.yaml) and adding [render-deploy.mjs](/Users/imranamindar/Documents/GPT_Coding/venture-math-lab/scripts/render-deploy.mjs) for hook/API-based manual deploys when credentials are available.
