import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

// Helper functions for role display
function getRoleDisplayName(role: string): string {
  const roleMap: { [key: string]: string } = {
    staff: "staff member",
    personal_trainer: "Personal Trainer",
    administrator: "Administrator", 
    manager: "Manager",
    receptionist: "Receptionist",
    member: "member"
  };
  return roleMap[role] || role.replace(/_/g, ' ');
}

function isStaffRole(role: string): boolean {
  const staffRoles = ['staff', 'personal_trainer', 'administrator', 'manager', 'receptionist'];
  return staffRoles.includes(role);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, businessId, businessName, role = "staff", customerName, membershipPlan } = body;

    if (!email || !businessId || !businessName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create the invitation link with business ID, email, and role
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const inviteLink = `${baseUrl}/signup?businessId=${businessId}&email=${encodeURIComponent(email)}&role=${role}`;

    const transporter = nodemailer.createTransport({
      host: process.env.MAILTRAP_HOST,
      port: parseInt(process.env.MAILTRAP_PORT || "587"),
      secure: false,
      auth: {
        user: process.env.MAILTRAP_USER,
        pass: process.env.MAILTRAP_PASS,
      },
    });

    // Generate different email content based on role
    const isCustomer = role === "customer";
    const subject = isCustomer 
      ? `Welcome to ${businessName} - Create Your Account to Book Classes`
      : `You're invited to join ${businessName}`;
    
    const emailHtml = isCustomer ? `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to ${businessName}!</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">
            Your membership is ready - Create your account to start booking
          </p>
        </div>
        
        <div style="background: white; padding: 40px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb;">
          ${customerName ? `<p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            Hi <strong>${customerName}</strong>,
          </p>` : ''}
          
          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            You've been added as a member of <strong>${businessName}</strong>! ${membershipPlan ? `Your membership plan is <strong>${membershipPlan}</strong>.` : ''}
          </p>
          
          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
            Create your account to download the GymSlot mobile app and start booking classes:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${inviteLink}" 
               style="background: #10b981; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
              Create Account & Book Classes
            </a>
          </div>
          
          <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0;">
            <p style="color: #166534; margin: 0; font-weight: 500; font-size: 14px;">
              📱 After creating your account, download the GymSlot mobile app on iOS or Android to book classes, view schedules, and manage your membership on the go!
            </p>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="${inviteLink}" style="color: #10b981; word-break: break-all;">${inviteLink}</a>
          </p>
        </div>
      </div>
    ` : `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <div style="background: linear-gradient(135deg, #141E33 0%, #1a2442 100%); padding: 40px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">You're Invited!</h1>
          <p style="color: rgba(255,255,255,0.8); margin: 10px 0 0 0; font-size: 16px;">
            Join ${businessName} on Gym Slot
          </p>
        </div>
        
        <div style="background: white; padding: 40px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb;">
          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            You've been invited to join <strong>${businessName}</strong> as a ${getRoleDisplayName(role)} on Gym Slot.
          </p>
          
          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
            Click the button below to create your account and access the admin dashboard!
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${inviteLink}" 
               style="background: #141E33; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
              Accept Invitation
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="${inviteLink}" style="color: #141E33; word-break: break-all;">${inviteLink}</a>
          </p>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"${businessName}" <noreply@gym-slot.com>`,
      to: email,
      subject: subject,
      html: emailHtml,
    });

    return NextResponse.json({ 
      message: "Invitation sent successfully",
      success: true 
    });

  } catch (error) {
    console.error("Failed to send invitation:", error);
    return NextResponse.json(
      { error: "Failed to send invitation" },
      { status: 500 }
    );
  }
}
