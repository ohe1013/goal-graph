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

