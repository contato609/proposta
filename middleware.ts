import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const isAuthPage = request.nextUrl.pathname.startsWith('/login')
  const isApiRoute = request.nextUrl.pathname.startsWith('/api')

  try {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user && !isAuthPage && !isApiRoute) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    if (user && isAuthPage) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  } catch {
    // Sessão expirada ou token inválido — redireciona para login sem crashar
    if (!isAuthPage && !isApiRoute) {
      const response = NextResponse.redirect(new URL('/login', request.url))
      // Limpa cookies de sessão expirada
      request.cookies.getAll().forEach(cookie => {
        if (cookie.name.startsWith('sb-')) response.cookies.delete(cookie.name)
      })
      return response
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
