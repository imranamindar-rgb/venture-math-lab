import {
  scenarioPresets,
  stagePresets,
  getStageIndex,
  marketOverlayMultipliers,
  sectorOverlayMultipliers,
} from "@/data/presets";
import {
  applySecondaryLiquidity,
  createInitialCapTable,
  createOwnershipPoint,
  getEmployeeOwnership,
  getFounderOwnership,
  getInvestorOwnership,
  getNextPreferredSeniority,
} from "@/lib/engines/cap-table-waterfall";
import { createRng, clamp, median, percentile, pickWeighted, randomBetween } from "@/lib/sim/rng";
import { computeWaterfall } from "@/lib/engines/cap-table-waterfall/waterfall";
import {
  issuePreferredRound,
  maybeRefreshPool,
  sampleNextRound,
  getReferencePostMoney,
} from "@/lib/engines/cap-table-waterfall/rounds";
import {
  maybeConvertNote,
  maybeConvertSafe,
} from "@/lib/engines/cap-table-waterfall/unpriced";
import {
  ConfidenceInterval,
  FundingStage,
  HistogramBucket,
  OwnershipPoint,
  PathOutcome,
  ScenarioConfig,
  SimulationSummary,
  StakeholderSummary,
  ThresholdMetric,
  stageOrder,
} from "@/lib/sim/types";
import { getCurrentFinancing } from "@/lib/current-financing";
import { cloneValue, lastItem } from "@/lib/compat";

function sampleCappedPareto(
  rng: ReturnType<typeof createRng>,
  minimum: number,
  alpha: number,
  maximum: number,
) {
  const u = clamp(rng.next(), 1e-9, 1 - 1e-9);
  return Math.min(maximum, minimum * Math.pow(1 - u, -1 / alpha));
}

function sampleTerminalExitMultiple(
  rng: ReturnType<typeof createRng>,
  config: ScenarioConfig,
  currentPostMoney: number,
) {
  const market = marketOverlayMultipliers[config.marketOverlay];
  const sector = sectorOverlayMultipliers[config.sectorOverlay];
  const baseShutdownProbability = clamp(stagePresets[config.currentStage].failureProbability * 0.35 * market.failure, 0.08, 0.28);

  if (rng.next() < baseShutdownProbability) {
    return {
      category: "shutdown",
      exitValue: currentPostMoney * randomBetween(rng, 0, 0.08),
    };
  }

  const tailMultiple =
    sampleCappedPareto(rng, 0.35, config.controls.paretoAlpha, 1_000) *
    market.exit *
    sector.exit;
  const category =
    tailMultiple < 1
      ? "modest acquisition"
      : tailMultiple < 5
        ? "strong acquisition"
        : tailMultiple < 25
          ? "ipo-scale"
          : "outlier";

  return {
    category,
    exitValue: currentPostMoney * tailMultiple,
  };
}

function buildFixedHistogram(
  values: number[],
  ranges: { label: string; min: number; max: number }[],
): HistogramBucket[] {
  if (values.length === 0) {
    return ranges.map((range) => ({ label: range.label, value: 0 }));
  }

  const buckets = ranges.map((range) => ({ label: range.label, value: 0 }));

  for (const value of values) {
    const idx = ranges.findIndex((range) => value >= range.min && value < range.max);
    buckets[idx === -1 ? buckets.length - 1 : idx].value += 1;
  }

  return buckets.map((bucket) => ({
    label: bucket.label,
    value: bucket.value / values.length,
  }));
}

function summarizeStakeholder(values: number[]): StakeholderSummary {
  const p10 = percentile(values, 0.1);
  const medianValue = percentile(values, 0.5);
  const p90 = percentile(values, 0.9);
  const riskBand =
    medianValue < 250_000
      ? "Critical"
      : medianValue < 1_000_000
        ? "Tight"
        : p90 > medianValue * 12
          ? "Power-Law"
          : "Healthy";

  return {
    riskBand,
    median: medianValue,
    p10,
    p90,
  };
}

