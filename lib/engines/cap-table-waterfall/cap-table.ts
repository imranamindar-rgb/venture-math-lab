import { sumFounderOwnership } from "@/lib/founders";
import { getCurrentFinancing } from "@/lib/current-financing";
import {
  ScenarioConfig,
  CapTableSnapshot,
  OwnershipPoint,
  PreferredOwnerGroup,
  PreferredSeriesSnapshot,
  PreferredTermsConfig,
  PreferredSeriesType,
} from "@/lib/sim/types";
import { roundCurrency, roundShares } from "@/lib/precision";

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

function createPreferredSeries(
  id: string,
  label: string,
  ownerGroup: PreferredOwnerGroup,
  seriesType: PreferredSeriesType,
  shares: number,
  liquidationPreference: number,
  seniority: number,
  terms: PreferredTermsConfig,
  referencePricePerShare = shares > 0 ? liquidationPreference / shares : 0,
): PreferredSeriesSnapshot {
  return {
    id,
    label,
    ownerGroup,
    seriesType,
    shares: roundShares(shares),
    liquidationPreference: roundCurrency(liquidationPreference),
    participationMode: terms.participationMode,
    liquidationMultiple: terms.liquidationMultiple,
    antiDilutionMode: terms.antiDilutionMode,
    seniority,
    referencePricePerShare: roundCurrency(referencePricePerShare),
  };
}

export function clonePreferredSeries(series: PreferredSeriesSnapshot[]) {
  return series.map((entry) => ({ ...entry }));
}

export function getPreferredSeries(snapshot: CapTableSnapshot, ownerGroup?: PreferredOwnerGroup) {
  if (!ownerGroup) {
    return snapshot.preferredSeries;
  }
  return snapshot.preferredSeries.filter((entry) => entry.ownerGroup === ownerGroup);
}

export function getPreferredShares(snapshot: CapTableSnapshot, ownerGroup?: PreferredOwnerGroup) {
  return getPreferredSeries(snapshot, ownerGroup).reduce((total, entry) => total + entry.shares, 0);
}

export function getPreferredPreference(snapshot: CapTableSnapshot, ownerGroup?: PreferredOwnerGroup) {
  return getPreferredSeries(snapshot, ownerGroup).reduce((total, entry) => total + entry.liquidationPreference, 0);
}

export function getNextPreferredSeniority(snapshot: CapTableSnapshot) {
  return snapshot.preferredSeries.reduce((highest, entry) => Math.max(highest, entry.seniority), 0) + 1;
}

export function addPreferredSeries(snapshot: CapTableSnapshot, series: PreferredSeriesSnapshot) {
  if (series.shares <= 0 && series.liquidationPreference <= 0) {
    return;
  }
  snapshot.preferredSeries.push({
    ...series,
    shares: roundShares(series.shares),
    liquidationPreference: roundCurrency(series.liquidationPreference),
    referencePricePerShare: roundCurrency(series.referencePricePerShare),
  });
}

export function createInitialCapTable(config: ScenarioConfig): CapTableSnapshot {
  const base = normalizedBasePercents(config);
  const financing = getCurrentFinancing(config);
  const totalNewInvestorOwnership =
    config.currentRoundKind === "priced_preferred" && financing.pricedPostMoney > 0
      ? financing.totalRoundRaise / financing.pricedPostMoney
      : 0;
  const modeledInvestorOwnership =
    config.currentRoundKind === "priced_preferred" ? financing.investorOwnershipEstimate : 0;
  const syndicateOwnership =
    config.currentRoundKind === "priced_preferred" && financing.pricedPostMoney > 0
      ? financing.syndicateCheck / financing.pricedPostMoney
      : 0;

  const incumbentShareScale = 1 - totalNewInvestorOwnership;
  const founderCommon = roundShares(BASE_SHARES * base.founder * incumbentShareScale);
  const employeeCommon = roundShares(BASE_SHARES * base.employeeCommon * incumbentShareScale);
  const employeePool = roundShares(BASE_SHARES * base.employeePool * incumbentShareScale);
  const priorInvestorShares = roundShares(BASE_SHARES * base.priorInvestor * incumbentShareScale);
  const syndicateShares = roundShares(BASE_SHARES * syndicateOwnership);
  const modeledInvestorShares = roundShares(BASE_SHARES * modeledInvestorOwnership);
  const preferredSeries: PreferredSeriesSnapshot[] = [];

  if (priorInvestorShares > 0) {
    preferredSeries.push(
      createPreferredSeries(
        "prior-existing",
        "Existing prior preferred",
        "prior",
        "priced",
        priorInvestorShares,
        financing.referencePostMoney * base.priorInvestor * incumbentShareScale,
        1,
        config.preferred,
      ),
    );
  }

  if (syndicateShares > 0) {
    preferredSeries.push(
      createPreferredSeries(
        "current-syndicate",
        `${config.currentStage.replace("_", " ")} syndicate`,
        "prior",
        "priced",
        syndicateShares,
        financing.syndicateCheck,
        2,
        config.preferred,
      ),
    );
  }

  if (modeledInvestorShares > 0) {
    preferredSeries.push(
      createPreferredSeries(
        "current-modeled",
        `Modeled ${config.currentStage.replace("_", " ")} investor`,
        "modeled",
        "priced",
        modeledInvestorShares,
        config.currentRoundKind === "priced_preferred" ? financing.modeledInvestorCheck : 0,
        2,
        config.preferred,
      ),
    );
  }

  return {
    founderCommon,
    employeeCommon,
    employeePool,
    preferredSeries,
    secondaryCommon: 0,
    modeledInvestorInvested: roundCurrency(financing.modeledInvestorCheck),
    safeOutstanding:
      config.currentRoundKind === "safe_post_money" && config.safe.enabled ? roundCurrency(financing.modeledInvestorCheck) : 0,
    safePostMoneyCap: config.currentRoundKind === "safe_post_money" ? config.safe.postMoneyCap : 0,
    noteOutstanding:
      config.currentRoundKind === "convertible_note_cap" && config.note.enabled ? roundCurrency(financing.modeledInvestorCheck) : 0,
    realizedFounderSecondary: 0,
    realizedEmployeeSecondary: 0,
  };
}

export function getFullyDilutedShares(snapshot: CapTableSnapshot) {
  return (
    snapshot.founderCommon +
    snapshot.employeeCommon +
    snapshot.employeePool +
    getPreferredShares(snapshot) +
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
  return getPreferredShares(snapshot, "modeled") / getFullyDilutedShares(snapshot);
}

export function getPriorInvestorOwnership(snapshot: CapTableSnapshot) {
  return getPreferredShares(snapshot, "prior") / getFullyDilutedShares(snapshot);
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
  snapshot.employeePool = roundShares(snapshot.employeePool + addedShares);
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

  snapshot.founderCommon = roundShares(snapshot.founderCommon - founderSaleShares);
  snapshot.employeeCommon = roundShares(snapshot.employeeCommon - employeeSaleShares);
  snapshot.secondaryCommon = roundShares(snapshot.secondaryCommon + founderSaleShares + employeeSaleShares);
  snapshot.realizedFounderSecondary = roundCurrency(snapshot.realizedFounderSecondary + founderSaleShares * pricePerShare);
  snapshot.realizedEmployeeSecondary = roundCurrency(snapshot.realizedEmployeeSecondary + employeeSaleShares * pricePerShare);
}
