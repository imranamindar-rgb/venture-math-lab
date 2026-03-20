import {
  getStageIndex,
  marketOverlayMultipliers,
  sectorOverlayMultipliers,
  stagePresets,
} from "@/data/presets";
import {
  applySecondaryLiquidity,
  createInitialCapTable,
  createOwnershipPoint,
  getEmployeeOwnership,
  getFounderOwnership,
  getInvestorOwnership,
  getPoolOwnership,
  issuePreferredRound,
  maybeConvertNote,
  maybeConvertSafe,
  maybeRefreshPool,
  getReferencePostMoney,
  projectMedianRound,
} from "@/lib/engines/cap-table-waterfall";
import { computeWaterfall } from "@/lib/engines/cap-table-waterfall/waterfall";
import {
  CapTableSnapshot,
  FundingStage,
  OwnershipPoint,
  ScenarioConfig,
  stageOrder,
} from "@/lib/sim/types";
import { getCurrentFinancing } from "@/lib/current-financing";

export interface FormulaLine {
  label: string;
  formula: string;
  value: number;
  note: string;
  format: "currency" | "percent";
}

export interface DeterministicRoundProjection {
  stage: FundingStage;
  label: string;
  monthsElapsed: number;
  preMoney: number;
  roundSize: number;
  postMoney: number;
  stepUpRatio: number;
  founderOwnership: number;
  employeeOwnership: number;
  investorOwnership: number;
  poolOwnership: number;
  secondaryApplied: boolean;
  antiDilutionApplied: boolean;
}

export interface DeterministicWaterfallScenario {
  label: string;
  exitValue: number;
  founderProceeds: number;
  employeeProceeds: number;
  investorProceeds: number;
  preferredConverted: boolean;
  preferredStructure: string;
}

export interface DeterministicFinanceSummary {
  currentPostMoney: number;
  currentInvestorOwnership: number;
  benchmarkNextStepUp: number;
  breakEvenExit: number;
  threeXExit: number;
  returnTheFundExit: number;
  formulas: FormulaLine[];
  ownershipSeries: OwnershipPoint[];
  roundProjection: DeterministicRoundProjection[];
  waterfallScenarios: DeterministicWaterfallScenario[];
  warnings: string[];
}

function getCurrentInvestorOwnershipEstimate(config: ScenarioConfig) {
  return getCurrentFinancing(config).investorOwnershipEstimate;
}

function getEmployeeExerciseCost(config: ScenarioConfig, snapshot: CapTableSnapshot, exitValue: number) {
  const commonShares = snapshot.founderCommon + snapshot.employeeCommon + snapshot.secondaryCommon;
  const sharePrice = commonShares > 0 ? exitValue / commonShares : 0;
  const grantShares = 10_000_000 * (config.employee.grantOwnershipPercent / 100);
  return grantShares * config.employee.vestedFraction * Math.max(0, config.employee.strikePrice - sharePrice * 0.15);
}

function projectDeterministicPath(config: ScenarioConfig) {
  const snapshot = createInitialCapTable(config);
  const ownershipSeries: OwnershipPoint[] = [createOwnershipPoint("Current", snapshot)];
  const roundProjection: DeterministicRoundProjection[] = [];

  let currentPostMoney = getReferencePostMoney(config);
  let monthsElapsed = 0;
  let currentStageIndex = getStageIndex(config.currentStage);
  let safeConverted = config.currentRoundKind !== "safe_post_money";
  let noteConverted = config.currentRoundKind !== "convertible_note_cap";

  while (currentStageIndex < stageOrder.length - 1) {
    const nextStage = stageOrder[currentStageIndex + 1] as FundingStage;
    const preset = stagePresets[nextStage];
    monthsElapsed += preset.monthsToNext;
    const nextRound = projectMedianRound(nextStage, currentPostMoney, config);

    const optionPoolRefreshed = maybeRefreshPool(snapshot, config);

    if (!noteConverted && config.note.enabled) {
      noteConverted = maybeConvertNote(snapshot, config, nextRound.preMoney, monthsElapsed).converted;
    }

    if (!safeConverted && config.safe.enabled) {
      safeConverted = maybeConvertSafe(snapshot, config).converted;
    }

    const issued = issuePreferredRound(snapshot, nextRound.preMoney, nextRound.roundSize, config, preset.label);
    const shouldApplySecondary =
      config.secondary.enabled && (nextStage === "series_b" || nextStage === "series_c");

    if (shouldApplySecondary) {
      applySecondaryLiquidity(
        snapshot,
        issued.pricePerShare,
        config.secondary.founderSaleFraction,
        config.secondary.employeeSaleFraction,
      );
    }

    ownershipSeries.push(createOwnershipPoint(preset.label, snapshot));
    roundProjection.push({
      stage: nextStage,
      label: preset.label,
      monthsElapsed,
      preMoney: nextRound.preMoney,
      roundSize: nextRound.roundSize,
      postMoney: nextRound.postMoney,
      stepUpRatio: nextRound.stepUpRatio,
      founderOwnership: getFounderOwnership(snapshot),
      employeeOwnership: getEmployeeOwnership(snapshot),
      investorOwnership: getInvestorOwnership(snapshot),
      poolOwnership: getPoolOwnership(snapshot),
      secondaryApplied: shouldApplySecondary,
      antiDilutionApplied: issued.antiDilutionApplied,
    });

    currentPostMoney = nextRound.postMoney;
    if (optionPoolRefreshed) {
      // pool changes are already represented in the ownership path
    }
    currentStageIndex += 1;
  }

  return {
    snapshot,
    ownershipSeries,
    roundProjection,
    terminalPostMoney: currentPostMoney,
  };
}

