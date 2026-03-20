import { FounderStakeInput, ScenarioConfig } from "@/lib/sim/types";

export function buildFounderDefaults(totalOwnershipPercent: number, count = 1): FounderStakeInput[] {
  const safeCount = Math.max(1, count);
  const evenSplit = totalOwnershipPercent / safeCount;

  return Array.from({ length: safeCount }, (_, index) => ({
    id: `founder_${index + 1}`,
    name: `Founder ${index + 1}`,
    ownershipPercent: evenSplit,
  }));
}

export function normalizeFounders(
  founders: FounderStakeInput[] | undefined,
  fallbackOwnershipPercent: number,
): FounderStakeInput[] {
  const source = founders?.length ? founders : buildFounderDefaults(fallbackOwnershipPercent, 1);

  return source.map((founder, index) => ({
    id: founder.id || `founder_${index + 1}`,
    name: founder.name?.trim() || `Founder ${index + 1}`,
    ownershipPercent: Number.isFinite(founder.ownershipPercent) ? founder.ownershipPercent : 0,
  }));
}

export function sumFounderOwnership(founders: FounderStakeInput[] | undefined, fallbackOwnershipPercent = 0) {
  if (!founders?.length) {
    return fallbackOwnershipPercent;
  }

  const normalized = normalizeFounders(founders, fallbackOwnershipPercent);
  return normalized.reduce((sum, founder) => sum + founder.ownershipPercent, 0);
}

export function withNormalizedFounders(config: ScenarioConfig): ScenarioConfig {
  const founders = normalizeFounders(config.founders, config.capTable.founderPercent);
  const founderPercent = sumFounderOwnership(founders, config.capTable.founderPercent);

  return {
    ...config,
    founders,
    capTable: {
      ...config.capTable,
      founderPercent,
    },
  };
}
