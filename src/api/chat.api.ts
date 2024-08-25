import { Conversation } from "@/features/conversations/entity";
import { MediaMessage, Message, MessageObjType } from "@/features/messages/entity";
import { User, UserObjType } from "@/features/users/entity";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { GetConv_Response, GetLatestConv_Response, ConvSearchResponse, UserSearchResponse } from "./type";
import { ConversationLoadPos } from "@/features/conversations/conversationSlice";
import { CodeResponse, CredentialResponse } from "@react-oauth/google";
import { RootState } from "@/store";

export const chatApi = createApi({
    reducerPath: 'chatApi',
    baseQuery: fetchBaseQuery({ baseUrl: process.env.NEXT_PUBLIC_SERVER_DOMAIN,
      prepareHeaders: (headers, { getState }) => {
        const token = (getState() as RootState).app.token;
        // If we have a token set in state, let's assume that we should be passing it.
        if (token.value) {
          headers.set('authorization', `Bearer ${token.value}`)
        }
        return headers
      }}),//credentials:"include" 
    endpoints: (builder) => ({

      getLatestConversations: builder.query<GetLatestConv_Response,{uid:string, pos:ConversationLoadPos}>({
        query: (args) => ({
          url: '/conversation/latest',
          params: {...args},
        }),
      }),

      getConversation: builder.query<GetConv_Response,{uids:string[]}|{convId:string}>({
        query: (args) => ({
          url: '/conversation/get',
          params: {id:('convId' in args)?[args.convId]:args.uids},
          
        }),
        keepUnusedDataFor:15,
      }),

      getMessage: builder.query<MessageObjType,{cid:string, mid:string}>({
        query: (args) => ({
          url: '/message/get-one-by-conv',
          params: { ...args},
        }),
      }),

      getMessages: builder.query<{messages:MessageObjType[]},{cid:string, mid:string}>({
        query: (args) => ({
          url: '/message/by-conv-and-pos', 
          params: { ...args},
        }),
      }),

      getMediaMessages: builder.query<{messages:MediaMessage[]},{cid:string, mid?:string}>({
        query: (args) => ({
          url: '/message/media-by-conv-and-pos',
          params: { ...args},
        }),
      }),

      searchConv: builder.query<ConvSearchResponse,{term:string}>({
        query: (args) => ({
          url: '/users/search', 
          params: {...args,type:'conv'},
        }),
      }),

      searchUser: builder.query<UserSearchResponse,{term:string}>({
        query: (args) => ({
          url: '/users/search',
          params: {...args,type:'user'},
        }),
      }),

      getUsers: builder.query<UserObjType[],{ids:string[]}>({
        query: (args) => ({
          url: '/users/by-ids',
          params: {...args},
        }),
      }),
    }),
  });

export const { useSearchConvQuery, useSearchUserQuery, useGetLatestConversationsQuery,
   useGetConversationQuery, useGetMessagesQuery, useGetMediaMessagesQuery, 
   useGetMessageQuery, useLazyGetConversationQuery } = chatApi;

