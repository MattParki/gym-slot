import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp
} from "firebase/firestore";


export interface Business {
  id: string;
  name?: string;
  email: string;
  owners: string[];
  members: BusinessMember[];
  staffMembers?: BusinessMember[];
  companySize?: string;
  companyName?: string;
  contactInfo?: string;
  specialty?: string;
  createdAt: string;
  subscriptionInfo?: SubscriptionInfo;
}

export interface BusinessMember {
  id: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  department?: string;
  joinDate?: string;
  status?: "active" | "inactive";
  lastLogin?: string;
}

export interface SubscriptionInfo {
  status: string;
  subscriptionId: string;
  productName: string;
}

export async function getBusiness(userId: string): Promise<Business | null> {
  try {
    const businessesRef = collection(db, "businesses");
    const q = query(businessesRef, where("owners", "array-contains", userId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    const businessDoc = querySnapshot.docs[0];
    const businessData = businessDoc.data();

    return {
      id: businessDoc.id,
      companyName: businessData.companyName || "",
      contactInfo: businessData.contactInfo || "",
      email: businessData.email || "",
      owners: businessData.owners || [],
      members: businessData.members || [],
      staffMembers: businessData.staffMembers || [],
      companySize: businessData.companySize || "",
      createdAt: businessData.createdAt?.toDate?.()
        ? businessData.createdAt.toDate().toISOString()
        : new Date().toISOString(),
      subscriptionInfo: businessData.subscriptionInfo || undefined,
    };
  } catch (error) {
    console.error("Error getting business:", error);
    throw error;
  }
}

export async function updateBusiness(businessId: string, data: Partial<Business>): Promise<void> {
  try {
    const businessRef = doc(db, "businesses", businessId);
    await updateDoc(businessRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Error updating business:", error);
    throw error;
  }
}

export interface AddMemberResult {
  success: boolean;
  member?: BusinessMember;
  error?: string;
  alreadyExists?: boolean;
}

// Add a staff member/employee (someone who works for the gym and has admin access)
export async function addStaffMember(businessId: string, email: string, role: string = "staff"): Promise<AddMemberResult> {
  try {
    const businessRef = doc(db, "businesses", businessId);
    const business = await getDoc(businessRef);
    const businessData = business.data();

    if (!businessData) {
      return { success: false, error: "Business not found" };
    }

    // Check in both members and staffMembers arrays
    const members = businessData.members || [];
    const staffMembers = businessData.staffMembers || [];
    
    if (staffMembers.some((member: BusinessMember) => member.email === email)) {
      return { 
        success: false, 
        error: "This person is already a staff member", 
        alreadyExists: true 
      };
    }

    if (members.some((member: BusinessMember) => member.email === email)) {
      return { 
        success: false, 
        error: "This person is already a gym customer. Please remove them from customers first if you want to make them a staff member.", 
        alreadyExists: true 
      };
    }

    const newStaffMember: BusinessMember = {
      id: Date.now().toString(),
      email,
      role
    };

    await updateDoc(businessRef, {
      staffMembers: [...staffMembers, newStaffMember],
      updatedAt: serverTimestamp()
    });

    return { success: true, member: newStaffMember };
  } catch (error) {
    console.error("Error adding staff member:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to add staff member" 
    };
  }
}

// Add a gym customer (someone who pays to use the gym services)
export async function addGymCustomer(businessId: string, email: string): Promise<AddMemberResult> {
  try {
    const businessRef = doc(db, "businesses", businessId);
    const business = await getDoc(businessRef);
    const businessData = business.data();

    if (!businessData) {
      return { success: false, error: "Business not found" };
    }

    // Check in both members and staffMembers arrays
    const members = businessData.members || [];
    const staffMembers = businessData.staffMembers || [];
    
    if (members.some((member: BusinessMember) => member.email === email)) {
      return { 
        success: false, 
        error: "This person is already a gym customer", 
        alreadyExists: true 
      };
    }

    if (staffMembers.some((member: BusinessMember) => member.email === email)) {
      return { 
        success: false, 
        error: "This person is already a staff member. Staff members have different access than gym customers.", 
        alreadyExists: true 
      };
    }

    const newCustomer: BusinessMember = {
      id: Date.now().toString(),
      email,
      role: "customer" // Clear role for gym customers
    };

    await updateDoc(businessRef, {
      members: [...members, newCustomer],
      updatedAt: serverTimestamp()
    });

    return { success: true, member: newCustomer };
  } catch (error) {
    console.error("Error adding gym customer:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to add gym customer" 
    };
  }
}

// Legacy function - kept for backwards compatibility but routes to appropriate function
export async function addBusinessMember(businessId: string, email: string, role: string = "staff"): Promise<AddMemberResult> {
  // Route to appropriate function based on role
  if (role === "customer") {
    return addGymCustomer(businessId, email);
  } else {
    return addStaffMember(businessId, email, role);
  }
}

export async function removeBusinessMember(businessId: string, memberId: string): Promise<void> {
  try {
    const businessRef = doc(db, "businesses", businessId);
    const business = await getDoc(businessRef);
    const businessData = business.data();

    if (!businessData) {
      throw new Error("Business not found");
    }

    const members = businessData.members || [];
    const updatedMembers = members.filter((member: BusinessMember) => member.id !== memberId);

    await updateDoc(businessRef, {
      members: updatedMembers,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Error removing business member:", error);
    throw error;
  }
}

export async function removeBusinessStaffMember(businessId: string, memberId: string): Promise<void> {
  try {
    const businessRef = doc(db, "businesses", businessId);
    const business = await getDoc(businessRef);
    const businessData = business.data();

    if (!businessData) {
      throw new Error("Business not found");
    }

    const staffMembers = businessData.staffMembers || [];
    const updatedStaffMembers = staffMembers.filter((member: BusinessMember) => member.id !== memberId);

    await updateDoc(businessRef, {
      staffMembers: updatedStaffMembers,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Error removing business staff member:", error);
    throw error;
  }
}

export async function updateBusinessStaffMember(businessId: string, memberId: string, updates: Partial<BusinessMember>): Promise<void> {
  try {
    const businessRef = doc(db, "businesses", businessId);
    const business = await getDoc(businessRef);
    const businessData = business.data();

    if (!businessData) {
      throw new Error("Business not found");
    }

    const staffMembers = businessData.staffMembers || [];
    const updatedStaffMembers = staffMembers.map((member: BusinessMember) => 
      member.id === memberId ? { ...member, ...updates } : member
    );

    await updateDoc(businessRef, {
      staffMembers: updatedStaffMembers,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Error updating business staff member:", error);
    throw error;
  }
}

export async function sendPasswordResetEmail(email: string): Promise<{ devMode?: boolean; resetLink?: string; message: string }> {
  try {
    console.log(`Requesting password reset for: ${email}`);
    const response = await fetch("/api/send-password-reset", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Password reset API error:", errorData);
      throw new Error(errorData.error || "Failed to send password reset email");
    }

    const result = await response.json();
    console.log("Password reset success:", result);
    return result;
  } catch (error) {
    console.error("Error sending password reset email:", error);
    throw error;
  }
}

// Remove duplicate staff members (cleanup utility)
export async function removeDuplicateStaffMembers(businessId: string): Promise<void> {
  try {
    const businessRef = doc(db, "businesses", businessId);
    const business = await getDoc(businessRef);
    const businessData = business.data();

    if (!businessData) {
      throw new Error("Business not found");
    }

    const staffMembers = businessData.staffMembers || [];
    
    // Remove duplicates based on email
    const uniqueStaffMembers = staffMembers.reduce((acc: BusinessMember[], current: BusinessMember) => {
      const existingMember = acc.find(member => member.email === current.email);
      if (!existingMember) {
        acc.push(current);
      } else {
        console.log(`Removing duplicate staff member: ${current.email} (ID: ${current.id})`);
      }
      return acc;
    }, []);

    if (uniqueStaffMembers.length < staffMembers.length) {
      await updateDoc(businessRef, {
        staffMembers: uniqueStaffMembers,
        updatedAt: serverTimestamp()
      });
      console.log(`Removed ${staffMembers.length - uniqueStaffMembers.length} duplicate staff members`);
    }
  } catch (error) {
    console.error("Error removing duplicate staff members:", error);
    throw error;
  }
}
