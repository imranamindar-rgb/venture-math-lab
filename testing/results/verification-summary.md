# Verification Summary

## Commands Run

- `npm run lint`
- `npm run test`
- `npm run build`

## Outcomes

- Lint: passed with no warnings or errors
- Tests: passed with 36 passing tests across 7 test files
- Build: passed; all app routes prerendered successfully

## Route Build Output

| Route | First Load JS |
| --- | ---: |
| `/` | 96.5 kB |
| `/_not-found` | 88.5 kB |
| `/calculator` | 256 kB |
| `/cap-table` | 153 kB |
| `/compare` | 148 kB |
| `/dashboard` | 238 kB |
| `/fund` | 228 kB |
| `/health` | 0 B |
| `/methodology` | 96.5 kB |
| `/operator` | 252 kB |
| `/report` | 149 kB |
| `/simulator` | 257 kB |

## Performance Artifact

The benchmark harness recorded:

- Scenario: `nvca_standard`
- Iterations: `10,000`
- First run: `96.28ms`
- Second run: `50.44ms`

## Environment Notes

- Local route probing through a running HTTP server was constrained by sandbox/network behavior.
- DNS resolution to `venture-math-lab.onrender.com` failed in the current shell environment, so live deploy checks were not included in the automated artifact set.
