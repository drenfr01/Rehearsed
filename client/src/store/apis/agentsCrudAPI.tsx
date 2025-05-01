import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { Agent } from "../../interfaces/AgentInterface";

const agentsCrudAPI = createApi({
  reducerPath: "agentsCrud",
  baseQuery: fetchBaseQuery({
    baseUrl: "http://127.0.0.1:8000/agents_crud",
    prepareHeaders: (headers) => {
      // Add any necessary headers here
      const token = localStorage.getItem("token");
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      headers.set("Content-Type", "application/json");
      return headers;
    },
  }),
  tagTypes: ["Agents"],
  endpoints(builder) {
    return {
      fetchAgents: builder.query<Agent[], void>({
        query: () => ({
          url: "/",
          method: "GET",
        }),
        providesTags: ["Agents"],
        transformResponse: (response: Agent[]) => {
          console.log("API Response:", response);
          return response;
        },
        transformErrorResponse: (response) => {
          console.error("API Error:", response);
          return response;
        },
      }),
      createAgent: builder.mutation<Agent, Partial<Agent>>({
        query: (agent) => ({
          url: "/",
          method: "POST",
          body: agent,
        }),
        invalidatesTags: ["Agents"],
      }),
      updateAgent: builder.mutation<
        Agent,
        { id: number; agent: Partial<Agent> }
      >({
        query: ({ id, agent }) => ({
          url: `/${id}`,
          method: "PUT",
          body: agent,
        }),
        invalidatesTags: ["Agents"],
      }),
      deleteAgent: builder.mutation<void, number>({
        query: (id) => ({
          url: `/${id}`,
          method: "DELETE",
        }),
        invalidatesTags: ["Agents"],
      }),
    };
  },
});

export const {
  useFetchAgentsQuery,
  useCreateAgentMutation,
  useUpdateAgentMutation,
  useDeleteAgentMutation,
} = agentsCrudAPI;

export { agentsCrudAPI };
