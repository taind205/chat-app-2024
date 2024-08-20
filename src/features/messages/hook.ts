import { useAppSelector } from "@/utils/hook";
import { useEffect, useState } from "react";
import { useGetMessageQuery } from "@/api/chat.api";
import { decorateMessage, selectMessageById, selectPendingMsgLoadIds } from "./messageSlice";
import { selectPendingDecoratedMessageIds } from "../conversations/conversationSlice";
import { useDispatch } from "react-redux";

export function useFetchMissingMessages() {
    const pendingMsgLoadIds = useAppSelector(selectPendingMsgLoadIds);
    const [currentLoadingMsg, setCurrentLoadingMsg] = useState<{convId:string,msgId:string}|null>(null);
    const {isFetching, error} = useGetMessageQuery(
      {mid:currentLoadingMsg?.msgId||'',cid:currentLoadingMsg?.convId||''},
      {skip:!(currentLoadingMsg?.msgId)||!(currentLoadingMsg?.convId)});
    useEffect(()=>{
      if(!isFetching) {
          if(pendingMsgLoadIds[0]) setCurrentLoadingMsg(pendingMsgLoadIds[0]);
      }
    },
    [ pendingMsgLoadIds, isFetching])
    return true;
}

export function useDecorateMessage() {
  const dispatch = useDispatch();
  const decoratedMessageIds = useAppSelector(selectPendingDecoratedMessageIds);
  
  useEffect(()=>{
    if(decoratedMessageIds.length>=1) {
      dispatch(decorateMessage({msgIds:decoratedMessageIds}))
    }
  },
  [ decoratedMessageIds])
  return true;
}