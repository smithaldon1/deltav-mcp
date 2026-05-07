import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { fileURLToPath } from "node:url";
import type { MockConfig } from "./config.js";
import { getMockConfig } from "./config.js";
import { validateAuthHeader } from "./middleware/auth.js";
import { sendError } from "./middleware/errorHandler.js";
import { logRequest } from "./middleware/requestLogger.js";
import { handleAlarmsEvents } from "./routes/alarmsEvents.js";
import { handleAuth } from "./routes/auth.js";
import { handleBatchEvents } from "./routes/batchEvents.js";
import { handleGraphCollection, handleGraphEntity } from "./routes/graph.js";
import { handleHealth } from "./routes/health.js";
import { handleHistory } from "./routes/history.js";
import {
  handleUiConnectionHelper,
  handleUiScenarios,
  handleUiStatus,
  handleUiSystems,
} from "./routes/uiMeta.js";
import { MockHttpError } from "./utils/errors.js";
import { readUiFile } from "./utils/static.js";

function writeMalformed(res: ServerResponse): void {
  res.writeHead(200, { "content-type": "application/json" });
  res.end("{ malformed");
}

async function maybeSimulateRequest(url: URL, req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const errorCode = req.headers["x-mock-error"] ?? url.searchParams.get("mockError");
  const delayMs = Number(req.headers["x-mock-delay-ms"] ?? url.searchParams.get("mockDelayMs") ?? "0");
  const malformed = req.headers["x-mock-malformed"] === "true" || url.searchParams.get("mockMalformed") === "true";
  const empty = req.headers["x-mock-empty"] === "true" || url.searchParams.get("mockEmpty") === "true";

  if (delayMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  if (malformed) {
    writeMalformed(res);
    return true;
  }

  if (empty) {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ records: [], results: [], values: [] }));
    return true;
  }

  if (errorCode) {
    throw new MockHttpError(Number(errorCode), `Mock error ${errorCode}.`);
  }

  return false;
}

function requireAuth(req: IncomingMessage): void {
  validateAuthHeader(req);
}

export function createMockServer(config: MockConfig): Server {
  return createServer(async (req, res) => {
    try {
      logRequest(req);
      const requestUrl = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);

      if (requestUrl.pathname === "/health") {
        handleHealth(res);
        return;
      }

      if (requestUrl.pathname === "/api/mock-ui/status") {
        await handleUiStatus(config, res);
        return;
      }

      if (requestUrl.pathname === "/api/mock-ui/scenarios") {
        handleUiScenarios(res);
        return;
      }

      if (requestUrl.pathname === "/api/mock-ui/systems") {
        await handleUiSystems(res);
        return;
      }

      if (requestUrl.pathname === "/api/mock-ui/connection-helper") {
        handleUiConnectionHelper(res);
        return;
      }

      if (await maybeSimulateRequest(requestUrl, req, res)) {
        return;
      }

      if (requestUrl.pathname === `${config.basePath}/Login/GetAuthToken/profile`) {
        await handleAuth(req, res);
        return;
      }

      if (requestUrl.pathname === `${config.basePath}/Login/GetAuthToken/activedirectory`) {
        await handleAuth(req, res);
        return;
      }

      if (!requestUrl.pathname.startsWith(config.basePath)) {
        const uiFile = await readUiFile(requestUrl.pathname);
        if (uiFile) {
          res.writeHead(200, { "content-type": uiFile.contentType });
          res.end(uiFile.body);
          return;
        }
      }

      requireAuth(req);

      if (requestUrl.pathname === `${config.basePath}/graph`) {
        handleGraphCollection(requestUrl, res);
        return;
      }

      if (requestUrl.pathname.startsWith(`${config.basePath}/graph/`)) {
        handleGraphEntity(
          requestUrl,
          decodeURIComponent(requestUrl.pathname.slice(`${config.basePath}/graph/`.length)),
          res,
        );
        return;
      }

      if (requestUrl.pathname === `${config.basePath}/history`) {
        handleHistory(requestUrl, res);
        return;
      }

      if (requestUrl.pathname.startsWith(`${config.basePath}/history/`)) {
        handleHistory(
          requestUrl,
          res,
          decodeURIComponent(requestUrl.pathname.slice(`${config.basePath}/history/`.length)),
        );
        return;
      }

      if (requestUrl.pathname === `${config.basePath}/ae`) {
        handleAlarmsEvents(requestUrl, res);
        return;
      }

      if (requestUrl.pathname === `${config.basePath}/batchevent`) {
        handleBatchEvents(requestUrl, res);
        return;
      }

      throw new MockHttpError(404, "Route not found.");
    } catch (error) {
      sendError(res, error);
    }
  });
}

export async function startMockServer(config: MockConfig = getMockConfig()): Promise<Server> {
  const server = createMockServer(config);
  await new Promise<void>((resolve) => server.listen(config.port, config.host, () => resolve()));
  return server;
}

const executedPath = process.argv[1];
if (executedPath && fileURLToPath(import.meta.url) === executedPath) {
  const config = getMockConfig();
  const server = await startMockServer(config);
  server.on("listening", () => {
    console.log(
      `[mock-deltav-edge] listening on http://${config.host}:${config.port}${config.basePath}`,
    );
  });
}
