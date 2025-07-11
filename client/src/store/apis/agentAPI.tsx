import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { AgentRequest, AgentResponse } from "../../interfaces/AgentInterface";

const host = import.meta.env.VITE_SERVER_HOST;

const agentAPI = createApi({
  reducerPath: "agent",
  baseQuery: fetchBaseQuery({ baseUrl: host + "/agent" }),
  tagTypes: ["Conversation"],
  endpoints(builder) {
    return {
      startSession: builder.mutation({
        query: (agentRequest: AgentRequest) => {
          return {
            url: "/start-session",
            method: "POST",
            body: {
              user_id: agentRequest.userId,
              session_id: agentRequest.sessionId,
              message: agentRequest.message,
            },
          };
        },
      }),
      postRequest: builder.mutation<AgentResponse, AgentRequest>({
        invalidatesTags: (result, error, arg) => [
          { type: "Conversation", id: `${arg.userId}-${arg.sessionId}` },
        ],
        query: (agentRequest: AgentRequest) => {
          const formData = new FormData();
          formData.append("agent_name", agentRequest.agentName);
          formData.append("message", agentRequest.message);
          formData.append("user_id", agentRequest.userId);
          formData.append("session_id", agentRequest.sessionId);

          if (agentRequest.audio) {
            formData.append("audio", agentRequest.audio, "recording.webm");
          }

          return {
            url: "/request",
            method: "POST",
            body: formData,
            formData: true,
          };
        },
        transformResponse: (response: {
          text: string;
          audio: string | null;
          markdown_text: string | null;
          author: string | null;
        }) => {
          console.log("API Response received:", {
            hasText: !!response.text,
            hasAudio: !!response.audio,
            hasMarkdown: !!response.markdown_text,
            author: response.author,
          });
          return {
            content: response.text,
            role: "model",
            author: response.author || "Assistant",
            message_id: null,
            audio: response.audio || undefined,
            markdown_text: response.markdown_text || undefined,
          };
        },
      }),
      fetchConversation: builder.query({
        providesTags: (result, error, arg) => [
          { type: "Conversation", id: `${arg.userId}-${arg.sessionId}` },
        ],
        query: ({
          userId,
          sessionId,
        }: {
          userId: string;
          sessionId: string;
        }) => {
          return {
            url: `/conversation/${userId}/${sessionId}`,
            method: "GET",
          };
        },
        transformResponse: (response: {
          turns: Array<{
            content: string;
            role: string;
            author: string;
            message_id: string;
            audio: string | null;
          }>;
        }) => {
          console.log("Conversation response:", response);
          return {
            turns: response.turns.map((turn) => ({
              content: turn.content,
              role: turn.role,
              author: turn.author,
              message_id: turn.message_id,
              audio: turn.audio || undefined,
            })),
          };
        },
      }),
      provideOverallFeedback: builder.mutation({
        query: (agentRequest: AgentRequest) => {
          return {
            url: "/feedback",
            method: "POST",
            body: {
              agent_name: agentRequest.agentName,
              user_id: agentRequest.userId,
              session_id: agentRequest.sessionId,
              message: agentRequest.message,
            },
          };
        },
      }),
      postInlineFeedbackRequest: builder.mutation<AgentResponse, AgentRequest>({
        query: (agentRequest: AgentRequest) => {
          const formData = new FormData();
          formData.append("agent_name", "inline_feedback_agent");
          formData.append("message", agentRequest.message);
          formData.append("user_id", agentRequest.userId);
          formData.append("session_id", agentRequest.sessionId);

          if (agentRequest.audio) {
            formData.append("audio", agentRequest.audio, "recording.webm");
          }

          return {
            url: "/request",
            method: "POST",
            body: formData,
            formData: true,
          };
        },
        transformResponse: (response: {
          text: string;
          audio: string | null;
          markdown_text: string | null;
          author: string | null;
        }) => {
          console.log("Feedback API Response received:", {
            hasText: !!response.text,
            hasAudio: !!response.audio,
            hasMarkdown: !!response.markdown_text,
            author: response.author,
          });
          return {
            content: response.text,
            role: "model",
            author: response.author || "Feedback Assistant",
            message_id: null,
            audio: response.audio || undefined,
            markdown_text: response.markdown_text || undefined,
          };
        },
      }),
    };
  },
});

export const {
  useStartSessionMutation,
  usePostRequestMutation,
  useFetchConversationQuery,
  useProvideOverallFeedbackMutation,
  usePostInlineFeedbackRequestMutation,
} = agentAPI;
export { agentAPI };
