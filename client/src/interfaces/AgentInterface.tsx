export interface AgentRequest {
  agentName: string;
  message: string;
  sessionId: string;
  userId: string;
  audio?: Blob;
  image?: Blob;
}

export interface AgentResponse {
  content: string;
  role: "user" | "model";
  author: string;
  message_id: string | null;
  audio?: string; // Base64 encoded audio data
  markdown_text?: string; // Markdown formatted feedback text
  imageObjectUrl?: string; // Optional local URL for a user-attached image
}

export interface Agent {
  id: number;
  scenario_id: number;
  name: string;
  instruction: string;
  description: string;
  model: string;
}
