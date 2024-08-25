// Slice of store that manages Socket connections
import { createSelector, createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { Message, UserReactUpdate } from "@/features/messages/entity";
import { ClientData_HideMsg, ClientData_ReactMsg, ClientData_SeeMsg, ClientData_SendMsg, ClientData_UnsendMsg, UpdateConversationInput, UpdateParticipantInput, UpdateUserInput } from "./type";
import { RootState } from "@/store";
 
export interface SocketState {
  isConnected: boolean;
  rooms: string[];
  isUpdatingProfile: boolean;
  isUpdatingConv: boolean;
  usernameCheck: {isFetching:boolean,check:{[username:string]:UsernameCheckStatus|undefined}};
}
 
export type UsernameCheckStatus = 'exist'|'available';

const initialState: SocketState = {
  isConnected: false,
  rooms: [],
  isUpdatingProfile:false,
  isUpdatingConv:false,
  usernameCheck:{isFetching:false,check:{}},
};
 
type RoomAction = PayloadAction<{
  room: string;
}>;

const socketSlice = createSlice({
  name: "socket",
  initialState,
  // Reducers: Functions we can call on the store
  reducers: {
    initSocket: (state,action:PayloadAction<{token:string}>) => {
      return;
    },
    disconnectSocket: (state,action:PayloadAction<true>) => {
      return;
    },
    connectionEstablished: (state) => {
      state.isConnected = true;
    },
    connectionLost: (state) => {
      state.isConnected = false;
    },
    sendMessage: (state,action:PayloadAction<ClientData_SendMsg>) =>{
    },
    reactMessage: (state,action:PayloadAction<ClientData_ReactMsg>) =>{
    },
    unsendMsg: (state, action:PayloadAction<ClientData_UnsendMsg>)=>{
    },
    hideMsg: (state, action:PayloadAction<ClientData_HideMsg>)=>{
    },
    seeMsg: (state,action:PayloadAction<ClientData_SeeMsg>)=>{
    },
    updateUserProfile: (state,action:PayloadAction<UpdateUserInput>)=>{
      state.isUpdatingProfile = true;
    },
    makeParticipantUpdate: (state,action:PayloadAction<UpdateParticipantInput>)=>{
    },
    makeConversationUpdate: (state,action:PayloadAction<UpdateConversationInput>)=>{
      state.isUpdatingConv = true;
    },
    setUpdateStatus:(state,action:PayloadAction<{id:'profile'|'conv',status:'finish'|'start'}>)=>{
      const {id,status} = action.payload;
      const isUpdaing = (status=='finish'?false:true);
      if(id=='profile')
        state.isUpdatingProfile= isUpdaing;
      else state.isUpdatingConv= isUpdaing;
    },
    checkUsername:(state,action:PayloadAction<{username?:string}>)=>{
    },
    getOnlineStatus:(state,action:PayloadAction<{userIds:string[]}>)=>{
    },
    getUsersData:(state,action:PayloadAction<{userIds:string[]}>)=>{
    },
    addUsernameCheck:(state,action:PayloadAction<{username:string,status:UsernameCheckStatus}>)=>{
      state.usernameCheck.check[action.payload.username]= action.payload.status;
    },
    requestCreateGroupChat:(state,action:PayloadAction<{userIds:string[]}>)=>{
    },
    requestAddPtcp:(state,action:PayloadAction<{convId:string,newUserId:string}>)=>{
    },
    requestRemovePtcp:(state,action:PayloadAction<{convId:string,targetUserId:string}>)=>{
    },
    requestLeaveGroupChat:(state,action:PayloadAction<{convId:string}>)=>{
    },
  },
});
 
export const selectSocketConnectStatus = (state:RootState) =>state.socket.isConnected;
export const selectIsUpdatingProfile = (state:RootState)=>state.socket.isUpdatingProfile;

export const selectIsUpdatingConv = (state:RootState)=>state.socket.isUpdatingConv;

export const selectUsernameCheck = (state:RootState)=>state.socket.usernameCheck;

// Don't have to define actions, they are automatically generated
export const { initSocket, connectionEstablished, connectionLost, sendMessage, reactMessage,
    unsendMsg, hideMsg, seeMsg, disconnectSocket, updateUserProfile, setUpdateStatus, getUsersData, 
    checkUsername, addUsernameCheck, getOnlineStatus, makeParticipantUpdate, makeConversationUpdate,
    requestCreateGroupChat, requestAddPtcp, requestRemovePtcp, requestLeaveGroupChat } =
  socketSlice.actions;
// Export the reducer for this slice
export default socketSlice.reducer;