import type { ClientSession, NodeIdLike } from "node-opcua";
import { readNodeValues } from "./read.js";
import type { OpcUaWindowSample } from "./types.js";

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function sampleNodesForWindow(
  session: ClientSession,
  nodeIds: readonly NodeIdLike[],
  durationMs: number,
  intervalMs: number,
): Promise<readonly OpcUaWindowSample[]> {
  const startedAt = Date.now();
  const samples: OpcUaWindowSample[] = [];

  while (Date.now() - startedAt <= durationMs) {
    const reads = await readNodeValues(session, nodeIds);
    samples.push({
      timestamp: new Date().toISOString(),
      reads,
    });

    const elapsed = Date.now() - startedAt;
    if (elapsed >= durationMs) {
      break;
    }
    await wait(intervalMs);
  }

  return samples;
}
