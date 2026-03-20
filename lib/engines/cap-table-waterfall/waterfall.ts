import { CapTableSnapshot, WaterfallPayouts } from "@/lib/sim/types";
import { getParticipatingCommonShares } from "@/lib/engines/cap-table-waterfall/cap-table";

export function computeWaterfall(
  snapshot: CapTableSnapshot,
  exitValue: number,
  employeeExerciseCost: number,
): WaterfallPayouts {
  let remaining = exitValue;
  const notePayout = Math.min(remaining, snapshot.noteOutstanding);
  remaining -= notePayout;

  const totalPreferredShares = snapshot.priorInvestorPreferred + snapshot.modeledInvestorPreferred;
  const totalPreferredPreference =
    snapshot.priorInvestorLiquidationPref + snapshot.modeledInvestorLiquidationPref;
  const participatingCommonShares = getParticipatingCommonShares(snapshot);
  const commonPoolIfConverted =
    participatingCommonShares > 0 ? remaining / participatingCommonShares : 0;
  const preferredAsConvertedValue = totalPreferredShares * commonPoolIfConverted;
  const preferredConverted = preferredAsConvertedValue > totalPreferredPreference;

  let preferredPayout = 0;
  let commonPayout = 0;

  if (preferredConverted) {
    commonPayout = remaining;
  } else {
    preferredPayout = Math.min(remaining, totalPreferredPreference);
    remaining -= preferredPayout;
    commonPayout = remaining;
  }

  const commonShares = snapshot.founderCommon + snapshot.employeeCommon + snapshot.secondaryCommon;
  const commonPerShare = preferredConverted
    ? commonPoolIfConverted
    : commonShares > 0
      ? commonPayout / commonShares
      : 0;

  const preferredPerShare = preferredConverted
    ? commonPoolIfConverted
    : totalPreferredShares > 0
      ? preferredPayout / totalPreferredShares
      : 0;

  const founderPayout = snapshot.founderCommon * commonPerShare;
  const employeeGrossPayout = snapshot.employeeCommon * commonPerShare;
  const priorInvestorPayout = snapshot.priorInvestorPreferred * preferredPerShare;
  const investorPayout = snapshot.modeledInvestorPreferred * preferredPerShare;
  const secondaryCommonPayout = snapshot.secondaryCommon * commonPerShare;

  return {
    notePayout,
    preferredPayout,
    commonPayout,
    founderPayout,
    employeeGrossPayout: Math.max(0, employeeGrossPayout - employeeExerciseCost),
    investorPayout,
    priorInvestorPayout,
    secondaryCommonPayout,
    preferredConverted,
  };
}
