// lib/createAccount.ts
import { User } from "firebase/auth";
import { getIdToken } from "firebase/auth";
import { doc, setDoc, serverTimestamp, arrayUnion, updateDoc } from "firebase/firestore";
import { db } from "./firebase";

/**
 * Creates a account by setting up a business document and user profile
 * for the newly registered user, or adds them as a member to an existing business
 * 
 * @param {User} user - The Firebase user object from authentication
 * @param {string | null} businessId - The business ID to join as a member (optional)
 * @returns {Promise<any>} - Returns the response from the API
 */
export async function createAccount(
  user: User,
  businessId?: string | null,
  role?: string | null,
): Promise<any> {
  if (!user || !user.uid || !user.email) {
    throw new Error("Invalid user data");
  }

  try {
    const idToken = await getIdToken(user);

    const response = await fetch("/api/create-account", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${idToken}`,
      },
      body: JSON.stringify({ idToken, businessId, role })
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

      // fallback for accounts

      return await createAccountDirectly(user ?? 'none', businessId, role);
    }

    return await response.json();
  } catch (error) {
    return await createAccountDirectly(user ?? 'none', businessId, role);
  }
}


/**
 * Fallback function to create an account directly in Firestore
 * Used if the API endpoint fails
 * 
 * @param {User} user - The Firebase user object from authentication
 * @param {string | null} businessId - The business ID to join as a member (optional)
 * @returns {Promise<boolean>} - Returns true if creation was successful
 */
export async function createAccountDirectly(user: User, businessId?: string | null, role?: string | null): Promise<boolean> {
  if (!user || !user.uid || !user.email) {
    throw new Error("Invalid user data");
  }

  const uid = user.uid;
  const email = user.email;
  const displayName = email.split('@')[0];
  const userRole = role || "customer"; // Default to customer if no role specified

  try {
    if (businessId) {
      // User is joining an existing business
      const businessRef = doc(db, "businesses", businessId);
      
      // Add user to appropriate array based on role
      if (userRole === "staff" || userRole === "personal_trainer" || userRole === "administrator" || userRole === "manager" || userRole === "receptionist") {
        // Add as staff member
        await updateDoc(businessRef, {
          staffMembers: arrayUnion({
            id: uid,
            email: email,
            role: userRole
          }),
          updatedAt: serverTimestamp()
        });
      } else {
        // Add as gym customer
        await updateDoc(businessRef, {
          members: arrayUnion({
            id: uid,
            email: email,
            role: "customer"
          }),
          updatedAt: serverTimestamp()
        });
      }

      // Create user profile with correct role
      await setDoc(doc(db, "users", uid), {
        email: email,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        businessId: businessId, 
        role: userRole,  
        displayName: displayName,
        onboardingCompleted: false
      });
    } else {
      // Create new business (demo account)
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
    }

    return true;

  } catch (error) {
    throw new Error(`Direct Firestore creation failed: ${(error as Error).message}`);
  }
}