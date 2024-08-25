import { LoginPage } from "@/features/auth/LoginPage";
import { MainApp } from "@/features/main/main";
import { cookies } from 'next/headers'

const App: React.FC = async () => {
  const domain = process.env.NEXT_PUBLIC_SERVER_DOMAIN;
  const key = process.env.API_KEY;
  if(!domain || !key) {
    console.error("Env 'key' and/or 'domain' is null");
    return <h2>500 - Internal server error</h2>
  }
  
  const cookieStore = cookies()
  const jwt = cookieStore.get('at');
  const jwt_exp = Number(cookieStore.get('at_exp')?.value);
  if(!jwt_exp||!jwt) return <LoginPage/>

  const user = await fetch(`${domain}/users/get-signed-in-user`, {
    method:"POST",
    headers:{"Authorization":`Bearer ${jwt.value}`,"Content-Type": "application/json"},
    body:JSON.stringify({key})
  })
    .then(async (res) => await res.json() ) 
  return (
    <MainApp user={user} token={{value:jwt.value,expire:jwt_exp}}/>
  );
};

export default App;