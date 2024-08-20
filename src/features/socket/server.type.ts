import { MessageStatus, MessageType } from "../messages/entity";

interface UserReact {
    user:string;
    react:string;
  }
  
export interface UserReactInput extends UserReact {
  msgId:string,
  convId:string,
}

export interface SendMessageInput {
  user: string;
  conv: string;
  media?:string[];
  cont: string;
  repMsg?: string;
  imgFiles?: Array<string|File>;
  sticker?: number;
  file?: string[];
}


export interface Message {
  _id: string;
  
  cont: string;

  status?: MessageStatus;

  type?: MessageType;

  user: string;

  conv: string;

  repMsg?: string;

  media?: string[];
  sticker?: number;
  react?: UserReact[];

  userHide?: string[];
  file?: string[];
}
