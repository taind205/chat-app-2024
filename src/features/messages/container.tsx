import { ChangeEvent, KeyboardEvent, memo, useEffect, useRef, useState } from "react"
import Image from "next/image"
import SendIcon from '@mui/icons-material/Send';
import CancelIcon from '@mui/icons-material/Cancel';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PanoramaIcon from '@mui/icons-material/Panorama';
import CloseIcon from '@mui/icons-material/Close';
import { selectCurrentUI, openModal, openUI } from "@/features/main/appSlice";
import { selectCurrentRepMsg, selectCurrentRepMsgId, setReplyingMsg } from "./messageSlice";
import { MessageComponent } from "./components";
import { AppError } from "@/shared_components/common";
import { selectSelfId, selectUserById } from "../users/userSlice";
import { debounce, notEmpty, resizeFile } from "@/utils/helperFunction";
import { useAppDispatch, useAppSelector } from "@/utils/hook";
import { useImageInput } from "@/features/image/hook";
import { useGetConversationQuery, useGetMessagesQuery } from "@/api/chat.api";
import { selectCurrentConversation, selectCurrentConversationMsgIds,
     selectCurrentDirrectConvUserId, selectCurrentConversationId } from "@/features/conversations/conversationSlice";
import { ConversationCard } from "../conversations/components";
import { CircularProgress } from "@mui/material";
import { seeMsg, sendMessage } from "../socket/socketSlice";

export const MessageContainer: React.FC<{ }> = ({ }) => { 
    const currentUI = useAppSelector(selectCurrentUI);
    const responsiveClassname =
        currentUI=='chatInfo'?"lg:flex":
        currentUI=='index'?"md:flex":
        "2xs:flex";

    return (
        <div className={"relative hidden flex-col w-full md:min-w-[430px] lg:min-w-[430px] max-w-[700px] h-full divide-slate-500 divide-y "
            + responsiveClassname}>
            <ChatHeader/>
            <ChatContent/>
            <ChatInput/>
        </div>)
}

const ChatHeader: React.FC<{}> = ({}) => {
    const conv = useAppSelector(selectCurrentConversation);
    const dispatch = useAppDispatch();

    const goBack = () => dispatch(openUI("index"));
    
    const showChatInfo = () => dispatch(openUI("chatInfo"));

    return(
        <div className="flex w-full justify-between xs:px-2">
            <button onClick={goBack} className={"p-2 min-w-12 hover:bg-slate-500/50 " + " md:hidden"}>
                <ArrowBackIcon />
            </button>
            {conv ? <ConversationCard conv={conv} /> : <AppError error="No conversation!"/>}
            <button onClick={showChatInfo} className="p-2 min-w-12 hover:bg-slate-500/50">
                <Image src="/icon/info.png" alt="info icon" width={32} height={32} />
            </button>
        </div>
    )
}

const ChatContent: React.FC<{}> = ({}) => {
    const scrollContainer_Ref =useRef<HTMLDivElement>(null);
    const dispatch = useAppDispatch();
    const endMsg_Ref =useRef<HTMLDivElement>(null);
    const messageIds = useAppSelector(selectCurrentConversationMsgIds);
    const conversationId = useAppSelector(selectCurrentConversationId);
    const [cursor,setCursor] = useState('');
    const doFirstScrollDown = useRef(true);
    const preScrollHeight = useRef(0);
    const preMsgNum = useRef(0);
    const targetId = useAppSelector(selectCurrentDirrectConvUserId);
    const {isFetching:isFetchingMsg, error:msgQueryError} = useGetMessagesQuery({cid:conversationId,mid:cursor},{skip:!cursor||!conversationId||conversationId=='temp'});
    const {isFetching:isFetchingConv, error:convQueryError} = useGetConversationQuery({convId:conversationId},{skip:!conversationId||conversationId=='temp'});

    useEffect(()=>{ 
        if((messageIds?.length||0)-1==preMsgNum.current || doFirstScrollDown.current) { 
            doFirstScrollDown.current=false;
            endMsg_Ref.current?.scrollIntoView({ behavior: "instant", inline:"end" });
            const lastMsgId = messageIds?.at(-1);
            if(lastMsgId) dispatch(seeMsg({targetId,convId:conversationId,msgId:lastMsgId}))
        }
        else scrollContainer_Ref.current?.scroll({
                top: scrollContainer_Ref.current?.scrollHeight-preScrollHeight.current,
                behavior: "instant",
              }) // Keep the screen fixed when new message come.
        preMsgNum.current=messageIds?.length||0;
        setTimeout(()=>{
            if (scrollContainer_Ref.current?.scrollTop === 0) {
                loadMoreMsg();
            }
        },500)
        // 
    }
    ,[messageIds])
    
    useEffect(()=>{ 
        setCursor('');
        doFirstScrollDown.current=true;
    }
    ,[conversationId])

    const handleScroll = debounce(() => {
        if (scrollContainer_Ref.current && scrollContainer_Ref.current.scrollTop < 100) {
            loadMoreMsg();
        };
    },100);

    const loadMoreMsg = ()=>{
        if(!isFetchingMsg) {
            setCursor(messageIds?.[0]||'');
            preScrollHeight.current=scrollContainer_Ref.current?.scrollHeight||0;}
    }

    return(
        <div ref={scrollContainer_Ref} onScroll={handleScroll}
            className="w-full pb-7  overflow-x-clip overflow-y-scroll h-full px-1">
            <div className="flex flex-col min-h-full justify-end">
            {isFetchingConv ? <CircularProgress/> : <>
                {msgQueryError && <AppError error={msgQueryError}/>}
                {convQueryError && <AppError error={convQueryError}/>}
                { conversationId &&
                    messageIds?.map(v => <MessageComponent key={v} id={v}/>)
                }
                <div ref={endMsg_Ref}></div>
            </>}
            </div>
        </div>

    )
}

