import { describe, expect, it } from "vitest";

import { getScenarioPreset } from "@/data/presets";
import { buildScenarioCsv } from "@/lib/export";
import { analyzeScenario } from "@/lib/scenario-diagnostics";

describe("reporting and diagnostics", () => {
  it("marks missing instrument terms as unsupported", () => {
    const scenario = getScenarioPreset("nvca_standard");
    scenario.currentRoundKind = "safe_post_money";
    scenario.safe.enabled = false;
    scenario.safe.investment = 0;

    const diagnostics = analyzeScenario(scenario);

    expect(diagnostics.supportLevel).toBe("unsupported");
    expect(diagnostics.issues.some((issue) => issue.level === "unsupported")).toBe(true);
  });

  it("marks SAFE preview ownership with standard support and an explicit conversion note", () => {
    const scenario = getScenarioPreset("nvca_standard");
    scenario.secondary.enabled = false;
    const diagnostics = analyzeScenario(scenario);

    expect(diagnostics.supportLevel).toBe("standard");
    expect(diagnostics.issues.some((issue) => issue.title.includes("SAFE preview"))).toBe(true);
  });

  it("exports a CSV summary with scenario, deterministic, simulation, and waterfall sections", () => {
    const scenario = getScenarioPreset("nvca_standard");
    const csv = buildScenarioCsv(scenario);

    expect(csv).toContain("Section,Metric,Value,Detail");
    expect(csv).toContain("Scenario,Name");
    expect(csv).toContain("Deterministic,Current post-money");
    expect(csv).toContain("Simulation,Founder median");
    expect(csv).toContain("Operator,Runway months");
    expect(csv).toContain("Waterfall,");
  });
});
