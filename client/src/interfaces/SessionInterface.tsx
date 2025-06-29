export interface CreateSessionRequest {
  user_id: string;
}

export interface GetAllSessionsForUserRequest {
  user_id: string;
}

export interface GetSessionRequest {
  user_id: string;
  session_id: string;
}

export interface Session {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  // Add other session properties as needed
}

export interface SessionResponse {
  sessions: Session[];
}
