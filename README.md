# Venture Math Lab

Venture Math Lab is a standalone Next.js 14 app for founders, executives, early employees, and early-stage investors who need to understand venture financing through three separate engines:

- deterministic finance engine
- Monte Carlo simulation engine
- cap table and waterfall engine

## What it does

- Computes deterministic post-money, ownership, benchmark step-up, and return-threshold math
- Runs Monte Carlo simulations for startup financing outcomes
- Shows a cap-table and waterfall lab for dilution, conversion, and payout logic
- Models priced preferred rounds, post-money SAFEs, and capped notes
- Tracks dilution, step-up/down-round pressure, option-pool refreshes, and 1x non-participating preferred
- Shows separate founder, employee, and investor views from the same scenario
- Supports local scenario save/load plus JSON export/import

## Product surfaces

- `/calculator`: deterministic finance engine
- `/simulator`: Monte Carlo simulation engine
- `/cap-table`: cap table and waterfall engine
- `/compare`: scenario comparison
- `/methodology`: formulas, assumptions, and glossary

## Local development

```bash
cd /Users/imranamindar/Documents/GPT_Coding/venture-math-lab
npm run dev
```

The app assumes dependencies are already available in `node_modules`. In this workspace they are linked to the installed tree under `ideaforge`.

## Production build

```bash
npm run build
npm run start
```

Health endpoint:

```bash
curl http://localhost:3000/health
```

## Deploy on Render

The project includes [`render.yaml`](/Users/imranamindar/Documents/GPT_Coding/venture-math-lab/render.yaml) so it can be deployed as a Node web service.

Use these settings if you configure Render manually:

- Root Directory: leave blank
- Build Command: `npm install && npm run build`
- Start Command: `npm run start`
- Health Check Path: `/health`

## Architecture

- [`lib/engines/deterministic-finance/index.ts`](lib/engines/deterministic-finance/index.ts): clean venture finance formulas and deterministic projections
- [`lib/engines/monte-carlo/index.ts`](lib/engines/monte-carlo/index.ts): stochastic company-outcome simulation
- [`lib/engines/cap-table-waterfall`](lib/engines/cap-table-waterfall): fully diluted ownership, unpriced conversion, round issuance, and waterfall logic

## Scope limits

v1 is intentionally decision-support, not bespoke legal or tax software. It does not numerically model participating preferred, anti-dilution clauses, warrants, or tax treatment.
