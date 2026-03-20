import { describe, expect, it } from "vitest";

import { getScenarioPreset } from "@/data/presets";
import {
  applySecondaryLiquidity,
  createInitialCapTable,
  getEmployeeOwnership,
  getFounderOwnership,
  getFullyDilutedShares,
  getInvestorOwnership,
  getPoolOwnership,
  getPriorInvestorOwnership,
} from "@/lib/sim/cap-table";
import { runMonteCarlo } from "@/lib/sim/engine";
import { issuePreferredRound, maybeRefreshPool } from "@/lib/sim/rounds";
import { maybeConvertNote, maybeConvertSafe } from "@/lib/sim/unpriced";
import { computeWaterfall } from "@/lib/sim/waterfall";

describe("venture math simulation", () => {
  it("produces deterministic summaries for the same seed", () => {
    const scenario = getScenarioPreset("nvca_standard");
    scenario.controls.iterations = 400;
    scenario.controls.seed = 77;

    const a = runMonteCarlo(scenario);
    const b = runMonteCarlo(scenario);

    expect(a.founder.median).toBe(b.founder.median);
    expect(a.employee.worthlessProbability).toBe(b.employee.worthlessProbability);
    expect(a.investor.returnTheFundProbability).toBe(b.investor.returnTheFundProbability);
  });

  it("keeps fully diluted ownership at 100% after pool refresh and new preferred issuance", () => {
    const scenario = getScenarioPreset("nvca_standard");
    scenario.currentRoundKind = "priced_preferred";
    const snapshot = createInitialCapTable(scenario);

    maybeRefreshPool(snapshot, scenario);
    issuePreferredRound(snapshot, 28_000_000, 6_000_000, scenario);

    const total =
      getFounderOwnership(snapshot) +
      getEmployeeOwnership(snapshot) +
      getInvestorOwnership(snapshot) +
      getPriorInvestorOwnership(snapshot) +
      getPoolOwnership(snapshot);

    expect(total).toBeCloseTo(1, 6);
    expect(getFullyDilutedShares(snapshot)).toBeGreaterThan(0);
  });

  it("converts SAFEs and capped notes into distinct ownership outcomes", () => {
    const safeScenario = getScenarioPreset("nvca_standard");
    const noteScenario = getScenarioPreset("stress_case");
    const safeSnapshot = createInitialCapTable(safeScenario);
    const noteSnapshot = createInitialCapTable(noteScenario);

    const safeResult = maybeConvertSafe(safeSnapshot, safeScenario);
    const noteResult = maybeConvertNote(noteSnapshot, noteScenario, 22_000_000, 18);

    expect(safeResult.converted).toBe(true);
    expect(noteResult.converted).toBe(true);
    expect(noteResult.accruedPrincipal).toBeGreaterThan(noteScenario.note.principal);
    expect(noteResult.issuedShares).not.toBeCloseTo(safeResult.issuedShares, 2);
  });

  it("uses preference in weak exits and conversion in strong exits", () => {
    const scenario = getScenarioPreset("nvca_standard");
    scenario.currentRoundKind = "priced_preferred";
    scenario.currentPreMoney = 18_000_000;
    scenario.investor.initialCheck = 4_000_000;
    const snapshot = createInitialCapTable(scenario);

    const lowExit = computeWaterfall(snapshot, 3_000_000, 0);
    const highExit = computeWaterfall(snapshot, 120_000_000, 0);

    expect(lowExit.preferredConverted).toBe(false);
    expect(highExit.preferredConverted).toBe(true);
    expect(highExit.investorPayout).toBeGreaterThan(lowExit.investorPayout);
  });

  it("gives better investor economics when entry valuation is lower against the same exit", () => {
    const lowEntry = getScenarioPreset("nvca_standard");
    lowEntry.currentRoundKind = "priced_preferred";
    lowEntry.currentPreMoney = 12_000_000;
    lowEntry.investor.initialCheck = 3_000_000;

    const highEntry = getScenarioPreset("nvca_standard");
    highEntry.currentRoundKind = "priced_preferred";
    highEntry.currentPreMoney = 24_000_000;
    highEntry.investor.initialCheck = 3_000_000;

    const lowWaterfall = computeWaterfall(createInitialCapTable(lowEntry), 90_000_000, 0);
    const highWaterfall = computeWaterfall(createInitialCapTable(highEntry), 90_000_000, 0);

    expect(lowWaterfall.investorPayout).toBeGreaterThan(highWaterfall.investorPayout);
  });

  it("realizes founder liquidity without changing fully diluted share count in secondaries", () => {
    const scenario = getScenarioPreset("nvca_standard");
    const snapshot = createInitialCapTable(scenario);
    const before = getFullyDilutedShares(snapshot);

    applySecondaryLiquidity(snapshot, 2.4, 0.1, 0.12);

    expect(snapshot.realizedFounderSecondary).toBeGreaterThan(0);
    expect(snapshot.realizedEmployeeSecondary).toBeGreaterThan(0);
    expect(getFullyDilutedShares(snapshot)).toBeCloseTo(before, 6);
  });
});
