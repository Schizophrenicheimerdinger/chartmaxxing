import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST() {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price: process.env.STRIPE_PRICE_ID!,
        quantity: 1,
      },
    ],
    mode: 'subscription', // change to 'payment' for one-time
    success_url: `${process.env.NEXT_PUBLIC_URL}/editor?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/editor`,
  })

  return NextResponse.json({ url: session.url })
}