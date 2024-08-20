import { Message, MessageObjType, MessageSumary } from "@/features/messages/entity";
import { User } from "../users/entity";

export interface Conversation_ObjType {
  _id:string;
  type?: string;
  status?: string;
  name?: string;
  img?: string;
  theme?:number;
}

// Display latest conv in the main conversation bar
export interface LatestConversation extends Conversation_ObjType{
  participants?: Participant_ObjT[];
  lastMsg: string;
  unread: number;
  seenUsers: string[];
  someUsers: string[];
}

// Display group chat as search result
export interface GroupChat extends Conversation_ObjType{
  users: User[];
}

// Use upon open conversation
export interface DetailConversation extends Conversation_ObjType{
  participants: Participant_ObjT[];
  users: User[];
  messages: MessageObjType[];
  lastMsg:string;
}

export interface Participant_ObjT {
    id:string;
    seenMsg?:string;
    seenAt?:string;
    role?:ConversationRole;
    nickname?:string;
  }

export interface Participant extends Participant_ObjT {
  data?:User;
  role?:ConversationRole;
}

export interface PartcipantUpdate {
  convId:string,
  participantId:string,
  seenMsg?:string,
  seenAt?:string,
  nickname?:string,
  role?:ConversationRole,
}

export type ConversationUpdate = Pick<Conversation,'_id'|'img'|'name'>

export type ConversationType = 'directMessage'|'groupChat';

export interface Conversation extends Conversation_ObjType,Partial<DetailConversation & GroupChat & LatestConversation>{
  _id:string|'temp';
  isHideFromLatestList?:boolean;
  isRemoved?:boolean;
  type:ConversationType;
  messageIds?:string[];
  mediaMsgIds?:string[];
}

type ConversationWithoutUser = Omit<Conversation,"users">

export type ConversationUserMap = Record<string, ConversationUser | undefined>

export interface ConversationWithUserMap extends ConversationWithoutUser {
    users: ConversationUserMap,
    seenUserOfMsg:Record<string, string[]|undefined>,
}

export function isConversationWithUserDataMap(obj: Conversation | ConversationWithUserDataMap): obj is ConversationWithUserDataMap {
    return typeof obj.participants === 'object' && !Array.isArray(obj.participants);
  }

export type ConversationUserWithDataMap = Record<string, ConversationUserWithData | undefined>;

export interface ConversationWithUserDataMap extends ConversationWithUserMap {
    users: ConversationUserWithDataMap,
}

export interface ConversationUser {
    id: string, seenMsg: string, nickname?: string, seenAt:string, role?:ConversationRole
}

export interface ConversationUserWithData extends ConversationUser {
    userData:User;
}

export type LoadingStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

export type ConversationRole = 'admin'|'member';