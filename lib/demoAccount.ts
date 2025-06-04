// lib/demoAccount.ts
import { User } from "firebase/auth";
import { getIdToken } from "firebase/auth";
import { doc, setDoc, serverTimestamp, getFirestore, arrayUnion, updateDoc } from "firebase/firestore";
import { db } from "./firebase";

// Constants for demo account limits
const DEMO_PROPOSAL_LIMIT = 3; // Limit demo accounts to 3 proposals
const DEMO_PLAN_NAME = "demo"; // Name for the demo plan

/**
 * Creates a demo account by setting up a business document and user profile
 * for the newly registered user
 * 
 * @param {User} user - The Firebase user object from authentication
 * @returns {Promise<any>} - Returns the response from the API
 */
export async function createDemoAccount(
  user: User,
  options?: {
    acceptedMarketing?: boolean;
    invitedBusinessId?: string;
  }
): Promise<any> {
  if (!user || !user.uid || !user.email) {
    throw new Error("Invalid user data");
  }

  const acceptedMarketing = options?.acceptedMarketing ?? false;
  const invitedBusinessId = options?.invitedBusinessId ?? null;

  try {
    const idToken = await getIdToken(user);

    const response = await fetch("/api/demo-account", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${idToken}`,
      },
      body: JSON.stringify({ idToken, acceptedMarketing, invitedBusinessId })
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage;

      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error || "Unknown server error";
      } catch (parseError) {
        errorMessage = `Server error: ${errorText.substring(0, 100)}...`;
      }

      // fallback for demo accounts, but invited users shouldn't fallback
      if (invitedBusinessId) throw new Error("Failed to join invited business");

      return await createDemoBusinessDirectly(user, invitedBusinessId ?? 'none');
    }

    return await response.json();
  } catch (error) {
    if (invitedBusinessId) throw error; // don't fallback for invited users
    return await createDemoBusinessDirectly(user, invitedBusinessId ?? 'none');
  }
}


/**
 * Fallback function to create a demo business directly in Firestore
 * Used if the API endpoint fails
 * 
 * @param {User} user - The Firebase user object from authentication
 * @returns {Promise<boolean>} - Returns true if creation was successful
 */
export async function createDemoBusinessDirectly(user: User, invitedBusinessId?: string): Promise<boolean> {
  if (!user || !user.uid || !user.email) {
    throw new Error("Invalid user data");
  }

  const uid = user.uid;
  const email = user.email;
  const displayName = email.split('@')[0];

  console.log("Creating demo business directly for user:", uid, "with email:", email);
  console.log("Invited business ID:", invitedBusinessId);

  try {
    console.log("invitedBusinessId:", invitedBusinessId);
    if (invitedBusinessId) {
      // Only create user document
      await setDoc(doc(db, "users", uid), {
        email,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        businessId: invitedBusinessId,
        role: "member",
        displayName,
        onboardingCompleted: false,
      });

      // Optionally add them to the business members array
      const businessRef = doc(db, "businesses", invitedBusinessId);
      await updateDoc(businessRef, {
        members: arrayUnion(uid),
      });

      return true;
    } else {

      // Create the business document
      await setDoc(doc(db, "businesses", uid), {
        email: email,
        proposalsRemaining: DEMO_PROPOSAL_LIMIT,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        plan: DEMO_PLAN_NAME,
        owners: [uid],
        members: [],
        subscriptionInfo: {
          createdAt: serverTimestamp(),
          lastUpdated: serverTimestamp(),
          status: "demo",
          environment: process.env.NEXT_PUBLIC_ENVIRONMENT || "development",
          lastProposalRefreshDate: serverTimestamp(),
        },
      });

      // Create the user profile document
      await setDoc(doc(db, "users", uid), {
        email: email,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        businessId: uid, // Link to the business
        role: 'owner',  // Default role for the business creator
        displayName: displayName,
        onboardingCompleted: false
      });

      // console.log("Demo account created directly in Firestore for:", email);
      return true;

    }
  } catch (error) {
    // console.error("Error creating demo account directly:", error);
    throw new Error(`Direct Firestore creation failed: ${(error as Error).message}`);
  }
}