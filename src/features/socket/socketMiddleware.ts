import { Middleware } from "redux";
// Actions
import {
  connectionEstablished,
  initSocket,
  connectionLost,
  sendMessage,
  reactMessage,
  unsendMsg,
  hideMsg,
  seeMsg,
  disconnectSocket,
  updateUserProfile,
  setUpdateStatus,
  addUsernameCheck,
  checkUsername,
  getOnlineStatus,
  makeConversationUpdate,
  makeParticipantUpdate,
  getUsersData,
  requestCreateGroupChat,
  requestAddPtcp,
  requestRemovePtcp,
  requestLeaveGroupChat
} from "./socketSlice";
import {SocketFactory, SocketInterface } from "./SocketFactory";
import { Message, UserReactUpdate } from "@/features/messages/entity";
import { addNewMessage, addReact, deleteMsg, selectMessageById, setUnsendMsg } from "@/features/messages/messageSlice";
import { addPendingConvLoad, addNewConvMessage, deleteConvMsg, updateParticipants, updateConv, addParticipant, removeParticipant, removeConversation, selectCurrentConversation, selectCurrentConversationId, openConv } from "../conversations/conversationSlice";
import { RootState } from "@/store";
import { addPendingUserLoad, mergeUserData, replaceUserData, selectSelfId, updateSelfData } from "../users/userSlice";
import { SocketEvent } from "./type";
import { closeModal, openUI } from "../main/appSlice";
 
