import { NextRequest, NextResponse } from 'next/server';
import { createSSRClient } from '@/lib/supabase-ssr';

const PUBLIC_PATHS = new Set([
  '/login',
  '/api/qa/session',
  '/api/qa/admin-check',
  '/api/health',
]);

const STATIC_FILE_REGEX = /\.(?:png|jpg|jpeg|gif|svg|ico|css|js|txt|webmanifest)$/i;

function isPublicPath(pathname: string) {
  if (PUBLIC_PATHS.has(pathname)) return true;
  if (pathname.startsWith('/_next/')) return true;
  if (pathname === '/favicon.ico') return true;
  if (STATIC_FILE_REGEX.test(pathname)) return true;
  return false;
}

function buildLoginRedirect(url: URL, reason?: 'unauthenticated' | 'access_denied') {
  const target = new URL('/login', url.origin);
  if (reason === 'unauthenticated') {
    const nextParam = url.pathname + url.search;
    if (nextParam && nextParam !== '/login') {
      target.searchParams.set('next', nextParam);
    }
  } else if (reason === 'access_denied') {
    target.searchParams.set('error', 'access_denied');
  }
  return target;
}

export async function middleware(req: NextRequest) {
  if (req.method === 'OPTIONS') {
    return NextResponse.next();
  }

  const pathname = req.nextUrl.pathname;
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const { supabase, response, applyCookies } = createSSRClient(req);

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session) {
    const redirectUrl = buildLoginRedirect(req.nextUrl, 'unauthenticated');
    const redirectResponse = NextResponse.redirect(redirectUrl);
    return applyCookies(redirectResponse);
  }

  try {
    const adminCheckUrl = new URL('/api/qa/admin-check', req.url);
    const adminResponse = await fetch(adminCheckUrl, {
      headers: {
        cookie: req.headers.get('cookie') ?? '',
      },
      cache: 'no-store',
    });

    if (!adminResponse.ok) {
      const redirectUrl = buildLoginRedirect(req.nextUrl, 'access_denied');
      const redirectResponse = NextResponse.redirect(redirectUrl);
      return applyCookies(redirectResponse);
    }

    const payload = (await adminResponse.json()) as { isPlatformAdmin?: boolean };
    if (!payload?.isPlatformAdmin) {
      const redirectUrl = buildLoginRedirect(req.nextUrl, 'access_denied');
      const redirectResponse = NextResponse.redirect(redirectUrl);
      return applyCookies(redirectResponse);
    }
  } catch {
    const redirectUrl = buildLoginRedirect(req.nextUrl, 'access_denied');
    const redirectResponse = NextResponse.redirect(redirectUrl);
    return applyCookies(redirectResponse);
  }

  return applyCookies(response);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|css|js|txt|webmanifest)$).*)',
  ],
};

