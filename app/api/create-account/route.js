// app/api/demo-account/route.js
import { NextResponse } from "next/server";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { initializeApp, cert, getApps } from "firebase-admin/app";


if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

const db = getFirestore();
const auth = getAuth();

export async function POST(req) {
  try {

    const authHeader = req.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const idToken = authHeader.split("Bearer ")[1];

    const body = await req.json();
    const acceptedMarketing = !!body.acceptedMarketing;


    try {
      const decodedToken = await auth.verifyIdToken(idToken);
      const uid = decodedToken.uid;
      const email = decodedToken.email;


      const batch = db.batch();

      const businessRef = db.collection("businesses").doc(businessId);
      const businessDoc = await businessRef.get();

      const userProfileRef = db.collection("users").doc(uid);
      const userProfileDoc = await userProfileRef.get();

      const now = new Date();


      if (businessDoc.exists) {
        return NextResponse.json(
          { error: "Business already exists for this user" },
          { status: 400 }
        );
      } else {
        // Create new business
        batch.set(businessRef, {
          email: email,
          createdAt: now,
          updatedAt: now,
          owners: [uid],
          members: [],
          subscriptionInfo: {
            createdAt: now,
            lastUpdated: now,
            status: 'unsubscribed',
          }
        });
      }


      if (userProfileDoc.exists) {

        batch.update(userProfileRef, {
          email: email,
          updatedAt: now,
          businessId: businessId,
          role: 'owner',
          acceptedMarketing: acceptedMarketing,
        });
      } else {
        batch.set(userProfileRef, {
          email: email,
          createdAt: now,
          updatedAt: now,
          businessId: businessId,
          role: 'owner',
          displayName: email.split('@')[0],
          onboardingCompleted: false,
          acceptedMarketing: acceptedMarketing,
        });
      }

      await batch.commit();

      return NextResponse.json({
        success: true,
        message: "Account created successfully"
      });

    } catch (error) {
      console.error("Authentication error:", error);
      return NextResponse.json(
        { error: "Authentication failed" },
        { status: 401 }
      );
    }

  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    );
  }
}