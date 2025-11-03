import { updateSession } from '@/utils/supabase/middleware'

export async function middleware(request) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Protect everything except these public paths:
     * - _next static files
     * - images
     * - favicon
     * - homepage, login, signup
     */
    '/((?!_next/static|_next/image|favicon.ico|^$|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
