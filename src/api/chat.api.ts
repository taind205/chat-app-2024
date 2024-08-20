import { Conversation } from "@/features/conversations/entity";
import { MediaMessage, Message, MessageObjType } from "@/features/messages/entity";
import { User, UserObjType } from "@/features/users/entity";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { GetConv_Response, GetLatestConv_Response, ConvSearchResponse, UserSearchResponse } from "./type";
import { ConversationLoadPos } from "@/features/conversations/conversationSlice";
import { CodeResponse, CredentialResponse } from "@react-oauth/google";

export const chatApi = createApi({
    reducerPath: 'chatApi',
    baseQuery: fetchBaseQuery({ baseUrl: process.env.NEXT_PUBLIC_SERVER_DOMAIN,credentials:"include" }),
    endpoints: (builder) => ({

      googleLogin: builder.mutation<{user:UserObjType},Omit<CodeResponse, "error" | "error_description" | "error_uri">>({
        query: (args) => ({
          url: '/auth/google/callback',
          method: 'POST',
          body: {...args},
        }),
      }),

      login: builder.mutation<{user:UserObjType},{uid:string, password:string}>({
        query: (args) => ({
          url: '/auth/login', 
          method: 'POST',
          body: {...args},
        }),
      }),

      logout: builder.mutation<{logout:boolean},true>({
        query: () => ({
          url: '/auth/logout',
          method: 'POST',
        }),
      }),

      getSignedInUser: builder.query<UserObjType,true>({
        query: () => ({
          url: '/users/get-signed-in-user', 
        }),
      }),

      getSampleUser: builder.query<{users:UserObjType[]},undefined>({
        query: () => ({
          url: '/users/get-sample-user',
        }),
      }),

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
   useGetConversationQuery, useGetMessagesQuery, useGetMediaMessagesQuery, useLoginMutation,
  useLazyGetSampleUserQuery, useLogoutMutation, useGetSignedInUserQuery, useGoogleLoginMutation,
  useGetMessageQuery, useLazyGetSignedInUserQuery, useLazyGetConversationQuery } = chatApi;

