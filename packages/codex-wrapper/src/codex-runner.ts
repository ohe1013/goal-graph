import { spawn } from "node:child_process";

export interface PreparedCodexTask {
  mode: "prepared_prompt";
  prompt: string;
}

export function prepareCodexTask(prompt: string): PreparedCodexTask {
  return {
    mode: "prepared_prompt",
    prompt
  };
}

export type CodexCliMode = "interactive" | "exec";

export interface BuildCodexCliArgsInput {
  mode: CodexCliMode;
  projectRoot: string;
  prompt: string;
}

export interface RunCodexCliInput extends BuildCodexCliArgsInput {
  command?: string;
}

export interface RunCodexCliResult {
  command: string;
  args: string[];
  exitCode: number | null;
}

export function buildCodexCliArgs(input: BuildCodexCliArgsInput): string[] {
  if (input.mode === "exec") {
    return ["exec", "--cd", input.projectRoot, input.prompt];
  }
  return ["--cd", input.projectRoot, input.prompt];
}

export async function runCodexCli(input: RunCodexCliInput): Promise<RunCodexCliResult> {
  const command = input.command ?? "codex";
  const args = buildCodexCliArgs(input);
  const child = spawn(command, args, {
    cwd: input.projectRoot,
    shell: process.platform === "win32",
    stdio: "inherit"
  });

  return new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("exit", (exitCode) => {
      resolve({
        command,
        args,
        exitCode
      });
    });
  });
}
