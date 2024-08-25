import React, { memo, useContext, useEffect, useRef, useState } from "react";
import Image from "next/image"
import { ImageList, ImageListItem } from "@mui/material";
import AddReactionIcon from '@mui/icons-material/AddReaction';
import { Emoji } from "emoji-picker-react";
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { openModal } from "@/features/main/appSlice";
import PopoverWrapper from "@/shared_components/PopoverWrapper";
import { addPendingUserLoad, selectSelfId, selectUserById } from "../users/userSlice";
import { addPendingMsgLoad, selectMessageById, setReplyingMsg } from "./messageSlice";
import { useAppDispatch, useAppSelector } from "@/utils/hook";
import TooltipWrapper from "@/shared_components/TooltipWrapper";
import { ActionMessage, Message, MessageObjType, MessageType, UserReact } from "./entity";
import { AppError } from "@/shared_components/common";
import { selectCurrentDirrectConvUserId, selectCurrentParticipantDataById,
    selectCurrentConversationId, 
    selectMessageSeenUser} from "@/features/conversations/conversationSlice";
import { reactMessage } from "../socket/socketSlice";
import { getDateFromObjId } from "@/utils/helperFunction";

export const MessageComponent: React.FC<{id:string}> = ({id}) => {
    const message = useAppSelector(state=>selectMessageById(state,id));

    if(!message) return <AppError error={'Undefined message'}/>
    else if(message.act) return <ActionMessageComponent data={message as ActionMessage}/>
    else return <NormalMessageComponent data={message}/>
}

const NormalMessageComponent: React.FC<{data:Message}> = ({data:message}) => {
    const dispatch = useAppDispatch();
    const otherSeenUsers = useAppSelector(state=>selectMessageSeenUser(state,message));
    const convUser = useAppSelector(state=>selectCurrentParticipantDataById(state,message?.user));
    const selfId = useAppSelector(selectSelfId);
    const [isHover, setIsHover] = useState<boolean>(false);
    const [isFocus, setIsFocus] = useState<boolean>(false);
   
    if(!convUser?.data) return <AppError error={'Undefined user'}/>
    
    const isSelfMsg = message.user==selfId;
    const isUnsent = message.status=='unsent';
    return (<>
        {message.isShowTimeHeader && <p className={"w-full text-center m-px text-sm max-h-[40px] min-w-8"}>
            {getDateFromObjId(message._id)?.toLocaleString()}
        </p>}
        <div onMouseEnter={() => setIsHover(true)} onMouseLeave={() => setIsHover(false)}
            className={"relative flex m-px text-sm " + (isSelfMsg ? "flex-row-reverse" : "flex-row")}>
            {!isSelfMsg && (message.isHideSenderIcon ? <div className="min-w-8"></div> : <ConversationUserIcon userId={message?.user} />)}
            <div className={"flex flex-col ml-1 max-w-[65%] xs:max-w-[80%] "+ (isSelfMsg ? "items-end" : "")}>
                {isUnsent?<div className="py-0.5 px-2 rounded-xl border-2 border-slate-300 bg-slate-700 text-slate-300">
                    {`${isSelfMsg?'You':convUser.data?.displayName} removed a message.`}
                    </div>
                :<><MessageContent data={message}/>
                <UserReacts userReacts={message.react}/></>}
                <SeenConversationUsers seenUserIds={otherSeenUsers} />
            </div>
            {(!isUnsent && (isHover || isFocus)) ? <>
                <div className="flex items-center" onBlur={()=>setIsFocus(false)}>
                    <PopoverWrapper popover={<CustomEmojiPicker targetMessageId={message._id}/>} onClick={()=>setIsFocus(true)}>
                        <div className="hover:bg-slate-700 mx-0.5 p-0.5 rounded-lg h-fit self-center">
                            <AddReactionIcon />
                        </div>
                    </PopoverWrapper>
                    <PopoverWrapper popover={<MessageOptionsPopover message={message}/>} onClick={()=>setIsFocus(true)}>
                        <div className="hover:bg-slate-700 mx-0.5 p-0.5 rounded-lg h-fit self-center">
                            <MoreHorizIcon/>
                        </div>
                    </PopoverWrapper>
                </div>
            </> : <></>}
        </div>
    </>)
}