function averageOwnershipSeries(paths: PathOutcome[]): OwnershipPoint[] {
  const maxLength = Math.max(...paths.map((path) => path.ownershipPath.length));
  const result: OwnershipPoint[] = [];

  for (let index = 0; index < maxLength; index += 1) {
    const points = paths
      .map((path) => path.ownershipPath[Math.min(index, path.ownershipPath.length - 1)])
      .filter(Boolean);
    const label = points[0]?.label ?? `Step ${index + 1}`;
    const count = points.length || 1;
    result.push({
      label,
      founderPct: points.reduce((sum, point) => sum + point.founderPct, 0) / count,
      employeePct: points.reduce((sum, point) => sum + point.employeePct, 0) / count,
      investorPct: points.reduce((sum, point) => sum + point.investorPct, 0) / count,
      priorInvestorPct: points.reduce((sum, point) => sum + point.priorInvestorPct, 0) / count,
      poolPct: points.reduce((sum, point) => sum + point.poolPct, 0) / count,
    });
  }

  return result;
}

function getEmployeeExerciseCost(config: ScenarioConfig, sharePrice: number) {
  const grantShares = 10_000_000 * (config.employee.grantOwnershipPercent / 100);
  return grantShares * config.employee.vestedFraction * Math.max(0, config.employee.strikePrice - sharePrice * 0.15);
}

