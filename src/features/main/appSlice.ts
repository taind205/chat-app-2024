import { PayloadAction, createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit'
import { RootState } from '@/store';
import { ReactElement, ReactNode } from 'react';
import { Message, UserReact } from '@/features/messages/entity';

export type UIState = "index"|"chatMsg"|"chatInfo";

export type ModalValue = {id:'changeAvatar'|'null'|'changeSelfUsername'}
    |{id:'addMember'|'changeGroupPhoto'|'changeGroupName'|'confirmLeaveGroup', convId:string}
    |{id:'setMemberNickname'|'setMemberRole'|'confirmRemoveMember', targetUserId:string, convId:string}
    |{id:'removeMessage', targetMsg:Message, convId:string}
    |{id:'image', src:string, msgId:string, imgIdx:number}
    |{id:'reactionDetail', userReaction:UserReact[]};
export type ModalState = {isOpen:boolean, content:ModalValue}
export type NotificationState = {isOpen:boolean, content?:ReactNode};

type AppState = {
  currentUI: UIState,
  error:undefined,
  modal:ModalState,
  notification:NotificationState
}

const initValue:AppState = {currentUI:"index",error:undefined,
      modal:{isOpen:false, content:{id:"null"}},
      notification:{isOpen:false},
    };

export const appSlice = createSlice({
  name: 'app',
  initialState: initValue,
  reducers: {
    openUI: (state,action:PayloadAction<UIState>) => {
        state.currentUI = action.payload;},
    openModal: (state,action:PayloadAction<{content:ModalValue}>) => {
      state.modal = {...action.payload, isOpen:true} },
    closeModal: (state,action:PayloadAction<Pick<ModalValue,'id'>|undefined>) => {
      if(action.payload?.id==undefined) state.modal.isOpen=false;
      if(state.modal.content.id==action.payload?.id)
      state.modal.isOpen=false; },
  },
})

export const selectCurrentUI = (state: RootState) => state.app.currentUI;

// Action creators are generated for each case reducer function
export const { openModal, closeModal, openUI } = appSlice.actions

export default appSlice.reducer
