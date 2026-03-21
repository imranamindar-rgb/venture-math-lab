import { describe, expect, it } from "vitest";

import {
  getDefaultFundConstructionConfig,
  sanitizeFundConstructionConfig,
  summarizeFundConstruction,
} from "@/lib/engines/fund-construction";

describe("fund construction engine", () => {
  it("calculates investable capital after fee drag and reserve budgeting", () => {
    const config = getDefaultFundConstructionConfig();
    const summary = summarizeFundConstruction(config, { includeExtensions: false });

    expect(summary.managementFees).toBeCloseTo(20_000_000, 6);
    expect(summary.investableCapital).toBeCloseTo(80_000_000, 6);
    expect(summary.initialDeploymentBudget).toBeCloseTo(52_000_000, 6);
    expect(summary.reserveBudget).toBeCloseTo(28_000_000, 6);
  });

  it("is reproducible for the same seed and config", () => {
    const config = getDefaultFundConstructionConfig();
    config.simulationCount = 2_000;
    config.seed = 77;

    const first = summarizeFundConstruction(config, { includeExtensions: false });
    const second = summarizeFundConstruction(config, { includeExtensions: false });

    expect(first.netTVPIMedian).toBe(second.netTVPIMedian);
    expect(first.oneCompanyReturnsFundProbability).toBe(second.oneCompanyReturnsFundProbability);
    expect(first.topWinnerShareMedian).toBe(second.topWinnerShareMedian);
  });

  it("sanitizes out-of-range fund inputs", () => {
    const config = getDefaultFundConstructionConfig();
    config.managementFeeRate = 0.2;
    config.carryRate = 0.8;
    config.reserveRatio = 1.2;
    config.targetOwnership = 0;
    config.simulationCount = 10;

    const sanitized = sanitizeFundConstructionConfig(config);

    expect(sanitized.managementFeeRate).toBe(0.03);
    expect(sanitized.carryRate).toBe(0.3);
    expect(sanitized.reserveRatio).toBe(0.8);
    expect(sanitized.targetOwnership).toBe(0.01);
    expect(sanitized.simulationCount).toBe(500);
  });

  it("builds a median J-curve timeline with DPI, TVPI, and paid-in ratios", () => {
    const config = getDefaultFundConstructionConfig();
    config.simulationCount = 1_000;
    const summary = summarizeFundConstruction(config);

    expect(summary.timeline).toHaveLength(config.fundLifeYears + 1);
    expect(summary.timeline[0]?.dpiMedian).toBe(0);
    expect(summary.timeline.at(-1)?.paidInRatioMedian).toBeGreaterThan(0);
    expect(summary.timeline.at(-1)?.tvpiMedian).toBeGreaterThan(0);
    expect(summary.feeCarrySchedule).toHaveLength(config.fundLifeYears + 1);
    expect(summary.strategyMatrix).toHaveLength(3);
    expect(summary.sensitivity.length).toBeGreaterThan(3);
    expect(summary.reserveConstraintMap.cells.length).toBeGreaterThan(10);
    expect(summary.reserveConstraintMap.recommendedCell).not.toBeNull();
    expect(summary.lossConcentration.quadrantProbabilities).toHaveLength(4);
  });
});
