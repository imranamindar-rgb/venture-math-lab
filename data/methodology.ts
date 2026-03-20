export const methodologySections = [
  {
    title: "Three-Engine Architecture",
    body: [
      "The product is intentionally anchored around three engines: deterministic finance, Monte Carlo simulation, and cap table plus waterfall mechanics.",
      "The deterministic engine answers clean valuation and ownership questions without randomness, the simulation engine handles skew and path dependence, and the cap-table engine controls who owns what and who gets paid first.",
      "This split keeps formulas inspectable, simulations modular, and security-term logic extensible instead of forcing every question through one blended model.",
    ],
  },
  {
    title: "Deterministic Finance Engine",
    body: [
      "Post-money, ownership, break-even exits, return-the-fund thresholds, and benchmark step-ups are computed directly from inspectable formulas.",
      "These outputs are not forecasts. They are clean baseline economics that tell you whether the deal works before uncertainty enters the picture.",
      "The deterministic path uses stage medians as benchmark financing steps so users can see whether dilution or pricing assumptions are doing the heavy lifting.",
    ],
  },
  {
    title: "Funding Rounds as Value Inflection Steps",
    body: [
      "The model treats each round as an attempt to buy enough time to reach the next value inflection point, not as a generic monthly burn simulation.",
      "Step-up ratio is the key bridge metric: next round pre-money divided by prior round post-money. Weak step-ups increase later down-round and failure risk.",
      "This keeps the simulator aligned with how founders and investors talk about financing trajectories in practice.",
    ],
  },
  {
    title: "Monte Carlo Simulation Engine",
    body: [
      "The simulation engine samples survival, timing, round pricing, follow-ons, and exit outcomes across thousands of paths rather than pretending there is one expected future.",
      "Venture returns are power-law distributed, so the product always distinguishes mean, median, thresholds, and tail outcomes instead of reporting a single average.",
      "This is the right engine for questions about risk bands, probability of loss, reserve usage, and tail-driven venture upside.",
    ],
  },
  {
    title: "Priced vs Unpriced Rounds",
    body: [
      "Priced preferred rounds set exact ownership at the moment capital goes in.",
      "Post-money SAFEs are modeled as future ownership claims that convert on the next qualified financing using cap logic.",
      "Convertible notes are modeled separately from SAFEs because they accrue interest and stay senior to equity in weak outcomes.",
    ],
  },
  {
    title: "Fully Diluted Ownership",
    body: [
      "The engine always reasons from a fully diluted base so option pool refreshes affect dilution before new-money ownership is assigned.",
      "Unused pool shares count for dilution math but do not receive proceeds in the exit waterfall.",
      "This is why employees can experience meaningful dilution even before additional grants are issued.",
    ],
  },
  {
    title: "Cap Table and Waterfall Engine",
    body: [
      "The cap-table engine always reasons from a fully diluted base, so option pool refreshes, SAFE conversion, and note conversion alter ownership before exit proceeds are allocated.",
      "Exit value first services note debt and similar senior claims, then preferred stock chooses either the 1x non-participating preference or as-converted common economics.",
      "This engine is where dilution mechanics and liquidation mechanics meet, which is why it has to stay separate from the deterministic finance formulas and the simulation loop.",
    ],
  },
  {
    title: "Liquidity Waterfalls",
    body: [
      "Exit value first services note debt and similar senior claims.",
      "Preferred stock then chooses either the 1x non-participating preference or as-converted common economics.",
      "Common holders receive the residual, and employee net value is reduced by modeled exercise cost exposure.",
    ],
  },
  {
    title: "What v1 Does Not Model",
    body: [
      "Anti-dilution clauses, warrants, participating preferred, layered seniority, tax treatment, and bespoke governance rights are explained but not simulated numerically.",
      "Those terms can matter a lot, but they push the product from decision-support into bespoke legal modeling.",
      "The methodology page should therefore be read as venture math under standard-friendly documents, not as a substitute for counsel.",
    ],
  },
];

export const glossary = [
  {
    term: "Pre-money valuation",
    definition: "The negotiated company value immediately before a new investment is priced.",
  },
  {
    term: "Post-money valuation",
    definition: "The instantaneous value right after the new capital hits: pre-money plus new cash.",
  },
  {
    term: "Deterministic engine",
    definition: "The formula layer that computes clean venture math without sampling uncertainty.",
  },
  {
    term: "Monte Carlo engine",
    definition: "The stochastic layer that samples many possible financing and exit paths under uncertainty.",
  },
  {
    term: "Step-up",
    definition: "The multiple between the next round pre-money and the prior round post-money.",
  },
  {
    term: "Option pool refresh",
    definition: "New shares reserved for hiring before a round closes, which dilutes existing holders.",
  },
  {
    term: "Pro rata",
    definition: "The right to buy enough of the next round to maintain an existing ownership percentage.",
  },
  {
    term: "Waterfall",
    definition: "The ordered payout logic that determines who gets paid first and when preferred converts to common.",
  },
];
