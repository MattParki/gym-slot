// app/api/create-account/route.js
import { NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase-admin";

// Helper function to send welcome email to new gym owners
async function sendWelcomeEmail(email) {
  try {
    console.log(`Sending welcome email to new gym owner: ${email}`);
    
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://gym-slot.com";
    const loginUrl = `${baseUrl}/login`;
    
    console.log(`Using baseUrl: ${baseUrl}`);
    console.log(`Email API URL: ${baseUrl}/api/send-email`);
    
    const response = await fetch(`${baseUrl}/api/send-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "noreply@gym-slot.com",
        to: email,
        subject: "Welcome to GymSlot! 🎉 Your gym management platform is ready",
        html: `
          <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
            <div style="background: linear-gradient(135deg, #141E33 0%, #1a2442 100%); padding: 40px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 32px;">Welcome to GymSlot! 🎉</h1>
              <p style="color: rgba(255,255,255,0.8); margin: 10px 0 0 0; font-size: 18px;">
                Your gym management platform is ready
              </p>
            </div>
            
            <div style="background: white; padding: 40px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb;">
              <h2 style="color: #141E33; margin: 0 0 20px 0; font-size: 24px;">Congratulations on joining GymSlot!</h2>
              
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                You've successfully created your gym management account. Here's what you can do next:
              </p>
              
              <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #141E33; margin: 0 0 15px 0; font-size: 18px;">🚀 Get Started:</h3>
                <ul style="color: #374151; margin: 0; padding-left: 20px;">
                  <li style="margin-bottom: 8px;">Set up your gym profile and business information</li>
                  <li style="margin-bottom: 8px;">Add your staff members and assign roles</li>
                  <li style="margin-bottom: 8px;">Create your class schedule and manage bookings</li>
                  <li style="margin-bottom: 8px;">Invite gym members to join your platform</li>
                </ul>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${loginUrl}" 
                   style="background: #141E33; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; font-size: 16px;">
                  Access Your Dashboard
                </a>
              </div>
              
              <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0;">
                <p style="color: #065f46; margin: 0; font-weight: 500;">
                  💡 Pro Tip: Start by setting up your gym profile in Account Settings to customize your experience!
                </p>
              </div>
              
              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0; text-align: center;">
                Need help getting started? Reply to this email and we'll be happy to assist you.
              </p>
            </div>
          </div>
        `,
        text: `
Welcome to GymSlot! 🎉

Congratulations on joining GymSlot! You've successfully created your gym management account.

Here's what you can do next:
• Set up your gym profile and business information
• Add your staff members and assign roles
• Create your class schedule and manage bookings
• Invite gym members to join your platform

Access your dashboard: ${loginUrl}

Need help getting started? Reply to this email and we'll be happy to assist you.
        `,
        userId: "system",
      }),
    });

    console.log(`Email API response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to send welcome email to ${email}:`, errorText);
      console.error(`Response status: ${response.status}, Response headers:`, response.headers);
      // Don't throw error - account creation should succeed even if email fails
      return false;
    }

    const emailResult = await response.json();
    console.log(`✅ Welcome email sent successfully to ${email}:`, emailResult);
    return true;
  } catch (error) {
    console.error(`Error sending welcome email to ${email}:`, error);
    console.error(`Error details:`, error.message, error.stack);
    // Don't throw error - account creation should succeed even if email fails
    return false;
  }
}

export async function POST(req) {
  try {
    console.log("Received request to create account");

    const authHeader = req.headers.get("authorization");
    console.log("Authorization Header:", authHeader);

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const idToken = authHeader.split("Bearer ")[1];
    const body = await req.json();
    const { businessId, role } = body;

    try {
      console.log("Verifying ID token...");
      const decodedToken = await adminAuth.verifyIdToken(idToken);
      const uid = decodedToken.uid;
      const email = decodedToken.email;

      console.log(`Processing account creation for user: ${email} (${uid})`);
      console.log("Admin SDK initialized:", !!adminDb);

      try {
        const batch = adminDb.batch();
        const userProfileRef = adminDb.collection("users").doc(uid);

        console.log("User Profile Ref:", userProfileRef);
        console.log("Attempting to get user profile document...");

        const userProfileDoc = await userProfileRef.get();
        console.log("Successfully retrieved user profile document");
        
        const now = new Date();

        if (businessId) {
          // User is joining an existing business
          console.log(`User joining existing business: ${businessId}`);
          const businessRef = adminDb.collection("businesses").doc(businessId);
          const businessDoc = await businessRef.get();

          if (!businessDoc.exists) {
            return NextResponse.json(
              { error: "Business not found" },
              { status: 404 }
            );
          }

          const userRole = role || "customer"; // Default to customer if no role specified
          console.log(`Adding user ${email} to business ${businessId} with role: ${userRole}`);

          const businessData = businessDoc.data();
          const existingStaff = businessData.staffMembers || [];
          const existingMembers = businessData.members || [];

          // Check if user already exists in either array
          const existsInStaff = existingStaff.some(member => member.email === email);
          const existsInMembers = existingMembers.some(member => member.email === email);

          // Add user to appropriate array based on role (only if they don't already exist)
          if (!existsInStaff && !existsInMembers) {
            if (userRole === "staff" || userRole === "personal_trainer" || userRole === "administrator" || userRole === "manager" || userRole === "receptionist") {
              // Add as staff member
              console.log(`➕ Adding ${email} as staff member with role: ${userRole}`);
              batch.update(businessRef, {
                staffMembers: adminDb.FieldValue.arrayUnion({
                  id: uid,
                  email: email,
                  role: userRole,
                  joinedAt: now.toISOString(),
                  status: "active"
                }),
                updatedAt: now
              });
            } else {
              // Add as gym customer/member
              console.log(`➕ Adding ${email} as gym customer`);
              batch.update(businessRef, {
                members: adminDb.FieldValue.arrayUnion({
                  id: uid,
                  email: email,
                  role: "customer",
                  joinedAt: now.toISOString(),
                  status: "active"
                }),
                updatedAt: now
              });
            }
          } else {
            console.log(`⚠️ User ${email} already exists in business. Staff: ${existsInStaff}, Members: ${existsInMembers} - skipping business array update`);
          }

          // ALWAYS create user profile (regardless of business array existence)
          console.log(`Creating user profile for ${email} with role: ${userRole}`);
          if (userProfileDoc.exists) {
            console.log(`Updating existing user profile for ${email}`);
            
            // Get existing profile data to handle multiple businesses
            const existingData = userProfileDoc.data();
            const existingBusinessIds = existingData.businessIds || [];
            
            // Add new businessId if not already present
            let updatedBusinessIds = [...existingBusinessIds];
            if (!updatedBusinessIds.includes(businessId)) {
              updatedBusinessIds.push(businessId);
              console.log(`➕ Adding business ${businessId} to user ${email}. Total businesses: ${updatedBusinessIds.length}`);
            } else {
              console.log(`⚠️ User ${email} already has business ${businessId} in their profile`);
            }
            
            batch.update(userProfileRef, {
              email: email,
              updatedAt: now,
              businessIds: updatedBusinessIds,
              role: userRole,
              // Keep backwards compatibility
              businessId: businessId,
            });
          } else {
            console.log(`Creating new user profile for ${email}`);
            batch.set(userProfileRef, {
              email: email,
              createdAt: now,
              updatedAt: now,
              businessIds: [businessId], // Initialize with array containing this business
              role: userRole,
              displayName: email.split('@')[0],
              onboardingCompleted: false,
              // Additional fields for staff members to fill out
              firstName: "",
              lastName: "",
              phone: "",
              profilePicture: "",
              bio: "",
              specialties: [],
              certifications: [],
              // Profile completion status
              profileCompleted: false,
              // Keep backwards compatibility
              businessId: businessId,
            });
          }
          console.log(`✅ User profile setup completed for ${email}`);
        } else {
          // Create new business (demo account)
          console.log(`Creating new business for gym owner: ${email}`);
          const newBusinessId = uid;
          const businessRef = adminDb.collection("businesses").doc(newBusinessId);
          
          console.log("Checking if business already exists...");
          const businessDoc = await businessRef.get();

          if (businessDoc.exists) {
            return NextResponse.json(
              { error: "Business already exists for this user" },
              { status: 400 }
            );
          }

          console.log("Creating new business document...");
          // Create new business
          batch.set(businessRef, {
            email: email,
            createdAt: now,
            updatedAt: now,
            owners: [uid],
            members: [],
          });

          // Create user profile as owner
          console.log("Creating user profile as owner...");
          if (userProfileDoc.exists) {
            // Get existing profile data to handle multiple businesses
            const existingData = userProfileDoc.data();
            const existingBusinessIds = existingData.businessIds || [];
            
            // Add new businessId if not already present
            let updatedBusinessIds = [...existingBusinessIds];
            if (!updatedBusinessIds.includes(newBusinessId)) {
              updatedBusinessIds.push(newBusinessId);
              console.log(`➕ Adding owned business ${newBusinessId} to user ${email}. Total businesses: ${updatedBusinessIds.length}`);
            }
            
            batch.update(userProfileRef, {
              email: email,
              updatedAt: now,
              businessIds: updatedBusinessIds,
              role: 'owner',
              // Keep backwards compatibility
              businessId: newBusinessId,
            });
          } else {
            batch.set(userProfileRef, {
              email: email,
              createdAt: now,
              updatedAt: now,
              businessIds: [newBusinessId], // Initialize with array containing this business
              role: 'owner',
              displayName: email.split('@')[0],
              onboardingCompleted: false,
              // Keep backwards compatibility
              businessId: newBusinessId,
            });
          }
        }

        // Commit the batch transaction
        console.log("Committing batch transaction...");
        console.log("Batch operations to be committed:", batch._ops?.length || "unknown");
        
        try {
          await batch.commit();
          console.log(`✅ Batch transaction committed successfully for ${email}`);
          
          // Verify user profile was created
          const verifyUserDoc = await userProfileRef.get();
          if (verifyUserDoc.exists) {
            console.log(`✅ User profile verification successful for ${email}:`, verifyUserDoc.data());
          } else {
            console.log(`❌ User profile verification failed for ${email} - document does not exist`);
          }
          
        } catch (batchError) {
          console.error(`❌ Batch transaction failed for ${email}:`, batchError);
          throw batchError;
        }
        
        console.log(`✅ Account created successfully for ${email}`);

        // Send welcome email to new gym owners (not to users joining existing businesses)
        if (!businessId) {
          console.log(`Sending welcome email to new gym owner: ${email}`);
          const emailSent = await sendWelcomeEmail(email);
          if (!emailSent) {
            console.log(`⚠️ Welcome email failed to send to ${email}, but account creation was successful`);
          }
        }

        return NextResponse.json({
          success: true,
          message: "Account created successfully"
        });

      } catch (firestoreError) {
        console.error("Firestore operation error:", firestoreError);
        console.error("Firestore error details:", firestoreError.message);
        return NextResponse.json(
          { error: `Database operation failed: ${firestoreError.message}` },
          { status: 500 }
        );
      }

    } catch (error) {
      console.error("Authentication error:", error);
      return NextResponse.json(
        { error: "Authentication failed" },
        { status: 401 }
      );
    }

  } catch (error) {
    console.error("Failed to create account:", error);
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    );
  }
}