function simulatePath(config: ScenarioConfig, iteration: number): PathOutcome {
  const rng = createRng(config.controls.seed + iteration);
  const financing = getCurrentFinancing(config);
  const snapshot = createInitialCapTable(config);
  const ownershipPath: OwnershipPoint[] = [createOwnershipPoint("Current", snapshot)];
  const rounds = [];

  let currentPostMoney = getReferencePostMoney(config);
  let monthsElapsed = 0;
  let stepPenalty = 0;
  let currentStageIndex = getStageIndex(config.currentStage);
  let safeConverted = config.currentRoundKind !== "safe_post_money";
  let noteConverted = config.currentRoundKind !== "convertible_note_cap";
  let secondaryUsed = false;
  let reserveUsed = Math.max(0, snapshot.modeledInvestorInvested - financing.modeledInvestorCheck);
  let exitCategory = "shutdown";
  let exitKind: "shutdown" | "acquisition" | "ipo" = "shutdown";
  let exitValue = 0;
  let terminalStage = config.currentStage;

  while (currentStageIndex < stageOrder.length - 1) {
    const nextStage = stageOrder[currentStageIndex + 1] as FundingStage;
    const stagePreset = stagePresets[nextStage];
    terminalStage = nextStage;
    monthsElapsed += stagePreset.monthsToNext;

    const market = marketOverlayMultipliers[config.marketOverlay];
    const failureProbability = clamp(stagePreset.failureProbability * market.failure + stepPenalty, 0.05, 0.75);
    const earlyExitProbability = clamp(stagePreset.earlyExitProbability, 0.04, 0.22);
    const event = pickWeighted(rng, [
      { value: "fail" as const, weight: failureProbability },
      { value: "exit" as const, weight: earlyExitProbability },
      { value: "raise" as const, weight: Math.max(0.1, 1 - failureProbability - earlyExitProbability) },
    ]);

    if (event === "fail") {
      exitCategory = "shutdown";
      exitKind = "shutdown";
      exitValue = currentPostMoney * randomBetween(rng, 0, 0.12);
      break;
    }

    if (event === "exit") {
      const strong = rng.next() > 0.45;
      exitCategory = strong ? "strong acquisition" : "modest acquisition";
      exitKind = "acquisition";
      exitValue =
        currentPostMoney *
        randomBetween(rng, strong ? 1.3 : 0.45, strong ? 7.5 : 1.4) *
        market.exit *
        sectorOverlayMultipliers[config.sectorOverlay].exit;
      break;
    }

    const nextRound = sampleNextRound(rng, nextStage, currentPostMoney, config, stepPenalty);
    const conversionSeniority = getNextPreferredSeniority(snapshot);
    const optionPoolRefreshed = maybeRefreshPool(snapshot, config);

    if (!noteConverted && config.note.enabled) {
      const noteResult = maybeConvertNote(snapshot, config, nextRound.preMoney, monthsElapsed, conversionSeniority);
      noteConverted = noteResult.converted;
    }

    if (!safeConverted && config.safe.enabled) {
      const safeResult = maybeConvertSafe(snapshot, config, nextRound.preMoney, true, conversionSeniority);
      safeConverted = safeResult.converted;
    }

    const issued = issuePreferredRound(snapshot, nextRound.preMoney, nextRound.roundSize, config, stagePreset.label, conversionSeniority);
    reserveUsed += issued.followOnCash;

    if (
      config.secondary.enabled &&
      ["series_b", "series_c"].includes(nextStage) &&
      rng.next() < stagePreset.secondaryChance
    ) {
      applySecondaryLiquidity(
        snapshot,
        issued.pricePerShare,
        config.secondary.founderSaleFraction,
        config.secondary.employeeSaleFraction,
      );
      secondaryUsed = true;
    }

    rounds.push({
      stage: nextStage,
      monthsElapsed,
      preMoney: nextRound.preMoney,
      postMoney: nextRound.postMoney,
      roundSize: nextRound.roundSize,
      stepUpRatio: nextRound.stepUpRatio,
      roundTrend: nextRound.roundTrend,
      safeConverted,
      noteConverted,
      optionPoolRefreshed,
      antiDilutionApplied: issued.antiDilutionApplied,
      antiDilutionMode: config.preferred.antiDilutionMode,
      antiDilutionShares: issued.antiDilutionShares,
      founderOwnership: getFounderOwnership(snapshot),
      employeeOwnership: getEmployeeOwnership(snapshot),
      investorOwnership: getInvestorOwnership(snapshot),
    });

    ownershipPath.push(createOwnershipPoint(stagePreset.label, snapshot));
    currentPostMoney = nextRound.postMoney;
    stepPenalty = nextRound.stepUpRatio < 1.25 ? stepPenalty + 0.06 : Math.max(0, stepPenalty - 0.02);
    currentStageIndex += 1;
  }

  if (exitValue === 0) {
    const terminal = sampleTerminalExitMultiple(rng, config, currentPostMoney);
    exitCategory = terminal.category;
    exitKind = terminal.category === "ipo-scale" || terminal.category === "outlier" ? "ipo" : "acquisition";
    exitValue = terminal.exitValue;
  }

  const commonShares = snapshot.founderCommon + snapshot.employeeCommon + snapshot.secondaryCommon;
  const sharePrice = commonShares > 0 ? exitValue / commonShares : 0;
  const employeeExerciseCost = getEmployeeExerciseCost(config, sharePrice);
  const waterfall = computeWaterfall(snapshot, exitValue, employeeExerciseCost, config.preferred);
  const founderNet = waterfall.founderPayout + snapshot.realizedFounderSecondary;
  const employeeNet = waterfall.employeeNetPayout + snapshot.realizedEmployeeSecondary;
  const investorProceeds = waterfall.investorPayout;
  const investorMoic = snapshot.modeledInvestorInvested > 0 ? investorProceeds / snapshot.modeledInvestorInvested : 0;
  const yearsElapsed = Math.max(1 / 12, monthsElapsed / 12);
  const investorIrr = investorMoic > 0 ? Math.pow(investorMoic, 1 / yearsElapsed) - 1 : -1;

  return {
    rounds,
    ownershipPath,
    liquidity: {
      kind: exitKind,
      terminalStage,
      exitValue,
      monthsElapsed,
      secondaryUsed,
      preferredConverted: waterfall.preferredConverted,
      founderNetProceeds: founderNet,
      employeeNetProceeds: employeeNet,
      employeeGrossValue: waterfall.employeeGrossPayout,
      employeeExerciseCost,
      investorProceeds,
      priorInvestorProceeds: waterfall.priorInvestorPayout,
      investorMoic,
      investorIrr,
      waterfall,
    },
    founderThresholds: {
      below50: ownershipPath.some((point) => point.founderPct < 0.5),
      below20: ownershipPath.some((point) => point.founderPct < 0.2),
      below10: ownershipPath.some((point) => point.founderPct < 0.1),
    },
    employeeUnderwater: waterfall.employeeGrossPayout < employeeExerciseCost,
    exitCategory,
    reserveUsed,
  };
}

