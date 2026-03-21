"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import { getScenarioPreset, scenarioPresets } from "@/data/presets";
import { withNormalizedFounders } from "@/lib/founders";
import { scenarioFileSchema, ScenarioConfig, ScenarioFileV1 } from "@/lib/sim/types";

export interface SavedScenario {
  id: string;
  name: string;
  createdAt: string;
  config: ScenarioConfig;
}

interface ScenarioStore {
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  lastModifiedAt: string;
  active: ScenarioConfig;
  comparison: ScenarioConfig;
  saved: SavedScenario[];
  setActivePreset: (id: string) => void;
  setComparisonPreset: (id: string) => void;
  updateActive: (patch: Partial<ScenarioConfig>) => void;
  updateComparison: (patch: Partial<ScenarioConfig>) => void;
  updateNested: <K extends keyof ScenarioConfig>(target: "active" | "comparison", key: K, patch: Partial<ScenarioConfig[K]>) => void;
  saveScenario: (target: "active" | "comparison", name?: string) => void;
  loadSaved: (savedId: string, target: "active" | "comparison") => void;
  renameSaved: (savedId: string, name: string) => void;
  deleteSaved: (savedId: string) => void;
  exportScenarioFile: (target: "active" | "comparison") => ScenarioFileV1;
  importScenarioFile: (raw: unknown, target: "active" | "comparison") => { ok: true } | { ok: false; error: string };
}

const defaultActive = getScenarioPreset("nvca_standard");
const defaultComparison = getScenarioPreset("stress_case");

function withControls(config: ScenarioConfig): ScenarioConfig {
  return withNormalizedFounders({
    ...config,
    safe: {
      ...config.safe,
      discountRate: config.safe.discountRate ?? 0,
    },
    preferred: config.preferred ?? {
      participationMode: "non_participating",
      liquidationMultiple: 1,
      antiDilutionMode: "none",
    },
    operating: config.operating ?? {
      cashOnHand: 6_000_000,
      monthlyBurn: 300_000,
      monthlyRevenue: 120_000,
      monthlyRevenueGrowth: 0.08,
      grossMargin: 0.78,
      targetCashBufferMonths: 6,
      accountsReceivable: 120_000,
      inventory: 0,
      accountsPayable: 90_000,
      capexMonthly: 15_000,
      transactionFees: 150_000,
    },
    controls: {
      iterations: config.controls?.iterations ?? 10_000,
      seed: config.controls?.seed ?? 42,
      paretoAlpha: config.controls?.paretoAlpha ?? 1.55,
    },
  });
}

function markModified() {
  return new Date().toISOString();
}

export const useScenarioStore = create<ScenarioStore>()(
  persist(
    (set, get) => ({
      active: withControls(defaultActive),
      comparison: withControls(defaultComparison),
      hasHydrated: false,
      lastModifiedAt: markModified(),
      setHasHydrated: (value) => set({ hasHydrated: value }),
      saved: [],
      setActivePreset: (id) => set({ active: withControls(getScenarioPreset(id)), lastModifiedAt: markModified() }),
      setComparisonPreset: (id) =>
        set({ comparison: withControls(getScenarioPreset(id)), lastModifiedAt: markModified() }),
      updateActive: (patch) =>
        set((state) => ({
          active: withControls({
            ...state.active,
            ...patch,
          }),
          lastModifiedAt: markModified(),
        })),
      updateComparison: (patch) =>
        set((state) => ({
          comparison: withControls({
            ...state.comparison,
            ...patch,
          }),
          lastModifiedAt: markModified(),
        })),
      updateNested: (target, key, patch) =>
        set((state) => {
          const next = {
            ...state[target],
            [key]: {
              ...(state[target][key] as object),
              ...(patch as object),
            },
          } as ScenarioConfig;
          const updated = withControls(next);
          return target === "active"
            ? { active: updated, lastModifiedAt: markModified() }
            : { comparison: updated, lastModifiedAt: markModified() };
        }),
      saveScenario: (target, name) =>
        set((state) => {
          const scenario = state[target];
          const entry: SavedScenario = {
            id: `${target}_${Date.now()}`,
            name: name?.trim() || `${scenario.name} snapshot`,
            createdAt: new Date().toISOString(),
            config: structuredClone(scenario),
          };
          return {
            saved: [entry, ...state.saved].slice(0, 12),
          };
        }),
      loadSaved: (savedId, target) =>
        set((state) => {
          const saved = state.saved.find((entry) => entry.id === savedId);
          if (!saved) {
            return state;
          }

          const updated = withControls(structuredClone(saved.config));
          return target === "active"
            ? { active: updated, lastModifiedAt: markModified() }
            : { comparison: updated, lastModifiedAt: markModified() };
        }),
      renameSaved: (savedId, name) =>
        set((state) => ({
          saved: state.saved.map((entry) => (entry.id === savedId ? { ...entry, name: name.trim() || entry.name } : entry)),
        })),
      deleteSaved: (savedId) =>
        set((state) => ({
          saved: state.saved.filter((entry) => entry.id !== savedId),
        })),
      exportScenarioFile: (target) => ({
        schemaVersion: 1,
        createdAt: new Date().toISOString(),
        notes: "Exported from Venture Math Lab v1",
        config: get()[target],
      }),
      importScenarioFile: (raw, target) => {
        const parsed = scenarioFileSchema.safeParse(raw);
        if (!parsed.success) {
          return { ok: false as const, error: "The scenario file does not match the Venture Math Lab v1 schema." };
        }

        const updated = withControls(parsed.data.config);
        set(
          target === "active"
            ? { active: updated, lastModifiedAt: markModified() }
            : { comparison: updated, lastModifiedAt: markModified() },
        );
        return { ok: true as const };
      },
    }),
    {
      name: "venture-math-lab-store",
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
      partialize: (state) => ({
        active: state.active,
        comparison: state.comparison,
        saved: state.saved,
        lastModifiedAt: state.lastModifiedAt,
      }),
    },
  ),
);

export const presetOptions = scenarioPresets.map((preset) => ({
  id: preset.id,
  name: preset.name,
}));
