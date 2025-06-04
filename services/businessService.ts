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

export async function addBusinessMember(businessId: string, email: string): Promise<BusinessMember> {
  try {
    const businessRef = doc(db, "businesses", businessId);
    const business = await getDoc(businessRef);
    const businessData = business.data();

    if (!businessData) throw new Error("Business not found");

    const members = businessData.members || [];
    if (members.some((member: BusinessMember) => member.email === email)) {
      throw new Error("Member already exists");
    }

    const newMember: BusinessMember = {
      id: Date.now().toString(),
      email,
      role: "member"
    };

    await updateDoc(businessRef, {
      members: [...members, newMember],
      updatedAt: serverTimestamp()
    });

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