function toProbability(label: string, count: number, total: number): ThresholdMetric {
  return {
    label,
    probability: total === 0 ? 0 : count / total,
  };
}

function buildBatches<T>(values: T[], batchCount: number) {
  const batches = Array.from({ length: batchCount }, () => [] as T[]);
  values.forEach((value, index) => {
    batches[index % batchCount].push(value);
  });
  return batches.filter((batch) => batch.length > 0);
}

function sampleStandardDeviation(values: number[]) {
  if (values.length <= 1) {
    return 0;
  }
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance = values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / (values.length - 1);
  return Math.sqrt(variance);
}

function estimateConfidence<T>(values: T[], estimator: (batch: T[]) => number): ConfidenceInterval {
  const batchCount = Math.max(5, Math.min(20, Math.floor(values.length / 500) || 1));
  const estimates = buildBatches(values, batchCount).map((batch) => estimator(batch));
  const standardDeviation = sampleStandardDeviation(estimates);
  const standardError = estimates.length > 0 ? standardDeviation / Math.sqrt(estimates.length) : 0;
  const center = estimates.length > 0 ? estimates.reduce((sum, value) => sum + value, 0) / estimates.length : 0;
  const margin = 1.96 * standardError;

  return {
    lower: center - margin,
    upper: center + margin,
    standardError,
  };
}

