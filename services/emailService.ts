import { db } from '@/lib/firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';

const SENT_EMAILS_COLLECTION = 'sentEmails';
const BOOKINGS_COLLECTION = 'bookings';
const MEMBERS_COLLECTION = 'members';

export async function sendBusinessInvite({
  to,
  businessId,
  inviterId,
}: {
  to: string;
  businessId: string;
  inviterId: string;
}) {
  const subject = "You've been invited to join a gym on Gym Slot";
  const inviteLink = `https://www.gym-slot.com/signup?businessId=${businessId}&email=${encodeURIComponent(to)}`;

  const html = `
    <div>
      <h2>You're Invited</h2>
      <p>You have been invited to join a gym on <strong>Gym Slot</strong>.</p>
      <p>Click the link below to sign up and automatically join the gym:</p>
      <a href="${inviteLink}" target="_blank" style="padding: 10px 20px; background-color: #2563EB; color: white; text-decoration: none; border-radius: 4px;">Join Now</a>
    </div>
  `;

  const res = await fetch("/api/send-email", {
    method: "POST",
    body: JSON.stringify({
      from: "no-reply@gym-slot.com",
      to,
      subject,
      text: `You've been invited to join a gym on Gym Slot. Sign up here: ${inviteLink}`,
      html,
      userId: inviterId,
      meta: {
        businessId,
        invitation: true,
      },
    }),
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Failed to send invitation email");
  }
}

// Optionally, update this function if you want to use gym-related collections
export async function markEmailAsResponded(emailId: string, customDate?: Date): Promise<void> {
  const emailRef = doc(db, SENT_EMAILS_COLLECTION, emailId);
  const emailSnap = await getDoc(emailRef);

  if (!emailSnap.exists()) {
    throw new Error("Email not found");
  }

  const emailData = emailSnap.data();
  const bookingId = emailData.bookingId;

  const respondedAt = customDate ? customDate.getTime() : Date.now();

  // 1. Mark email as responded
  await updateDoc(emailRef, {
    responded: true,
    respondedAt
  });

  if (!bookingId) return;

  // 2. Update booking's memberStatus to 'active'
  const bookingRef = doc(db, BOOKINGS_COLLECTION, bookingId);
  const bookingSnap = await getDoc(bookingRef);

  if (bookingSnap.exists()) {
    await updateDoc(bookingRef, {
      memberStatus: "active"
    });

    const bookingData = bookingSnap.data();
    const memberId = bookingData.memberId;

    // 3. Update member's status to 'active'
    if (memberId) {
      const memberRef = doc(db, MEMBERS_COLLECTION, memberId);
      await updateDoc(memberRef, {
        status: "active"
      });
    }
  }
}