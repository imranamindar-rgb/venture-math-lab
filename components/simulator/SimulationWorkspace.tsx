"use client";

import { useEffect, startTransition, useRef } from "react";

import { useScenarioStore } from "@/lib/state/scenario-store";
import { EditScenarioButton } from "@/components/ui/Button";
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
      <div className="space-y-6">
        <Card>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Results surface</p>
              <h2 className="mt-2 font-heading text-2xl font-semibold">Run the scenario, then decide if the downside is acceptable</h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                The simulation page should answer the decision question first: what happens to founders, employees, and investors across the plausible range? The full input surface stays behind the results.
              </p>
              <EditScenarioButton className="mt-4" />
            </div>
            <div className="rounded-full border border-border bg-slate-50 px-4 py-2 text-sm text-slate-600">
              {loading ? "Crunching 10,000 paths" : "Last run ready"}
            </div>
          </div>
        </Card>
        {summary ? (
          <ResultsDashboard summary={summary} />
        ) : (
          <Card className="min-h-[360px]">
            <div className="flex h-full min-h-[300px] items-center justify-center">
              <p className="max-w-md text-center text-sm leading-7 text-slate-500">
                Run the simulation to see how dilution, down rounds, SAFE or note conversion, preferences, and partial
                secondary liquidity change outcomes across stakeholders.
              </p>
            </div>
          </Card>
        )}

        <ActiveScenarioPanel
          defaultCollapsed
          modeLabel="Monte Carlo simulation engine"
          title="Monte Carlo Simulator"
          guidanceTitle="Start with the output, then tune the assumptions"
          guidanceBody="The simulation result should be the first thing you react to. Open the scenario controls when you need to stress the assumptions or compare another financing story."
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
      </div>
    </div>
  );
}
