import { z } from "zod";

export const stageOrder = ["pre_seed", "seed", "series_a", "series_b", "series_c"] as const;
export type FundingStage = (typeof stageOrder)[number];

export const roundKinds = ["safe_post_money", "convertible_note_cap", "priced_preferred"] as const;
export type RoundKind = (typeof roundKinds)[number];

export const liquidityKinds = ["shutdown", "acquisition", "secondary", "ipo"] as const;
export type LiquidityEventKind = (typeof liquidityKinds)[number];

export const marketOverlays = ["bull", "base", "bear"] as const;
export type MarketOverlay = (typeof marketOverlays)[number];

export const sectorOverlays = ["standard", "ai_premium"] as const;
export type SectorOverlay = (typeof sectorOverlays)[number];

export type RoundTrend = "up" | "flat" | "down";
export type RiskBand = "Critical" | "Tight" | "Healthy" | "Power-Law";

export interface StagePreset {
  id: FundingStage;
  label: string;
  preMoney: number;
  roundSize: number;
  monthsToNext: number;
  failureProbability: number;
  earlyExitProbability: number;
  upRoundProbability: number;
  flatRoundProbability: number;
  downRoundProbability: number;
  stepUpRanges: Record<RoundTrend, [number, number]>;
  founderBasePercent: number;
  employeeCommonPercent: number;
  employeePoolPercent: number;
  priorInvestorPercent: number;
  investorOwnershipTarget: number;
  optionPoolTarget: number;
  secondaryChance: number;
  note: string;
}

export interface StartingCapTableInput {
  founderPercent: number;
  employeeCommonPercent: number;
  employeePoolPercent: number;
  priorInvestorPercent: number;
}

export interface SafeConfig {
  enabled: boolean;
  investment: number;
  postMoneyCap: number;
}

export interface ConvertibleNoteConfig {
  enabled: boolean;
  principal: number;
  preMoneyCap: number;
  discountRate: number;
  interestRate: number;
  recoveryRate: number;
}

export interface InvestorConfig {
  initialCheck: number;
  proRata: boolean;
  reserveMultiple: number;
  fundSize: number;
}

export interface EmployeeGrantConfig {
  grantOwnershipPercent: number;
  vestedFraction: number;
  strikePrice: number;
}

export interface SecondaryConfig {
  enabled: boolean;
  founderSaleFraction: number;
  employeeSaleFraction: number;
}

export interface SimulationControls {
  iterations: number;
  seed: number;
}

export interface ScenarioConfig {
  id: string;
  name: string;
  description: string;
  currentStage: FundingStage;
  currentRoundKind: RoundKind;
  currentPreMoney: number;
  currentRoundSize: number;
  optionPoolTargetPercent: number;
  marketOverlay: MarketOverlay;
  sectorOverlay: SectorOverlay;
  capTable: StartingCapTableInput;
  safe: SafeConfig;
  note: ConvertibleNoteConfig;
  investor: InvestorConfig;
  employee: EmployeeGrantConfig;
  secondary: SecondaryConfig;
  controls: SimulationControls;
  warningFlags: string[];
}

export interface CapTableSnapshot {
  founderCommon: number;
  employeeCommon: number;
  employeePool: number;
  priorInvestorPreferred: number;
  modeledInvestorPreferred: number;
  secondaryCommon: number;
  priorInvestorLiquidationPref: number;
  modeledInvestorLiquidationPref: number;
  modeledInvestorInvested: number;
  noteOutstanding: number;
  realizedFounderSecondary: number;
  realizedEmployeeSecondary: number;
}

export interface OwnershipPoint {
  label: string;
  founderPct: number;
  employeePct: number;
  investorPct: number;
  priorInvestorPct: number;
  poolPct: number;
}

export interface RoundOutcome {
  stage: FundingStage;
  monthsElapsed: number;
  preMoney: number;
  postMoney: number;
  roundSize: number;
  stepUpRatio: number;
  roundTrend: RoundTrend;
  safeConverted: boolean;
  noteConverted: boolean;
  optionPoolRefreshed: boolean;
  founderOwnership: number;
  employeeOwnership: number;
  investorOwnership: number;
}

export interface WaterfallPayouts {
  notePayout: number;
  preferredPayout: number;
  commonPayout: number;
  founderPayout: number;
  employeeGrossPayout: number;
  investorPayout: number;
  priorInvestorPayout: number;
  secondaryCommonPayout: number;
  preferredConverted: boolean;
}

