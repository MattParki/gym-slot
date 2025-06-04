// lib/createAccount.ts
import { User } from "firebase/auth";
import { getIdToken } from "firebase/auth";
import { doc, setDoc, serverTimestamp, arrayUnion, updateDoc } from "firebase/firestore";
import { db } from "./firebase";

/**
 * Creates a account by setting up a business document and user profile
 * for the newly registered user
 * 
 * @param {User} user - The Firebase user object from authentication
 * @returns {Promise<any>} - Returns the response from the API
 */
export async function createAccount(
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

    const response = await fetch("/api/create-account", {
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

  try {
    if (invitedBusinessId) {
      // Only create user document
      await setDoc(doc(db, "users", uid), {
        email,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        businessId: invitedBusinessId,
        role: "member",
        displayName,
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
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        owners: [uid],
        members: [],
        subscriptionInfo: {
          createdAt: serverTimestamp(),
          lastUpdated: serverTimestamp(),
          status: "unsubscribed",
        },
      });

      await setDoc(doc(db, "users", uid), {
        email: email,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        businessId: uid, 
        role: 'owner',  
        displayName: displayName,
        onboardingCompleted: false
      });

      return true;

    }
  } catch (error) {
    throw new Error(`Direct Firestore creation failed: ${(error as Error).message}`);
  }
}