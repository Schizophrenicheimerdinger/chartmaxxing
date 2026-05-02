import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')

  const supabase = await createClient()
  let user = null

  if (token_hash && type) {
    // Email confirmation and password reset links
    const { data, error } = await supabase.auth.verifyOtp({ token_hash, type: type as any })
    if (!error && data.user) user = data.user
  } else if (code) {
    // Google OAuth
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error && data.user) user = data.user
  }

  if (user) {
    const { createClient: createAdmin } = await import('@supabase/supabase-js')
    const admin = createAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    await admin.from('users').upsert({
      id: user.id,
      email: user.email,
    }, { onConflict: 'id', ignoreDuplicates: true })
  }

  return NextResponse.redirect(`${origin}/projects`)
}
