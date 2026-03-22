import { stagePresets, marketOverlayMultipliers, sectorOverlayMultipliers } from "@/data/presets";
import { getCurrentFinancing } from "@/lib/current-financing";
import { CapTableSnapshot, FundingStage, RoundTrend, ScenarioConfig } from "@/lib/sim/types";
import {
  addPreferredSeries,
  getFullyDilutedShares,
  getInvestorOwnership,
  getNextPreferredSeniority,
  topUpOptionPool,
} from "@/lib/engines/cap-table-waterfall/cap-table";
import { clamp, pickWeighted, randomBetween, RandomSource } from "@/lib/sim/rng";
import { roundCurrency, roundShares } from "@/lib/precision";

function applyAntiDilution(
  snapshot: CapTableSnapshot,
  preRoundShares: number,
  pricePerShare: number,
  issuedShares: number,
  roundSize: number,
) {
  let applied = false;
  let addedShares = 0;
  const affectedSeries: string[] = [];

  for (const series of snapshot.preferredSeries) {
    const oldPrice = series.referencePricePerShare;
    if (series.antiDilutionMode === "none" || oldPrice <= 0 || pricePerShare >= oldPrice || series.shares <= 0) {
      continue;
    }

    let newConversionPrice = oldPrice;
    if (series.antiDilutionMode === "full_ratchet") {
      newConversionPrice = pricePerShare;
    } else {
      const numerator = preRoundShares + roundSize / oldPrice;
      const denominator = preRoundShares + issuedShares;
      newConversionPrice = denominator > 0 ? oldPrice * (numerator / denominator) : oldPrice;
    }

    const ratioLift = newConversionPrice > 0 ? oldPrice / newConversionPrice : 1;
    const extraShares = Math.max(0, series.shares * (ratioLift - 1));
    if (extraShares <= 0) {
      continue;
    }

    series.shares = roundShares(series.shares + extraShares);
    series.referencePricePerShare = roundCurrency(newConversionPrice);
    applied = true;
    addedShares += roundShares(extraShares);
    affectedSeries.push(series.label);
  }

  return { applied, addedShares, affectedSeries };
}

export function getReferencePostMoney(config: ScenarioConfig) {
  return getCurrentFinancing(config).referencePostMoney;
}

export function projectMedianRound(stage: FundingStage, currentPostMoney: number, config: ScenarioConfig) {
  const preset = stagePresets[stage];
  const market = marketOverlayMultipliers[config.marketOverlay];
  const sector = sectorOverlayMultipliers[config.sectorOverlay];
  const preMoney = preset.preMoney * market.valuation * sector.valuation;
  const roundSize = preset.roundSize;

  return {
    roundTrend: (preMoney >= currentPostMoney ? "up" : preMoney >= currentPostMoney * 0.9 ? "flat" : "down") as RoundTrend,
    preMoney,
    roundSize,
    postMoney: preMoney + roundSize,
    stepUpRatio: preMoney / currentPostMoney,
  };
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
  seriesLabel = "New preferred round",
  seniorityOverride?: number,
) {
  const financing = getCurrentFinancing(config);
  const preRoundShares = getFullyDilutedShares(snapshot);
  const pricePerShare = preRoundShares > 0 ? roundCurrency(preMoney / preRoundShares) : 0;
  const issuedShares = pricePerShare > 0 ? roundShares(roundSize / pricePerShare) : 0;
  const antiDilution = applyAntiDilution(snapshot, preRoundShares, pricePerShare, issuedShares, roundSize);

  const investorExistingPct = getInvestorOwnership(snapshot);
  const targetFollowOnShares = config.investor.proRata ? issuedShares * investorExistingPct : 0;
  const targetFollowOnCash = targetFollowOnShares * pricePerShare;
  const reserveCap = financing.modeledInvestorCheck * config.investor.reserveMultiple;
  const reserveRemaining = Math.max(
    0,
    reserveCap - Math.max(0, snapshot.modeledInvestorInvested - financing.modeledInvestorCheck),
  );

  const actualFollowOnCash = Math.min(targetFollowOnCash, reserveRemaining);
  const actualFollowOnShares = pricePerShare > 0 ? roundShares(actualFollowOnCash / pricePerShare) : 0;
  const seniority = seniorityOverride ?? getNextPreferredSeniority(snapshot);

  if (actualFollowOnShares > 0) {
    addPreferredSeries(snapshot, {
      id: `${seriesLabel}-modeled-${snapshot.preferredSeries.length + 1}`,
      label: `${seriesLabel} modeled follow-on`,
      ownerGroup: "modeled",
      seriesType: "priced",
      shares: actualFollowOnShares,
      liquidationPreference: actualFollowOnCash,
      participationMode: config.preferred.participationMode,
      liquidationMultiple: config.preferred.liquidationMultiple,
      antiDilutionMode: config.preferred.antiDilutionMode,
      seniority,
      referencePricePerShare: pricePerShare,
    });
    snapshot.modeledInvestorInvested = roundCurrency(snapshot.modeledInvestorInvested + actualFollowOnCash);
  }

  const syndicateShares = roundShares(issuedShares - actualFollowOnShares);
  const syndicateCash = roundCurrency(roundSize - actualFollowOnCash);
  if (syndicateShares > 0) {
    addPreferredSeries(snapshot, {
      id: `${seriesLabel}-prior-${snapshot.preferredSeries.length + 1}`,
      label: `${seriesLabel} syndicate`,
      ownerGroup: "prior",
      seriesType: "priced",
      shares: syndicateShares,
      liquidationPreference: syndicateCash,
      participationMode: config.preferred.participationMode,
      liquidationMultiple: config.preferred.liquidationMultiple,
      antiDilutionMode: config.preferred.antiDilutionMode,
      seniority,
      referencePricePerShare: pricePerShare,
    });
  }

  return {
    pricePerShare,
    issuedShares,
    followOnCash: roundCurrency(actualFollowOnCash),
    followOnShares: actualFollowOnShares,
    antiDilutionApplied: antiDilution.applied,
    antiDilutionShares: roundShares(antiDilution.addedShares),
    antiDilutionSeries: antiDilution.affectedSeries,
  };
}

export function maybeRefreshPool(snapshot: CapTableSnapshot, config: ScenarioConfig) {
  const added = topUpOptionPool(snapshot, config.optionPoolTargetPercent);
  return added > 0;
}
