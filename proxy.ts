import { NextRequest, NextResponse } from 'next/server';
import { getSession } from './lib/auth/auth';

export async function proxy(request: NextRequest) {
    const session = await getSession();  

    const isDashboardPage = request.nextUrl.pathname.startsWith("/dashboard");
    if(isDashboardPage && !session?.user) {
        return NextResponse.rewrite(new URL("/sign-in", request.url));
    }
    // return NextResponse.rewrite(new URL('/sign-in', request.url));
    return NextResponse.next();
}