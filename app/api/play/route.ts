import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ play_count: 0 })

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { data } = await admin.from('users').select('play_count, is_pro').eq('id', user.id).single()
  return NextResponse.json({ play_count: data?.play_count ?? 0, is_pro: data?.is_pro ?? false })
}

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: userData } = await admin
    .from('users')
    .select('is_pro, play_count')
    .eq('id', user.id)
    .single()

  if (!userData) {
    await admin.from('users').insert({ id: user.id, email: user.email, play_count: 1 })
    return NextResponse.json({ allowed: true, play_count: 1, is_pro: false })
  }

  if (userData.is_pro) {
    return NextResponse.json({ allowed: true, play_count: userData.play_count, is_pro: true })
  }

  if (userData.play_count >= 5) {
    return NextResponse.json({ allowed: false, play_count: userData.play_count, is_pro: false })
  }

  const newCount = (userData.play_count ?? 0) + 1
  await admin.from('users').update({ play_count: newCount }).eq('id', user.id)
  return NextResponse.json({ allowed: true, play_count: newCount, is_pro: false })
}