import { CapTableSnapshot, PreferredSeriesSnapshot, PreferredTermsConfig, WaterfallPayouts } from "@/lib/sim/types";

function getSafePayout(snapshot: CapTableSnapshot, remaining: number) {
  const safeAsConvertedValue =
    snapshot.safeOutstanding > 0 && snapshot.safePostMoneyCap > 0
      ? remaining * (snapshot.safeOutstanding / snapshot.safePostMoneyCap)
      : 0;
  return Math.min(remaining, Math.max(snapshot.safeOutstanding, safeAsConvertedValue));
}

function allocatePreferenceBySeniority(series: PreferredSeriesSnapshot[], availableCash: number) {
  const payouts = new Map<string, number>();
  let remaining = availableCash;
  const seniorityRanks = [...new Set(series.map((entry) => entry.seniority))].sort((a, b) => b - a);

  for (const rank of seniorityRanks) {
    if (remaining <= 0) {
      break;
    }
    const layer = series.filter((entry) => entry.seniority === rank);
    const layerPreference = layer.reduce(
      (total, entry) => total + entry.liquidationPreference * entry.liquidationMultiple,
      0,
    );
    const layerPayout = Math.min(remaining, layerPreference);
    remaining -= layerPayout;

    for (const entry of layer) {
      const share = layerPreference > 0 ? (entry.liquidationPreference * entry.liquidationMultiple) / layerPreference : 0;
      payouts.set(entry.id, layerPayout * share);
    }
  }

  return { payouts, remaining };
}

function buildCommonShares(snapshot: CapTableSnapshot, convertedSeries: PreferredSeriesSnapshot[]) {
  return (
    snapshot.founderCommon +
    snapshot.employeeCommon +
    snapshot.secondaryCommon +
    convertedSeries.reduce((total, entry) => total + entry.shares, 0)
  );
}

function evaluateConversionSet(
  snapshot: CapTableSnapshot,
  series: PreferredSeriesSnapshot[],
  availableCash: number,
  conversionSet: Set<string>,
) {
  const participating = series.filter((entry) => entry.participationMode === "participating");
  const converted = series.filter(
    (entry) => entry.participationMode === "non_participating" && conversionSet.has(entry.id),
  );
  const preferenceOnly = series.filter(
    (entry) => entry.participationMode === "participating" || !conversionSet.has(entry.id),
  );
  const { payouts: preferencePayouts, remaining } = allocatePreferenceBySeniority(preferenceOnly, availableCash);
  const commonParticipants = buildCommonShares(snapshot, [...participating, ...converted]);
  const commonPrice = commonParticipants > 0 ? remaining / commonParticipants : 0;
  const seriesPayouts = series.map((entry) => {
    const convertedSeries = entry.participationMode === "non_participating" && conversionSet.has(entry.id);
    const preferencePayout = preferencePayouts.get(entry.id) ?? 0;
    const commonPayout =
      entry.participationMode === "participating" || convertedSeries ? entry.shares * commonPrice : 0;

    return {
      id: entry.id,
      payout: preferencePayout + commonPayout,
      preferencePayout,
      commonPayout,
      converted: convertedSeries,
    };
  });

  return {
    remaining,
    commonPrice,
    seriesPayouts,
  };
}

function chooseStableConversionSet(snapshot: CapTableSnapshot, availableCash: number) {
  const allSeries = snapshot.preferredSeries;
  const convertible = allSeries.filter((entry) => entry.participationMode === "non_participating");
  const cache = new Map<string, ReturnType<typeof evaluateConversionSet>>();

  function getEvaluation(set: Set<string>) {
    const key = [...set].sort().join("|");
    const cached = cache.get(key);
    if (cached) {
      return cached;
    }
    const evaluation = evaluateConversionSet(snapshot, allSeries, availableCash, set);
    cache.set(key, evaluation);
    return evaluation;
  }

  const stableSets: Array<{ set: Set<string>; convertedShares: number; evaluation: ReturnType<typeof evaluateConversionSet> }> = [];
  const totalCombos = 1 << convertible.length;

  for (let mask = 0; mask < totalCombos; mask += 1) {
    const set = new Set<string>();
    for (let index = 0; index < convertible.length; index += 1) {
      if (mask & (1 << index)) {
        set.add(convertible[index].id);
      }
    }

    const evaluation = getEvaluation(set);
    let stable = true;

    for (const entry of convertible) {
      const current = evaluation.seriesPayouts.find((item) => item.id === entry.id)?.payout ?? 0;
      const altSet = new Set(set);
      if (altSet.has(entry.id)) {
        altSet.delete(entry.id);
      } else {
        altSet.add(entry.id);
      }
      const alternative = getEvaluation(altSet).seriesPayouts.find((item) => item.id === entry.id)?.payout ?? 0;
      if (alternative > current + 1e-6) {
        stable = false;
        break;
      }
    }

    if (stable) {
      stableSets.push({
        set,
        convertedShares: convertible
          .filter((entry) => set.has(entry.id))
          .reduce((total, entry) => total + entry.shares, 0),
        evaluation,
      });
    }
  }

  if (stableSets.length === 0) {
    return getEvaluation(new Set<string>());
  }

  stableSets.sort((a, b) => b.convertedShares - a.convertedShares);
  return stableSets[0].evaluation;
}

