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
