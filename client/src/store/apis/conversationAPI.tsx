import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { Message } from "../../interfaces/MessageInterface";

const conversationAPI = createApi({
  reducerPath: "conversation",
  baseQuery: fetchBaseQuery({ baseUrl: "http://127.0.0.1:8000/conversation" }),
  endpoints(builder) {
    return {
      postMessage: builder.mutation({
        query: (message: Message) => {
          return {
            url: "/message",
            method: "POST",
            body: {
              message: message.message,
              user_id: message.userId,
            },
          };
        },
      }),
      fetchMessages: builder.query({
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
    };
  },
});

export const { usePostMessageMutation, useFetchMessagesQuery } =
  conversationAPI;
export { conversationAPI };
