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

export async function addBusinessMember(businessId: string, email: string, role: string = "staff"): Promise<BusinessMember> {
  try {
    const businessRef = doc(db, "businesses", businessId);
    const business = await getDoc(businessRef);
    const businessData = business.data();

    if (!businessData) throw new Error("Business not found");

    // Check in both members and staffMembers arrays
    const members = businessData.members || [];
    const staffMembers = businessData.staffMembers || [];
    
    if (members.some((member: BusinessMember) => member.email === email) ||
        staffMembers.some((member: BusinessMember) => member.email === email)) {
      throw new Error("Member already exists");
    }

    const newMember: BusinessMember = {
      id: Date.now().toString(),
      email,
      role
    };

    // Store staff members in staffMembers array, regular gym members in members array
    if (role === "staff") {
      await updateDoc(businessRef, {
        staffMembers: [...staffMembers, newMember],
        updatedAt: serverTimestamp()
      });
    } else {
      await updateDoc(businessRef, {
        members: [...members, newMember],
        updatedAt: serverTimestamp()
      });
    }

    return newMember;
  } catch (error) {
    console.error("Error adding business member:", error);
    throw error;
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
