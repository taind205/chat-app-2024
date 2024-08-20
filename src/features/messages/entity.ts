import { ConversationRole } from "../conversations/entity";

export interface UserReact {
  user:string;
  react:string;
}

export interface UserReactUpdate extends UserReact {
  msgId:string,
  convId:string,
}

export interface MessageObjType {
  _id: string;
  cont?: string;
  user?: string;
  status?: MessageStatus;
  type?: MessageType;
  react?: UserReact[];
  userHide?: string[];
  repMsg?: Omit<MessageObjType,'repMsg'>;
  media?: string[];
  sticker?: number;
  file?: string[];
}

export enum MessageStatus {
  Unsent = 'unsent',
  Normal = 'normal',
}

export interface MediaMessage extends Omit<MessageObjType,"repMsg"> {
  media:string[],
  repMsg?:string,
}

// Type for all message storing in client
export interface Message extends Omit<MessageObjType,"repMsg">,Partial<Omit<ActionMessage,"_id"|"conv">> { 
    cont?:string
    user?:string,
    conv?:string,
    isHideSenderIcon?:boolean, 
    isHideSenderName?:boolean,
    isShowTimeHeader?:boolean,
    userNickname?:string,
    repMsg?:string,
    imgFiles?:File[]
};

export interface MessageSumary extends Pick<MessageObjType,'_id'|'cont'|'user'>{
  userNickname?:string,
  status?:MessageStatus,
}

export type ActionMessage = {_id:string, conv?:string} & (
  {type:'createChat',act:{by:string,target?:undefined,value?:undefined}}|
  {type:'setRole',act:{by:string,target:string,value:ConversationRole}}|
  {type:'setNickname',act:{by:string,target:string,value:string}}|
  {type:'leave',act:{by:string,target?:undefined,value?:undefined}}|
  {type:'addMember',act:{by:string,target:string,value?:undefined}}|
  {type:'removeMember',act:{by:string,target:string,value?:undefined}}|
  {type:'changeGroupPhoto',act:{by:string,target?:undefined,value?:string}}|
  {type:'changeGroupName',act:{by:string,target?:undefined,value:string}}
)

export type MessageType = 'setRole'|'setNickname'|'leave'|'addMember'|'removeMember'|'changeGroupPhoto'|'changeGroupName'|'createChat'