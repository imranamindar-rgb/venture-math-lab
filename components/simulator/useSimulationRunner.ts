"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { runMonteCarlo } from "@/lib/sim/engine";
import { ScenarioConfig, SimulationSummary, WorkerResponse } from "@/lib/sim/types";

export function useSimulationRunner() {
  const workerRef = useRef<Worker | null>(null);
  const [summary, setSummary] = useState<SimulationSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      workerRef.current = new Worker(new URL("../../workers/simulation.worker.ts", import.meta.url));
      workerRef.current.onmessage = (event: MessageEvent<WorkerResponse>) => {
        if (event.data.type === "done") {
          setSummary(event.data.summary);
          setLoading(false);
          setError(null);
        }
      };
      workerRef.current.onerror = () => {
        setLoading(false);
        setError("The Monte Carlo worker failed while preparing the report.");
      };
      workerRef.current.onmessageerror = () => {
        setLoading(false);
        setError("The Monte Carlo worker returned an unreadable payload.");
      };
    } catch {
      workerRef.current = null;
    }

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const run = useCallback((config: ScenarioConfig) => {
    setLoading(true);
    setError(null);

    if (!workerRef.current) {
      try {
        setSummary(runMonteCarlo(config));
        setLoading(false);
      } catch {
        setLoading(false);
        setError("The simulation engine failed for this scenario in the current browser.");
      }
      return;
    }

    try {
      workerRef.current.postMessage({
        type: "run",
        config,
      });
    } catch {
      setLoading(false);
      setError("The browser could not send this scenario to the simulation worker.");
    }
  }, []);

  return {
    summary,
    loading,
    run,
    error,
  };
}
