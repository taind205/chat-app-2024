import React, { useEffect, useRef, useState } from 'react';
import { User } from '../users/entity';
import ChatIcon from '@/../public/icon/chatapp_icon.png';
import Image from 'next/image';
import { CircularProgress } from '@mui/material';
import { useOutsideClick } from '@/utils/hook';
import { useLazyGetSampleUserQuery, useLazyGetSignedInUserQuery, useLoginMutation } from '@/api/chat.api';
import { GoogleOAuth } from './googleOAuth';

export const LoginPage:React.FC<{}> = ({}) => {
    const [trigger, {isLoading:isSigningIn}] = useLoginMutation();
    const currentUserIdRef = useRef<string>('');
    const [loadSampleUser, {data:sampleUsers, isFetching} ] = useLazyGetSampleUserQuery();
    const [getSignedInUser,{isFetching:isFetchingSignedInUser}] = useLazyGetSignedInUserQuery();  

    useEffect(()=>{
        //Implementing the setInterval method
        getSignedInUser(true);
        if(!sampleUsers) {
            loadSampleUser(undefined);
        }
        const interval = setInterval(() => {
            if(!sampleUsers) loadSampleUser(undefined);
        }, 2000);
 
        //Clearing the interval
        return () => clearInterval(interval);

    }
    ,[sampleUsers,getSignedInUser,loadSampleUser])

    const onLogin = ()=>{
        if(currentUserIdRef.current) trigger({uid:currentUserIdRef.current,password:"sampleUser"});
    }

    return ( 
    <div className="flex flex-col overflow-y-auto items-center bg-slate-800 gap-4 shadow-xl rounded  h-full w-full max-w-md px-4 py-8">
        <div className="p-4 text-center text-2xl font-bold">
            Chat application by Tai Nguyen
        </div>
        <Image className="p-2" src={ChatIcon} alt='Chat app icon' height={160} width={160} quality={100}/>
        <p>Sign in using sample user</p>
        <UserDropdown users={sampleUsers?.users||[]} setUser={(userId:string)=>currentUserIdRef.current=userId}/>
        <button type="submit" disabled={isFetchingSignedInUser||isSigningIn||currentUserIdRef.current==null} onClick={onLogin}
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
            {(isFetchingSignedInUser||!sampleUsers||isSigningIn) && <CircularProgress size={24} />}
            <p>{(isFetchingSignedInUser||!sampleUsers)?"Application server is initializing..."
            :isSigningIn?"Signing in...":"Sign in"}</p>
        </button>
        {!(isFetchingSignedInUser||!sampleUsers||isSigningIn) && <>
            <p className="my-2 w-full text-slate-200 text-center">Or</p>
            <GoogleOAuth/>
        </>}
    </div>
   )
}

const UserDropdown: React.FC<{ users: User[], setUser:(uid:string)=>void; }> = ({ users, setUser }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const panelRef = useRef(null);
    useOutsideClick(panelRef, () => setIsOpen(false));

    const handleToggle = () => {
        setIsOpen(!isOpen);
    };

    const handleSelectUser = (user: User) => {
        setSelectedUser(user);
        setUser(user._id);
        setIsOpen(false);
    };

    return (
        <div className="relative w-[80%]">
            <button
                className="w-full py-2 px-4 border rounded-md flex items-center justify-between"
                onClick={handleToggle}
            >
                <span className="flex items-center">
                    {selectedUser ? (
                        <>
                            <img
                                src={selectedUser.prfImg}
                                alt={selectedUser.displayName}
                                className="w-8 h-8 rounded-full mr-2"
                            />
                            <span>{selectedUser.displayName}</span>
                        </>
                    ) : (
                        'Select User'
                    )}
                </span>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
            </button>
            {isOpen && <div ref={panelRef} className={`absolute z-10 w-full bg-slate-700 rounded-md shadow-lg mt-1`}>
                <ul>
                    {users.map((user) => (
                        <li
                            key={user._id}
                            className="flex flex-row items-center py-2 px-4 hover:bg-slate-500 rounded-md cursor-pointer"
                            onClick={() => handleSelectUser(user)}
                        >
                            <img src={user.prfImg} alt={user.displayName} className="w-8 h-8 rounded-full mr-2" />
                            <span>{user.displayName}</span> 
                        </li>
                    ))}
                </ul>
            </div>}
        </div>
    );
}