const ActionMessageComponent: React.FC<{data:ActionMessage}> = ({data}) => {
    const dispatch = useAppDispatch();
    const {type}=data;
    const actUser = useAppSelector(state=>selectCurrentParticipantDataById(state,data.act.by));
    const targetUser = useAppSelector(state=>selectCurrentParticipantDataById(state,data.act.target));
    const actUserDisplayName = actUser?.nickname||actUser?.data?.displayName;
    const targetUserDisplayName = targetUser?.nickname||targetUser?.data?.displayName;

    useEffect(()=>{ //get user data if it not found in the store
        if(!actUserDisplayName) dispatch(addPendingUserLoad(data.act.by));
        if(data.act.target && !targetUserDisplayName) dispatch(addPendingUserLoad(data.act.target));
    },[actUserDisplayName,targetUserDisplayName])

    const text = type=='addMember'? `${actUserDisplayName} add ${targetUserDisplayName} to the conversation.`
    :type=='leave'? `${actUserDisplayName} leave the group.`
    :type=='setRole'? `${actUserDisplayName} change ${targetUserDisplayName}'s role to ${data.act.value}.`
    :type=='removeMember'? `${actUserDisplayName} remove ${targetUserDisplayName} from the conversation.`
    :type=='setNickname'? `${actUserDisplayName} set ${targetUser?.data?.displayName}'s nickname to ${data.act.value}.`
    :type=='changeGroupName'? `${actUserDisplayName} change group name to ${data.act.value}.`
    :type=='changeGroupPhoto'? `${actUserDisplayName} changed group photo.`
    :type=='createChat'? `${actUserDisplayName} created this group chat.`
    : ''

    return <p className={"w-full text-center m-px text-sm max-h-[40px] min-w-8"}>{text}</p>
}

const CustomEmojiPicker: React.FC<{ targetMessageId: string }> = ({ targetMessageId }) => {
    const dispatch = useAppDispatch();
    const convId = useAppSelector(selectCurrentConversationId);
    const selfId = useAppSelector(selectSelfId);
    const targetId = useAppSelector(selectCurrentDirrectConvUserId);

    const reactToMsg = (react:string) => selfId && dispatch(reactMessage(
        {targetId,reaction:{convId,react,msgId:targetMessageId,user:selfId}}))

    return <div className="bg-slate-500/90 rounded-xl">
        {["1f44d", "2764-fe0f", "1f601", "1f632", "1f622", "1f621"].map(v =>
            <button key={v} className="p-2 hover:scale-125" onClick={() => reactToMsg(v)}><Emoji unified={v} size={24} /></button>)}
    </div>
}

const MessageOptionsPopover: React.FC<{message:Message}> = ({message}) => {
    const dispatch = useAppDispatch();
    const currentConvId = useAppSelector(selectCurrentConversationId);
    const openRemoveMsgModal = () => dispatch(openModal({content:{id:"removeMessage",targetMsg:message,convId:currentConvId} }));
    const replyMsg = () => dispatch(setReplyingMsg(message._id));
  
    const options = {
        removeMsg: { label: "Remove...", func: openRemoveMsgModal },
        replyMsg: { label: "Reply...", func: replyMsg },
    }
  
    let available_options = [options['removeMsg'],options['replyMsg']];
  
    return(
        <div className="flex flex-col w-60 gap-1">
            {available_options.map((v,i)=> <button key={i} onClick={v.func} className="popover-option">{v.label}</button>)}
        </div>
    )
  }

const getCol = (length: number) => length == 1 ? 1 : (length == 2 || length == 4) ? 2 : 3;
const getImgMsgSize = (col: 1 | 2 | 3) => "(max-width: 480px) " + (54 / col) + "vw, (max-width: 1024px) " + (42 / col) + "vw, " + (36 / col) + "vw";
const getImgDivCLN = (col: 1 | 2 | 3) => col==1?'w-44 h-44 xs:w-48 xs:h-48':col==2?'w-20 h-28 xs:w-32 xs:w-32 sm:w-36 sm:h-36':
        'w-14 h-16 xs:w-24 sm:h-24'
