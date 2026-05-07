import { describe, expect, it } from "vitest";
import { startMockFixture } from "../helpers/mockServer.js";

describe("mock DeltaV Edge API", () => {
  it("serves the web UI home page and built static assets", async () => {
    const { baseUrl } = await startMockFixture();
    const rootResponse = await fetch(baseUrl.replace("/edge/", "/"));
    const html = await rootResponse.text();
    const assetMatch = html.match(/src="([^"]+assets[^"]+\.js)"/);

    expect(rootResponse.status).toBe(200);
    expect(html).toContain("Mock DeltaV Edge UI");
    expect(assetMatch).not.toBeNull();

    const assetResponse = await fetch(`${baseUrl.replace("/edge/", "")}${assetMatch?.[1] ?? ""}`);
    expect(assetResponse.status).toBe(200);
  });

  it("serves the health endpoint", async () => {
    const { baseUrl } = await startMockFixture();
    const response = await fetch(baseUrl.replace("/edge/", "/health"));
    expect(response.status).toBe(200);
  });

  it("returns an auth token", async () => {
    const { baseUrl } = await startMockFixture();
    const response = await fetch(`${baseUrl}api/v1/Login/GetAuthToken/profile`, {
      method: "POST",
      body: new URLSearchParams({ username: "demo", password: "demo" }),
    });
    const payload = await response.json();
    expect(payload.access_token).toContain("mock-token:");
  });

  it("rejects invalid tokens", async () => {
    const { baseUrl } = await startMockFixture();
    const response = await fetch(`${baseUrl}api/v1/graph`, {
      headers: {
        authorization: "Bearer invalid-token",
      },
    });
    expect(response.status).toBe(401);
  });

  it("supports graph lookup by id and path", async () => {
    const { baseUrl } = await startMockFixture();
    const auth = await fetch(`${baseUrl}api/v1/Login/GetAuthToken/profile`, { method: "POST" });
    const { access_token } = await auth.json();
    const byId = await fetch(`${baseUrl}api/v1/graph/PID-101?p=PV,SP`, {
      headers: { authorization: `Bearer ${access_token}` },
    });
    const byPath = await fetch(
      `${baseUrl}api/v1/graph?path=DemoDeltaVSystem/AREA_A/UNIT_100/PID-101`,
      {
        headers: { authorization: `Bearer ${access_token}` },
      },
    );
    expect((await byId.json()).id).toBe("PID-101");
    expect((await byPath.json()).results).toHaveLength(1);
  });

  it("serves metadata used by the UI hierarchy and explorer views", async () => {
    const { baseUrl } = await startMockFixture();
    const statusResponse = await fetch(`${baseUrl.replace("/edge/", "")}/api/mock-ui/status`);
    const statusPayload = await statusResponse.json();
    const graphAuth = await fetch(`${baseUrl}api/v1/Login/GetAuthToken/profile`, { method: "POST" });
    const { access_token } = await graphAuth.json();
    const graphResponse = await fetch(`${baseUrl}api/v1/graph`, {
      headers: { authorization: `Bearer ${access_token}` },
    });
    const graphPayload = await graphResponse.json();

    expect(statusPayload.uiEnabled).toBe(true);
    expect(statusPayload.endpoints).toContain("GET /edge/api/v1/graph");
    expect(graphPayload.results.length).toBeGreaterThan(0);
  });

  it("supports history query and aggregation", async () => {
    const { baseUrl } = await startMockFixture();
    const auth = await fetch(`${baseUrl}api/v1/Login/GetAuthToken/profile`, { method: "POST" });
    const { access_token } = await auth.json();
    const response = await fetch(
      `${baseUrl}api/v1/history/PID1%2FPV?StartTime=2026-05-06T11:00:00.000Z&EndTime=2026-05-06T12:00:00.000Z&PS=10&Aggregation=Average`,
      {
        headers: { authorization: `Bearer ${access_token}` },
      },
    );
    const payload = await response.json();
    expect(payload.values).toHaveLength(10);
    expect(payload.aggregateValue).not.toBeNull();
  });

  it("filters alarms/events and batch events with pagination", async () => {
    const { baseUrl } = await startMockFixture();
    const auth = await fetch(`${baseUrl}api/v1/Login/GetAuthToken/profile`, { method: "POST" });
    const { access_token } = await auth.json();
    const alarms = await fetch(`${baseUrl}api/v1/ae?area=AREA_A&PS=2&PN=1`, {
      headers: { authorization: `Bearer ${access_token}` },
    });
    const batches = await fetch(`${baseUrl}api/v1/batchevent?recipe=RECIPE_A&PS=2&PN=1`, {
      headers: { authorization: `Bearer ${access_token}` },
    });
    expect((await alarms.json()).pageSize).toBe(2);
    expect((await batches.json()).records.length).toBeGreaterThan(0);
  });

  it("supports error simulation and malformed responses", async () => {
    const { baseUrl } = await startMockFixture();
    const auth = await fetch(`${baseUrl}api/v1/Login/GetAuthToken/profile`, { method: "POST" });
    const { access_token } = await auth.json();
    const errorResponse = await fetch(`${baseUrl}api/v1/graph`, {
      headers: {
        authorization: `Bearer ${access_token}`,
        "x-mock-error": "500",
      },
    });
    const malformedResponse = await fetch(`${baseUrl}api/v1/graph`, {
      headers: {
        authorization: `Bearer ${access_token}`,
        "x-mock-malformed": "true",
      },
    });
    expect(errorResponse.status).toBe(500);
    expect(await malformedResponse.text()).toContain("{ malformed");
  });
});