function buildSummary(config: ScenarioConfig, paths: PathOutcome[]): SimulationSummary {
  const financing = getCurrentFinancing(config);
  const founderValues = paths.map((path) => path.liquidity.founderNetProceeds);
  const employeeValues = paths.map((path) => path.liquidity.employeeNetProceeds);
  const investorValues = paths.map((path) => path.liquidity.investorProceeds);
  const investorMoics = paths.map((path) => path.liquidity.investorMoic);
  const reserveUses = paths.map((path) => path.reserveUsed);

  const founderSummary = summarizeStakeholder(founderValues);
  const employeeSummary = summarizeStakeholder(employeeValues);
  const investorSummary = summarizeStakeholder(investorValues);

  const founderThresholds = [
    toProbability("Founder below 50%", paths.filter((path) => path.founderThresholds.below50).length, paths.length),
    toProbability("Founder below 20%", paths.filter((path) => path.founderThresholds.below20).length, paths.length),
    toProbability("Founder below 10%", paths.filter((path) => path.founderThresholds.below10).length, paths.length),
  ];

  const averageInitialFounder = paths[0]?.ownershipPath[0]?.founderPct ?? 0;
  const dilutionAttribution = [
    {
      label: "Ownership lost from start",
      probability: Math.max(0, averageInitialFounder - (lastItem(paths[0]?.ownershipPath ?? [])?.founderPct ?? 0)),
    },
    {
      label: "Option pool pressure",
      probability: percentile(paths.map((path) => lastItem(path.ownershipPath)?.poolPct ?? 0), 0.5),
    },
    {
      label: "Preferred creep",
      probability: percentile(paths.map((path) => lastItem(path.ownershipPath)?.priorInvestorPct ?? 0), 0.5),
    },
  ];

  const outcomeMix = [
    toProbability("Shutdown", paths.filter((path) => path.liquidity.kind === "shutdown").length, paths.length),
    toProbability("Acquisition", paths.filter((path) => path.liquidity.kind === "acquisition").length, paths.length),
    toProbability("IPO-scale", paths.filter((path) => path.liquidity.kind === "ipo").length, paths.length),
    toProbability("Secondary used", paths.filter((path) => path.liquidity.secondaryUsed).length, paths.length),
  ];

  const meanInvestor = investorValues.reduce((sum, value) => sum + value, 0) / (investorValues.length || 1);
  const medianInvestor = median(investorValues);

  const riskLayers = [
    toProbability("Company survival risk", paths.filter((path) => path.liquidity.kind === "shutdown").length, paths.length),
    toProbability("Fundraising risk", paths.filter((path) => path.rounds.length < 2).length, paths.length),
    toProbability("Dilution risk", paths.filter((path) => path.founderThresholds.below20).length, paths.length),
    toProbability("Liquidity timing risk", paths.filter((path) => path.liquidity.monthsElapsed > 60).length, paths.length),
    toProbability("Upside concentration", paths.filter((path) => path.liquidity.investorMoic >= 10).length, paths.length),
  ];

  const confidence = {
    founderMedian: estimateConfidence(founderValues, (batch) => percentile(batch, 0.5)),
    employeeMedian: estimateConfidence(employeeValues, (batch) => percentile(batch, 0.5)),
    investorMedian: estimateConfidence(investorValues, (batch) => percentile(batch, 0.5)),
    founderBelow20Probability: estimateConfidence(paths, (batch) =>
      batch.filter((path) => path.founderThresholds.below20).length / Math.max(1, batch.length),
    ),
    employeeUnderwaterProbability: estimateConfidence(paths, (batch) =>
      batch.filter((path) => path.employeeUnderwater).length / Math.max(1, batch.length),
    ),
    investorReturnTheFundProbability: estimateConfidence(paths, (batch) =>
      batch.filter((path) => path.liquidity.investorProceeds >= config.investor.fundSize).length / Math.max(1, batch.length),
    ),
  };

  return {
    scenarioId: config.id,
    scenarioName: config.name,
    iterations: config.controls.iterations,
    seed: config.controls.seed,
    meanVsMedianSpread: medianInvestor === 0 ? 0 : meanInvestor / Math.max(1, medianInvestor),
    founder: {
      ...founderSummary,
      ownershipThresholds: founderThresholds,
      dilutionAttribution,
    },
    employee: {
      ...employeeSummary,
      underwaterProbability: paths.filter((path) => path.employeeUnderwater).length / paths.length,
      worthlessProbability: paths.filter((path) => path.liquidity.employeeNetProceeds < 25_000).length / paths.length,
      exerciseCoverageMedian: median(
        paths.map((path) =>
          path.liquidity.employeeGrossValue <= 0
            ? 0
            : path.liquidity.employeeGrossValue / Math.max(1, path.liquidity.employeeExerciseCost),
        ),
      ),
    },
    investor: {
      ...investorSummary,
      moicThresholds: [
        toProbability("1x+", paths.filter((path) => path.liquidity.investorMoic >= 1).length, paths.length),
        toProbability("3x+", paths.filter((path) => path.liquidity.investorMoic >= 3).length, paths.length),
        toProbability("10x+", paths.filter((path) => path.liquidity.investorMoic >= 10).length, paths.length),
        toProbability("25x+", paths.filter((path) => path.liquidity.investorMoic >= 25).length, paths.length),
      ],
      returnTheFundProbability:
        paths.filter((path) => path.liquidity.investorProceeds >= config.investor.fundSize).length / paths.length,
      reserveUtilizationMedian: median(reserveUses),
    },
    riskLayers,
    outcomeMix,
    ownershipSeries: averageOwnershipSeries(paths),
    exitHistogram: buildFixedHistogram(founderValues, [
      { label: "0-$250k", min: 0, max: 250_000 },
      { label: "$250k-$1m", min: 250_000, max: 1_000_000 },
      { label: "$1m-$5m", min: 1_000_000, max: 5_000_000 },
      { label: "$5m-$20m", min: 5_000_000, max: 20_000_000 },
      { label: "$20m+", min: 20_000_000, max: Number.POSITIVE_INFINITY },
    ]),
    investorHistogram: buildFixedHistogram(investorMoics, [
      { label: "<1x", min: Number.NEGATIVE_INFINITY, max: 1 },
      { label: "1x-3x", min: 1, max: 3 },
      { label: "3x-10x", min: 3, max: 10 },
      { label: "10x-25x", min: 10, max: 25 },
      { label: "25x+", min: 25, max: Number.POSITIVE_INFINITY },
    ]),
    confidence,
    warnings: [
      ...financing.warnings,
      ...config.warningFlags,
      "Monte Carlo now tracks preferred series by seniority, but it still does not model bespoke warrants, pay-to-play, or charter-specific carve-outs.",
      "Unused option pool shares dilute holders in financing math but do not receive exit proceeds.",
      "Stability ranges use repeated batch estimates of the Monte Carlo paths. They reflect simulation numerical variance, not forecast confidence about real-world outcomes.",
    ],
    pathsSample: paths.slice(0, 24),
  };
}

