import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const targetDir = path.join(root, "apps", "web", "public");
const files = ["mindmap.graph.json", "question-log.jsonl", "direction-history.jsonl"];

await mkdir(targetDir, { recursive: true });
for (const file of files) {
  const source = path.join(root, ".mental", file);
  const target = path.join(targetDir, file);
  await copyFile(source, target);
  console.log(`Synced ${path.relative(root, source)} -> ${path.relative(root, target)}`);
}
