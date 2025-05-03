import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { Scenario } from "../../interfaces/ScenarioInterface";

const host = import.meta.env.VITE_SERVER_HOST;

export const scenariosCrudAPI = createApi({
  reducerPath: "scenariosCrud",
  baseQuery: fetchBaseQuery({ 
    baseUrl: host + "/scenarios",
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("token");
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["Scenario"],
  endpoints: (builder) => ({
    fetchScenarios: builder.query<Scenario[], void>({
      query: () => "",
      providesTags: ["Scenario"],
    }),
    createScenario: builder.mutation<Scenario, Partial<Scenario>>({
      query: (scenario) => ({
        url: "",
        method: "POST",
        body: scenario,
      }),
      invalidatesTags: ["Scenario"],
    }),
    updateScenario: builder.mutation<Scenario, { id: number; scenario: Partial<Scenario> }>({
      query: ({ id, scenario }) => ({
        url: `/${id}`,
        method: "PUT",
        body: scenario,
      }),
      invalidatesTags: ["Scenario"],
    }),
    deleteScenario: builder.mutation<void, number>({
      query: (id) => ({
        url: `/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Scenario"],
    }),
  }),
});

export const {
  useFetchScenariosQuery,
  useCreateScenarioMutation,
  useUpdateScenarioMutation,
  useDeleteScenarioMutation,
} = scenariosCrudAPI; 