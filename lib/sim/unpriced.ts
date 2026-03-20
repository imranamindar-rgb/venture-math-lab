import { CapTableSnapshot, ScenarioConfig } from "@/lib/sim/types";
import { getFullyDilutedShares } from "@/lib/sim/cap-table";

export function maybeConvertSafe(snapshot: CapTableSnapshot, config: ScenarioConfig) {
  if (!config.safe.enabled) {
    return { converted: false, issuedShares: 0 };
  }

  const existingShares = getFullyDilutedShares(snapshot);
  const ownershipTarget = config.safe.investment / config.safe.postMoneyCap;
  const issuedShares = (ownershipTarget * existingShares) / (1 - ownershipTarget);

  snapshot.modeledInvestorPreferred += issuedShares;
  snapshot.modeledInvestorLiquidationPref += config.safe.investment;

  return { converted: true, issuedShares };
}

export function maybeConvertNote(
  snapshot: CapTableSnapshot,
  config: ScenarioConfig,
  qualifiedPreMoney: number,
  monthsElapsed: number,
) {
  if (!config.note.enabled) {
    return { converted: false, issuedShares: 0, accruedPrincipal: 0 };
  }

  const accruedPrincipal =
    config.note.principal * (1 + config.note.interestRate * (monthsElapsed / 12));

  const fullyDilutedShares = getFullyDilutedShares(snapshot);
  const roundPricePerShare = qualifiedPreMoney / fullyDilutedShares;
  const capPricePerShare = config.note.preMoneyCap / fullyDilutedShares;
  const discountPricePerShare = roundPricePerShare * (1 - config.note.discountRate);
  const conversionPrice = Math.min(capPricePerShare, discountPricePerShare);
  const issuedShares = accruedPrincipal / conversionPrice;

  snapshot.modeledInvestorPreferred += issuedShares;
  snapshot.modeledInvestorLiquidationPref += accruedPrincipal;
  snapshot.noteOutstanding = 0;

  return { converted: true, issuedShares, accruedPrincipal };
}
