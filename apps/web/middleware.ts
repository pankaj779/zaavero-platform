import { NextResponse, type NextRequest } from 'next/server';
import { AUTH_COOKIE_NAMES } from '@graphology/auth';

const LOGIN_PATH = '/login';

const PROTECTED_PREFIXES = ['/dashboard', '/teacher', '/admin'] as const;

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function hasSessionCookie(request: NextRequest): boolean {
  const access = request.cookies.get(AUTH_COOKIE_NAMES.accessToken)?.value;
  const refresh = request.cookies.get(AUTH_COOKIE_NAMES.refreshToken)?.value;
  return Boolean(access ?? refresh);
}

export function middleware(request: NextRequest): NextResponse {
  const { pathname, search } = request.nextUrl;
  const authenticated = hasSessionCookie(request);

  if (isProtectedPath(pathname) && !authenticated) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = LOGIN_PATH;
    loginUrl.searchParams.set('next', `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === LOGIN_PATH && authenticated) {
    const next = request.nextUrl.searchParams.get('next');
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = next?.startsWith('/') ? next : '/dashboard';
    redirectUrl.search = '';
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/teacher/:path*', '/admin/:path*', '/login'],
};