export function calculatePostMoney(preMoney: number, newInvestment: number) {
  return preMoney + newInvestment;
}

export function calculateInvestorOwnership(preMoney: number, newInvestment: number) {
  const postMoney = calculatePostMoney(preMoney, newInvestment);
  return postMoney > 0 ? newInvestment / postMoney : 0;
}

export function calculateRequiredCheckForTargetOwnership(preMoney: number, targetOwnership: number) {
  if (targetOwnership <= 0 || targetOwnership >= 1) {
    return 0;
  }

  return (targetOwnership * preMoney) / (1 - targetOwnership);
}

export function calculateRequiredExitValue(targetProceeds: number, ownershipAtExit: number) {
  if (ownershipAtExit <= 0) {
    return Number.POSITIVE_INFINITY;
  }

  return targetProceeds / ownershipAtExit;
}

export function summarizeDeterministicFinance(config: ScenarioConfig): DeterministicFinanceSummary {
  const financing = getCurrentFinancing(config);
  const currentPostMoney = financing.pricedPostMoney;
  const currentInvestorOwnership = getCurrentInvestorOwnershipEstimate(config);
  const nextStageIndex = Math.min(stageOrder.length - 1, getStageIndex(config.currentStage) + 1);
  const nextStage = stageOrder[nextStageIndex] as FundingStage;
  const benchmarkNextStepUp =
    stagePresets[nextStage].preMoney *
    marketOverlayMultipliers[config.marketOverlay].valuation *
    sectorOverlayMultipliers[config.sectorOverlay].valuation /
    Math.max(1, getReferencePostMoney(config));

  const path = projectDeterministicPath(config);
  const terminalInvestorOwnership =
    path.roundProjection.at(-1)?.investorOwnership ?? currentInvestorOwnership;
  const breakEvenExit = calculateRequiredExitValue(path.snapshot.modeledInvestorInvested, terminalInvestorOwnership);
  const threeXExit = calculateRequiredExitValue(path.snapshot.modeledInvestorInvested * 3, terminalInvestorOwnership);
  const returnTheFundExit = calculateRequiredExitValue(config.investor.fundSize, terminalInvestorOwnership);

  const waterfallScenarios = [
    { label: "Break-even", exitValue: breakEvenExit },
    { label: "3x case", exitValue: Math.max(threeXExit, path.terminalPostMoney * 1.5) },
    { label: "Return the fund", exitValue: Math.max(returnTheFundExit, path.terminalPostMoney * 5) },
  ].map((scenario) => {
    const waterfall = computeWaterfall(
      path.snapshot,
      scenario.exitValue,
      getEmployeeExerciseCost(config, path.snapshot, scenario.exitValue),
      config.preferred,
    );

    return {
      label: scenario.label,
      exitValue: scenario.exitValue,
      founderProceeds: waterfall.founderPayout + path.snapshot.realizedFounderSecondary,
      employeeProceeds: waterfall.employeeNetPayout + path.snapshot.realizedEmployeeSecondary,
      investorProceeds: waterfall.investorPayout,
      preferredConverted: waterfall.preferredConverted,
      preferredStructure: waterfall.preferredStructure,
    };
  });

  const formulas: FormulaLine[] = [
    {
      label: "Post-money valuation",
      formula: "post_money = pre_money + new_investment",
      value: currentPostMoney,
      note: "This is the instantaneous company value right after the new capital arrives.",
      format: "currency",
    },
    {
      label: "Current investor ownership",
      formula:
        config.currentRoundKind === "priced_preferred"
          ? "ownership = new_investment / post_money"
          : config.currentRoundKind === "safe_post_money"
            ? "ownership = safe_investment / post_money_cap"
            : "effective_ownership ~= note_principal / (note_cap + round_raise)",
      value: currentInvestorOwnership,
      note: "For unpriced rounds this is a forward ownership estimate, not a final issued-share count yet.",
      format: "percent",
    },
    {
      label: "Check required for 20% ownership today",
      formula: "check = (target_ownership * pre_money) / (1 - target_ownership)",
      value: calculateRequiredCheckForTargetOwnership(config.currentPreMoney, 0.2),
      note: "This is the clean priced-round check size needed to own one fifth of the company immediately.",
      format: "currency",
    },
    {
      label: "Break-even exit for the modeled investor",
      formula: "required_exit = invested_capital / ownership_at_exit",
      value: breakEvenExit,
      note: "This ignores time value and asks what exit clears a 1x on capital using deterministic ownership at exit.",
      format: "currency",
    },
    {
      label: "Return-the-fund threshold",
      formula: "return_the_fund_exit = fund_size / ownership_at_exit",
      value: returnTheFundExit,
      note: "This is the company exit value needed for this single investment to distribute the whole fund.",
      format: "currency",
    },
  ];

  const warnings = [
    ...financing.warnings,
    benchmarkNextStepUp < 1.25
      ? "Median step-up to the next stage is thin. This path is vulnerable to flat or down rounds."
      : "Median next-round step-up is healthy enough that dilution pressure is not doing all the work.",
    (path.roundProjection.at(-1)?.founderOwnership ?? getFounderOwnership(path.snapshot)) < 0.2
      ? "Founders drift below 20% on the deterministic path before the terminal stage."
      : "Founder ownership stays above 20% on the deterministic path.",
  ];

  return {
    currentPostMoney,
    currentInvestorOwnership,
    benchmarkNextStepUp,
    breakEvenExit,
    threeXExit,
    returnTheFundExit,
    formulas,
    ownershipSeries: path.ownershipSeries,
    roundProjection: path.roundProjection,
    waterfallScenarios,
    warnings,
  };
}
