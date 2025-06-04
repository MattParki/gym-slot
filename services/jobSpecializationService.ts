import { db } from "@/lib/firebase";
import { doc, setDoc, getDoc, collection, getDocs } from "firebase/firestore";

interface SpecializationDoc {
  id: string;
  text: string;
  count: number;
  normalized?: string;
  createdAt?: string;
  updatedAt?: string;
}

function normalizeSpecialization(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-'); // Replace any whitespace with a single hyphen
}

// Generate a display version with proper capitalization
function formatSpecializationForDisplay(text: string): string {
  return text
    .trim()
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

// Add new specializations to the 'specializations' collection
export async function trackUserSpecialization(specialization: string): Promise<void> {
  try {
    const normalizedId = normalizeSpecialization(specialization);
    const formattedText = formatSpecializationForDisplay(specialization);
    
    const specRef = doc(db, "specializations", normalizedId);
    const specSnap = await getDoc(specRef);
    
    if (!specSnap.exists()) {
      await setDoc(specRef, {
        text: formattedText,
        normalized: normalizedId,
        count: 1,
        createdAt: new Date().toISOString()
      });
    } else {
      await setDoc(specRef, {
        ...specSnap.data(),
        count: (specSnap.data().count || 0) + 1,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    }
  } catch (error) {
    console.error("Error tracking specialization:", error);
  }
}

export async function getCommonSpecializations(limit = 30): Promise<string[]> {
  try {
    const specsRef = collection(db, "specializations");
    const specsSnap = await getDocs(specsRef);
    
    const specs = specsSnap.docs
      .map(doc => ({ ...doc.data(), id: doc.id } as SpecializationDoc))
      .sort((a, b) => (b.count || 0) - (a.count || 0))
      .slice(0, limit)
      .map(spec => spec.text);
    
    return specs;
  } catch (error) {
    console.error("Error getting common specializations:", error);
    return [];
  }
}

// Check if a specialization already exists in similar form
export async function findSimilarSpecialization(input: string): Promise<string | null> {
  try {
    const normalizedInput = normalizeSpecialization(input);
    const specRef = doc(db, "specializations", normalizedInput);
    const specSnap = await getDoc(specRef);
    
    if (specSnap.exists()) {
      return specSnap.data().text;
    }
    
    return null;
  } catch (error) {
    console.error("Error finding similar specialization:", error);
    return null;
  }
}