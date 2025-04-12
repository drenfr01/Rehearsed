export interface Message {
  message: string;
  userId: number;
}

export interface ResponseMessage {
  message: string;
  user_id: string;
  message_id: string | null;
  role: "user" | "system";
}
