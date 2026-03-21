"use client";

import { create } from "zustand";
import { createJSONStorage, persist, StateStorage } from "zustand/middleware";

import { getScenarioPreset, scenarioPresets } from "@/data/presets";
import { cloneValue } from "@/lib/compat";
import { withNormalizedFounders } from "@/lib/founders";
import { scenarioConfigSchema, scenarioFileSchema, ScenarioConfig, ScenarioFileV1 } from "@/lib/sim/types";

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

const memoryFallback = new Map<string, string>();

const safeStorage: StateStorage = {
  getItem: (name) => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        return window.localStorage.getItem(name);
      }
    } catch {
      return memoryFallback.get(name) ?? null;
    }

    return memoryFallback.get(name) ?? null;
  },
  setItem: (name, value) => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(name, value);
        return;
      }
    } catch {
      memoryFallback.set(name, value);
      return;
    }

    memoryFallback.set(name, value);
  },
  removeItem: (name) => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.removeItem(name);
      }
    } catch {
      memoryFallback.delete(name);
      return;
    }

    memoryFallback.delete(name);
  },
};

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

function mergeScenarioConfig(base: ScenarioConfig, candidate: unknown): ScenarioConfig {
  if (!candidate || typeof candidate !== "object") {
    return withControls(base);
  }

  const raw = candidate as Partial<ScenarioConfig>;
  const merged: ScenarioConfig = {
    ...base,
    ...raw,
    capTable: {
      ...base.capTable,
      ...(raw.capTable ?? {}),
    },
    founders: raw.founders ?? base.founders,
    safe: {
      ...base.safe,
      ...(raw.safe ?? {}),
    },
    note: {
      ...base.note,
      ...(raw.note ?? {}),
    },
    investor: {
      ...base.investor,
      ...(raw.investor ?? {}),
    },
    employee: {
      ...base.employee,
      ...(raw.employee ?? {}),
    },
    preferred: {
      ...base.preferred,
      ...(raw.preferred ?? {}),
    },
    operating: {
      ...base.operating,
      ...(raw.operating ?? {}),
    },
    secondary: {
      ...base.secondary,
      ...(raw.secondary ?? {}),
    },
    controls: {
      ...base.controls,
      ...(raw.controls ?? {}),
    },
    warningFlags: Array.isArray(raw.warningFlags) ? raw.warningFlags : base.warningFlags,
  };

  const parsed = scenarioConfigSchema.safeParse(merged);
  return withControls(parsed.success ? parsed.data : base);
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
            config: cloneValue(scenario),
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

          const updated = withControls(cloneValue(saved.config));
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
      version: 2,
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
      merge: (persistedState, currentState) => {
        const typed = persistedState as Partial<ScenarioStore> | undefined;
        const savedEntries = Array.isArray(typed?.saved) ? typed.saved : currentState.saved;

        return {
          ...currentState,
          ...typed,
          active: mergeScenarioConfig(currentState.active, typed?.active),
          comparison: mergeScenarioConfig(currentState.comparison, typed?.comparison),
          saved: savedEntries
            .filter((entry): entry is SavedScenario => Boolean(entry && entry.config))
            .map((entry) => ({
              ...entry,
              config: mergeScenarioConfig(currentState.active, entry.config),
            })),
          lastModifiedAt: typed?.lastModifiedAt ?? currentState.lastModifiedAt,
          hasHydrated: currentState.hasHydrated,
        };
      },
      storage: createJSONStorage(() => safeStorage),
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
