"use client";

import { useEffect, startTransition, useRef } from "react";

import { useScenarioStore } from "@/lib/state/scenario-store";
import { Card } from "@/components/ui/Card";
import { ResultsDashboard } from "@/components/simulator/ResultsDashboard";
import { useSimulationRunner } from "@/components/simulator/useSimulationRunner";
import { ActiveScenarioPanel } from "@/components/workspace/ActiveScenarioPanel";

export function SimulationWorkspace() {
  const active = useScenarioStore((state) => state.active);
  const { summary, loading, run } = useSimulationRunner();
  const lastAutoRunId = useRef<string | null>(null);

  useEffect(() => {
    const shouldRun = lastAutoRunId.current !== active.id || summary === null;
    if (!shouldRun) {
      return;
    }

    lastAutoRunId.current = active.id;
    run(active);
  }, [active, run, summary]);

  const triggerRun = () => {
    startTransition(() => {
      run(active);
    });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid gap-6 2xl:grid-cols-[0.95fr,1.35fr]">
        <ActiveScenarioPanel
          modeLabel="Monte Carlo simulation engine"
          title="Monte Carlo Simulator"
          guidanceTitle="Guidance for every input"
          guidanceBody="Each control includes plain-English guidance so you can tune assumptions on phone, tablet, or desktop without needing the methodology page open beside it."
          hintWhenReady={
            summary
              ? `Current median founder proceeds ${new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "USD",
                  maximumFractionDigits: summary.founder.median >= 100 ? 0 : 2,
                }).format(summary.founder.median)}.`
              : "Run a scenario to see founder, employee, and investor distributions."
          }
          primaryAction={{
            label: "Run simulation",
            busyLabel: "Running simulation...",
            loading,
            onClick: triggerRun,
          }}
        />

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
