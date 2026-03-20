import { describe, expect, it } from "vitest";

import { getScenarioPreset } from "@/data/presets";
import {
  calculateInvestorOwnership,
  calculatePostMoney,
  calculateRequiredCheckForTargetOwnership,
  summarizeDeterministicFinance,
} from "@/lib/engines/deterministic-finance";
import { summarizeCapTableWaterfall } from "@/lib/engines/cap-table-waterfall/analysis";

describe("deterministic venture engines", () => {
  it("computes post-money and ownership cleanly for priced rounds", () => {
    expect(calculatePostMoney(20_000_000, 5_000_000)).toBe(25_000_000);
    expect(calculateInvestorOwnership(20_000_000, 5_000_000)).toBeCloseTo(0.2, 6);
    expect(calculateRequiredCheckForTargetOwnership(20_000_000, 0.2)).toBeCloseTo(5_000_000, 6);
  });

  it("builds a deterministic summary with a stricter return-the-fund threshold than break-even", () => {
    const scenario = getScenarioPreset("nvca_standard");
    const summary = summarizeDeterministicFinance(scenario);

    expect(summary.formulas).toHaveLength(5);
    expect(summary.roundProjection.length).toBeGreaterThan(0);
    expect(summary.returnTheFundExit).toBeGreaterThan(summary.breakEvenExit);
    expect(summary.waterfallScenarios).toHaveLength(3);
  });

  it("distinguishes the current stack from the as-converted stack for unpriced instruments", () => {
    const safeScenario = getScenarioPreset("nvca_standard");
    const noteScenario = getScenarioPreset("stress_case");

    const safeSummary = summarizeCapTableWaterfall(safeScenario);
    const noteSummary = summarizeCapTableWaterfall(noteScenario);

    const safeCurrentInvestor = safeSummary.currentRows.find((row) => row.label === "Post-money SAFE");
    const safeConvertedInvestor = safeSummary.convertedRows.find((row) => row.label.includes("SAFE conversion"));
    const noteCurrentRow = noteSummary.currentRows.find((row) => row.label === "Convertible note");
    const noteConvertedRow = noteSummary.convertedRows.find((row) => row.label === "Convertible note");

    expect(safeConvertedInvestor?.shares).toBeGreaterThan(0);
    expect(safeCurrentInvestor?.preferenceAmount).toBeGreaterThan(0);
    expect(noteCurrentRow?.preferenceAmount).toBeGreaterThan(0);
    expect(noteConvertedRow).toBeUndefined();
  });

  it("carries founder-specific inputs into cap table rows and founder waterfall split", () => {
    const scenario = getScenarioPreset("nvca_standard");
    const summary = summarizeCapTableWaterfall(scenario);

    expect(summary.currentRows.some((row) => row.label === "Founder 1")).toBe(true);
    expect(summary.currentRows.some((row) => row.label === "Founder 2")).toBe(true);
    expect(summary.convertedWaterfalls[0]?.founderBreakdown).toHaveLength(2);
  });
});
