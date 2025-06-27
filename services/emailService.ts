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

  console.debug('[sendBusinessInvite] Sending invite', { to, businessId, inviterId, inviteLink });

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
    console.error('[sendBusinessInvite] Failed to send email', data);
    throw new Error(data.error || "Failed to send invitation email");
  }

  console.debug('[sendBusinessInvite] Email sent successfully', { to });
}

// Optionally, update this function if you want to use gym-related collections
export async function markEmailAsResponded(emailId: string, customDate?: Date): Promise<void> {
  console.debug('[markEmailAsResponded] Called with', { emailId, customDate });

  const emailRef = doc(db, SENT_EMAILS_COLLECTION, emailId);
  const emailSnap = await getDoc(emailRef);

  if (!emailSnap.exists()) {
    console.error('[markEmailAsResponded] Email not found', { emailId });
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
  console.debug('[markEmailAsResponded] Marked email as responded', { emailId, respondedAt });

  if (!bookingId) {
    console.debug('[markEmailAsResponded] No bookingId found, exiting', { emailId });
    return;
  }

  // 2. Update booking's memberStatus to 'active'
  const bookingRef = doc(db, BOOKINGS_COLLECTION, bookingId);
  const bookingSnap = await getDoc(bookingRef);

  if (bookingSnap.exists()) {
    await updateDoc(bookingRef, {
      memberStatus: "active"
    });
    console.debug('[markEmailAsResponded] Updated booking memberStatus to active', { bookingId });

    const bookingData = bookingSnap.data();
    const memberId = bookingData.memberId;

    // 3. Update member's status to 'active'
    if (memberId) {
      const memberRef = doc(db, MEMBERS_COLLECTION, memberId);
      await updateDoc(memberRef, {
        status: "active"
      });
      console.debug('[markEmailAsResponded] Updated member status to active', { memberId });
    } else {
      console.debug('[markEmailAsResponded] No memberId found in booking', { bookingId });
    }
  } else {
    console.debug('[markEmailAsResponded] Booking not found', { bookingId });
  }
}