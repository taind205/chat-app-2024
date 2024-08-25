import Image from 'next/image'
import { createContext, MouseEvent, RefObject, useEffect, useRef, useState } from 'react';
import { useAppSelector } from "@/utils/hook";
import { selectCurrentConversation, selectCurrentParticipantDataById,
    selectCurrentConversationId} from '@/features/conversations/conversationSlice';
import { selectMessageById } from '@/features/messages/messageSlice';
import { ConversationUserIcon } from '../messages/components';
import { AppError } from '@/shared_components/common';
import { getDateFromObjId, getPastTime } from '@/utils/helperFunction';
import { useGetMediaMessagesQuery } from '@/api/chat.api';
import TooltipWrapper from '@/shared_components/TooltipWrapper';

type ImageListViewProps = {preventDefault:(e: MouseEvent<HTMLDivElement>) => void,content:{
    id: "image";
    src: string;
    msgId:string;
    imgIdx:number;
}}

const CurrentSelectedMsg_Context = createContext('');

export const ImageListView:React.FC<ImageListViewProps> = ({content,preventDefault}) => {
    const [currentMsg, setCurrentMsg] = useState(content.msgId);
    const [currentImgIdx, setCurrentImgIdx] = useState(content.imgIdx);
    const currentImgSrc_Ref = useRef(content.src);
    const currentConvId = useAppSelector(selectCurrentConversationId);
    const {mediaMsgIds} = useAppSelector(selectCurrentConversation);
    const mIdCursor_Ref = useRef('');
    const {isFetching, error} = useGetMediaMessagesQuery({cid:currentConvId,mid:mIdCursor_Ref.current},{skip:!currentConvId});
    const scrollContainer_Ref = useRef<HTMLDivElement>(null);
    const currentImg_Ref = useRef<HTMLButtonElement>(null);

    useEffect(()=>{
        currentImg_Ref.current?.scrollIntoView({behavior:'instant',inline:'center'});
    },[mediaMsgIds?.length])

    const onSelectImg = (msgId:string,img:string,imgIdx:number,posX:number) => {
        const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0); //Cross browser viewport width;
        if(msgId==mediaMsgIds?.[0]) mIdCursor_Ref.current=msgId;
        setCurrentImgIdx(imgIdx);
        setCurrentMsg(msgId);
        currentImgSrc_Ref.current=img;
        scrollContainer_Ref.current?.scrollBy({ top: 0, left: posX-vw/2, behavior: "smooth", })
    }
    
    return (<><div className='flex flex-col justify-center h-[80vh]'>
            <div onMouseDown={preventDefault} className='flex flex-col items-center p-2 m-2 mt-4 bg-slate-800 rounded-xl'>
                <MediaMessageHeader msgId={currentMsg}/>
                <img className="object-scale-down max-h-[70vh] max-w-[80vw]"
                    src={currentImgSrc_Ref.current} alt="Image iew" sizes="70vh, 90vw" />
            </div>
        </div>
        <div onMouseDown={preventDefault} ref={scrollContainer_Ref} className='flex flex-row py-2 min-h-24 items-center gap-1 w-full overflow-x-scroll overflow-y-hidden'>
            <CurrentSelectedMsg_Context.Provider value={currentMsg}>
            {mediaMsgIds?.map(v=>v!=currentMsg?<MsgImageItems key={v} msgId={v} onSelect={onSelectImg}/>
            :<MsgImageItems key={v} msgId={v} onSelect={onSelectImg} imgIdx={currentImgIdx} imgRef={currentImg_Ref} />)}
            </CurrentSelectedMsg_Context.Provider>
        </div></>)
}

const MediaMessageHeader:React.FC<{msgId:string}> = ({msgId}) => {
    const message = useAppSelector(state=>selectMessageById(state,msgId));
    const sender = useAppSelector(state=> selectCurrentParticipantDataById(state,message?.user));
    if(!sender) return <AppError error={"sender is undefined"}/>
    const senderDisplayName = sender.nickname||sender.data?.displayName||"Unknown user";

    return (<div className='flex justify-between p-2 items-center gap-2'>
            <div className='flex'>
                <ConversationUserIcon userId={message?.user} />
                <div className="ml-1 mt-1 mb-0.5 ">{senderDisplayName}</div>
            </div>
            <TooltipWrapper tooltip={getDateFromObjId(msgId)?.toLocaleString()} tooltipStyle={{zIndex:70}}>
                <p className='text-slate-400'>{getPastTime(getDateFromObjId(msgId))}</p>
            </TooltipWrapper>
        </div>)
}

type MsgImageItemsProps = {msgId:string, onSelect:(msgId:string,img:string,imgIdx:number,posX:number)=>void,
     imgIdx?:number, imgRef?: RefObject<HTMLButtonElement>}
const MsgImageItems:React.FC<MsgImageItemsProps> = ({msgId,onSelect, imgIdx, imgRef}) => {
    const msg = useAppSelector(state=>selectMessageById(state,msgId));
    const itemClassName = 'flex items-center min-w-16 max-h-16 overflow-hidden';
    const selectedItemClassName = 'flex items-center h-full min-w-20 max-h-20 border-8 border-double bg-slate-500/75 rounded-lg border-slate-400 overflow-hidden'

    return <> 
    {msg?.media?.map((v,i)=>  <button ref={i===imgIdx?imgRef:undefined} className={i===imgIdx?selectedItemClassName:itemClassName} key={i} 
        onClick={(e)=>onSelect(msgId,v,i,e.clientX)}>
            <Image  src={v} width={64} height={64} alt={'Msg Media'}></Image>
        </button>)}
    </>

}
