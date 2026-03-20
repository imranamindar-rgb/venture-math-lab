import { describe, expect, it } from "vitest";

import { getScenarioPreset } from "@/data/presets";
import { summarizeOperatorIntelligence } from "@/lib/engines/operator-intelligence";

describe("operator intelligence engine", () => {
  it("computes runway and financing gaps against the next benchmark round", () => {
    const scenario = getScenarioPreset("nvca_standard");
    scenario.operating.cashOnHand = 6_000_000;
    scenario.operating.monthlyBurn = 300_000;
    scenario.operating.monthlyRevenue = 120_000;
    scenario.operating.monthlyRevenueGrowth = 0.08;
    scenario.operating.grossMargin = 0.8;
    scenario.operating.targetCashBufferMonths = 6;

    const summary = summarizeOperatorIntelligence(scenario);

    expect(summary.runwayMonths).toBeCloseTo(20, 6);
    expect(summary.monthsToNextBenchmark).toBe(18);
    expect(summary.financingGap).toBe(0);
    expect(summary.bufferGap).toBeCloseTo(1_200_000, 6);
    expect(summary.grossMarginBand).toBe("Software-like");
  });
});
