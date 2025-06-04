import { db } from '@/lib/firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';

const SENT_EMAILS_COLLECTION = 'sentEmails';
const PROPOSALS_COLLECTION = 'proposals';
const CLIENTS_COLLECTION = 'clients';

export async function sendBusinessInvite({
  to,
  businessId,
  inviterId,
}: {
  to: string;
  businessId: string;
  inviterId: string;
}) {
  const subject = "You've been invited to join a business on ProspectsEasy";
  const inviteLink = `https://demo.prospectseasy.com/signup?businessId=${businessId}&email=${encodeURIComponent(to)}`;

  const html = `
    <div>
      <h2>You're Invited</h2>
      <p>You have been invited to join a business on <strong>ProspectsEasy</strong>.</p>
      <p>Click the link below to sign up and automatically join the business:</p>
      <a href="${inviteLink}" target="_blank" style="padding: 10px 20px; background-color: #2563EB; color: white; text-decoration: none; border-radius: 4px;">Join Now</a>
    </div>
  `;

  const res = await fetch("/api/send-email", {
    method: "POST",
    body: JSON.stringify({
      from: "no-reply@prospectseasy.com",
      to,
      subject,
      text: `You've been invited to join a business on ProspectsEasy. Sign up here: ${inviteLink}`,
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


export async function markEmailAsResponded(emailId: string, customDate?: Date): Promise<void> {
  const emailRef = doc(db, SENT_EMAILS_COLLECTION, emailId);
  const emailSnap = await getDoc(emailRef);

  if (!emailSnap.exists()) {
    throw new Error("Email not found");
  }

  const emailData = emailSnap.data();
  const proposalId = emailData.proposalId;

  const respondedAt = customDate ? customDate.getTime() : Date.now();

  // 1. Mark email as responded
  await updateDoc(emailRef, {
    responded: true,
    respondedAt
  });

  if (!proposalId) return;

  // 2. Update proposal's clientStatus to 'prospect'
  const proposalRef = doc(db, PROPOSALS_COLLECTION, proposalId);
  const proposalSnap = await getDoc(proposalRef);

  if (proposalSnap.exists()) {
    await updateDoc(proposalRef, {
      clientStatus: "prospect"
    });

    const proposalData = proposalSnap.data();
    const clientId = proposalData.clientId;

    // 3. Update client's status to 'prospect'
    if (clientId) {
      const clientRef = doc(db, CLIENTS_COLLECTION, clientId);
      await updateDoc(clientRef, {
        status: "prospect"
      });
    }
  }
}
