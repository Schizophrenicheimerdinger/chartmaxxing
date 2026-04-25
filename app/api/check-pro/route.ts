import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET() {
  const cookieStore = cookies()
  const isPro = cookieStore.get('viralchart_pro')?.value === 'true'
  return NextResponse.json({ isPro })
}