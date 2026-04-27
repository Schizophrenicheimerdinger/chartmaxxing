import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ isPro: false, user: null })

  const { data } = await supabase.from('users').select('is_pro').eq('id', user.id).single()
  return NextResponse.json({ isPro: data?.is_pro ?? false, user: { id: user.id, email: user.email } })
}