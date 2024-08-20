import Image from "next/image";
import { Conversation, ConversationType, ConversationWithUserDataMap, GroupChat, LatestConversation } from "./entity";
import { ConversationNameByUserIds, getConversationName } from "./container";
import { addPendingUserLoad, selectSelfId, selectUserById } from "@/features/users/userSlice";
import DefaultProfileImg from "@/../public/icon/defaultProfileImg.png";
import { calculateUnreadNum, fullfilLastMsg, openConv } from "./conversationSlice";
import { getDateFromObjId, getPastTime, getShortPastTime, notEmpty } from "@/utils/helperFunction";
import { AppError } from "@/shared_components/common";
import { useAppDispatch, useAppSelector } from "@/utils/hook";
import { selectConversationById } from "./conversationSlice";
import { ActionMessage, Message, MessageStatus, MessageSumary } from "@/features/messages/entity";
import { selectMessageById } from "@/features/messages/messageSlice";
import { openUI } from "../main/appSlice";
import { useEffect } from "react";

export const ConversationComponent: React.FC<{ id: string }> = ({ id }) => {
    const dispatch = useAppDispatch();
    const { _id, name, seenUsers, someUsers, unread, lastMsg, type, img, participants,isHideFromLatestList, isRemoved } 
        = useAppSelector(state => selectConversationById(state,id));
    const selfId = useAppSelector(selectSelfId);
    const lastMsgData = useAppSelector(state=>selectMessageById(state,lastMsg))
    useEffect(()=>{
        if(!lastMsg) dispatch(fullfilLastMsg({convId:_id}));
    },[lastMsg,_id,dispatch])

    if(isHideFromLatestList || isRemoved) return <></>;
    if(!someUsers && !participants) return <AppError error={"Data not found"}/>;
    if(!Number.isInteger(unread)) dispatch(calculateUnreadNum({convId:_id,selfId}));
    
    const otherParticipants = participants? participants.slice(0,7).filter(v=>v.id!=selfId).map(v=>v.id)
        : someUsers!.concat(seenUsers||[]).filter(v=>v!=selfId)
    const otherSeenUsers = participants? participants.filter(v=>v.seenMsg==lastMsgData?._id).slice(0,3)
        .map(v=>v.id).filter(v=>v!=selfId&&v!=lastMsgData?.user)
        : seenUsers?.filter(v=>v!=selfId&&v!=lastMsgData?.user);

    return (
        <button onClick={() => (dispatch(openConv(_id)),dispatch(openUI('chatMsg')))}
            className={"px-1 rounded flex items-center min-h-20 w-full hover:bg-slate-600  "+ (unread ? "bg-slate-700" : "bg-slate-800")}>
            <ConversationIcon members={otherParticipants} img={img} />
            <div className={"truncate pl-2" + (unread ? "font-bold" : "font-light")}>
                <h2 className="pb-1 truncate text-left">{name || <ConversationNameByUserIds ids={otherParticipants}/>}</h2>
                <div className="flex">
                    <LastMessaage lastMsg={lastMsgData} convType={type}/>
                    <p className="pl-1 text-sm truncate text-slate-400 min-w-16">
                        {"· " + getPastTime(getDateFromObjId(lastMsg))}</p>
                    <ConvSeenUsers seenUser={otherSeenUsers}/>
                </div>
            </div>
            {unread ?
            <div className="flex items-center px-1">
                <div className="px-1 min-w-[20px] text-white bg-red-700 rounded-2xl">
                        {unread}
                </div>
            </div>:<></>}
        </button>
    )
}

const LastMessaage:React.FC<{lastMsg?:Message, convType?:ConversationType}> = ({lastMsg, convType}) => {
    const userData = useAppSelector(state => selectUserById(state, lastMsg?.user||''));
    const selfId = useAppSelector(selectSelfId);
    
    if(!lastMsg) return <></>
    if(lastMsg.act) return <LastMessaageAsAction data={lastMsg as ActionMessage}/>
    const sender = lastMsg.user==selfId?"You"
        : lastMsg.userNickname||userData?.displayName;
    return <p className="text-sm truncate ">{
        lastMsg.status==MessageStatus.Unsent ?`${sender} removed a message.`
        :
        (sender?sender+": ":"")+ (lastMsg.cont?lastMsg.cont:(lastMsg.media?.length+" media(s)"))}</p>
}

const LastMessaageAsAction:React.FC<{data:ActionMessage}> = ({data}) => {
    const dispatch = useAppDispatch();
    const {type}=data;
    const actUser = useAppSelector(state=>selectUserById(state,data.act.by));
    const targetUser = useAppSelector(state=>selectUserById(state,data.act.target));
    const actUserDisplayName = actUser?.displayName;
    const targetUserDisplayName = targetUser?.displayName;

    useEffect(()=>{ //get user data if it not found in the store
        if(!actUserDisplayName) dispatch(addPendingUserLoad(data.act.by));
        if(data.act.target && !targetUserDisplayName) dispatch(addPendingUserLoad(data.act.target));
    },[actUserDisplayName,targetUserDisplayName,data,dispatch])

    const text = type=='addMember'? `${actUserDisplayName} add ${targetUserDisplayName} to the conversation.`
    :type=='leave'? `${actUserDisplayName} leave the group.`
    :type=='setRole'? `${actUserDisplayName} change ${targetUserDisplayName}'s role to ${data.act.value}.`
    :type=='removeMember'? `${actUserDisplayName} remove ${targetUserDisplayName} from the conversation.`
    :type=='setNickname'? `${actUserDisplayName} set ${targetUserDisplayName}'s nickname to ${data.act.value}.`
    :type=='changeGroupName'? `${actUserDisplayName} change group name to ${data.act.value}.`
    :type=='changeGroupPhoto'? `${actUserDisplayName} changed group photo.`
    :type=='createChat'? `${actUserDisplayName} created this group chat.`
    :''

    return <p className="text-sm truncate ">{text}</p>
}