export function sanitizeScenario(config: ScenarioConfig): ScenarioConfig {
  const presetMatch = scenarioPresets.find((preset) => preset.id === config.id);
  const safeConfig = cloneValue(config);
  safeConfig.controls = {
    iterations: clamp(Math.round(config.controls.iterations), 500, 20_000),
    seed: Math.max(1, Math.round(config.controls.seed)),
    paretoAlpha: clamp(config.controls.paretoAlpha ?? 1.55, 1.1, 2.5),
  };
  safeConfig.optionPoolTargetPercent = clamp(config.optionPoolTargetPercent, 0.05, 0.25);
  safeConfig.employee.vestedFraction = clamp(config.employee.vestedFraction, 0.1, 1);
  safeConfig.secondary.founderSaleFraction = clamp(config.secondary.founderSaleFraction, 0, 0.3);
  safeConfig.secondary.employeeSaleFraction = clamp(config.secondary.employeeSaleFraction, 0, 0.3);
  safeConfig.investor.reserveMultiple = clamp(config.investor.reserveMultiple, 0, 5);
  safeConfig.note.discountRate = clamp(config.note.discountRate, 0, 0.35);
  safeConfig.note.interestRate = clamp(config.note.interestRate, 0, 0.15);
  safeConfig.preferred.liquidationMultiple = clamp(config.preferred.liquidationMultiple, 1, 3);
  if (!["none", "broad_weighted_average", "full_ratchet"].includes(config.preferred.antiDilutionMode)) {
    safeConfig.preferred.antiDilutionMode = "none";
  }
  safeConfig.operating.cashOnHand = Math.max(0, config.operating.cashOnHand);
  safeConfig.operating.monthlyBurn = Math.max(0, config.operating.monthlyBurn);
  safeConfig.operating.monthlyRevenue = Math.max(0, config.operating.monthlyRevenue);
  safeConfig.operating.monthlyRevenueGrowth = clamp(config.operating.monthlyRevenueGrowth, 0, 0.25);
  safeConfig.operating.grossMargin = clamp(config.operating.grossMargin, 0, 1);
  safeConfig.operating.targetCashBufferMonths = clamp(config.operating.targetCashBufferMonths, 0, 24);
  safeConfig.operating.accountsReceivable = Math.max(0, config.operating.accountsReceivable);
  safeConfig.operating.inventory = Math.max(0, config.operating.inventory);
  safeConfig.operating.accountsPayable = Math.max(0, config.operating.accountsPayable);
  safeConfig.operating.capexMonthly = Math.max(0, config.operating.capexMonthly);
  safeConfig.operating.transactionFees = clamp(config.operating.transactionFees, 0, 2_000_000);
  safeConfig.capTable.founderPercent = Math.max(0, config.capTable.founderPercent);
  safeConfig.capTable.employeeCommonPercent = Math.max(0, config.capTable.employeeCommonPercent);
  safeConfig.capTable.employeePoolPercent = Math.max(0, config.capTable.employeePoolPercent);
  safeConfig.capTable.priorInvestorPercent = Math.max(0, config.capTable.priorInvestorPercent);

  if (presetMatch && safeConfig.warningFlags.length === 0) {
    safeConfig.warningFlags = presetMatch.warningFlags;
  }

  return safeConfig;
}

export function runMonteCarlo(input: ScenarioConfig): SimulationSummary {
  const config = sanitizeScenario(input);
  const paths = Array.from({ length: config.controls.iterations }, (_, index) => simulatePath(config, index));
  return buildSummary(config, paths);
}
