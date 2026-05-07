import { z } from "zod";
import { assertAccessAllowed } from "../safety/accessControl.js";
import { ValidationError } from "../utils/errors.js";
import { parseIsoDateTime } from "../utils/time.js";
import type { OpcUaAdapter } from "../datasources/opcua/OpcUaAdapter.js";
import type { ToolContext, ToolRegister } from "./registerTools.js";
import { withToolAudit } from "./toolUtils.js";

const MAX_MONITOR_WINDOW_MS = 5 * 60 * 1000;

function requireOpcUaAdapter(context: ToolContext): OpcUaAdapter {
  if (context.dataSource.kind !== "OPCUA") {
    throw new ValidationError(
      "This tool requires DELTAV_DATA_SOURCE=OPCUA.",
      { dataSource: context.config.dataSource },
    );
  }

  return context.dataSource as OpcUaAdapter;
}

function buildToolRunner<TInput extends Record<string, unknown>, TResult>(
  context: ToolContext,
  toolName: string,
  handler: (input: TInput, adapter: OpcUaAdapter) => Promise<TResult>,
) {
  return async (input: TInput, meta?: { readonly sessionId?: string }) =>
    withToolAudit(
      {
        toolName,
        input,
        config: context.config,
        auditLogger: context.auditLogger,
        ...(meta?.sessionId ? { sessionId: meta.sessionId } : {}),
      },
      async () => handler(input, requireOpcUaAdapter(context)),
    );
}

export function registerOpcUaTools(register: ToolRegister, context: ToolContext): void {
  register(
    "opcua_discover_endpoints",
    "Discover OPC UA endpoints and security modes for the configured server.",
    z.object({}),
    buildToolRunner(context, "opcua_discover_endpoints", async (_input, adapter) => ({
      endpointUrl: adapter.getClient().getEndpointUrl(),
      endpoints: await adapter.getClient().discoverEndpoints(),
    })),
  );

  register(
    "opcua_test_connection",
    "Test OPC UA connectivity and session creation using the configured security and authentication settings.",
    z.object({}),
    buildToolRunner(context, "opcua_test_connection", async (_input, adapter) =>
      adapter.getClient().testConnection(),
    ),
  );

  register(
    "opcua_get_namespace_array",
    "Read the OPC UA namespace array.",
    z.object({}),
    buildToolRunner(context, "opcua_get_namespace_array", async (_input, adapter) => ({
      namespaces: await adapter.getClient().getNamespaceArray(),
    })),
  );

  register(
    "opcua_get_server_status",
    "Read the OPC UA server status node and summarize the connected server.",
    z.object({}),
    buildToolRunner(context, "opcua_get_server_status", async (_input, adapter) =>
      adapter.getClient().getServerStatus(),
    ),
  );

  register(
    "opcua_browse_node",
    "Browse forward references from an OPC UA node.",
    z.object({
      nodeId: z.string().min(1),
      logicalId: z.string().min(1).optional(),
      area: z.string().min(1).optional(),
      entityPath: z.string().min(1).optional(),
    }),
    buildToolRunner(context, "opcua_browse_node", async (input, adapter) => {
      const identifier = input.logicalId ?? input.nodeId;
      assertAccessAllowed(context.config, {
        entityId: identifier,
        area: input.area,
        entityPath: input.entityPath,
      });
      return adapter.getClient().browseNode(identifier);
    }),
  );

  register(
    "opcua_read_node",
    "Read the Value attribute for a single OPC UA node.",
    z.object({
      nodeId: z.string().min(1),
      logicalId: z.string().min(1).optional(),
      area: z.string().min(1).optional(),
      entityPath: z.string().min(1).optional(),
    }),
    buildToolRunner(context, "opcua_read_node", async (input, adapter) => {
      const identifier = input.logicalId ?? input.nodeId;
      assertAccessAllowed(context.config, {
        entityId: identifier,
        area: input.area,
        entityPath: input.entityPath,
      });
      return adapter.getClient().readMappedValue(identifier);
    }),
  );

  register(
    "opcua_read_nodes",
    "Read the Value attribute for multiple OPC UA nodes in one request.",
    z.object({
      nodeIds: z.array(z.string().min(1)).min(1).max(500),
      area: z.string().min(1).optional(),
    }),
    buildToolRunner(context, "opcua_read_nodes", async (input, adapter) => {
      const reads = await Promise.all(
        input.nodeIds.map(async (nodeId) => {
          assertAccessAllowed(context.config, {
            entityId: nodeId,
            area: input.area,
            entityPath: nodeId,
          });
          return nodeId;
        }),
      );
      return {
        reads: await adapter.getClient().readMappedValues(reads),
      };
    }),
  );

  register(
    "opcua_translate_path",
    "Translate an OPC UA browse path into target node IDs.",
    z.object({
      browsePath: z.string().min(1),
      startingNodeId: z.string().min(1).default("RootFolder"),
    }),
    buildToolRunner(context, "opcua_translate_path", async (input, adapter) =>
      adapter.getClient().translatePath(input.startingNodeId, input.browsePath),
    ),
  );

  register(
    "opcua_sample_nodes_for_window",
    "Collect bounded point-in-time OPC UA samples for one or more nodes over a window.",
    z.object({
      nodeIds: z.array(z.string().min(1)).min(1).max(500),
      startTime: z.string().min(1),
      endTime: z.string().min(1),
      maxPoints: z.number().int().min(2).max(500).default(25),
      area: z.string().min(1).optional(),
    }),
    buildToolRunner(context, "opcua_sample_nodes_for_window", async (input, adapter) => {
      const start = parseIsoDateTime(input.startTime, "startTime");
      const end = parseIsoDateTime(input.endTime, "endTime");
      input.nodeIds.forEach((nodeId) =>
        assertAccessAllowed(context.config, {
          entityId: nodeId,
          area: input.area,
          entityPath: nodeId,
        }),
      );
      return {
        mode: "sampled-window",
        samples: await adapter.getClient().sampleNodesForWindow(input.nodeIds, start, end, input.maxPoints),
      };
    }),
  );

  register(
    "opcua_monitor_nodes_for_window",
    "Capture a finite set of subscription notifications for one or more OPC UA nodes.",
    z.object({
      nodeIds: z.array(z.string().min(1)).min(1).max(500),
      durationMs: z.number().int().min(250).max(MAX_MONITOR_WINDOW_MS).default(3000),
      samplingIntervalMs: z.number().int().min(100).max(60_000).default(500),
      area: z.string().min(1).optional(),
    }),
    buildToolRunner(context, "opcua_monitor_nodes_for_window", async (input, adapter) => {
      input.nodeIds.forEach((nodeId) =>
        assertAccessAllowed(context.config, {
          entityId: nodeId,
          area: input.area,
          entityPath: nodeId,
        }),
      );
      return {
        mode: "subscription-window",
        events: await adapter.getClient().monitorNodesForWindow(
          input.nodeIds,
          input.durationMs,
          input.samplingIntervalMs,
        ),
      };
    }),
  );
}
