'use client'
import { ConversationUI } from "@/features/conversations/container";
import { useDispatch } from "react-redux";
import { selectSelf, selectSelfId, setSelfData } from "@/features/users/userSlice";
import { useEffect, useRef } from 'react';
import { ChatInfo } from '@/features/conversations/ChatInfo';
import { MessageContainer } from '@/features/messages/container';
import "@/styles.css"
import { initSocket } from '@/features/socket/socketSlice';
import { LoginPage } from '../auth/LoginPage';
import { useAppDispatch, useAppSelector } from "@/utils/hook"
import { GlobalProvider } from "./GlobalProvider";
import { UserObjType } from "../users/entity";
import { setToken } from "./appSlice";

export const MainApp:React.FC<{user:UserObjType, token:{value:string,expire:number}}> = ({user,token}) => {
    return(
        <GlobalProvider>
            <UserUI user={user} token={token}/>
        </GlobalProvider>
    )
}

const UserUI: React.FC<{user:UserObjType, token:{value:string,expire:number}}> = ({user, token}) => {
    const dispatch = useDispatch();
    useEffect(()=>{      
        if(!token) return;
        dispatch(initSocket({token:token.value}));
        dispatch(setToken(token));
        dispatch(setSelfData(user));
        const interval = setInterval(() => {
            if(token.expire<Date.now()) {
                alert("Session expired.");
                location.reload();
            }
        }, 10*1000);
 
        //Clearing the interval
        return () => clearInterval(interval);
    },[])

    return (
        <div className="view-screen">
            <div className="flex justify-center w-full h-full divide-slate-500 md:divide-x-2 divide-solid">
                <ConversationUI/>
                <MessageContainer />
                <ChatInfo/>
            </div>
        </div>)
}