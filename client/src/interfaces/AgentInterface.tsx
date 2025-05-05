export interface AgentRequest {
  message: string;
  sessionId: string;
  userId: string;
  audio?: Blob;
}

export interface AgentResponse {
  content: string;
  role: "user" | "model";
  author: string;
  message_id: string | null;
  audio?: string; // Base64 encoded audio data
}

export interface Agent {
  id: number;
  scenario_id: number;
  name: string;
  instruction: string;
  description: string;
  model: string;
}
