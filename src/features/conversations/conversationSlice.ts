import { createAsyncThunk, createEntityAdapter, createSelector, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { Conversation, Conversation_ObjType, ConversationUpdate, DetailConversation, LoadingStatus, PartcipantUpdate, Participant, Participant_ObjT } from './entity';
import { chatApi } from '@/api/chat.api';
import { findAndMergeById, mergeArraysById, notEmpty, removeUndefinedProperties } from '@/utils/helperFunction';
import { RootState } from '@/store';
import { selectAllUsers, selectSelfId, selectUserById } from '../users/userSlice';
import { Message } from '../messages/entity';

export type ConversationLoadPos = [string|undefined,string|undefined]|undefined;

const conversationAdapter = createEntityAdapter({
  selectId: (conv: Conversation) => conv._id,
  // Keep the "all IDs" array sorted based on last msg
  sortComparer: (a, b) => (a.lastMsg?.substring(0,8)||"").localeCompare(b.lastMsg?.substring(0,8)||"",'en'),
})

type ConversationSliceState = {
  convLoadPos:ConversationLoadPos,
  currentConversationId:string,
  pendingConversationLoadIds:string[], // msg order is in oldest to latest
  pendingDecoratedMessageIds:string[], // msg get decorated automatically
};

const initValue = () =>{
  const initialState = conversationAdapter.getInitialState<ConversationSliceState>({
    convLoadPos: undefined,currentConversationId:'',pendingConversationLoadIds:[],pendingDecoratedMessageIds:[],
  });
  return {...initialState};
}

export const conversationSlice = createSlice({
  name: 'conv',
  initialState: initValue() ,
  reducers: {
    fullfilLastMsg: (state,action:PayloadAction<{convId:string}>)=>{
      const {convId} = action.payload;
      const conv = state.entities[convId];
      if(conv ){
        if(conv.messageIds && conv.messageIds.length>0) conv.lastMsg=conv.messageIds.at(-1);
        else conv.isRemoved=true; //remove if there's no message
      }
    },
    calculateUnreadNum: (state,action:PayloadAction<{convId:string, selfId?:string}>)=>{
      const {convId, selfId} = action.payload;
      const conv = state.entities[convId];
      if(conv) {
        const self = conv.participants?.find(v=>v.id==selfId);
        if(self && conv.messageIds) {
          const idxFound = conv.messageIds.findIndex(v=>v==self.seenMsg)
          if(idxFound==-1) conv.unread= conv.messageIds.length;
          else conv.unread = conv.messageIds.length-idxFound-1;
        } else conv.unread=0;
      }
    },
    removeConversation: (state,action:PayloadAction<string>)=>{
      const id = action.payload;
      const conv = state.entities[id]
      if(conv) {
        conv.isRemoved=true;
      }
    },
    addPendingConvLoad: (state,action:PayloadAction<string>)=>{
      state.pendingConversationLoadIds.push(action.payload);
    },
    removePendingConvLoad: (state,action:PayloadAction<string>)=>{
      state.pendingConversationLoadIds.filter(v=>v!=action.payload);
    },
    openConv: (state,action:PayloadAction<string>) => {
      const convId = action.payload;
      const isRemoved = state.entities[convId]?.isRemoved;
      if(!isRemoved) state.currentConversationId = action.payload;},
    setTempConv: (state, action:PayloadAction<{userIds:string[]}>) =>{
      const {userIds} = action.payload;
      if(userIds.length==2) {
        const convId = state.ids.find(id=>state.entities[id].type=='directMessage' && state.entities[id].participants?.filter(p=>userIds.includes(p.id)).length==2)
        if(convId) {
          state.currentConversationId = convId;
        } else {
          const conv:Conversation={_id:'temp', participants:userIds.map(v=>({id:v})),isHideFromLatestList:true,type:'directMessage'}
          state.entities['temp']=conv;
          state.currentConversationId = 'temp';
        }
      }
    },
    addNewConvMessage: (state, action:PayloadAction<{msg:Message,selfId?:string}>)=>{
      const {msg:newMsg, selfId} = action.payload;
      const convId = newMsg.conv;
      if(convId){
        const conv = state.entities[convId];
        if(conv){
          conv.isRemoved=false;
          if(conv.messageIds) {
            conv.messageIds.push(newMsg._id);
            state.pendingDecoratedMessageIds=conv.messageIds.slice(-2)
          }
          if(conv.lastMsg) conv.lastMsg = newMsg._id;
          let sender = conv.participants?.find(v=>v.id==newMsg.user);
          if(sender) {
            sender.seenAt = new Date().toISOString();
            sender.seenMsg = newMsg._id;
          }
          if(newMsg.user && newMsg.user==selfId) conv.unread=0;
          else if(newMsg.act?.by && newMsg.act.by==selfId) conv.unread=0;
          else conv.unread = (conv.unread||0)+1;
          conv.someUsers = (conv.someUsers||[]).concat(conv.seenUsers||[]);
          conv.seenUsers = [];
          state.ids = state.ids.filter(v=>v!=convId);
          state.ids.push(convId);
      }
      }
    },
    deleteConvMsg: (state, action:PayloadAction<{convId:string,msgId:string}>)=>{
      const {convId,msgId} = action.payload;
      const conv = state.entities[convId];
      if(conv) {
        state.entities[convId].mediaMsgIds =conv.mediaMsgIds?.filter(v=>v!=msgId);
        if(conv.messageIds) {
          const removedMsgIdx = conv.messageIds.indexOf(msgId);
          if(removedMsgIdx!=-1) {
            conv.messageIds.splice(removedMsgIdx,1);
            const idx = Math.max(removedMsgIdx,1)-1;
            state.pendingDecoratedMessageIds=conv.messageIds.slice(idx,idx+3);
          }
        }
        if(conv.lastMsg==msgId) {
          const newLastMsg = conv.messageIds?.at(-1);
          if(newLastMsg) {
            conversationAdapter.updateOne(state,{id:convId,changes:{lastMsg:newLastMsg}})
          }
          else conv.isRemoved=true; // If there's no last msg, remove it from the list
        }
      }
    },
    updateConv: (state,action:PayloadAction<ConversationUpdate>) => {
      let update = removeUndefinedProperties(action.payload);
      if(!update._id) throw new Error("data isn't update as expect");
      const conv = state.entities[update._id];
      if(conv && conv.type=='groupChat') state.entities[update._id] = {...conv,...update}
    },
    //nickname, role, seen
    updateParticipants: (state, action:PayloadAction<{update:PartcipantUpdate, selfId?:string}>)=>{
      const {convId,participantId, ...updateData} = action.payload.update;
      const conv = state.entities[convId];
      if(conv?.participants){
        const target = conv?.participants?.find(v=>v.id==participantId)
        if(target) {
          state.entities[convId].participants = conv.participants.filter(v=>v.id!=participantId).concat([{...target,...updateData}]);
          if(participantId==action.payload.selfId)
            state.entities[convId].unread=0;
        }
      }
    },
    addParticipant: (state, action:PayloadAction<PartcipantUpdate>)=>{
      const {convId,participantId,role,nickname} = action.payload;
      const conv = state.entities[convId];
      if(conv){
        if(conv.participants?.findIndex(v=>v.id==participantId)==-1) 
          conv.participants.push({id:participantId})}
      }, 
    removeParticipant: (state, action:PayloadAction<PartcipantUpdate>)=>{
      const {convId,participantId} = action.payload;
      const conv = state.entities[convId];
      if(conv){
        const target = conv.participants?.findIndex(v=>v.id==participantId) 
        if(target!==undefined && target!=-1) conv.participants?.splice(target,1); 
        }
  },},
  extraReducers(builder) {
    builder
        .addMatcher(
          chatApi.endpoints.logout.matchFulfilled,
          (state, action) => {
            const {logout} = action.payload;
            if(logout) {
              Object.assign(state,initValue())
            }
          }
      )
      .addMatcher(
        chatApi.endpoints.getLatestConversations.matchFulfilled,
        (state, action) => {
          // Remove Dup and Update store
            state.convLoadPos=action.payload.pos;
            const newConversations = transformConversation(action.payload.convs);
            conversationAdapter.upsertMany(state,newConversations); //Should merge instead of remove
        }
      )
      .addMatcher(
        chatApi.endpoints.getConversation.matchFulfilled,
        (state, action) => {
          const {conv, msgCode} = action.payload;
          if(!conv) return;
          
          //remove loading conv
          const removeIdx = state.pendingConversationLoadIds.indexOf(conv._id);
          if(removeIdx!=-1) { 
            state.pendingConversationLoadIds.splice(removeIdx,1);
            const lastMsg = conv.messages[0]?._id; //
            if(lastMsg) conv.lastMsg=lastMsg; // Currently, conv load from pending list always have correct last msg ().
          }

          let newConversation = transformConversation([conv])[0];
          //loadMsg order from server is latest to oldest, msgIds in store is from oldest to latest.
          let newMessageIds=newConversation.messages?.map(v=>v._id).filter(notEmpty).toReversed();
          // loadMsg order is now from oldest to latest
          
          const oldConverssation = state.entities[newConversation._id];
          if(!oldConverssation) {
            newConversation.isHideFromLatestList=true;
          } 
          let msgIds = oldConverssation?.messageIds;
          if(!msgIds) msgIds=newMessageIds;
          else msgIds=joinMsgIds(msgIds,newMessageIds||[]);
          newConversation.messageIds= msgIds;
          
          if(newMessageIds) state.pendingDecoratedMessageIds = newMessageIds;
          
          //Handle a case last msg is null
          if(!newConversation.lastMsg) newConversation.lastMsg=msgIds?.at(-1);

          // UnHide from latest conv list if the new conv is newer than any conv in latest conv list.
          if(newConversation.lastMsg) {
            const convLastMsg = newConversation.lastMsg;
            state.ids.findIndex(id=>{
              const conv = state.entities[id];
              if(!conv.isRemoved && !conv.isHideFromLatestList && conv.lastMsg && conv.lastMsg.localeCompare(convLastMsg,'en')<0)
                newConversation.isHideFromLatestList=false;
            })
          }
          newConversation.unread=undefined;// The unread num is calculated at component;

          conversationAdapter.upsertOne(state,newConversation);

          // Replace temp conv with new conv if participants is the same
          if(state.currentConversationId=='temp' && newConversation.type=='directMessage'){
            const participants = state.entities[state.currentConversationId].participants?.map(v=>v.id);
            const newConvParticipants = newConversation.participants;
            if(participants && newConvParticipants 
              && participants.filter(v=>v==newConvParticipants[0].id||v==newConvParticipants[1].id).length==2)
              state.currentConversationId=conv._id
          }
        }
      )
      .addMatcher(
        chatApi.endpoints.getMessages.matchFulfilled,
        (state, action) => {
          // Remove Dup and Update store
            if(!action.payload) return;
            let updatedConvId = action.meta.arg.originalArgs.cid
            
            //loadMsg order from server is latest to oldest, msgIds is from oldest to latest.
            const newMsgIds = action.payload.messages.map(v=>v._id).toReversed();
            
            let msgIds = state.entities[updatedConvId]?.messageIds;
            if(!msgIds) msgIds=newMsgIds;
            else msgIds=joinMsgIds(msgIds,newMsgIds);

            state.pendingDecoratedMessageIds = newMsgIds;
            conversationAdapter.updateOne(state,{id:updatedConvId, changes:{messageIds:msgIds}});
        }
      )
      .addMatcher(
        chatApi.endpoints.getMediaMessages.matchFulfilled,
        (state, action) => {
          // Remove Dup and Update store
            if(!action.payload) return;
            let updatedConvId = action.meta.arg.originalArgs.cid
            
            //loadMsg order from server is latest to oldest, msgIds is from oldest to latest.
            const newMediaMsgIds = action.payload.messages.map(v=>v._id).toReversed();
            
            let mediaMsgIds = state.entities[updatedConvId]?.mediaMsgIds;
            if(!mediaMsgIds) mediaMsgIds=newMediaMsgIds;
            else mediaMsgIds=joinMsgIds(mediaMsgIds,newMediaMsgIds);
            
            conversationAdapter.updateOne(state,{id:updatedConvId, changes:{mediaMsgIds:mediaMsgIds}});
        }
      )
  }
})

function joinMsgIds(msgIds:string[],loadMsg:string[]){ // return msg order is in oldest to latest
  if(loadMsg.length<1) return msgIds;
  //find the oldest msg that is newer than loadMsg
  let startIdx = msgIds.findIndex(v=>v.localeCompare(loadMsg.at(-1)||'','en')>=0);
  if(startIdx==-1) startIdx=msgIds.length;
  else if(msgIds[startIdx].localeCompare(loadMsg.at(-1)||'','en')==0) startIdx++;
  //find the newest msg that is older than loadMsg; 10,10
  let endIdx = 0;
  for(let i=startIdx-1;i>=0;i--){
      if(msgIds[i].localeCompare(loadMsg[0],'en')<=0) { 
        if(msgIds[i].localeCompare(loadMsg[0],'en')==0)
          endIdx=i;
        else endIdx=i+1; break; 
      }
    }

  const start = msgIds.slice(0,endIdx);
  const end =  loadMsg.concat(msgIds.slice(startIdx));
  return(start.concat(end));
}

function transformConversation(conversation:Conversation_ObjType[]|DetailConversation[]) {
  return conversation.map(conv => {
    let transformConv:Conversation = {...conv,type:conv.type=='g'?'groupChat':'directMessage'};
    if(transformConv.lastMsg) transformConv.isHideFromLatestList=false;
    return transformConv; 
  });
}

function addMsgRenderProps(msgList: Message[]) {
  let newMsgList = msgList;
  for (const i in msgList) {
      if (msgList[i].user == msgList[Number(i) - 1]?.user) {
          msgList[i].isHideSenderIcon = true;
          msgList[Number(i) - 1].isHideSenderName = true;
      }
  }

  return msgList;
}

export const conversationsSelectors = conversationAdapter.getSelectors<RootState>(
  (state) => state.conv
)

export const selectConvLoadPos = (state:RootState) => state.conv.convLoadPos;

export const selectConversations = conversationsSelectors.selectEntities;

export const selectConversationIds = conversationsSelectors.selectIds;

export const selectConversationById = conversationsSelectors.selectById;

export const selectCurrentConversationId = (state: RootState) => state.conv.currentConversationId;

export const selectPendingConversationLoadIds = (state:RootState) => state.conv.pendingConversationLoadIds;
export const selectPendingDecoratedMessageIds = (state:RootState) => state.conv.pendingDecoratedMessageIds;

export const selectCurrentConversation = createSelector(
  [(state:RootState) =>state, selectCurrentConversationId],
  selectConversationById
)

export const selectCurrentDirrectConvUserId = createSelector(
  [selectCurrentConversation,selectSelfId],
  (conv,selfId) => (conv && conv.type!='groupChat')? conv.participants?.find(v=>v.id!=selfId)?.id:undefined
)

export const selectCurrentConversationMsgIds = createSelector(
  [selectCurrentConversation],
  (conv) => conv?.messageIds
);

const selectCurrentParticipants = createSelector(
  [selectCurrentConversation],
  (conv) => conv?.participants
);

const selectCurrentMessageSeenUserMap = createSelector(
  [selectCurrentParticipants, selectSelfId],
  (participants, selfId) => participants?getSeenUsersOfMsg(participants.filter(v=>v.id!=selfId)):{}
)

export const selectMessageSeenUser = createSelector(
  [selectCurrentMessageSeenUserMap, (_,msg?:Message)=>msg],
  (map,msg) => msg? map[msg._id]?.filter(v=>v!=msg.user):undefined
)

function getSeenUsersOfMsg(participants:Participant_ObjT[]) {
  const msgSeenUsers:Record<string, string[]|undefined>={};
  participants.forEach(user => {
    const userSeenMsg = user.seenMsg;
    if(userSeenMsg) (msgSeenUsers[userSeenMsg]?.push(user.id)) || (msgSeenUsers[userSeenMsg]=[user.id])
  }) 
  return msgSeenUsers;
}

export const selectSelfAsParticipants = createSelector(
  [selectCurrentParticipants,selectSelfId],
  (participants,id) => participants?.find(v=>v.id==id)
);

const selectCurrentParticipantById = createSelector(
  [selectCurrentParticipants,(_,id?:string)=>id],
  (participants,id) => id?participants?.find(v=>v.id==id):undefined
);

export const selectCurrentParticipantDataById = createSelector(
  [selectCurrentParticipants, selectUserById],
  (participants,user) => user? ({...participants?.find(v=>v.id==user._id),data:user}) as Participant:undefined
);

export const selectAllDirrectMsgUser = createSelector(
  [selectConversations],
  convs => {
    const usersSet = new Set<string>();
    console.log('obj key convs', Object.keys(convs));
    for(const convId of Object.keys(convs)){
      const conv = convs[convId];
      if(conv.type=='directMessage'){
        if(conv.participants)
          for(const p of conv.participants)
            usersSet.add(p.id)
        else if(conv.someUsers && conv.seenUsers){
          for(const p of conv.someUsers.concat(conv.seenUsers))
            usersSet.add(p);
        }
      }
    }
    console.log('array from set:',Array.from(usersSet))
    return Array.from(usersSet);
  }
)

export const { addNewConvMessage, deleteConvMsg, updateParticipants, addParticipant, removeParticipant,
  updateConv, setTempConv, openConv, addPendingConvLoad, removeConversation, calculateUnreadNum, fullfilLastMsg
 , removePendingConvLoad } 
  = conversationSlice.actions

export default conversationSlice.reducer