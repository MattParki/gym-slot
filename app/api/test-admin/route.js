// app/api/test-admin/route.js
import { NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase-admin";

export async function GET() {
  try {
    console.log("Testing Firebase Admin SDK...");
    
    // Test 1: Check if adminDb is available
    console.log("✓ adminDb available:", !!adminDb);
    console.log("✓ adminAuth available:", !!adminAuth);
    
    // Test 2: Try to access a collection (should work with Admin SDK)
    const testRef = adminDb.collection("test");
    console.log("✓ Can create collection reference");
    
    // Test 3: Try to list collections (Admin-only operation)
    const collections = await adminDb.listCollections();
    console.log("✓ Can list collections:", collections.map(c => c.id));
    
    // Test 4: Try to read from users collection
    const usersRef = adminDb.collection("users");
    const snapshot = await usersRef.limit(1).get();
    console.log("✓ Can read from users collection, found documents:", snapshot.size);
    
    return NextResponse.json({
      success: true,
      message: "Firebase Admin SDK is working correctly",
      tests: {
        adminDbAvailable: !!adminDb,
        adminAuthAvailable: !!adminAuth,
        canCreateReference: true,
        collectionsCount: collections.length,
        canReadUsers: true,
        userDocsFound: snapshot.size
      }
    });
    
  } catch (error) {
    console.error("Firebase Admin test failed:", error);
    return NextResponse.json({
      success: false,
      error: error.message,
      code: error.code,
      details: error.details
    }, { status: 500 });
  }
} 