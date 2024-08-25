import Image from 'next/image'
import { ChangeEvent, createContext, Dispatch, MouseEvent, RefObject, SetStateAction, useContext, useEffect, useRef, useState } from 'react';
import { ModalValue, ModalState, closeModal } from "./appSlice";
import { RootState } from "@/store";
import { SearchBar } from "../search/search";
import { AppImageUpload } from "@/features/image/imageUpload";
import { selectSelf, selectSelfId, selectUserById } from "../users/userSlice";
import { UserCard } from "@/features/users/component";
import { Emoji } from "emoji-picker-react";
import { useAppDispatch, useAppSelector, useDebounce } from "@/utils/hook";
import { Message, UserReact } from '../messages/entity';
import { Conversation, ConversationRole } from '@/features/conversations/entity';
import { selectCurrentConversation, selectCurrentDirrectConvUserId, selectCurrentParticipantDataById,
    selectCurrentConversationId, 
    selectConversationById} from '@/features/conversations/conversationSlice';
import { AppError } from '@/shared_components/common';
import { requestAddPtcp, checkUsername, requestCreateGroupChat, hideMsg, makeConversationUpdate, makeParticipantUpdate, selectIsUpdatingConv, selectIsUpdatingProfile, selectUsernameCheck, unsendMsg, updateUserProfile, requestRemovePtcp, requestLeaveGroupChat } from '../socket/socketSlice';
import { User, UserObjType } from '../users/entity';
import { CircularProgress } from '@mui/material';
import {CheckCircle, Cancel} from '@mui/icons-material';
import { ImageListView } from '@/features/image/ImageListView';

export const GlobalModal:React.FC<{}> = ({}) => {
    const dispatch = useAppDispatch();
    const {isOpen, content } = useAppSelector(state => state.app.modal);

    const onClose = () => dispatch(closeModal());
    const preventDefault = (e:MouseEvent<HTMLDivElement>) => e.stopPropagation();

    return ( isOpen && 
        <div onMouseDown={onClose} style={{zIndex:60}}
            className="fixed top-0 left-0 w-screen h-screen bg-black/50 flex flex-col justify-center items-center">
            {content.id=="image" ? 
                <ImageListView content={content} preventDefault={preventDefault}/>
                :
                <div onMouseDown={preventDefault} className="flex flex-col absolute gap-2 p-3 rounded-2xl min-w-60 max-w-[400px] max-h-[500px] bg-slate-700 overflow-y-auto">
                    <ModalContent content={content}/>
                </div>}
        </div>
    )
}

const ModalContent:React.FC<{content:ModalValue}> = ({content}) => {

    const id = content.id;

    return(
            id=='null'? <></> :
            id=='addMember'? <AddMemberModal {...content}/> :
            id=='changeAvatar'? <ChangeUserProfileImageModal/>:
            id=='changeGroupPhoto'? <ChangeGroupPhotoModal {...content}/>:
            id=='changeGroupName'? <ChangeGroupNameModal {...content}/>:
            id=='setMemberNickname'? <SetMemberNicknameModal {...content}/>:
            id=='setMemberRole'? <SetMemberRoleModal {...content}/>:
            id=='confirmRemoveMember'?<ConfirmRemoveMemberModal {...content}/>:
            id=='changeSelfUsername'? <ChangeUsernameModal/>:
            id=='reactionDetail'?<ReactionModal userReact={content.userReaction}/>:
            id=='confirmLeaveGroup'?<ConfirmLeaveGroupModal {...content}/>:
            id=='removeMessage'?<ConfirmRemoveMessageModal {...content}/>:
            <></>
    )
}

const SetMemberNicknameModal: React.FC<{targetUserId:string,convId:string}> = ({targetUserId,convId}) => {
    const currentDirrectMsgUser = useAppSelector(selectCurrentDirrectConvUserId);
    const initInput = useAppSelector(state=>selectConversationById(state,convId))?.participants?.find(u=>u.id==targetUserId)?.nickname||"";
    const [input, setInput] = useState(initInput||"");
    const dispatch = useAppDispatch();
    const handleChange = (e:React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value);

    const onConfirm = () => dispatch(makeParticipantUpdate({targetUserId,convId,nickname:input,dirrectUserId:currentDirrectMsgUser}))

    return(<>
        <p>Set nickname...</p>
            <input autoFocus className="text-slate-800 p-1 rounded-lg" value={input} onChange={handleChange} />
            <button className="modal-button" disabled={!input?.trim()||input==initInput}
                onClick={onConfirm}>OK</button>
        </>
    )
}

