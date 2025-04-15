import { configureStore } from "@reduxjs/toolkit";
import { conversationAPI } from "./apis/conversationAPI";
import { scenarioAPI } from "./apis/scenarioAPI";
import { setupListeners } from "@reduxjs/toolkit/query";

const store = configureStore({
  reducer: {
    [conversationAPI.reducerPath]: conversationAPI.reducer,
    [scenarioAPI.reducerPath]: scenarioAPI.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(conversationAPI.middleware)
      .concat(scenarioAPI.middleware),
});

// window.store = store;

setupListeners(store.dispatch);

export default store;
export {
  usePostMessageMutation,
  useFetchMessagesQuery,
} from "./apis/conversationAPI";

export {
  useSetScenarioMutation,
  useFetchScenariosQuery,
  useFetchCurrentScenarioQuery,
} from "./apis/scenarioAPI";
