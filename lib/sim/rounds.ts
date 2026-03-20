import { stagePresets, marketOverlayMultipliers, sectorOverlayMultipliers } from "@/data/presets";
import { CapTableSnapshot, FundingStage, RoundTrend, ScenarioConfig } from "@/lib/sim/types";
import {
  getFullyDilutedShares,
  getInvestorOwnership,
  topUpOptionPool,
} from "@/lib/sim/cap-table";
import { clamp, pickWeighted, randomBetween, RandomSource } from "@/lib/sim/rng";

export function getReferencePostMoney(config: ScenarioConfig) {
  if (config.currentRoundKind === "safe_post_money") {
    return config.safe.postMoneyCap;
  }

  if (config.currentRoundKind === "convertible_note_cap") {
    return config.note.preMoneyCap + config.note.principal;
  }

  return config.currentPreMoney + config.investor.initialCheck;
}

export function sampleRoundTrend(
  rng: RandomSource,
  stage: FundingStage,
  config: ScenarioConfig,
  stepPenalty: number,
): RoundTrend {
  const preset = stagePresets[stage];
  const market = marketOverlayMultipliers[config.marketOverlay];
  const down = clamp(preset.downRoundProbability * market.downRound + stepPenalty, 0.08, 0.55);
  const flat = clamp(preset.flatRoundProbability + stepPenalty * 0.4, 0.1, 0.4);
  const up = Math.max(0.1, 1 - down - flat);

  return pickWeighted(rng, [
    { value: "up" as const, weight: up },
    { value: "flat" as const, weight: flat },
    { value: "down" as const, weight: down },
  ]);
}

export function sampleNextRound(
  rng: RandomSource,
  stage: FundingStage,
  currentPostMoney: number,
  config: ScenarioConfig,
  stepPenalty: number,
) {
  const preset = stagePresets[stage];
  const market = marketOverlayMultipliers[config.marketOverlay];
  const sector = sectorOverlayMultipliers[config.sectorOverlay];
  const roundTrend = sampleRoundTrend(rng, stage, config, stepPenalty);
  const range = preset.stepUpRanges[roundTrend];
  const sampledStep = randomBetween(rng, range[0], range[1]);
  const benchmarkPreMoney =
    preset.preMoney * market.valuation * sector.valuation * randomBetween(rng, 0.88, 1.14);
  const pathPreMoney = currentPostMoney * sampledStep;
  const preMoney = benchmarkPreMoney * 0.6 + pathPreMoney * 0.4;
  const roundSize = preset.roundSize * randomBetween(rng, 0.82, 1.24);

  return {
    roundTrend,
    preMoney,
    roundSize,
    postMoney: preMoney + roundSize,
    stepUpRatio: preMoney / currentPostMoney,
  };
}

export function issuePreferredRound(
  snapshot: CapTableSnapshot,
  preMoney: number,
  roundSize: number,
  config: ScenarioConfig,
) {
  const preRoundShares = getFullyDilutedShares(snapshot);
  const pricePerShare = preMoney / preRoundShares;
  const issuedShares = roundSize / pricePerShare;

  const investorExistingPct = getInvestorOwnership(snapshot);
  const targetFollowOnShares = config.investor.proRata ? issuedShares * investorExistingPct : 0;
  const targetFollowOnCash = targetFollowOnShares * pricePerShare;
  const reserveCap = config.investor.initialCheck * config.investor.reserveMultiple;
  const reserveRemaining = Math.max(0, reserveCap - Math.max(0, snapshot.modeledInvestorInvested - config.investor.initialCheck));

  const actualFollowOnCash = Math.min(targetFollowOnCash, reserveRemaining);
  const actualFollowOnShares = actualFollowOnCash / pricePerShare;

  snapshot.modeledInvestorPreferred += actualFollowOnShares;
  snapshot.modeledInvestorLiquidationPref += actualFollowOnCash;
  snapshot.modeledInvestorInvested += actualFollowOnCash;

  snapshot.priorInvestorPreferred += issuedShares - actualFollowOnShares;
  snapshot.priorInvestorLiquidationPref += roundSize - actualFollowOnCash;

  return {
    pricePerShare,
    issuedShares,
    followOnCash: actualFollowOnCash,
    followOnShares: actualFollowOnShares,
  };
}

export function maybeRefreshPool(snapshot: CapTableSnapshot, config: ScenarioConfig) {
  const added = topUpOptionPool(snapshot, config.optionPoolTargetPercent);
  return added > 0;
}