const SetMemberRoleModal: React.FC<{targetUserId:string,convId:string}> = ({targetUserId,convId}) => {
    const initInput = useAppSelector(state=>selectConversationById(state,convId))?.participants?.find(u=>u.id==targetUserId)?.role||'member';
    const [input, setInput] = useState<ConversationRole>(initInput||'member');
    const dispatch = useAppDispatch();
    const handleChange = (e:React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value=='admin'?'admin':'member');

    const onConfirm = () => dispatch(makeParticipantUpdate({convId,targetUserId,role:input}))

    return(<>
        <p>Set role...</p>
            <label className="flex bg-slate-600 rounded-xl p-1">
                <input type="radio" size={24} value="admin" checked={input === 'admin'} onChange={handleChange}/>
                <p className="px-1">Admin</p>
            </label>
            <label className="flex bg-slate-600 rounded-xl p-1">
                <input type="radio" size={24} value="member" checked={input === 'member'} onChange={handleChange} />
                <p className="px-1">Member</p>
            </label>
            <button className="modal-button" disabled={(input !== 'admin' && input !== 'member')||input==initInput}
                onClick={onConfirm}>Confirm</button>
        </>
    )
}

const ConfirmRemoveMessageModal: React.FC<{targetMsg: Message, convId: string;}> = ({targetMsg,convId}) => {
    const [input, setInput] = useState<'removeForAll'|'removeForSelf'|''>('');
    const dispatch = useAppDispatch();
    const currentConvId = useAppSelector(selectCurrentConversationId);
    const selfId = useAppSelector(selectSelfId);
    const targetId = useAppSelector(selectCurrentDirrectConvUserId);

    const handleChange = (e:ChangeEvent<HTMLInputElement>) => setInput(e.target.value=='removeForAll'?e.target.value:'removeForSelf');
    const confirm = () => { 
        dispatch(closeModal());
        if(input=='removeForAll') dispatch(unsendMsg({targetId,msgId:targetMsg._id,convId:currentConvId}));
        else if(input=='removeForSelf') dispatch(hideMsg({targetId, msgId:targetMsg._id,convId}))}

    return(
        <> <p>Remove message...</p>
        {targetMsg.user==selfId && <label className="bg-slate-600 rounded-xl p-1">
            <div className="flex">
                <input type="radio" size={24} value="removeForAll" checked={input === 'removeForAll'} onChange={handleChange}/>
                <b className="px-1">Remove for Everyone</b>
            </div>
            <p className="text-sm">{"You'll permanently remove this message for all chat members. They can see you removed a message."}</p>
        </label>}
        
        <label className="bg-slate-600 rounded-xl p-1">
            <div className="flex">
                <input type="radio" size={24} value="removeForSelf" checked={input === 'removeForSelf'} onChange={handleChange} />
                <b className="px-1">Remove for You</b>
            </div>
            <p className="text-sm">This message will be removed for you. Other chat members will still be able to see it.</p>
        </label>
        <button className="modal-button" disabled={input !== 'removeForSelf' && input !== 'removeForAll'}
            onClick={confirm}>Confirm</button>
    </>
    )
}

const ConfirmRemoveMemberModal: React.FC<{targetUserId:string, convId:string}> = ({convId,targetUserId}) => {
    const dispatch = useAppDispatch();
    const user = useAppSelector(state=>selectUserById(state,targetUserId));
    const onCancel = ()=>dispatch(closeModal());
    const onConfirm = ()=>{ 
        dispatch(requestRemovePtcp({convId,targetUserId}));
        dispatch(closeModal())};

    return(<>
            <p>{"Are you want to remove "+(user?.displayName||"this member")+" from group?"}</p>
            <button className="modal-button" onClick={onConfirm}>Yes</button>
            <button className="modal-button"  onClick={onCancel}>No</button>
        </>
    )
}

