import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import {
  Message,
  SummarizeFeedbackRequest,
} from "../../interfaces/MessageInterface";

const conversationAPI = createApi({
  reducerPath: "conversation",
  baseQuery: fetchBaseQuery({ baseUrl: "http://127.0.0.1:8000/conversation" }),
  tagTypes: ["Messages"],
  endpoints(builder) {
    return {
      postMessage: builder.mutation({
        // TODO: invalidate this tag unique to a user
        invalidatesTags: ["Messages"],
        query: (message: Message) => {
          return {
            url: "/send_message",
            method: "POST",
            body: {
              message: message.message,
              user_id: message.userId,
            },
          };
        },
      }),
      fetchMessages: builder.query({
        providesTags: ["Messages"],
        query: (user: string) => {
          return {
            url: "/messages",
            params: {
              user_id: user,
            },
            method: "GET",
          };
        },
      }),
      provideUserFeedback: builder.mutation({
        query: (summarizeFeedbackRequest: SummarizeFeedbackRequest) => {
          return {
            url: "/provide_user_feedback",
            method: "POST",
            body: {
              user_id: summarizeFeedbackRequest.userId,
            },
          };
        },
      }),
    };
  },
});

export const {
  usePostMessageMutation,
  useFetchMessagesQuery,
  useProvideUserFeedbackMutation,
} = conversationAPI;
export { conversationAPI };