const socketMiddleware: Middleware = (store) => {
  let instance: SocketInterface|null;
 
  return (next) => (action) => {
    
    if (disconnectSocket.match(action) && instance) {
      SocketFactory.disconnect();
      instance=null;
    }

    // Middleware logic for the `initSocket` action
    if (initSocket.match(action)) {
      if (!instance && typeof window !== "undefined") {
        // Client-side-only code
        // Create/ Get Socket Socket
        
        instance = SocketFactory.init(action.payload);
 
        instance.socket.on(SocketEvent.Connect, () => {
          store.dispatch(connectionEstablished());
        });
        // handle all Error events
        instance.socket.on(SocketEvent.ConnectError, (err) => {
          console.error(err);
        });
        
        instance.socket.on(SocketEvent.Error, (err) => {
          console.error(err);
        });
 
        // Handle disconnect event
        instance.socket.on(SocketEvent.Disconnect, (reason) => {
            console.error(reason)
          store.dispatch(connectionLost());
        });

        // Handle action receive from server...
        instance.socket.on(SocketEvent.newMsg, (msg)=>{
          if(!msg.conv) return;
          const selfId = selectSelfId(store.getState());
          
          //transform
          let newMsg:Message;
          if(typeof msg.repMsg=='string'){
            newMsg= {...msg};
          } else newMsg = msg;

          store.dispatch(addNewMessage(newMsg));
          const rootState:RootState = store.getState();
          const storeConv = rootState?.conv?.entities?.[msg.conv||''];
          if(storeConv && storeConv.participants)
            store.dispatch(addNewConvMessage({msg:newMsg,selfId}));
          else {
            // load a conv if it not exist in the store or exist but not have user data (latest conv list)
            store.dispatch(addPendingConvLoad(msg.conv)); 
          }
        })
        instance.socket.on(SocketEvent.newMsgReact, (msgReact)=>{
          store.dispatch(addReact(msgReact));
        })
        instance.socket.on(SocketEvent.newUnsentMsg, (data)=>{
          store.dispatch(setUnsendMsg(data));
        })

        instance.socket.on(SocketEvent.newHideMsg, (res)=>{
          const {msgId,convId} = res;
          if(res.status=='ok') {
            store.dispatch(deleteMsg(msgId));
            store.dispatch(deleteConvMsg({convId,msgId}))
          }
        })

        instance.socket.on(SocketEvent.newSeenMsgUser, (res)=>{
          const {msgId,convId,userId,seenAt} = res;
          const selfId = selectSelfId(store.getState());
          store.dispatch(updateParticipants({update:{convId,seenMsg:msgId,participantId:userId,seenAt},selfId}));
        })
        
        instance.socket.on(SocketEvent.newUpdateStatus, (res)=>{
          store.dispatch(setUpdateStatus({id:'profile',status:'finish'}));
          store.dispatch(closeModal({id:'changeAvatar'}));
          store.dispatch(closeModal({id:'changeSelfUsername'}));
          if(!('msgCode' in res)) store.dispatch(updateSelfData(res));
        })

        instance.socket.on(SocketEvent.newUsernameCheck, (res)=>{
          store.dispatch(addUsernameCheck(res));
        })

        instance.socket.on(SocketEvent.newOnlineStatus, (res)=>{
          store.dispatch(mergeUserData(res));
        })
        instance.socket.on(SocketEvent.newUsersData, (res)=>{
          store.dispatch(replaceUserData(res));
        })
        instance.socket.on(SocketEvent.newConvUpdate, (res)=>{
          const selfId = selectSelfId(store.getState());

          const {actionMsg, msgCode} = res;
          if(msgCode){ //action by self
            store.dispatch(setUpdateStatus({id:'conv',status:'finish'}));
            store.dispatch(closeModal({id:"changeGroupPhoto"}))
            store.dispatch(closeModal({id:"changeGroupName"}))
            if(msgCode=='failed') throw new Error("Update failed");
          } else if(actionMsg) {
            store.dispatch(updateConv({_id:actionMsg.conv||"",...
              actionMsg.type=='changeGroupName'? {name:actionMsg.act.value}
              :actionMsg.type=='changeGroupPhoto'?{img:actionMsg.act.value}
              :{} }));
            store.dispatch(addNewMessage(actionMsg));
            store.dispatch(addNewConvMessage({msg:actionMsg,selfId}));
          } else throw new Error(`invalid data: ${res}`);
        })
        instance.socket.on(SocketEvent.newParticipantUpdate, (res)=>{
          const selfId = selectSelfId(store.getState());

          const {actionMsg, msgCode} = res;
          if(msgCode){ //action by self
            store.dispatch(closeModal({id:'setMemberNickname'}));
            store.dispatch(closeModal({id:'setMemberRole'}));
            if(msgCode=='failed') throw new Error("Update failed");
          } else if(actionMsg){
            const {type,act,conv} = actionMsg;
            if(type=='setNickname' || type=='setRole') {
              store.dispatch(updateParticipants({update:{participantId:act.target,convId:conv||"",...
                type=='setNickname'?{nickname:act.value}
                :type=='setRole'?{role:act.value}
                :{} }}) );
              store.dispatch(addNewMessage(actionMsg));
              store.dispatch(addNewConvMessage({msg:actionMsg,selfId}));
            }
            else throw new Error(`invalid data: ${res}`);
          }
          else throw new Error(`invalid data: ${res}`);
        })
        
        instance.socket.on(SocketEvent.newGroupChat, (res)=>{
          const {conv, msg} = res;
          store.dispatch(addPendingConvLoad(conv._id));        
        })
        instance.socket.on(SocketEvent.newPtcpAction, (res)=>{
          const {convId, msg,msgCode} = res;
          const selfId = selectSelfId(store.getState());
          if(msgCode=='failed') throw new Error("Update failed");

          store.dispatch(addNewMessage(msg));
          const rootState:RootState = store.getState();
          const storeConv = rootState?.conv?.entities?.[convId||''];
          if(storeConv && storeConv.participants) {
            store.dispatch(addNewConvMessage({msg,selfId}));
            if(msg.type=='addMember') {
              store.dispatch( addPendingUserLoad(msg.act.target) );
              store.dispatch( addParticipant({participantId:msg.act.target,convId}))
            } else if(msg.type=='removeMember') {
              store.dispatch( removeParticipant({participantId:msg.act.target,convId}))
              if(msg.act.target==selfId) {
                if(selectCurrentConversationId((store.getState()))==convId) store.dispatch(openConv(''));
                store.dispatch(removeConversation(convId))
                store.dispatch(openUI("index"));
              }
            } else if(msg.type=='leave') {
              store.dispatch( removeParticipant({participantId:msg.act.by,convId}))
              if(msg.act.by==selfId) {
                if(selectCurrentConversationId((store.getState()))==convId) store.dispatch(openConv(''));
                store.dispatch(removeConversation(convId))
                store.dispatch(openUI("index"));
              }
            } else if(msg.type=='createChat') {
              throw new Error('something went wrong');
            } else throw new Error('something went wrong');
          }  else {
            // handle the case where user is removed on latest list conv
            if(msg.type=='removeMember' && msg.act.target==selfId) {
                if(selectCurrentConversationId((store.getState()))==convId) store.dispatch(openConv(''));
                store.dispatch(removeConversation(convId))
                store.dispatch(openUI("index"));
            } else store.dispatch(addPendingConvLoad(convId)); // load a conv if it not exist in the store or exist but not have user data (latest conv list)
          }
        })
 
      }
    }
 
    // Send action to server...
    if (sendMessage.match(action) && instance) {
      instance.socket.emit(SocketEvent.sendMsg, action.payload);
    }
    else if (reactMessage.match(action) && instance) {
      const selfId = selectSelfId(store.getState());
      if(selfId) instance.socket.emit(SocketEvent.reactMsg, {...action.payload, reaction:{...action.payload.reaction, user:selfId}});
    }
    else if (unsendMsg.match(action) && instance) {
      instance.socket.emit(SocketEvent.unsendMsg, action.payload);
    }
    else if (hideMsg.match(action) && instance) {
      instance.socket.emit(SocketEvent.hideMsg, action.payload);
    }
    else if(seeMsg.match(action ) && instance) {
      instance.socket.emit(SocketEvent.seeMsg, action.payload);
    }
    else if(updateUserProfile.match(action ) && instance) {
      instance.socket.emit(SocketEvent.updateUser, action.payload);
    }
    else if(checkUsername.match(action ) && instance) {
      const username = action.payload.username;
      if(username){
        instance.socket.emit(SocketEvent.checkUsername, {username});
     }
    }
    else if(getOnlineStatus.match(action ) && instance) {
      const userIds = action.payload.userIds;
      if(userIds.length>0){
        instance.socket.emit(SocketEvent.getOnlineStatus, {userIds});
     }
    } else if(makeConversationUpdate.match(action ) && instance) {
      const {convId} = action.payload;
      if(convId){
        instance.socket.emit(SocketEvent.updateConversation, action.payload);
     }
    } else if(makeParticipantUpdate.match(action ) && instance) {
      const {convId, targetUserId,dirrectUserId} = action.payload;
      if(convId && targetUserId){
        instance.socket.emit(SocketEvent.updateParticipant, action.payload);
     }
    } else if(getUsersData.match(action ) && instance) {
      const {userIds} = action.payload;
      if(Array.isArray(userIds) && userIds.length>0){
        instance.socket.emit(SocketEvent.getUsersData, {userIds});
     }
    } else if(requestCreateGroupChat.match(action ) && instance) {
      const {userIds} = action.payload;
      if(userIds.length>0){
        instance.socket.emit(SocketEvent.createGroupChat, {userIds});
     }
    } else if(requestAddPtcp.match(action ) && instance) {
      const {convId,newUserId} = action.payload;
      instance.socket.emit(SocketEvent.addPtcp, {convId,newUserId});
    } else if(requestRemovePtcp.match(action ) && instance) {
      const {convId, targetUserId} = action.payload;
        instance.socket.emit(SocketEvent.removePtcp, {convId, targetUserId});
    } else if(requestLeaveGroupChat.match(action ) && instance) {
      const {convId} = action.payload;
      instance.socket.emit(SocketEvent.leaveGroupChat, {convId});
    }

    // Then Pass on to the next middleware to handle state
    // ...
    next(action);
  };
};
 
export default socketMiddleware;