import { normalizeFounders, sumFounderOwnership } from "@/lib/founders";
import { stagePresets } from "@/data/presets";
import {
  CapTableSnapshot,
  ScenarioConfig,
  WaterfallPayouts,
} from "@/lib/sim/types";
import {
  createInitialCapTable,
  getEmployeeOwnership,
  getFounderOwnership,
  getFullyDilutedShares,
  getInvestorOwnership,
  getPoolOwnership,
  getPriorInvestorOwnership,
} from "@/lib/engines/cap-table-waterfall/cap-table";
import { getReferencePostMoney } from "@/lib/engines/cap-table-waterfall/rounds";
import { maybeConvertNote, maybeConvertSafe } from "@/lib/engines/cap-table-waterfall/unpriced";
import { computeWaterfall } from "@/lib/engines/cap-table-waterfall/waterfall";

export interface CapTablePositionRow {
  label: string;
  shares: number;
  ownership: number;
  preferenceAmount: number;
  category: "common" | "preferred" | "pool" | "note";
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
  preferredConverted: boolean;
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
  return { ...snapshot };
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
    {
      label: "Prior preferred",
      shares: snapshot.priorInvestorPreferred,
      ownership: getPriorInvestorOwnership(snapshot),
      preferenceAmount: snapshot.priorInvestorLiquidationPref,
      category: "preferred",
    },
    {
      label: "Modeled investor",
      shares: snapshot.modeledInvestorPreferred,
      ownership: getInvestorOwnership(snapshot),
      preferenceAmount: snapshot.modeledInvestorLiquidationPref,
      category: "preferred",
    },
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
      employeeProceeds: waterfall.employeeGrossPayout + snapshot.realizedEmployeeSecondary,
      investorProceeds: waterfall.investorPayout,
      priorInvestorProceeds: waterfall.priorInvestorPayout,
      noteProceeds: waterfall.notePayout,
      preferredConverted: waterfall.preferredConverted,
    };
  });
}

export function summarizeCapTableWaterfall(config: ScenarioConfig): CapTableWaterfallSummary {
  const currentSnapshot = createInitialCapTable(config);
  const convertedSnapshot = cloneSnapshot(currentSnapshot);
  const conversionMonths = stagePresets[config.currentStage].monthsToNext;
  const qualifiedPreMoney = Math.max(config.currentPreMoney, getReferencePostMoney(config));

  if (config.currentRoundKind === "safe_post_money" && config.safe.enabled) {
    maybeConvertSafe(convertedSnapshot, config);
  }

  if (config.currentRoundKind === "convertible_note_cap" && config.note.enabled) {
    maybeConvertNote(convertedSnapshot, config, qualifiedPreMoney, conversionMonths);
  }

  const referencePostMoney = Math.max(getReferencePostMoney(config), config.currentPreMoney + config.currentRoundSize);
  const exitValues = [
    { label: "Acqui-hire", exitValue: referencePostMoney * 0.6 },
    { label: "Solid exit", exitValue: referencePostMoney * 2.2 },
    { label: "Breakout exit", exitValue: referencePostMoney * 7.5 },
  ];

  const warnings = [
    config.currentRoundKind === "safe_post_money" && config.safe.enabled
      ? "SAFE ownership is still an estimate until the next qualified financing fixes the share count."
      : "The current instrument already has priced ownership rather than future conversion logic.",
    config.currentRoundKind === "convertible_note_cap" && config.note.enabled
      ? "The note stays senior to equity in weak outcomes, then converts at the better of cap or discount in a qualified round."
      : "No note seniority is sitting above the common and preferred stack in the current scenario.",
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
