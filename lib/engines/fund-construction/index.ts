import { marketOverlayMultipliers, sectorOverlayMultipliers } from "@/data/presets";
import { formatPercent } from "@/lib/format";
import { FundingStage, HistogramBucket, MarketOverlay, SectorOverlay, ThresholdMetric } from "@/lib/sim/types";
import { clamp, createRng, median, percentile, pickWeighted, randomBetween } from "@/lib/sim/rng";

export interface FundConstructionConfig {
  fundSize: number;
  managementFeeRate: number;
  carryRate: number;
  reserveRatio: number;
  initialCheckSize: number;
  followOnCheckSize: number;
  portfolioSize: number;
  targetOwnership: number;
  followOnStrategy: boolean;
  followOnThreshold: number;
  fundLifeYears: number;
  simulationCount: number;
  seed: number;
  stage: FundingStage;
  marketOverlay: MarketOverlay;
  sectorOverlay: SectorOverlay;
}

export interface FundPresetOption {
  id: string;
  name: string;
  note: string;
  config: FundConstructionConfig;
}

export interface FundStrategyMatrixRow {
  label: string;
  note: string;
  netTVPIMedian: number;
  topWinnerShareMedian: number;
  oneCompanyReturnsFundProbability: number;
  modeledCompanyCount: number;
  followOnCapacity: number;
  signalingRiskProbability: number;
  ownershipMaintenanceRate: number;
}

export interface FundTornadoBar {
  label: string;
  lowerDelta: number;
  upperDelta: number;
}

export interface FundFeeCarryScheduleRow {
  year: number;
  feesPaid: number;
  paidInCapital: number;
  grossDistributions: number;
  carryPaid: number;
  netDistributions: number;
  cumulativeNetDistributions: number;
}

export interface FundLossConcentrationSummary {
  medianLossRatio: number;
  medianLossOfCapitalRatio: number;
  quadrantProbabilities: ThresholdMetric[];
}

export interface ReserveConstraintCell {
  fundSize: number;
  reserveRatio: number;
  netTVPIMedian: number;
  modeledCompanyCount: number;
  topQuartileProbability: number;
  feasible: boolean;
}

export interface ReserveConstraintMap {
  fundSizes: number[];
  reserveRatios: number[];
  cells: ReserveConstraintCell[];
  recommendedCell: ReserveConstraintCell | null;
  note: string;
}

export interface FundConstructionSummary {
  managementFees: number;
  investableCapital: number;
  initialDeploymentBudget: number;
  reserveBudget: number;
  modeledCompanyCount: number;
  followOnCapacity: number;
  oneCompanyReturnFundExit: number;
  grossTVPIMedian: number;
  netTVPIMedian: number;
  netIrrMedian: number;
  oneCompanyReturnsFundProbability: number;
  topQuartileProbability: number;
  topWinnerShareMedian: number;
  topThreeShareMedian: number;
  netMultipleThresholds: ThresholdMetric[];
  netMultipleHistogram: HistogramBucket[];
  concentrationMetrics: ThresholdMetric[];
  timeline: Array<{
    year: number;
    dpiMedian: number;
    tvpiMedian: number;
    paidInRatioMedian: number;
  }>;
  feeCarrySchedule: FundFeeCarryScheduleRow[];
  strategyMatrix: FundStrategyMatrixRow[];
  sensitivity: FundTornadoBar[];
  reserveConstraintMap: ReserveConstraintMap;
  lossConcentration: FundLossConcentrationSummary;
  warnings: string[];
}

const stageRiskProfiles: Record<
  FundingStage,
  Array<{ label: string; range: [number, number]; weight: number; exitYears: [number, number] }>
