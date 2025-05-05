import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { AgentRequest } from "../../interfaces/AgentInterface";

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
      postRequest: builder.mutation({
        invalidatesTags: (result, error, arg) => [
          { type: "Conversation", id: `${arg.userId}-${arg.sessionId}` },
        ],
        query: (agentRequest: AgentRequest) => {
          const formData = new FormData();
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
      }),
      provideAgentFeedback: builder.mutation({
        query: (agentRequest: AgentRequest) => {
          return {
            url: "/feedback",
            method: "POST",
            body: {
              user_id: agentRequest.userId,
              session_id: agentRequest.sessionId,
              message: agentRequest.message,
            },
          };
        },
      }),
    };
  },
});

export const {
  usePostRequestMutation,
  useFetchConversationQuery,
  useProvideAgentFeedbackMutation,
  useStartSessionMutation,
} = agentAPI;
export { agentAPI };
