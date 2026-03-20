import { CapTableSnapshot, ScenarioConfig } from "@/lib/sim/types";
import {
  addPreferredSeries,
  getFullyDilutedShares,
  getNextPreferredSeniority,
} from "@/lib/engines/cap-table-waterfall/cap-table";

export function maybeConvertSafe(snapshot: CapTableSnapshot, config: ScenarioConfig) {
  if (!config.safe.enabled || snapshot.safeOutstanding <= 0) {
    return { converted: false, issuedShares: 0 };
  }

  const existingShares = getFullyDilutedShares(snapshot);
  const ownershipTarget = snapshot.safePostMoneyCap > 0 ? snapshot.safeOutstanding / snapshot.safePostMoneyCap : 0;
  const issuedShares = (ownershipTarget * existingShares) / (1 - ownershipTarget);

  addPreferredSeries(snapshot, {
    id: `safe-${snapshot.preferredSeries.length + 1}`,
    label: "SAFE conversion",
    ownerGroup: "modeled",
    shares: issuedShares,
    liquidationPreference: snapshot.safeOutstanding,
    participationMode: config.preferred.participationMode,
    liquidationMultiple: config.preferred.liquidationMultiple,
    antiDilutionMode: config.preferred.antiDilutionMode,
    seniority: getNextPreferredSeniority(snapshot),
    referencePricePerShare: issuedShares > 0 ? snapshot.safeOutstanding / issuedShares : 0,
  });
  snapshot.safeOutstanding = 0;

  return { converted: true, issuedShares };
}

export function maybeConvertNote(
  snapshot: CapTableSnapshot,
  config: ScenarioConfig,
  qualifiedPreMoney: number,
  monthsElapsed: number,
) {
  if (!config.note.enabled || snapshot.noteOutstanding <= 0) {
    return { converted: false, issuedShares: 0, accruedPrincipal: 0 };
  }

  const accruedPrincipal =
    snapshot.noteOutstanding * (1 + config.note.interestRate * (monthsElapsed / 12));

  const fullyDilutedShares = getFullyDilutedShares(snapshot);
  const roundPricePerShare = qualifiedPreMoney / fullyDilutedShares;
  const capPricePerShare = config.note.preMoneyCap / fullyDilutedShares;
  const discountPricePerShare = roundPricePerShare * (1 - config.note.discountRate);
  const conversionPrice = Math.min(capPricePerShare, discountPricePerShare);
  const issuedShares = accruedPrincipal / conversionPrice;

  addPreferredSeries(snapshot, {
    id: `note-${snapshot.preferredSeries.length + 1}`,
    label: "Note conversion",
    ownerGroup: "modeled",
    shares: issuedShares,
    liquidationPreference: accruedPrincipal,
    participationMode: config.preferred.participationMode,
    liquidationMultiple: config.preferred.liquidationMultiple,
    antiDilutionMode: config.preferred.antiDilutionMode,
    seniority: getNextPreferredSeniority(snapshot),
    referencePricePerShare: conversionPrice,
  });
  snapshot.noteOutstanding = 0;

  return { converted: true, issuedShares, accruedPrincipal };
}