const ConfirmLeaveGroupModal: React.FC<{convId:string}> = ({convId}) => {
    const dispatch = useAppDispatch();
    const groupChat = useAppSelector(state=>selectConversationById(state,convId));
    const onCancel = ()=>dispatch(closeModal());
    const onConfirm = ()=>(dispatch(requestLeaveGroupChat({convId})),dispatch(closeModal()));

    return(<>
            <h2>{groupChat?.name||"Unnamed group chat"}</h2>
            <p>{"Are you want to leave this group?"}</p>
            <button className="modal-button" onClick={onConfirm}>Yes</button>
            <button className="modal-button" onClick={onCancel}>No</button>
        </>
    )
}

const AddMemberModal: React.FC<{convId:string}> = ({convId}) => {
    const conversation = useAppSelector(state=> selectConversationById(state,convId));
    const dispatch = useAppDispatch();
    const title = conversation?.type=='groupChat'?"Add member to group...":"Select user to create group chat...";
    const [selectedUser, setSelectedUser] = useState<UserObjType|null>(null);

    if(!conversation?.participants) return <AppError error={"Data error"}/>

    const onSelectUser = (user:UserObjType)=>{
        if(conversation?.type=='groupChat'){
            setSelectedUser(user);
        } else if(conversation.participants && user._id!=conversation.participants[0].id && user._id!=conversation.participants[1].id){
            setSelectedUser(user);
        }
    }
    const selectedUserIds = selectedUser? conversation.participants.slice(0,2).map(v=>v.id).concat(selectedUser._id):[];

    const onConfirmCreateChat = ()=> (dispatch(requestCreateGroupChat({userIds:selectedUserIds})),dispatch(closeModal()))

    const onConfirmAddMember = ()=> selectedUser && (dispatch(requestAddPtcp({convId:conversation._id,newUserId:selectedUser._id})),dispatch(closeModal()));

    const onCancel = ()=> setSelectedUser(null);

    return(
        <div className="flex flex-col p-2 gap-2 items-center">
            {selectedUser ? conversation.type=='groupChat'?
            <>
                <p className="text-xl">Do you want to add this user to the group chat?</p>
                    <UserCard key={selectedUser._id} userId={selectedUser._id}/>
                <div className='flex p-2 gap-2'>
                    <button className='modal-button' onClick={onCancel}>Cancel</button>
                    <button className='modal-button' onClick={onConfirmAddMember}>Confirm</button>
                </div>
            </> : <>
                <p className="text-xl">Do you want to create group chat with these members?</p>
                {selectedUserIds.map(userId=>
                    <UserCard key={userId} userId={userId}/>
                )}
                <div className='flex p-2 gap-2'>
                    <button className='modal-button' onClick={onCancel}>Cancel</button>
                    <button className='modal-button' onClick={onConfirmCreateChat}>Confirm</button>
                </div> 
            </> : <> 
                <p className="text-xl">{title}</p>
                <div className='min-h-[50vh]'>
                    <SearchBar type='user' onSelectUser={onSelectUser}/>
                </div>
            </>}
        </div>
    )
}

const ReactionModal: React.FC<{userReact:UserReact[]}> = ({userReact}) => {

    return(
        <>
        {userReact.map((v, i) =>
            <div key={i} className="flex justify-between items-center gap-2">
                <UserCard userId={v.user} />
                <Emoji unified={v.react} size={32} />
            </div>
        )}</>
    )
}

