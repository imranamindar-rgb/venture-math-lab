"use client";

import { useEffect, useMemo, useRef, useState, startTransition } from "react";

import { presetOptions, useScenarioStore } from "@/lib/state/scenario-store";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ScenarioEditor } from "@/components/simulator/ScenarioEditor";
import { ResultsDashboard } from "@/components/simulator/ResultsDashboard";
import { useSimulationRunner } from "@/components/simulator/useSimulationRunner";
import { formatCurrency } from "@/lib/format";

export function SimulationWorkspace() {
  const {
    active,
    saved,
    setActivePreset,
    updateActive,
    updateNested,
    saveScenario,
    exportScenarioFile,
    importScenarioFile,
  } = useScenarioStore();
  const { summary, loading, run } = useSimulationRunner();
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const lastAutoRunId = useRef<string | null>(null);

  useEffect(() => {
    const shouldRun = lastAutoRunId.current !== active.id || summary === null;
    if (!shouldRun) {
      return;
    }

    lastAutoRunId.current = active.id;
    run(active);
  }, [active, run, summary]);

  const totalOwnership =
    active.capTable.founderPercent +
    active.capTable.employeeCommonPercent +
    active.capTable.employeePoolPercent +
    active.capTable.priorInvestorPercent;

  const importHint = useMemo(() => {
    if (!summary) {
      return "Run a scenario to see founder, employee, and investor distributions.";
    }

    return `Current median founder proceeds ${formatCurrency(summary.founder.median)}.`;
  }, [summary]);

  const triggerRun = () => {
    startTransition(() => {
      run(active);
    });
  };

  const handleExport = () => {
    const payload = exportScenarioFile("active");
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${active.id}-scenario.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      const payload = JSON.parse(text);
      const result = importScenarioFile(payload, "active");
      setImportStatus(result.ok ? "Scenario imported." : result.error);
    } catch {
      setImportStatus("Import failed. Make sure the file is valid JSON.");
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid gap-6 xl:grid-cols-[0.95fr,1.35fr]">
        <div className="space-y-6">
          <Card className="overflow-hidden">
            <div className="border-b border-border/70 pb-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Scenario builder</p>
                  <h1 className="mt-2 font-heading text-3xl font-semibold">Monte Carlo Simulator</h1>
                </div>
                <select
                  value={active.id}
                  onChange={(event) => setActivePreset(event.target.value)}
                  className="rounded-full border border-border bg-white px-4 py-2 text-sm"
                >
                  {presetOptions.map((preset) => (
                    <option key={preset.id} value={preset.id}>
                      {preset.name}
                    </option>
                  ))}
                </select>
              </div>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">{active.description}</p>
            </div>

            <div className="space-y-5 pt-5">
              <div className="rounded-panel border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                <p className="font-semibold">Guidance for every input</p>
                <p className="mt-2 leading-6">
                  Each control now includes plain-English guidance so you can change assumptions on phone, tablet, or
                  desktop without needing the methodology page open beside it.
                </p>
              </div>

              <ScenarioEditor
                config={active}
                onChange={updateActive}
                onNestedChange={(key, patch) => updateNested("active", key, patch)}
              />
            </div>
          </Card>

          <Card>
            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={triggerRun} disabled={loading}>
                {loading ? "Running simulation..." : "Run simulation"}
              </Button>
              <Button variant="secondary" onClick={() => saveScenario("active")}>
                Save snapshot
              </Button>
              <Button variant="secondary" onClick={handleExport}>
                Export JSON
              </Button>
              <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
                Import JSON
              </Button>
              <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={handleImport} />
            </div>
            <p className="mt-3 text-sm text-slate-500">
              Ownership input total: <span className="font-semibold text-slate-900">{totalOwnership.toFixed(1)}%</span>. The
              simulator normalizes the mix if it is not exactly 100%.
            </p>
            <p className="mt-2 text-sm text-slate-500">{importStatus ?? importHint}</p>
            {saved.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {saved.slice(0, 4).map((snapshot) => (
                  <button
                    key={snapshot.id}
                    type="button"
                    onClick={() => updateActive(snapshot.config)}
                    className="rounded-full border border-border px-3 py-1.5 text-xs text-slate-600 hover:border-primary/40 hover:text-slate-950"
                  >
                    {snapshot.name}
                  </button>
                ))}
              </div>
            ) : null}
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Results surface</p>
                <h2 className="mt-2 font-heading text-2xl font-semibold">Founder, employee, and investor views</h2>
              </div>
              <div className="rounded-full border border-border bg-slate-50 px-4 py-2 text-sm text-slate-600">
                {loading ? "Crunching 10,000 paths" : "Last run ready"}
              </div>
            </div>
          </Card>
          {summary ? (
            <ResultsDashboard summary={summary} />
          ) : (
            <Card className="min-h-[480px]">
              <div className="flex h-full min-h-[420px] items-center justify-center">
                <p className="max-w-md text-center text-sm leading-7 text-slate-500">
                  Run the simulation to see how dilution, down rounds, SAFE or note conversion, preferences, and partial
                  secondary liquidity change outcomes across stakeholders.
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
