import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const scenarioAPI = createApi({
  reducerPath: "scenario",
  baseQuery: fetchBaseQuery({ baseUrl: "http://127.0.0.1:8000/scenario" }),
  tagTypes: ["Scenario"],
  endpoints(builder) {
    return {
      setScenario: builder.mutation({
        // TODO: invalidate this tag unique to a user
        invalidatesTags: ["Scenario"],
        query: (scenarioID: string) => {
          return {
            url: "/set-scenario-data",
            method: "POST",
            body: {
              scenario_id: scenarioID,
            },
          };
        },
      }),
      fetchScenarios: builder.query({
        query: () => {
          return {
            url: "/get-all",
            method: "GET",
          };
        },
      }),
      fetchCurrentScenario: builder.query({
        providesTags: ["Scenario"],
        query: () => {
          return {
            url: "/get-current-scenario",
            method: "GET",
          };
        },
      }),
    };
  },
});

export const {
  useSetScenarioMutation,
  useFetchScenariosQuery,
  useFetchCurrentScenarioQuery,
} = scenarioAPI;
export { scenarioAPI };
