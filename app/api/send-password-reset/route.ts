import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    console.log(`Attempting to send password reset for: ${email}`);

    // Check if user exists in Firebase Auth first
    let userExists = false;
    try {
      await adminAuth.getUserByEmail(email);
      userExists = true;
      console.log(`User ${email} exists in Firebase Auth`);
    } catch (error: any) {
      console.log(`User ${email} does not exist in Firebase Auth:`, error.code);
      if (error.code === 'auth/user-not-found') {
        // User hasn't completed signup yet
        return NextResponse.json(
          { error: "User must complete account setup before password reset. Please check the original invitation email or contact your administrator." },
          { status: 400 }
        );
      }
      throw error; // Re-throw if it's a different error
    }

    // Generate password reset link using Firebase Admin
    const link = await adminAuth.generatePasswordResetLink(email);
    console.log(`Generated password reset link for ${email}`);

    // Check if we're in development mode or email service is not configured
    const isDevelopment = process.env.NODE_ENV === 'development';
    const hasEmailConfig = process.env.MAILTRAP_HOST && process.env.MAILTRAP_USER && process.env.MAILTRAP_PASS;

    if (isDevelopment && !hasEmailConfig) {
      // In development without email config, just log the link
      console.log('='.repeat(80));
      console.log('🔐 PASSWORD RESET LINK (Development Mode)');
      console.log('='.repeat(80));
      console.log(`Email: ${email}`);
      console.log(`Reset Link: ${link}`);
      console.log('='.repeat(80));
      console.log('Copy the above link and open it in a browser to reset the password.');
      console.log('='.repeat(80));

      return NextResponse.json({ 
        success: true,
        message: "Password reset link generated (check server console in development mode)",
        devMode: true,
        resetLink: link // Only include in development
      });
    }

    // Send email with the reset link
    console.log(`Sending password reset email to ${email}`);
    const emailApiUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/send-email`;
    console.log(`Email API URL: ${emailApiUrl}`);
    
    const response = await fetch(emailApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "noreply@gym-slot.com",
        to: email,
        subject: "Reset Your GymSlot Password",
        html: `
          <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
            <div style="background: linear-gradient(135deg, #141E33 0%, #1a2442 100%); padding: 40px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Reset Your Password</h1>
              <p style="color: rgba(255,255,255,0.8); margin: 10px 0 0 0; font-size: 16px;">
                GymSlot Account Recovery
              </p>
            </div>
            
            <div style="background: white; padding: 40px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb;">
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                You requested to reset your password for your GymSlot account.
              </p>
              
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                Click the button below to reset your password:
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${link}" 
                   style="background: #141E33; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
                  Reset Password
                </a>
              </div>
              
              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
                If you didn't request this password reset, you can safely ignore this email.
              </p>
              
              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 10px 0 0 0;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="${link}" style="color: #141E33; word-break: break-all;">${link}</a>
              </p>
            </div>
          </div>
        `,
        text: `
Reset Your GymSlot Password

You requested to reset your password for your GymSlot account.

Click the link below to reset your password:
${link}

If you didn't request this password reset, you can safely ignore this email.
        `,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Email API error (${response.status}):`, errorText);
      
      // Check for specific email configuration errors
      if (errorText.includes('MAILTRAP') || errorText.includes('authentication') || response.status === 401) {
        throw new Error("Email service is not configured. Please set up email environment variables or contact your system administrator.");
      }
      
      throw new Error(`Failed to send email: ${response.status} - ${errorText}`);
    }

    const emailResult = await response.json();
    console.log(`Email sent successfully:`, emailResult);

    return NextResponse.json({ 
      success: true,
      message: "Password reset email sent successfully"
    });

  } catch (error: any) {
    console.error("Password reset error:", error);
    
    // Return more specific error messages
    let errorMessage = "Failed to send password reset email";
    if (error.code === 'auth/user-not-found') {
      errorMessage = "User not found. Please check the email address.";
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 