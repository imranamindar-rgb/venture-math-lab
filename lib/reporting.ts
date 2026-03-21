import { summarizeCapTableWaterfall } from "@/lib/engines/cap-table-waterfall/analysis";
import { summarizeDeterministicFinance } from "@/lib/engines/deterministic-finance";
import { summarizeOperatorIntelligence } from "@/lib/engines/operator-intelligence";
import { runMonteCarlo } from "@/lib/engines/monte-carlo";
import { formatCurrency, formatMultiple, formatPercent } from "@/lib/format";
import { getCurrentFinancing } from "@/lib/current-financing";
import { analyzeScenario } from "@/lib/scenario-diagnostics";
import { ScenarioConfig, SimulationSummary } from "@/lib/sim/types";

export interface ScenarioReportPayload {
  generatedAt: string;
  methodologyVersion: string;
  engineVersion: string;
  runId: string;
  config: ScenarioConfig;
  diagnostics: ReturnType<typeof analyzeScenario>;
  financing: ReturnType<typeof getCurrentFinancing>;
  deterministic: ReturnType<typeof summarizeDeterministicFinance>;
  capTable: ReturnType<typeof summarizeCapTableWaterfall>;
  operator: ReturnType<typeof summarizeOperatorIntelligence>;
  simulation: SimulationSummary;
  topWarnings: string[];
  executiveSummary: string[];
}

export interface ScenarioReportBasePayload {
  generatedAt: string;
  methodologyVersion: string;
  engineVersion: string;
  runId: string;
  config: ScenarioConfig;
  diagnostics: ReturnType<typeof analyzeScenario>;
  financing: ReturnType<typeof getCurrentFinancing>;
  deterministic: ReturnType<typeof summarizeDeterministicFinance>;
  capTable: ReturnType<typeof summarizeCapTableWaterfall>;
  operator: ReturnType<typeof summarizeOperatorIntelligence>;
  topWarnings: string[];
  executiveSummary: string[];
}

export interface ComparisonCard {
  label: string;
  baseline: string;
  comparison: string;
  delta: string;
  interpretation: string;
}

export interface ComparisonPayload {
  generatedAt: string;
  baseline: ScenarioReportPayload;
  comparison: ScenarioReportPayload;
  headlineCards: ComparisonCard[];
  driverCards: ComparisonCard[];
  riskLayerCards: ComparisonCard[];
  boardNotes: string[];
}

function maybeRunSimulation(config: ScenarioConfig, provided?: SimulationSummary) {
  return provided ?? runMonteCarlo(config);
}

export function buildScenarioBasePayload(config: ScenarioConfig): ScenarioReportBasePayload {
  const diagnostics = analyzeScenario(config);
  const financing = getCurrentFinancing(config);
  const deterministic = summarizeDeterministicFinance(config);
  const capTable = summarizeCapTableWaterfall(config);
  const operator = summarizeOperatorIntelligence(config);
  const topWarnings = [...diagnostics.issues.map((issue) => issue.detail), ...deterministic.warnings, ...operator.warnings].slice(0, 6);
  const preferredSeriesCount = capTable.currentRows.filter((row) => row.category === "preferred").length;

  return {
    generatedAt: new Date().toISOString(),
    methodologyVersion: "2026.03-series-stack",
    engineVersion: "deterministic+monte-carlo+cap-table-v2",
    runId: `${config.id}-${config.controls.seed}-${config.controls.iterations}`,
    config,
    diagnostics,
    financing,
    deterministic,
    capTable,
    operator,
    topWarnings,
    executiveSummary: [
      `${config.name} currently models ${preferredSeriesCount} preferred series with ${diagnostics.supportLabel.toLowerCase()} support.`,
      `Operator coverage is ${operator.runwayMonths.toFixed(1)} months pre-close and ${operator.postRaiseRunwayMonths.toFixed(1)} months post-close, with net financing proceeds of ${formatCurrency(operator.netFinancingProceeds)}.`,
      `Current investor ownership is ${formatPercent(deterministic.currentInvestorOwnership)} and the deterministic return-the-fund exit is ${formatCurrency(deterministic.returnTheFundExit)}.`,
      topWarnings[0] ?? "No material interpretation flags were generated for the active scenario.",
    ],
  };
}

export function buildScenarioReportPayload(config: ScenarioConfig, provided?: SimulationSummary): ScenarioReportPayload {
  const base = buildScenarioBasePayload(config);
  const simulation = maybeRunSimulation(config, provided);

  return {
    ...base,
    simulation,
    executiveSummary: [
      base.executiveSummary[0],
      `Founder median proceeds run ${formatCurrency(simulation.founder.median)} while the modeled investor hits return-the-fund in ${formatPercent(simulation.investor.returnTheFundProbability)} of paths.`,
      base.executiveSummary[1],
      base.executiveSummary[2],
    ],
  };
}

