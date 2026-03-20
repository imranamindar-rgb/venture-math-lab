import { getStageIndex, stagePresets } from "@/data/presets";
import { getCurrentFinancing } from "@/lib/current-financing";
import { FundingStage, ScenarioConfig, ThresholdMetric, stageOrder } from "@/lib/sim/types";

export interface StatementBridgeLine {
  label: string;
  currentValue: number;
  postRaiseValue: number;
  note: string;
}

export interface CashFlowBridgeLine {
  label: string;
  value: number;
  note: string;
}

export interface OperatorSummary {
  runwayMonths: number;
  postRaiseRunwayMonths: number;
  monthsToNextBenchmark: number;
  financingGap: number;
  bufferGap: number;
  annualizedRevenue: number;
  projectedRevenueAtNextRound: number;
  grossProfitAnnualized: number;
  operatingCashFlowAnnualized: number;
  freeCashFlowAnnualized: number;
  burnMultiple: number;
  grossMarginBand: "Low" | "Healthy" | "Software-like";
  runwayBand: "Critical" | "Tight" | "Comfortable";
  currentAssets: number;
  currentLiabilities: number;
  workingCapital: number;
  quickRatio: number;
  currentRatio: number;
  financingClassification: string;
  netFinancingProceeds: number;
  operatingSignals: ThresholdMetric[];
  balanceSheetBridge: StatementBridgeLine[];
  cashFlowBridge: CashFlowBridgeLine[];
  warnings: string[];
}

function getNextBenchmarkStage(currentStage: FundingStage) {
  const currentIndex = getStageIndex(currentStage);
  return stageOrder[Math.min(stageOrder.length - 1, currentIndex + 1)] as FundingStage;
}