> = {
  pre_seed: [
    { label: "fail", range: [0, 0.2], weight: 0.72, exitYears: [2, 5] },
    { label: "small", range: [0.2, 1.5], weight: 0.16, exitYears: [4, 7] },
    { label: "solid", range: [1.5, 6], weight: 0.08, exitYears: [5, 8] },
    { label: "breakout", range: [6, 25], weight: 0.03, exitYears: [6, 10] },
    { label: "outlier", range: [25, 120], weight: 0.01, exitYears: [7, 12] },
  ],
  seed: [
    { label: "fail", range: [0, 0.25], weight: 0.65, exitYears: [2, 5] },
    { label: "small", range: [0.25, 1.8], weight: 0.19, exitYears: [4, 7] },
    { label: "solid", range: [1.8, 7], weight: 0.1, exitYears: [5, 8] },
    { label: "breakout", range: [7, 28], weight: 0.045, exitYears: [6, 10] },
    { label: "outlier", range: [28, 130], weight: 0.015, exitYears: [7, 12] },
  ],
  series_a: [
    { label: "fail", range: [0, 0.35], weight: 0.52, exitYears: [2, 5] },
    { label: "small", range: [0.35, 2.1], weight: 0.24, exitYears: [3, 6] },
    { label: "solid", range: [2.1, 8], weight: 0.15, exitYears: [4, 8] },
    { label: "breakout", range: [8, 24], weight: 0.07, exitYears: [5, 9] },
    { label: "outlier", range: [24, 90], weight: 0.02, exitYears: [6, 10] },
  ],
  series_b: [
    { label: "fail", range: [0, 0.45], weight: 0.42, exitYears: [2, 4] },
    { label: "small", range: [0.45, 2.4], weight: 0.28, exitYears: [3, 6] },
    { label: "solid", range: [2.4, 7], weight: 0.19, exitYears: [4, 7] },
    { label: "breakout", range: [7, 18], weight: 0.09, exitYears: [4, 8] },
    { label: "outlier", range: [18, 50], weight: 0.02, exitYears: [5, 9] },
  ],
  series_c: [
    { label: "fail", range: [0, 0.55], weight: 0.33, exitYears: [1, 4] },
    { label: "small", range: [0.55, 2.1], weight: 0.31, exitYears: [2, 5] },
    { label: "solid", range: [2.1, 5.5], weight: 0.22, exitYears: [3, 6] },
    { label: "breakout", range: [5.5, 12], weight: 0.11, exitYears: [3, 7] },
    { label: "outlier", range: [12, 30], weight: 0.03, exitYears: [4, 8] },
  ],
};

function buildFixedHistogram(
  values: number[],
  ranges: { label: string; min: number; max: number }[],
): HistogramBucket[] {
  if (values.length === 0) {
    return ranges.map((range) => ({ label: range.label, value: 0 }));
  }

  const buckets = ranges.map((range) => ({ label: range.label, value: 0 }));
  for (const value of values) {
    const index = ranges.findIndex((range) => value >= range.min && value < range.max);
    buckets[index === -1 ? buckets.length - 1 : index].value += 1;
  }

  return buckets.map((bucket) => ({ ...bucket, value: bucket.value / values.length }));
}

function toProbability(label: string, count: number, total: number): ThresholdMetric {
  return {
    label,
    probability: total === 0 ? 0 : count / total,
  };
}

function medianNumber(values: number[]) {
  return values.length === 0 ? 0 : median(values);
}

interface FundSummaryOptions {
  includeExtensions?: boolean;
  simulationCountOverride?: number;
}

function minimumDiversificationTarget(stage: FundingStage) {
  if (stage === "pre_seed" || stage === "seed") {
    return 20;
  }
  if (stage === "series_a") {
    return 15;
  }
  return 10;
}

function roundFundSize(value: number) {
  const increment = value >= 250_000_000 ? 25_000_000 : value >= 100_000_000 ? 10_000_000 : 5_000_000;
  return Math.max(increment, Math.round(value / increment) * increment);
}

export function getDefaultFundConstructionConfig(): FundConstructionConfig {
  return {
    fundSize: 100_000_000,
    managementFeeRate: 0.02,
    carryRate: 0.2,
    reserveRatio: 0.35,
    initialCheckSize: 2_000_000,
    followOnCheckSize: 2_000_000,
    portfolioSize: 25,
    targetOwnership: 0.15,
    followOnStrategy: true,
    followOnThreshold: 4,
    fundLifeYears: 10,
    simulationCount: 5000,
    seed: 2026,
    stage: "seed",
    marketOverlay: "base",
    sectorOverlay: "standard",
  };
}

