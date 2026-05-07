import fs from "node:fs/promises";
import path from "node:path";
import { uiDistPath } from "../config.js";

const contentTypes: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

export async function hasUiBundle(): Promise<boolean> {
  try {
    await fs.access(uiDistPath("index.html"));
    return true;
  } catch {
    return false;
  }
}

export async function readUiFile(requestPath: string): Promise<{ body: Buffer; contentType: string } | null> {
  const relative = requestPath === "/" ? "index.html" : requestPath.replace(/^\/+/, "");
  const resolved = path.resolve(uiDistPath(), relative);
  if (!resolved.startsWith(uiDistPath())) {
    return null;
  }

  try {
    const body = await fs.readFile(resolved);
    return {
      body,
      contentType: contentTypes[path.extname(resolved)] ?? "application/octet-stream",
    };
  } catch {
    if (path.extname(relative)) {
      return null;
    }

    try {
      const body = await fs.readFile(uiDistPath("index.html"));
      return { body, contentType: contentTypes[".html"] };
    } catch {
      return null;
    }
  }
}
