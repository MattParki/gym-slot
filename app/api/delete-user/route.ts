import { NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase-admin";

// Helper: Remove user from all staffMembers arrays
async function removeFromAllBusinesses(email: string) {
  const businessesSnapshot = await adminDb.collection("businesses").get();
  let affectedBusinesses = 0;
  for (const doc of businessesSnapshot.docs) {
    const data = doc.data();
    const staffMembers = data.staffMembers || [];
    const newStaff = staffMembers.filter((m: any) => (m.email || "").toLowerCase() !== email.toLowerCase());
    if (newStaff.length !== staffMembers.length) {
      await doc.ref.update({ staffMembers: newStaff });
      affectedBusinesses++;
    }
  }
  return affectedBusinesses;
}

// Helper: Cancel all bookings and classes for user
async function cancelUserBookingsAndClasses(userId: string, email: string) {
  let cancelledBookings = 0;
  let cancelledClasses = 0;
  // Cancel bookings
  const bookingsSnapshot = await adminDb.collection("bookings").where("userId", "==", userId).get();
  for (const doc of bookingsSnapshot.docs) {
    await doc.ref.update({ status: "cancelled", cancelledAt: new Date() });
    cancelledBookings++;
  }
  // Cancel classes where user is instructor/host
  const classesSnapshot = await adminDb.collection("classes").where("instructorEmail", "==", email).get();
  for (const doc of classesSnapshot.docs) {
    await doc.ref.update({ status: "cancelled", cancelledAt: new Date() });
    cancelledClasses++;
  }
  return { cancelledBookings, cancelledClasses };
}

export async function POST(req: Request) {
  try {
    const { userId, email, confirm } = await req.json();
    if (!userId || !email) {
      return NextResponse.json({ error: "Missing userId or email" }, { status: 400 });
    }
    // TODO: Add admin/owner auth check here

    // 1. Check for bookings/classes (for warning)
    const bookingsSnapshot = await adminDb.collection("bookings").where("userId", "==", userId).get();
    const classesSnapshot = await adminDb.collection("classes").where("instructorEmail", "==", email).get();
    const bookingsCount = bookingsSnapshot.size;
    const classesCount = classesSnapshot.size;
    if (!confirm) {
      // Just return what would be deleted
      return NextResponse.json({ bookingsCount, classesCount });
    }

    // 2. Delete from Firebase Auth
    try {
      await adminAuth.deleteUser(userId);
    } catch (e) {
      // If user doesn't exist in Auth, ignore
    }

    // 3. Delete user document
    await adminDb.collection("users").doc(userId).delete();

    // 4. Remove from all businesses
    const affectedBusinesses = await removeFromAllBusinesses(email);

    // 5. Cancel bookings/classes
    const { cancelledBookings, cancelledClasses } = await cancelUserBookingsAndClasses(userId, email);

    return NextResponse.json({
      success: true,
      deletedUserId: userId,
      deletedEmail: email,
      affectedBusinesses,
      cancelledBookings,
      cancelledClasses,
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
} 