export function getFundPresetOptions(): FundPresetOption[] {
  return [
    {
      id: "micro_seed",
      name: "Micro-fund",
      note: "A small seed vehicle optimized for many initial shots and lighter reserves.",
      config: {
        ...getDefaultFundConstructionConfig(),
        fundSize: 25_000_000,
        initialCheckSize: 500_000,
        followOnCheckSize: 500_000,
        reserveRatio: 0.2,
        portfolioSize: 30,
        targetOwnership: 0.1,
      },
    },
    {
      id: "standard_seed",
      name: "Standard seed",
      note: "Balanced seed construction with enough diversification before reserves crowd out first checks.",
      config: getDefaultFundConstructionConfig(),
    },
    {
      id: "series_a",
      name: "Series A",
      note: "Larger checks, fewer companies, and higher ownership per name.",
      config: {
        ...getDefaultFundConstructionConfig(),
        fundSize: 300_000_000,
        initialCheckSize: 10_000_000,
        followOnCheckSize: 8_000_000,
        reserveRatio: 0.4,
        portfolioSize: 20,
        targetOwnership: 0.18,
        stage: "series_a",
      },
    },
    {
      id: "growth",
      name: "Growth",
      note: "Concentrated later-stage construction that relies on much larger underlying exits.",
      config: {
        ...getDefaultFundConstructionConfig(),
        fundSize: 1_000_000_000,
        initialCheckSize: 30_000_000,
        followOnCheckSize: 25_000_000,
        reserveRatio: 0.5,
        portfolioSize: 15,
        targetOwnership: 0.08,
        stage: "series_c",
      },
    },
  ];
}

