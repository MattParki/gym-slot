import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { adminDb } from "@/lib/firebase-admin"; // 👈 fix the import


function getStripeConfig() {
  return {
    secretKey: process.env.STRIPE_SECRET_KEY!,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!
  };
}

export const dynamic = "force-dynamic"; 

export async function POST(req: NextRequest) {
  try {
    const { secretKey, webhookSecret } = getStripeConfig();

    const stripe = new Stripe(secretKey, {
      apiVersion: "2025-05-28.basil",
    });

    const body = await req.text();
    const sig = req.headers.get("stripe-signature");

    if (!sig) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch (err: any) {
    //   console.error("Webhook signature verification failed:", err.message);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

    //   console.log("🔔 Subscription cancelled for customer:", customerId);

      // 🔎 Find business by matching subscriptionInfo.customerId
      const snapshot = await adminDb.collection("businesses")
        .where("subscriptionInfo.customerId", "==", customerId)
        .limit(1)
        .get();

      if (snapshot.empty) {
        // console.warn("❌ No matching business found for customer ID:", customerId);
      } else {
        const docRef = snapshot.docs[0].ref;
        await docRef.update({
          "subscriptionInfo.status": "cancelled",
          "subscriptionInfo.updatedAt": new Date().toISOString()
        });
        // console.log("✅ Firestore updated: subscriptionInfo.status = 'cancelled'");
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    // console.error("❌ Webhook handler error:", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
