import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { UserProfile } from "@/models/UserProfile";
import { industryOptions } from "@/data/industryOptions";

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
      
      // Handle compatibility with older profiles that might have specialization as string
      if (userData.specialization && !userData.specializations) {
        userData.specializations = typeof userData.specialization === 'string' 
          ? [userData.specialization] 
          : userData.specialization;
      }
      
      if (!userData.specializations) {
        userData.specializations = [];
      }
      
      return userData as UserProfile;
    }
    
    return null;
  } catch (error) {
    // console.error("Error getting user profile:", error);
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
    // console.error("Error saving user profile:", error);
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
    console.error("Error checking onboarding status:", error);
    return false;
  }
}

/**
 * Get user specializations for use in prompts
 * @param userId - The user's UID
 * @returns Formatted specialization string for prompt insertion
 */
export async function getUserSpecializations(userId: string): Promise<string> {
  try {
    const profile = await getUserProfile(userId);
    // console.log("User Profile for Specializations:", profile);
    if (!profile || !profile.specializations || profile.specializations.length === 0) {
      return "various products and services";
    }
    
    // Format specializations for natural language inclusion in prompts
    if (profile.specializations.length === 1) {
      return profile.specializations[0];
    } else if (profile.specializations.length === 2) {
      return `${profile.specializations[0]} and ${profile.specializations[1]}`;
    } else {
      const lastSpecialization = profile.specializations[profile.specializations.length - 1];
      const otherSpecializations = profile.specializations.slice(0, -1).join(", ");
      return `${otherSpecializations}, and ${lastSpecialization}`;
    }
  } catch (error) {
    // console.error("Error getting user specializations:", error);
    return "various products and services";
  }
}

/**
 * Get user industry for use in prompts
 * @param userId - The user's UID
 * @returns Industry string for prompt insertion
 */
export async function getUserIndustry(userId: string): Promise<string> {
  try {
    const profile = await getUserProfile(userId);
    // console.log("User Profile for Industry:", profile);
    if (!profile || !profile.industry) {
      return "general business";
    }
    
    // Find the label for the industry value
    const industryOption = industryOptions.find(opt => opt.value === profile.industry);
    return industryOption ? industryOption.label : "general business";
  } catch (error) {
    // console.error("Error getting user industry:", error);
    return "general business";
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
    console.error("Error updating user profile:", error);
    throw error;
  }
}