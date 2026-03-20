export const methodologySections = [
  {
    title: "Funding Rounds as Value Inflection Steps",
    body: [
      "The model treats each round as an attempt to buy enough time to reach the next value inflection point, not as a generic monthly burn simulation.",
      "Step-up ratio is the key bridge metric: next round pre-money divided by prior round post-money. Weak step-ups increase later down-round and failure risk.",
      "This keeps the simulator aligned with how founders and investors talk about financing trajectories in practice.",
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
];
