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
  getFullyDilutedShares,
  issuePreferredRound,
  maybeConvertNote,
  maybeConvertSafe,
  maybeRefreshPool,
  getReferencePostMoney,
  projectMedianRound,
  getNextPreferredSeniority,
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
import { cloneValue, lastItem } from "@/lib/compat";

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

export interface LiquidationDeadZonePoint {
  exitValue: number;
  founderNet: number;
  employeeNet: number;
  investorProceeds: number;
  preferenceBurden: number;
  preferredConverted: boolean;
}

export interface LiquidationDeadZoneSummary {
  deadZoneEndsAt: number;
  points: LiquidationDeadZonePoint[];
}

export interface DealReturnHeatmapCell {
  yearsToExit: number;
  exitValue: number;
  investorProceeds: number;
  investorMoic: number;
  investorIrr: number;
  founderNet: number;
  preferredStructure: string;
}

export interface DealReturnHeatmapSummary {
  anchorExitValue: number;
  exitValues: number[];
  years: number[];
  cells: DealReturnHeatmapCell[];
}

export interface OptionPoolShuffleIllustration {
  preMoneyFounderOwnership: number;
  postMoneyFounderOwnership: number;
  founderOwnershipDelta: number;
  founderProceedsDeltaAtIllustrativeExit: number;
  illustrativeExitValue: number;
}

export interface DeterministicExitTakeHome {
  exitValue: number;
  founderNet: number;
  founderSecondary: number;
  employeeNet: number;
  employeeGross: number;
  investorProceeds: number;
  priorInvestorProceeds: number;
  preferredStructure: string;
}

