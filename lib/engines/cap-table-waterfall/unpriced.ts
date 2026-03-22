import { CapTableSnapshot, ScenarioConfig } from "@/lib/sim/types";
import {
  addPreferredSeries,
  getFullyDilutedShares,
  getNextPreferredSeniority,
} from "@/lib/engines/cap-table-waterfall/cap-table";
import { roundCurrency, roundShares } from "@/lib/precision";

export function maybeConvertSafe(
  snapshot: CapTableSnapshot,
  config: ScenarioConfig,
  qualifiedPreMoney?: number,
  includeRoundPrice = true,
  seniorityOverride?: number,
) {
  if (!config.safe.enabled || snapshot.safeOutstanding <= 0) {
    return {
      converted: false,
      issuedShares: 0,
      capIssuedShares: 0,
      roundIssuedShares: 0,
      roundPricePerShare: Number.POSITIVE_INFINITY,
      discountedRoundPrice: Number.POSITIVE_INFINITY,
      conversionDriver: "cap" as const,
    };
  }

  const existingShares = getFullyDilutedShares(snapshot);
  const ownershipTarget = snapshot.safePostMoneyCap > 0 ? snapshot.safeOutstanding / snapshot.safePostMoneyCap : 0;
  const capIssuedShares = ownershipTarget > 0 ? roundShares((ownershipTarget * existingShares) / (1 - ownershipTarget)) : 0;
  const roundPricePerShare =
    includeRoundPrice && qualifiedPreMoney && qualifiedPreMoney > 0 && existingShares > 0
      ? qualifiedPreMoney / existingShares
      : Number.POSITIVE_INFINITY;
  const discountedRoundPrice =
    Number.isFinite(roundPricePerShare) && roundPricePerShare > 0
      ? roundPricePerShare * (1 - (config.safe.discountRate ?? 0))
      : Number.POSITIVE_INFINITY;
  const roundIssuedShares =
    Number.isFinite(discountedRoundPrice) && discountedRoundPrice > 0
      ? roundShares(snapshot.safeOutstanding / discountedRoundPrice)
      : 0;
  const issuedShares = roundShares(Math.max(capIssuedShares, roundIssuedShares));

  addPreferredSeries(snapshot, {
    id: `safe-${snapshot.preferredSeries.length + 1}`,
    label: "SAFE shadow series",
    ownerGroup: "modeled",
    seriesType: "safe_shadow",
    shares: issuedShares,
    liquidationPreference: snapshot.safeOutstanding,
    participationMode: config.preferred.participationMode,
    liquidationMultiple: config.preferred.liquidationMultiple,
    antiDilutionMode: config.preferred.antiDilutionMode,
    seniority: seniorityOverride ?? getNextPreferredSeniority(snapshot),
    referencePricePerShare: issuedShares > 0 ? roundCurrency(snapshot.safeOutstanding / issuedShares) : 0,
  });
  snapshot.safeOutstanding = 0;

  return {
    converted: true,
    issuedShares,
    capIssuedShares,
    roundIssuedShares,
      roundPricePerShare: roundCurrency(roundPricePerShare),
      discountedRoundPrice: roundCurrency(discountedRoundPrice),
      conversionDriver: roundIssuedShares > capIssuedShares ? ("round_price" as const) : ("cap" as const),
  };
}

export function maybeConvertNote(
  snapshot: CapTableSnapshot,
  config: ScenarioConfig,
  qualifiedPreMoney: number,
  monthsElapsed: number,
  seniorityOverride?: number,
) {
  if (!config.note.enabled || snapshot.noteOutstanding <= 0) {
    return {
      converted: false,
      issuedShares: 0,
      accruedPrincipal: 0,
      roundPricePerShare: 0,
      capPricePerShare: 0,
      discountPricePerShare: 0,
      conversionPrice: 0,
      conversionDriver: "cap" as const,
    };
  }

  const accruedPrincipal = roundCurrency(
    snapshot.noteOutstanding * (1 + config.note.interestRate * (monthsElapsed / 12)),
  );

  const fullyDilutedShares = getFullyDilutedShares(snapshot);
  const roundPricePerShare = fullyDilutedShares > 0 ? roundCurrency(qualifiedPreMoney / fullyDilutedShares) : 0;
  const capPricePerShare = fullyDilutedShares > 0 ? roundCurrency(config.note.preMoneyCap / fullyDilutedShares) : 0;
  const discountPricePerShare = roundCurrency(roundPricePerShare * (1 - config.note.discountRate));
  const conversionPrice = roundCurrency(Math.min(capPricePerShare, discountPricePerShare));
  const issuedShares = conversionPrice > 0 ? roundShares(accruedPrincipal / conversionPrice) : 0;

  addPreferredSeries(snapshot, {
    id: `note-${snapshot.preferredSeries.length + 1}`,
    label: "Note shadow series",
    ownerGroup: "modeled",
    seriesType: "note_shadow",
    shares: issuedShares,
    liquidationPreference: accruedPrincipal,
    participationMode: config.preferred.participationMode,
    liquidationMultiple: config.preferred.liquidationMultiple,
    antiDilutionMode: config.preferred.antiDilutionMode,
    seniority: seniorityOverride ?? getNextPreferredSeniority(snapshot),
    referencePricePerShare: conversionPrice,
  });
  snapshot.noteOutstanding = 0;

  return {
    converted: true,
    issuedShares,
    accruedPrincipal,
    roundPricePerShare,
    capPricePerShare,
    discountPricePerShare,
    conversionPrice,
    conversionDriver: capPricePerShare <= discountPricePerShare ? ("cap" as const) : ("discount" as const),
  };
}