const ChangeUsernameModal: React.FC<{}> = ({}) => {
    const self = useAppSelector(selectSelf);
    const isUpdatingProfile = useAppSelector(selectIsUpdatingProfile);
    const usernameCheck = useAppSelector(selectUsernameCheck);
    const [inputUsername, setInputUsername] = useState<string>('');
    const [inputDisplayname, setInputDisplayname] = useState<string>('');
    const debouncedUsername = useDebounce(inputUsername,500,'');
    const dispatch = useAppDispatch();

    useEffect(()=>{
        setInputDisplayname(self?.displayName||'');
        setInputUsername(self?.username||'')
    },[self])
    
    useEffect(()=>{
        if(debouncedUsername && !usernameCheck.check[debouncedUsername])
            dispatch(checkUsername({username:debouncedUsername}));
    },[debouncedUsername])

    const handleInputUsernameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setInputUsername(event.target.value.replaceAll(' ', ''));
    };

    const handleInputDisplayname = (event: React.ChangeEvent<HTMLInputElement>) => {
        setInputDisplayname(event.target.value);
    };

    const onCofirmChange = () => {
        dispatch(updateUserProfile({username:inputUsername,displayName:inputDisplayname}));
    }

    return(<>
        <p>Change username:</p>
        <input disabled={isUpdatingProfile} className="text-slate-800 p-1 rounded-lg" value={inputUsername} onChange={handleInputUsernameChange} />
        {(!inputUsername || inputUsername==self?.username) ?<></>:
            !usernameCheck.check[inputUsername] ? 
                <CircularProgress size={16}/>
            : usernameCheck.check[inputUsername]=='available' ?
                <span className='text-green-300'><CheckCircle fontSize='small'/>Username is available</span> 
            : <span className='text-red-300'><Cancel fontSize='small'/>Username is exist</span>  }
        <p>Change display name:</p>
        <input disabled={isUpdatingProfile} className="text-slate-800 p-1 rounded-lg" value={inputDisplayname} onChange={handleInputDisplayname} />
        <button className='modal-button w-48' disabled={isUpdatingProfile || (inputDisplayname==self?.displayName && inputUsername==self.username) ||
        !inputDisplayname.trim() || (inputUsername!=self?.username && (!usernameCheck.check[inputUsername] || usernameCheck.check[inputUsername]=='exist')) }
            onClick={onCofirmChange}>
            {isUpdatingProfile &&<CircularProgress size={16}/> }
            Confirm change
        </button>
        </>
    )
}

const ChangeGroupNameModal: React.FC<{convId:string}> = ({convId}) => {
    const {name:currentName} = useAppSelector(selectCurrentConversation)||{name:''};
    const [input, setInput] = useState("");
    const dispatch = useAppDispatch();
    const isUpdating = useAppSelector(selectIsUpdatingConv);
    const handleChange = (e:React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value);
    useEffect(()=>{
        setInput(currentName||'');
    },[currentName])
    const onConfirm = () => dispatch(makeConversationUpdate({convId,name:input}))

    return(<>
        <p>Change group name:</p>
            <input autoFocus className="text-slate-800 p-1 rounded-lg" value={input} onChange={handleChange} />
            <button className="modal-button" disabled={!input?.trim() || currentName==input || isUpdating}
                onClick={onConfirm}>
                {isUpdating && <CircularProgress size={16}/>}
                Confirm
            </button>
        </>
    )
}

const ChangeGroupPhotoModal: React.FC<{convId:string}> = ({convId}) => {
    const {img:currentGroupPhoto} = useAppSelector(state=>selectConversationById(state,convId))||{img:undefined};
    const dispatch = useAppDispatch();
    const isLoading = useAppSelector(selectIsUpdatingConv);
    const onCofirmChange = (img:File)=> img && dispatch(makeConversationUpdate({convId, img}))

    return <AppImageUpload title='Change group photo' initImage={currentGroupPhoto} isUploading={isLoading}
        onConfirmChange={onCofirmChange}/>
}

const ChangeUserProfileImageModal: React.FC<{}> = ({}) => {
    const {prfImg:currentPrfImg} = useAppSelector(selectSelf)||{prfImg:''};
    const dispatch = useAppDispatch();
    const isLoading = useAppSelector(selectIsUpdatingProfile);
    const onCofirmChange = (img:File)=> img && dispatch(updateUserProfile({prfImg: img}))
    
    return <AppImageUpload title='Change profile image' initImage={currentPrfImg} isUploading={isLoading}
        onConfirmChange={onCofirmChange}/>
}