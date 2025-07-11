import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";
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
    
    // Update the user's profile document
    await updateDoc(userRef, {
      ...data,
      updatedAt: new Date().toISOString()
    });

    // If profile data includes basic info (firstName, lastName, phone), also update business staff records
    if (data.firstName !== undefined || data.lastName !== undefined || data.phone !== undefined || data.role !== undefined) {
      try {
        // Get the user's email to find their staff records
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const userEmail = userData.email;
          
          if (userEmail) {
            // Find all businesses where this user is a staff member
            const businessesRef = collection(db, "businesses");
            const businessesSnapshot = await getDocs(businessesRef);
            
            const updatePromises: Promise<void>[] = [];
            
            for (const businessDoc of businessesSnapshot.docs) {
              const businessData = businessDoc.data();
              const staffMembers = businessData.staffMembers || [];
              
              // Check if this user is in the staff members array
              const staffMemberIndex = staffMembers.findIndex((member: any) => member.email === userEmail);
              
              if (staffMemberIndex !== -1) {
                // Update the staff member's data in this business
                const updatedStaffMembers = [...staffMembers];
                updatedStaffMembers[staffMemberIndex] = {
                  ...updatedStaffMembers[staffMemberIndex],
                  ...(data.firstName !== undefined && { firstName: data.firstName }),
                  ...(data.lastName !== undefined && { lastName: data.lastName }),
                  ...(data.phone !== undefined && { phone: data.phone }),
                  ...(data.role !== undefined && { role: data.role }),
                };
                
                // Update the business document
                const businessRef = doc(db, "businesses", businessDoc.id);
                updatePromises.push(
                  updateDoc(businessRef, {
                    staffMembers: updatedStaffMembers,
                    updatedAt: new Date()
                  })
                );
              }
            }
            
            // Execute all business updates
            await Promise.all(updatePromises);
            console.log(`✅ Synced profile updates to ${updatePromises.length} business(es) for ${userEmail}`);
          }
        }
      } catch (error) {
        console.error("Error syncing profile updates to business records:", error);
        // Don't fail the user profile update if business sync fails
      }
    }
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
}