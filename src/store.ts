import { configureStore } from '@reduxjs/toolkit'
import userSlice from '@/features/users/userSlice'
import conversationSlice from '@/features/conversations/conversationSlice';
import { chatApi } from '@/api/chat.api';
import messageSlice from '@/features/messages/messageSlice';
import appSlice from '@/features/main/appSlice';
import socketMiddleware from '@/features/socket/socketMiddleware';
import socketSlice from './features/socket/socketSlice';

const store = configureStore({
  reducer: {
    app: appSlice,
    user:userSlice,
    conv:conversationSlice,
    messages:messageSlice,
    socket:socketSlice,
    [chatApi.reducerPath]:chatApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(chatApi.middleware).concat([socketMiddleware]),
})

export default store;

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;