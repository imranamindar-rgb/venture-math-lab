import { ScenarioConfig, StagePreset, stageOrder } from "@/lib/sim/types";

export const stagePresets: Record<(typeof stageOrder)[number], StagePreset> = {
  pre_seed: {
    id: "pre_seed",
    label: "Pre-seed",
    preMoney: 7_700_000,
    roundSize: 500_000,
    monthsToNext: 12,
    failureProbability: 0.28,
    earlyExitProbability: 0.06,
    upRoundProbability: 0.58,
    flatRoundProbability: 0.23,
    downRoundProbability: 0.19,
    stepUpRanges: {
      up: [1.8, 3.4],
      flat: [0.95, 1.2],
      down: [0.55, 0.95],
    },
    founderBasePercent: 0.78,
    employeeCommonPercent: 0.04,
    employeePoolPercent: 0.14,
    priorInvestorPercent: 0.04,
    investorOwnershipTarget: 0.11,
    optionPoolTarget: 0.14,
    secondaryChance: 0,
    note: "Unpriced rounds dominate and the next financing is mostly a proof-of-learning step.",
  },
  seed: {
    id: "seed",
    label: "Seed",
    preMoney: 15_800_000,
    roundSize: 3_800_000,
    monthsToNext: 18,
    failureProbability: 0.24,
    earlyExitProbability: 0.08,
    upRoundProbability: 0.55,
    flatRoundProbability: 0.24,
    downRoundProbability: 0.21,
    stepUpRanges: {
      up: [1.6, 3.1],
      flat: [0.9, 1.15],
      down: [0.5, 0.92],
    },
    founderBasePercent: 0.67,
    employeeCommonPercent: 0.05,
    employeePoolPercent: 0.14,
    priorInvestorPercent: 0.14,
    investorOwnershipTarget: 0.18,
    optionPoolTarget: 0.14,
    secondaryChance: 0,
    note: "SAFE and note overhang begin to matter because the Series A sets the first clean ownership picture.",
  },
  series_a: {
    id: "series_a",
    label: "Series A",
    preMoney: 46_500_000,
    roundSize: 14_000_000,
    monthsToNext: 20,
    failureProbability: 0.17,
    earlyExitProbability: 0.09,
    upRoundProbability: 0.56,
    flatRoundProbability: 0.22,
    downRoundProbability: 0.22,
    stepUpRanges: {
      up: [1.5, 2.9],
      flat: [0.9, 1.12],
      down: [0.55, 0.9],
    },
    founderBasePercent: 0.43,
    employeeCommonPercent: 0.07,
    employeePoolPercent: 0.12,
    priorInvestorPercent: 0.38,
    investorOwnershipTarget: 0.2,
    optionPoolTarget: 0.12,
    secondaryChance: 0,
    note: "The company is being judged on step-up efficiency, not just absolute growth.",
  },
  series_b: {
    id: "series_b",
    label: "Series B",
    preMoney: 133_200_000,
    roundSize: 32_400_000,
    monthsToNext: 18,
    failureProbability: 0.13,
    earlyExitProbability: 0.11,
    upRoundProbability: 0.57,
    flatRoundProbability: 0.2,
    downRoundProbability: 0.23,
    stepUpRanges: {
      up: [1.35, 2.6],
      flat: [0.92, 1.1],
      down: [0.6, 0.92],
    },
    founderBasePercent: 0.28,
    employeeCommonPercent: 0.08,
    employeePoolPercent: 0.1,
    priorInvestorPercent: 0.54,
    investorOwnershipTarget: 0.12,
    optionPoolTarget: 0.1,
    secondaryChance: 0.35,
    note: "Secondary liquidity starts to show up, but it can hide fragile venture economics.",
  },
  series_c: {
    id: "series_c",
    label: "Series C",
    preMoney: 307_000_000,
    roundSize: 56_500_000,
    monthsToNext: 16,
    failureProbability: 0.09,
    earlyExitProbability: 0.16,
    upRoundProbability: 0.54,
    flatRoundProbability: 0.23,
    downRoundProbability: 0.23,
    stepUpRanges: {
      up: [1.25, 2.3],
      flat: [0.95, 1.08],
      down: [0.65, 0.94],
    },
    founderBasePercent: 0.2,
    employeeCommonPercent: 0.08,
    employeePoolPercent: 0.08,
    priorInvestorPercent: 0.64,
    investorOwnershipTarget: 0.08,
    optionPoolTarget: 0.08,
    secondaryChance: 0.48,
    note: "Later-stage rounds have tighter upside multiples and much more path dependence.",
  },
};

