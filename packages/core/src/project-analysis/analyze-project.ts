import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import type { ProjectAnalysis } from "../schemas/types.js";
import { nowTimestamp } from "../time.js";

const ignoredDirectories = new Set([
  ".git",
  ".mental",
  ".codex-tmp",
  "node_modules",
  "dist",
  "build",
  ".vite",
  "coverage"
]);

const sourceDirectoryNames = new Set(["src", "app", "apps", "packages", "lib", "server", "client", "tests"]);
const docFileNames = new Set(["README.md", "AGENTS.md", "package.json", "Makefile", "justfile", "Taskfile.yml"]);
const lockFileNames = new Set(["package-lock.json", "pnpm-lock.yaml", "yarn.lock", "bun.lockb"]);

export async function analyzeProject(projectRoot: string, timestamp = nowTimestamp()): Promise<ProjectAnalysis> {
  const root = path.resolve(projectRoot);
  const entries = await readdir(root, { withFileTypes: true });
  const topLevelDirectories = entries
    .filter((entry) => entry.isDirectory() && !ignoredDirectories.has(entry.name))
    .map((entry) => entry.name)
    .sort();
  const docs = entries
    .filter((entry) => entry.isFile() && docFileNames.has(entry.name))
    .map((entry) => entry.name)
    .sort();
  const lockfiles = entries
    .filter((entry) => entry.isFile() && lockFileNames.has(entry.name))
    .map((entry) => entry.name)
    .sort();
  const sourceDirectories = topLevelDirectories.filter((name) => sourceDirectoryNames.has(name));
  const packageJson = await readPackageJson(root);
  const fileExtensionCounts = await countFileExtensions(root);
  const inferredStack = inferStack({ packageJson, lockfiles, fileExtensionCounts, sourceDirectories });
  const projectName = packageJson?.name ?? path.basename(root);

  return {
    version: 1,
    analyzed_at: timestamp,
    project_root: root,
    project_name: projectName,
    package_manager: inferPackageManager(packageJson?.packageManager, lockfiles),
    package_name: packageJson?.name,
    package_scripts: Object.keys(packageJson?.scripts ?? {}).sort(),
    workspaces: normalizeWorkspaces(packageJson?.workspaces),
    lockfiles,
    top_level_directories: topLevelDirectories,
    docs,
    source_directories: sourceDirectories,
    file_extension_counts: fileExtensionCounts,
    inferred_stack: inferredStack,
    summary: summarizeProject(projectName, inferredStack, sourceDirectories, docs)
  };
}

async function readPackageJson(projectRoot: string): Promise<Record<string, any> | undefined> {
  try {
    return JSON.parse(await readFile(path.join(projectRoot, "package.json"), "utf8")) as Record<string, any>;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return undefined;
    }
    throw error;
  }
}

async function countFileExtensions(projectRoot: string): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  let visited = 0;

  async function walk(directory: string): Promise<void> {
    if (visited >= 3000) {
      return;
    }
    const entries = await readdir(directory, { withFileTypes: true });
    for (const entry of entries) {
      if (visited >= 3000) {
        return;
      }
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        if (!ignoredDirectories.has(entry.name)) {
          await walk(fullPath);
        }
        continue;
      }
      if (!entry.isFile()) {
        continue;
      }
      visited += 1;
      const extension = path.extname(entry.name).toLowerCase() || "[no_ext]";
      counts[extension] = (counts[extension] ?? 0) + 1;
    }
  }

  await walk(projectRoot);
  return Object.fromEntries(Object.entries(counts).sort((a, b) => b[1] - a[1]));
}

function inferPackageManager(packageManager: unknown, lockfiles: string[]): string | undefined {
  if (typeof packageManager === "string" && packageManager.length > 0) {
    return packageManager;
  }
  if (lockfiles.includes("pnpm-lock.yaml")) {
    return "pnpm";
  }
  if (lockfiles.includes("yarn.lock")) {
    return "yarn";
  }
  if (lockfiles.includes("bun.lockb")) {
    return "bun";
  }
  if (lockfiles.includes("package-lock.json")) {
    return "npm";
  }
  return undefined;
}

function normalizeWorkspaces(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string").sort();
  }
  if (value && typeof value === "object" && Array.isArray((value as { packages?: unknown }).packages)) {
    return (value as { packages: unknown[] }).packages
      .filter((item): item is string => typeof item === "string")
      .sort();
  }
  return [];
}

function inferStack(input: {
  packageJson?: Record<string, any>;
  lockfiles: string[];
  fileExtensionCounts: Record<string, number>;
  sourceDirectories: string[];
}): string[] {
  const stack = new Set<string>();
  const dependencies = {
    ...(input.packageJson?.dependencies ?? {}),
    ...(input.packageJson?.devDependencies ?? {})
  };
  if (input.fileExtensionCounts[".ts"] || input.fileExtensionCounts[".tsx"]) {
    stack.add("TypeScript");
  }
  if (dependencies.react) {
    stack.add("React");
  }
  if (dependencies.vite || input.packageJson?.scripts?.dev?.includes?.("vite")) {
    stack.add("Vite");
  }
  if (dependencies.electron) {
    stack.add("Electron");
  }
  if (input.lockfiles.length > 0 || input.packageJson) {
    stack.add("Node.js");
  }
  if (input.sourceDirectories.includes("apps") || input.sourceDirectories.includes("packages")) {
    stack.add("Monorepo");
  }
  return [...stack].sort();
}

function summarizeProject(projectName: string, stack: string[], sourceDirectories: string[], docs: string[]): string {
  const stackText = stack.length > 0 ? stack.join(", ") : "unknown stack";
  const sourceText = sourceDirectories.length > 0 ? sourceDirectories.join(", ") : "no obvious source directories";
  const docsText = docs.length > 0 ? docs.join(", ") : "no root docs detected";
  return `${projectName}: ${stackText}; source directories: ${sourceText}; docs: ${docsText}.`;
}

