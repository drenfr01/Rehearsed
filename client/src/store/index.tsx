import { configureStore } from "@reduxjs/toolkit";
import { conversationAPI } from "./apis/conversationAPI";
import { scenarioAPI } from "./apis/scenarioAPI";
import { agentAPI } from "./apis/agentAPI";
import { authAPI } from "./apis/authAPI";
import { agentsCrudAPI } from "./apis/agentsCrudAPI";
import { setupListeners } from "@reduxjs/toolkit/query";

const store = configureStore({
  reducer: {
    [conversationAPI.reducerPath]: conversationAPI.reducer,
    [scenarioAPI.reducerPath]: scenarioAPI.reducer,
    [agentAPI.reducerPath]: agentAPI.reducer,
    [authAPI.reducerPath]: authAPI.reducer,
    [agentsCrudAPI.reducerPath]: agentsCrudAPI.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(conversationAPI.middleware)
      .concat(scenarioAPI.middleware)
      .concat(agentAPI.middleware)
      .concat(authAPI.middleware)
      .concat(agentsCrudAPI.middleware),
});

// window.store = store;

setupListeners(store.dispatch);

export default store;
export {
  usePostMessageMutation,
  useFetchMessagesQuery,
  useProvideUserFeedbackMutation,
} from "./apis/conversationAPI";

export {
  usePostRequestMutation,
  useFetchConversationQuery,
  useProvideAgentFeedbackMutation,
  useStartSessionMutation,
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
