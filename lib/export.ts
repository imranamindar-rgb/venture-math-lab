import { formatCurrency, formatPercent, formatMultiple } from "@/lib/format";
import { ScenarioConfig, SimulationSummary } from "@/lib/sim/types";
import { buildComparisonPayload, buildScenarioReportPayload } from "@/lib/reporting";

function escapeCsv(value: string | number) {
  const raw = String(value);
  if (raw.includes(",") || raw.includes("\n") || raw.includes("\"")) {
    return `"${raw.replaceAll("\"", "\"\"")}"`;
  }
  return raw;
}

function rowsToCsv(rows: Array<Array<string | number>>) {
  return rows.map((row) => row.map(escapeCsv).join(",")).join("\n");
}

export function buildScenarioCsv(config: ScenarioConfig, provided?: SimulationSummary) {
  const payload = buildScenarioReportPayload(config, provided);

  const rows: Array<Array<string | number>> = [
    ["Section", "Metric", "Value", "Detail"],
    ["Metadata", "Generated at", payload.generatedAt, ""],
    ["Metadata", "Methodology version", payload.methodologyVersion, ""],
    ["Metadata", "Engine version", payload.engineVersion, ""],
    ["Scenario", "Name", config.name, config.description],
    ["Scenario", "Support", payload.diagnostics.supportLabel, payload.diagnostics.summary],
    ...payload.executiveSummary.map((line, index) => ["Executive summary", `Point ${index + 1}`, line, ""]),
    ...payload.diagnostics.assumptions.map((assumption) => ["Assumption", assumption.label, assumption.value, ""]),
    ...payload.diagnostics.issues.map((issue) => ["Issue", issue.title, issue.level, issue.detail]),
    ["Deterministic", "Current post-money", formatCurrency(payload.deterministic.currentPostMoney), ""],
    ["Deterministic", "Current investor ownership", formatPercent(payload.deterministic.currentInvestorOwnership), ""],
    ["Deterministic", "Benchmark next step-up", formatMultiple(payload.deterministic.benchmarkNextStepUp), ""],
    ["Deterministic", "Break-even exit", formatCurrency(payload.deterministic.breakEvenExit), ""],
    ["Deterministic", "Return-the-fund exit", formatCurrency(payload.deterministic.returnTheFundExit), ""],
    ...payload.deterministic.roundProjection.map((round) => [
      "Median path",
      round.label,
      formatCurrency(round.postMoney),
      `Founder ${formatPercent(round.founderOwnership)} | Investor ${formatPercent(round.investorOwnership)}`,
    ]),
    ["Simulation", "Founder median", formatCurrency(payload.simulation.founder.median), ""],
    ["Simulation", "Employee median", formatCurrency(payload.simulation.employee.median), ""],
    ["Simulation", "Investor median", formatCurrency(payload.simulation.investor.median), ""],
    ["Simulation", "Founder below 20%", formatPercent(payload.simulation.founder.ownershipThresholds[1]?.probability ?? 0), ""],
    ["Simulation", "Employee underwater", formatPercent(payload.simulation.employee.underwaterProbability), ""],
    ["Simulation", "Investor return-the-fund", formatPercent(payload.simulation.investor.returnTheFundProbability), ""],
    ...payload.simulation.outcomeMix.map((metric) => ["Outcome mix", metric.label, formatPercent(metric.probability), ""]),
    ["Operator", "Runway months", payload.operator.runwayMonths.toFixed(1), ""],
    ["Operator", "Post-close runway", payload.operator.postRaiseRunwayMonths.toFixed(1), ""],
    ["Operator", "Financing gap", formatCurrency(payload.operator.financingGap), ""],
    ["Operator", "Buffered gap", formatCurrency(payload.operator.bufferGap), ""],
    ["Operator", "Burn multiple", formatMultiple(payload.operator.burnMultiple), ""],
    ["Operator", "Working capital", formatCurrency(payload.operator.workingCapital), ""],
    ["Operator", "Quick ratio", `${payload.operator.quickRatio.toFixed(2)}x`, ""],
    ...payload.capTable.currentRows.map((row) => [
      "Cap table",
      row.label,
      formatPercent(row.ownership),
      row.preferenceAmount > 0 ? formatCurrency(row.preferenceAmount) : "None",
    ]),
    ...payload.capTable.currentWaterfalls.flatMap((scenarioRow) => [
      [
        "Waterfall",
        scenarioRow.label,
        formatCurrency(scenarioRow.exitValue),
        `Founder ${formatCurrency(scenarioRow.founderProceeds)} | Investor ${formatCurrency(scenarioRow.investorProceeds)}`,
      ],
      ...scenarioRow.seriesBreakdown.map((entry) => [
        "Waterfall series",
        `${scenarioRow.label} / ${entry.label}`,
        formatCurrency(entry.payout),
        `${entry.structure} | seniority ${entry.seniority}`,
      ]),
    ]),
  ];

  return rowsToCsv(rows);
}