export interface LiquidityOutcome {
  kind: LiquidityEventKind;
  terminalStage: FundingStage;
  exitValue: number;
  monthsElapsed: number;
  secondaryUsed: boolean;
  preferredConverted: boolean;
  founderNetProceeds: number;
  employeeNetProceeds: number;
  investorProceeds: number;
  investorMoic: number;
  investorIrr: number;
  waterfall: WaterfallPayouts;
}

export interface PathOutcome {
  rounds: RoundOutcome[];
  ownershipPath: OwnershipPoint[];
  liquidity: LiquidityOutcome;
  founderThresholds: {
    below50: boolean;
    below20: boolean;
    below10: boolean;
  };
  employeeUnderwater: boolean;
  exitCategory: string;
  reserveUsed: number;
}

export interface HistogramBucket {
  label: string;
  value: number;
}

export interface ThresholdMetric {
  label: string;
  probability: number;
}

export interface StakeholderSummary {
  riskBand: RiskBand;
  median: number;
  p10: number;
  p90: number;
}

export interface SimulationSummary {
  scenarioId: string;
  scenarioName: string;
  iterations: number;
  seed: number;
  meanVsMedianSpread: number;
  founder: StakeholderSummary & {
    ownershipThresholds: ThresholdMetric[];
    dilutionAttribution: ThresholdMetric[];
  };
  employee: StakeholderSummary & {
    underwaterProbability: number;
    worthlessProbability: number;
    exerciseCoverageMedian: number;
  };
  investor: StakeholderSummary & {
    moicThresholds: ThresholdMetric[];
    returnTheFundProbability: number;
    reserveUtilizationMedian: number;
  };
  riskLayers: ThresholdMetric[];
  outcomeMix: ThresholdMetric[];
  ownershipSeries: OwnershipPoint[];
  exitHistogram: HistogramBucket[];
  investorHistogram: HistogramBucket[];
  warnings: string[];
  pathsSample: PathOutcome[];
}

export interface WorkerRequest {
  type: "run";
  config: ScenarioConfig;
}

export interface WorkerResponse {
  type: "done";
  summary: SimulationSummary;
}

export const scenarioConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  currentStage: z.enum(stageOrder),
  currentRoundKind: z.enum(roundKinds),
  currentPreMoney: z.number().positive(),
  currentRoundSize: z.number().positive(),
  optionPoolTargetPercent: z.number().min(0).max(0.5),
  marketOverlay: z.enum(marketOverlays),
  sectorOverlay: z.enum(sectorOverlays),
  capTable: z.object({
    founderPercent: z.number().min(0).max(100),
    employeeCommonPercent: z.number().min(0).max(100),
    employeePoolPercent: z.number().min(0).max(100),
    priorInvestorPercent: z.number().min(0).max(100),
  }),
  safe: z.object({
    enabled: z.boolean(),
    investment: z.number().nonnegative(),
    postMoneyCap: z.number().positive(),
  }),
  note: z.object({
    enabled: z.boolean(),
    principal: z.number().nonnegative(),
    preMoneyCap: z.number().positive(),
    discountRate: z.number().min(0).max(0.5),
    interestRate: z.number().min(0).max(0.25),
    recoveryRate: z.number().min(0).max(1),
  }),
  investor: z.object({
    initialCheck: z.number().positive(),
    proRata: z.boolean(),
    reserveMultiple: z.number().min(0).max(10),
    fundSize: z.number().positive(),
  }),
  employee: z.object({
    grantOwnershipPercent: z.number().min(0).max(10),
    vestedFraction: z.number().min(0).max(1),
    strikePrice: z.number().nonnegative(),
  }),
  secondary: z.object({
    enabled: z.boolean(),
    founderSaleFraction: z.number().min(0).max(0.5),
    employeeSaleFraction: z.number().min(0).max(0.5),
  }),
  controls: z.object({
    iterations: z.number().int().min(100).max(50000),
    seed: z.number().int().positive(),
  }),
  warningFlags: z.array(z.string()),
});

export const scenarioFileSchema = z.object({
  schemaVersion: z.literal(1),
  createdAt: z.string(),
  notes: z.string(),
  config: scenarioConfigSchema,
});

export type ScenarioFileV1 = z.infer<typeof scenarioFileSchema>;
