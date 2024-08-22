import { ReactNode, createContext, useContext, useEffect, useRef, useState } from "react";
import { useGetLatestConversationsQuery, useLogoutMutation } from "@/api/chat.api";
import { CircularProgress } from "@mui/material";
import { selectCurrentUI, openModal } from "@/features/main/appSlice";
import { useAppDispatch, useAppSelector } from "@/utils/hook";
import { selectSelf, selectSelfId, selectUserById } from "../users/userSlice";
import EditIcon from '@mui/icons-material/Edit';
import { disconnectSocket } from "../socket/socketSlice";
import DefaultProfileImg from "@/../public/icon/defaultProfileImg.png";
import Image, { StaticImageData } from "next/image";

export const UserSection: React.FC<{}> = ({}) => {
    const dispatch = useAppDispatch();
    const [isOpen_EditAvt, setIsOpen_EditAvt] = useState(false);
    const self = useAppSelector(selectSelf);
    const [triggerLogout, {data:logoutData, isLoading:isSigningOut}] = useLogoutMutation();
    const avt= self?.prfImg;
    useEffect(()=>{
        if(logoutData?.logout) location.reload();
    },[logoutData])

    const openChangeAvatarModal = () => dispatch(openModal({content:{id:'changeAvatar',}}));
    const openChangeUsernameModal = () => dispatch(openModal({content:{id:'changeSelfUsername',}}));
    const onLogout = () => {
        dispatch(disconnectSocket(true));
        triggerLogout(true);
    }

    return(
    <div className="flex items-center gap-2 p-2">
        <div onMouseEnter={()=>setIsOpen_EditAvt(true)} onMouseLeave={()=>setIsOpen_EditAvt(false)} className="grid relative rounded-full">
            <Image className="rounded-full" width={56} height={56} alt='User avatar' src={avt||DefaultProfileImg} />
            {isOpen_EditAvt && <>
            <div className="absolute top-0 left-0 w-full h-full bg-slate-900 opacity-50"> </div>
            <button onClick={openChangeAvatarModal} className="absolute justify-self-center self-center "><EditIcon/></button>
            </>}
        </div>
        <div className="flex flex-col">
            <div className="flex gap-2">
                <h2>{self?.displayName}</h2>
                <button onClick={openChangeUsernameModal} className=""><EditIcon/></button>
            </div>
            <p>{self?.username}</p>
            <a href="#" onClick={onLogout} >Logout</a>
        </div>
    </div>)
    }