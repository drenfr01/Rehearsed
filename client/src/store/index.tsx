import { configureStore } from "@reduxjs/toolkit";
import { conversationAPI } from "./apis/conversationAPI";
import { scenarioAPI } from "./apis/scenarioAPI";
import { agentAPI } from "./apis/agentAPI";
import { authAPI } from "./apis/authAPI";
import { agentsCrudAPI } from "./apis/agentsCrudAPI";
import { scenariosCrudAPI } from "./apis/scenariosCrudAPI";
import { sessionAPI } from "./apis/sessionAPI";
import { setupListeners } from "@reduxjs/toolkit/query";

const store = configureStore({
  reducer: {
    [conversationAPI.reducerPath]: conversationAPI.reducer,
    [scenarioAPI.reducerPath]: scenarioAPI.reducer,
    [agentAPI.reducerPath]: agentAPI.reducer,
    [authAPI.reducerPath]: authAPI.reducer,
    [agentsCrudAPI.reducerPath]: agentsCrudAPI.reducer,
    [scenariosCrudAPI.reducerPath]: scenariosCrudAPI.reducer,
    [sessionAPI.reducerPath]: sessionAPI.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(conversationAPI.middleware)
      .concat(scenarioAPI.middleware)
      .concat(agentAPI.middleware)
      .concat(authAPI.middleware)
      .concat(agentsCrudAPI.middleware)
      .concat(scenariosCrudAPI.middleware)
      .concat(sessionAPI.middleware),
});

// window.store = store;

setupListeners(store.dispatch);

export default store;
export { store };
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export {
  usePostMessageMutation,
  useFetchMessagesQuery,
  useProvideUserFeedbackMutation,
} from "./apis/conversationAPI";

export {
  usePostRequestMutation,
  useFetchConversationQuery,
  useProvideOverallFeedbackMutation,
  useStartSessionMutation,
  usePostInlineFeedbackRequestMutation,
} from "./apis/agentAPI";

export {
  useSetScenarioMutation,
  useFetchScenariosQuery,
  useFetchCurrentScenarioQuery,
} from "./apis/scenarioAPI";

export { useLoginMutation, useGetCurrentUserQuery } from "./apis/authAPI";

export {
  useFetchAgentsQuery,
  useCreateAgentMutation,
  useUpdateAgentMutation,
  useDeleteAgentMutation,
} from "./apis/agentsCrudAPI";

export {
  useCreateSessionMutation,
  useGetCurrentSessionQuery,
  useGetSessionContentQuery,
  useGetAllSessionsForUserQuery,
} from "./apis/sessionAPI";
