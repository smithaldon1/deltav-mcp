import { useDeferredValue, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import ReactFlow, { Background, Controls, MiniMap, type Edge, type Node } from "reactflow";
import mermaid from "mermaid";
import * as echarts from "echarts";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from "@tanstack/react-table";

type NavKey =
  | "overview"
  | "deltaV"
  | "trends"
  | "events"
  | "opcua"
  | "runner"
  | "scenarios"
  | "setup";

type OpcUaWorkspace =
  | "discovery"
  | "browse"
  | "reads"
  | "translate"
  | "sample"
  | "monitor";

type McpTarget = "rest" | "opcua";

type MockStatus = {
  status: string;
  baseUrl: string;
  apiBasePath: string;
  authEnabled: boolean;
  mockMode: string;
  systems: Array<{ name: string; summary: string }>;
  topLevelEntities: Array<{ id: string; name: string }>;
  healthEndpoint: string;
  endpoints: string[];
  uiEnabled: boolean;
  mcpProxyPath: string;
  mcpToolsListPath: string;
  mcpToolCallPath: string;
  mcpRestToolsListPath: string;
  mcpRestToolCallPath: string;
  mcpOpcUaToolsListPath: string;
  mcpOpcUaToolCallPath: string;
  mockOpcUaEndpoint: string;
  workspaces: string[];
};

type Scenario = {
  name: string;
  description: string;
  relatedModules: string[];
  relatedEventIds: string[];
  relatedHistory: string[];
  expectedInvestigationOutputs: string[];
};

type GraphNode = {
  id: string;
  name: string;
  type: string;
  area?: string | null;
  path: string;
  runtime?: Record<string, unknown>;
  relationships?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
};

type HierarchyTreeNode = GraphNode & {
  treeChildren: HierarchyTreeNode[];
};

type HistoryResponse = {
  entityId: string;
  start: string;
  end: string;
  values: Array<{ timestamp: string; value: number | null; quality?: string }>;
  aggregateValue?: number | null;
};

type AlarmRecord = {
  id: string;
  timestamp: string;
  module?: string;
  area?: string;
  level?: string;
  eventType?: string;
  message: string;
  state?: string;
  priority?: string;
  source?: string;
  entityId?: string;
  acknowledged?: boolean;
  active?: boolean;
  returnToNormalTime?: string;
};

type BatchRecord = {
  batchId: string;
  recipe: string;
  procedure: string;
  unitProcedure: string;
  operation: string;
  phase: string;
  step: string;
  transition: string;
  timestamp: string;
  eventType: string;
  message: string;
  unit: string;
  status: string;
};

type ConnectionHelper = {
  envExample: string;
  dockerComposeExample: string;
  mcpClientConfig: Record<string, unknown>;
};

type McpTool = {
  name: string;
  description: string;
  target: McpTarget;
  inputSchema?: {
    properties?: Record<string, unknown>;
    required?: string[];
  };
};

type McpToolCallResponse = {
  name: string;
  target?: McpTarget;
  isError: boolean;
  result: unknown;
  raw: unknown;
};

type OpcUaPreset = {
  label: string;
  logicalId: string;
  nodeId: string;
  area: string;
  browseNodeId: string;
  browsePath: string;
  description: string;
};

type OpcUaPresetResponse = {
  endpoint: string;
  presets: OpcUaPreset[];
  monitoredSampleSuggestion: {
    durationMs: number;
    samplingIntervalMs: number;
  };
};

type McpAuthStatus = {
  authenticated: boolean;
  baseUrl: string;
  verifyTls: boolean;
  tokenCached: boolean;
  useMock: boolean;
  dataSource?: string;
  mode?: string;
  message?: string;
};

type MockHeaders = {
  errorCode: string;
  delayMs: string;
  malformed: boolean;
  empty: boolean;
};

const navItems: Array<{ key: NavKey; label: string; detail: string }> = [
  { key: "overview", label: "Overview", detail: "Console status and quick starts" },
  { key: "deltaV", label: "DeltaV Graph", detail: "Hierarchy, runtime, and context" },
  { key: "trends", label: "Trends", detail: "History and trend packs" },
  { key: "events", label: "Events", detail: "Alarms, events, and batches" },
  { key: "opcua", label: "OPC UA", detail: "Browse, reads, sampling, and monitoring" },
  { key: "runner", label: "Tool Runner", detail: "Direct MCP tool execution" },
  { key: "scenarios", label: "Scenarios", detail: "Failure investigations and evidence" },
  { key: "setup", label: "Setup", detail: "Connection help and diagrams" },
];

const opcuaTabs: Array<{ key: OpcUaWorkspace; label: string }> = [
  { key: "discovery", label: "Discovery" },
  { key: "browse", label: "Browse" },
  { key: "reads", label: "Reads" },
  { key: "translate", label: "Translate" },
  { key: "sample", label: "Sample" },
  { key: "monitor", label: "Monitor" },
];

const defaultDiagram = `flowchart TD
  Console["Engineering Console"]
  Console --> Rest["DeltaV REST panels"]
  Console --> Proxy["Same-origin MCP proxy"]
  Proxy --> ToolRunner["MCP tools/list + tools/call"]
  Console --> OpcUa["OPC UA workbench"]
  OpcUa --> Browse["Browse / Read / Sample / Monitor"]
`;

const alarmColumn = createColumnHelper<AlarmRecord>();
const batchColumn = createColumnHelper<BatchRecord>();
const readColumn = createColumnHelper<{ nodeId: string; value: string; statusCode: string; timestamp: string }>();

function safeJsonParse<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function buildHierarchyTree(graph: GraphNode[]): HierarchyTreeNode[] {
  const nodes = new Map<string, HierarchyTreeNode>();
  const roots: HierarchyTreeNode[] = [];

  graph.forEach((node) => {
    nodes.set(node.id, { ...node, treeChildren: [] });
  });

  nodes.forEach((node) => {
    const parentIds = ((node.relationships?.Parents as string[] | undefined) ?? []).filter((id) =>
      nodes.has(id),
    );

    if (parentIds.length === 0) {
      roots.push(node);
      return;
    }

    parentIds.forEach((parentId) => {
      nodes.get(parentId)?.treeChildren.push(node);
    });
  });

  const sortTree = (items: HierarchyTreeNode[]) => {
    items.sort((left, right) => left.path.localeCompare(right.path));
    items.forEach((item) => sortTree(item.treeChildren));
  };

  sortTree(roots);
  return roots;
}

function filterHierarchyTree(nodes: HierarchyTreeNode[], search: string, includeParameters: boolean): HierarchyTreeNode[] {
  return nodes.flatMap((node) => {
    const children = filterHierarchyTree(node.treeChildren, search, includeParameters);
    const matchesSearch =
      search.length === 0 ||
      node.name.toLowerCase().includes(search) ||
      node.id.toLowerCase().includes(search) ||
      node.path.toLowerCase().includes(search);
    const matchesType = includeParameters || node.type !== "Parameter";

    if ((matchesSearch && matchesType) || children.length > 0) {
      return [{ ...node, treeChildren: children }];
    }

    return [];
  });
}

function formatRuntimeValue(value: unknown): string {
  if (typeof value === "number") return value.toFixed(2);
  if (typeof value === "string") return value;
  if (typeof value === "boolean") return value ? "true" : "false";
  if (value === null || value === undefined) return "—";
  return JSON.stringify(value);
}

function getNodeFlags(node: GraphNode): string[] {
  const flags: string[] = [];
  const runtime = node.runtime ?? {};

  if (typeof runtime.QUALITY === "string" && runtime.QUALITY !== "GOOD") {
    flags.push(String(runtime.QUALITY));
  }
  if (typeof runtime.ALM_STATE === "string" && runtime.ALM_STATE !== "NORMAL") {
    flags.push(String(runtime.ALM_STATE));
  }
  if (typeof runtime.MODE === "string" && ["MANUAL", "CAS", "HELD"].includes(String(runtime.MODE))) {
    flags.push(String(runtime.MODE));
  }

  return flags;
}

function useChart(option: echarts.EChartsOption | null) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ref.current || option === null) return;
    const chart = echarts.init(ref.current);
    chart.setOption(option);
    const handleResize = () => chart.resize();
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      chart.dispose();
    };
  }, [option]);

  return ref;
}

