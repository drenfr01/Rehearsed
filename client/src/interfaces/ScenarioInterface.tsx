export interface Scenario {
  name: string;
  description: string;
  overview: string;
  initial_prompt: string;
  system_instructions: string;
}

export interface ScenarioList {
  scenarios: Record<string, Scenario>;
}
