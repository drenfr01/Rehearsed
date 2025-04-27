export interface Message {
  message: string;
  userId: number;
  sessionId: string;
}

export interface ResponseMessage {
  message: string;
  user_id: string;
  session_id: string;
  message_id: string | null;
  role: "user" | "system";
}

export interface SummarizeFeedbackRequest {
  userId: string;
  sessionId: string;
}

export interface SummarizeFeedbackResponse {
  feedback: string;
}