function Panel({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="panel">
      <div className="panel__header">
        <div>
          <h2>{title}</h2>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
        {actions ? <div className="panel__actions">{actions}</div> : null}
      </div>
      <div className="panel__body">{children}</div>
    </section>
  );
}

function MetricCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string | number;
  tone?: "default" | "good" | "alert";
}) {
  return (
    <article className={`metric-card metric-card--${tone}`}>
      <span className="metric-card__label">{label}</span>
      <strong className="metric-card__value">{value}</strong>
    </article>
  );
}

function JsonViewer({ value }: { value: unknown }) {
  return <pre className="json-viewer">{JSON.stringify(value, null, 2)}</pre>;
}

function CodeBlock({ value }: { value: string }) {
  return (
    <pre className="code-block">
      <code>{value}</code>
    </pre>
  );
}

function DataTable<T extends object>({
  data,
  columns,
  rowClassName,
}: {
  data: T[];
  columns: ReturnType<typeof createColumnHelper<T>["accessor"]>[];
  rowClassName?: (row: T) => string;
}) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id} onClick={header.column.getToggleSortingHandler()}>
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className={rowClassName ? rowClassName(row.original) : ""}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function HierarchyTree({
  nodes,
  selectedId,
  expandedIds,
  onSelect,
  onToggle,
  level = 0,
}: {
  nodes: HierarchyTreeNode[];
  selectedId: string | undefined;
  expandedIds: string[];
  onSelect: (node: GraphNode) => void;
  onToggle: (nodeId: string) => void;
  level?: number;
}) {
  return (
    <div className="tree-list">
      {nodes.map((node) => {
        const isExpanded = expandedIds.includes(node.id);
        const flags = getNodeFlags(node);
        return (
          <div key={node.id} className="tree-item">
            <div
              className={selectedId === node.id ? "tree-row tree-row--selected" : "tree-row"}
              style={{ paddingLeft: `${10 + level * 16}px` }}
            >
              {node.treeChildren.length > 0 ? (
                <button className="tree-toggle" onClick={() => onToggle(node.id)}>
                  {isExpanded ? "−" : "+"}
                </button>
              ) : (
                <span className="tree-toggle tree-toggle--empty" />
              )}
              <button className="tree-button" onClick={() => onSelect(node)}>
                <span className="tree-button__title">{node.name}</span>
                <span className="tree-button__meta">
                  {node.type}
                  {flags.length > 0 ? ` · ${flags.join(", ")}` : ""}
                </span>
              </button>
            </div>
            {isExpanded && node.treeChildren.length > 0 ? (
              <HierarchyTree
                nodes={node.treeChildren}
                selectedId={selectedId}
                expandedIds={expandedIds}
                onSelect={onSelect}
                onToggle={onToggle}
                level={level + 1}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

async function getToken(): Promise<string> {
  const response = await fetch("/edge/api/v1/Login/GetAuthToken/profile", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ username: "demo", password: "demo" }),
  });
  const payload = (await response.json()) as { access_token: string };
  return payload.access_token;
}

async function apiFetch<T>(path: string, headers: MockHeaders, method = "GET"): Promise<T> {
  const token = path.startsWith("/edge/") ? await getToken() : null;
  const requestHeaders = new Headers();
  if (token) requestHeaders.set("authorization", `Bearer ${token}`);
  if (headers.errorCode) requestHeaders.set("x-mock-error", headers.errorCode);
  if (headers.delayMs) requestHeaders.set("x-mock-delay-ms", headers.delayMs);
  if (headers.malformed) requestHeaders.set("x-mock-malformed", "true");
  if (headers.empty) requestHeaders.set("x-mock-empty", "true");

  const response = await fetch(path, { method, headers: requestHeaders });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`${method} ${path} failed with ${response.status}: ${text}`);
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    return text as T;
  }
}

async function mcpFetch<T>(path: string, body?: Record<string, unknown>, method = "GET"): Promise<T> {
  const response = await fetch(path, {
    method,
    headers: method === "POST" ? { "content-type": "application/json" } : undefined,
    ...(method === "POST" ? { body: JSON.stringify(body ?? {}) } : {}),
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`${method} ${path} failed with ${response.status}: ${text}`);
  }
  return JSON.parse(text) as T;
}

function getMcpTargetPaths(status: MockStatus | null, target: McpTarget) {
  if (target === "rest") {
    return {
      toolsListPath: status?.mcpRestToolsListPath ?? "/api/mcp/rest/tools/list",
      toolCallPath: status?.mcpRestToolCallPath ?? "/api/mcp/rest/tools/call",
    };
  }

  return {
    toolsListPath: status?.mcpOpcUaToolsListPath ?? "/api/mcp/opcua/tools/list",
    toolCallPath: status?.mcpOpcUaToolCallPath ?? "/api/mcp/opcua/tools/call",
  };
}

function inferTargetForTool(name: string): McpTarget {
  return name.startsWith("opcua_") ? "opcua" : "rest";
}

function App() {
  const [nav, setNav] = useState<NavKey>("overview");
  const [opcuaTab, setOpcuaTab] = useState<OpcUaWorkspace>("discovery");
  const [status, setStatus] = useState<MockStatus | null>(null);
  const [helper, setHelper] = useState<ConnectionHelper | null>(null);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [graph, setGraph] = useState<GraphNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [includeParameters, setIncludeParameters] = useState(false);
  const [hierarchySearch, setHierarchySearch] = useState("");
  const [history, setHistory] = useState<HistoryResponse | null>(null);
  const [trendPack, setTrendPack] = useState<HistoryResponse[]>([]);
  const [alarms, setAlarms] = useState<AlarmRecord[]>([]);
  const [batches, setBatches] = useState<BatchRecord[]>([]);
  const [apiResponse, setApiResponse] = useState<unknown>(null);
  const [diagramSource, setDiagramSource] = useState(defaultDiagram);
  const [diagramSvg, setDiagramSvg] = useState("");
  const [bootIssues, setBootIssues] = useState<string[]>([]);
  const [headers, setHeaders] = useState<MockHeaders>({
    errorCode: "",
    delayMs: "",
    malformed: false,
    empty: false,
  });
  const [historyParam, setHistoryParam] = useState("PID1/PV");
  const [historyAggregation, setHistoryAggregation] = useState("Average");
  const [historyStart, setHistoryStart] = useState("2026-05-06T11:00");
  const [historyEnd, setHistoryEnd] = useState("2026-05-06T12:00");
  const [alarmFilters, setAlarmFilters] = useState({
    area: "",
    module: "",
    priority: "",
    eventType: "",
    start: "2026-05-06T11:59",
    end: "2026-05-06T12:10",
  });
  const [batchFilters, setBatchFilters] = useState({
    batchId: "",
    recipe: "",
    unit: "",
    phase: "",
    start: "2026-05-06T11:59",
    end: "2026-05-06T14:10",
  });
  const [mcpTools, setMcpTools] = useState<McpTool[]>([]);
  const [mcpAuthStatus, setMcpAuthStatus] = useState<Record<McpTarget, McpAuthStatus | null>>({
    rest: null,
    opcua: null,
  });
  const [opcuaPresets, setOpcUaPresets] = useState<OpcUaPresetResponse | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<string>("");
  const [toolResponse, setToolResponse] = useState<McpToolCallResponse | null>(null);
  const [toolRunnerName, setToolRunnerName] = useState("opcua_discover_endpoints");
  const [toolRunnerTarget, setToolRunnerTarget] = useState<McpTarget>("opcua");
  const [toolRunnerArgs, setToolRunnerArgs] = useState("{}");
  const [browseInput, setBrowseInput] = useState("ns=1;s=DemoDeltaV/AREA_B/REACTOR_01/TIC_301");
  const [singleReadInput, setSingleReadInput] = useState("TIC_301/PV.CV");
  const [multiReadInput, setMultiReadInput] = useState("TIC_301/PV.CV\nTIC_301/SP.CV\nTIC_301/OUT.CV");
  const [translateInput, setTranslateInput] = useState("/Objects/Server");
  const [sampleInput, setSampleInput] = useState("ns=1;s=AREA_B/REACTOR_01/TIC_301/PV.CV");
  const [sampleStart, setSampleStart] = useState(new Date(Date.now() - 10 * 60 * 1000).toISOString().slice(0, 16));
  const [sampleEnd, setSampleEnd] = useState(new Date().toISOString().slice(0, 16));
  const [sampleMaxPoints, setSampleMaxPoints] = useState(16);
  const [monitorInput, setMonitorInput] = useState("ns=1;s=AREA_B/REACTOR_01/TIC_301/PV.CV");
  const [monitorDurationMs, setMonitorDurationMs] = useState(4000);
  const [monitorSamplingMs, setMonitorSamplingMs] = useState(500);

  const deferredSearch = useDeferredValue(hierarchySearch.trim().toLowerCase());

  useEffect(() => {
    mermaid.initialize({ startOnLoad: false, theme: "default" });
  }, []);

  useEffect(() => {
    void mermaid.render(`diagram-preview-${diagramSource.length}`, diagramSource).then(({ svg }) => {
      setDiagramSvg(svg);
    });
  }, [diagramSource]);

  useEffect(() => {
    const issues: string[] = [];

    void apiFetch<MockStatus>("/api/mock-ui/status", headers)
      .then(async (mockStatus) => {
        setStatus(mockStatus);

        const restPaths = getMcpTargetPaths(mockStatus, "rest");
        const opcuaPaths = getMcpTargetPaths(mockStatus, "opcua");

        return Promise.allSettled([
          Promise.resolve(),
          apiFetch<ConnectionHelper>("/api/mock-ui/connection-helper", headers).then(setHelper),
          apiFetch<{ scenarios: Scenario[] }>("/api/mock-ui/scenarios", headers).then((payload) =>
            setScenarios(payload.scenarios),
          ),
          apiFetch<GraphNode[]>("/edge/api/v1/graph", headers).then((payload) => {
            const nodes = Array.isArray((payload as unknown as { results?: GraphNode[] }).results)
              ? ((payload as unknown as { results: GraphNode[] }).results)
              : (payload as unknown as GraphNode[]);
            setGraph(nodes);
            setSelectedNode(nodes[0] ?? null);
          }),
          apiFetch<OpcUaPresetResponse>("/api/mock-ui/opcua-presets", headers).then((payload) => {
            setOpcUaPresets(payload);
            setSelectedPreset(payload.presets[0]?.label ?? "");
          }),
          Promise.all([
            mcpFetch<{ tools: McpTool[] }>(restPaths.toolsListPath),
            mcpFetch<{ tools: McpTool[] }>(opcuaPaths.toolsListPath),
          ]).then(([restTools, opcuaTools]) => setMcpTools([...restTools.tools, ...opcuaTools.tools])),
          mcpFetch<McpToolCallResponse>(
            restPaths.toolCallPath,
            { name: "deltav_auth_status", arguments: {}, target: "rest" },
            "POST",
          ).then((payload) =>
            setMcpAuthStatus((current) => ({ ...current, rest: payload.result as McpAuthStatus })),
          ),
          mcpFetch<McpToolCallResponse>(
            opcuaPaths.toolCallPath,
            { name: "deltav_auth_status", arguments: {}, target: "opcua" },
            "POST",
          ).then((payload) =>
            setMcpAuthStatus((current) => ({ ...current, opcua: payload.result as McpAuthStatus })),
          ),
        ]);
      })
      .then((results) => {
        results.forEach((result) => {
          if (result.status === "rejected") {
            issues.push(result.reason instanceof Error ? result.reason.message : "Unknown bootstrap error");
          }
        });
        setBootIssues(issues);
      })
      .catch((error) => {
        issues.push(error instanceof Error ? error.message : "Unknown bootstrap error");
        setBootIssues(issues);
      });
  }, []);

  useEffect(() => {
    if (!selectedNode) return;
    void apiFetch<GraphNode>(`/edge/api/v1/graph/${encodeURIComponent(selectedNode.id)}?p=1&r=1`, headers).then(
      setSelectedNode,
    );
  }, [selectedNode?.id]);

  useEffect(() => {
    if (graph.length === 0) return;
    const roots = buildHierarchyTree(graph);
    setExpandedIds((current) => Array.from(new Set([...current, ...roots.map((node) => node.id)])));
  }, [graph.length]);

  useEffect(() => {
    if (!opcuaPresets || !selectedPreset) return;
    const preset = opcuaPresets.presets.find((item) => item.label === selectedPreset);
    if (!preset) return;
    setBrowseInput(preset.browseNodeId);
    setSingleReadInput(preset.logicalId);
    setMultiReadInput([preset.logicalId, preset.nodeId].join("\n"));
    setSampleInput(preset.nodeId);
    setMonitorInput(preset.nodeId);
    setTranslateInput(preset.browsePath);
    setToolRunnerArgs(
      JSON.stringify(
        {
          nodeId: preset.nodeId,
          logicalId: preset.logicalId,
        },
        null,
        2,
      ),
    );
  }, [opcuaPresets, selectedPreset]);

  const hierarchyRoots = useMemo(() => buildHierarchyTree(graph), [graph]);
  const filteredHierarchy = useMemo(
    () => filterHierarchyTree(hierarchyRoots, deferredSearch, includeParameters),
    [hierarchyRoots, deferredSearch, includeParameters],
  );

  const hierarchyFlow = useMemo(() => {
    const visibleNodes = graph.slice(0, 24);
    const nodes: Node[] = visibleNodes.map((node, index) => ({
      id: node.id,
      position: {
        x: 60 + (index % 4) * 220,
        y: 40 + Math.floor(index / 4) * 130,
      },
      data: {
        label: (
          <div className="flow-card">
            <strong>{node.name}</strong>
            <span>{node.type}</span>
          </div>
        ),
      },
      style: {
        width: 170,
        padding: 0,
        borderRadius: 18,
        border: node.id === selectedNode?.id ? "2px solid #f38b4a" : "1px solid rgba(18,53,59,0.12)",
        background: node.id === selectedNode?.id ? "#fff7ef" : "#ffffff",
      },
    }));

    const edges: Edge[] = [];
    visibleNodes.forEach((node) => {
      (((node.relationships?.Children as string[] | undefined) ?? [])).forEach((child) => {
        if (visibleNodes.some((candidate) => candidate.id === child)) {
          edges.push({
            id: `${node.id}-${child}`,
            source: node.id,
            target: child,
            animated: child === selectedNode?.id,
            style: { stroke: child === selectedNode?.id ? "#f38b4a" : "#9ab7b2" },
          });
        }
      });
    });

    return { nodes, edges };
  }, [graph, selectedNode?.id]);

  const selectedRelationships = useMemo(() => {
    if (!selectedNode) return { nodes: [], edges: [] } as { nodes: Node[]; edges: Edge[] };
    const ids = new Set<string>([
      selectedNode.id,
      ...(((selectedNode.relationships?.Parents as string[] | undefined) ?? [])),
      ...(((selectedNode.relationships?.Children as string[] | undefined) ?? [])),
    ]);
    const related = graph.filter((node) => ids.has(node.id));

    return {
      nodes: related.map((node, index) => ({
        id: node.id,
        position: { x: 40 + index * 180, y: node.id === selectedNode.id ? 40 : 220 },
        data: {
          label: (
            <div className="flow-card">
              <strong>{node.name}</strong>
              <span>{node.type}</span>
            </div>
          ),
        },
        style: {
          width: 160,
          padding: 0,
          borderRadius: 18,
          border: node.id === selectedNode.id ? "2px solid #177f7a" : "1px solid rgba(18,53,59,0.12)",
          background: node.id === selectedNode.id ? "#e9fbf8" : "#ffffff",
        },
      })),
      edges: [
        ...((((selectedNode.relationships?.Parents as string[] | undefined) ?? [])).map((parentId) => ({
          id: `${parentId}-${selectedNode.id}`,
          source: parentId,
          target: selectedNode.id,
          style: { stroke: "#177f7a" },
        }))),
        ...((((selectedNode.relationships?.Children as string[] | undefined) ?? [])).map((childId) => ({
          id: `${selectedNode.id}-${childId}`,
          source: selectedNode.id,
          target: childId,
          style: { stroke: "#f0b24b" },
        }))),
      ],
    };
  }, [graph, selectedNode]);

  const historyChartRef = useChart(
    history
      ? {
          tooltip: { trigger: "axis" },
          xAxis: {
            type: "category",
            data: history.values.map((value) => value.timestamp.slice(11, 16)),
          },
          yAxis: { type: "value" },
          series: [
            {
              type: "line",
              smooth: true,
              data: history.values.map((value) => value.value),
              lineStyle: { color: "#177f7a", width: 3 },
              areaStyle: { color: "rgba(23,127,122,0.12)" },
            },
          ],
        }
      : null,
  );

  const trendPackChartRef = useChart(
    trendPack.length > 0
      ? {
          tooltip: { trigger: "axis" },
          legend: {
            top: 0,
            textStyle: { color: "#577277" },
          },
          xAxis: {
            type: "category",
            data: trendPack[0]?.values.map((value) => value.timestamp.slice(11, 16)) ?? [],
          },
          yAxis: { type: "value" },
          series: trendPack.map((series, index) => ({
            name: series.entityId,
            type: "line",
            smooth: true,
            data: series.values.map((value) => value.value),
            lineStyle: {
              width: 2,
              color: ["#177f7a", "#f38b4a", "#538fcf", "#2f8f65"][index % 4],
            },
          })),
        }
      : null,
  );

  const eventChartRef = useChart(
    alarms.length > 0
      ? {
          tooltip: { trigger: "item" },
          xAxis: {
            type: "category",
            data: Array.from(new Set(alarms.map((item) => item.priority ?? "UNSPECIFIED"))),
          },
          yAxis: { type: "value" },
          series: [
            {
              type: "bar",
              data: Array.from(new Set(alarms.map((item) => item.priority ?? "UNSPECIFIED"))).map(
                (priority) => alarms.filter((item) => (item.priority ?? "UNSPECIFIED") === priority).length,
              ),
              itemStyle: { color: "#d96b3b" },
            },
          ],
        }
      : null,
  );

  const batchChartRef = useChart(
    batches.length > 0
      ? {
          tooltip: { trigger: "axis" },
          xAxis: {
            type: "category",
            data: Array.from(new Set(batches.map((item) => item.batchId))),
          },
          yAxis: { type: "value" },
          series: [
            {
              type: "bar",
              data: Array.from(new Set(batches.map((item) => item.batchId))).map(
                (batchId) => batches.filter((item) => item.batchId === batchId).length,
              ),
              itemStyle: { color: "#538fcf" },
            },
          ],
        }
      : null,
  );

  const toolSeries = useMemo(() => {
    const result = toolResponse?.result as
      | { samples?: Array<{ timestamp: string; reads: Array<{ value: number | null; sourceTimestamp?: string }> }> }
      | { events?: Array<{ timestamp: string; value: number | null }> }
      | undefined;

    if (result?.samples && result.samples.length > 0) {
      return result.samples.map((sample) => ({
        timestamp: sample.timestamp,
        value: typeof sample.reads[0]?.value === "number" ? sample.reads[0]?.value : null,
      }));
    }

    if (result?.events && result.events.length > 0) {
      return result.events.map((event) => ({
        timestamp: event.timestamp,
        value: typeof event.value === "number" ? event.value : null,
      }));
    }

    return [];
  }, [toolResponse]);

  const opcuaChartRef = useChart(
    toolSeries.length > 0
      ? {
          tooltip: { trigger: "axis" },
          xAxis: {
            type: "category",
            data: toolSeries.map((item) => item.timestamp.slice(11, 19)),
          },
          yAxis: { type: "value" },
          series: [
            {
              type: "line",
              smooth: true,
              data: toolSeries.map((item) => item.value),
              lineStyle: { color: "#6b5cff", width: 3 },
              areaStyle: { color: "rgba(107,92,255,0.12)" },
            },
          ],
        }
      : null,
  );

  const alarmColumns = useMemo(
    () => [
      alarmColumn.accessor("timestamp", { header: "Timestamp" }),
      alarmColumn.accessor("area", { header: "Area" }),
      alarmColumn.accessor("module", { header: "Module" }),
      alarmColumn.accessor("priority", { header: "Priority" }),
      alarmColumn.accessor("eventType", { header: "Type" }),
      alarmColumn.accessor("message", { header: "Message" }),
      alarmColumn.accessor("state", { header: "State" }),
    ],
    [],
  );

  const batchColumns = useMemo(
    () => [
      batchColumn.accessor("timestamp", { header: "Timestamp" }),
      batchColumn.accessor("batchId", { header: "Batch ID" }),
      batchColumn.accessor("recipe", { header: "Recipe" }),
      batchColumn.accessor("phase", { header: "Phase" }),
      batchColumn.accessor("status", { header: "Status" }),
      batchColumn.accessor("message", { header: "Message" }),
    ],
    [],
  );

  const readTableRows = useMemo(() => {
    if (!toolResponse || typeof toolResponse.result !== "object" || toolResponse.result === null) {
      return [] as Array<{ nodeId: string; value: string; statusCode: string; timestamp: string }>;
    }

    const result = toolResponse.result as Record<string, unknown>;
    const reads =
      Array.isArray(result.reads)
        ? result.reads
        : Array.isArray(result.references)
          ? []
          : "nodeId" in result
            ? [result]
            : [];

    return reads
      .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
      .map((item) => ({
        nodeId: typeof item.nodeId === "string" ? item.nodeId : "—",
        value: formatRuntimeValue(item.value),
        statusCode: typeof item.statusCode === "string" ? item.statusCode : "—",
        timestamp:
          typeof item.sourceTimestamp === "string"
            ? item.sourceTimestamp
            : typeof item.serverTimestamp === "string"
              ? item.serverTimestamp
              : "—",
      }));
  }, [toolResponse]);

  const readColumns = useMemo(
    () => [
      readColumn.accessor("nodeId", { header: "Node ID" }),
      readColumn.accessor("value", { header: "Value" }),
      readColumn.accessor("statusCode", { header: "Status" }),
      readColumn.accessor("timestamp", { header: "Timestamp" }),
    ],
    [],
  );

  const groupedTools = useMemo(() => {
    const groups = new Map<string, McpTool[]>();
    mcpTools.forEach((tool) => {
      const group = tool.name.startsWith("opcua_")
        ? "OPC UA"
        : tool.name.startsWith("deltav_")
          ? "DeltaV"
          : tool.name.startsWith("generate_")
            ? "Generation"
            : tool.name.startsWith("review_") || tool.name.startsWith("identify_")
              ? "Review"
              : "Other";
      const key = `${group} · ${tool.target.toUpperCase()}`;
      groups.set(key, [...(groups.get(key) ?? []), tool]);
    });
    return Array.from(groups.entries());
  }, [mcpTools]);

  const selectedTool = useMemo(
    () => mcpTools.find((tool) => tool.name === toolRunnerName && tool.target === toolRunnerTarget) ?? null,
    [mcpTools, toolRunnerName, toolRunnerTarget],
  );

  async function loadHistory() {
    const response = await apiFetch<HistoryResponse>(
      `/edge/api/v1/history/${encodeURIComponent(historyParam)}?StartTime=${new Date(historyStart).toISOString()}&EndTime=${new Date(historyEnd).toISOString()}&PS=32&Aggregation=${historyAggregation}`,
      headers,
    );
    setHistory(response);
    setApiResponse(response);
  }

  async function loadTrendPack() {
    const parameters = ["PID1/PV", "PID1/SP", "PID1/OUT"];
    const series = await Promise.all(
      parameters.map((id) =>
        apiFetch<HistoryResponse>(
          `/edge/api/v1/history/${encodeURIComponent(id)}?StartTime=${new Date(historyStart).toISOString()}&EndTime=${new Date(historyEnd).toISOString()}&PS=24&Aggregation=Average`,
          headers,
        ),
      ),
    );
    setTrendPack(series);
    setApiResponse(series);
  }

  async function loadAlarms() {
    const query = new URLSearchParams({
      StartTime: new Date(alarmFilters.start).toISOString(),
      EndTime: new Date(alarmFilters.end).toISOString(),
      PN: "1",
      PS: "100",
    });
    if (alarmFilters.area) query.set("area", alarmFilters.area);
    if (alarmFilters.module) query.set("module", alarmFilters.module);
    if (alarmFilters.priority) query.set("priority", alarmFilters.priority);
    if (alarmFilters.eventType) query.set("eventType", alarmFilters.eventType);
    const response = await apiFetch<{ records: AlarmRecord[] }>(`/edge/api/v1/ae?${query.toString()}`, headers);
    setAlarms(response.records);
    setApiResponse(response);
  }

  async function loadBatches() {
    const query = new URLSearchParams({
      StartTime: new Date(batchFilters.start).toISOString(),
      EndTime: new Date(batchFilters.end).toISOString(),
      PN: "1",
      PS: "100",
    });
    if (batchFilters.batchId) query.set("batchId", batchFilters.batchId);
    if (batchFilters.recipe) query.set("recipe", batchFilters.recipe);
    if (batchFilters.unit) query.set("unit", batchFilters.unit);
    if (batchFilters.phase) query.set("phase", batchFilters.phase);
    const response = await apiFetch<{ records: BatchRecord[] }>(`/edge/api/v1/batchevent?${query.toString()}`, headers);
    setBatches(response.records);
    setApiResponse(response);
  }

  async function runTool(name: string, args: Record<string, unknown>, target?: McpTarget) {
    const resolvedTarget = target ?? inferTargetForTool(name);
    const { toolCallPath } = getMcpTargetPaths(status, resolvedTarget);
    const response = await mcpFetch<McpToolCallResponse>(
      toolCallPath,
      { name, arguments: args, target: resolvedTarget },
      "POST",
    );
    setToolResponse(response);
    return response;
  }

  async function runDiscovery(action: "endpoints" | "connection" | "namespaces" | "status") {
    const mapping: Record<typeof action, string> = {
      endpoints: "opcua_discover_endpoints",
      connection: "opcua_test_connection",
      namespaces: "opcua_get_namespace_array",
      status: "opcua_get_server_status",
    };
    await runTool(mapping[action], {}, "opcua");
  }

  async function runBrowse() {
    await runTool("opcua_browse_node", { nodeId: browseInput }, "opcua");
  }

  async function runSingleRead() {
    await runTool(
      "opcua_read_node",
      {
        nodeId: singleReadInput,
        ...(singleReadInput.includes("ns=") ? {} : { logicalId: singleReadInput }),
      },
      "opcua",
    );
  }

  async function runMultiRead() {
    const nodeIds = multiReadInput
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    await runTool("opcua_read_nodes", { nodeIds }, "opcua");
  }

  async function runTranslate() {
    await runTool("opcua_translate_path", {
      browsePath: translateInput,
      startingNodeId: "RootFolder",
    }, "opcua");
  }

  async function runSample() {
    const nodeIds = sampleInput
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    await runTool("opcua_sample_nodes_for_window", {
      nodeIds,
      startTime: new Date(sampleStart).toISOString(),
      endTime: new Date(sampleEnd).toISOString(),
      maxPoints: sampleMaxPoints,
    }, "opcua");
  }

  async function runMonitor() {
    const nodeIds = monitorInput
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    await runTool("opcua_monitor_nodes_for_window", {
      nodeIds,
      durationMs: monitorDurationMs,
      samplingIntervalMs: monitorSamplingMs,
    }, "opcua");
  }

  async function runToolRunner() {
    const parsed = safeJsonParse<Record<string, unknown>>(toolRunnerArgs, {});
    await runTool(toolRunnerName, parsed, toolRunnerTarget);
  }

  return (
    <div className="console-shell">
      <aside className="console-sidebar">
        <div>
          <span className="console-sidebar__eyebrow">DeltaV Engineering Console</span>
          <h1>Mock Edge + OPC UA Workbench</h1>
          <p>One browser console for mock REST, live MCP tools, and read-only OPC UA investigation workflows.</p>
        </div>

        <div className="console-sidebar__status">
          <span className="status-dot status-dot--good" />
          <div>
            <strong>{status?.status ?? "loading"}</strong>
            <span>
              {mcpAuthStatus.rest?.dataSource && mcpAuthStatus.opcua?.dataSource
                ? `REST ${mcpAuthStatus.rest.dataSource} · OPC UA ${mcpAuthStatus.opcua.dataSource}`
                : "Dual MCP status pending"}
            </span>
          </div>
        </div>

        <nav className="console-nav">
          {navItems.map((item) => (
            <button
              key={item.key}
              className={nav === item.key ? "console-nav__button console-nav__button--active" : "console-nav__button"}
              onClick={() => setNav(item.key)}
            >
              <span>{item.label}</span>
              <small>{item.detail}</small>
            </button>
          ))}
        </nav>

        <div className="console-sidebar__footer">
          <span>Mock REST: {status?.baseUrl ?? "…"}</span>
          <span>Mock OPC UA: {status?.mockOpcUaEndpoint ?? opcuaPresets?.endpoint ?? "…"}</span>
          <span>REST MCP: {status?.mcpRestToolCallPath ?? "/api/mcp/rest/tools/call"}</span>
          <span>OPC UA MCP: {status?.mcpOpcUaToolCallPath ?? "/api/mcp/opcua/tools/call"}</span>
        </div>
      </aside>

      <main className="console-main">
        <header className="console-header">
          <div>
            <p className="console-header__kicker">{navItems.find((item) => item.key === nav)?.detail}</p>
            <h2>{navItems.find((item) => item.key === nav)?.label}</h2>
          </div>
          <div className="console-badges">
            <span className="console-pill">UI origin `:8080`</span>
            <span className="console-pill">MCP over same-origin proxy</span>
            <span className="console-pill">Read-only safety model</span>
          </div>
        </header>

        {bootIssues.length > 0 ? (
          <section className="console-alert">
            <strong>Bootstrap warnings</strong>
            <ul>
              {bootIssues.map((issue) => (
                <li key={issue}>{issue}</li>
              ))}
            </ul>
          </section>
        ) : null}

        {nav === "overview" ? (
          <div className="page-grid">
            <Panel title="System posture" subtitle="Status and quick context for the integrated engineering console.">
              <div className="metrics-row">
                <MetricCard label="Demo systems" value={status?.systems.length ?? 0} />
                <MetricCard label="Hierarchy nodes" value={graph.length} />
                <MetricCard label="MCP tools" value={mcpTools.length} tone="good" />
                <MetricCard label="REST MCP" value={mcpAuthStatus.rest?.authenticated ? "online" : "pending"} />
                <MetricCard label="OPC UA MCP" value={mcpAuthStatus.opcua?.authenticated ? "online" : "pending"} />
                <MetricCard label="OPC UA presets" value={opcuaPresets?.presets.length ?? 0} />
              </div>
              <div className="detail-grid">
                <article className="detail-card">
                  <h3>REST MCP status</h3>
                  <JsonViewer value={mcpAuthStatus.rest} />
                </article>
                <article className="detail-card">
                  <h3>OPC UA MCP status</h3>
                  <JsonViewer value={mcpAuthStatus.opcua} />
                </article>
                <article className="detail-card">
                  <h3>Console workspaces</h3>
                  <ul className="detail-list">
                    {(status?.workspaces ?? []).map((workspace) => (
                      <li key={workspace}>{workspace}</li>
                    ))}
                  </ul>
                </article>
                <article className="detail-card">
                  <h3>Quick launch</h3>
                  <div className="button-row">
                    <button className="primary-button" onClick={() => setNav("opcua")}>Open OPC UA</button>
                    <button className="ghost-button" onClick={() => setNav("runner")}>Open Tool Runner</button>
                    <button className="ghost-button" onClick={() => setNav("deltaV")}>Open DeltaV Graph</button>
                  </div>
                </article>
              </div>
            </Panel>

            <Panel title="Available endpoints" subtitle="Mock REST plus same-origin proxy surfaces exposed by this console.">
              <div className="endpoint-grid">
                {(status?.endpoints ?? []).map((endpoint) => (
                  <code key={endpoint} className="endpoint-chip">{endpoint}</code>
                ))}
              </div>
            </Panel>
          </div>
        ) : null}

        {nav === "deltaV" ? (
          <div className="page-grid">
            <Panel
              title="DeltaV hierarchy workspace"
              subtitle="Browse the mock DeltaV hierarchy, runtime flags, and selected-node relationships."
              actions={
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={includeParameters}
                    onChange={(event) => setIncludeParameters(event.target.checked)}
                  />
                  Include parameters
                </label>
              }
            >
              <div className="hierarchy-toolbar">
                <label className="form-field">
                  <span>Search hierarchy</span>
                  <input
                    value={hierarchySearch}
                    onChange={(event) => setHierarchySearch(event.target.value)}
                    placeholder="Search by id, name, or path"
                  />
                </label>
              </div>
              <div className="workspace-grid workspace-grid--deltaV">
                <div className="workspace-grid__rail">
                  <HierarchyTree
                    nodes={filteredHierarchy}
                    selectedId={selectedNode?.id}
                    expandedIds={expandedIds}
                    onSelect={setSelectedNode}
                    onToggle={(nodeId) =>
                      setExpandedIds((current) =>
                        current.includes(nodeId) ? current.filter((item) => item !== nodeId) : [...current, nodeId],
                      )
                    }
                  />
                </div>
                <div className="workspace-grid__main">
                  <div className="canvas-card">
                    <ReactFlow nodes={hierarchyFlow.nodes} edges={hierarchyFlow.edges} fitView>
                      <MiniMap />
                      <Controls />
                      <Background />
                    </ReactFlow>
                  </div>
                  <div className="detail-grid">
                    <article className="detail-card">
                      <h3>Selected node</h3>
                      <JsonViewer value={selectedNode} />
                    </article>
                    <article className="detail-card">
                      <h3>Relationship view</h3>
                      <div className="mini-flow">
                        <ReactFlow nodes={selectedRelationships.nodes} edges={selectedRelationships.edges} fitView>
                          <Background />
                        </ReactFlow>
                      </div>
                    </article>
                  </div>
                </div>
              </div>
            </Panel>
          </div>
        ) : null}

        {nav === "trends" ? (
          <div className="page-grid">
            <Panel
              title="Trend workspace"
              subtitle="Query deterministic mock history and compare related traces."
              actions={
                <div className="button-row">
                  <button className="primary-button" onClick={loadHistory}>Load history</button>
                  <button className="ghost-button" onClick={loadTrendPack}>Load trend pack</button>
                </div>
              }
            >
              <div className="form-grid">
                <label className="form-field">
                  <span>Parameter</span>
                  <select value={historyParam} onChange={(event) => setHistoryParam(event.target.value)}>
                    <option value="PID1/PV">PID1/PV</option>
                    <option value="PID1/SP">PID1/SP</option>
                    <option value="PID1/OUT">PID1/OUT</option>
                    <option value="TIC301/PV">TIC301/PV</option>
                  </select>
                </label>
                <label className="form-field">
                  <span>Start</span>
                  <input type="datetime-local" value={historyStart} onChange={(event) => setHistoryStart(event.target.value)} />
                </label>
                <label className="form-field">
                  <span>End</span>
                  <input type="datetime-local" value={historyEnd} onChange={(event) => setHistoryEnd(event.target.value)} />
                </label>
                <label className="form-field">
                  <span>Aggregation</span>
                  <select value={historyAggregation} onChange={(event) => setHistoryAggregation(event.target.value)}>
                    <option>Average</option>
                    <option>Minimum</option>
                    <option>Maximum</option>
                    <option>Interpolative</option>
                  </select>
                </label>
              </div>
              <div className="chart-surface" ref={historyChartRef} />
              <JsonViewer value={history} />
            </Panel>

            <Panel title="Trend pack comparison" subtitle="Correlate multiple traces over the same window.">
              <div className="chart-surface" ref={trendPackChartRef} />
              <JsonViewer value={trendPack} />
            </Panel>
          </div>
        ) : null}

        {nav === "events" ? (
          <div className="page-grid">
            <Panel
              title="Alarm and event explorer"
              subtitle="Mock alarm/event filters plus batch timeline inspection."
              actions={<button className="primary-button" onClick={loadAlarms}>Load alarms</button>}
            >
              <div className="form-grid">
                <label className="form-field">
                  <span>Area</span>
                  <input value={alarmFilters.area} onChange={(event) => setAlarmFilters({ ...alarmFilters, area: event.target.value })} />
                </label>
                <label className="form-field">
                  <span>Module</span>
                  <input value={alarmFilters.module} onChange={(event) => setAlarmFilters({ ...alarmFilters, module: event.target.value })} />
                </label>
                <label className="form-field">
                  <span>Priority</span>
                  <input value={alarmFilters.priority} onChange={(event) => setAlarmFilters({ ...alarmFilters, priority: event.target.value })} />
                </label>
                <label className="form-field">
                  <span>Event type</span>
                  <input value={alarmFilters.eventType} onChange={(event) => setAlarmFilters({ ...alarmFilters, eventType: event.target.value })} />
                </label>
              </div>
              <DataTable data={alarms} columns={alarmColumns} rowClassName={(row) => (row.active ? "row--alert" : "")} />
              <div className="chart-surface chart-surface--compact" ref={eventChartRef} />
            </Panel>

            <Panel
              title="Batch explorer"
              subtitle="Compare batch counts and inspect phase-level messages."
              actions={<button className="primary-button" onClick={loadBatches}>Load batches</button>}
            >
              <div className="form-grid">
                <label className="form-field">
                  <span>Batch ID</span>
                  <input value={batchFilters.batchId} onChange={(event) => setBatchFilters({ ...batchFilters, batchId: event.target.value })} />
                </label>
                <label className="form-field">
                  <span>Recipe</span>
                  <input value={batchFilters.recipe} onChange={(event) => setBatchFilters({ ...batchFilters, recipe: event.target.value })} />
                </label>
                <label className="form-field">
                  <span>Unit</span>
                  <input value={batchFilters.unit} onChange={(event) => setBatchFilters({ ...batchFilters, unit: event.target.value })} />
                </label>
                <label className="form-field">
                  <span>Phase</span>
                  <input value={batchFilters.phase} onChange={(event) => setBatchFilters({ ...batchFilters, phase: event.target.value })} />
                </label>
              </div>
              <DataTable data={batches} columns={batchColumns} />
              <div className="chart-surface chart-surface--compact" ref={batchChartRef} />
            </Panel>
          </div>
        ) : null}

        {nav === "opcua" ? (
          <div className="page-grid">
            <Panel title="OPC UA workbench" subtitle="Real MCP-backed browsing, reads, browse-path translation, sampled windows, and monitored captures.">
              <div className="opcua-header">
                <div className="tab-row">
                  {opcuaTabs.map((tab) => (
                    <button
                      key={tab.key}
                      className={opcuaTab === tab.key ? "tab-button tab-button--active" : "tab-button"}
                      onClick={() => setOpcuaTab(tab.key)}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
                <label className="form-field form-field--compact">
                  <span>Preset</span>
                  <select value={selectedPreset} onChange={(event) => setSelectedPreset(event.target.value)}>
                    {(opcuaPresets?.presets ?? []).map((preset) => (
                      <option key={preset.label} value={preset.label}>{preset.label}</option>
                    ))}
                  </select>
                </label>
              </div>

              {opcuaTab === "discovery" ? (
                <div className="detail-grid">
                  <article className="detail-card">
                    <h3>Discovery actions</h3>
                    <div className="button-row button-row--stacked">
                      <button className="primary-button" onClick={() => void runDiscovery("endpoints")}>Discover endpoints</button>
                      <button className="ghost-button" onClick={() => void runDiscovery("connection")}>Test connection</button>
                      <button className="ghost-button" onClick={() => void runDiscovery("namespaces")}>Get namespace array</button>
                      <button className="ghost-button" onClick={() => void runDiscovery("status")}>Get server status</button>
                    </div>
                  </article>
                  <article className="detail-card">
                    <h3>OPC UA endpoint</h3>
                    <p>{opcuaPresets?.endpoint ?? status?.mockOpcUaEndpoint ?? "Unknown endpoint"}</p>
                    <JsonViewer value={toolResponse?.target === "opcua" ? toolResponse : null} />
                  </article>
                </div>
              ) : null}

              {opcuaTab === "browse" ? (
                <div className="detail-grid detail-grid--wide">
                  <article className="detail-card">
                    <h3>Browse node</h3>
                    <label className="form-field">
                      <span>Node ID</span>
                      <input value={browseInput} onChange={(event) => setBrowseInput(event.target.value)} />
                    </label>
                    <div className="button-row">
                      <button className="primary-button" onClick={() => void runBrowse()}>Browse node</button>
                    </div>
                  </article>
                  <article className="detail-card">
                    <h3>Browse result</h3>
                    <JsonViewer value={toolResponse?.name === "opcua_browse_node" ? toolResponse.result : null} />
                  </article>
                </div>
              ) : null}

              {opcuaTab === "reads" ? (
                <div className="detail-grid detail-grid--wide">
                  <article className="detail-card">
                    <h3>Single read</h3>
                    <label className="form-field">
                      <span>Logical ID or Node ID</span>
                      <input value={singleReadInput} onChange={(event) => setSingleReadInput(event.target.value)} />
                    </label>
                    <button className="primary-button" onClick={() => void runSingleRead()}>Read node</button>
                  </article>
                  <article className="detail-card">
                    <h3>Multi-read</h3>
                    <label className="form-field">
                      <span>Node IDs</span>
                      <textarea value={multiReadInput} onChange={(event) => setMultiReadInput(event.target.value)} rows={6} />
                    </label>
                    <button className="ghost-button" onClick={() => void runMultiRead()}>Read nodes</button>
                  </article>
                  <article className="detail-card detail-card--full">
                    <h3>Read results</h3>
                    <DataTable data={readTableRows} columns={readColumns} />
                  </article>
                </div>
              ) : null}

              {opcuaTab === "translate" ? (
                <div className="detail-grid">
                  <article className="detail-card">
                    <h3>Translate browse path</h3>
                    <label className="form-field">
                      <span>Browse path</span>
                      <input value={translateInput} onChange={(event) => setTranslateInput(event.target.value)} />
                    </label>
                    <button className="primary-button" onClick={() => void runTranslate()}>Translate</button>
                  </article>
                  <article className="detail-card">
                    <h3>Translate result</h3>
                    <JsonViewer value={toolResponse?.name === "opcua_translate_path" ? toolResponse.result : null} />
                  </article>
                </div>
              ) : null}

              {opcuaTab === "sample" ? (
                <div className="detail-grid detail-grid--wide">
                  <article className="detail-card">
                    <h3>Sample nodes for window</h3>
                    <label className="form-field">
                      <span>Node IDs</span>
                      <textarea value={sampleInput} onChange={(event) => setSampleInput(event.target.value)} rows={4} />
                    </label>
                    <div className="form-grid">
                      <label className="form-field">
                        <span>Start</span>
                        <input type="datetime-local" value={sampleStart} onChange={(event) => setSampleStart(event.target.value)} />
                      </label>
                      <label className="form-field">
                        <span>End</span>
                        <input type="datetime-local" value={sampleEnd} onChange={(event) => setSampleEnd(event.target.value)} />
                      </label>
                      <label className="form-field">
                        <span>Max points</span>
                        <input type="number" value={sampleMaxPoints} onChange={(event) => setSampleMaxPoints(Number(event.target.value))} />
                      </label>
                    </div>
                    <button className="primary-button" onClick={() => void runSample()}>Sample window</button>
                  </article>
                  <article className="detail-card detail-card--full">
                    <h3>Sampled trend</h3>
                    <div className="chart-surface chart-surface--compact" ref={opcuaChartRef} />
                    <JsonViewer value={toolResponse?.name === "opcua_sample_nodes_for_window" ? toolResponse.result : null} />
                  </article>
                </div>
              ) : null}

              {opcuaTab === "monitor" ? (
                <div className="detail-grid detail-grid--wide">
                  <article className="detail-card">
                    <h3>Monitor nodes for window</h3>
                    <label className="form-field">
                      <span>Node IDs</span>
                      <textarea value={monitorInput} onChange={(event) => setMonitorInput(event.target.value)} rows={4} />
                    </label>
                    <div className="form-grid">
                      <label className="form-field">
                        <span>Duration ms</span>
                        <input type="number" value={monitorDurationMs} onChange={(event) => setMonitorDurationMs(Number(event.target.value))} />
                      </label>
                      <label className="form-field">
                        <span>Sampling ms</span>
                        <input type="number" value={monitorSamplingMs} onChange={(event) => setMonitorSamplingMs(Number(event.target.value))} />
                      </label>
                    </div>
                    <button className="primary-button" onClick={() => void runMonitor()}>Capture monitor window</button>
                  </article>
                  <article className="detail-card detail-card--full">
                    <h3>Monitor capture</h3>
                    <div className="chart-surface chart-surface--compact" ref={opcuaChartRef} />
                    <JsonViewer value={toolResponse?.name === "opcua_monitor_nodes_for_window" ? toolResponse.result : null} />
                  </article>
                </div>
              ) : null}
            </Panel>
          </div>
        ) : null}

        {nav === "runner" ? (
          <div className="page-grid">
            <Panel title="Tool runner" subtitle="Inspect the real MCP tool inventory and execute tools through the same-origin proxy.">
              <div className="runner-layout">
                <div className="runner-sidebar">
                  {groupedTools.map(([group, tools]) => (
                    <section key={group} className="runner-group">
                      <h3>{group}</h3>
                      {tools.map((tool) => (
                        <button
                          key={`${tool.target}-${tool.name}`}
                          className={
                            toolRunnerName === tool.name && toolRunnerTarget === tool.target
                              ? "runner-tool runner-tool--active"
                              : "runner-tool"
                          }
                          onClick={() => {
                            setToolRunnerName(tool.name);
                            setToolRunnerTarget(tool.target);
                            setToolRunnerArgs("{}");
                          }}
                        >
                          <strong>{tool.name}</strong>
                          <span>{tool.target.toUpperCase()} · {tool.description}</span>
                        </button>
                      ))}
                    </section>
                  ))}
                </div>
                <div className="runner-main">
                  <div className="detail-grid">
                    <article className="detail-card">
                      <h3>{selectedTool?.name ?? "Tool"}</h3>
                      <p>{selectedTool?.description}</p>
                      <p>Target: {toolRunnerTarget.toUpperCase()}</p>
                      <JsonViewer value={selectedTool?.inputSchema ?? {}} />
                    </article>
                    <article className="detail-card">
                      <h3>Arguments</h3>
                      <label className="form-field form-field--compact">
                        <span>MCP target</span>
                        <select
                          value={toolRunnerTarget}
                          onChange={(event) => setToolRunnerTarget(event.target.value as McpTarget)}
                        >
                          <option value="rest">REST MCP</option>
                          <option value="opcua">OPC UA MCP</option>
                        </select>
                      </label>
                      <textarea value={toolRunnerArgs} onChange={(event) => setToolRunnerArgs(event.target.value)} rows={12} />
                      <div className="button-row">
                        <button className="primary-button" onClick={() => void runToolRunner()}>Run tool</button>
                        <button
                          className="ghost-button"
                          onClick={() => setToolRunnerArgs(JSON.stringify({ name: selectedTool?.name }, null, 2))}
                        >
                          Load sample
                        </button>
                      </div>
                    </article>
                  </div>
                  <Panel title="Tool result" subtitle="Normalized JSON response from the MCP proxy.">
                    <JsonViewer value={toolResponse} />
                  </Panel>
                </div>
              </div>
            </Panel>
          </div>
        ) : null}

        {nav === "scenarios" ? (
          <div className="page-grid">
            <Panel title="Failure scenario browser" subtitle="Mock investigation scenarios, modules, and expected evidence outputs.">
              <div className="scenario-grid">
                {scenarios.map((scenario) => (
                  <article key={scenario.name} className="scenario-card">
                    <div className="scenario-card__header">
                      <span className="scenario-card__tone">Scenario</span>
                      <h3>{scenario.name}</h3>
                    </div>
                    <p>{scenario.description}</p>
                    <div className="scenario-card__section">
                      <strong>Related modules</strong>
                      <ul>
                        {scenario.relatedModules.map((module) => (
                          <li key={module}>{module}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="scenario-card__section">
                      <strong>Expected outputs</strong>
                      <ul>
                        {scenario.expectedInvestigationOutputs.map((output) => (
                          <li key={output}>{output}</li>
                        ))}
                      </ul>
                    </div>
                  </article>
                ))}
              </div>
            </Panel>
          </div>
        ) : null}

        {nav === "setup" ? (
          <div className="page-grid">
            <Panel title="Connection helper" subtitle="Repo-local MCP, OPC UA, and mock service settings.">
              <div className="detail-grid">
                <article className="detail-card">
                  <h3>Environment example</h3>
                  <CodeBlock value={helper?.envExample ?? ""} />
                </article>
                <article className="detail-card">
                  <h3>Codex config</h3>
                  <JsonViewer value={helper?.mcpClientConfig ?? {}} />
                </article>
                <article className="detail-card">
                  <h3>Mock headers</h3>
                  <div className="form-grid">
                    <label className="form-field">
                      <span>Error code</span>
                      <input value={headers.errorCode} onChange={(event) => setHeaders({ ...headers, errorCode: event.target.value })} />
                    </label>
                    <label className="form-field">
                      <span>Delay ms</span>
                      <input value={headers.delayMs} onChange={(event) => setHeaders({ ...headers, delayMs: event.target.value })} />
                    </label>
                    <label className="checkbox">
                      <input type="checkbox" checked={headers.malformed} onChange={(event) => setHeaders({ ...headers, malformed: event.target.checked })} />
                      Malformed
                    </label>
                    <label className="checkbox">
                      <input type="checkbox" checked={headers.empty} onChange={(event) => setHeaders({ ...headers, empty: event.target.checked })} />
                      Empty
                    </label>
                  </div>
                </article>
              </div>
            </Panel>

            <Panel title="Mermaid preview" subtitle="Preview generated engineering diagrams in the same console.">
              <textarea value={diagramSource} onChange={(event) => setDiagramSource(event.target.value)} rows={10} />
              <div className="mermaid-preview" dangerouslySetInnerHTML={{ __html: diagramSvg }} />
            </Panel>

            <Panel title="Last payload" subtitle="Useful while verifying mock endpoints and proxy behavior.">
              <JsonViewer value={apiResponse ?? toolResponse} />
            </Panel>
          </div>
        ) : null}
      </main>
    </div>
  );
}

export default App;
