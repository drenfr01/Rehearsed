import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { SummarizeFeedbackRequest } from "../../interfaces/MessageInterface";
import { AgentRequest } from "../../interfaces/AgentInterface";

const agentAPI = createApi({
  reducerPath: "agent",
  baseQuery: fetchBaseQuery({ baseUrl: "http://127.0.0.1:8000/agent" }),
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
          return {
            url: "/request",
            method: "POST",
            body: {
              message: agentRequest.message,
              user_id: agentRequest.userId,
              session_id: agentRequest.sessionId,
            },
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
        query: (summarizeFeedbackRequest: SummarizeFeedbackRequest) => {
          return {
            url: "/feedback",
            method: "POST",
            body: {
              user_id: summarizeFeedbackRequest.userId,
              session_id: summarizeFeedbackRequest.sessionId,
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
