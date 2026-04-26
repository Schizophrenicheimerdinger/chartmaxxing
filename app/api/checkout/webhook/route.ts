import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { cookies } from 'next/headers'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    return NextResponse.json({ error: 'Webhook signature failed' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
  const cookieStore = await cookies()
  cookieStore.set('viralchart_pro', 'true', {
    httpOnly: true,
    secure: true,
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  })
}

  return NextResponse.json({ received: true })
}

// Required: tell Next.js not to parse the body (Stripe needs raw bytes)