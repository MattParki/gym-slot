import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { UserProfile } from "@/models/UserProfile";

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