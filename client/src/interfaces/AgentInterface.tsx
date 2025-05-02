export interface AgentRequest {
  message: string;
  sessionId: string;
  userId: string;
}

export interface AgentResponse {
  content: string;
  role: string;
  author: string;
  message_id: string;
}

export interface Agent {
  id: number;
  scenario_id: number;
  name: string;
  instruction: string;
  description: string;
  model: string;
}