export function summarizeFundConstruction(
  config: FundConstructionConfig,
  options: FundSummaryOptions = {},
): FundConstructionSummary {
  const feeYears = 10;
  const managementFees = config.fundSize * config.managementFeeRate * feeYears;
  const investableCapital = Math.max(0, config.fundSize - managementFees);
  const reserveBudget = investableCapital * config.reserveRatio;
  const initialDeploymentBudget = Math.max(0, investableCapital - reserveBudget);
  const modeledCompanyCount = Math.max(1, Math.min(config.portfolioSize, Math.floor(initialDeploymentBudget / config.initialCheckSize)));
  const followOnCapacity =
    config.followOnStrategy && config.followOnCheckSize > 0 ? Math.floor(reserveBudget / config.followOnCheckSize) : 0;
  const oneCompanyReturnFundExit =
    config.targetOwnership > 0 ? config.fundSize / config.targetOwnership : Number.POSITIVE_INFINITY;

  const grossTvpis: number[] = [];
  const netTvpis: number[] = [];
  const netIrrs: number[] = [];
  const topWinnerShares: number[] = [];
  const topThreeShares: number[] = [];
  const maxCompanyProceeds: number[] = [];
  const netDistributions: number[] = [];
  const followOnDeploymentRates: number[] = [];
  const signalingRisks: boolean[] = [];
  const lossRatios: number[] = [];
  const lossOfCapitalRatios: number[] = [];
  const dpiTimelineSamples: number[][] = Array.from({ length: config.fundLifeYears + 1 }, () => []);
  const tvpiTimelineSamples: number[][] = Array.from({ length: config.fundLifeYears + 1 }, () => []);
  const paidInTimelineSamples: number[][] = Array.from({ length: config.fundLifeYears + 1 }, () => []);
  const feesScheduleSamples: number[][] = Array.from({ length: config.fundLifeYears + 1 }, () => []);
  const paidInScheduleSamples: number[][] = Array.from({ length: config.fundLifeYears + 1 }, () => []);
  const grossDistributionScheduleSamples: number[][] = Array.from({ length: config.fundLifeYears + 1 }, () => []);
  const carryScheduleSamples: number[][] = Array.from({ length: config.fundLifeYears + 1 }, () => []);
  const netDistributionScheduleSamples: number[][] = Array.from({ length: config.fundLifeYears + 1 }, () => []);
  const cumulativeNetDistributionScheduleSamples: number[][] = Array.from({ length: config.fundLifeYears + 1 }, () => []);

  const market = marketOverlayMultipliers[config.marketOverlay];
  const sector = sectorOverlayMultipliers[config.sectorOverlay];
  const annualManagementFee = config.fundSize * config.managementFeeRate;
  const deploymentYears = Math.max(1, Math.min(3, config.fundLifeYears));
  const simulationCount = options.simulationCountOverride ?? config.simulationCount;

  for (let iteration = 0; iteration < simulationCount; iteration += 1) {
    const rng = createRng(config.seed + iteration);
    const companyProceeds: number[] = [];
    const exitYears: number[] = [];
    const initialCallYears: number[] = [];
    const followOnCallYears: number[] = [];
    const investedByCompany: number[] = [];
    let eligibleForFollowOn = 0;
    let followOnsDeployed = 0;
    let remainingReserves = reserveBudget;

    for (let company = 0; company < modeledCompanyCount; company += 1) {
      const outcome = pickWeighted(
        rng,
        stageRiskProfiles[config.stage].map((profile) => ({
          value: profile,
          weight: profile.weight,
        })),
      );

      const initialMultiple =
        randomBetween(rng, outcome.range[0], outcome.range[1]) * market.exit * sector.exit * randomBetween(rng, 0.88, 1.12);
      const exitYearsForCompany = randomBetween(rng, outcome.exitYears[0], outcome.exitYears[1]);
      let proceeds = config.initialCheckSize * initialMultiple;
      let investedCapital = config.initialCheckSize;
      const initialCallYear = Math.min(config.fundLifeYears, 1 + (company % deploymentYears));
      let followOnCallYear = 0;

      if (config.followOnStrategy && initialMultiple >= config.followOnThreshold && remainingReserves >= config.followOnCheckSize) {
        eligibleForFollowOn += 1;
        const followOnMultiple = Math.max(1, initialMultiple * randomBetween(rng, 0.28, 0.52));
        proceeds += config.followOnCheckSize * followOnMultiple;
        remainingReserves -= config.followOnCheckSize;
        investedCapital += config.followOnCheckSize;
        followOnCallYear = Math.min(config.fundLifeYears, Math.max(2, Math.min(4, Math.round(exitYearsForCompany / 2))));
        followOnsDeployed += 1;
      } else if (config.followOnStrategy && initialMultiple >= config.followOnThreshold) {
        eligibleForFollowOn += 1;
      }

      companyProceeds.push(proceeds);
      exitYears.push(exitYearsForCompany);
      initialCallYears.push(initialCallYear);
      followOnCallYears.push(followOnCallYear);
      investedByCompany.push(investedCapital);
    }

    const grossDistribution = companyProceeds.reduce((sum, value) => sum + value, 0);
    const netDistribution = Math.min(config.fundSize, grossDistribution) + (1 - config.carryRate) * Math.max(0, grossDistribution - config.fundSize);
    const weightedYears =
      companyProceeds.reduce((sum, value, index) => sum + value * (exitYears[index] ?? config.fundLifeYears), 0) /
      Math.max(1, grossDistribution);
    const grossTvpi = grossDistribution / config.fundSize;
    const netTvpi = netDistribution / config.fundSize;
    const netIrr = netTvpi > 0 ? Math.pow(netTvpi, 1 / Math.max(1, weightedYears)) - 1 : -1;
    const sorted = [...companyProceeds].sort((a, b) => b - a);
    const topWinnerShare = grossDistribution > 0 ? (sorted[0] ?? 0) / grossDistribution : 0;
    const topThreeShare = grossDistribution > 0 ? sorted.slice(0, 3).reduce((sum, value) => sum + value, 0) / grossDistribution : 0;
    const lossRatio = investedByCompany.filter((investedCapital, index) => (companyProceeds[index] ?? 0) < investedCapital).length /
      Math.max(1, investedByCompany.length);
    const lossOfCapitalRatio =
      investedByCompany.reduce((sum, investedCapital, index) => sum + Math.max(0, investedCapital - (companyProceeds[index] ?? 0)), 0) /
      Math.max(1, investedByCompany.reduce((sum, investedCapital) => sum + investedCapital, 0));

    grossTvpis.push(grossTvpi);
    netTvpis.push(netTvpi);
    netIrrs.push(netIrr);
    topWinnerShares.push(topWinnerShare);
    topThreeShares.push(topThreeShare);
    maxCompanyProceeds.push(sorted[0] ?? 0);
    netDistributions.push(netDistribution);
    followOnDeploymentRates.push(eligibleForFollowOn > 0 ? followOnsDeployed / eligibleForFollowOn : config.followOnStrategy ? 1 : 0);
    signalingRisks.push(eligibleForFollowOn > 0 && followOnsDeployed > 0 && followOnsDeployed < eligibleForFollowOn);
    lossRatios.push(lossRatio);
    lossOfCapitalRatios.push(lossOfCapitalRatio);

    let cumulativeNetDistributionsForYear = 0;
    for (let year = 0; year <= config.fundLifeYears; year += 1) {
      const cumulativeFees = year === 0 ? 0 : Math.min(year, feeYears) * annualManagementFee;
      const cumulativeInitialCalls = initialCallYears.reduce(
        (sum, callYear) => sum + (callYear > 0 && callYear <= year ? config.initialCheckSize : 0),
        0,
      );
      const cumulativeFollowOnCalls = followOnCallYears.reduce(
        (sum, callYear) => sum + (callYear > 0 && callYear <= year ? config.followOnCheckSize : 0),
        0,
      );
      const paidInCapital = cumulativeFees + cumulativeInitialCalls + cumulativeFollowOnCalls;
      const cumulativeDistributions = companyProceeds.reduce(
        (sum, proceeds, index) => sum + ((exitYears[index] ?? config.fundLifeYears) <= year ? proceeds : 0),
        0,
      );
      const yearlyGrossDistributions = companyProceeds.reduce((sum, proceeds, index) => {
        const exitYear = Math.min(config.fundLifeYears, Math.max(1, Math.round(exitYears[index] ?? config.fundLifeYears)));
        return sum + (exitYear === year ? proceeds : 0);
      }, 0);
      const cumulativeCarry = config.carryRate * Math.max(0, cumulativeDistributions - config.fundSize);
      const priorCumulativeDistributions =
        year === 0
          ? 0
          : companyProceeds.reduce((sum, proceeds, index) => {
              const exitYear = exitYears[index] ?? config.fundLifeYears;
              return sum + (exitYear <= year - 1 ? proceeds : 0);
            }, 0);
      const priorCumulativeCarry = config.carryRate * Math.max(0, priorCumulativeDistributions - config.fundSize);
      const yearlyCarry = Math.max(0, cumulativeCarry - priorCumulativeCarry);
      const yearlyNetDistributions = Math.max(0, yearlyGrossDistributions - yearlyCarry);
      const unrealizedAtCost = investedByCompany.reduce((sum, investedCapital, index) => {
        const callYear = initialCallYears[index] ?? 1;
        const exited = (exitYears[index] ?? config.fundLifeYears) <= year;
        return sum + (callYear <= year && !exited ? investedCapital : 0);
      }, 0);

      dpiTimelineSamples[year].push(paidInCapital > 0 ? cumulativeDistributions / paidInCapital : 0);
      tvpiTimelineSamples[year].push(
        paidInCapital > 0 ? (cumulativeDistributions + unrealizedAtCost) / paidInCapital : 0,
      );
      paidInTimelineSamples[year].push(config.fundSize > 0 ? paidInCapital / config.fundSize : 0);
      cumulativeNetDistributionsForYear += yearlyNetDistributions;
      feesScheduleSamples[year].push(year === 0 ? 0 : year <= feeYears ? annualManagementFee : 0);
      paidInScheduleSamples[year].push(paidInCapital);
      grossDistributionScheduleSamples[year].push(yearlyGrossDistributions);
      carryScheduleSamples[year].push(yearlyCarry);
      netDistributionScheduleSamples[year].push(yearlyNetDistributions);
      cumulativeNetDistributionScheduleSamples[year].push(cumulativeNetDistributionsForYear);
    }
  }

  const warnings = [];
  if (modeledCompanyCount < config.portfolioSize) {
    warnings.push(
      `The initial deployment budget only supports ${modeledCompanyCount} companies at the current initial check size, so the requested portfolio count is truncated.`,
    );
  }
  if (config.followOnStrategy && followOnCapacity === 0) {
    warnings.push("Follow-on strategy is enabled, but the reserve budget cannot fund even one follow-on check.");
  }
  if ((config.stage === "pre_seed" || config.stage === "seed") && modeledCompanyCount < 20) {
    warnings.push(
      `This ${config.stage.replace("_", " ")} fund only supports ${modeledCompanyCount} initial companies. Early-stage diversification is usually stronger closer to 20-30 names.`,
    );
  }
  if ((config.stage === "pre_seed" || config.stage === "seed") && config.reserveRatio > 0.45) {
    warnings.push(
      "Reserve ratio is high for an early-stage fund. Heavy reserves can starve initial deployment and make the fund look more pessimistic than the underlying strategy intends.",
    );
  }
  if (config.stage === "pre_seed" && config.fundSize > 300_000_000) {
    warnings.push("A very large fund paired with pre-seed checks will struggle to move the fund without extreme concentration.");
  }
  if (config.stage === "series_c" && config.targetOwnership > 0.1) {
    warnings.push("Later-stage ownership targets above 10% are uncommon and will overstate return-the-fund odds.");
  }
  const followOnDeploymentRateMedian = medianNumber(followOnDeploymentRates);
  const selectiveSignalProbability = signalingRisks.filter(Boolean).length / Math.max(1, signalingRisks.length);
  if (config.followOnStrategy && selectiveSignalProbability > 0.2) {
    warnings.push(
      `The current follow-on setup leaves a median ownership maintenance rate near ${formatPercent(followOnDeploymentRateMedian)} and creates selective signaling in ${formatPercent(selectiveSignalProbability)} of paths.`,
    );
  }

  const feeCarrySchedule: FundFeeCarryScheduleRow[] = Array.from({ length: config.fundLifeYears + 1 }, (_, year) => ({
    year,
    feesPaid: medianNumber(feesScheduleSamples[year]),
    paidInCapital: medianNumber(paidInScheduleSamples[year]),
    grossDistributions: medianNumber(grossDistributionScheduleSamples[year]),
    carryPaid: medianNumber(carryScheduleSamples[year]),
    netDistributions: medianNumber(netDistributionScheduleSamples[year]),
    cumulativeNetDistributions: medianNumber(cumulativeNetDistributionScheduleSamples[year]),
  }));

  const lossConcentration: FundLossConcentrationSummary = {
    medianLossRatio: medianNumber(lossRatios),
    medianLossOfCapitalRatio: medianNumber(lossOfCapitalRatios),
    quadrantProbabilities: [
      toProbability(
        "High loss / concentrated",
        lossRatios.filter((value, index) => value >= 0.55 && (topWinnerShares[index] ?? 0) >= 0.5).length,
        lossRatios.length,
      ),
      toProbability(
        "High loss / diversified",
        lossRatios.filter((value, index) => value >= 0.55 && (topWinnerShares[index] ?? 0) < 0.5).length,
        lossRatios.length,
      ),
      toProbability(
        "Contained loss / concentrated",
        lossRatios.filter((value, index) => value < 0.55 && (topWinnerShares[index] ?? 0) >= 0.5).length,
        lossRatios.length,
      ),
      toProbability(
        "Contained loss / diversified",
        lossRatios.filter((value, index) => value < 0.55 && (topWinnerShares[index] ?? 0) < 0.5).length,
        lossRatios.length,
      ),
    ],
  };

  return {
    managementFees,
    investableCapital,
    initialDeploymentBudget,
    reserveBudget,
    modeledCompanyCount,
    followOnCapacity,
    oneCompanyReturnFundExit,
    grossTVPIMedian: percentile(grossTvpis, 0.5),
    netTVPIMedian: percentile(netTvpis, 0.5),
    netIrrMedian: percentile(netIrrs, 0.5),
    oneCompanyReturnsFundProbability:
      maxCompanyProceeds.filter((value) => value >= config.fundSize).length / Math.max(1, maxCompanyProceeds.length),
    topQuartileProbability: netTvpis.filter((value) => value >= 3).length / Math.max(1, netTvpis.length),
    topWinnerShareMedian: median(topWinnerShares),
    topThreeShareMedian: median(topThreeShares),
    netMultipleThresholds: [
      toProbability("1x+ net", netTvpis.filter((value) => value >= 1).length, netTvpis.length),
      toProbability("2x+ net", netTvpis.filter((value) => value >= 2).length, netTvpis.length),
      toProbability("3x+ net", netTvpis.filter((value) => value >= 3).length, netTvpis.length),
      toProbability("5x+ net", netTvpis.filter((value) => value >= 5).length, netTvpis.length),
    ],
    netMultipleHistogram: buildFixedHistogram(netTvpis, [
      { label: "<1x", min: Number.NEGATIVE_INFINITY, max: 1 },
      { label: "1x-2x", min: 1, max: 2 },
      { label: "2x-3x", min: 2, max: 3 },
      { label: "3x-5x", min: 3, max: 5 },
      { label: "5x+", min: 5, max: Number.POSITIVE_INFINITY },
    ]),
    concentrationMetrics: [
      { label: "Top winner share", probability: median(topWinnerShares) },
      { label: "Top three share", probability: median(topThreeShares) },
      toProbability("One company returns fund", maxCompanyProceeds.filter((value) => value >= config.fundSize).length, maxCompanyProceeds.length),
      toProbability("Top quartile net TVPI", netTvpis.filter((value) => value >= 3).length, netTvpis.length),
    ],
    timeline: Array.from({ length: config.fundLifeYears + 1 }, (_, year) => ({
      year,
      dpiMedian: median(dpiTimelineSamples[year]),
      tvpiMedian: median(tvpiTimelineSamples[year]),
      paidInRatioMedian: median(paidInTimelineSamples[year]),
    })),
    feeCarrySchedule,
    strategyMatrix: options.includeExtensions === false ? [] : buildStrategyMatrix(config),
    sensitivity: options.includeExtensions === false ? [] : buildSensitivityBars(config),
    reserveConstraintMap: options.includeExtensions === false ? emptyReserveConstraintMap() : buildReserveConstraintMap(config),
    lossConcentration,
    warnings,
  };
}

