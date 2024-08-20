import { ChangeEvent, memo, useEffect, useMemo, useRef, useState } from "react";
import CancelIcon from '@mui/icons-material/Cancel';
import SearchIcon from '@mui/icons-material/Search';
import { ConversationCard, GroupChatCard } from "../conversations/components";
import { UserCard } from "../users/component";
import { CircularProgress } from "@mui/material";
import ErrorIcon from '@mui/icons-material/Error';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { mergeWithUniqueObjIds } from "@/utils/helperFunction";
import { useAppDispatch, useAppSelector, useDebounce, useOutsideClick } from "@/utils/hook";
import { useGetConversationQuery, useSearchConvQuery, useSearchUserQuery } from "@/api/chat.api";
import { searchUsersByName, selectSelfId } from '@/features/users/userSlice';
import { FetchBaseQueryError } from "@reduxjs/toolkit/query/react";
import { SerializedError } from "@reduxjs/toolkit/react";
import { ConvSearchResponse, SearchResult, UserSearchResponse } from "@/api/type";
import { openUI } from "@/features/main/appSlice";
import { openConv, setTempConv } from "@/features/conversations/conversationSlice";
import { UserObjType } from "../users/entity";

export type SearchType = 'user'|'conv';

function isConversationSearchResult(data: unknown): data is ConvSearchResponse { 
  return (data as ConvSearchResponse)?.groups !== undefined;
}

const useSearch = (type:SearchType ,searchTerm: string) => {
    const selfId = useAppSelector(selectSelfId);
  const storeUsersResult = useAppSelector(state => searchUsersByName(state, searchTerm));
  const debouncedSearchTerm = useDebounce(searchTerm,1000,"");
  const {data:userData, isFetching:isFetchingUser, error:userError} = useSearchUserQuery({term:debouncedSearchTerm||""},
    {skip:(type=="conv")||!debouncedSearchTerm})
  const {data:convData, isFetching:isFetchingConv, error:convError} = useSearchConvQuery({ term: debouncedSearchTerm||""},
    {skip:(type=="user")||(!debouncedSearchTerm)||(!selfId)}); 

  //Fix conditional hook error
  const data = type=="conv"? convData:userData;
  const isFetching = type=="conv"?isFetchingConv:isFetchingUser;
  const error = type=="conv"?convError:userError;

  const completeSearchResult:SearchResult = useMemo(() => {
    if(!data || isFetching)
      return {users:storeUsersResult, conversations:type=="conv"?[]:undefined};
    else if(type=="conv" && isConversationSearchResult(data))
      return {groups:data.groups, users:mergeWithUniqueObjIds(storeUsersResult,data.users||[])}
    else return {users:mergeWithUniqueObjIds(storeUsersResult,data.users||[])}
  }, [storeUsersResult, data, isFetching, type]);

  return { data:completeSearchResult, isFetching, error };
};

const _SearchBar: React.FC<{type: SearchType, onSelectUser?:(user:UserObjType)=>void}> = ({type,onSelectUser}) => {
    const [input, setInput] = useState('');
    const [isSearchResultsOpen, setIsSearchResultsOpen] = useState(false);
    const rootDivComponentRef = useRef<HTMLDivElement>(null);
    useOutsideClick(rootDivComponentRef,()=>setIsSearchResultsOpen(false));
    
    const handleInputChange =  (e:ChangeEvent<HTMLInputElement>) => {
        console.log('performing search at SearchBar component...')
        setInput(e.target.value);
        setIsSearchResultsOpen(true);
      }

    const onClearResult = () => {
        setInput('');
    }

    const placeHolder = type=="conv"? "Search for user or group chat...":"Add other users..."

    return (
        <div ref={rootDivComponentRef} className="gap-2 py-2 relative">
            <div className="m-2 p-2 flex justify-between bg-slate-700 flex  rounded-xl">
                <div className="flex gap-2 w-full">
                    {isSearchResultsOpen && <button onClick={()=>setIsSearchResultsOpen(false)}><ArrowBackIcon/></button>  }
                    <div className="flex rounded-xl gap-1 text-white w-full">
                        <SearchIcon />
                        <input className="w-full ml-2 bg-slate-700 text-slate-300" value={input} onFocus={()=>setIsSearchResultsOpen(true)}
                            onChange={handleInputChange} placeholder={placeHolder}/>
                        {input ? <button onClick={onClearResult}><CancelIcon /></button> : <></>}
                    </div>
                </div>
            </div>
            {isSearchResultsOpen && <SearchResultContent type={type} searchTerm={input} onSelectUser={onSelectUser}/>}
        </div>
            )
}

export const SearchBar = memo(_SearchBar);

const getErrorMsg = (error:FetchBaseQueryError | SerializedError) => 'data' in error? JSON.stringify(error.data) : 'message' in error? error.message: error.toString()

export const SearchResultContent:React.FC<{type:SearchType, searchTerm:string, onSelectUser?:(user:UserObjType)=>void}> = ({type, searchTerm,onSelectUser}) => {
    const { data, error, isFetching } = useSearch(type,searchTerm);
    const selfId = useAppSelector(selectSelfId)||'';
    const [targetId,setTargetId] = useState('');
    const {isFetching:isFetchingConv, error:convQueryError} = useGetConversationQuery({uids:[targetId,selfId]},{skip:!selfId||!targetId});
    const dispatch = useAppDispatch();

    const convBtnCLN2= "pl-1 rounded flex items-center h-16 w-full hover:bg-slate-600"

    const onOpenGroupChat = (convId:string) => dispatch(openConv(convId),openUI('chatMsg'));
    const onOpenDirrectChat = (targetId:string) => {
        if(selfId!=targetId){
            setTargetId(targetId);
            dispatch(setTempConv({userIds:[selfId,targetId]}));
            dispatch(openUI('chatMsg'))
        }
    };

    return <div className="absolute z-10 w-full bg-slate-700">{
        error?<p><ErrorIcon/>{getErrorMsg(error)}</p>:
    data &&
    <>{
        (type=='conv') ? <>
            {data.users && data.users.length >0 && 
                    <div className="flex flex-col">
                        <p className="px-2 py-1">User:</p>
                            {data.users.map(v=> 
                                <button className={convBtnCLN2} key={v._id} onClick={()=>onOpenDirrectChat(v._id)}>
                                    <UserCard userId={v._id}/>
                                </button>)}
                    </div>}
            {data.groups && data.groups.length>0 && 
                <div className="flex flex-col">
                    <p className="px-2 py-1">Group chat:</p>
                        {data.groups.map(v=> 
                            <button className={convBtnCLN2} key={v._id} onClick={()=>onOpenGroupChat(v._id)}>
                                <GroupChatCard data={v}/>
                            </button>)}
                </div>}
            {(data.groups?.length||0)+(data.users?.length||0)==0 && !isFetching && <p className="px-2 py-1"> No results found</p>} </>
        :type=='user'? <>
            {(type=='user' && data.users) ? 
                data.users.length>0?
                    data.users.map(v=> 
                        <div key={v._id} className="flex justify-between rounded-xl hover:bg-slate-600 px-2">
                            <UserCard userId={v._id}/>
                            <button onClick={()=>onSelectUser?.(v)}><AddCircleIcon/></button>
                    </div>
                ): !isFetching && <p className="px-2 py-1">No result found</p>:<></>}
        </>:<></>
    }
    {isFetching?<CircularProgress size={24}/>:<></>}
    </>}
    </div>;
}