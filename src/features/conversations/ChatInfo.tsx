import React, { useEffect, useRef, useState } from "react";
import { UserCard } from "@/features/users/component";
import {
  selectCurrentUI,
  openModal,
  openUI,
} from "@/features/main/appSlice";
import {
  AddCircle,
  MoreHoriz,
  Panorama,
  Edit,
  Logout,
} from "@mui/icons-material";
import { ConversationCard } from "./components";
import PopoverWrapper from "@/shared_components/PopoverWrapper";
import { selectSelfId } from "../users/userSlice";
import { useAppDispatch, useAppSelector } from "@/utils/hook";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { openConv, selectCurrentConversation, selectCurrentParticipantDataById, selectSelfAsParticipants, setTempConv } from "./conversationSlice";
import { useGetConversationQuery } from "@/api/chat.api";

export const ChatInfo: React.FC<{}> = ({}) => {
  const currentUI = useAppSelector(selectCurrentUI);
  const canHide = currentUI !='chatInfo';
  const conversation = useAppSelector(selectCurrentConversation);
  const scrollContainer_Ref = useRef<HTMLDivElement>(null);
  const selfAsParticipant = useAppSelector(selectSelfAsParticipants);
  
  useEffect(() => {
    const scrollContainer = scrollContainer_Ref.current;

    if (scrollContainer) {
      // Attach the scroll event listener to the specific element
      scrollContainer.addEventListener("scroll", handleScroll); // Bind the event listener

      // Clean up the listener when the component unmounts
      return () => {
        scrollContainer.removeEventListener("scroll", handleScroll); // Unbind the event listener on clean up
      };
    }
 
  }, []);
  const dispatch = useAppDispatch();
  if (!conversation) return <></>;

  const openAddMemberModal = () => dispatch(openModal({ content: { id: "addMember", convId:conversation._id } }));
  const openChangePhotoModal = () => dispatch(openModal({ content: { id: "changeGroupPhoto", convId:conversation._id } }));
  const openChangeGroupNameModal = () => dispatch(openModal({ content: { id: "changeGroupName", convId:conversation._id } }));
  const openConfirmLeaveGroupModal = () => dispatch(openModal({ content: { id: "confirmLeaveGroup", convId:conversation._id } }));

  const btnCLN = "p-2 flex bg-slate-700 hover:bg-slate-500 rounded-xl disabled:bg-slate-800 disabled:text-slate-400";

  const goBack = () => dispatch(openUI("chatMsg"));

  const handleScroll = () => undefined

  return (
    <div className={"w-full relative overflow-clip lg:flex lg:max-w-[280px] xl:max-w-[320px] 2xl:max-w[400px] "+ (canHide ? "hidden" : "flex")}>
      <div
        ref={scrollContainer_Ref}
        className={"flex flex-col w-full items-center p-2 gap-2 overflow-y-auto "}
      >
        <div className="flex w-full items-center xs:px-2">
            <button onClick={goBack} className={"p-2 min-w-12 hover:bg-slate-500/50 lg:hidden"}>
                <ArrowBackIcon />
            </button>
            <p className="w-full text-center">Chat Info</p>
        </div>
        <ConversationCard conv={conversation} opt={{ size: "lg" }} />
        {conversation.type == "groupChat" ? (
          <div className="flex flex-col p-2 gap-2">
            <button onClick={openChangePhotoModal} className={btnCLN} disabled={selfAsParticipant?.role!='admin'}>
              <Panorama />
              <p className="px-1">Change group photo</p>
            </button>
            <button onClick={openChangeGroupNameModal} className={btnCLN} disabled={selfAsParticipant?.role!='admin'}>
              <Edit />
              <p className="px-1">Change group name</p>
            </button>
            {conversation.participants?.map((p) => (
              <div key={p.id}
                className="flex bg-slate-700 rounded-2xl justify-between"
              >
                <UserCard
                  userId={p.id}
                  opt={{ role: p.role == "admin" ? "Admin" : "Member" }}
                />
                <PopoverWrapper popover={<MemberOptionsPopover targetUserId={p.id}/>}>
                  <div
                    className="hover:bg-slate-500 rounded-2xl"
                  >
                    <MoreHoriz />
                  </div>
                </PopoverWrapper>
              </div>
            ))}
            <button className={btnCLN} onClick={openAddMemberModal} disabled={selfAsParticipant?.role!='admin'}>
              <AddCircle />
              <p className="px-1">Add member</p>
            </button>

            <button className={btnCLN} onClick={openConfirmLeaveGroupModal}>
              <Logout />
              <p className="px-1">Leave group</p>
            </button>
          </div>
        ) : (
          conversation.type == "directMessage" && (
            <div className="flex flex-col p-2 gap-2">
              {conversation.participants?.map((p) => ( 
                <div
                  key={p.id}
                  className="flex bg-slate-700 rounded-2xl justify-between"
                >
                  <UserCard userId={p.id} />
                  <PopoverWrapper popover={<MemberOptionsPopover targetUserId={p.id}/>}>
                  <div
                    className="hover:bg-slate-500 rounded-2xl"
                  >
                    <MoreHoriz />
                  </div>
                </PopoverWrapper>
                </div>
              ))}
              <button className="flex self-center" onClick={openAddMemberModal}>
                <AddCircle />
                <p className="px-1">Create group chat...</p>
              </button>
            </div>
          )
        )}
      </div>
    </div>
  );
};

