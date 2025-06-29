import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import {
  CreateSessionRequest,
  GetAllSessionsForUserRequest,
  GetSessionRequest,
  SessionResponse,
} from "../../interfaces/SessionInterface";

const host = import.meta.env.VITE_SERVER_HOST;

const sessionAPI = createApi({
  reducerPath: "session",
  baseQuery: fetchBaseQuery({ baseUrl: host + "/session" }),
  tagTypes: ["Session"],
  endpoints(builder) {
    return {
      createSession: builder.mutation<SessionResponse, CreateSessionRequest>({
        invalidatesTags: [{ type: "Session", id: "LIST" }],
        query: (createSessionRequest: CreateSessionRequest) => {
          return {
            url: "/create",
            method: "POST",
            body: createSessionRequest,
          };
        },
      }),
      getCurrentSession: builder.query<SessionResponse, GetSessionRequest>({
        providesTags: (result, error, arg) => [
          { type: "Session", id: arg.session_id },
        ],
        query: (getSessionRequest: GetSessionRequest) => {
          return {
            url: "/get-current-session",
            method: "GET",
            params: getSessionRequest,
          };
        },
      }),
      getSessionContent: builder.query<SessionResponse, GetSessionRequest>({
        providesTags: (result, error, arg) => [
          { type: "Session", id: arg.session_id },
        ],
        query: (getSessionRequest: GetSessionRequest) => {
          return {
            url: "/get-session-content",
            method: "GET",
            params: getSessionRequest,
          };
        },
      }),
      getAllSessionsForUser: builder.query<
        SessionResponse,
        GetAllSessionsForUserRequest
      >({
        providesTags: [{ type: "Session", id: "LIST" }],
        query: (getAllSessionsForUserRequest: GetAllSessionsForUserRequest) => {
          return {
            url: "/get-all-sessions-for-user",
            method: "GET",
            params: getAllSessionsForUserRequest,
          };
        },
      }),
    };
  },
});

export const {
  useCreateSessionMutation,
  useGetCurrentSessionQuery,
  useGetSessionContentQuery,
  useGetAllSessionsForUserQuery,
} = sessionAPI;
export { sessionAPI };
