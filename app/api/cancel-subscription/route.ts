import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function POST(req: Request) {
  const { subscriptionId } = await req.json();

  if (!subscriptionId) {
    return NextResponse.json({ error: 'Missing subscriptionId' }, { status: 400 });
  }

  try {
    const deleted = await stripe.subscriptions.cancel(subscriptionId);
    return NextResponse.json({ success: true, status: deleted.status });
  } catch (err: any) {
    console.error('Stripe cancel error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