export interface DeterministicFinanceSummary {
  currentPostMoney: number;
  currentInvestorOwnership: number;
  benchmarkNextStepUp: number;
  breakEvenExit: number;
  threeXExit: number;
  founderTenMillionExit: number;
  returnTheFundExit: number;
  formulas: FormulaLine[];
  ownershipSeries: OwnershipPoint[];
  roundProjection: DeterministicRoundProjection[];
  waterfallScenarios: DeterministicWaterfallScenario[];
  liquidationDeadZone: LiquidationDeadZoneSummary;
  dealReturnHeatmap: DealReturnHeatmapSummary;
  optionPoolShuffle: OptionPoolShuffleIllustration;
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

function getFounderNetAtExit(config: ScenarioConfig, snapshot: CapTableSnapshot, exitValue: number) {
  const waterfall = computeWaterfall(
    snapshot,
    exitValue,
    getEmployeeExerciseCost(config, snapshot, exitValue),
    config.preferred,
  );
  return waterfall.founderPayout + snapshot.realizedFounderSecondary;
}

function findExitForFounderTarget(config: ScenarioConfig, snapshot: CapTableSnapshot, targetProceeds: number, fallbackExit: number) {
  let low = 0;
  let high = Math.max(fallbackExit, targetProceeds * 40, 25_000_000);

  while (getFounderNetAtExit(config, snapshot, high) < targetProceeds) {
    high *= 2;
    if (high > 100_000_000_000) {
      break;
    }
  }

  for (let iteration = 0; iteration < 50; iteration += 1) {
    const mid = (low + high) / 2;
    const founderProceeds = getFounderNetAtExit(config, snapshot, mid);
    if (founderProceeds >= targetProceeds) {
      high = mid;
    } else {
      low = mid;
    }
  }

  return high;
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
    const conversionSeniority = getNextPreferredSeniority(snapshot);

    const optionPoolRefreshed = maybeRefreshPool(snapshot, config);

    if (!noteConverted && config.note.enabled) {
      noteConverted = maybeConvertNote(snapshot, config, nextRound.preMoney, monthsElapsed, conversionSeniority).converted;
    }

    if (!safeConverted && config.safe.enabled) {
      safeConverted = maybeConvertSafe(snapshot, config, nextRound.preMoney, true, conversionSeniority).converted;
    }

    const issued = issuePreferredRound(snapshot, nextRound.preMoney, nextRound.roundSize, config, preset.label, conversionSeniority);
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

function buildOptionPoolShuffleIllustration(config: ScenarioConfig): OptionPoolShuffleIllustration {
  const snapshotPreMoney = createInitialCapTable(config);
  const snapshotPostMoney = createInitialCapTable(config);
  const roundPreMoney = config.currentPreMoney;
  const roundSize = config.currentRoundSize;
  const seniority = 3;
  let low = 0;
  let high = getFullyDilutedShares(snapshotPreMoney) * config.optionPoolTargetPercent * 2;

  for (let iteration = 0; iteration < 40; iteration += 1) {
    const mid = (low + high) / 2;
    const trialSnapshot = cloneValue(snapshotPreMoney);
    trialSnapshot.employeePool += mid;
    issuePreferredRound(trialSnapshot, roundPreMoney, roundSize, config, "Pool shuffle illustration", seniority);

    if (getPoolOwnership(trialSnapshot) >= config.optionPoolTargetPercent) {
      high = mid;
    } else {
      low = mid;
    }
  }

  snapshotPreMoney.employeePool += high;
  issuePreferredRound(snapshotPreMoney, roundPreMoney, roundSize, config, "Pool shuffle illustration", seniority);

  issuePreferredRound(snapshotPostMoney, roundPreMoney, roundSize, config, "Pool shuffle illustration", seniority);
  maybeRefreshPool(snapshotPostMoney, config);

  const illustrativeExitValue = Math.max(roundPreMoney + roundSize, 1) * 3;
  const founderAtPreMoneyPool = getFounderNetAtExit(config, snapshotPreMoney, illustrativeExitValue);
  const founderAtPostMoneyPool = getFounderNetAtExit(config, snapshotPostMoney, illustrativeExitValue);

  return {
    preMoneyFounderOwnership: getFounderOwnership(snapshotPreMoney),
    postMoneyFounderOwnership: getFounderOwnership(snapshotPostMoney),
    founderOwnershipDelta: getFounderOwnership(snapshotPostMoney) - getFounderOwnership(snapshotPreMoney),
    founderProceedsDeltaAtIllustrativeExit: founderAtPostMoneyPool - founderAtPreMoneyPool,
    illustrativeExitValue,
  };
}

export function evaluateDeterministicExitScenario(config: ScenarioConfig, exitValue: number): DeterministicExitTakeHome {
  const path = projectDeterministicPath(config);
  const waterfall = computeWaterfall(
    path.snapshot,
    exitValue,
    getEmployeeExerciseCost(config, path.snapshot, exitValue),
    config.preferred,
  );

  return {
    exitValue,
    founderNet: waterfall.founderPayout + path.snapshot.realizedFounderSecondary,
    founderSecondary: path.snapshot.realizedFounderSecondary,
    employeeNet: waterfall.employeeNetPayout + path.snapshot.realizedEmployeeSecondary,
    employeeGross: waterfall.employeeGrossPayout,
    investorProceeds: waterfall.investorPayout,
    priorInvestorProceeds: waterfall.priorInvestorPayout,
    preferredStructure: waterfall.preferredStructure,
  };
}

export function buildDeterministicExitCurve(config: ScenarioConfig, exitValues: number[]) {
  return exitValues.map((exitValue) => evaluateDeterministicExitScenario(config, exitValue));
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

function buildLiquidationDeadZone(
  config: ScenarioConfig,
  snapshot: CapTableSnapshot,
  terminalPostMoney: number,
  returnTheFundExit: number,
): LiquidationDeadZoneSummary {
  const maxExit = Math.max(terminalPostMoney * 8, returnTheFundExit * 1.1, config.currentPreMoney + config.currentRoundSize);
  const multipliers = [0.1, 0.2, 0.35, 0.5, 0.75, 1, 1.25, 1.5, 2, 3, 5, 8, 12];

  const points = multipliers.map((multiple) => {
    const exitValue = Math.max(250_000, terminalPostMoney * multiple);
    const waterfall = computeWaterfall(
      snapshot,
      exitValue,
      getEmployeeExerciseCost(config, snapshot, exitValue),
      config.preferred,
    );
    const founderNet = waterfall.founderPayout + snapshot.realizedFounderSecondary;
    const employeeNet = waterfall.employeeNetPayout + snapshot.realizedEmployeeSecondary;
    const preferenceBurden =
      exitValue > 0
        ? (waterfall.notePayout + waterfall.safePayout + waterfall.priorInvestorPayout + waterfall.investorPayout) /
          exitValue
        : 0;

    return {
      exitValue,
      founderNet,
      employeeNet,
      investorProceeds: waterfall.investorPayout,
      preferenceBurden,
      preferredConverted: waterfall.preferredConverted,
    };
  });

  const deadZoneEndsAt =
    points.find((point) => point.preferredConverted || point.founderNet >= 1_000_000)?.exitValue ??
    Math.min(maxExit, lastItem(points)?.exitValue ?? maxExit);

  return {
    deadZoneEndsAt,
    points,
  };
}

function buildDealReturnHeatmap(config: ScenarioConfig, anchorExitValue: number): DealReturnHeatmapSummary {
  const snapshot = createInitialCapTable(config);
  const financing = getCurrentFinancing(config);
  const exitValues = [0.5, 0.75, 1, 1.5, 2, 3, 5, 8, 12].map((multiple) => Math.max(500_000, anchorExitValue * multiple));
  const years = [1, 2, 3, 4, 5, 6, 7, 8, 10];
  const investorCapitalAtRisk = Math.max(1, financing.modeledInvestorCheck);

  const exitSnapshots = exitValues.map((exitValue) => {
    const waterfall = computeWaterfall(
      snapshot,
      exitValue,
      getEmployeeExerciseCost(config, snapshot, exitValue),
      config.preferred,
    );

    return {
      exitValue,
      investorProceeds: waterfall.investorPayout,
      founderNet: waterfall.founderPayout + snapshot.realizedFounderSecondary,
      preferredStructure: waterfall.preferredStructure,
    };
  });

  return {
    anchorExitValue,
    exitValues,
    years,
    cells: years.flatMap((yearsToExit) =>
      exitSnapshots.map((point) => {
        const investorMoic = point.investorProceeds / investorCapitalAtRisk;
        const investorIrr = investorMoic > 0 ? Math.pow(investorMoic, 1 / yearsToExit) - 1 : -1;

        return {
          yearsToExit,
          exitValue: point.exitValue,
          investorProceeds: point.investorProceeds,
          investorMoic,
          investorIrr,
          founderNet: point.founderNet,
          preferredStructure: point.preferredStructure,
        };
      }),
    ),
  };
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
    lastItem(path.roundProjection)?.investorOwnership ?? currentInvestorOwnership;
  const breakEvenExit = calculateRequiredExitValue(path.snapshot.modeledInvestorInvested, terminalInvestorOwnership);
  const threeXExit = calculateRequiredExitValue(path.snapshot.modeledInvestorInvested * 3, terminalInvestorOwnership);
  const founderTenMillionExit = findExitForFounderTarget(
    config,
    path.snapshot,
    10_000_000,
    Math.max(breakEvenExit, path.terminalPostMoney * 1.5),
  );
  const returnTheFundExit = calculateRequiredExitValue(config.investor.fundSize, terminalInvestorOwnership);

  const waterfallScenarios = [
    { label: "Break-even", exitValue: breakEvenExit },
    { label: "3x case", exitValue: Math.max(threeXExit, path.terminalPostMoney * 1.5) },
    { label: "Founder makes $10M", exitValue: founderTenMillionExit },
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
      label: "Founder makes $10M personally",
      formula: "solve founder_net_proceeds(exit) = $10,000,000",
      value: founderTenMillionExit,
      note: "This is solved against the modeled waterfall, not just simple ownership, so preference overhang still matters.",
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
    (lastItem(path.roundProjection)?.founderOwnership ?? getFounderOwnership(path.snapshot)) < 0.2
      ? "Founders drift below 20% on the deterministic path before the terminal stage."
      : "Founder ownership stays above 20% on the deterministic path.",
    "Option-pool shuffle math below compares the founder hit when the same pool top-up is forced pre-money versus after the round.",
  ];

  return {
    currentPostMoney,
    currentInvestorOwnership,
    benchmarkNextStepUp,
    breakEvenExit,
    threeXExit,
    founderTenMillionExit,
    returnTheFundExit,
    formulas,
    ownershipSeries: path.ownershipSeries,
    roundProjection: path.roundProjection,
    waterfallScenarios,
    liquidationDeadZone: buildLiquidationDeadZone(config, path.snapshot, path.terminalPostMoney, returnTheFundExit),
    dealReturnHeatmap: buildDealReturnHeatmap(config, Math.max(currentPostMoney, getReferencePostMoney(config))),
    optionPoolShuffle: buildOptionPoolShuffleIllustration(config),
    warnings,
  };
}
