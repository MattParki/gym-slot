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

// Constants for demo account
const DEMO_PROPOSAL_LIMIT = 50;
const DEMO_PLAN_NAME = "demo";

export async function POST(req) {
  try {
    // Ensure the request is authenticated
    // Note: Implement your authentication validation here
    // This could be a Firebase ID token or session cookie

    const authHeader = req.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const idToken = authHeader.split("Bearer ")[1];

    const body = await req.json();
    const acceptedMarketing = !!body.acceptedMarketing;

    const invitedBusinessId = body.invitedBusinessId || null;



    try {
      // Verify ID token
      const decodedToken = await auth.verifyIdToken(idToken);
      const uid = decodedToken.uid;
      const email = decodedToken.email;

      const businessId = invitedBusinessId || user.uid;


      if (!email) {
        return NextResponse.json(
          { error: "No email found in token" },
          { status: 400 }
        );
      }

      // Create a transaction to ensure both business and user profile are updated atomically
      const batch = db.batch();

      // Reference to the business document
      const businessRef = db.collection("businesses").doc(businessId);
      const businessDoc = await businessRef.get();

      // Reference to the user profile document
      const userProfileRef = db.collection("users").doc(uid);
      const userProfileDoc = await userProfileRef.get();

      // Get current timestamp
      const now = new Date();

      if (!invitedBusinessId) {

        // Check if business document exists - we don't want to overwrite existing businesses
        if (businessDoc.exists) {
          return NextResponse.json(
            { error: "Business already exists for this user" },
            { status: 400 }
          );
        } else {
          // Create new business
          batch.set(businessRef, {
            email: email,
            proposalsRemaining: DEMO_PROPOSAL_LIMIT,
            createdAt: now,
            updatedAt: now,
            plan: DEMO_PLAN_NAME,
            owners: [uid], // Initialize with the current user as an owner
            members: [],
            subscriptionInfo: {
              createdAt: now,
              lastUpdated: now,
              status: 'demo',
              environment: process.env.NODE_ENV,
              lastProposalRefreshDate: now
            }
          });
        }
      }

      // Check if user profile document exists
      if (userProfileDoc.exists) {
        // Update user profile - link to the new business
        batch.update(userProfileRef, {
          email: email,
          updatedAt: now,
          businessId: businessId, // Link to the business
          role: 'owner',  // Default role for the business creator
          acceptedMarketing: acceptedMarketing,
        });
      } else {
        // Create user profile
        batch.set(userProfileRef, {
          email: email,
          createdAt: now,
          updatedAt: now,
          businessId: businessId, // Link to the business
          role: 'owner',  // Default role for the business creator
          displayName: email.split('@')[0],
          onboardingCompleted: false,
          acceptedMarketing: acceptedMarketing,
        });
      }

      // Commit the batch
      await batch.commit();

      return NextResponse.json({
        success: true,
        message: "Demo account created successfully"
      });

    } catch (error) {
      console.error("Authentication error:", error);
      return NextResponse.json(
        { error: "Authentication failed" },
        { status: 401 }
      );
    }

  } catch (error) {
    console.error("Demo account creation error:", error);
    return NextResponse.json(
      { error: "Failed to create demo account" },
      { status: 500 }
    );
  }
}