export const marketOverlayMultipliers = {
  bull: {
    valuation: 1.22,
    failure: 0.88,
    downRound: 0.82,
    exit: 1.3,
  },
  base: {
    valuation: 1,
    failure: 1,
    downRound: 1,
    exit: 1,
  },
  bear: {
    valuation: 0.82,
    failure: 1.16,
    downRound: 1.28,
    exit: 0.8,
  },
} as const;

export const sectorOverlayMultipliers = {
  standard: {
    valuation: 1,
    exit: 1,
  },
  ai_premium: {
    valuation: 1.35,
    exit: 1.18,
  },
} as const;

const standardScenario: ScenarioConfig = {
  id: "nvca_standard",
  name: "NVCA-style Standard Terms",
  description:
    "A clean seed scenario with a post-money SAFE, target pool refreshes, and moderate pro rata behavior.",
  currentStage: "seed",
  currentRoundKind: "safe_post_money",
  currentPreMoney: 15_800_000,
  currentRoundSize: 3_800_000,
  optionPoolTargetPercent: 0.14,
  marketOverlay: "base",
  sectorOverlay: "standard",
  capTable: {
    founderPercent: 67,
    employeeCommonPercent: 5,
    employeePoolPercent: 15,
    priorInvestorPercent: 13,
  },
  safe: {
    enabled: true,
    investment: 3_800_000,
    postMoneyCap: 19_600_000,
  },
  note: {
    enabled: false,
    principal: 0,
    preMoneyCap: 16_000_000,
    discountRate: 0.2,
    interestRate: 0.08,
    recoveryRate: 0.65,
  },
  investor: {
    initialCheck: 3_800_000,
    proRata: true,
    reserveMultiple: 1.75,
    fundSize: 60_000_000,
  },
  employee: {
    grantOwnershipPercent: 0.8,
    vestedFraction: 0.75,
    strikePrice: 0.85,
  },
  secondary: {
    enabled: true,
    founderSaleFraction: 0.08,
    employeeSaleFraction: 0.12,
  },
  controls: {
    iterations: 10_000,
    seed: 42,
  },
  warningFlags: [],
};

const stressScenario: ScenarioConfig = {
  id: "stress_case",
  name: "Stress Case: Tight Market + Note Overhang",
  description:
    "A tighter seed case with a capped note, slower step-up, no pro rata, and reduced liquidity windows.",
  currentStage: "seed",
  currentRoundKind: "convertible_note_cap",
  currentPreMoney: 14_000_000,
  currentRoundSize: 3_200_000,
  optionPoolTargetPercent: 0.15,
  marketOverlay: "bear",
  sectorOverlay: "standard",
  capTable: {
    founderPercent: 63,
    employeeCommonPercent: 6,
    employeePoolPercent: 14,
    priorInvestorPercent: 17,
  },
  safe: {
    enabled: false,
    investment: 0,
    postMoneyCap: 18_000_000,
  },
  note: {
    enabled: true,
    principal: 3_200_000,
    preMoneyCap: 14_000_000,
    discountRate: 0.2,
    interestRate: 0.1,
    recoveryRate: 0.72,
  },
  investor: {
    initialCheck: 3_200_000,
    proRata: false,
    reserveMultiple: 0.5,
    fundSize: 60_000_000,
  },
  employee: {
    grantOwnershipPercent: 0.8,
    vestedFraction: 0.72,
    strikePrice: 1.1,
  },
  secondary: {
    enabled: false,
    founderSaleFraction: 0,
    employeeSaleFraction: 0,
  },
  controls: {
    iterations: 10_000,
    seed: 84,
  },
  warningFlags: [
    "Capped notes stay senior to common in weak outcomes and can absorb more value than founders expect.",
    "Bear-market calibration increases down-round risk and compresses liquidity windows.",
  ],
};

export const scenarioPresets: ScenarioConfig[] = [standardScenario, stressScenario];

export function getScenarioPreset(id: string): ScenarioConfig {
  const match = scenarioPresets.find((preset) => preset.id === id) ?? standardScenario;
  return structuredClone(match);
}

export function getStageIndex(stage: (typeof stageOrder)[number]) {
  return stageOrder.indexOf(stage);
}
