import { useEffect, useRef, useState } from "react";
import { SearchBar } from "@/features/search/search";
import { ConversationComponent, ConversationIcon } from "./components";
import { useGetLatestConversationsQuery} from "@/api/chat.api";
import { CircularProgress } from "@mui/material";
import { selectCurrentUI, openModal } from "@/features/main/appSlice";
import { ConversationLoadPos, selectConversationIds, selectConversations, selectConvLoadPos } from "./conversationSlice";
import { useAppDispatch, useAppSelector } from "@/utils/hook";
import { selectSelf, selectSelfId, selectUserById } from "../users/userSlice";
import { User, UserMap } from "../users/entity";
import { debounce } from "@/utils/helperFunction";
import { UserSection } from "../users/container";
import { AppError } from "@/shared_components/common";

export const ConversationUI: React.FC<{ }> = ({ }) => {
    const canHide = useAppSelector(selectCurrentUI)!='index';

    return (<div className={"md:flex w-full flex-col md:min-w-[320px] lg:max-w-[360px] xl:max-w-[400px] 2xl:max-w-[500px] h-full " + (canHide ? "hidden" : "")}>
                <ConversationList/>
    </div>
    )
}

const ConversationList:React.FC<{}> = ({}) => {
    const convLoadpos = useAppSelector(selectConvLoadPos);
    const [pos,setPos] = useState<ConversationLoadPos>();
    const conversationIds = useAppSelector(selectConversationIds);
    const selfId = useAppSelector(selectSelfId)||'';
    const {isFetching, error} = useGetLatestConversationsQuery({uid:selfId,pos:pos},{skip:!selfId});
    const firstConv_Ref=useRef<HTMLDivElement>(null);
    const doFirstScrollDown = useRef(true);
    const preScrollTop = useRef(0);
    const preConvNum = useRef(0);

    const scrollContainer_Ref =useRef<HTMLDivElement>(null);

    useEffect(()=>{ 
        doFirstScrollDown.current=true;
    }
    ,[])

    useEffect(()=>{ 
        if(doFirstScrollDown.current==true && conversationIds.length>=10) { 
            doFirstScrollDown.current=false;
            firstConv_Ref.current?.scrollIntoView({ behavior: "instant", inline:"center" });
        }
        else if(preConvNum.current<conversationIds.length) {
            preConvNum.current=conversationIds.length;
            scrollContainer_Ref.current?.scroll({ // perverse the current view when new conv is loaded
            // top is from 0 to -100(%px)
            top: (preScrollTop.current), 
            behavior: "instant",
          })}
        setTimeout(()=>{ //fix bug where height == scrollHeight not trigger load conv
            if (scrollContainer_Ref.current?.clientHeight == scrollContainer_Ref.current?.scrollHeight) {
                loadMoreConv();
            }
        },500)
    }
    ,[conversationIds])

    const handleScroll = debounce(() => {
        const container = scrollContainer_Ref.current;
        if (container) {
            if(container.scrollTop +container.clientHeight > container.scrollHeight -  100) {
                loadMoreConv();
            };
        }
    },100);

    const loadMoreConv = () => {
        if(!isFetching) {
            setPos(convLoadpos); 
            preScrollTop.current=scrollContainer_Ref.current?.scrollTop||0;
        }
    }

    return(
        <div className={"flex flex-col min-h-[50vh] max-h-full overflow-y-scroll"} ref={scrollContainer_Ref} onScroll={handleScroll} >
            <div className="h-1 w-1" ref={firstConv_Ref}></div>
            <div className="tall:sticky top-0 bg-slate-900 z-10">
                <UserSection />
                <SearchBar type='conv'/>
            </div>
            <div className="flex flex-col-reverse">
                {conversationIds.map(v => <ConversationComponent key={v} id={v} />)}
            </div>
            { error? <AppError error={"An error occurred"}/>
            : isFetching && <CircularProgress size={24}/> } 
        </div>
    )
}


export function getConversationName(members: UserMap|Array<User|undefined>): string {
    if(Array.isArray(members)) return members.map(u=> u?.displayName).join(', ');
    else {
        const objKey = Object.keys(members);
        return objKey.map(v => members[v]?.displayName).join(', ');
    }
    }

export const ConversationNameByUserIds:React.FC<{ids:string[]}> =({ids}) => {
    const displayNum = Math.min(5,ids.length);
    const endSep = displayNum<ids.length?"...":"";
    return <>{ids.slice(0,displayNum).map((v,i) => <UserNameById key={v} id={v} sep={i!=displayNum-1?", ":endSep}/>)}</>
    }
    
const UserNameById:React.FC<{id:string,sep?:string}>= ({id,sep}) => {
    const user = useAppSelector(state => selectUserById(state,id));
    return <p className="inline">{user?.displayName||"Unknown user"}{sep}</p>;
}