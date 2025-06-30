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
import { sendEmailVerification } from "firebase/auth"; 

interface AuthContextType {
  user: User | null;
  loading: boolean;
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
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);


  async function signup(email: string, password: string) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  
    // Send email verification
    await sendEmailVerification(userCredential.user);
  
    return userCredential;
  }
  
  // Helper function to check if email belongs to any business
  async function checkEmailBelongsToBusiness(email: string): Promise<boolean> {
    try {
      const businessesRef = collection(db, 'businesses');
      
      // Check if email matches business email or any member email
      const businessEmailQuery = query(businessesRef, where('email', '==', email));
      const businessEmailSnapshot = await getDocs(businessEmailQuery);
      
      if (!businessEmailSnapshot.empty) {
        return true;
      }
      
      // Check if email is in members array
      const allBusinessesQuery = query(businessesRef);
      const allBusinessesSnapshot = await getDocs(allBusinessesQuery);
      
      for (const doc of allBusinessesSnapshot.docs) {
        const business = doc.data();
        if (business.members && Array.isArray(business.members)) {
          const memberEmails = business.members.map((member: any) => member.email);
          if (memberEmails.includes(email)) {
            return true;
          }
        }
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
  
    if (!user.emailVerified) {
      await signOut(auth); // Prevent session from persisting
      throw new Error("Please verify your email address. Check your inbox and spam folder.");
    }

    // Check if email belongs to any business
    const emailBelongsToBusiness = await checkEmailBelongsToBusiness(email);
    if (!emailBelongsToBusiness) {
      await signOut(auth); // Prevent session from persisting
      throw new Error("This email is not associated with any business. Please contact your business administrator.");
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
    loading,
    signup,
    login,
    logout,
    resetPassword,
    signupAsDemo
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}