function useMemberOptions(targetUserId:string) {
  const {_id:convId, type} = useAppSelector(selectCurrentConversation);
  const participant = useAppSelector(state => selectCurrentParticipantDataById(state,targetUserId))
  const selfId = useAppSelector(selectSelfId)||'';
  const [targetId,setTargetId] = useState('');
  const {isFetching:isFetchingConv, error:convQueryError} = useGetConversationQuery({uids:[targetId,selfId]},{skip:!selfId||!targetId});
  const selfAsParticipants = useAppSelector(selectSelfAsParticipants);
  const dispatch = useAppDispatch();
  if(!type || !participant) return [];

  const currentRole = participant.role;
  const currentNickname = participant.nickname;

  const selfRole = selfAsParticipants?.role||"member";
  const openSetNickNameModal = () => dispatch(openModal({content:{id:"setMemberNickname",targetUserId:targetUserId,convId} }))
  const openSetRoleModal = () => dispatch(openModal({content:{id:"setMemberRole",targetUserId:targetUserId,convId} }))
  const openConfirmRemoveMember = () => dispatch(openModal({content:{id:"confirmRemoveMember",targetUserId:targetUserId,convId} }))
  const onOpenDirrectChat = (targetId:string) => {
    if(selfId!=targetId){
        setTargetId(targetId);
        dispatch(setTempConv({userIds:[selfId,targetId]}));
        dispatch(openUI('chatMsg'))
    }
};

  const options = {
      sendDirectMsg: { label: "Send dirrect message", func: () => onOpenDirrectChat(targetUserId) },
      setNickname: { label: "Set nickname...", func: openSetNickNameModal },
      setRole: { label: "Set role...", func: openSetRoleModal },
      removeFromGroup: { label: "Remove from group", func: openConfirmRemoveMember },
  }

  let available_options = [];

  if(type=='groupChat') {
    if (targetUserId != selfAsParticipants?.id)
        available_options.push(options['sendDirectMsg']);

    available_options.push(options['setNickname']);

    if (selfRole == 'admin')
        available_options.push(options['setRole']);

    if (selfRole == 'admin' && targetUserId != selfAsParticipants?.id)
        available_options.push(options['removeFromGroup']);
  }
    else {
      available_options.push(options['setNickname']);
  }

  return available_options;
}

const MemberOptionsPopover: React.FC<{targetUserId:string}> = ({targetUserId}) => {
  const available_options = useMemberOptions(targetUserId);

  return(
      <div className="flex flex-col w-60 gap-1">
          {available_options.map((v,i)=> <button key={i} onClick={v.func} className="popover-option">{v.label}</button>)}
      </div>
  )
}