function emptyReserveConstraintMap(): ReserveConstraintMap {
  return {
    fundSizes: [],
    reserveRatios: [],
    cells: [],
    recommendedCell: null,
    note: "Constraint map is disabled for this lightweight summary run.",
  };
}

function buildStrategyMatrix(config: FundConstructionConfig): FundStrategyMatrixRow[] {
  const sampleCount = Math.min(1500, config.simulationCount);
  const variants: Array<{ label: string; note: string; config: FundConstructionConfig }> = [
    {
      label: "Full pro rata",
      note: "Defend ownership broadly and accept lower diversification plus lower signaling risk.",
      config: {
        ...config,
        followOnStrategy: true,
        reserveRatio: Math.max(config.reserveRatio, 0.35),
        followOnThreshold: 1.5,
      },
    },
    {
      label: "Selective winners",
      note: "Use reserves only on stronger breakout paths. Higher signaling risk, better reserve efficiency.",
      config: {
        ...config,
        followOnStrategy: true,
        followOnThreshold: Math.max(config.followOnThreshold, 4),
      },
    },
    {
      label: "No follow-on",
      note: "Put every dollar into first checks. Best diversification, no ownership defense after entry.",
      config: {
        ...config,
        followOnStrategy: false,
        reserveRatio: 0,
        followOnCheckSize: 0,
      },
    },
  ];

  return variants.map((variant) => {
    const summary = summarizeFundConstruction(sanitizeFundConstructionConfig(variant.config), {
      includeExtensions: false,
      simulationCountOverride: sampleCount,
    });
    const signalingRiskProbability =
      variant.label === "Selective winners"
        ? Math.max(0.15, Math.min(0.95, 1 - summary.followOnCapacity / Math.max(1, summary.modeledCompanyCount)))
        : variant.label === "Full pro rata"
          ? 0.08
          : 0.04;
    const ownershipMaintenanceRate =
      variant.label === "No follow-on"
        ? 0
        : Math.min(1, summary.followOnCapacity / Math.max(1, summary.modeledCompanyCount));

    return {
      label: variant.label,
      note: variant.note,
      netTVPIMedian: summary.netTVPIMedian,
      topWinnerShareMedian: summary.topWinnerShareMedian,
      oneCompanyReturnsFundProbability: summary.oneCompanyReturnsFundProbability,
      modeledCompanyCount: summary.modeledCompanyCount,
      followOnCapacity: summary.followOnCapacity,
      signalingRiskProbability,
      ownershipMaintenanceRate,
    };
  });
}

