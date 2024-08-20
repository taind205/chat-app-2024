'use client'
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { ConversationUI } from "@/features/conversations/container";
import { useDispatch } from "react-redux";
import { selectSelf, selectSelfId } from "@/features/users/userSlice";
import { useEffect, useRef } from 'react';
import { ChatInfo } from '@/features/conversations/ChatInfo';
import { MessageContainer } from '@/features/messages/container';
import "@/styles.css"
import { initSocket } from '@/features/socket/socketSlice';
import { LoginPage } from '../auth/LoginPage';
import { useAppDispatch, useAppSelector } from "@/utils/hook"
const darkTheme = createTheme({
    palette: {
        mode: 'dark',
    },
});

export const UserUI: React.FC = () => {
    const dispatch = useDispatch();
    const self = useAppSelector(selectSelf);

    useEffect(()=>{      
        if(self) dispatch(initSocket(self._id));
    },[self])

    return (
        <div className="p-1 sm:p-2 lg:p-4 xl:p-8 flex flex-col gap-4 items-center bg-slate-900 h-screen">
            {self?
                <ThemeProvider theme={darkTheme}>
                    <div className="flex justify-center w-full h-full divide-slate-500 md:divide-x-2 divide-solid">
                        <ConversationUI/>
                        <MessageContainer />
                        <ChatInfo/>
                    </div>
                </ThemeProvider>
            :
            <LoginPage/>}
        </div>)
}