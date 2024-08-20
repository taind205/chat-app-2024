import { useAppDispatch, useAppSelector } from "@/utils/hook";
import { selectAllDirrectMsgUser } from "@/features/conversations/conversationSlice";
import { getOnlineStatus, getUsersData, selectSocketConnectStatus } from "@/features/socket/socketSlice";
import { useEffect } from "react";
import { clearPendingUserLoad, selectPendingUserLoadIds } from "./userSlice";

export function useFetchOnlineStatus() {
    const allDirrectMsgUsers = useAppSelector(selectAllDirrectMsgUser);
    const isSocketConnected = useAppSelector(selectSocketConnectStatus);
    const dispatch = useAppDispatch();
    
    useEffect(() => {
        //Implementing the setInterval method
        const interval = setInterval(() => {
            if(isSocketConnected) dispatch(getOnlineStatus({userIds:allDirrectMsgUsers}));
        }, 20*1000);
 
        //Clearing the interval
        return () => clearInterval(interval);
    }, [allDirrectMsgUsers,isSocketConnected]);

    return true;
}

export function useFetchMissingUsers() {
    const pendingUserLoadIds = useAppSelector(selectPendingUserLoadIds);
    const isSocketConnected = useAppSelector(selectSocketConnectStatus);
    const dispatch = useAppDispatch();

    useEffect(()=>{
        const interval = setInterval(() => {
            if(pendingUserLoadIds.length>0 && isSocketConnected){
                dispatch(getUsersData({userIds:pendingUserLoadIds}));
                dispatch(clearPendingUserLoad());
            }
        }, 500);
 
        //Clearing the interval
        return () => clearInterval(interval);
    },[isSocketConnected,pendingUserLoadIds])

    return true;
}