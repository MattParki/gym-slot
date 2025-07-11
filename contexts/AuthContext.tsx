"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  getIdToken
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, getDocs, or } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { UserCredential } from "firebase/auth";
import { getUserProfile } from '@/services/userService';
import { UserProfile } from '@/models/UserProfile';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isStaffMember: boolean;
  signup: (email: string, password: string) => Promise<UserCredential>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signupAsDemo: (email: string, password: string) => Promise<UserCredential>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Helper function to check if user is a staff member
  const isStaffMember = userProfile?.role ? 
    ['owner', 'business-owner', 'staff', 'personal_trainer', 'administrator', 'manager', 'receptionist'].includes(userProfile.role) : 
    false;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      if (user) {
        try {
          // Fetch user profile when user is authenticated
          const profile = await getUserProfile(user.uid);
          setUserProfile(profile);
        } catch (error) {
          console.error('Error fetching user profile:', error);
          setUserProfile(null);
        }
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);


  async function signup(email: string, password: string) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  
    // No email verification required - users can access their profile immediately
    return userCredential;
  }
  
  // Helper function to check if email belongs to any business as a STAFF member (not customer)
  async function checkEmailBelongsToBusiness(email: string): Promise<boolean> {
    try {
      const businessesRef = collection(db, 'businesses');
      const businessSnapshot = await getDocs(businessesRef);
      
      for (const doc of businessSnapshot.docs) {
        const businessData = doc.data();
        
        // Check if user is business owner
        if (businessData.email === email) {
          return true;
        }
        
        // Check if user is in staffMembers array (CRM access)
        const staffMembers = businessData.staffMembers || [];
        if (staffMembers.some((member: any) => member.email === email)) {
          return true;
        }
        
        // DON'T check members array - customers should not access CRM
        // They should only use the mobile app
      }
      
      return false;
    } catch (error) {
      console.error('Error checking business email:', error);
      return false;
    }
  }

  async function login(email: string, password: string) {
  
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
  
    // Reload user to get the latest verification status
    await user.reload();

    // Check if email belongs to any business as a STAFF member (not customer)
    const emailBelongsToBusiness = await checkEmailBelongsToBusiness(email);
    if (!emailBelongsToBusiness) {
      await signOut(auth); // Prevent session from persisting
      throw new Error("This email is not authorized to access the admin dashboard. If you're a customer, please use the mobile app to book classes.");
    }
  }
  

  async function logout() {
    await signOut(auth);
    router.push('/');
  }

  async function resetPassword(email: string) {
    await sendPasswordResetEmail(auth, email);
  }

  async function signupAsDemo(email: string, password: string) {
    try {
      // 1. Create the Firebase auth account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // 2. Get ID token to authenticate with our API
      const idToken = await getIdToken(userCredential.user);
      
      // 3. Call our API to set up the demo business
      const response = await fetch("/api/create-account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ idToken }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create account");
      }
      
      return userCredential;
    } catch (error) {
      if (auth.currentUser) {
        await auth.currentUser.delete();
      }
      throw error;
    }
  }

  const value = {
    user,
    userProfile,
    loading,
    isStaffMember,
    signup,
    login,
    logout,
    resetPassword,
    signupAsDemo
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}