export function buildComparisonPayload(
  baselineConfig: ScenarioConfig,
  comparisonConfig: ScenarioConfig,
  baselineSummary?: SimulationSummary,
  comparisonSummary?: SimulationSummary,
): ComparisonPayload {
  const baseline = buildScenarioReportPayload(baselineConfig, baselineSummary);
  const comparison = buildScenarioReportPayload(comparisonConfig, comparisonSummary);

  const headlineCards: ComparisonCard[] = [
    {
      label: "Founder median proceeds",
      baseline: formatCurrency(baseline.simulation.founder.median),
      comparison: formatCurrency(comparison.simulation.founder.median),
      delta: formatCurrency(comparison.simulation.founder.median - baseline.simulation.founder.median),
      interpretation: "This captures how valuation, dilution, preferences, and timing combine at the founder level.",
    },
    {
      label: "Investor return-the-fund probability",
      baseline: formatPercent(baseline.simulation.investor.returnTheFundProbability),
      comparison: formatPercent(comparison.simulation.investor.returnTheFundProbability),
      delta: formatPercent(
        comparison.simulation.investor.returnTheFundProbability - baseline.simulation.investor.returnTheFundProbability,
      ),
      interpretation: "This is the cleanest fund-level question the company can answer for a lead investor.",
    },
    {
      label: "Employee underwater probability",
      baseline: formatPercent(baseline.simulation.employee.underwaterProbability),
      comparison: formatPercent(comparison.simulation.employee.underwaterProbability),
      delta: formatPercent(
        comparison.simulation.employee.underwaterProbability - baseline.simulation.employee.underwaterProbability,
      ),
      interpretation: "This shows whether dilution and strike price are separating paper equity from usable value.",
    },
    {
      label: "Post-close runway",
      baseline: `${baseline.operator.postRaiseRunwayMonths.toFixed(1)} months`,
      comparison: `${comparison.operator.postRaiseRunwayMonths.toFixed(1)} months`,
      delta: `${(comparison.operator.postRaiseRunwayMonths - baseline.operator.postRaiseRunwayMonths).toFixed(1)} months`,
      interpretation: "This links the financing assumption to actual survival time rather than only dilution math.",
    },
  ];

  const driverCards: ComparisonCard[] = [
    {
      label: "Entry valuation",
      baseline: formatCurrency(baselineConfig.currentPreMoney),
      comparison: formatCurrency(comparisonConfig.currentPreMoney),
      delta: formatCurrency(comparisonConfig.currentPreMoney - baselineConfig.currentPreMoney),
      interpretation: "Higher entry prices compress investor MOIC and usually require stronger future step-ups.",
    },
    {
      label: "Current investor ownership",
      baseline: formatPercent(baseline.deterministic.currentInvestorOwnership),
      comparison: formatPercent(comparison.deterministic.currentInvestorOwnership),
      delta: formatPercent(comparison.deterministic.currentInvestorOwnership - baseline.deterministic.currentInvestorOwnership),
      interpretation: "Ownership at entry is still the cleanest bridge between check size and fund-level return potential.",
    },
    {
      label: "Preferred stack pressure",
      baseline: formatCurrency(
        baseline.capTable.currentRows
          .filter((row) => row.category === "preferred")
          .reduce((total, row) => total + row.preferenceAmount, 0),
      ),
      comparison: formatCurrency(
        comparison.capTable.currentRows
          .filter((row) => row.category === "preferred")
          .reduce((total, row) => total + row.preferenceAmount, 0),
      ),
      delta: formatCurrency(
        comparison.capTable.currentRows
          .filter((row) => row.category === "preferred")
          .reduce((total, row) => total + row.preferenceAmount, 0) -
          baseline.capTable.currentRows
            .filter((row) => row.category === "preferred")
            .reduce((total, row) => total + row.preferenceAmount, 0),
      ),
      interpretation: "More preference overhang makes modest exits founder-worse even when headline valuation looks good.",
    },
    {
      label: "Net financing proceeds",
      baseline: formatCurrency(baseline.operator.netFinancingProceeds),
      comparison: formatCurrency(comparison.operator.netFinancingProceeds),
      delta: formatCurrency(comparison.operator.netFinancingProceeds - baseline.operator.netFinancingProceeds),
      interpretation: "Headline rounds do not matter if fees and burn erase the actual cash that lands.",
    },
    {
      label: "Power-law spread",
      baseline: formatMultiple(baseline.simulation.meanVsMedianSpread),
      comparison: formatMultiple(comparison.simulation.meanVsMedianSpread),
      delta: formatMultiple(comparison.simulation.meanVsMedianSpread - baseline.simulation.meanVsMedianSpread),
      interpretation: "A wider spread means outcomes rely more heavily on rare tail winners than on typical cases.",
    },
  ];

  const riskLayerCards = baseline.simulation.riskLayers.map((layer, index) => ({
    label: layer.label,
    baseline: formatPercent(layer.probability),
    comparison: formatPercent(comparison.simulation.riskLayers[index]?.probability ?? 0),
    delta: formatPercent((comparison.simulation.riskLayers[index]?.probability ?? 0) - layer.probability),
    interpretation: "These deltas show which risk layer moved, not a strict causal Shapley decomposition.",
  }));

  const boardNotes = [
    `Baseline support is ${baseline.diagnostics.supportLabel.toLowerCase()} and comparison support is ${comparison.diagnostics.supportLabel.toLowerCase()}.`,
    `The preferred stack changes from ${baseline.capTable.currentRows.filter((row) => row.category === "preferred").length} series to ${comparison.capTable.currentRows.filter((row) => row.category === "preferred").length} series.`,
    `Post-close runway changes from ${baseline.operator.postRaiseRunwayMonths.toFixed(1)} to ${comparison.operator.postRaiseRunwayMonths.toFixed(1)} months.`,
    "Compare cards show structured deltas across deterministic, stochastic, cap-table, and operator engines. They are directional attribution, not a causal decomposition proof.",
  ];

  return {
    generatedAt: new Date().toISOString(),
    baseline,
    comparison,
    headlineCards,
    driverCards,
    riskLayerCards,
    boardNotes,
  };
}
