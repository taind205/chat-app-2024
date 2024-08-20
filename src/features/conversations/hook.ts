import { useAppSelector } from "@/utils/hook";
import { removePendingConvLoad, selectPendingConversationLoadIds } from "./conversationSlice";
import { useEffect } from "react";
import { useLazyGetConversationQuery } from "@/api/chat.api";
import { useDispatch } from "react-redux";

export function useFetchMissingConversations() {
    const dispatch = useDispatch();
    const pendingConvLoadIds = useAppSelector(selectPendingConversationLoadIds);
    const [trigger, {isFetching, error}] = useLazyGetConversationQuery();
    useEffect(()=>{
        if(!isFetching && pendingConvLoadIds[0]) {
            trigger({convId:pendingConvLoadIds[0]});
            dispatch(removePendingConvLoad(pendingConvLoadIds[0]));
        }
    },
    [pendingConvLoadIds,isFetching])

    return true;
}