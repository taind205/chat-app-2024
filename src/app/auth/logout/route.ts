import { cookies } from "next/headers";

export async function POST(request: Request) {
    cookies().delete('at');
    cookies().delete('at_exp');
    return new Response(JSON.stringify({msgCode:'logoutSuccess'}), {
        status: 200,
        })
}