function buildSensitivityBars(config: FundConstructionConfig): FundTornadoBar[] {
  const sampleCount = Math.min(1200, config.simulationCount);
  const base = summarizeFundConstruction(config, {
    includeExtensions: false,
    simulationCountOverride: sampleCount,
  });
  const cases: Array<{
    label: string;
    lower: FundConstructionConfig;
    upper: FundConstructionConfig;
  }> = [
    {
      label: "Fund size",
      lower: { ...config, fundSize: config.fundSize * 0.8 },
      upper: { ...config, fundSize: config.fundSize * 1.2 },
    },
    {
      label: "Reserve ratio",
      lower: { ...config, reserveRatio: Math.max(0, config.reserveRatio - 0.1) },
      upper: { ...config, reserveRatio: Math.min(0.8, config.reserveRatio + 0.1) },
    },
    {
      label: "Initial check",
      lower: { ...config, initialCheckSize: config.initialCheckSize * 0.8 },
      upper: { ...config, initialCheckSize: config.initialCheckSize * 1.2 },
    },
    {
      label: "Target ownership",
      lower: { ...config, targetOwnership: Math.max(0.05, config.targetOwnership - 0.03) },
      upper: { ...config, targetOwnership: Math.min(0.3, config.targetOwnership + 0.03) },
    },
    {
      label: "Follow-on threshold",
      lower: { ...config, followOnThreshold: Math.max(1, config.followOnThreshold - 1) },
      upper: { ...config, followOnThreshold: Math.min(25, config.followOnThreshold + 1) },
    },
    {
      label: "Pareto tail by market",
      lower: { ...config, marketOverlay: "bear" },
      upper: { ...config, marketOverlay: "bull" },
    },
  ];

  return cases
    .map((item) => {
      const lowerSummary = summarizeFundConstruction(sanitizeFundConstructionConfig(item.lower), {
        includeExtensions: false,
        simulationCountOverride: sampleCount,
      });
      const upperSummary = summarizeFundConstruction(sanitizeFundConstructionConfig(item.upper), {
        includeExtensions: false,
        simulationCountOverride: sampleCount,
      });

      return {
        label: item.label,
        lowerDelta: lowerSummary.netTVPIMedian - base.netTVPIMedian,
        upperDelta: upperSummary.netTVPIMedian - base.netTVPIMedian,
      };
    })
    .sort(
      (left, right) =>
        Math.max(Math.abs(right.lowerDelta), Math.abs(right.upperDelta)) -
        Math.max(Math.abs(left.lowerDelta), Math.abs(left.upperDelta)),
    );
}

