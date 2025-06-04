import { auth } from "@/lib/firebase";
import { updateEmail } from "firebase/auth";

export async function updateUserAuth(newEmail: string): Promise<void> {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("No authenticated user found");
    }
    
    await updateEmail(currentUser, newEmail);
  } catch (error) {
    console.error("Error updating user authentication data:", error);
    throw error;
  }
}