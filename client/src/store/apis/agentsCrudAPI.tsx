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
      }),
      createAgent: builder.mutation<Agent, Partial<Agent>>({
        query: (agent) => ({
          url: "/",
          method: "POST",
          body: agent,
        }),
        invalidatesTags: ["Agents"],
        async onQueryStarted(agent, { dispatch, queryFulfilled }) {
          const patchResult = dispatch(
            agentsCrudAPI.util.updateQueryData(
              "fetchAgents",
              undefined,
              (draft) => {
                draft.push({ ...agent, id: Date.now() } as Agent);
              }
            )
          );
          try {
            await queryFulfilled;
          } catch {
            patchResult.undo();
          }
        },
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
        async onQueryStarted({ id, agent }, { dispatch, queryFulfilled }) {
          const patchResult = dispatch(
            agentsCrudAPI.util.updateQueryData(
              "fetchAgents",
              undefined,
              (draft) => {
                const index = draft.findIndex((a) => a.id === id);
                if (index !== -1) {
                  draft[index] = { ...draft[index], ...agent };
                }
              }
            )
          );
          try {
            await queryFulfilled;
          } catch {
            patchResult.undo();
          }
        },
      }),
      deleteAgent: builder.mutation<void, number>({
        query: (id) => ({
          url: `/${id}`,
          method: "DELETE",
        }),
        invalidatesTags: ["Agents"],
        async onQueryStarted(id, { dispatch, queryFulfilled }) {
          const patchResult = dispatch(
            agentsCrudAPI.util.updateQueryData(
              "fetchAgents",
              undefined,
              (draft) => {
                const index = draft.findIndex((a) => a.id === id);
                if (index !== -1) {
                  draft.splice(index, 1);
                }
              }
            )
          );
          try {
            await queryFulfilled;
          } catch {
            patchResult.undo();
          }
        },
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
