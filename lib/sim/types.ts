import { z } from "zod";

export const stageOrder = ["pre_seed", "seed", "series_a", "series_b", "series_c"] as const;
export type FundingStage = (typeof stageOrder)[number];

export const roundKinds = ["safe_post_money", "convertible_note_cap", "priced_preferred"] as const;
export type RoundKind = (typeof roundKinds)[number];

export const preferredParticipationModes = ["non_participating", "participating"] as const;
export type PreferredParticipationMode = (typeof preferredParticipationModes)[number];
export const antiDilutionModes = ["none", "broad_weighted_average", "full_ratchet"] as const;
export type AntiDilutionMode = (typeof antiDilutionModes)[number];
export const preferredOwnerGroups = ["prior", "modeled"] as const;
export type PreferredOwnerGroup = (typeof preferredOwnerGroups)[number];

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

export interface FounderStakeInput {
  id: string;
  name: string;
  ownershipPercent: number;
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

export interface PreferredTermsConfig {
  participationMode: PreferredParticipationMode;
  liquidationMultiple: number;
  antiDilutionMode: AntiDilutionMode;
}

export interface PreferredSeriesSnapshot {
  id: string;
  label: string;
  ownerGroup: PreferredOwnerGroup;
  shares: number;
  liquidationPreference: number;
  participationMode: PreferredParticipationMode;
  liquidationMultiple: number;
  antiDilutionMode: AntiDilutionMode;
  seniority: number;
  referencePricePerShare: number;
}

export interface OperatingConfig {
  cashOnHand: number;
  monthlyBurn: number;
  monthlyRevenue: number;
  monthlyRevenueGrowth: number;
  grossMargin: number;
  targetCashBufferMonths: number;
  accountsReceivable: number;
  inventory: number;
  accountsPayable: number;
  capexMonthly: number;
  transactionFees: number;
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
  founders?: FounderStakeInput[];
  safe: SafeConfig;
  note: ConvertibleNoteConfig;
  investor: InvestorConfig;
  employee: EmployeeGrantConfig;
  preferred: PreferredTermsConfig;
  operating: OperatingConfig;
  secondary: SecondaryConfig;
  controls: SimulationControls;
  warningFlags: string[];
}

export interface CapTableSnapshot {
  founderCommon: number;
  employeeCommon: number;
  employeePool: number;
  preferredSeries: PreferredSeriesSnapshot[];
  secondaryCommon: number;
  modeledInvestorInvested: number;
  safeOutstanding: number;
  safePostMoneyCap: number;
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
  antiDilutionApplied: boolean;
  antiDilutionMode: AntiDilutionMode;
  antiDilutionShares: number;
  founderOwnership: number;
  employeeOwnership: number;
  investorOwnership: number;
}

export interface WaterfallPayouts {
  seriesPayouts: Array<{
    id: string;
    label: string;
    ownerGroup: PreferredOwnerGroup;
    seniority: number;
    shares: number;
    liquidationPreference: number;
    preferencePayout: number;
    commonPayout: number;
    totalPayout: number;
    converted: boolean;
    structure: string;
  }>;
  notePayout: number;
  safePayout: number;
  preferredPayout: number;
  commonPayout: number;
  founderPayout: number;
  employeeGrossPayout: number;
  employeeNetPayout: number;
  investorPayout: number;
  priorInvestorPayout: number;
  secondaryCommonPayout: number;
  preferredConverted: boolean;
  preferredStructure: string;
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
  employeeGrossValue: number;
  employeeExerciseCost: number;
  investorProceeds: number;
  priorInvestorProceeds: number;
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
  founders: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        ownershipPercent: z.number().min(0).max(100),
      }),
    )
    .optional(),
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
  preferred: z
    .object({
      participationMode: z.enum(preferredParticipationModes),
      liquidationMultiple: z.number().min(1).max(3),
      antiDilutionMode: z.enum(antiDilutionModes),
    })
    .optional()
    .default({
      participationMode: "non_participating",
      liquidationMultiple: 1,
      antiDilutionMode: "none",
    }),
  operating: z
    .object({
      cashOnHand: z.number().nonnegative(),
      monthlyBurn: z.number().nonnegative(),
      monthlyRevenue: z.number().nonnegative(),
      monthlyRevenueGrowth: z.number().min(0).max(0.5),
      grossMargin: z.number().min(0).max(1),
      targetCashBufferMonths: z.number().min(0).max(24),
      accountsReceivable: z.number().nonnegative(),
      inventory: z.number().nonnegative(),
      accountsPayable: z.number().nonnegative(),
      capexMonthly: z.number().nonnegative(),
      transactionFees: z.number().min(0).max(1_000_000),
    })
    .optional()
    .default({
      cashOnHand: 6_000_000,
      monthlyBurn: 300_000,
      monthlyRevenue: 120_000,
      monthlyRevenueGrowth: 0.08,
      grossMargin: 0.78,
      targetCashBufferMonths: 6,
      accountsReceivable: 120_000,
      inventory: 0,
      accountsPayable: 90_000,
      capexMonthly: 15_000,
      transactionFees: 150_000,
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
