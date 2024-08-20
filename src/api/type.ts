import { GroupChat } from "@/features/conversations/entity";
import { DetailConversation, LatestConversation } from "@/features/conversations/entity";
import { MessageSumary } from "@/features/messages/entity";
import { UserObjType } from "@/features/users/entity";

export interface GetLatestConv_Response {
  convs: LatestConversation[];

  users: UserObjType[];

  latestMsgs: MessageSumary[];

  pos: [string,string];
}

export interface GetConv_Response {
  conv?: DetailConversation;
  users?: UserObjType[];
  msgCode?:string
}

export interface ConvSearchResponse {
  groups: GroupChat[];
  users: UserObjType[];
}

export interface UserSearchResponse {
  users: UserObjType[];
}

export interface SearchResult extends Partial<ConvSearchResponse & UserSearchResponse>{
}