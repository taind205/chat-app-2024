import { PayloadAction, createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { User, UserMap } from './entity';
import { WritableDraft } from 'immer';
import { chatApi } from '@/api/chat.api';
import { createSelector } from "@reduxjs/toolkit";
import { RootState } from '@/store';

export type UsersState = {
  self: User|undefined,
  value: UserMap,
  loadingStatus: 'idle' | 'loading' | 'succeeded' | 'failed',
  error: string | undefined,
  pendingUserLoadIds:string[],
}

const initValue:()=>UsersState = () => {
  const initValue:UsersState = {value:{}, loadingStatus:'idle',error:undefined, self:undefined,pendingUserLoadIds:[]}
  return {...initValue};
};

export const userSlice = createSlice({
  name: 'user',
  initialState: initValue(),
  reducers: {
    addPendingUserLoad: (state,action:PayloadAction<string>) => {
      state.pendingUserLoadIds.push(action.payload);
    },
    clearPendingUserLoad: (state,action:PayloadAction) => {
      state.pendingUserLoadIds=[];
    },
    mergeUserData: (state,action:PayloadAction<Array<Pick<User,'_id'> & Partial<User>>>) => {
      action.payload.forEach((mergeData) =>{
        const existUser = state.value[mergeData._id];
        if(existUser) state.value[mergeData._id] = {...existUser,...mergeData} })
    },
    replaceUserData: (state,action:PayloadAction<User[]>) => {
      action.payload.forEach((user: WritableDraft<User>) => (state.value[user._id] = user));},
    updateSelfData:(state,action:PayloadAction<Partial<User>>) => {
      if(state.self){
        const updatedUser = {...state.self,...action.payload};
        state.self = updatedUser;
        state.value[updatedUser._id] = updatedUser;
    }
    },
  },
  extraReducers(builder) {
    builder
    .addMatcher(
      chatApi.endpoints.logout.matchFulfilled,
      (state, action) => {
        const {logout} = action.payload;
        if(logout) {
          const newValue = initValue();
          Object.assign(state,newValue); //= {...newValue};
        }
      }
  )
    .addMatcher(
      chatApi.endpoints.login.matchFulfilled,
      (state, action) => {
        const user = action.payload.user;
        state.self = user;
        state.value[user._id] = user;
      }
  )
    .addMatcher(
      chatApi.endpoints.googleLogin.matchFulfilled,
      (state, action) => {
        const user = action.payload.user;
        state.self = user;
        state.value[user._id] = user;
      }
  )
  .addMatcher(
    chatApi.endpoints.getSignedInUser.matchFulfilled,
    (state, action) => {
      const user = action.payload;
      state.self = user;
      state.value[user._id] = user;
    }
)
    .addMatcher(
        chatApi.endpoints.getLatestConversations.matchFulfilled,
        (state, action) => {
            action.payload.users.forEach(v=>state.value[v._id]=v)
        }
    )
      .addMatcher(
        chatApi.endpoints.getConversation.matchFulfilled,
        (state, action) => {
          action.payload.users?.forEach(v=>state.value[v._id]=v);
          action.payload.conv?.users?.forEach(v=>state.value[v._id]=v);
        }
      )
      .addMatcher(
        chatApi.endpoints.searchConv.matchFulfilled,
        (state, action) => {
          action.payload.users.forEach(v=>state.value[v._id]=v)
          action.payload.groups.forEach(group=>group.users.forEach(v=>state.value[v._id]=v));
        }
      )

      .addMatcher(
        chatApi.endpoints.searchUser.matchFulfilled,
        (state, action) => {
          action.payload.users.forEach(v=>state.value[v._id]=v)
        }
      )

      .addMatcher(
        chatApi.endpoints.getUsers.matchFulfilled,
        (state, action) => {
          action.payload.forEach(v=>state.value[v._id]=v)
        }
      )
  }
})

// Action creators are generated for each case reducer function
export const { replaceUserData, updateSelfData, mergeUserData, addPendingUserLoad, clearPendingUserLoad } = userSlice.actions;

export default userSlice.reducer;

export const selectSelfId = (state:RootState) => state.user.self?._id;

export const selectAllUsers = (state:RootState) => state.user.value;

export const selectPendingUserLoadIds = (state:RootState) => state.user.pendingUserLoadIds;

export const selectSelf = createSelector(
  [selectAllUsers, selectSelfId],
  (users, userId) =>  userId? users[userId.toString()] : undefined
);

export const selectUserById = createSelector(
  [selectAllUsers, (_:RootState, userId?:string)=>userId],
  (users, userId) => {
      if(!userId) return undefined;
      return users[userId];
  }
);

export const searchUsersByName = createSelector(
  [selectAllUsers, (_, searchTerm:string)=>searchTerm],
  (users, searchTerm:string) => {
      let result = [];
      if (!searchTerm) {
        for (const [id, user] of Object.entries(users).slice(0,5)) {
            if(user) result.push(user);
        }
      }
      else 
        for (const [id, user] of Object.entries(users)) {
          if(user?.displayName.toLowerCase().includes(searchTerm))
            result.push(user);
        }
      return result.slice(0,5);
  }
);