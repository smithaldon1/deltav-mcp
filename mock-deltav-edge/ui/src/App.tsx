import { useEffect, useMemo, useRef, useState } from "react";
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
  | "status"
  | "explorer"
  | "hierarchy"
  | "history"
  | "alarms"
  | "batch"
  | "scenarios"
  | "errors"
  | "diagrams"
  | "helper";

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
};

type Scenario = {
  name: string;
  description: string;
  relatedModules: string[];
  relatedEventIds: string[];
  relatedHistory: string[];
  expectedInvestigationOutputs: string[];
};

type GraphResponse = {
  results?: GraphNode[];
};

type GraphNode = {
  id: string;
  name: string;
  type: string;
  area?: string | null;
  path: string;
  runtime?: Record<string, unknown>;
  relationships?: Record<string, unknown>;
};

type HistoryResponse = {
  entityId: string;
  start: string;
  end: string;
  values: Array<{ timestamp: string; value: number | null; quality: string }>;
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

type AlarmResponse = {
  page: number;
  pageSize: number;
  total: number;
  records: AlarmRecord[];
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

type BatchResponse = {
  page: number;
  pageSize: number;
  total: number;
  records: BatchRecord[];
};

type ConnectionHelper = {
  envExample: string;
  dockerComposeExample: string;
  mcpClientConfig: Record<string, unknown>;
};

type MockHeaders = {
  errorCode: string;
  delayMs: string;
  malformed: boolean;
  empty: boolean;
};

const navItems: Array<{ key: NavKey; label: string }> = [
  { key: "status", label: "Status" },
  { key: "explorer", label: "API Explorer" },
  { key: "hierarchy", label: "Hierarchy" },
  { key: "history", label: "History" },
  { key: "alarms", label: "Alarms & Events" },
  { key: "batch", label: "Batch Events" },
  { key: "scenarios", label: "Scenarios" },
  { key: "errors", label: "Error Simulation" },
  { key: "diagrams", label: "Mermaid Preview" },
  { key: "helper", label: "MCP Helper" },
];

const graphColumn = createColumnHelper<AlarmRecord>();
const batchColumn = createColumnHelper<BatchRecord>();
const findingColumn = createColumnHelper<{
  severity: string;
  category: string;
  finding: string;
  recommendation: string;
  location?: string;
}>();

const defaultDiagram = `flowchart TD
  PumpSkid["Pump Skid"]
  PumpSkid --> Motor["MTR-201"]
  PumpSkid --> FlowLoop["FIC-201"]
  FlowLoop --> Alarm["Low Flow Trip"]
`;

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

function MetricCard({ label, value, tone = "default" }: { label: string; value: string | number; tone?: "default" | "alert" | "good" }) {
  return (
    <div className={`metric-card metric-card--${tone}`}>
      <div className="metric-card__label">{label}</div>
      <div className="metric-card__value">{value}</div>
    </div>
  );
}

function Panel({
  title,
  subtitle,
  children,
  actions,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
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
          {table.getHeaderGroups().map((group) => (
            <tr key={group.id}>
              {group.headers.map((header) => (
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
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as T;
  }
}

function App() {
  const [nav, setNav] = useState<NavKey>("status");
  const [status, setStatus] = useState<MockStatus | null>(null);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [helper, setHelper] = useState<ConnectionHelper | null>(null);
  const [graph, setGraph] = useState<GraphNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [history, setHistory] = useState<HistoryResponse | null>(null);
  const [trendPack, setTrendPack] = useState<HistoryResponse[]>([]);
  const [alarms, setAlarms] = useState<AlarmRecord[]>([]);
  const [batches, setBatches] = useState<BatchRecord[]>([]);
  const [apiResponse, setApiResponse] = useState<unknown>(null);
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
  const [headers, setHeaders] = useState<MockHeaders>({
    errorCode: "",
    delayMs: "",
    malformed: false,
    empty: false,
  });
  const [samplePath, setSamplePath] = useState("/health");
  const [sampleMethod, setSampleMethod] = useState("GET");
  const [diagramSource, setDiagramSource] = useState(defaultDiagram);
  const [diagramSvg, setDiagramSvg] = useState("");

  useEffect(() => {
    void Promise.all([
      apiFetch<MockStatus>("/api/mock-ui/status", headers).then(setStatus),
      apiFetch<{ scenarios: Scenario[] }>("/api/mock-ui/scenarios", headers).then((data) =>
        setScenarios(data.scenarios),
      ),
      apiFetch<ConnectionHelper>("/api/mock-ui/connection-helper", headers).then(setHelper),
      apiFetch<GraphResponse>("/edge/api/v1/graph", headers).then((data) => {
        setGraph(data.results ?? []);
        setSelectedNode((data.results ?? [])[0] ?? null);
      }),
    ]);
  }, []);

  useEffect(() => {
    mermaid.initialize({ startOnLoad: false, theme: "default" });
    void mermaid.render("diagram-preview", diagramSource).then(({ svg }) => setDiagramSvg(svg));
  }, [diagramSource]);

  useEffect(() => {
    if (!selectedNode) return;
    void apiFetch<GraphNode>(`/edge/api/v1/graph/${encodeURIComponent(selectedNode.id)}?p=1&r=1`, headers).then(
      setSelectedNode,
    );
  }, [selectedNode?.id]);

  const hierarchyFlow = useMemo(() => {
    const nodes: Node[] = graph.map((item, index) => ({
      id: item.id,
      data: { label: `${item.name}\n${item.type}` },
      position: {
        x: (index % 4) * 220,
        y: Math.floor(index / 4) * 120,
      },
      style: {
        background: item.id === selectedNode?.id ? "#d9f7f3" : "#ffffff",
        border: "1px solid #bdd5d1",
        borderRadius: 14,
        fontSize: 12,
        width: 180,
      },
    }));
    const edges: Edge[] = graph.flatMap((item) =>
      ((item.relationships?.Children as string[] | undefined) ?? []).map((child) => ({
        id: `${item.id}-${child}`,
        source: item.id,
        target: child,
        animated: false,
      })),
    );
    return { nodes, edges };
  }, [graph, selectedNode]);

  const relationshipFlow = useMemo(() => {
    if (!selectedNode) return { nodes: [] as Node[], edges: [] as Edge[] };
    const parentIds = ((selectedNode.relationships?.Parents as string[] | undefined) ?? []).slice(0, 2);
    const childIds = ((selectedNode.relationships?.Children as string[] | undefined) ?? []).slice(0, 4);
    const nodes: Node[] = [
      {
        id: selectedNode.id,
        data: { label: selectedNode.name },
        position: { x: 260, y: 120 },
        style: { background: "#d9f7f3", border: "1px solid #7bb7ae", borderRadius: 14, width: 180 },
      },
      ...parentIds.map((parentId, index) => ({
        id: `parent-${parentId}`,
        data: { label: parentId },
        position: { x: 40 + index * 220, y: 20 },
        style: { background: "#fff", border: "1px solid #c9d8d5", borderRadius: 14, width: 180 },
      })),
      ...childIds.map((childId, index) => ({
        id: `child-${childId}`,
        data: { label: childId },
        position: { x: 40 + index * 180, y: 250 },
        style: { background: "#fff", border: "1px solid #c9d8d5", borderRadius: 14, width: 160 },
      })),
    ];
    const edges: Edge[] = [
      ...parentIds.map((parentId) => ({
        id: `${parentId}-to-${selectedNode.id}`,
        source: `parent-${parentId}`,
        target: selectedNode.id,
      })),
      ...childIds.map((childId) => ({
        id: `${selectedNode.id}-to-${childId}`,
        source: selectedNode.id,
        target: `child-${childId}`,
      })),
    ];
    return { nodes, edges };
  }, [selectedNode]);

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
              areaStyle: { opacity: 0.15 },
              data: history.values.map((value) => value.value),
            },
          ],
        }
      : null,
  );

  const trendPackChartRef = useChart(
    trendPack.length > 0
      ? {
          tooltip: { trigger: "axis" },
          legend: { top: 0 },
          xAxis: {
            type: "category",
            data: trendPack[0]?.values.map((value) => value.timestamp.slice(11, 16)) ?? [],
          },
          yAxis: { type: "value" },
          series: trendPack.map((series) => ({
            type: "line",
            name: series.entityId,
            smooth: true,
            data: series.values.map((value) => value.value),
          })),
        }
      : null,
  );

  const alarmChartRef = useChart(
    alarms.length > 0
      ? {
          tooltip: { trigger: "item" },
          series: [
            {
              type: "pie",
              radius: ["42%", "70%"],
              data: Array.from(
                alarms.reduce((map, item) => {
                  const key = item.priority ?? "UNSPECIFIED";
                  map.set(key, (map.get(key) ?? 0) + 1);
                  return map;
                }, new Map<string, number>()),
              ).map(([name, value]) => ({ name, value })),
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
              name: "Events",
              data: Array.from(new Set(batches.map((item) => item.batchId))).map(
                (batchId) => batches.filter((item) => item.batchId === batchId).length,
              ),
            },
          ],
        }
      : null,
  );

  const alarmColumns = useMemo(
    () => [
      graphColumn.accessor("timestamp", { header: "Timestamp" }),
      graphColumn.accessor((row) => row.module ?? row.entityId ?? "-", {
        id: "module",
        header: "Module",
      }),
      graphColumn.accessor((row) => row.priority ?? "-", { id: "priority", header: "Priority" }),
      graphColumn.accessor((row) => row.eventType ?? "-", { id: "eventType", header: "Type" }),
      graphColumn.accessor("message", { header: "Message" }),
      graphColumn.accessor((row) => row.state ?? "-", { id: "state", header: "State" }),
    ],
    [],
  );

  const batchColumns = useMemo(
    () => [
      batchColumn.accessor("timestamp", { header: "Timestamp" }),
      batchColumn.accessor("batchId", { header: "Batch ID" }),
      batchColumn.accessor("recipe", { header: "Recipe" }),
      batchColumn.accessor("unit", { header: "Unit" }),
      batchColumn.accessor("phase", { header: "Phase" }),
      batchColumn.accessor("eventType", { header: "Event" }),
      batchColumn.accessor("status", { header: "Status" }),
      batchColumn.accessor("message", { header: "Message" }),
    ],
    [],
  );

  const findingColumns = useMemo(
    () => [
      findingColumn.accessor("severity", { header: "Severity" }),
      findingColumn.accessor("category", { header: "Category" }),
      findingColumn.accessor("finding", { header: "Finding" }),
      findingColumn.accessor("recommendation", { header: "Recommendation" }),
      findingColumn.accessor((row) => row.location ?? "-", { id: "location", header: "Location" }),
    ],
    [],
  );

  const validationFindings = useMemo(
    () => [
      {
        severity: "warning",
        category: "operator_actions",
        finding: "Operator action for low-flow trip requires clearer escalation guidance.",
        recommendation: "Add who responds and when to escalate to maintenance.",
        location: "alarm_list.json:FIC-201",
      },
      {
        severity: "error",
        category: "reset",
        finding: "Interlock reset behavior is not fully defined for held phase recovery.",
        recommendation: "Document reviewed reset sequence before release.",
        location: "interlock_matrix.json:PHASE_HEATUP",
      },
    ],
    [],
  );

  const sampleCurl = useMemo(() => {
    const headersPart = [
      headers.errorCode ? `-H "x-mock-error: ${headers.errorCode}"` : "",
      headers.delayMs ? `-H "x-mock-delay-ms: ${headers.delayMs}"` : "",
      headers.malformed ? `-H "x-mock-malformed: true"` : "",
      headers.empty ? `-H "x-mock-empty: true"` : "",
    ]
      .filter(Boolean)
      .join(" ");
    return `curl -X ${sampleMethod} http://localhost:8080${samplePath} ${headersPart}`.trim();
  }, [headers, sampleMethod, samplePath]);

  async function runApiSample() {
    const result = await apiFetch<unknown>(samplePath, headers, sampleMethod);
    setApiResponse(result);
  }

  async function loadHistory() {
    const result = await apiFetch<HistoryResponse>(
      `/edge/api/v1/history/${encodeURIComponent(historyParam)}?StartTime=${new Date(historyStart).toISOString()}&EndTime=${new Date(historyEnd).toISOString()}&PS=32&Aggregation=${historyAggregation}`,
      headers,
    );
    setHistory(result);
  }

  async function loadTrendPack() {
    const ids = ["PID1/PV", "PID1/OUT", "TIC-301/PV"];
    const results = await Promise.all(
      ids.map((id) =>
        apiFetch<HistoryResponse>(
          `/edge/api/v1/history/${encodeURIComponent(id)}?StartTime=${new Date(historyStart).toISOString()}&EndTime=${new Date(historyEnd).toISOString()}&PS=24&Aggregation=Average`,
          headers,
        ),
      ),
    );
    setTrendPack(results);
  }

  async function loadAlarms() {
    const query = new URLSearchParams({
      StartTime: new Date(alarmFilters.start).toISOString(),
      EndTime: new Date(alarmFilters.end).toISOString(),
      PS: "100",
      PN: "1",
    });
    if (alarmFilters.area) query.set("area", alarmFilters.area);
    if (alarmFilters.module) query.set("module", alarmFilters.module);
    if (alarmFilters.priority) query.set("priority", alarmFilters.priority);
    if (alarmFilters.eventType) query.set("eventType", alarmFilters.eventType);
    const response = await apiFetch<AlarmResponse>(`/edge/api/v1/ae?${query.toString()}`, headers);
    setAlarms(response.records);
  }

  async function loadBatches() {
    const query = new URLSearchParams({
      StartTime: new Date(batchFilters.start).toISOString(),
      EndTime: new Date(batchFilters.end).toISOString(),
      PS: "100",
      PN: "1",
    });
    if (batchFilters.batchId) query.set("batchId", batchFilters.batchId);
    if (batchFilters.recipe) query.set("recipe", batchFilters.recipe);
    if (batchFilters.unit) query.set("unit", batchFilters.unit);
    if (batchFilters.phase) query.set("phase", batchFilters.phase);
    const response = await apiFetch<BatchResponse>(
      `/edge/api/v1/batchevent?${query.toString()}`,
      headers,
    );
    setBatches(response.records);
  }

  useEffect(() => {
    void loadHistory();
    void loadTrendPack();
    void loadAlarms();
    void loadBatches();
  }, []);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar__brand">
          <div className="sidebar__eyebrow">Development Only</div>
          <h1>Mock DeltaV Edge</h1>
          <p>Engineering test bench for the simulated API.</p>
        </div>
        <nav className="sidebar__nav">
          {navItems.map((item) => (
            <button
              key={item.key}
              className={nav === item.key ? "nav-button nav-button--active" : "nav-button"}
              onClick={() => setNav(item.key)}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="sidebar__footer">
          <span>Base URL</span>
          <strong>{status?.baseUrl ?? "loading..."}</strong>
        </div>
      </aside>
      <main className="content">
        <header className="content__header">
          <div>
            <p className="content__kicker">Mock API Web UI</p>
            <h2>{navItems.find((item) => item.key === nav)?.label}</h2>
          </div>
          <div className="header-badges">
            <span className="pill">Auth {status?.authEnabled ? "Enabled" : "Off"}</span>
            <span className="pill">Mode {status?.mockMode ?? "..."}</span>
          </div>
        </header>

        {nav === "status" && status ? (
          <div className="page-grid">
            <Panel title="Mock API Status" subtitle="Confirm the mock service, base URL, and demo landscape.">
              <div className="metrics-row">
                <MetricCard label="UI Status" value={status.status} tone="good" />
                <MetricCard label="Base URL" value={status.baseUrl} />
                <MetricCard label="Health Endpoint" value={status.healthEndpoint} />
                <MetricCard label="Demo Systems" value={status.systems.length} />
              </div>
              <div className="detail-grid">
                <div>
                  <h3>Available Demo Systems</h3>
                  <ul className="bulleted-list">
                    {status.systems.map((system) => (
                      <li key={system.name}>
                        <strong>{system.name}</strong>
                        <span>{system.summary}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3>Available Endpoints</h3>
                  <ul className="endpoint-list">
                    {status.endpoints.map((endpoint) => (
                      <li key={endpoint}>{endpoint}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </Panel>
            <Panel title="Hierarchy Graph" subtitle="System to parameter relationships used by the UI and MCP server.">
              <div className="canvas-panel">
                <ReactFlow
                  nodes={hierarchyFlow.nodes}
                  edges={hierarchyFlow.edges}
                  fitView
                  onNodeClick={(_, node) => {
                    const match = graph.find((item) => item.id === node.id);
                    if (match) setSelectedNode(match);
                  }}
                >
                  <Background />
                  <MiniMap />
                  <Controls />
                </ReactFlow>
              </div>
            </Panel>
          </div>
        ) : null}

        {nav === "explorer" ? (
          <div className="page-grid">
            <Panel
              title="API Explorer"
              subtitle="Run sample requests from the browser and inspect formatted responses."
              actions={<button className="primary-button" onClick={runApiSample}>Run Request</button>}
            >
              <div className="form-grid">
                <label>
                  Method
                  <select value={sampleMethod} onChange={(event) => setSampleMethod(event.target.value)}>
                    <option>GET</option>
                    <option>POST</option>
                  </select>
                </label>
                <label className="form-grid__wide">
                  Path
                  <select value={samplePath} onChange={(event) => setSamplePath(event.target.value)}>
                    <option value="/health">/health</option>
                    <option value="/api/mock-ui/status">/api/mock-ui/status</option>
                    <option value="/edge/api/v1/graph">/edge/api/v1/graph</option>
                    <option value="/edge/api/v1/graph/PID-101?p=1&r=1">/edge/api/v1/graph/PID-101?p=1&r=1</option>
                    <option value="/edge/api/v1/history/PID1%2FPV?StartTime=2026-05-06T11:00:00.000Z&EndTime=2026-05-06T12:00:00.000Z&PS=16&Aggregation=Average">History sample</option>
                    <option value="/edge/api/v1/ae?area=AREA_A&PS=10&PN=1">Alarms sample</option>
                    <option value="/edge/api/v1/batchevent?recipe=RECIPE_A&PS=10&PN=1">Batch sample</option>
                  </select>
                </label>
              </div>
              <h3>cURL Example</h3>
              <CodeBlock value={sampleCurl} />
              <button className="ghost-button" onClick={() => navigator.clipboard.writeText(sampleCurl)}>
                Copy cURL
              </button>
            </Panel>
            <Panel title="Response" subtitle="Formatted JSON response from the selected endpoint.">
              <JsonViewer value={apiResponse ?? { note: "Run a sample request." }} />
            </Panel>
          </div>
        ) : null}

        {nav === "hierarchy" ? (
          <div className="page-grid">
            <Panel title="Hierarchy Browser" subtitle="Browse system, area, unit, module, and parameter relationships.">
              <div className="canvas-panel canvas-panel--large">
                <ReactFlow
                  nodes={hierarchyFlow.nodes}
                  edges={hierarchyFlow.edges}
                  fitView
                  onNodeClick={(_, node) => {
                    const match = graph.find((item) => item.id === node.id);
                    if (match) setSelectedNode(match);
                  }}
                >
                  <Background />
                  <MiniMap />
                  <Controls />
                </ReactFlow>
              </div>
            </Panel>
            <Panel title="Node Detail" subtitle="Inspect selected mock entity metadata, runtime values, and relationships.">
              {selectedNode ? <JsonViewer value={selectedNode} /> : <p>Select a node.</p>}
            </Panel>
            <Panel title="Module Relationship View" subtitle="Selected module with parents and children using React Flow.">
              <div className="canvas-panel">
                <ReactFlow nodes={relationshipFlow.nodes} edges={relationshipFlow.edges} fitView>
                  <Background />
                  <Controls />
                </ReactFlow>
              </div>
            </Panel>
          </div>
        ) : null}

        {nav === "history" ? (
          <div className="page-grid">
            <Panel title="History Viewer" subtitle="Query deterministic mock history and aggregation behavior." actions={<button className="primary-button" onClick={loadHistory}>Load History</button>}>
              <div className="form-grid">
                <label>
                  Parameter
                  <select value={historyParam} onChange={(event) => setHistoryParam(event.target.value)}>
                    <option value="PID1/PV">PID1/PV</option>
                    <option value="PID1/OUT">PID1/OUT</option>
                    <option value="FIC-201/PV">FIC-201/PV</option>
                    <option value="TIC-301/PV">TIC-301/PV</option>
                  </select>
                </label>
                <label>
                  StartTime
                  <input type="datetime-local" value={historyStart} onChange={(event) => setHistoryStart(event.target.value)} />
                </label>
                <label>
                  EndTime
                  <input type="datetime-local" value={historyEnd} onChange={(event) => setHistoryEnd(event.target.value)} />
                </label>
                <label>
                  Aggregation
                  <select value={historyAggregation} onChange={(event) => setHistoryAggregation(event.target.value)}>
                    {["Average", "Minimum", "Maximum", "Count", "Start", "End", "Range", "Interpolative"].map((value) => (
                      <option key={value}>{value}</option>
                    ))}
                  </select>
                </label>
              </div>
              <div ref={historyChartRef} className="chart-panel" />
              <JsonViewer value={history} />
            </Panel>
            <Panel title="Trend Pack Viewer" subtitle="Multiple related traces for abnormal-event investigation." actions={<button className="ghost-button" onClick={loadTrendPack}>Load Trend Pack</button>}>
              <div ref={trendPackChartRef} className="chart-panel" />
              <div className="metrics-row">
                {trendPack.map((series) => (
                  <MetricCard
                    key={series.entityId}
                    label={series.entityId}
                    value={series.values.filter((point) => point.quality === "GOOD").length}
                  />
                ))}
              </div>
            </Panel>
          </div>
        ) : null}

        {nav === "alarms" ? (
          <div className="page-grid">
            <Panel title="Alarms & Events Viewer" subtitle="Filter and inspect mock alarm/event records." actions={<button className="primary-button" onClick={loadAlarms}>Load Records</button>}>
              <div className="form-grid">
                <label>
                  Area
                  <input value={alarmFilters.area} onChange={(event) => setAlarmFilters({ ...alarmFilters, area: event.target.value })} />
                </label>
                <label>
                  Module
                  <input value={alarmFilters.module} onChange={(event) => setAlarmFilters({ ...alarmFilters, module: event.target.value })} />
                </label>
                <label>
                  Priority
                  <input value={alarmFilters.priority} onChange={(event) => setAlarmFilters({ ...alarmFilters, priority: event.target.value })} />
                </label>
                <label>
                  Event Type
                  <input value={alarmFilters.eventType} onChange={(event) => setAlarmFilters({ ...alarmFilters, eventType: event.target.value })} />
                </label>
                <label>
                  StartTime
                  <input type="datetime-local" value={alarmFilters.start} onChange={(event) => setAlarmFilters({ ...alarmFilters, start: event.target.value })} />
                </label>
                <label>
                  EndTime
                  <input type="datetime-local" value={alarmFilters.end} onChange={(event) => setAlarmFilters({ ...alarmFilters, end: event.target.value })} />
                </label>
              </div>
              <DataTable
                data={alarms}
                columns={alarmColumns}
                rowClassName={(row) =>
                  [row.active ? "row--active" : "", row.acknowledged ? "row--ack" : "", /trip|interlock/i.test(row.message) ? "row--trip" : ""]
                    .filter(Boolean)
                    .join(" ")
                }
              />
            </Panel>
            <Panel title="Alarm Analytics" subtitle="Priority distribution and nuisance-oriented visual context.">
              <div ref={alarmChartRef} className="chart-panel" />
              <div className="metrics-row">
                <MetricCard label="Active" value={alarms.filter((item) => item.active).length} tone="alert" />
                <MetricCard label="Acknowledged" value={alarms.filter((item) => item.acknowledged).length} />
                <MetricCard label="Return to Normal" value={alarms.filter((item) => item.returnToNormalTime).length} tone="good" />
              </div>
            </Panel>
          </div>
        ) : null}

        {nav === "batch" ? (
          <div className="page-grid">
            <Panel title="Batch Event Viewer" subtitle="Filter and inspect mock batch timelines." actions={<button className="primary-button" onClick={loadBatches}>Load Batch Events</button>}>
              <div className="form-grid">
                <label>
                  Batch ID
                  <input value={batchFilters.batchId} onChange={(event) => setBatchFilters({ ...batchFilters, batchId: event.target.value })} />
                </label>
                <label>
                  Recipe
                  <input value={batchFilters.recipe} onChange={(event) => setBatchFilters({ ...batchFilters, recipe: event.target.value })} />
                </label>
                <label>
                  Unit
                  <input value={batchFilters.unit} onChange={(event) => setBatchFilters({ ...batchFilters, unit: event.target.value })} />
                </label>
                <label>
                  Phase
                  <input value={batchFilters.phase} onChange={(event) => setBatchFilters({ ...batchFilters, phase: event.target.value })} />
                </label>
                <label>
                  StartTime
                  <input type="datetime-local" value={batchFilters.start} onChange={(event) => setBatchFilters({ ...batchFilters, start: event.target.value })} />
                </label>
                <label>
                  EndTime
                  <input type="datetime-local" value={batchFilters.end} onChange={(event) => setBatchFilters({ ...batchFilters, end: event.target.value })} />
                </label>
              </div>
              <DataTable data={batches} columns={batchColumns} />
            </Panel>
            <Panel title="Batch Comparison" subtitle="Compare successful vs failed batch event counts by batch ID.">
              <div ref={batchChartRef} className="chart-panel" />
            </Panel>
          </div>
        ) : null}

        {nav === "scenarios" ? (
          <div className="page-grid">
            <Panel title="Failure Scenario Browser" subtitle="Mock investigation scenarios and their expected evidence.">
              <div className="scenario-grid">
                {scenarios.map((scenario) => (
                  <article key={scenario.name} className="scenario-card">
                    <h3>{scenario.name}</h3>
                    <p>{scenario.description}</p>
                    <div className="scenario-section">
                      <span>Modules</span>
                      <div className="tag-row">
                        {scenario.relatedModules.map((item) => (
                          <span key={item} className="tag">{item}</span>
                        ))}
                      </div>
                    </div>
                    <div className="scenario-section">
                      <span>Expected Investigation Output</span>
                      <ul className="bulleted-list">
                        {scenario.expectedInvestigationOutputs.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </article>
                ))}
              </div>
            </Panel>
            <Panel title="Validation Findings View" subtitle="Example structured review findings displayed with the same table model used by engineering tools.">
              <DataTable data={validationFindings} columns={findingColumns} />
            </Panel>
          </div>
        ) : null}

        {nav === "errors" ? (
          <div className="page-grid">
            <Panel title="Error Simulation Panel" subtitle="Toggle the same headers used by tests and API explorer.">
              <div className="form-grid">
                <label>
                  x-mock-error
                  <select value={headers.errorCode} onChange={(event) => setHeaders({ ...headers, errorCode: event.target.value })}>
                    <option value="">None</option>
                    {["401", "403", "404", "408", "429", "500"].map((value) => (
                      <option key={value} value={value}>{value}</option>
                    ))}
                  </select>
                </label>
                <label>
                  x-mock-delay-ms
                  <input value={headers.delayMs} onChange={(event) => setHeaders({ ...headers, delayMs: event.target.value })} placeholder="2000" />
                </label>
                <label className="checkbox">
                  <input type="checkbox" checked={headers.malformed} onChange={(event) => setHeaders({ ...headers, malformed: event.target.checked })} />
                  x-mock-malformed
                </label>
                <label className="checkbox">
                  <input type="checkbox" checked={headers.empty} onChange={(event) => setHeaders({ ...headers, empty: event.target.checked })} />
                  x-mock-empty
                </label>
              </div>
              <JsonViewer
                value={{
                  headers: {
                    ...(headers.errorCode ? { "x-mock-error": headers.errorCode } : {}),
                    ...(headers.delayMs ? { "x-mock-delay-ms": headers.delayMs } : {}),
                    ...(headers.malformed ? { "x-mock-malformed": "true" } : {}),
                    ...(headers.empty ? { "x-mock-empty": "true" } : {}),
                  },
                }}
              />
            </Panel>
          </div>
        ) : null}

        {nav === "diagrams" ? (
          <div className="page-grid">
            <Panel title="Mermaid Diagram Preview" subtitle="Preview generated engineering diagrams in the browser.">
              <textarea className="diagram-editor" value={diagramSource} onChange={(event) => setDiagramSource(event.target.value)} />
              <div className="mermaid-preview" dangerouslySetInnerHTML={{ __html: diagramSvg }} />
            </Panel>
          </div>
        ) : null}

        {nav === "helper" && helper ? (
          <div className="page-grid">
            <Panel title="MCP Connection Helper" subtitle="Copy the mock connection settings into the MCP server environment.">
              <h3>Example .env</h3>
              <CodeBlock value={helper.envExample} />
              <h3>Docker Compose Connection</h3>
              <CodeBlock value={helper.dockerComposeExample} />
              <h3>Example MCP Client Config</h3>
              <JsonViewer value={helper.mcpClientConfig} />
            </Panel>
          </div>
        ) : null}
      </main>
    </div>
  );
}

export default App;
