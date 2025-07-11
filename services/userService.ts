import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { UserProfile } from "@/models/UserProfile";

/**
 * Helper function to get all business IDs for a user (handles both old and new format)
 * @param profile - The user's profile
 * @returns Array of business IDs
 */
export function getUserBusinessIds(profile: UserProfile | null): string[] {
  if (!profile) return [];
  
  // If new businessIds array exists, use it
  if (profile.businessIds && profile.businessIds.length > 0) {
    return profile.businessIds;
  }
  
  // Fall back to old single businessId for backwards compatibility
  if (profile.businessId) {
    return [profile.businessId];
  }
  
  return [];
}

/**
 * Helper function to add a business ID to a user's profile
 * @param userId - The user's UID
 * @param businessId - The business ID to add
 */
export async function addUserToBusinessId(userId: string, businessId: string): Promise<void> {
  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const userData = userSnap.data() as UserProfile;
      const currentBusinessIds = getUserBusinessIds(userData);
      
      // Only add if not already present
      if (!currentBusinessIds.includes(businessId)) {
        const updatedBusinessIds = [...currentBusinessIds, businessId];
        await updateDoc(userRef, {
          businessIds: updatedBusinessIds,
          updatedAt: new Date().toISOString(),
        });
        console.log(`✅ Added business ${businessId} to user ${userId}. Total businesses: ${updatedBusinessIds.length}`);
      } else {
        console.log(`⚠️ User ${userId} already belongs to business ${businessId}`);
      }
    } else {
      console.log(`⚠️ User ${userId} profile not found when trying to add business ${businessId}`);
    }
  } catch (error) {
    console.error(`Error adding user ${userId} to business ${businessId}:`, error);
    throw error;
  }
}

/**
 * Helper function to remove a business ID from a user's profile
 * @param userId - The user's UID
 * @param businessId - The business ID to remove
 */
export async function removeUserFromBusinessId(userId: string, businessId: string): Promise<void> {
  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const userData = userSnap.data() as UserProfile;
      const currentBusinessIds = getUserBusinessIds(userData);
      
      const updatedBusinessIds = currentBusinessIds.filter(id => id !== businessId);
      await updateDoc(userRef, {
        businessIds: updatedBusinessIds,
        updatedAt: new Date().toISOString(),
      });
      console.log(`✅ Removed business ${businessId} from user ${userId}. Total businesses: ${updatedBusinessIds.length}`);
    }
  } catch (error) {
    console.error(`Error removing user ${userId} from business ${businessId}:`, error);
    throw error;
  }
}

/**
 * Get user profile from Firestore
 * @param userId - The user's UID
 * @returns The user's profile data or null if not found
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const userData = userSnap.data();
     
      return userData as UserProfile;
    }
    
    return null;
  } catch (error) {
    throw error;
  }
}

/**
 * Save user profile to Firestore
 * @param userId - The user's UID
 * @param profileData - The profile data to save
 * @returns The ID of the saved document
 */
export async function saveUserProfile(userId: string, profileData: Partial<UserProfile>): Promise<string> {
  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      await updateDoc(userRef, {
        ...profileData,
        updatedAt: new Date().toISOString(),
      });
    } else {
      await setDoc(userRef, {
        ...profileData,
        createdAt: new Date().toISOString(),
      });
    }
    
    return userId;
  } catch (error) {
    throw error;
  }
}

/**
 * Check if user has completed onboarding
 * @param userId - The user's UID
 * @returns True if onboarding is completed, false otherwise
 */
export async function hasCompletedOnboarding(userId: string): Promise<boolean> {
  try {
    const profile = await getUserProfile(userId);
    return profile?.onboardingCompleted === true;
  } catch (error) {
    return false;
  }
}

export async function updateUserProfile(userId: string, data: Partial<UserProfile>): Promise<void> {
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      ...data,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    throw error;
  }
}