function buildStructureLabel(seriesPayouts: WaterfallPayouts["seriesPayouts"]) {
  if (seriesPayouts.length === 0) {
    return "No preferred stock";
  }

  const participatingCount = seriesPayouts.filter((entry) => entry.structure.includes("participating")).length;
  const convertedCount = seriesPayouts.filter((entry) => entry.converted).length;
  const preferenceCount = seriesPayouts.length - convertedCount;

  if (convertedCount === seriesPayouts.length) {
    return "All preferred as-converted common";
  }
  if (participatingCount === seriesPayouts.length) {
    return "Fully participating preferred stack";
  }
  if (convertedCount > 0) {
    return `Mixed stack: ${preferenceCount} pref / ${convertedCount} converted`;
  }
  return "Stacked preferred preferences";
}

export function computeWaterfall(
  snapshot: CapTableSnapshot,
  exitValue: number,
  employeeExerciseCost: number,
  preferredTerms: PreferredTermsConfig = {
    participationMode: "non_participating",
    liquidationMultiple: 1,
    antiDilutionMode: "none",
  },
): WaterfallPayouts {
  let remaining = exitValue;
  const notePayout = Math.min(remaining, snapshot.noteOutstanding);
  remaining -= notePayout;
  const safePayout = getSafePayout(snapshot, remaining);
  remaining -= safePayout;

  const evaluation = chooseStableConversionSet(snapshot, remaining);
  const preferredPayout = evaluation.seriesPayouts.reduce((total, entry) => total + entry.preferencePayout, 0);
  const commonPayout = evaluation.remaining;
  const founderPayout = snapshot.founderCommon * evaluation.commonPrice;
  const employeeGrossPayout = snapshot.employeeCommon * evaluation.commonPrice;
  const employeeNetPayout = Math.max(0, employeeGrossPayout - employeeExerciseCost);
  const seriesPayouts = snapshot.preferredSeries.map((series) => {
    const result = evaluation.seriesPayouts.find((entry) => entry.id === series.id);
    const preferencePayout = result?.preferencePayout ?? 0;
    const commonPayoutForSeries = result?.commonPayout ?? 0;
    const converted = result?.converted ?? false;
    const structure =
      series.participationMode === "participating"
        ? `${series.liquidationMultiple.toFixed(1)}x participating`
        : converted
          ? "As-converted common"
          : `${series.liquidationMultiple.toFixed(1)}x non-participating`;

    return {
      id: series.id,
      label: series.label,
      ownerGroup: series.ownerGroup,
      seniority: series.seniority,
      shares: series.shares,
      liquidationPreference: series.liquidationPreference * series.liquidationMultiple,
      preferencePayout,
      commonPayout: commonPayoutForSeries,
      totalPayout: preferencePayout + commonPayoutForSeries,
      converted,
      structure,
    };
  });
  const investorPreferredPayout = seriesPayouts
    .filter((entry) => entry.ownerGroup === "modeled")
    .reduce((total, entry) => total + entry.totalPayout, 0);
  const priorInvestorPayout = seriesPayouts
    .filter((entry) => entry.ownerGroup === "prior")
    .reduce((total, entry) => total + entry.totalPayout, 0);
  const investorPayout = investorPreferredPayout + notePayout + safePayout;
  const secondaryCommonPayout = snapshot.secondaryCommon * evaluation.commonPrice;
  const preferredConverted = seriesPayouts.length > 0 && seriesPayouts.every((entry) => entry.converted);

  return {
    seriesPayouts,
    notePayout,
    safePayout,
    preferredPayout,
    commonPayout,
    founderPayout,
    employeeGrossPayout,
    employeeNetPayout,
    investorPayout,
    priorInvestorPayout,
    secondaryCommonPayout,
    preferredConverted,
    preferredStructure:
      snapshot.preferredSeries.length === 0
        ? `${preferredTerms.liquidationMultiple.toFixed(1)}x ${preferredTerms.participationMode.replace("_", " ")}`
        : buildStructureLabel(seriesPayouts),
  };
}
