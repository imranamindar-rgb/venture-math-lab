import { runMonteCarlo } from "@/lib/sim/engine";
import { WorkerRequest, WorkerResponse } from "@/lib/sim/types";

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  if (event.data.type !== "run") {
    return;
  }

  const summary = runMonteCarlo(event.data.config);
  const payload: WorkerResponse = {
    type: "done",
    summary,
  };

  self.postMessage(payload);
};
