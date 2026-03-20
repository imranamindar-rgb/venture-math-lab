import { sumFounderOwnership } from "@/lib/founders";
import { ScenarioConfig, CapTableSnapshot, OwnershipPoint } from "@/lib/sim/types";

const BASE_SHARES = 10_000_000;

function normalizedBasePercents(config: ScenarioConfig) {
  const total =
    config.capTable.founderPercent +
    config.capTable.employeeCommonPercent +
    config.capTable.employeePoolPercent +
    config.capTable.priorInvestorPercent;

  const safeTotal = total <= 0 ? 1 : total;

  return {
    founder: sumFounderOwnership(config.founders, config.capTable.founderPercent) / safeTotal,
    employeeCommon: config.capTable.employeeCommonPercent / safeTotal,
    employeePool: config.capTable.employeePoolPercent / safeTotal,
    priorInvestor: config.capTable.priorInvestorPercent / safeTotal,
  };
}

export function createInitialCapTable(config: ScenarioConfig): CapTableSnapshot {
  const base = normalizedBasePercents(config);
  const referencePostMoney =
    config.currentRoundKind === "safe_post_money"
      ? config.safe.postMoneyCap
      : config.currentRoundKind === "convertible_note_cap"
        ? config.note.preMoneyCap + config.note.principal
        : config.currentPreMoney + config.investor.initialCheck;

  const pricedInvestorOwnership =
    config.currentRoundKind === "priced_preferred"
      ? config.investor.initialCheck / (config.currentPreMoney + config.investor.initialCheck)
      : 0;

  const incumbentShareScale = 1 - pricedInvestorOwnership;
  const founderCommon = BASE_SHARES * base.founder * incumbentShareScale;
  const employeeCommon = BASE_SHARES * base.employeeCommon * incumbentShareScale;
  const employeePool = BASE_SHARES * base.employeePool * incumbentShareScale;
  const priorInvestorPreferred = BASE_SHARES * base.priorInvestor * incumbentShareScale;
  const modeledInvestorPreferred = BASE_SHARES * pricedInvestorOwnership;

  return {
    founderCommon,
    employeeCommon,
    employeePool,
    priorInvestorPreferred,
    modeledInvestorPreferred,
    secondaryCommon: 0,
    priorInvestorLiquidationPref: referencePostMoney * base.priorInvestor * incumbentShareScale,
    modeledInvestorLiquidationPref:
      config.currentRoundKind === "priced_preferred" ? config.investor.initialCheck : 0,
    modeledInvestorInvested: config.investor.initialCheck,
    noteOutstanding: config.note.enabled ? config.note.principal : 0,
    realizedFounderSecondary: 0,
    realizedEmployeeSecondary: 0,
  };
}

export function getFullyDilutedShares(snapshot: CapTableSnapshot) {
  return (
    snapshot.founderCommon +
    snapshot.employeeCommon +
    snapshot.employeePool +
    snapshot.priorInvestorPreferred +
    snapshot.modeledInvestorPreferred +
    snapshot.secondaryCommon
  );
}

export function getParticipatingCommonShares(snapshot: CapTableSnapshot) {
  return (
    snapshot.founderCommon +
    snapshot.employeeCommon +
    snapshot.priorInvestorPreferred +
    snapshot.modeledInvestorPreferred +
    snapshot.secondaryCommon
  );
}

export function getFounderOwnership(snapshot: CapTableSnapshot) {
  return snapshot.founderCommon / getFullyDilutedShares(snapshot);
}

export function getEmployeeOwnership(snapshot: CapTableSnapshot) {
  return snapshot.employeeCommon / getFullyDilutedShares(snapshot);
}

export function getInvestorOwnership(snapshot: CapTableSnapshot) {
  return snapshot.modeledInvestorPreferred / getFullyDilutedShares(snapshot);
}

export function getPriorInvestorOwnership(snapshot: CapTableSnapshot) {
  return snapshot.priorInvestorPreferred / getFullyDilutedShares(snapshot);
}

export function getPoolOwnership(snapshot: CapTableSnapshot) {
  return snapshot.employeePool / getFullyDilutedShares(snapshot);
}

export function createOwnershipPoint(label: string, snapshot: CapTableSnapshot): OwnershipPoint {
  return {
    label,
    founderPct: getFounderOwnership(snapshot),
    employeePct: getEmployeeOwnership(snapshot),
    investorPct: getInvestorOwnership(snapshot),
    priorInvestorPct: getPriorInvestorOwnership(snapshot),
    poolPct: getPoolOwnership(snapshot),
  };
}

export function topUpOptionPool(snapshot: CapTableSnapshot, targetPercent: number) {
  const total = getFullyDilutedShares(snapshot);
  const targetShares = (targetPercent * total - snapshot.employeePool) / (1 - targetPercent);
  const addedShares = Math.max(0, targetShares);
  snapshot.employeePool += addedShares;
  return addedShares;
}

export function applySecondaryLiquidity(
  snapshot: CapTableSnapshot,
  pricePerShare: number,
  founderSaleFraction: number,
  employeeSaleFraction: number,
) {
  const founderSaleShares = snapshot.founderCommon * founderSaleFraction;
  const employeeSaleShares = snapshot.employeeCommon * employeeSaleFraction;

  snapshot.founderCommon -= founderSaleShares;
  snapshot.employeeCommon -= employeeSaleShares;
  snapshot.secondaryCommon += founderSaleShares + employeeSaleShares;
  snapshot.realizedFounderSecondary += founderSaleShares * pricePerShare;
  snapshot.realizedEmployeeSecondary += employeeSaleShares * pricePerShare;
}
