"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { runMonteCarlo } from "@/lib/sim/engine";
import { ScenarioConfig, SimulationSummary, WorkerResponse } from "@/lib/sim/types";

export function useSimulationRunner() {
  const workerRef = useRef<Worker | null>(null);
  const [summary, setSummary] = useState<SimulationSummary | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      workerRef.current = new Worker(new URL("../../workers/simulation.worker.ts", import.meta.url));
      workerRef.current.onmessage = (event: MessageEvent<WorkerResponse>) => {
        if (event.data.type === "done") {
          setSummary(event.data.summary);
          setLoading(false);
        }
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

    if (!workerRef.current) {
      setSummary(runMonteCarlo(config));
      setLoading(false);
      return;
    }

    workerRef.current.postMessage({
      type: "run",
      config,
    });
  }, []);

  return {
    summary,
    loading,
    run,
  };
}
