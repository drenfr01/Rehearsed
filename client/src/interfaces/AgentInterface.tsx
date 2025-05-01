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
  name: string;
  description: string;
  role: string;
  created_at: string;
  updated_at: string;
}
