// lib/getStripeCustomerId.ts
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export async function getStripeCustomerId(userId: string): Promise<string> {
  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) throw new Error("User not found");

  const data = userSnap.data();
  if (!data.stripeCustomerId) throw new Error("Stripe customer ID not found");

  return data.stripeCustomerId;
}