export function buildScenarioMarkdown(config: ScenarioConfig, provided?: SimulationSummary) {
  const payload = buildScenarioReportPayload(config, provided);
  const preferredRows = payload.capTable.currentRows.filter((row) => row.category === "preferred");

  return [
    `# ${config.name}`,
    "",
    `Generated: ${payload.generatedAt}`,
    `Methodology version: ${payload.methodologyVersion}`,
    `Engine version: ${payload.engineVersion}`,
    `Support: ${payload.diagnostics.supportLabel}`,
    "",
    "## Executive Summary",
    ...payload.executiveSummary.map((line) => `- ${line}`),
    "",
    "## Deterministic Thresholds",
    `- Current post-money: ${formatCurrency(payload.deterministic.currentPostMoney)}`,
    `- Current investor ownership: ${formatPercent(payload.deterministic.currentInvestorOwnership)}`,
    `- Break-even exit: ${formatCurrency(payload.deterministic.breakEvenExit)}`,
    `- Return-the-fund exit: ${formatCurrency(payload.deterministic.returnTheFundExit)}`,
    "",
    "## Monte Carlo",
    `- Founder median: ${formatCurrency(payload.simulation.founder.median)}`,
    `- Employee underwater: ${formatPercent(payload.simulation.employee.underwaterProbability)}`,
    `- Investor return-the-fund: ${formatPercent(payload.simulation.investor.returnTheFundProbability)}`,
    `- Power-law spread: ${formatMultiple(payload.simulation.meanVsMedianSpread)}`,
    "",
    "## Operator Reality",
    `- Runway: ${payload.operator.runwayMonths.toFixed(1)} months`,
    `- Post-close runway: ${payload.operator.postRaiseRunwayMonths.toFixed(1)} months`,
    `- Working capital: ${formatCurrency(payload.operator.workingCapital)}`,
    `- Net financing proceeds: ${formatCurrency(payload.operator.netFinancingProceeds)}`,
    "",
    "## Preferred Stack",
    ...preferredRows.map((row) => `- ${row.label}: ${formatPercent(row.ownership)} ownership, ${formatCurrency(row.preferenceAmount)} preference`),
    "",
    "## Interpretation Flags",
    ...payload.topWarnings.map((line) => `- ${line}`),
    "",
  ].join("\n");
}

export function buildComparisonCsv(
  baseline: ScenarioConfig,
  comparison: ScenarioConfig,
  baselineSummary?: SimulationSummary,
  comparisonSummary?: SimulationSummary,
) {
  const payload = buildComparisonPayload(baseline, comparison, baselineSummary, comparisonSummary);
  const rows: Array<Array<string | number>> = [
    ["Section", "Metric", "Baseline", "Comparison", "Delta", "Interpretation"],
    ...payload.headlineCards.map((card) => [
      "Headline",
      card.label,
      card.baseline,
      card.comparison,
      card.delta,
      card.interpretation,
    ]),
    ...payload.driverCards.map((card) => [
      "Driver",
      card.label,
      card.baseline,
      card.comparison,
      card.delta,
      card.interpretation,
    ]),
    ...payload.riskLayerCards.map((card) => [
      "Risk layer",
      card.label,
      card.baseline,
      card.comparison,
      card.delta,
      card.interpretation,
    ]),
    ...payload.boardNotes.map((note, index) => ["Board note", `Point ${index + 1}`, note, "", "", ""]),
  ];
  return rowsToCsv(rows);
}

export function buildComparisonMarkdown(
  baseline: ScenarioConfig,
  comparison: ScenarioConfig,
  baselineSummary?: SimulationSummary,
  comparisonSummary?: SimulationSummary,
) {
  const payload = buildComparisonPayload(baseline, comparison, baselineSummary, comparisonSummary);
  return [
    `# Scenario Compare: ${payload.baseline.config.name} vs ${payload.comparison.config.name}`,
    "",
    `Generated: ${payload.generatedAt}`,
    "",
    "## Headline Deltas",
    ...payload.headlineCards.map(
      (card) => `- ${card.label}: ${card.baseline} vs ${card.comparison} (${card.delta}). ${card.interpretation}`,
    ),
    "",
    "## Driver Deltas",
    ...payload.driverCards.map(
      (card) => `- ${card.label}: ${card.baseline} vs ${card.comparison} (${card.delta}). ${card.interpretation}`,
    ),
    "",
    "## Risk Layer Movement",
    ...payload.riskLayerCards.map(
      (card) => `- ${card.label}: ${card.baseline} vs ${card.comparison} (${card.delta}). ${card.interpretation}`,
    ),
    "",
    "## Board Notes",
    ...payload.boardNotes.map((note) => `- ${note}`),
    "",
  ].join("\n");
}