const ConvSeenUsers: React.FC<{ seenUser?: string[] }> = ({ seenUser }) => {
    if(!seenUser) return <></>;
    return (<div className="relative h-5" style={{ minWidth: (12 + Math.min(seenUser.length, 3) * 12) }}>
        {seenUser.slice(0, 3).map((v, i) =>
            <div key={v} className={"absolute top-0 right-" + i * 3 + " rounded-full"}>
                <SeenUserIcon uid={v}/>
            </div>)}
    </div>
    )
}

const SeenUserIcon:React.FC<{uid:string}> = ({uid}) =>{
    const user = useAppSelector(state=>selectUserById(state,uid));
    return <Image className="rounded-full" width={20} height={20} alt='Seen user' src={user?.prfImg||DefaultProfileImg} />
}

export const ConversationCard:React.FC<{conv:Conversation, opt?:{size:'sm'|'md'|'lg'}}> = ({conv,opt}) => {
    const selfId = useAppSelector(selectSelfId);
    const otherUsers = conv.participants?.map(v=>v.id).filter(v=>v!=selfId);
    if(!otherUsers) return <AppError error="No users conv"/>
    return( opt?.size=='sm'?
        <div className="flex items-center p-2 gap-1 h-14">
            <ConversationIcon img={conv.img} members={otherUsers} scale={60}/>
            <div>
                {conv.name?.substring(0,40) || <ConversationNameByUserIds ids={otherUsers}/>}
            </div>
        </div>    
        : opt?.size=='lg'?
        <div className="flex flex-col items-center p-2 gap-2">
            <ConversationIcon img={conv.img} members={otherUsers} scale={120} />
            <div className="text-center">
                {conv.name || <ConversationNameByUserIds ids={otherUsers}/>}
            </div>
        </div>
        :<div className="flex items-center p-2 gap-2">
            <ConversationIcon img={conv.img} members={otherUsers} scale={80}/>
            <div className=" text-clip overflow-hidden max-h-24">
                {conv.name?.substring(0,40) || <ConversationNameByUserIds ids={otherUsers}/>}
            </div>
        </div>)
    }


export const GroupChatCard:React.FC<{data:GroupChat}> = ({data:conv}) => {
    const selfId = useAppSelector(selectSelfId);
    const otherUsers = conv.users?.map(v=>v._id).filter(v=>v!=selfId);
    if(!otherUsers) return <AppError error="No users conv"/>
    return( <div className="flex items-center p-2 gap-1 h-14">
        <ConversationIcon img={conv.img} members={otherUsers} scale={60}/>
        <div>
            {conv.name?.substring(0,40) || <ConversationNameByUserIds ids={otherUsers}/>}
        </div>
    </div>    )
    }

export const ConversationIcon: React.FC<{ members:string[], scale?: number, img?:string }> = ({ members, scale,img }) => {
    const usersData1 = useAppSelector(state => selectUserById(state,members[0]));
    const usersData2 = useAppSelector(state => selectUserById(state,members[1]));
    if(!usersData1) return (<div style={{ scale: scale ? scale / 100 : 1 }} className={"m-2 min-w-14 h-14 relative"}>
        <div className="absolute top-0 right-0">
        <Image className="rounded-full" width={56} height={56} alt='Conv Icon' src={DefaultProfileImg} />
    </div>
    </div>)
    const lastActTime = usersData1.lastAct? getShortPastTime(new Date(usersData1.lastAct)):undefined;
    return (<div style={{ scale: scale ? scale / 100 : 1 }} className={"m-2 min-w-14 h-14 relative"}>
        {img? 
            <div className="absolute top-0 right-0">
                <Image className="rounded-full" width={56} height={56} alt='Conv Icon' src={img} />
            </div>
        : usersData2 ?
            <>
                <div className="absolute top-0 right-0 rounded-full">
                    <Image width={40} height={40} alt='Conv Icon' src={usersData1.prfImg||DefaultProfileImg} />
                </div>
                <div className="absolute top-4 right-4 rounded-full">
                    <Image width={40} height={40} alt='Conv Icon' src={usersData2.prfImg||DefaultProfileImg} />
                </div>
            </>
            :
            <>
                <div className="absolute top-0 right-0">
                    <Image className="rounded-full" width={56} height={56} alt='Conv Icon' src={usersData1.prfImg||DefaultProfileImg} />
                </div>
                {lastActTime? lastActTime=='0m' ? 
                <div className="absolute rounded-full bg-green-500 border-2 bottom-0 right-0 w-5 h-5"/>
                :<div className="absolute text-center rounded-full bg-green-300 text-xs text-slate-900 border-2 bottom-0 right-0 w-8 h-5">{lastActTime}</div>
                :<></>}
            </>
        }
    </div>
    )
}