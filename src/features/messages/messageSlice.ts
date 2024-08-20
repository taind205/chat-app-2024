import { PayloadAction, createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit'
import { chatApi } from '@/api/chat.api';
import { RootState } from '@/store';
import { ActionMessage, Message, MessageObjType, MessageStatus, UserReact, UserReactUpdate } from './entity';
import { getDateFromObjId, notEmpty } from '@/utils/helperFunction';

export type MessageMap = {[key: string]: Message|undefined};

interface MessagesState {
  entities:MessageMap,
  currentReplyingMsgId: string|undefined,
  pendingMsgLoadIds: {convId:string,msgId:string}[],
}

const initValue = () => {
  const initValue:MessagesState = {entities:{},currentReplyingMsgId:undefined, pendingMsgLoadIds:[]};
  return {...initValue};
}

export const messageSlice = createSlice({
  name: 'message',
  initialState: initValue(),
  reducers: {
    decorateMessage: (state,action:PayloadAction<{msgIds:string[]}>)=>{
      const {msgIds} = action.payload;
      const messages = msgIds.map(id=>state.entities[id]||undefined).filter(notEmpty);
      console.log('deco');
      console.log(messages);
      if(messages.length<=1) { //handle when there's only 1 message
         messages[0].isHideSenderIcon=false; messages[0].isHideSenderName=false; messages[0].isShowTimeHeader=undefined;
        }
      for(let i=0; i<messages.length;i++){
        const currentMsgTime = getDateFromObjId(messages[i]?._id)?.getTime();
        const previousMsgTime = getDateFromObjId(messages[i-1]?._id)?.getTime();
        const nextMsgTime = getDateFromObjId(messages[i+1]?._id)?.getTime();
        // Hide sender icon/name if 2 messages is nearby;
        if(nextMsgTime && currentMsgTime) // Modify only if exist
          messages[i].isHideSenderIcon = (messages[i].user==messages[i+1]?.user && (nextMsgTime-currentMsgTime<5*60*1000) ) 
        if(previousMsgTime && currentMsgTime)
          messages[i].isHideSenderName = (messages[i].user==messages[i-1]?.user && (currentMsgTime-previousMsgTime<5*60*1000) )
        // Show time if 2 messages is far away from each other;
        if(previousMsgTime && currentMsgTime)
          messages[i].isShowTimeHeader = (currentMsgTime-previousMsgTime>30*60*1000);
      }
    },
    addPendingMsgLoad: (state,action:PayloadAction<{convId:string,msgId:string}>) => { 
      state.pendingMsgLoadIds.push(action.payload);
    },
    setReplyingMsg: (state,action:PayloadAction<string|undefined>) => {
      state.currentReplyingMsgId=action.payload;},
    addNewMessage: (state, action:PayloadAction<Message>)=>{
      state.entities[action.payload._id]=action.payload;
    },
    addReact: (state, action:PayloadAction<UserReactUpdate>)=>{
      const {msgId,user,react} = action.payload;
      const targetMsg= state.entities[msgId]
      if(targetMsg) {
        if(targetMsg.react) {
          const targetUserIdx = targetMsg.react.findIndex(r=>r.user==user);
          if(targetUserIdx==-1) targetMsg.react.push({user,react})
          else targetMsg.react[targetUserIdx]={user,react};
        } 
        else targetMsg.react=[{user,react}]
    }
  },
    setUnsendMsg: (state, action:PayloadAction<{msgId:string}>)=>{
      const {msgId} = action.payload;
      const target= state.entities[msgId];
      if(target) state.entities[msgId]={_id:target._id, user:target.user, cont:'', status:MessageStatus.Unsent}
  },
    deleteMsg: (state, action:PayloadAction<string>)=>{
      const msgId = action.payload;
      delete state.entities[msgId];
    }
  },
  extraReducers(builder) {
    builder 
    .addMatcher(
      chatApi.endpoints.logout.matchFulfilled,
      (state, action) => {
        const {logout} = action.payload;
        if(logout) {
          Object.assign(state,initValue());
        }
      }
  )
      .addMatcher(
        chatApi.endpoints.getConversation.matchFulfilled,
        (state, action) => {
          action.payload.conv?.messages.forEach(msg => {
              const repMsg = msg.repMsg;
              if(repMsg) state.entities[repMsg._id] = {...state.entities[repMsg._id],...repMsg}; // Merge with lower priority

              state.entities[msg._id] = {...msg,repMsg:msg.repMsg?._id}; //Highest priority to merge exist msg
            });
        })
      .addMatcher(
        chatApi.endpoints.getLatestConversations.matchFulfilled,
        (state, action) => {
          action.payload.latestMsgs.forEach(msg => {
              if(!state.entities[msg._id]) state.entities[msg._id] = msg; //Lowest priority to merge exist msg
            });
        })
      .addMatcher(
        chatApi.endpoints.getMessages.matchFulfilled,
        (state, action) => {
          action.payload.messages.forEach(msg=>{
            const repMsg = msg.repMsg;
            if(repMsg) state.entities[repMsg._id] = {...state.entities[repMsg._id],...repMsg}
            state.entities[msg._id]= {...msg,repMsg:msg.repMsg?._id} //Highest priority to merge exist msg
          }); 
        }
      )
      .addMatcher(
        chatApi.endpoints.getMessage.matchFulfilled,
        (state, action) => {
          const msg = action.payload
            const repMsg = msg.repMsg;
            if(repMsg) state.entities[repMsg._id] = {...state.entities[repMsg._id],...repMsg}
            state.entities[msg._id]= {...msg,repMsg:msg.repMsg?._id} //Highest priority to merge exist msg
        }
      )
      .addMatcher(
        chatApi.endpoints.getMediaMessages.matchFulfilled,
        (state, action) => {
          action.payload.messages.forEach(v=>{
            if(!state.entities[v._id]) state.entities[v._id] ={...v}; // Low priority
            else state.entities[v._id] ={...v, ...state.entities[v._id]}; // Merge with lower priority
          });
        }
      )
        }
  }
)

const selectMessages = (state: RootState) => state.messages.entities; 
export const selectCurrentRepMsgId = (state: RootState) => state.messages.currentReplyingMsgId; 

export const selectPendingMsgLoadIds = (state:RootState)=>state.messages.pendingMsgLoadIds;
export const selectMessageById = createSelector(
  [selectMessages,(_,id:string|undefined)=>id],
  (entities,id)=>id?entities[id]:undefined
)

export const selectCurrentRepMsg = createSelector(
  [(_=>_),selectCurrentRepMsgId],
  selectMessageById
)


// Action creators are generated for each case reducer function
export const { setReplyingMsg, addNewMessage, addReact, setUnsendMsg, deleteMsg, addPendingMsgLoad,
  decorateMessage
 } = messageSlice.actions

export default messageSlice.reducer