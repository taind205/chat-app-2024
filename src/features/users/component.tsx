import Image from "next/image";
import { UsersState, selectUserById } from "@/features/users/userSlice";
import DefaultProfileImg from "@/../public/icon/defaultProfileImg.png";
import { useAppSelector } from "@/utils/hook";

type UserCardProps = {
    userId:string, opt?:{role?:string, nickname?:string}
}

export const UserCard:React.FC<UserCardProps> = (props) => {
    const user =  useAppSelector(state => selectUserById(state,props.userId)) ;
    
    return (
        <div className="flex items-center p-2 gap-2">
            <div className="relative">
                <Image className="rounded-full" width={32} height={32} alt={user?.displayName||'unknown user'} src={user?.prfImg||DefaultProfileImg}/>
            </div>
            <div>
                <p>{props.opt?.nickname || user?.displayName || 'unknown user'}</p> 
                <p className="text-slate-300 font-light text-sm"> {props.opt?.role||""} </p>
            </div>
        </div>)
        }
