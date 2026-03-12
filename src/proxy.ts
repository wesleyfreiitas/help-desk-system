import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decrypt } from '@/lib/auth';

export async function proxy(request: NextRequest) {
  const session = request.cookies.get('session')?.value;
  const parsedSession = session ? await decrypt(session) : null;
  
  const isPublicRoute = request.nextUrl.pathname === '/login';

  // Se não estiver logado e a rota não for pública
  if (!parsedSession && !isPublicRoute && request.nextUrl.pathname !== '/') {
    // Redirecionar para login caso seja uma rota protegida
    if (request.nextUrl.pathname.startsWith('/dashboard') || request.nextUrl.pathname.startsWith('/tickets')) {
       return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Se estiver logado e acessar /login, manda pro dashboard
  if (parsedSession && isPublicRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  // Redirecionar raiz para dashboard se logado, ou login se dslg.
  if (request.nextUrl.pathname === '/') {
     if (parsedSession) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
     } else {
        return NextResponse.redirect(new URL('/login', request.url));
     }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