const getTimeFromOID = (oid:string) => {
    // Extract the timestamp as a hexadecimal string
    // Convert the hexadecimal string to a number
    // Convert the timestamp to milliseconds (since JavaScript Date uses milliseconds)
    const timestampMilliseconds = parseInt(oid.substring(0, 8), 16)* 1000;
    return  new Date(timestampMilliseconds);
}

const MessageContent: React.FC<{data:Message}> = ({data: msg}) => {
    const selfId = useAppSelector(selectSelfId);
    const convId = useAppSelector(selectCurrentConversationId);
    const sender = useAppSelector(state=> selectCurrentParticipantDataById(state,msg.user));
    const repMsg = useAppSelector(state => selectMessageById(state,msg.repMsg))
    const dispatch = useAppDispatch();
    useEffect(()=>{
        if(msg.repMsg && !repMsg) dispatch(addPendingMsgLoad({msgId:msg.repMsg,convId})); //fetch rep msg if it exist but not fetch yet
    },[msg])
    if(!sender) return <AppError error={'participant is null'}/>
    const isSelfMsg = (selfId == sender.id);
    const senderDisplayName = sender.nickname||sender.data?.displayName||"Unknown user";

    return (<>
        {repMsg?<RepMsgHeader repMsg={repMsg} isSelfMsg={isSelfMsg} senderDisplayName={senderDisplayName}/>
        :
        !isSelfMsg && !msg.isHideSenderName && <div className="ml-1 mt-1 mb-0.5 text-slate-400">
            {senderDisplayName+(msg.repMsg?" replied to a message...":"")}
            </div>}
        <TooltipWrapper tooltip={'Send at '+getTimeFromOID(msg._id).toLocaleString()} className={"z-10 "+(isSelfMsg&&"self-end")}>
            <div className={"px-2 py-1 rounded-xl w-fit max-h-[360px] overflow-auto " + (isSelfMsg ? "bg-cyan-700 " : "bg-slate-700")}>
                <MsgImageList images={msg.media} msgId={msg._id}/>
                <p style={(msg.media && msg.media.length>0) ? {paddingTop:4}:undefined}>{msg.cont}</p>
            </div>
        </TooltipWrapper>
    </>)
}

const RepMsgHeader: React.FC<{repMsg:Message, isSelfMsg:boolean,senderDisplayName:string}> = ({repMsg,isSelfMsg,senderDisplayName}) => {
    const repMsgSender = useAppSelector(state=> selectCurrentParticipantDataById(state,repMsg.user));

    return(<>
        <div className="ml-1 mt-1 mb-0.5 text-slate-400">{(isSelfMsg ? "You" : senderDisplayName)
                + " replied to " + (repMsgSender?.nickname||repMsgSender?.data?.displayName||"Unknown user")}</div>
        <div className={"px-2 py-1 rounded-xl bg-slate-500 text-slate-200 opacity-75 w-fit scale-90 translate-y-2 pb-2 " + (isSelfMsg ? "self-end" : "")}>
            {repMsg.status=='unsent'?<p>This message is removed</p>:<>
                {repMsg.media? <p>{'['+repMsg.media.length+' image(s)]'}</p>:<></>}
                <p>{repMsg.cont}</p>
            </>}
        </div>
    </>)
}

const MsgImageList: React.FC<{images?:string[], msgId:string}> = ({images, msgId}) => {
    const dispatch = useAppDispatch();

    const openImage = (imgSrc:string, idx:number) => () => dispatch(openModal({content:{id:'image',src:imgSrc,msgId:msgId,imgIdx:idx}}));

    return(
    images ? <ImageList className="pb-2" sx={{ maxWidth: '100%', maxHeight: '50vh' }} rowHeight={"auto"}
                cols={getCol(images.length)} >
                {images.map((imgSrc, i) => (
                    <ImageListItem key={i} className="flex items-center">
                        <button className={"relative "+getImgDivCLN(getCol(images.length))} onClick={openImage(imgSrc,i)}>
                            <Image fill
                                src={imgSrc}
                                alt={'image from msg'}
                                loading="lazy"
                                sizes={getImgMsgSize(getCol(images.length))}
                                className="rounded-lg object-cover"
                            />
                        </button>
                    </ImageListItem>
                ))}
            </ImageList>:<></>)
}

