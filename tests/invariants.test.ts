import { describe, expect, it } from "vitest";

import { getScenarioPreset, scenarioPresets, stagePresets } from "@/data/presets";
import {
  createInitialCapTable,
  getEmployeeOwnership,
  getFounderOwnership,
  getInvestorOwnership,
  getPoolOwnership,
  getPriorInvestorOwnership,
} from "@/lib/engines/cap-table-waterfall";
import { issuePreferredRound, maybeRefreshPool, projectMedianRound } from "@/lib/engines/cap-table-waterfall/rounds";
import { maybeConvertNote, maybeConvertSafe } from "@/lib/engines/cap-table-waterfall/unpriced";
import { computeWaterfall } from "@/lib/engines/cap-table-waterfall/waterfall";
import { runMonteCarlo, sanitizeScenario } from "@/lib/engines/monte-carlo";

describe("venture math invariants", () => {
  it("preserves 100% ownership across preset scenarios after conversions, pool refreshes, and new rounds", () => {
    for (const preset of scenarioPresets) {
      const scenario = getScenarioPreset(preset.id);
      const snapshot = createInitialCapTable(scenario);

      if (scenario.safe.enabled) {
        maybeConvertSafe(snapshot, scenario);
      }

      if (scenario.note.enabled) {
        maybeConvertNote(snapshot, scenario, scenario.currentPreMoney, stagePresets[scenario.currentStage].monthsToNext);
      }

      maybeRefreshPool(snapshot, scenario);
      const nextStage = scenario.currentStage === "series_c" ? "series_c" : "series_a";
      const nextRound = projectMedianRound(nextStage, scenario.currentPreMoney + scenario.currentRoundSize, scenario);
      issuePreferredRound(snapshot, nextRound.preMoney, nextRound.roundSize, scenario);

      const total =
        getFounderOwnership(snapshot) +
        getEmployeeOwnership(snapshot) +
        getInvestorOwnership(snapshot) +
        getPriorInvestorOwnership(snapshot) +
        getPoolOwnership(snapshot);

      expect(total).toBeCloseTo(1, 6);
    }
  });

  it("conserves exit value at the waterfall aggregate level", () => {
    for (const preset of scenarioPresets) {
      const scenario = getScenarioPreset(preset.id);
      scenario.currentRoundKind = "priced_preferred";
      scenario.investor.initialCheck = scenario.currentRoundSize;
      const snapshot = createInitialCapTable(scenario);

      for (const exitValue of [1_000_000, 15_000_000, 150_000_000]) {
        const waterfall = computeWaterfall(snapshot, exitValue, 0);
        expect(
          waterfall.notePayout + waterfall.safePayout + waterfall.preferredPayout + waterfall.commonPayout,
        ).toBeCloseTo(exitValue, 6);
      }
    }
  });

  it("sanitizes extreme inputs before Monte Carlo runs", () => {
    const scenario = getScenarioPreset("nvca_standard");
    scenario.controls.iterations = 100_000;
    scenario.controls.seed = 0;
    scenario.optionPoolTargetPercent = 0.9;
    scenario.secondary.founderSaleFraction = 0.8;
    scenario.note.discountRate = 0.9;
    scenario.note.interestRate = 0.9;

    const sanitized = sanitizeScenario(scenario);

    expect(sanitized.controls.iterations).toBe(20_000);
    expect(sanitized.controls.seed).toBe(1);
    expect(sanitized.optionPoolTargetPercent).toBe(0.25);
    expect(sanitized.secondary.founderSaleFraction).toBe(0.3);
    expect(sanitized.note.discountRate).toBe(0.35);
    expect(sanitized.note.interestRate).toBe(0.15);
  });

  it("remains reproducible for the same preset and seed even at higher iteration counts", () => {
    const scenario = getScenarioPreset("stress_case");
    scenario.controls.iterations = 1_500;
    scenario.controls.seed = 2026;

    const first = runMonteCarlo(scenario);
    const second = runMonteCarlo(scenario);

    expect(first.founder.median).toBe(second.founder.median);
    expect(first.employee.underwaterProbability).toBe(second.employee.underwaterProbability);
    expect(first.investor.reserveUtilizationMedian).toBe(second.investor.reserveUtilizationMedian);
  });
});