type ConversationChatInput = Record<string,{repMsg?:string, content:string}|undefined>;

const ChatInput: React.FC<{ }> = ({ }) => {
    const [chatInputState, setChatInputState] = useState<ConversationChatInput>({});
    const dispatch = useAppDispatch();
    const { handleImageChange, removeImage, images, fileInputRef, openImageInput, clearImages } = useImageInput();
    const [text,setText] = useState('');
    const currentConvId = useAppSelector(selectCurrentConversationId);
    const currentRepMsgId = useAppSelector(selectCurrentRepMsgId);
    const preConvId = useRef('');
    const selfId = useAppSelector(selectSelfId);
    const targetId = useAppSelector(selectCurrentDirrectConvUserId);
    const isInputFocused = useRef<boolean>(false);
    
    useEffect(()=>{ // When user open another conv:

        // Save data of old conv
        setChatInputState({...chatInputState, [preConvId.current]:{repMsg:currentRepMsgId,content:text}})

        // Set data for new conv
        setText(chatInputState[currentConvId]?.content||'');
        dispatch(setReplyingMsg(chatInputState[currentConvId]?.repMsg))
        preConvId.current=currentConvId;
    },[currentConvId])

    const onSend = () => {
        dispatch(sendMessage({targetId,msg:{
            conv:currentConvId,user:selfId||'',
            cont:text,
            imgFiles:images.length>0?images:undefined,
            repMsg:currentRepMsgId}
        }))
        clearImages();
        setText('');
        dispatch(setReplyingMsg(undefined));
    }

    const handleKeyDown = (e:KeyboardEvent)=>{
        if(e.key === "Enter" && isInputFocused.current==true) {
            onSend();
            e.preventDefault()
        }
    }

    return (
        <div className="flex flex-col sticky bottom-0 bg-slate-900 z-40">
            <RepMessageSection/>
            <div className="flex items-center gap-2 p-1 justify-around w-full">
                <button onClick={openImageInput} className="icon-button"><PanoramaIcon/></button>
                <input type="file" accept="image/*" multiple onChange={handleImageChange} style={{ display: 'none' }} ref={fileInputRef} />
                <div onFocus={()=>isInputFocused.current=true} onBlur={()=>isInputFocused.current=false} 
                    onKeyDown={handleKeyDown}
                 className="bg-slate-800 rounded-2xl w-[70%] xs:w-[80%]">
                    <ImageInput images={images} removeImage={removeImage}/>
                    <TextInput onChange={tc=>setText(tc)} text={text}/>
                </div>
                <button className="icon-button" onClick={onSend}><SendIcon /></button>
            </div>
        </div>
    )
}

const TextInput:React.FC<{onChange?:(text:string)=>void, text:string}> = ({onChange,text}) => {
    const textAreaRef = useRef<HTMLTextAreaElement>(null);
    useEffect(() => {
        textAreaRef.current ? (
            textAreaRef.current.style.height = '36px',
            textAreaRef.current.style.height = `${Math.min(textAreaRef.current?.scrollHeight, 100)}px`) : false
    }, [text]);
    const handleChangeInput = (e:ChangeEvent<HTMLTextAreaElement>) => {
        const textChange = e.target.value;
        onChange?.(textChange);
    };
    
    return <textarea placeholder="Aa" ref={textAreaRef} value={text} onChange={handleChangeInput}
    className="bg-slate-800 rounded-2xl p-2 leading-5 w-full resize-none overflow-y-auto min-h-[36px]" />
}

const ImageInput = memo(
    function ImageInput({images, removeImage}:{images:File[],removeImage:(index: number) => void}){
        return(
            <div style={{paddingBottom:(images.length==0?2:12),paddingTop:(images.length==0?2:12)}} className={" flex items-center max-w-full overflow-x-auto overflow-y-hidden"}>
                {images.length > 0 && images.map((image, index) => (
                    <div key={index} className="mx-2 min-h-20 min-w-20 max-w-20 max-h-20 relative">
                        <div className="absolute w-full h-full overflow-hidden rounded-xl">
                            <img src={URL.createObjectURL(image)} alt="" 
                            className="absolute left-1/2 top-1/2 object-cover min-w-full min-h-full -translate-x-1/2 -translate-y-1/2" />
                        </div>
                        <button onClick={()=>removeImage(index)} className="absolute top-0 right-0 translate-x-3 -translate-y-3 rounded-full bg-black" ><CloseIcon/></button>
                    </div>
                    ))}
                </div>
        )
})

const RepMessageSection: React.FC<{}> = ({}) =>{
    const repMsg = useAppSelector(selectCurrentRepMsg);
    const repUser = useAppSelector(state=>selectUserById(state,repMsg?.user||''));
    const displayName = repMsg?.userNickname||repUser?.displayName;
    const dispatch = useAppDispatch();
    if(!repMsg) return;

    const cancelReply = () => dispatch(setReplyingMsg(undefined));

    return(<div className="bg-slate-700 py-1 px-2 text-slate-300">
        <div className="flex justify-between px-2">
            <p className="text-base scale-90 font-semibold">Replying to {displayName}</p>
            <button onClick={cancelReply}><CancelIcon /></button>
        </div>
        <p className="text-sm scale-90">{repMsg.cont?('"'+ repMsg.cont.substring(0, 20) + (repMsg.cont.length > 20 ? "..." : ""))
        :(''+repMsg.media?.length+' image(s)')}</p>
    </div>);
}