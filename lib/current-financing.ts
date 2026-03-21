import { ScenarioConfig } from "@/lib/sim/types";
import { roundCurrency } from "@/lib/precision";

export interface CurrentFinancing {
  totalRoundRaise: number;
  modeledInvestorCheck: number;
  syndicateCheck: number;
  pricedPostMoney: number;
  referencePostMoney: number;
  investorOwnershipEstimate: number;
  warnings: string[];
}

function isMateriallyDifferent(a: number, b: number) {
  return Math.abs(a - b) > 1;
}

export function getCurrentFinancing(config: ScenarioConfig): CurrentFinancing {
  const totalRoundRaise = Math.max(0, config.currentRoundSize);
  const pricedPostMoney = roundCurrency(config.currentPreMoney + totalRoundRaise);
  const warnings: string[] = [];

  if (config.currentRoundKind === "priced_preferred") {
    const modeledInvestorCheck = roundCurrency(Math.min(Math.max(0, config.investor.initialCheck), totalRoundRaise));
    const syndicateCheck = roundCurrency(Math.max(0, totalRoundRaise - modeledInvestorCheck));

    if (config.investor.initialCheck > totalRoundRaise) {
      warnings.push(
        "Investor initial check exceeds the total priced round size, so the engine caps the modeled investor at the full round amount.",
      );
    }

    return {
      totalRoundRaise,
      modeledInvestorCheck,
      syndicateCheck,
      pricedPostMoney,
      referencePostMoney: pricedPostMoney,
      investorOwnershipEstimate: pricedPostMoney > 0 ? modeledInvestorCheck / pricedPostMoney : 0,
      warnings,
    };
  }

  if (config.currentRoundKind === "safe_post_money") {
    const modeledInvestorCheck = config.safe.enabled ? roundCurrency(Math.max(0, config.safe.investment)) : 0;
    const syndicateCheck = roundCurrency(Math.max(0, totalRoundRaise - modeledInvestorCheck));

    if (!config.safe.enabled) {
      warnings.push("Current round is set to SAFE, but SAFE terms are disabled, so modeled SAFE ownership is zero.");
    }

    if (isMateriallyDifferent(config.investor.initialCheck, modeledInvestorCheck)) {
      warnings.push(
        "SAFE economics follow the SAFE investment amount, not the investor initial check field, so mismatched inputs can change return math.",
      );
    }

    if (modeledInvestorCheck > totalRoundRaise) {
      warnings.push(
        "SAFE investment exceeds the stated round raise amount, so the cap-table math treats the SAFE check as the modeled capital at risk.",
      );
    }

    if (syndicateCheck > 0) {
      warnings.push(
        "SAFE round size exceeds the modeled SAFE check. The extra capital informs the company cash runway but is not modeled as a separate SAFE holder yet.",
      );
    }

    return {
      totalRoundRaise,
      modeledInvestorCheck,
      syndicateCheck,
      pricedPostMoney,
      referencePostMoney: roundCurrency(Math.max(config.safe.postMoneyCap, pricedPostMoney)),
      investorOwnershipEstimate: config.safe.postMoneyCap > 0 ? modeledInvestorCheck / config.safe.postMoneyCap : 0,
      warnings,
    };
  }

  const modeledInvestorCheck = config.note.enabled ? roundCurrency(Math.max(0, config.note.principal)) : 0;
  const syndicateCheck = roundCurrency(Math.max(0, totalRoundRaise - modeledInvestorCheck));
  const noteReferencePostMoney = roundCurrency(config.note.preMoneyCap + totalRoundRaise);

  if (!config.note.enabled) {
    warnings.push("Current round is set to capped note, but note terms are disabled, so modeled note ownership is zero.");
  }

  if (isMateriallyDifferent(config.investor.initialCheck, modeledInvestorCheck)) {
    warnings.push(
      "Convertible note economics follow the note principal, not the investor initial check field, so mismatched inputs can change return math.",
    );
  }

  if (modeledInvestorCheck > totalRoundRaise) {
    warnings.push(
      "Note principal exceeds the stated round raise amount, so the cap-table math treats the note principal as the modeled capital at risk.",
    );
  }

  if (syndicateCheck > 0) {
    warnings.push(
      "Note round size exceeds the modeled note principal. The extra capital informs the company cash runway but is not modeled as a separate note holder yet.",
    );
  }

  return {
    totalRoundRaise,
    modeledInvestorCheck,
    syndicateCheck,
    pricedPostMoney,
    referencePostMoney: roundCurrency(Math.max(noteReferencePostMoney, pricedPostMoney)),
    investorOwnershipEstimate: noteReferencePostMoney > 0 ? modeledInvestorCheck / noteReferencePostMoney : 0,
    warnings,
  };
}
