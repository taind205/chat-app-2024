import { ActionMessage, Message, UserReactUpdate } from "@/features/messages/entity";
import * as Server from "./server.type";
import { UsernameCheckStatus } from "./socketSlice";
import { User } from "../users/entity";
import { Conversation_ObjType, ConversationRole } from "../conversations/entity";

export enum SocketEvent {
  Connect = "connect",
  Disconnect = "disconnect",

  // Emit events
  sendMsg="sendMsg",
  reactMsg="reactMsg",
  unsendMsg="unsendMsg",
  hideMsg="hideMsg",
  seeMsg="seeMsg",
  updateUser="updateUser",
  checkUsername="checkUsername",
  getOnlineStatus="getOnlineStatus",
  updateParticipant="updatePtcp",
  updateConversation="updateConv",
  getUsersData="getUsersData",
  createGroupChat="createGroupChat",
  addPtcp="addPtcp",
  removePtcp="removePtcp",
  leaveGroupChat="leaveGroupChat",

  // On events
  newMsg = "newMsg",
  newMsgReact="newMsgReact",
  newUnsentMsg="newUnsentMsg",
  newHideMsg="newHideMsg",
  newSeenMsgUser="newSeenMsgUser",
  newUpdateStatus="newUpdateStatus",
  newUsernameCheck="newUsernameCheck",
  newOnlineStatus="newOnlineStatus",
  newParticipantUpdate="newPtcpUpdate",
  newConvUpdate="newConvUpdate",
  newUsersData="newUsersData",
  newGroupChat="newGroupChat",
  newPtcpAction="newPtcpAction",

  Error = "error",
  ConnectError = "connect_error"
}

export interface ServerToClientEvents {
    noArg: () => void;
    [SocketEvent.newMsg]:(msg:Server.Message)=>void;
    [SocketEvent.newMsgReact]:(msgReact:UserReactUpdate)=>void;
    [SocketEvent.newUnsentMsg]:(res:{msgId:string})=>void;
    [SocketEvent.newHideMsg]:(res:{convId:string, msgId:string, status:'ok'|'err'})=>void;
    [SocketEvent.newSeenMsgUser]:(res:{convId:string, userId:string, msgId:string,seenAt:string})=>void;
    [SocketEvent.newUpdateStatus]:(res:UpdateUserData)=>void;
    [SocketEvent.newUsernameCheck]:(res:{username:string,status:UsernameCheckStatus})=>void;
    [SocketEvent.newOnlineStatus]:(res:Pick<User,"_id"|"lastAct">[])=>void;
    [SocketEvent.newConvUpdate]:(res:{actionMsg:ActionMessage,msgCode?:undefined}|{msgCode:string,actionMsg?:undefined})=>void;
    [SocketEvent.newParticipantUpdate]:(res:{actionMsg:ActionMessage,msgCode?:undefined}|{msgCode:string,actionMsg?:undefined})=>void;
    [SocketEvent.newUsersData]:(res:User[])=>void;
    [SocketEvent.newGroupChat]:(res:{conv:Conversation_ObjType,msg:ActionMessage})=>void;
    [SocketEvent.newPtcpAction]:(res:{convId:string,msg:ActionMessage,msgCode?:'failed'|'ok'})=>void;
    [SocketEvent.Error]:(e:Error)=>void;
  }

  interface ClientData {
    targetId?:string,
  }
  export interface ClientData_SendMsg extends ClientData {
    msg:Server.SendMessageInput
  };
  
  export interface ClientData_ReactMsg extends ClientData {
    reaction:Server.UserReactInput
  };
  
  export interface ClientData_UnsendMsg extends ClientData {
    targetId?:string, msgId:string,convId:string
  }
  
  export interface ClientData_HideMsg extends ClientData {
    targetId?:string, msgId:string,convId:string
  };
  
  export interface ClientData_SeeMsg extends ClientData {
    targetId?:string, convId:string,msgId:string
  };
  
  export interface ClientToServerEvents {
      [SocketEvent.sendMsg]: (data:ClientData_SendMsg)=> void;
      [SocketEvent.reactMsg]: (data:ClientData_ReactMsg)=> void;
      [SocketEvent.unsendMsg]: (data:ClientData_UnsendMsg)=>void;
      [SocketEvent.hideMsg]: (data:ClientData_HideMsg)=>void;
      [SocketEvent.seeMsg]: (data:ClientData_SeeMsg)=>void;
      [SocketEvent.updateUser]: (data:UpdateUserInput)=>void;
      [SocketEvent.checkUsername]: (data:{username:string})=>void;
      [SocketEvent.getOnlineStatus]: (data:{userIds:string[]})=>void;
      [SocketEvent.updateParticipant]: (data:UpdateParticipantInput)=>void;
      [SocketEvent.updateConversation]: (data:UpdateConversationInput)=>void;
      [SocketEvent.getUsersData]:(data:{userIds:string[]})=>void;
      [SocketEvent.createGroupChat]:(data:{userIds:string[]})=>void;
      [SocketEvent.addPtcp]:(data:{convId:string,newUserId:string})=>void;
      [SocketEvent.removePtcp]:(data:{convId:string,targetUserId:string})=>void;
      [SocketEvent.leaveGroupChat]:(data:{convId:string})=>void;
    }
  
export interface InterServerEvents {
    ping: () => void;
  }
  
export interface SocketData {
    name: string;
    age: number;
  }

  
export type UpdateUserInput= 
  { username: string } |
  { displayName: string } |
  { username: string,
  displayName: string } |
  {prfImg: File|string}
  
export type UpdateParticipantInput = ({ nickname: string, role?:undefined }|{nickname?:undefined, role:ConversationRole}) 
& {targetUserId: string, convId:string, dirrectUserId?:string}

type UpdateParticipantOutput = (UpdateParticipantInput & {userId:string,msgCode?:undefined})|{msgCode:'updateFailed'|'ok'};

export type UpdateConversationInput = { convId:string, name: string, img?:undefined } 
| { convId: string, img:File|string, name?:undefined }

type UpdateConversationOutput = (Omit<UpdateConversationInput,'img'> & {userId:string,img?:string,msgCode?:undefined})|{msgCode:'updateFailed'|'ok'};

type UpdateUserData= 
  { username: string}|
    {displayName: string}|
    {prfImg: string;}|
    {msgCode:string}
  