export const ConversationUserIcon: React.FC<{ userId?: string }> = ({ userId }) => {
    const user = useAppSelector(state => selectUserById(state,userId));

    return (<div className="self-end rounded-full relative">
        <Image className="rounded-full" width={32} height={32} alt='App Icon' src={user?.prfImg||"/icon/defaultProfileImg.png"} />
    </div>
    )
}

const SeenConversationUsers: React.FC<{ seenUserIds?: string[] }> = ({ seenUserIds }) => {
    return ( seenUserIds &&
        <div className="flex flex-row-reverse p-0.5">{
            seenUserIds.length < 4 ? <>{seenUserIds.map(v => <SeenConversationUserIcon key={v} uid={v} />)}</>
                :
                <>{seenUserIds.slice(0, 2).map(v => <SeenConversationUserIcon key={v} uid={v} />)}
                    <TooltipWrapper tooltip={<DetailSeenUsers seenUserIds={seenUserIds.slice(2)}/>}>
                        <div className="h-5 px-1 bg-slate-700 text-sm rounded-full">{"+" + (seenUserIds.length - 2)}</div>
                    </TooltipWrapper>
                </>
        }</div>)
}

const DetailSeenUsers:React.FC<{seenUserIds:string[]}> = ({seenUserIds}) =>
    seenUserIds.map((v,i)=><DetailSeenUser key={v} uid={v} suffix={i!=seenUserIds.length-1?", ":""}/> )

const DetailSeenUser:React.FC<{uid:string, suffix?:string}> = ({uid, suffix=""}) => {
    const user = useAppSelector(state => selectCurrentParticipantDataById(state,uid));
    return <p className="text-sm inline">{user?.nickname||user?.data?.displayName||'Unknown user'}{suffix}</p>
}

const SeenConversationUserIcon: React.FC<{ uid: string }> = ({ uid }) => {
    const user = useAppSelector(state => selectCurrentParticipantDataById(state,uid));
    if(!user) return "undefined user";
    const displayName = user.nickname||user.data?.displayName||'Unknown user';
    const tooltipText = displayName + " have seen"+(user.seenAt? " at " + new Date(user.seenAt).toLocaleString() : "");

    return <TooltipWrapper tooltip={tooltipText}>
        <div className=" relative">
            <Image className="rounded-full" width={20} height={20} alt='Seen user' src={user.data?.prfImg||"/icon/defaultProfileImg.png"} />
        </div>
    </TooltipWrapper>
}

const UserReacts: React.FC<{ userReacts?: UserReact[] }> = ({ userReacts }) => {
    const dispatch = useAppDispatch();
    const [sorted, setSorted] = useState<[string, number][]>([]);
    useEffect(() => {
        if(!userReacts || userReacts.length==0) return;
        for (const r of userReacts)
            frequencyMap.set(r.react, (frequencyMap.get(r.react) || 0) + 1);

        setSorted(Array.from(frequencyMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3));
    }, [userReacts])

    if(!userReacts || userReacts.length==0) return;

    const openReactDetail = () => dispatch(openModal({content:{id:"reactionDetail",userReaction:userReacts}}))

    let frequencyMap = new Map<string, number>();

    return (
        <div className="flex justify-end -translate-y-1 z-20">
            <button onClick={openReactDetail} className="flex w-fit rounded-xl  bg-slate-600 p-1">
                {sorted.map(v => <Emoji key={v[0]} unified={v[0]} size={16} />)}
                <p className="pl-1 text-sm">{userReacts.length}</p>
            </button>
        </div>
    )
}