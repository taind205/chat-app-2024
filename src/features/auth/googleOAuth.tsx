
import { CodeResponse, GoogleLogin, GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';
import GoogleIcon from '@/../public/icon/google_icon.png';
import Image from 'next/image';

export const GoogleOAuth:React.FC<{onLogin:(code:CodeResponse)=>void}> = ({onLogin}) => {
   
    return(
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_APP_CLIENT_ID||""}>
            <GoogleLoginCustomButton onLogin={onLogin}/>
    </GoogleOAuthProvider>);
}

export const GoogleLoginCustomButton:React.FC<{onLogin:(code:CodeResponse)=>void}> = ({onLogin}) => {
    const googleLogin = useGoogleLogin({
        flow: 'auth-code',
        onSuccess: onLogin,
        onError:(errRes) => console.error(errRes),
    });

    return(
    <button onClick={()=>googleLogin()}
        className="flex items-center p-2 gap-2 shadow-md rounded-xl hover:bg-slate-600 border-2 border-slate-200">
            <Image className="p-1" src={GoogleIcon} alt='Google icon' height={32} width={32}/>
        <p className='text-white'>Sign in using Google account</p>
    </button>
    )
}
