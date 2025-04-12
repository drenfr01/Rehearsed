export interface Message {
  message: string;
  userId: string;
}

export interface ResponseMessage {
  message: string;
  user_id: string;
  message_id: string | null;
}
