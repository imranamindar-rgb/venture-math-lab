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
  getPreferredShares,
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
    scenario.currentRoundSize = 4_000_000;
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
    lowEntry.currentRoundSize = 3_000_000;
    lowEntry.investor.initialCheck = 3_000_000;

    const highEntry = getScenarioPreset("nvca_standard");
    highEntry.currentRoundKind = "priced_preferred";
    highEntry.currentPreMoney = 24_000_000;
    highEntry.currentRoundSize = 3_000_000;
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

  it("uses the full priced round size for dilution while only crediting the modeled investor with their own check", () => {
    const scenario = getScenarioPreset("nvca_standard");
    scenario.currentRoundKind = "priced_preferred";
    scenario.currentPreMoney = 12_000_000;
    scenario.currentRoundSize = 6_000_000;
    scenario.investor.initialCheck = 3_000_000;
    const snapshot = createInitialCapTable(scenario);

    expect(getInvestorOwnership(snapshot)).toBeCloseTo(3_000_000 / 18_000_000, 6);
    expect(getPriorInvestorOwnership(snapshot)).toBeGreaterThan(scenario.capTable.priorInvestorPercent / 100);
    expect(snapshot.modeledInvestorInvested).toBe(3_000_000);
  });

  it("pays a SAFE holder in low-liquidity exits even before a qualified financing", () => {
    const scenario = getScenarioPreset("nvca_standard");
    scenario.currentRoundKind = "safe_post_money";
    scenario.safe.enabled = true;
    scenario.safe.investment = 500_000;
    scenario.safe.postMoneyCap = 10_000_000;
    scenario.currentRoundSize = 500_000;
    const snapshot = createInitialCapTable(scenario);

    const lowExit = computeWaterfall(snapshot, 400_000, 0);
    const strongExit = computeWaterfall(snapshot, 20_000_000, 0);

    expect(lowExit.safePayout).toBe(400_000);
    expect(lowExit.investorPayout).toBe(400_000);
    expect(strongExit.safePayout).toBeGreaterThan(500_000);
  });

  it("pays the modeled note holder before preferred and common in weak exits", () => {
    const scenario = getScenarioPreset("stress_case");
    scenario.currentRoundKind = "convertible_note_cap";
    scenario.note.enabled = true;
    scenario.note.principal = 1_000_000;
    scenario.currentRoundSize = 1_000_000;
    const snapshot = createInitialCapTable(scenario);

    const lowExit = computeWaterfall(snapshot, 600_000, 0);

    expect(lowExit.notePayout).toBe(600_000);
    expect(lowExit.investorPayout).toBe(600_000);
    expect(lowExit.preferredPayout).toBe(0);
  });

  it("participating preferred pays the investor more than non-participating preferred in a midrange exit", () => {
    const nonParticipating = getScenarioPreset("nvca_standard");
    nonParticipating.currentRoundKind = "priced_preferred";
    nonParticipating.currentPreMoney = 16_000_000;
    nonParticipating.currentRoundSize = 4_000_000;
    nonParticipating.investor.initialCheck = 4_000_000;
    nonParticipating.capTable.founderPercent = 80;
    nonParticipating.capTable.employeeCommonPercent = 0;
    nonParticipating.capTable.employeePoolPercent = 20;
    nonParticipating.capTable.priorInvestorPercent = 0;
    nonParticipating.preferred.participationMode = "non_participating";

    const participating = structuredClone(nonParticipating);
    participating.preferred.participationMode = "participating";

    const nonParticipatingWaterfall = computeWaterfall(createInitialCapTable(nonParticipating), 30_000_000, 0, nonParticipating.preferred);
    const participatingWaterfall = computeWaterfall(createInitialCapTable(participating), 30_000_000, 0, participating.preferred);

    expect(participatingWaterfall.investorPayout).toBeGreaterThan(nonParticipatingWaterfall.investorPayout);
    expect(participatingWaterfall.preferredStructure).toContain("participating");
  });

  it("higher liquidation multiples increase investor downside protection", () => {
    const base = getScenarioPreset("nvca_standard");
    base.currentRoundKind = "priced_preferred";
    base.currentPreMoney = 18_000_000;
    base.currentRoundSize = 4_000_000;
    base.investor.initialCheck = 4_000_000;
    base.preferred.liquidationMultiple = 1;

    const stepped = structuredClone(base);
    stepped.preferred.liquidationMultiple = 2;

    const baseWaterfall = computeWaterfall(createInitialCapTable(base), 8_000_000, 0, base.preferred);
    const steppedWaterfall = computeWaterfall(createInitialCapTable(stepped), 8_000_000, 0, stepped.preferred);

    expect(steppedWaterfall.investorPayout).toBeGreaterThanOrEqual(baseWaterfall.investorPayout);
    expect(steppedWaterfall.preferredPayout).toBeGreaterThan(baseWaterfall.preferredPayout);
  });

  it("anti-dilution adds modeled investor shares in down rounds", () => {
    const base = getScenarioPreset("nvca_standard");
    base.currentRoundKind = "priced_preferred";
    base.currentPreMoney = 16_000_000;
    base.currentRoundSize = 4_000_000;
    base.investor.initialCheck = 4_000_000;
    base.investor.proRata = false;
    base.investor.reserveMultiple = 0;

    const noProtection = structuredClone(base);
    noProtection.preferred.antiDilutionMode = "none";

    const weightedAverage = structuredClone(base);
    weightedAverage.preferred.antiDilutionMode = "broad_weighted_average";

    const fullRatchet = structuredClone(base);
    fullRatchet.preferred.antiDilutionMode = "full_ratchet";

    const noneSnapshot = createInitialCapTable(noProtection);
    const weightedSnapshot = createInitialCapTable(weightedAverage);
    const fullRatchetSnapshot = createInitialCapTable(fullRatchet);

    issuePreferredRound(noneSnapshot, 8_000_000, 4_000_000, noProtection);
    issuePreferredRound(weightedSnapshot, 8_000_000, 4_000_000, weightedAverage);
    issuePreferredRound(fullRatchetSnapshot, 8_000_000, 4_000_000, fullRatchet);

    expect(getPreferredShares(weightedSnapshot, "modeled")).toBeGreaterThan(getPreferredShares(noneSnapshot, "modeled"));
    expect(getPreferredShares(fullRatchetSnapshot, "modeled")).toBeGreaterThan(
      getPreferredShares(weightedSnapshot, "modeled"),
    );
  });

  it("converts SAFE shadow series into the same seniority layer as the priced round they join", () => {
    const scenario = getScenarioPreset("nvca_standard");
    scenario.currentRoundKind = "safe_post_money";
    scenario.safe.enabled = true;
    const snapshot = createInitialCapTable(scenario);

    const conversionSeniority = 3;
    maybeConvertSafe(snapshot, scenario, 18_000_000, true, conversionSeniority);
    issuePreferredRound(snapshot, 18_000_000, 4_000_000, scenario, "Series A", conversionSeniority);

    const modeledSeries = snapshot.preferredSeries.filter((series) => series.ownerGroup === "modeled");
    expect(modeledSeries.some((series) => series.seriesType === "safe_shadow")).toBe(true);
    expect(new Set(modeledSeries.map((series) => series.seniority)).size).toBe(1);
  });
});
