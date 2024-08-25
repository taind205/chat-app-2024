import { cookies } from "next/headers";

export async function POST(request: Request) {
    const domain = process.env.NEXT_PUBLIC_SERVER_DOMAIN;
    const key = process.env.API_KEY;
    if(!domain || !key) { console.error("Env 'key' and/or 'domain' is null"); return Response.error(); }
    const cred = await request.json();
    if(cred) {
        let token = {jwt:""};
        if(cred.code) {
            // Google Auth
            token = await fetch(`${domain}/auth/google/callback`,{
                headers: {
                    "Content-Type": "application/json",
                  },
                method:"POST", 
                body:JSON.stringify({'code':cred.code, key}) 
            })
                .then(async (res) => await res.json() );
        } else if(cred.uid && cred.password) {
            // Login using userId & password
            token = await fetch(`${domain}/auth/login`,{
                  headers: {
                    "Content-Type": "application/json",
                  },
                  method:"POST", 
                  body:JSON.stringify({'uid':cred.uid, 'password':cred.password,key})
                })
                .then(async (res) => await res.json() );
        }
        if(!token.jwt) return Response.error();
        cookies().set({
            name: 'at',
            value: token.jwt,
            maxAge: 3540,
            httpOnly: true,
            secure: true,
            })
        cookies().set({
          name: 'at_exp',
          value: String(Date.now()+3540*1000),
          maxAge: 3540,
          httpOnly: true,
          secure: true,
          })
        return new Response(JSON.stringify({msgCode:'loginSuccess'}), {
            status: 200,
          })
    }
}