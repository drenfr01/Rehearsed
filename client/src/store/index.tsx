import { configureStore } from "@reduxjs/toolkit";
import { conversationAPI } from "./apis/conversationAPI";
import { setupListeners } from "@reduxjs/toolkit/query";

const store = configureStore({
  reducer: {
    [conversationAPI.reducerPath]: conversationAPI.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(conversationAPI.middleware),
});

// window.store = store;

setupListeners(store.dispatch);

export default store;
export {
  usePostMessageMutation,
  useFetchMessagesQuery,
} from "./apis/conversationAPI";
