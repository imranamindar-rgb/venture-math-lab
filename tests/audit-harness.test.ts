import { afterAll, describe, expect, it } from "vitest";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { performance } from "node:perf_hooks";

import { getScenarioPreset } from "@/data/presets";
import {
  createInitialCapTable,
  getFullyDilutedShares,
  maybeRefreshPool,
  maybeConvertNote,
  maybeConvertSafe,
  issuePreferredRound,
  projectMedianRound,
  computeWaterfall,
} from "@/lib/engines/cap-table-waterfall";
import {
  calculateInvestorOwnership,
  calculatePostMoney,
  calculateRequiredCheckForTargetOwnership,
  summarizeDeterministicFinance,
} from "@/lib/engines/deterministic-finance";
import { runMonteCarlo } from "@/lib/engines/monte-carlo";

type Classification =
  | "exact match"
  | "acceptable rounding difference"
  | "modeling-choice difference"
  | "likely bug"
  | "severe error";

interface BenchmarkArtifact {
  id: string;
  description: string;
  formulas: string[];
  assumptions: string[];
  expected: Record<string, number | boolean | string>;
  actual: Record<string, number | boolean | string>;
  classification: Classification;
}

const benchmarkArtifacts: BenchmarkArtifact[] = [];
const performanceArtifacts: Record<string, number | string>[] = [];

function classifyNumeric(actual: number, expected: number, tolerance = 1e-6): Classification {
  const delta = Math.abs(actual - expected);
  if (delta <= tolerance) {
    return "exact match";
  }
  if (delta <= Math.max(1, Math.abs(expected)) * 0.01) {
    return "acceptable rounding difference";
  }
  return "likely bug";
}

function recordBenchmark(artifact: BenchmarkArtifact) {
  benchmarkArtifacts.push(artifact);
}

