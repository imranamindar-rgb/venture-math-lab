import { normalizeFounders, sumFounderOwnership } from "@/lib/founders";
import { getStageIndex, stagePresets } from "@/data/presets";
import { getCurrentFinancing } from "@/lib/current-financing";
import {
  CapTableSnapshot,
  FundingStage,
  ScenarioConfig,
  WaterfallPayouts,
  stageOrder,
} from "@/lib/sim/types";
import {
  createInitialCapTable,
  clonePreferredSeries,
  getEmployeeOwnership,
  getFounderOwnership,
  getFullyDilutedShares,
  getInvestorOwnership,
  getPoolOwnership,
  getPreferredPreference,
  getPreferredSeries,
  getPreferredShares,
  getPriorInvestorOwnership,
} from "@/lib/engines/cap-table-waterfall/cap-table";
import { getReferencePostMoney, projectMedianRound } from "@/lib/engines/cap-table-waterfall/rounds";
import { maybeConvertNote, maybeConvertSafe } from "@/lib/engines/cap-table-waterfall/unpriced";
import { computeWaterfall } from "@/lib/engines/cap-table-waterfall/waterfall";

export interface CapTablePositionRow {
  label: string;
  shares: number;
  ownership: number;
  preferenceAmount: number;
  category: "common" | "preferred" | "pool" | "note" | "safe";
}

export interface CapTableWaterfallScenario {
  label: string;
  exitValue: number;
  founderProceeds: number;
  founderBreakdown: {
    id: string;
    name: string;
    proceeds: number;
  }[];
  employeeProceeds: number;
  investorProceeds: number;
  priorInvestorProceeds: number;
  noteProceeds: number;
  safeProceeds: number;
  preferredConverted: boolean;
  preferredStructure: string;
  seriesBreakdown: Array<{
    id: string;
    label: string;
    ownerGroup: "prior" | "modeled";
    seniority: number;
    payout: number;
    converted: boolean;
    structure: string;
  }>;
}

export interface CapTableWaterfallSummary {
  currentRows: CapTablePositionRow[];
  convertedRows: CapTablePositionRow[];
  currentWaterfalls: CapTableWaterfallScenario[];
  convertedWaterfalls: CapTableWaterfallScenario[];
  fullyDilutedShares: number;
  convertedFullyDilutedShares: number;
  warnings: string[];
}

function cloneSnapshot(snapshot: CapTableSnapshot): CapTableSnapshot {
  return {
    ...snapshot,
    preferredSeries: clonePreferredSeries(snapshot.preferredSeries),
  };
}

function getEmployeeExerciseCost(config: ScenarioConfig, snapshot: CapTableSnapshot, exitValue: number) {
  const commonShares = snapshot.founderCommon + snapshot.employeeCommon + snapshot.secondaryCommon;
  const sharePrice = commonShares > 0 ? exitValue / commonShares : 0;
  const grantShares = 10_000_000 * (config.employee.grantOwnershipPercent / 100);
  return grantShares * config.employee.vestedFraction * Math.max(0, config.employee.strikePrice - sharePrice * 0.15);
}

function buildRows(config: ScenarioConfig, snapshot: CapTableSnapshot): CapTablePositionRow[] {
  const founderTotalPercent = sumFounderOwnership(config.founders, config.capTable.founderPercent);
  const founders = normalizeFounders(config.founders, config.capTable.founderPercent);
  const founderRows = founders.map((founder) => {
    const weight = founderTotalPercent > 0 ? founder.ownershipPercent / founderTotalPercent : 0;
    return {
      label: founder.name,
      shares: snapshot.founderCommon * weight,
      ownership: getFounderOwnership(snapshot) * weight,
      preferenceAmount: 0,
      category: "common" as const,
    };
  });

  const rows: CapTablePositionRow[] = [
    ...founderRows,
    {
      label: "Employees (issued)",
      shares: snapshot.employeeCommon,
      ownership: getEmployeeOwnership(snapshot),
      preferenceAmount: 0,
      category: "common",
    },
    {
      label: "Option pool",
      shares: snapshot.employeePool,
      ownership: getPoolOwnership(snapshot),
      preferenceAmount: 0,
      category: "pool",
    },
    ...snapshot.preferredSeries.map((series) => ({
      label: `${series.label} (${series.ownerGroup})`,
      shares: series.shares,
      ownership: series.shares / Math.max(1, getFullyDilutedShares(snapshot)),
      preferenceAmount: series.liquidationPreference * series.liquidationMultiple,
      category: "preferred" as const,
    })),
  ];

  if (snapshot.noteOutstanding > 0) {
    rows.push({
      label: "Convertible note",
      shares: 0,
      ownership: 0,
      preferenceAmount: snapshot.noteOutstanding,
      category: "note",
    });
  }

  if (snapshot.safeOutstanding > 0) {
    rows.push({
      label: "Post-money SAFE",
      shares: 0,
      ownership: snapshot.safePostMoneyCap > 0 ? snapshot.safeOutstanding / snapshot.safePostMoneyCap : 0,
      preferenceAmount: snapshot.safeOutstanding,
      category: "safe",
    });
  }

  return rows;
}

