import { runMonteCarlo } from "@/lib/engines/monte-carlo";
import { ScenarioConfig, SimulationSummary } from "@/lib/sim/types";
import { cloneValue } from "@/lib/compat";

export interface SensitivityParameter {
  id: string;
  label: string;
  baseValue: number;
  lowerValue: number;
  upperValue: number;
  unit: "currency" | "percent" | "multiple" | "count";
}

export interface SensitivityResult {
  parameter: SensitivityParameter;
  baselineMedian: number;
  lowerMedian: number;
  upperMedian: number;
  lowerDelta: number;
  upperDelta: number;
}

export interface SensitivitySummary {
  baselineMedian: number;
  results: SensitivityResult[];
  iterations: number;
}

type ConfigPatch = (config: ScenarioConfig, value: number) => void;

interface ParameterSpec {
  id: string;
  label: string;
  unit: SensitivityParameter["unit"];
  getValue: (config: ScenarioConfig) => number;
  applyValue: ConfigPatch;
  lowerFactor: number;
  upperFactor: number;
  shouldInclude: (config: ScenarioConfig) => boolean;
}

const parameterSpecs: ParameterSpec[] = [
  {
    id: "currentPreMoney",
    label: "Pre-money Valuation",
    unit: "currency",
    getValue: (c) => c.currentPreMoney,
    applyValue: (c, v) => { c.currentPreMoney = v; },
    lowerFactor: 0.75,
    upperFactor: 1.25,
    shouldInclude: () => true,
  },
  {
    id: "currentRoundSize",
    label: "Round Size",
    unit: "currency",
    getValue: (c) => c.currentRoundSize,
    applyValue: (c, v) => { c.currentRoundSize = v; },
    lowerFactor: 0.75,
    upperFactor: 1.25,
    shouldInclude: () => true,
  },
  {
    id: "investorInitialCheck",
    label: "Investor Check Size",
    unit: "currency",
    getValue: (c) =>
      c.currentRoundKind === "safe_post_money" && c.safe.enabled
        ? c.safe.investment
        : c.investor.initialCheck,
    applyValue: (c, v) => {
      if (c.currentRoundKind === "safe_post_money" && c.safe.enabled) {
        c.safe.investment = v;
      }
      c.investor.initialCheck = v;
    },
    lowerFactor: 0.75,
    upperFactor: 1.25,
    shouldInclude: () => true,
  },
  {
    id: "paretoAlpha",
    label: "Tail Shape (Pareto Alpha)",
    unit: "multiple",
    getValue: (c) => c.controls.paretoAlpha,
    applyValue: (c, v) => { c.controls.paretoAlpha = v; },
    lowerFactor: 0.8,
    upperFactor: 1.2,
    shouldInclude: () => true,
  },
  {
    id: "optionPoolTargetPercent",
    label: "Option Pool Target",
    unit: "percent",
    getValue: (c) => c.optionPoolTargetPercent,
    applyValue: (c, v) => { c.optionPoolTargetPercent = v; },
    lowerFactor: 0.7,
    upperFactor: 1.3,
    shouldInclude: () => true,
  },
  {
    id: "safePostMoneyCap",
    label: "SAFE Post-money Cap",
    unit: "currency",
    getValue: (c) => c.safe.postMoneyCap,
    applyValue: (c, v) => { c.safe.postMoneyCap = v; },
    lowerFactor: 0.75,
    upperFactor: 1.25,
    shouldInclude: (c) =>
      c.currentRoundKind === "safe_post_money" && c.safe.enabled,
  },
  {
    id: "liquidationMultiple",
    label: "Liquidation Multiple",
    unit: "multiple",
    getValue: (c) => c.preferred.liquidationMultiple,
    applyValue: (c, v) => { c.preferred.liquidationMultiple = v; },
    lowerFactor: 1,
    upperFactor: 1.5,
    shouldInclude: (c) => c.preferred.liquidationMultiple > 1,
  },
  {
    id: "reserveMultiple",
    label: "Reserve Strategy Multiple",
    unit: "multiple",
    getValue: (c) => c.investor.reserveMultiple,
    applyValue: (c, v) => { c.investor.reserveMultiple = v; },
    lowerFactor: 0.7,
    upperFactor: 1.3,
    shouldInclude: (c) => c.investor.reserveMultiple > 0,
  },
  {
    id: "monthlyBurn",
    label: "Monthly Burn Rate",
    unit: "currency",
    getValue: (c) => c.operating.monthlyBurn,
    applyValue: (c, v) => { c.operating.monthlyBurn = v; },
    lowerFactor: 0.75,
    upperFactor: 1.25,
    shouldInclude: (c) => c.operating.monthlyBurn > 0,
  },
  {
    id: "fundSize",
    label: "Fund Size (Return-the-Fund)",
    unit: "currency",
    getValue: (c) => c.investor.fundSize,
    applyValue: (c, v) => { c.investor.fundSize = v; },
    lowerFactor: 0.75,
    upperFactor: 1.25,
    shouldInclude: (c) => c.investor.fundSize > 0,
  },
];

function buildParameters(config: ScenarioConfig): SensitivityParameter[] {
  return parameterSpecs
    .filter((spec) => spec.shouldInclude(config))
    .map((spec) => {
      const baseValue = spec.getValue(config);
      return {
        id: spec.id,
        label: spec.label,
        baseValue,
        lowerValue: baseValue * spec.lowerFactor,
        upperValue: baseValue * spec.upperFactor,
        unit: spec.unit,
      };
    });
}

function applyPatch(
  baseConfig: ScenarioConfig,
  spec: ParameterSpec,
  value: number,
  iterations: number,
): ScenarioConfig {
  const patched = cloneValue(baseConfig);
  patched.controls.iterations = iterations;
  spec.applyValue(patched, value);
  return patched;
}

function getFounderMedian(summary: SimulationSummary): number {
  return summary.founder.median;
}

export function runSensitivityAnalysis(
  config: ScenarioConfig,
  iterations = 5000,
): SensitivitySummary {
  const baselineConfig = cloneValue(config);
  baselineConfig.controls.iterations = iterations;
  const baselineSummary = runMonteCarlo(baselineConfig);
  const baselineMedian = getFounderMedian(baselineSummary);

  const parameters = buildParameters(config);
  const activeSpecs = parameterSpecs.filter((spec) =>
    spec.shouldInclude(config),
  );

  const results: SensitivityResult[] = activeSpecs.map((spec, index) => {
    const param = parameters[index];

    const lowerConfig = applyPatch(config, spec, param.lowerValue, iterations);
    const lowerSummary = runMonteCarlo(lowerConfig);
    const lowerMedian = getFounderMedian(lowerSummary);

    const upperConfig = applyPatch(config, spec, param.upperValue, iterations);
    const upperSummary = runMonteCarlo(upperConfig);
    const upperMedian = getFounderMedian(upperSummary);

    return {
      parameter: param,
      baselineMedian,
      lowerMedian,
      upperMedian,
      lowerDelta: lowerMedian - baselineMedian,
      upperDelta: upperMedian - baselineMedian,
    };
  });

  results.sort(
    (a, b) =>
      Math.max(Math.abs(b.lowerDelta), Math.abs(b.upperDelta)) -
      Math.max(Math.abs(a.lowerDelta), Math.abs(a.upperDelta)),
  );

  return {
    baselineMedian,
    results,
    iterations,
  };
}