function buildReserveConstraintMap(config: FundConstructionConfig): ReserveConstraintMap {
  const sampleCount = Math.min(900, config.simulationCount);
  const reserveRatios = [0.15, 0.25, 0.35, 0.45, 0.55];
  const fundSizes = Array.from(
    new Set([0.6, 0.8, 1, 1.25, 1.5].map((multiple) => roundFundSize(config.fundSize * multiple))),
  ).sort((left, right) => left - right);
  const diversificationTarget = minimumDiversificationTarget(config.stage);

  const cells: ReserveConstraintCell[] = [];

  for (const fundSize of fundSizes) {
    for (const reserveRatio of reserveRatios) {
      const summary = summarizeFundConstruction(
        sanitizeFundConstructionConfig({
          ...config,
          fundSize,
          reserveRatio,
        }),
        {
          includeExtensions: false,
          simulationCountOverride: sampleCount,
        },
      );

      cells.push({
        fundSize,
        reserveRatio,
        netTVPIMedian: summary.netTVPIMedian,
        modeledCompanyCount: summary.modeledCompanyCount,
        topQuartileProbability: summary.topQuartileProbability,
        feasible:
          summary.modeledCompanyCount >= diversificationTarget &&
          (!config.followOnStrategy || summary.followOnCapacity > 0),
      });
    }
  }

  const recommendedCell =
    [...cells]
      .sort((left, right) => {
        const leftScore =
          left.netTVPIMedian +
          left.topQuartileProbability * 0.6 -
          Math.max(0, diversificationTarget - left.modeledCompanyCount) * 0.08 +
          (left.feasible ? 0.4 : -0.4);
        const rightScore =
          right.netTVPIMedian +
          right.topQuartileProbability * 0.6 -
          Math.max(0, diversificationTarget - right.modeledCompanyCount) * 0.08 +
          (right.feasible ? 0.4 : -0.4);
        return rightScore - leftScore;
      })
      [0] ?? null;

  return {
    fundSizes,
    reserveRatios,
    cells,
    recommendedCell,
    note: `Cells show median net TVPI and supported company count. Feasible cells meet the ${diversificationTarget}-company diversification floor for this stage and preserve follow-on capacity when follow-on is enabled.`,
  };
}

export function sanitizeFundConstructionConfig(config: FundConstructionConfig): FundConstructionConfig {
  return {
    ...config,
    managementFeeRate: clamp(config.managementFeeRate, 0, 0.03),
    carryRate: clamp(config.carryRate, 0, 0.3),
    reserveRatio: clamp(config.reserveRatio, 0, 0.8),
    initialCheckSize: Math.max(50_000, config.initialCheckSize),
    followOnCheckSize: Math.max(0, config.followOnCheckSize),
    portfolioSize: Math.max(1, Math.round(config.portfolioSize)),
    targetOwnership: clamp(config.targetOwnership, 0.01, 0.35),
    followOnThreshold: clamp(config.followOnThreshold, 1, 25),
    fundLifeYears: clamp(config.fundLifeYears, 4, 15),
    simulationCount: Math.max(500, Math.round(config.simulationCount)),
    seed: Math.max(1, Math.round(config.seed)),
  };
}