function buildWaterfallScenarios(
  config: ScenarioConfig,
  snapshot: CapTableSnapshot,
  exitValues: { label: string; exitValue: number }[],
) {
  const founderTotalPercent = sumFounderOwnership(config.founders, config.capTable.founderPercent);
  const founders = normalizeFounders(config.founders, config.capTable.founderPercent);

  return exitValues.map((scenario) => {
    const waterfall: WaterfallPayouts = computeWaterfall(
      snapshot,
      scenario.exitValue,
      getEmployeeExerciseCost(config, snapshot, scenario.exitValue),
      config.preferred,
    );

    return {
      label: scenario.label,
      exitValue: scenario.exitValue,
      founderProceeds: waterfall.founderPayout + snapshot.realizedFounderSecondary,
      founderBreakdown: founders.map((founder) => {
        const weight = founderTotalPercent > 0 ? founder.ownershipPercent / founderTotalPercent : 0;
        return {
          id: founder.id,
          name: founder.name,
          proceeds: (waterfall.founderPayout + snapshot.realizedFounderSecondary) * weight,
        };
      }),
      employeeProceeds: waterfall.employeeNetPayout + snapshot.realizedEmployeeSecondary,
      investorProceeds: waterfall.investorPayout,
      priorInvestorProceeds: waterfall.priorInvestorPayout,
      noteProceeds: waterfall.notePayout,
      safeProceeds: waterfall.safePayout,
      preferredConverted: waterfall.preferredConverted,
      preferredStructure: waterfall.preferredStructure,
      seriesBreakdown: waterfall.seriesPayouts.map((entry) => ({
        id: entry.id,
        label: entry.label,
        ownerGroup: entry.ownerGroup,
        seniority: entry.seniority,
        payout: entry.totalPayout,
        converted: entry.converted,
        structure: entry.structure,
      })),
    };
  });
}

export function summarizeCapTableWaterfall(config: ScenarioConfig): CapTableWaterfallSummary {
  const financing = getCurrentFinancing(config);
  const currentSnapshot = createInitialCapTable(config);
  const convertedSnapshot = cloneSnapshot(currentSnapshot);
  const conversionMonths = stagePresets[config.currentStage].monthsToNext;
  const previewStage = stageOrder[Math.min(stageOrder.length - 1, getStageIndex(config.currentStage) + 1)] as FundingStage;
  const qualifiedPreMoney = projectMedianRound(previewStage, getReferencePostMoney(config), config).preMoney;

  if (config.currentRoundKind === "safe_post_money" && config.safe.enabled) {
    maybeConvertSafe(convertedSnapshot, config);
  }

  if (config.currentRoundKind === "convertible_note_cap" && config.note.enabled) {
    maybeConvertNote(convertedSnapshot, config, qualifiedPreMoney, conversionMonths);
  }

  const referencePostMoney = financing.referencePostMoney;
  const exitValues = [
    { label: "Acqui-hire", exitValue: referencePostMoney * 0.6 },
    { label: "Solid exit", exitValue: referencePostMoney * 2.2 },
    { label: "Breakout exit", exitValue: referencePostMoney * 7.5 },
  ];

  const warnings = [
    ...financing.warnings,
    config.currentRoundKind === "safe_post_money" && config.safe.enabled
      ? "SAFE ownership is still an estimate until the next qualified financing fixes the share count, but low-liquidity exits now pay the SAFE before the preferred/common waterfall."
      : "The current instrument already has priced ownership rather than future conversion logic.",
    config.currentRoundKind === "convertible_note_cap" && config.note.enabled
      ? "The note stays senior to equity in weak outcomes, then converts at the better of cap or discount in the qualified-financing preview."
      : "No note seniority is sitting above the common and preferred stack in the current scenario.",
    currentSnapshot.preferredSeries.length > 1
      ? `The preferred stack is tracked across ${currentSnapshot.preferredSeries.length} distinct series with explicit seniority.`
      : "Preferred stock uses a single seniority layer in the current scenario.",
    config.preferred.participationMode === "participating"
      ? "Participating preferred is now paid per series, but capped participation and bespoke carve-outs are still outside scope."
      : "Non-participating preferred can now convert series by series rather than on one aggregate stack.",
    config.preferred.antiDilutionMode !== "none"
      ? "Anti-dilution now reprices each eligible preferred series independently, but the app still does not model pay-to-play or bespoke charter language."
      : "No anti-dilution reset is active on the preferred stack.",
  ];

  return {
    currentRows: buildRows(config, currentSnapshot),
    convertedRows: buildRows(config, convertedSnapshot),
    currentWaterfalls: buildWaterfallScenarios(config, currentSnapshot, exitValues),
    convertedWaterfalls: buildWaterfallScenarios(config, convertedSnapshot, exitValues),
    fullyDilutedShares: getFullyDilutedShares(currentSnapshot),
    convertedFullyDilutedShares: getFullyDilutedShares(convertedSnapshot),
    warnings,
  };
}
