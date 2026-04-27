import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: Request) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const email = session.customer_details?.email
    if (email) {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
      // Find user by email and set is_pro = true
      const { data: authUsers } = await supabase.auth.admin.listUsers()
      const user = authUsers?.users.find(u => u.email === email)
      if (user) {
        await supabase.from('users').upsert({
          id: user.id,
          email: user.email,
          is_pro: true,
          stripe_customer_id: session.customer as string,
        }, { onConflict: 'id' })
      }
    }
  }

  return NextResponse.json({ received: true })
}