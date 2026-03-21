import { ScenarioConfig } from "@/lib/sim/types";
import { replaceAllText } from "@/lib/compat";
import { getCurrentFinancing } from "@/lib/current-financing";
import { sumFounderOwnership } from "@/lib/founders";

export type SupportLevel = "standard" | "approximate" | "unsupported";

export interface ScenarioIssue {
  level: SupportLevel;
  title: string;
  detail: string;
}

export interface ScenarioAssumption {
  label: string;
  value: string;
}

export interface ScenarioDiagnostics {
  supportLevel: SupportLevel;
  supportLabel: string;
  summary: string;
  issues: ScenarioIssue[];
  assumptions: ScenarioAssumption[];
}

function formatPercentPoint(value: number) {
  return `${value.toFixed(value >= 10 ? 0 : 1)}%`;
}

function formatCurrencyCompact(value: number) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 1,
  }).format(value);
}

export function analyzeScenario(config: ScenarioConfig): ScenarioDiagnostics {
  const financing = getCurrentFinancing(config);
  const totalOwnership =
    config.capTable.founderPercent +
    config.capTable.employeeCommonPercent +
    config.capTable.employeePoolPercent +
    config.capTable.priorInvestorPercent;
  const founderSplitTotal = sumFounderOwnership(config.founders, config.capTable.founderPercent);
  const issues: ScenarioIssue[] = [];

  if (config.currentRoundKind === "safe_post_money" && (!config.safe.enabled || config.safe.investment <= 0)) {
    issues.push({
      level: "unsupported",
      title: "SAFE round has no active SAFE terms",
      detail: "The current round is marked as a SAFE, but the SAFE instrument is disabled or has zero investment.",
    });
  }

  if (config.currentRoundKind === "convertible_note_cap" && (!config.note.enabled || config.note.principal <= 0)) {
    issues.push({
      level: "unsupported",
      title: "Note round has no active note principal",
      detail: "The current round is marked as a capped note, but the note instrument is disabled or has zero principal.",
    });
  }

  if (config.currentRoundKind === "priced_preferred" && financing.modeledInvestorCheck <= 0) {
    issues.push({
      level: "unsupported",
      title: "Priced round has no modeled investor check",
      detail: "A priced preferred round needs a positive modeled investor check to produce ownership and return math.",
    });
  }

  if (Math.abs(totalOwnership - 100) > 0.5) {
    issues.push({
      level: "approximate",
      title: "Ownership mix will be normalized",
      detail: `The current cap-table inputs add to ${formatPercentPoint(totalOwnership)} rather than 100%, so the engine rescales them before running.`,
    });
  }

  if (Math.abs(founderSplitTotal - config.capTable.founderPercent) > 0.25) {
    issues.push({
      level: "approximate",
      title: "Founder split and founder pool disagree",
      detail: `Founder rows add to ${formatPercentPoint(founderSplitTotal)} while the cap table uses ${formatPercentPoint(config.capTable.founderPercent)}.`,
    });
  }

  if (config.currentRoundKind === "safe_post_money" && config.safe.enabled && config.safe.discountRate > 0) {
    issues.push({
      level: "standard",
      title: "SAFE preview uses cap versus discounted round price",
      detail: "The qualified-financing preview now converts the SAFE at the better of the post-money cap or discounted round price. Final shares still depend on the actual priced round.",
    });
  }

  if (config.currentRoundKind === "safe_post_money" && config.safe.enabled && config.safe.discountRate === 0) {
    issues.push({
      level: "standard",
      title: "SAFE preview uses cap versus priced round",
      detail: "The qualified-financing preview converts the SAFE at the better of the post-money cap or actual round price. Final shares still depend on the actual priced round.",
    });
  }

  if (config.currentRoundKind === "convertible_note_cap" && config.note.enabled) {
    issues.push({
      level: "standard",
      title: "Note preview uses cap versus discount",
      detail: "The qualified-financing preview converts the note at the better of cap or discount and keeps the note senior to equity in weak exits.",
    });
  }

  if (config.currentRoundKind === "safe_post_money" && Math.abs(financing.totalRoundRaise - financing.modeledInvestorCheck) > 1) {
    issues.push({
      level: "approximate",
      title: "SAFE cash raised exceeds the modeled SAFE check",
      detail: "The scenario includes extra cash beyond the modeled SAFE investment, but that additional SAFE stack is not modeled holder-by-holder.",
    });
  }

  if (
    config.currentRoundKind === "convertible_note_cap" &&
    Math.abs(financing.totalRoundRaise - financing.modeledInvestorCheck) > 1
  ) {
    issues.push({
      level: "approximate",
      title: "Note round exceeds the modeled note principal",
      detail: "The scenario includes more current-round cash than the modeled note principal, but that extra note syndicate is not modeled holder-by-holder.",
    });
  }

  if (config.currentRoundKind === "priced_preferred" && financing.syndicateCheck > 0) {
    issues.push({
      level: "standard",
      title: "Modeled investor is part of a priced syndicate",
      detail: `The modeled investor check is ${formatCurrencyCompact(financing.modeledInvestorCheck)} inside a ${formatCurrencyCompact(financing.totalRoundRaise)} priced round.`,
    });
  }

  if (config.sectorOverlay === "ai_premium") {
    issues.push({
      level: "approximate",
      title: "AI premium is modeled as an overlay",
      detail: "The AI uplift uses benchmark multipliers rather than a bespoke sector-specific financing path.",
    });
  }

  if (config.secondary.enabled) {
    issues.push({
      level: "approximate",
      title: "Secondary liquidity is simplified",
      detail: "Secondary sales are modeled as a simple fraction of founder and employee holdings tied to the round price, not a negotiated bespoke secondary process.",
    });
  }

  if (config.preferred.participationMode === "participating") {
    issues.push({
      level: "approximate",
      title: "Participating preferred is capped at standard mechanics",
      detail: "Participating preferred is now modeled series by series, but the app still does not cover caps, carve-outs, or custom charter language.",
    });
  }

  if (config.preferred.liquidationMultiple > 1) {
    issues.push({
      level: "approximate",
      title: "Liquidation multiple exceeds standard 1x",
      detail: `The app applies a ${config.preferred.liquidationMultiple.toFixed(1)}x multiple across the preferred stack, which is directionally useful but not a bespoke legal waterfall.`,
    });
  }

  if (config.preferred.antiDilutionMode !== "none") {
    issues.push({
      level: "approximate",
      title: "Anti-dilution is simplified",
      detail: "Anti-dilution now reprices each eligible preferred series independently, but the app still simplifies broad-based definitions, pay-to-play, and custom legal drafting.",
    });
  }

  const supportLevel: SupportLevel = issues.some((issue) => issue.level === "unsupported")
    ? "unsupported"
    : issues.some((issue) => issue.level === "approximate")
      ? "approximate"
      : "standard";

  const assumptions: ScenarioAssumption[] = [
    { label: "Current stage", value: config.currentStage.replace("_", " ") },
    { label: "Current round type", value: replaceAllText(config.currentRoundKind, "_", " ") },
    { label: "Current raise", value: formatCurrencyCompact(financing.totalRoundRaise) },
    { label: "Modeled investor at risk", value: formatCurrencyCompact(financing.modeledInvestorCheck) },
    { label: "Reference post-money", value: formatCurrencyCompact(financing.referencePostMoney) },
    { label: "Market overlay", value: config.marketOverlay },
    { label: "Sector overlay", value: config.sectorOverlay },
    { label: "Option pool target", value: formatPercentPoint(config.optionPoolTargetPercent * 100) },
    {
      label: "Preferred terms",
      value: `${config.preferred.liquidationMultiple.toFixed(1)}x ${config.preferred.participationMode.replace("_", " ")} / ${replaceAllText(config.preferred.antiDilutionMode, "_", " ")}`,
    },
    { label: "Cash on hand", value: formatCurrencyCompact(config.operating.cashOnHand) },
    { label: "Monthly burn", value: formatCurrencyCompact(config.operating.monthlyBurn) },
    { label: "Working capital", value: `${formatCurrencyCompact(config.operating.accountsReceivable + config.operating.inventory - config.operating.accountsPayable)}` },
    { label: "Transaction fees", value: formatCurrencyCompact(config.operating.transactionFees) },
    { label: "Monte Carlo paths", value: config.controls.iterations.toLocaleString("en-US") },
    { label: "Pareto alpha", value: (config.controls.paretoAlpha ?? 1.55).toFixed(2) },
  ];

  return {
    supportLevel,
    supportLabel:
      supportLevel === "standard" ? "Standard support" : supportLevel === "approximate" ? "Approximate support" : "Unsupported setup",
    summary:
      supportLevel === "standard"
        ? "The current setup stays within the app's standard venture math coverage."
        : supportLevel === "approximate"
          ? "The current setup is usable, but some assumptions are estimated or simplified."
          : "The current setup falls outside the app's supported math and should be corrected before relying on the output.",
    issues,
    assumptions,
  };
}
