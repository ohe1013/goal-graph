import { stat } from "node:fs/promises";
import path from "node:path";

export async function findProjectRoot(start = process.cwd()): Promise<string> {
  let current = path.resolve(start);

  while (true) {
    if ((await exists(path.join(current, ".mental"))) || (await exists(path.join(current, "AGENTS.md")))) {
      return current;
    }

    const parent = path.dirname(current);
    if (parent === current) {
      return path.resolve(start);
    }
    current = parent;
  }
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await stat(filePath);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return false;
    }
    throw error;
  }
}

