import fs from "node:fs/promises";
import path from "node:path";
import { ValidationError } from "../utils/errors.js";

export interface PackageFiles {
  readonly [fileName: string]: string;
}

export interface PackageWriteResult {
  readonly packagePath: string;
  readonly filePaths: readonly string[];
}

export function sanitizePackageName(input: string): string {
  if (input.includes("..") || path.isAbsolute(input) || input.includes("/") || input.includes("\\")) {
    throw new ValidationError("Invalid package name.");
  }

  const sanitized = input.trim().replace(/[^A-Za-z0-9_-]+/g, "-");

  if (!sanitized || sanitized === "-" || sanitized.startsWith(".")) {
    throw new ValidationError("Invalid package name.");
  }

  return sanitized;
}

export function resolveSafePackageDir(baseDir: string, packageName: string): string {
  const safeName = sanitizePackageName(packageName);
  const resolved = path.resolve(baseDir, safeName);

  if (!resolved.startsWith(path.resolve(baseDir))) {
    throw new ValidationError("Package output path escapes the configured output directory.");
  }

  return resolved;
}

export async function writeEngineeringPackage(
  baseDir: string,
  packageName: string,
  files: PackageFiles,
  overwrite = false,
): Promise<PackageWriteResult> {
  const packageDir = resolveSafePackageDir(baseDir, packageName);

  try {
    await fs.mkdir(packageDir, { recursive: false });
  } catch (error) {
    if (!overwrite) {
      throw new ValidationError("Package directory already exists.", { packageDir });
    }

    if (!(error instanceof Error)) {
      throw error;
    }
  }

  const filePaths: string[] = [];
  for (const [fileName, contents] of Object.entries(files)) {
    if (!/^[A-Za-z0-9._-]+$/.test(fileName)) {
      throw new ValidationError("Invalid file name in package contents.", { fileName });
    }

    const targetPath = path.resolve(packageDir, fileName);
    if (!targetPath.startsWith(packageDir)) {
      throw new ValidationError("Package file path escapes the configured output directory.", {
        fileName,
      });
    }

    if (!overwrite) {
      try {
        await fs.access(targetPath);
        throw new ValidationError("Package file already exists.", { fileName });
      } catch (error) {
        if (error instanceof ValidationError) {
          throw error;
        }
      }
    }

    await fs.writeFile(targetPath, contents, "utf8");
    filePaths.push(targetPath);
  }

  return {
    packagePath: packageDir,
    filePaths,
  };
}