describe("audit benchmark harness", () => {
  it("benchmarks deterministic priced round ownership", () => {
    const expectedPostMoney = calculatePostMoney(12_000_000, 3_000_000);
    const expectedOwnership = 3_000_000 / 15_000_000;
    const actualOwnership = calculateInvestorOwnership(12_000_000, 3_000_000);

    recordBenchmark({
      id: "seed_priced_round",
      description: "Seed priced round baseline ownership math.",
      formulas: ["post_money = pre_money + new_money", "ownership = new_money / post_money"],
      assumptions: ["Pre-money = $12.0M", "New money = $3.0M", "Single priced investor"],
      expected: {
        postMoney: expectedPostMoney,
        investorOwnership: expectedOwnership,
      },
      actual: {
        postMoney: expectedPostMoney,
        investorOwnership: actualOwnership,
      },
      classification: classifyNumeric(actualOwnership, expectedOwnership),
    });

    expect(actualOwnership).toBeCloseTo(expectedOwnership, 8);
  });

  it("benchmarks post-money SAFE ownership using YC-style cap logic", () => {
    const scenario = getScenarioPreset("nvca_standard");
    scenario.currentStage = "pre_seed";
    scenario.currentRoundKind = "safe_post_money";
    scenario.safe.enabled = true;
    scenario.safe.investment = 500_000;
    scenario.safe.postMoneyCap = 10_000_000;
    const summary = summarizeDeterministicFinance(scenario);
    const expectedOwnership = 0.05;

    recordBenchmark({
      id: "pre_seed_safe_with_cap",
      description: "Post-money SAFE ownership estimate before a qualified round.",
      formulas: ["ownership = safe_investment / post_money_cap"],
      assumptions: ["SAFE investment = $500k", "Post-money cap = $10.0M"],
      expected: {
        investorOwnership: expectedOwnership,
      },
      actual: {
        investorOwnership: summary.currentInvestorOwnership,
      },
      classification: classifyNumeric(summary.currentInvestorOwnership, expectedOwnership),
    });

    expect(summary.currentInvestorOwnership).toBeCloseTo(expectedOwnership, 8);
  });

  it("benchmarks option-pool shuffle math independently", () => {
    const scenario = getScenarioPreset("nvca_standard");
    scenario.capTable.employeePoolPercent = 8;
    scenario.optionPoolTargetPercent = 0.15;
    const snapshot = createInitialCapTable(scenario);
    const beforePool = snapshot.employeePool;
    const beforeTotal = getFullyDilutedShares(snapshot);
    const expectedAdded = (scenario.optionPoolTargetPercent * beforeTotal - beforePool) / (1 - scenario.optionPoolTargetPercent);

    maybeRefreshPool(snapshot, scenario);
    const actualAdded = snapshot.employeePool - beforePool;

    recordBenchmark({
      id: "option_pool_shuffle",
      description: "Pre-money option-pool top-up before a new priced round.",
      formulas: ["added_pool = (target_pct * total_shares - current_pool) / (1 - target_pct)"],
      assumptions: ["Initial unissued pool = 8%", "Target pool = 15%"],
      expected: {
        addedShares: expectedAdded,
      },
      actual: {
        addedShares: actualAdded,
      },
      classification: classifyNumeric(actualAdded, expectedAdded),
    });

    expect(actualAdded).toBeCloseTo(expectedAdded, 6);
  });

  it("benchmarks note conversion on the better of cap or discount", () => {
    const scenario = getScenarioPreset("stress_case");
    scenario.note.enabled = true;
    scenario.note.principal = 1_000_000;
    scenario.note.preMoneyCap = 8_000_000;
    scenario.note.discountRate = 0.2;
    scenario.note.interestRate = 0.1;
    const snapshot = createInitialCapTable(scenario);
    const monthsElapsed = 12;
    const qualifiedPreMoney = 12_000_000;
    const accrued = 1_000_000 * 1.1;
    const expectedConversionPrice = 0.8;
    const expectedIssuedShares = accrued / expectedConversionPrice;

    const result = maybeConvertNote(snapshot, scenario, qualifiedPreMoney, monthsElapsed);

    recordBenchmark({
      id: "convertible_note_cap",
      description: "Convertible note converts at the cheaper of cap price or discount price.",
      formulas: [
        "accrued = principal * (1 + interest_rate * months/12)",
        "conversion_price = min(cap_price, discount_price)",
        "issued_shares = accrued / conversion_price",
      ],
      assumptions: ["Principal = $1.0M", "Interest = 10%", "Qualified pre-money = $12.0M", "Cap = $8.0M", "Discount = 20%"],
      expected: {
        accruedPrincipal: accrued,
        conversionPrice: expectedConversionPrice,
        issuedShares: expectedIssuedShares,
      },
      actual: {
        accruedPrincipal: result.accruedPrincipal,
        conversionPrice: result.accruedPrincipal > 0 ? result.accruedPrincipal / result.issuedShares : 0,
        issuedShares: result.issuedShares,
      },
      classification: classifyNumeric(result.issuedShares, expectedIssuedShares),
    });

    expect(result.accruedPrincipal).toBeCloseTo(accrued, 6);
    expect(result.issuedShares).toBeCloseTo(expectedIssuedShares, 6);
  });

  it("benchmarks the 1x non-participating preference threshold", () => {
    const scenario = getScenarioPreset("nvca_standard");
    scenario.currentRoundKind = "priced_preferred";
    scenario.currentPreMoney = 16_000_000;
    scenario.currentRoundSize = 4_000_000;
    scenario.investor.initialCheck = 4_000_000;
    scenario.capTable.founderPercent = 80;
    scenario.capTable.employeeCommonPercent = 0;
    scenario.capTable.employeePoolPercent = 20;
    scenario.capTable.priorInvestorPercent = 0;
    scenario.founders = [
      {
        id: "founder_1",
        name: "Founder 1",
        ownershipPercent: 80,
      },
    ];
    const snapshot = createInitialCapTable(scenario);

    const lowExit = computeWaterfall(snapshot, 15_000_000, 0);
    const highExit = computeWaterfall(snapshot, 30_000_000, 0);

    recordBenchmark({
      id: "liquidation_preference_1x_non_participating",
      description: "Investor should stay preferred below the $20M conversion threshold and convert above it.",
      formulas: ["convert when as_converted_share * exit_value > liquidation_preference"],
      assumptions: [
        "Investor owns 20% of fully diluted shares but 23.8% of participating shares because the option pool does not share in proceeds",
        "Liquidation preference = $4.0M",
        "Conversion threshold = about $16.8M exit",
      ],
      expected: {
        lowExitConverts: false,
        highExitConverts: true,
      },
      actual: {
        lowExitConverts: lowExit.preferredConverted,
        highExitConverts: highExit.preferredConverted,
      },
      classification: lowExit.preferredConverted === false && highExit.preferredConverted === true ? "exact match" : "likely bug",
    });

    expect(lowExit.preferredConverted).toBe(false);
    expect(highExit.preferredConverted).toBe(true);
  });

  it("benchmarks pro-rata reserve deployment", () => {
    const withProRata = getScenarioPreset("nvca_standard");
    withProRata.currentRoundKind = "priced_preferred";
    withProRata.investor.initialCheck = 3_000_000;

    const withoutProRata = getScenarioPreset("nvca_standard");
    withoutProRata.currentRoundKind = "priced_preferred";
    withoutProRata.investor.initialCheck = 3_000_000;
    withoutProRata.investor.proRata = false;

    const withSnapshot = createInitialCapTable(withProRata);
    const withoutSnapshot = createInitialCapTable(withoutProRata);
    const withRound = issuePreferredRound(withSnapshot, 30_000_000, 6_000_000, withProRata);
    const withoutRound = issuePreferredRound(withoutSnapshot, 30_000_000, 6_000_000, withoutProRata);

    recordBenchmark({
      id: "reserve_strategy_pro_rata_vs_none",
      description: "Pro rata should deploy reserve capital while no-pro-rata should not.",
      formulas: ["follow_on_cash = min(target_follow_on_cash, reserve_remaining) when pro_rata = true"],
      assumptions: ["New round pre-money = $30.0M", "New round size = $6.0M"],
      expected: {
        withProRataPositive: true,
        withoutProRataZero: 0,
      },
      actual: {
        withProRataPositive: withRound.followOnCash > 0,
        withoutProRataZero: withoutRound.followOnCash,
      },
      classification: withRound.followOnCash > 0 && withoutRound.followOnCash === 0 ? "exact match" : "likely bug",
    });

    expect(withRound.followOnCash).toBeGreaterThan(0);
    expect(withoutRound.followOnCash).toBe(0);
  });

  it("benchmarks AI overlay valuation uplift in the deterministic round model", () => {
    const standard = getScenarioPreset("nvca_standard");
    standard.sectorOverlay = "standard";
    const ai = getScenarioPreset("nvca_standard");
    ai.sectorOverlay = "ai_premium";

    const standardRound = projectMedianRound("series_a", 20_000_000, standard);
    const aiRound = projectMedianRound("series_a", 20_000_000, ai);
    const expectedRatio = 1.35;

    recordBenchmark({
      id: "ai_overlay_uplift",
      description: "AI overlay should mechanically raise benchmark valuation relative to standard mode.",
      formulas: ["pre_money = stage_median_pre_money * sector_overlay.valuation * market_overlay.valuation"],
      assumptions: ["Same stage", "Same market regime", "AI valuation multiplier = 1.35"],
      expected: {
        preMoneyRatio: expectedRatio,
      },
      actual: {
        preMoneyRatio: aiRound.preMoney / standardRound.preMoney,
      },
      classification: classifyNumeric(aiRound.preMoney / standardRound.preMoney, expectedRatio),
    });

    expect(aiRound.preMoney / standardRound.preMoney).toBeCloseTo(expectedRatio, 6);
  });

  it("records Monte Carlo reproducibility and runtime evidence", () => {
    const scenario = getScenarioPreset("nvca_standard");
    scenario.controls.iterations = 10_000;
    scenario.controls.seed = 42;

    const firstStart = performance.now();
    const first = runMonteCarlo(scenario);
    const firstDuration = performance.now() - firstStart;

    const secondStart = performance.now();
    const second = runMonteCarlo(scenario);
    const secondDuration = performance.now() - secondStart;

    performanceArtifacts.push({
      scenarioId: scenario.id,
      iterations: scenario.controls.iterations,
      firstRunMs: Number(firstDuration.toFixed(2)),
      secondRunMs: Number(secondDuration.toFixed(2)),
    });

    recordBenchmark({
      id: "monte_carlo_reproducibility",
      description: "Fixed-seed Monte Carlo should return stable medians and probabilities.",
      formulas: ["seeded_rng(iteration) -> deterministic path sampling"],
      assumptions: ["Iterations = 10,000", "Seed = 42"],
      expected: {
        founderMedian: first.founder.median,
        returnTheFundProbability: first.investor.returnTheFundProbability,
      },
      actual: {
        founderMedian: second.founder.median,
        returnTheFundProbability: second.investor.returnTheFundProbability,
      },
      classification:
        first.founder.median === second.founder.median &&
        first.investor.returnTheFundProbability === second.investor.returnTheFundProbability
          ? "exact match"
          : "likely bug",
    });

    expect(second.founder.median).toBe(first.founder.median);
    expect(second.investor.returnTheFundProbability).toBe(first.investor.returnTheFundProbability);
    expect(firstDuration).toBeLessThan(5_000);
    expect(secondDuration).toBeLessThan(5_000);
  });

  it("benchmarks return-the-fund ownership threshold math", () => {
    const expectedCheck = 11_625_000;
    const actualCheck = calculateRequiredCheckForTargetOwnership(46_500_000, 0.2);

    recordBenchmark({
      id: "series_a_ownership_target",
      description: "Series A check required to own 20% in a clean priced round.",
      formulas: ["check = (target_ownership * pre_money) / (1 - target_ownership)"],
      assumptions: ["Pre-money = $46.5M", "Target ownership = 20%"],
      expected: {
        requiredCheck: expectedCheck,
      },
      actual: {
        requiredCheck: actualCheck,
      },
      classification: classifyNumeric(actualCheck, expectedCheck),
    });

    expect(actualCheck).toBeCloseTo(expectedCheck, 6);
  });
});

afterAll(() => {
  const resultsDir = path.resolve(process.cwd(), "testing/results");
  mkdirSync(resultsDir, { recursive: true });
  writeFileSync(
    path.join(resultsDir, "benchmark-oracles.json"),
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        benchmarks: benchmarkArtifacts,
      },
      null,
      2,
    ),
  );
  writeFileSync(
    path.join(resultsDir, "performance.json"),
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        measurements: performanceArtifacts,
      },
      null,
      2,
    ),
  );
});
