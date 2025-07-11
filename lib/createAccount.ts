// lib/createAccount.ts
import { User } from "firebase/auth";
import { getIdToken } from "firebase/auth";
import { doc, setDoc, serverTimestamp, arrayUnion, updateDoc, getDoc } from "firebase/firestore";
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
    console.log("🔄 Attempting API endpoint for:", user.email, "with role:", role, "businessId:", businessId);

    const response = await fetch("/api/create-account", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${idToken}`,
      },
      body: JSON.stringify({ idToken, businessId, role })
    });

    console.log("📡 API Response status:", response.status);

    // Check if response is ok
    if (response.ok) {
      const result = await response.json();
      console.log("✅ API endpoint succeeded for:", user.email);
      console.log("📋 API Result:", result);
      return result;
    }

    // Only use fallback if API truly failed
    const errorText = await response.text();
    console.log("❌ API endpoint failed, using fallback for:", user.email);
    console.log("📄 API Error details:", errorText);
    console.log("🔄 Switching to direct Firestore creation...");
    return await createAccountDirectly(user, businessId, role);

  } catch (networkError) {
    // Only catch network errors, not API errors
    console.log("🌐 Network error, using fallback for:", user.email);
    console.log("📄 Network Error details:", networkError);
    console.log("🔄 Switching to direct Firestore creation...");
    return await createAccountDirectly(user, businessId, role);
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

  console.log(`🔄 Fallback: Creating account for ${email} with role: ${userRole}`);

  try {
    if (businessId) {
      // User is joining an existing business
      const businessRef = doc(db, "businesses", businessId);
      const businessDoc = await getDoc(businessRef);
      
      if (!businessDoc.exists()) {
        throw new Error("Business not found");
      }

      const businessData = businessDoc.data();
      const existingStaff = businessData.staffMembers || [];
      const existingMembers = businessData.members || [];

      // Check if user already exists in either array
      const existsInStaff = existingStaff.some((member: any) => member.email === email);
      const existsInMembers = existingMembers.some((member: any) => member.email === email);

      // Add user to appropriate array based on role (only if they don't already exist)
      if (!existsInStaff && !existsInMembers) {
        if (userRole === "staff" || userRole === "personal_trainer" || userRole === "administrator" || userRole === "manager" || userRole === "receptionist") {
          // Add as staff member
          console.log(`➕ Fallback: Adding ${email} as staff member with role: ${userRole}`);
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
          console.log(`➕ Fallback: Adding ${email} as gym customer`);
          await updateDoc(businessRef, {
            members: arrayUnion({
              id: uid,
              email: email,
              role: "customer"
            }),
            updatedAt: serverTimestamp()
          });
        }
      } else {
        console.log(`⚠️ Fallback: User ${email} already exists in business. Staff: ${existsInStaff}, Members: ${existsInMembers} - skipping business array update`);
      }

      // ALWAYS create user profile (regardless of business array existence)
      console.log(`🔄 Fallback: Creating user profile for ${email} with role: ${userRole}`);
      
      // Check if user profile already exists
      const userRef = doc(db, "users", uid);
      const existingUserDoc = await getDoc(userRef);
      
      if (existingUserDoc.exists()) {
        console.log(`📝 Fallback: Updating existing user profile for ${email}`);
        
        // Get existing profile data to handle multiple businesses
        const existingData = existingUserDoc.data();
        const existingBusinessIds = existingData.businessIds || [];
        
        // Add new businessId if not already present
        let updatedBusinessIds = [...existingBusinessIds];
        if (!updatedBusinessIds.includes(businessId)) {
          updatedBusinessIds.push(businessId);
          console.log(`➕ Fallback: Adding business ${businessId} to user ${email}. Total businesses: ${updatedBusinessIds.length}`);
        } else {
          console.log(`⚠️ Fallback: User ${email} already has business ${businessId} in their profile`);
        }
        
        await updateDoc(userRef, {
          email: email,
          updatedAt: serverTimestamp(),
          businessIds: updatedBusinessIds,
          role: userRole,
          // Keep backwards compatibility
          businessId: businessId,
        });
      } else {
        console.log(`🆕 Fallback: Creating new user profile for ${email}`);
        await setDoc(userRef, {
          email: email,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          businessIds: [businessId], // Initialize with array containing this business
          role: userRole,  
          displayName: displayName,
          onboardingCompleted: false,
          // Additional fields for staff members to fill out
          firstName: "",
          lastName: "",
          phone: "",
          profilePicture: "",
          bio: "",
          specialties: [],
          certifications: [],
          // Profile completion status
          profileCompleted: false,
          // Keep backwards compatibility
          businessId: businessId,
        });
      }
      console.log(`✅ Fallback: User profile created for ${email}`);
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

      // Check if user profile already exists for business owner
      const userRef = doc(db, "users", uid);
      const existingUserDoc = await getDoc(userRef);
      
      if (existingUserDoc.exists()) {
        console.log(`📝 Fallback: Updating existing user profile for business owner ${email}`);
        
        // Get existing profile data to handle multiple businesses
        const existingData = existingUserDoc.data();
        const existingBusinessIds = existingData.businessIds || [];
        
        // Add new businessId if not already present
        let updatedBusinessIds = [...existingBusinessIds];
        if (!updatedBusinessIds.includes(uid)) {
          updatedBusinessIds.push(uid);
          console.log(`➕ Fallback: Adding owned business ${uid} to user ${email}. Total businesses: ${updatedBusinessIds.length}`);
        }
        
        await updateDoc(userRef, {
          email: email,
          updatedAt: serverTimestamp(),
          businessIds: updatedBusinessIds,
          role: 'owner',
          // Keep backwards compatibility
          businessId: uid,
        });
      } else {
        console.log(`🆕 Fallback: Creating new user profile for business owner ${email}`);
        await setDoc(userRef, {
          email: email,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          businessIds: [uid], // Initialize with array containing this business
          role: 'owner',  
          displayName: displayName,
          onboardingCompleted: false,
          // Additional fields for profile completion
          firstName: "",
          lastName: "",
          phone: "",
          profilePicture: "",
          bio: "",
          specialties: [],
          certifications: [],
          // Profile completion status
          profileCompleted: false,
          // Keep backwards compatibility
          businessId: uid,
        });
      }
    }

    return true;

  } catch (error) {
    throw new Error(`Direct Firestore creation failed: ${(error as Error).message}`);
  }
}