function formatUsd(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function summarizeOperatorIntelligence(config: ScenarioConfig): OperatorSummary {
  const stagePreset = stagePresets[config.currentStage];
  const nextStage = getNextBenchmarkStage(config.currentStage);
  const monthsToNextBenchmark = stagePreset.monthsToNext;
  const financing = getCurrentFinancing(config);
  const netFinancingProceeds = Math.max(0, financing.totalRoundRaise - config.operating.transactionFees);
  const runwayMonths =
    config.operating.monthlyBurn > 0 ? config.operating.cashOnHand / config.operating.monthlyBurn : Number.POSITIVE_INFINITY;
  const postRaiseCash = config.operating.cashOnHand + netFinancingProceeds;
  const postRaiseRunwayMonths =
    config.operating.monthlyBurn > 0 ? postRaiseCash / config.operating.monthlyBurn : Number.POSITIVE_INFINITY;
  const bufferCash = config.operating.monthlyBurn * config.operating.targetCashBufferMonths;
  const cashNeededToNextRound = config.operating.monthlyBurn * monthsToNextBenchmark;
  const financingGap = Math.max(0, cashNeededToNextRound - config.operating.cashOnHand);
  const bufferGap = Math.max(0, cashNeededToNextRound + bufferCash - config.operating.cashOnHand);
  const annualizedRevenue = config.operating.monthlyRevenue * 12;
  const projectedRevenueAtNextRound =
    config.operating.monthlyRevenue * Math.pow(1 + config.operating.monthlyRevenueGrowth, monthsToNextBenchmark) * 12;
  const grossProfitAnnualized = annualizedRevenue * config.operating.grossMargin;
  const operatingCashFlowAnnualized = -(config.operating.monthlyBurn * 12);
  const freeCashFlowAnnualized = -((config.operating.monthlyBurn + config.operating.capexMonthly) * 12);
  const nextTwelveMonthRevenue =
    config.operating.monthlyRevenue * Math.pow(1 + config.operating.monthlyRevenueGrowth, 12) * 12;
  const annualizedBurn = config.operating.monthlyBurn * 12;
  const burnMultiple = annualizedBurn / Math.max(1, nextTwelveMonthRevenue - annualizedRevenue);
  const currentAssets =
    config.operating.cashOnHand + config.operating.accountsReceivable + config.operating.inventory;
  const currentLiabilities = config.operating.accountsPayable + financing.totalRoundRaise * (config.currentRoundKind === "convertible_note_cap" ? 1 : 0);
  const workingCapital = currentAssets - currentLiabilities;
  const quickRatio =
    currentLiabilities > 0
      ? (config.operating.cashOnHand + config.operating.accountsReceivable) / currentLiabilities
      : Number.POSITIVE_INFINITY;
  const currentRatio = currentLiabilities > 0 ? currentAssets / currentLiabilities : Number.POSITIVE_INFINITY;
  const financingClassification =
    config.currentRoundKind === "priced_preferred"
      ? "Preferred equity"
      : config.currentRoundKind === "safe_post_money"
        ? "SAFE / temporary equity"
        : "Convertible debt";
  const operatingCashToBenchmark = config.operating.monthlyBurn * monthsToNextBenchmark;
  const capexToBenchmark = config.operating.capexMonthly * monthsToNextBenchmark;
  const postRaiseLiabilities =
    config.operating.accountsPayable + financing.totalRoundRaise * (config.currentRoundKind === "convertible_note_cap" ? 1 : 0);
  const postRaiseAssets =
    postRaiseCash + config.operating.accountsReceivable + config.operating.inventory;
  const postRaiseEquityLikeCapital =
    financing.totalRoundRaise * (config.currentRoundKind === "priced_preferred" || config.currentRoundKind === "safe_post_money" ? 1 : 0);

  const runwayBand =
    runwayMonths < monthsToNextBenchmark * 0.75
      ? "Critical"
      : runwayMonths < monthsToNextBenchmark + config.operating.targetCashBufferMonths
        ? "Tight"
        : "Comfortable";
  const grossMarginBand =
    config.operating.grossMargin < 0.5 ? "Low" : config.operating.grossMargin < 0.75 ? "Healthy" : "Software-like";

  const warnings: string[] = [];
  if (runwayMonths < monthsToNextBenchmark) {
    warnings.push(
      `Current runway is shorter than the ${monthsToNextBenchmark}-month benchmark to ${stagePresets[nextStage].label}, so this company likely needs bridge financing or a faster milestone path.`,
    );
  }
  if (bufferGap > 0) {
    warnings.push(
      `To reach the next benchmark round with a ${config.operating.targetCashBufferMonths}-month cash buffer, the company needs ${formatUsd(bufferGap)} more cash.`,
    );
  }
  if (burnMultiple > 3) {
    warnings.push("Burn multiple is high relative to projected revenue growth, which can make the next round much harder even if the company survives.");
  }
  if (config.operating.grossMargin < 0.65) {
    warnings.push("Gross margin is below typical software-like venture profiles, so valuation step-ups may be harder to justify.");
  }
  if (currentRatio < 1) {
    warnings.push("Current ratio is below 1.0, which means short-term obligations are outrunning near-term assets in this simplified balance-sheet view.");
  }
  if (config.operating.transactionFees > financing.totalRoundRaise * 0.08) {
    warnings.push("Transaction fees consume an unusually large share of the modeled financing, so the headline round size overstates the cash that lands on the balance sheet.");
  }

  return {
    runwayMonths,
    postRaiseRunwayMonths,
    monthsToNextBenchmark,
    financingGap,
    bufferGap,
    annualizedRevenue,
    projectedRevenueAtNextRound,
    grossProfitAnnualized,
    operatingCashFlowAnnualized,
    freeCashFlowAnnualized,
    burnMultiple,
    grossMarginBand,
    runwayBand,
    currentAssets,
    currentLiabilities,
    workingCapital,
    quickRatio,
    currentRatio,
    financingClassification,
    netFinancingProceeds,
    operatingSignals: [
      { label: "Runway covers next round", probability: Math.min(1, runwayMonths / Math.max(1, monthsToNextBenchmark)) },
      { label: "Post-close runway", probability: Math.min(1, postRaiseRunwayMonths / Math.max(1, monthsToNextBenchmark + config.operating.targetCashBufferMonths)) },
      { label: "Working-capital health", probability: currentRatio === Number.POSITIVE_INFINITY ? 1 : Math.min(1, currentRatio / 2) },
      { label: "Gross margin quality", probability: config.operating.grossMargin },
      { label: "Revenue growth support", probability: Math.min(1, config.operating.monthlyRevenueGrowth / 0.12) },
    ],
    balanceSheetBridge: [
      {
        label: "Cash",
        currentValue: config.operating.cashOnHand,
        postRaiseValue: postRaiseCash,
        note: "Cash is the only balance-sheet line that directly extends runway.",
      },
      {
        label: "Accounts receivable",
        currentValue: config.operating.accountsReceivable,
        postRaiseValue: config.operating.accountsReceivable,
        note: "Revenue can exist before cash arrives, which is why growth does not guarantee liquidity.",
      },
      {
        label: "Inventory",
        currentValue: config.operating.inventory,
        postRaiseValue: config.operating.inventory,
        note: "Inventory traps cash before it becomes revenue. Software companies usually keep this near zero.",
      },
      {
        label: "Accounts payable",
        currentValue: config.operating.accountsPayable,
        postRaiseValue: postRaiseLiabilities,
        note: "Payables help working capital, but they are still short-term obligations.",
      },
      {
        label: financingClassification,
        currentValue: config.currentRoundKind === "convertible_note_cap" ? 0 : 0,
        postRaiseValue: postRaiseEquityLikeCapital,
        note: "Preferred and SAFE financings bring in cash without adding current liabilities in this simplified bridge.",
      },
    ],
    cashFlowBridge: [
      {
        label: "Opening cash",
        value: config.operating.cashOnHand,
        note: "Starting unrestricted cash before the modeled financing closes.",
      },
      {
        label: "Net financing proceeds",
        value: netFinancingProceeds,
        note: "Round size minus modeled transaction fees.",
      },
      {
        label: "Operating cash outflow to next benchmark",
        value: -operatingCashToBenchmark,
        note: "Monthly burn multiplied by months to the next benchmark financing window.",
      },
      {
        label: "Capex to next benchmark",
        value: -capexToBenchmark,
        note: "Capital expenditures are separate from operating burn and still consume cash.",
      },
      {
        label: "Cash at next benchmark if this round closes",
        value: postRaiseCash - operatingCashToBenchmark - capexToBenchmark,
        note: "This is the simplest bridge from financing event to survival cash.",
      },
    ],
    warnings,
  };
}
